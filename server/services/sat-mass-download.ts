import fs from "fs";
import { storage } from "../storage";
import * as XLSX from "xlsx"; // solo para reutilizar parse si fuera necesario en el futuro

export type SatDownloadParams = {
  rfc: string;
  type: "issued" | "received";
  dateStart: string; // YYYY-MM-DD
  dateEnd: string;   // YYYY-MM-DD
  cerPath: string;
  keyPath: string;
  password: string;
};

// Cliente SOAP (PLACEHOLDER). Sustituir implementaciones con el consumo real del SAT.
class SatSoapClient {
  private wsdl = {
    auth: process.env.SAT_WSDL_AUTH || "",
    request: process.env.SAT_WSDL_REQUEST || "",
    verify: process.env.SAT_WSDL_VERIFY || "",
    download: process.env.SAT_WSDL_DOWNLOAD || "",
  };
  constructor(private params: SatDownloadParams) {}

  async authenticate(): Promise<void> {
    // TODO: firmar con .cer/.key + password, construir sello y headers requeridos
  }

  async requestPackages(): Promise<{ requestId: string; countEstimated: number }> {
    // TODO: invocar solicitud al SAT
    return { requestId: `REQ-${Date.now()}`, countEstimated: 1 };
  }

  async pollAvailability(_requestId: string): Promise<string[]> {
    // TODO: consultar disponibilidad; devolver ids de paquetes
    return [`PKG-${Date.now()}`];
  }

  async downloadPackage(_packageId: string): Promise<Buffer> {
    // TODO: descargar paquete ZIP real desde SAT
    // Por ahora devolvemos un ZIP vacío (estructura placeholder)
    return Buffer.from([]);
  }
}

export class SatMassDownloadService {
  async startJob(params: SatDownloadParams): Promise<{ jobId: string }> {
    const job = await storage.createSatJob({
      rfc: params.rfc,
      type: params.type,
      dateStart: params.dateStart as any,
      dateEnd: params.dateEnd as any,
      status: "queued",
      requestedPackages: 0,
      availablePackages: 0,
      downloadedPackages: 0,
      importedXml: 0,
      errorMessage: null,
    } as any);

    await storage.addSatLog({ jobId: job.id, level: "info", message: `SAT job creado para ${params.rfc} (${params.type}) ${params.dateStart}..${params.dateEnd}` });
    await storage.updateSatJob(job.id, { status: "running", startedAt: new Date() } as any);

    // Disparar workflow en background (no bloqueante)
    setImmediate(() => this.runWorkflow(job.id, params).catch(async (e) => {
      await storage.updateSatJob(job.id, { status: "error", errorMessage: String(e), finishedAt: new Date() } as any);
      await storage.addSatLog({ jobId: job.id, level: "error", message: `Fallo en workflow: ${String(e)}` });
      // Limpieza de archivos subidos
      this.safeUnlink(params.cerPath);
      this.safeUnlink(params.keyPath);
    }));

    return { jobId: job.id };
  }

  private async runWorkflow(jobId: string, params: SatDownloadParams) {
    const client = new SatSoapClient(params);
    await storage.addSatLog({ jobId, level: "info", message: "Autenticando con e.firma..." });
    await client.authenticate();

    await storage.addSatLog({ jobId, level: "info", message: "Solicitando paquetes al SAT..." });
    const { requestId, countEstimated } = await client.requestPackages();
    await storage.updateSatJob(jobId, { requestedPackages: countEstimated } as any);

    await storage.addSatLog({ jobId, level: "info", message: `Haciendo polling de disponibilidad (requestId=${requestId})...` });
    const packageIds = await client.pollAvailability(requestId);
    await storage.updateSatJob(jobId, { availablePackages: packageIds.length } as any);

    for (const pkgId of packageIds) {
      const pkg = await storage.createSatPackage({
        jobId,
        satPackageId: pkgId,
        status: "downloading",
      } as any);

      await storage.addSatLog({ jobId, level: "info", message: `Descargando paquete ${pkgId}...` });
      const zipBuffer = await client.downloadPackage(pkgId);

      // Guardar zip temporalmente en memoria/disco opcional (omitir persistir largo plazo)
      const zipPath = zipBuffer.length ? `/tmp/${pkgId}.zip` : null;
      if (zipPath) fs.writeFileSync(zipPath, zipBuffer);
      await storage.updateSatPackage(pkg.id, { status: "downloaded", zipPath: zipPath || null, downloadedAt: new Date() } as any);

      // Extraer XMLs; con unzipper si hay contenido real
      const xmls: { name: string; content: string }[] = [];
      // TODO: si zipBuffer tiene contenido real, extraer y llenar xmls[]

      await storage.addSatLog({ jobId, level: "info", message: `Importando ${xmls.length} XML(s) del paquete ${pkgId}...` });
      let importedCount = 0;
      for (const x of xmls) {
        try {
          const parsed = this.parseXml(x.content);
          const insert = {
            folio: parsed.uuid || x.name.replace(/\.xml$/i, ""),
            uuid: parsed.uuid || null,
            series: null,
            clientRfc: parsed.receptorRfc || "",
            clientName: parsed.receptorNombre || "",
            clientAddress: null,
            subtotal: parsed.subtotal || "0",
            tax: (Number(parsed.total) - Number(parsed.subtotal)).toFixed(2),
            total: parsed.total || "0",
            currency: parsed.moneda || "MXN",
            paymentMethod: parsed.metodoPago || "",
            paymentForm: parsed.formaPago || "",
            cfdiUse: parsed.cfdiUse || "",
            status: "sent",
            xmlPath: null,
            pdfPath: null,
            issueDate: new Date(parsed.fecha),
            dueDate: null,
          } as any;

          await storage.createInvoice(insert, []);
          importedCount += 1;
        } catch (e) {
          await storage.addSatLog({ jobId, level: "warn", message: `Error importando XML: ${String(e)}` });
        }
      }

      // Actualiza contadores de job
      const job = await storage.getSatJob(jobId);
      const newImported = (job?.importedXml || 0) + importedCount;
      const newDownloaded = (job?.downloadedPackages || 0) + 1;
      await storage.updateSatJob(jobId, { importedXml: newImported, downloadedPackages: newDownloaded } as any);
    }

    await storage.updateSatJob(jobId, { status: "done", finishedAt: new Date() } as any);
    await storage.addSatLog({ jobId, level: "info", message: "Proceso completado." });

    // Limpieza de archivos subidos
    this.safeUnlink(params.cerPath);
    this.safeUnlink(params.keyPath);
  }

  async getStatus(jobId: string) {
    const job = await storage.getSatJob(jobId);
    if (!job) return null;
    const packages = await storage.listSatPackagesByJob(jobId);
    const logs = await storage.listSatLogs(jobId, 200);
    return {
      job,
      counts: {
        requested: job.requestedPackages || 0,
        available: job.availablePackages || 0,
        downloaded: job.downloadedPackages || 0,
        imported: job.importedXml || 0,
      },
      packages,
      logs,
    };
  }

  private parseXml(xml: string) {
    const getAttr = (tagRegex: RegExp, attr: string) => {
      const m = tagRegex.exec(xml);
      if (!m) return null;
      const tag = m[0];
      const attrRegex = new RegExp(`${attr}="([^"]+)"`, 'i');
      const am = attrRegex.exec(tag);
      return am ? am[1] : null;
    };
    const comprobanteTag = /<([a-zA-Z0-9:]*Comprobante)[^>]*>/i;
    const emisorTag = /<([a-zA-Z0-9:]*Emisor)[^>]*>/i;
    const receptorTag = /<([a-zA-Z0-9:]*Receptor)[^>]*>/i;
    const tfdTag = /<([a-zA-Z0-9:]*TimbreFiscalDigital)[^>]*>/i;

    const total = getAttr(comprobanteTag, 'Total') || getAttr(comprobanteTag, 'total') || '0';
    const subtotal = getAttr(comprobanteTag, 'SubTotal') || getAttr(comprobanteTag, 'subTotal') || '0';
    const moneda = getAttr(comprobanteTag, 'Moneda') || 'MXN';
    const formaPago = getAttr(comprobanteTag, 'FormaPago') || '';
    const metodoPago = getAttr(comprobanteTag, 'MetodoPago') || '';
    const fecha = getAttr(comprobanteTag, 'Fecha') || new Date().toISOString();
    const cfdiUse = getAttr(receptorTag, 'UsoCFDI') || '';

    const emisorRfc = (getAttr(emisorTag, 'Rfc') || '').toUpperCase();
    const emisorNombre = getAttr(emisorTag, 'Nombre') || '';
    const receptorRfc = (getAttr(receptorTag, 'Rfc') || '').toUpperCase();
    const receptorNombre = getAttr(receptorTag, 'Nombre') || '';
    const uuid = getAttr(tfdTag, 'UUID') || '';

    return {
      total,
      subtotal,
      moneda,
      formaPago,
      metodoPago,
      fecha,
      cfdiUse,
      emisorRfc,
      emisorNombre,
      receptorRfc,
      receptorNombre,
      uuid,
    };
  }

  private safeUnlink(p?: string) {
    if (!p) return;
    try { fs.existsSync(p) && fs.unlinkSync(p); } catch { /* ignore */ }
  }
}

export const satMassDownloadService = new SatMassDownloadService();
