import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import * as XLSX from "xlsx";
import { RfcValidatorService } from "./services/rfc-validator";
import { ExpenseCategorizer } from "./services/expense-categorizer";
import { satMassDownloadService } from "./services/sat-mass-download";
import { CFDIProcessorService } from './services/cfdi-processor';
import { DeclarationsService } from './services/declarations-service';
import { UserService } from './services/user-service';
import { PostgresStorage } from './storage';
import { 
  insertVehicleSchema,
  insertDriverSchema,
  insertMaintenanceRecordSchema,
  insertExpenseSchema,
  insertDriverDocumentSchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  insertTaxReportSchema,
  insertSupplierSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Initialize RFC validator service
  const rfcValidator = new RfcValidatorService();
  
  // Initialize services
  const userService = new UserService((storage as PostgresStorage).pool);

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    }),
    fileFilter: (req, file, cb) => {
      // Allow PDF, images, Excel, CSV, ZIP, XML and SAT certs
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv',
        'application/csv',
        'application/zip',
        'application/x-zip-compressed',
        // XML files for CFDI
        'text/xml',
        'application/xml',
        // SAT credentials
        'application/x-x509-ca-cert', // .cer (varía por SO)
        'application/octet-stream' // .key (genérico)
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten PDF, imágenes (JPG/PNG/WebP), Excel (.xlsx/.xls), CSV, XML, ZIP y archivos .cer/.key'));
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });

  // Invoices: seed demo via GET (conveniencia con query params)
  app.get('/api/invoices/seed-demo', async (req, res) => {
    try {
      const { period, count } = req.query as { period?: string; count?: string };
      if (!period || !/^\d{4}-\d{2}$/.test(String(period))) {
        return res.status(400).json({ message: 'Parámetro period inválido. Formato esperado YYYY-MM' });
      }
      const n = Number(count || 5);
      const resp = await fetch('http://127.0.0.1:8080/api/invoices/seed-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, count: n }),
      }).then(r => r.json()).catch(() => null);
      if (!resp) return res.status(500).json({ message: 'No se pudo ejecutar seed interno' });
      res.json(resp);
    } catch (error) {
      console.error('Error GET seed demo:', error);
      res.status(500).json({ message: 'Error en seed-demo', error: String(error) });
    }
  });

  // Healthcheck simple
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
  });

  // Invoices: seed demo data for a given period (YYYY-MM)
  app.post('/api/invoices/seed-demo', async (req, res) => {
    try {
      const { period = '', count = 5 } = req.body || {};
      if (!/^\d{4}-\d{2}$/.test(String(period))) {
        return res.status(400).json({ message: 'Parámetro period inválido. Formato esperado YYYY-MM' });
      }
      const [yy, mm] = String(period).split('-').map(Number);
      const makeDate = (day: number) => new Date(Date.UTC(yy, mm - 1, day, 12, 0, 0));

      const cfg = readRuntimeConfig();
      const userRfc = (cfg.userRfc || process.env.USER_RFC || 'XAXX010101000').toUpperCase();

      const created: any[] = [];
      for (let i = 0; i < Number(count) ; i++) {
        const day = (i % 28) + 1;
        const dir = i % 2 === 0 ? 'issued' : 'received';
        const base = 1000 + i * 100;
        const subtotal = String(base.toFixed(2));
        const tax = String((base * 0.16).toFixed(2));
        const total = String((base * 1.16).toFixed(2));
        const emitterRfc = dir === 'issued' ? userRfc : 'EKU9003173C9';
        const receptorRfc = dir === 'issued' ? 'EKU9003173C9' : userRfc;

        const inv = await storage.createInvoice({
          folio: `DEMO-${period}-${i+1}`,
          uuid: null,
          series: null,
          clientRfc: receptorRfc,
          clientName: dir === 'issued' ? 'CLIENTE DEMO' : 'YO DEMO',
          clientAddress: null,
          subtotal,
          tax,
          total,
          currency: 'MXN',
          paymentMethod: '01',
          paymentForm: 'PUE',
          cfdiUse: 'G03',
          status: 'sent',
          xmlPath: null,
          pdfPath: null,
          issueDate: makeDate(day),
          dueDate: null,
        } as any, []);
        created.push(inv);
      }

      res.json({ ok: true, inserted: created.length, period });
    } catch (error) {
      console.error('Error seeding demo invoices:', error);
      res.status(500).json({ message: 'Error seeding', error: String(error) });
    }
  });

  // Workpapers: generate from invoices for a given period (YYYY-MM)
  app.get('/api/workpapers/generate', async (req, res) => {
    try {
      const { period } = req.query as { period?: string };
      if (!period || !/^\d{4}-\d{2}$/.test(period)) {
        return res.status(400).json({ message: 'Parámetro period inválido. Formato esperado YYYY-MM' });
      }
      const [y, m] = period.split('-').map(Number);
      const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
      const end = new Date(Date.UTC(y, m, 0, 23, 59, 59));

      const cfg = readRuntimeConfig();
      const userRfc = (cfg.userRfc || process.env.USER_RFC || '').toUpperCase();

      const invoices = await storage.getInvoices();
      const inMonth = invoices.filter(inv => {
        const d = new Date(inv.issueDate as any);
        return !isNaN(d.getTime()) && d >= start && d <= end;
      });

      const rows = inMonth.map(inv => {
        const clientRfc = String((inv as any).clientRfc || '').toUpperCase();
        const direction: 'issued' | 'received' = userRfc && clientRfc === userRfc ? 'received' : 'issued';
        const emitterRfc = direction === 'issued' ? userRfc || 'XAXX010101000' : 'DESCONOCIDO';
        const receiverRfc = direction === 'issued' ? clientRfc : (userRfc || 'XAXX010101000');
        return {
          date: new Date(inv.issueDate as any).toISOString(),
          direction,
          emitterRfc,
          receiverRfc,
          uuid: (inv as any).uuid || null,
          concept: (inv as any).concept || (inv as any).clientName || null,
          subtotal: Number((inv as any).subtotal || 0),
          tax: Number((inv as any).tax || 0),
          total: Number((inv as any).total || 0),
          category: null,
        };
      });

      res.json({ period, rows });
    } catch (error) {
      console.error('Error generando papel de trabajo:', error);
      res.status(500).json({ message: 'Error generando papel de trabajo', error: String(error) });
    }
  });

  // Invoices: quick stats (verify ZIP import impact)
  app.get('/api/invoices/stats', async (req, res) => {
    try {
      const { year, month } = req.query as { year?: string; month?: string };
      const invoices = await storage.getInvoices();
      let filtered = invoices;
      if (year) {
        filtered = filtered.filter(inv => {
          const d = new Date(inv.issueDate as any);
          return !isNaN(d.getTime()) && d.getFullYear() === Number(year);
        });
      }
      if (month) {
        filtered = filtered.filter(inv => {
          const d = new Date(inv.issueDate as any);
          return !isNaN(d.getTime()) && (d.getMonth() + 1) === Number(month);
        });
      }

      const total = filtered.length;
      const sum = (arr: any[], key: string) => arr.reduce((a, b) => a + Number(b?.[key] || 0), 0);
      const totalAmount = sum(filtered, 'total');
      const subtotalAmount = sum(filtered, 'subtotal');
      const taxAmount = sum(filtered, 'tax');

      res.json({ total, subtotalAmount, taxAmount, totalAmount });
    } catch (error) {
      console.error('Error getting invoice stats:', error);
      res.status(500).json({ message: 'Error obteniendo estadísticas', error: String(error) });
    }
  });

  // Workpapers: periods by year (multi-year support based on invoices.issueDate)
  app.get('/api/workpapers/periods', async (req, res) => {
    try {
      const { year } = req.query as { year?: string };
      const invoices = await storage.getInvoices();
      const map = new Map<number, Set<number>>(); // year -> months set
      for (const inv of invoices) {
        const d = new Date(inv.issueDate as any);
        if (isNaN(d.getTime())) continue;
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        if (!map.has(y)) map.set(y, new Set());
        map.get(y)!.add(m);
      }
      if (year) {
        const y = Number(year);
        const months = Array.from(map.get(y) || []).sort((a, b) => a - b);
        return res.json({ year: y, months });
      }
      const years = Array.from(map.keys()).sort((a, b) => a - b);
      res.json({ years: years.map(y => ({ year: y, months: Array.from(map.get(y)!).sort((a,b)=>a-b) })) });
    } catch (error) {
      console.error('Error getting workpaper periods:', error);
      res.status(500).json({ message: 'Error obteniendo periodos', error: String(error) });
    }
  });

  // Workpapers: provide a base template (Ramon Gzzz Uriegas-like)
  app.get('/api/workpapers/template', async (req, res) => {
    try {
      const name = (req.query?.name as string | undefined)?.toLowerCase() || 'default';
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const iso = `${yyyy}-${mm}-${dd}T00:00:00.000Z`;

      const baseRows = [
        {
          date: iso,
          direction: 'issued',
          emitterRfc: process.env.USER_RFC || 'XAXX010101000',
          receiverRfc: 'XAXX010101000',
          uuid: null,
          concept: 'SERVICIOS PROFESIONALES',
          subtotal: 1000,
          tax: 160,
          total: 1160,
          category: 'SERVICIOS',
        },
        {
          date: iso,
          direction: 'received',
          emitterRfc: 'EKU9003173C9',
          receiverRfc: process.env.USER_RFC || 'XAXX010101000',
          uuid: null,
          concept: 'COMPRA INSUMOS',
          subtotal: 500,
          tax: 80,
          total: 580,
          category: 'INSUMOS',
        },
      ];

      // Si se pide el template "ramon" u otro alias, podríamos ajustar conceptos/categorías
      if (name.includes('ramon')) {
        baseRows[0].concept = 'SERVICIO TRANSPORTE - RAMON GZZZ URIEGAS';
        baseRows[1].concept = 'GASOLINA - RAMON GZZZ URIEGAS';
      }

      res.json({
        columns: ['date','direction','emitterRfc','receiverRfc','uuid','concept','subtotal','tax','total','category'],
        sample: baseRows,
        notes: 'Puedes agregar/quitar renglones. Formato de fecha ISO o reconocible por JS. direction: issued/received.',
      });
    } catch (error) {
      console.error('Error getting workpaper template:', error);
      res.status(500).json({ message: 'Error obteniendo plantilla', error: String(error) });
    }
  });

  // Importar ZIP del SAT (descarga masiva): extrae XML y crea facturas
  app.post("/api/invoices/import-zip", upload.array('files', 20), async (req, res) => {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      if (files.length === 0) {
        return res.status(400).json({ message: 'No se recibieron ZIPs' });
      }

      const parseXml = (xml: string) => {
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
      };

      const unzipper = await import('unzipper');
      const created: any[] = [];

      for (const zip of files) {
        try {
          const dir = await unzipper.Open.file(zip.path);
          for (const entry of dir.files) {
            if (!entry.path.toLowerCase().endsWith('.xml')) continue;
            const content = await entry.buffer();
            const xml = content.toString('utf8');
            if (!xml.includes('TimbreFiscalDigital')) continue; // filtro rápido

            const data = parseXml(xml);
            const insert = {
              folio: data.uuid || path.parse(entry.path).name,
              uuid: data.uuid || null,
              series: null,
              clientRfc: data.receptorRfc || '',
              clientName: data.receptorNombre || '',
              clientAddress: null,
              subtotal: data.subtotal || '0',
              tax: (Number(data.total) - Number(data.subtotal)).toFixed(2),
              total: data.total || '0',
              currency: data.moneda || 'MXN',
              paymentMethod: data.metodoPago || '',
              paymentForm: data.formaPago || '',
              cfdiUse: data.cfdiUse || '',
              status: 'sent',
              xmlPath: null,
              pdfPath: null,
              issueDate: new Date(data.fecha),
              dueDate: null,
            } as any;

            const inv = await storage.createInvoice(insert, []);
            created.push(inv);
          }
        } finally {
          // Limpieza: eliminar el ZIP subido
          try { fs.existsSync(zip.path) && fs.unlinkSync(zip.path); } catch {}
        }
      }

      res.json({ imported: created.length });
    } catch (error) {
      console.error('Error importando ZIP SAT:', error);
      res.status(500).json({ message: 'Error al importar ZIP del SAT', error: String(error) });
    }
  });

  // SAT: Descarga masiva (SOAP) - inicia job persistente
  app.post("/api/sat/download", upload.fields([
    { name: 'cer', maxCount: 1 },
    { name: 'key', maxCount: 1 },
  ]), async (req, res) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const cer = files?.cer?.[0];
      const key = files?.key?.[0];
      const { password, type, dateStart, dateEnd } = req.body as Record<string, string>;

      if (!cer || !key || !password || !type || !dateStart || !dateEnd) {
        return res.status(400).json({ message: 'Campos requeridos: cer, key, password, type (issued|received), dateStart (YYYY-MM-DD), dateEnd (YYYY-MM-DD)' });
      }
      const rfc = (process.env.USER_RFC || '').toUpperCase();
      if (!rfc) return res.status(400).json({ message: 'Configura USER_RFC en el backend para continuar.' });

      const { jobId } = await satMassDownloadService.startJob({
        rfc,
        type: type === 'received' ? 'received' : 'issued',
        dateStart,
        dateEnd,
        cerPath: cer.path,
        keyPath: key.path,
        password,
      });

      return res.json({ ok: true, jobId });
    } catch (error) {
      console.error('SAT download error:', error);
      res.status(500).json({ message: 'Error en descarga SAT', error: String(error) });
    }
  });

  // SAT: estado del job
  app.get('/api/sat/download/status', async (req, res) => {
    try {
      const { id } = req.query as { id?: string };
      if (!id) return res.status(400).json({ message: 'Parámetro id es requerido' });
      const status = await satMassDownloadService.getStatus(id);
      if (!status) return res.status(404).json({ message: 'Job no encontrado' });
      res.json(status);
    } catch (error) {
      console.error('SAT status error:', error);
      res.status(500).json({ message: 'Error obteniendo estado del job', error: String(error) });
    }
  });

  // Workpapers: import from Excel/CSV
  app.post("/api/workpapers/import", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'Archivo no recibido' });

      const wb = XLSX.readFile(req.file.path);
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: null });

      const userRfc = (process.env.USER_RFC || '').toUpperCase();

      const normalize = (s: string) => s
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().trim();

      const mapRow = (row: Record<string, any>) => {
        const entries = Object.entries(row).map(([k, v]) => [normalize(String(k)), v]) as [string, any][];
        const get = (...keys: string[]) => {
          for (const k of keys) {
            const hit = entries.find(([kk]) => kk.includes(k));
            if (hit) return hit[1];
          }
          return null;
        };

        const fechaRaw = get('fecha', 'fecha de emision', 'fecha emision', 'fech');
        const emisor = (get('emisor', 'rfc emisor', 'rfcemisor', 'emisor rfc') || '').toString().toUpperCase();
        const receptor = (get('receptor', 'rfc receptor', 'rfcreceptor', 'receptor rfc') || '').toString().toUpperCase();
        const uuid = (get('uuid', 'folio fiscal') || null) as string | null;
        const concepto = (get('concepto', 'descripcion') || null) as string | null;
        const subtotal = Number(get('subtotal', 'sub total') || 0) || 0;
        const iva = Number(get('iva', 'impuesto', 'iva trasladado') || 0) || 0;
        const total = Number(get('total') || subtotal + iva) || 0;
        let direction: 'issued' | 'received' = 'issued';
        if (userRfc && receptor === userRfc) direction = 'received';

        // fecha a ISO (YYYY-MM-DD)
        let dateStr = new Date().toISOString();
        if (fechaRaw) {
          const d = new Date(fechaRaw);
          if (!isNaN(d.getTime())) {
            dateStr = d.toISOString();
          }
        }

        return {
          date: dateStr,
          direction,
          emitterRfc: emisor,
          receiverRfc: receptor,
          uuid,
          concept: concepto,
          subtotal,
          tax: iva,
          total,
          category: null,
        };
      };

      const rows = json.map(mapRow);
      let period: string | null = null;
      const firstDate = rows.find(r => r.date)?.date;
      if (firstDate) {
        const d = new Date(firstDate);
        if (!isNaN(d.getTime())) {
          period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
      }

      res.json({ period, rows });
    } catch (error) {
      console.error('Error importando papel de trabajo:', error);
      res.status(500).json({ message: 'Error al importar papel de trabajo', error: String(error) });
    }
  });

  // Workpapers: commit to Tax Report (draft)
  app.post("/api/workpapers/commit", async (req, res) => {
    try {
      const { period, rows } = req.body as { period: string; rows: Array<any> };
      if (!period || !Array.isArray(rows)) {
        return res.status(400).json({ message: 'period y rows son requeridos' });
      }

      const sum = (arr: any[], key: string) => arr.reduce((a, b) => a + Number(b?.[key] || 0), 0);
      const issued = rows.filter(r => r.direction === 'issued');
      const received = rows.filter(r => r.direction === 'received');

      const totalIncome = sum(issued, 'total');
      const totalExpenses = sum(received, 'total');
      const deductibleExpenses = sum(received, 'subtotal');
      const taxableIncome = Math.max(totalIncome - deductibleExpenses, 0);
      const taxOwed = taxableIncome * 0.16; // estimado simple (puedes ajustar la fórmula)

      const report = await storage.createTaxReport({
        reportType: 'monthly',
        period,
        totalIncome: String(totalIncome.toFixed(2)),
        totalExpenses: String(totalExpenses.toFixed(2)),
        deductibleExpenses: String(deductibleExpenses.toFixed(2)),
        taxableIncome: String(taxableIncome.toFixed(2)),
        taxOwed: String(taxOwed.toFixed(2)),
        status: 'draft',
        filePath: null,
      } as any);

      res.json({ ok: true, report });
    } catch (error) {
      console.error('Error al consolidar papel de trabajo:', error);
      res.status(500).json({ message: 'Error al consolidar papel de trabajo', error: String(error) });
    }
  });

  // CFDI Processing: Process XML files and generate fiscal reports
  app.post("/api/cfdi/process", upload.any(), async (req, res) => {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      const { userRfc } = req.body;

      if (files.length === 0) {
        return res.status(400).json({ message: 'No se recibieron archivos CFDI' });
      }

      // Crear directorio temporal para procesamiento
      const tempDir = path.join(uploadsDir, `cfdi_temp_${Date.now()}`);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Mover archivos al directorio temporal
      for (const file of files) {
        const destPath = path.join(tempDir, file.originalname);
        fs.renameSync(file.path, destPath);
      }

      // Procesar archivos CFDI
      const cedulaData = await cfdiProcessor.processCFDIFiles(tempDir, userRfc);

      // Limpiar directorio temporal
      fs.rmSync(tempDir, { recursive: true, force: true });

      res.json({ 
        success: true, 
        data: cedulaData,
        message: `Procesados ${cedulaData.ingresos.length + cedulaData.gastos.length} registros CFDI`
      });
    } catch (error) {
      console.error('Error procesando CFDI:', error);
      res.status(500).json({ 
        message: 'Error procesando archivos CFDI', 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // CFDI Processing: Generate annual work paper
  app.post("/api/cfdi/generate-papel-trabajo", async (req, res) => {
    try {
      const { cedulaData, year } = req.body;

      if (!cedulaData) {
        return res.status(400).json({ message: 'Datos de cédula requeridos' });
      }

      const papelTrabajoPath = await cfdiProcessor.generatePapelTrabajo(
        cedulaData, 
        year || new Date().getFullYear()
      );

      // Generar URL para descarga
      const filename = path.basename(papelTrabajoPath);
      const downloadUrl = `/uploads/${filename}`;

      res.json({ 
        success: true, 
        downloadUrl,
        filename,
        message: 'Papel de trabajo generado exitosamente'
      });
    } catch (error) {
      console.error('Error generando papel de trabajo:', error);
      res.status(500).json({ 
        message: 'Error generando papel de trabajo', 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // CFDI Processing: Process retentions (Uber, Didi, etc.)
  app.post("/api/cfdi/process-retenciones", upload.array('files', 20), async (req, res) => {
    try {
      const files = (req.files as Express.Multer.File[]) || [];

      if (files.length === 0) {
        return res.status(400).json({ message: 'No se recibieron archivos de retenciones' });
      }

      // Crear directorio temporal
      const tempDir = path.join(uploadsDir, `retenciones_temp_${Date.now()}`);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Mover archivos
      for (const file of files) {
        const destPath = path.join(tempDir, file.originalname);
        fs.renameSync(file.path, destPath);
      }

      // Procesar retenciones
      const retencionesData = await cfdiProcessor.processRetenciones(tempDir);

      // Limpiar directorio temporal
      fs.rmSync(tempDir, { recursive: true, force: true });

      res.json({ 
        success: true, 
        data: retencionesData,
        message: `Procesadas ${Array.isArray(retencionesData) ? retencionesData.length : 0} retenciones`
      });
    } catch (error) {
      console.error('Error procesando retenciones:', error);
      res.status(500).json({ 
        message: 'Error procesando retenciones', 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // CFDI Processing: Validate CFDI structure
  app.post("/api/cfdi/validate", async (req, res) => {
    try {
      const { directory } = req.body;

      if (!directory) {
        return res.status(400).json({ message: 'Directorio requerido' });
      }

      const validation = await cfdiProcessor.validateCFDIStructure(directory);

      res.json(validation);
    } catch (error) {
      console.error('Error validando estructura CFDI:', error);
      res.status(500).json({ 
        message: 'Error validando estructura CFDI', 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Public config (frontend can read RFC para distinguir emitidas/recibidas)
  // Guardamos en uploads para que persista con el volumen
  const runtimeConfigPath = path.join(uploadsDir, "runtime-config.json");
  const readRuntimeConfig = (): { userRfc?: string | null } => {
    try {
      if (fs.existsSync(runtimeConfigPath)) {
        const raw = fs.readFileSync(runtimeConfigPath, "utf8");
        const json = JSON.parse(raw);
        return { userRfc: json.userRfc || null };
      }
    } catch (e) {
      console.error("Error leyendo runtime-config.json:", e);
    }
    return { userRfc: process.env.USER_RFC || null };
  };
  const writeRuntimeConfig = (cfg: { userRfc?: string | null }) => {
    try {
      const dir = path.dirname(runtimeConfigPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(runtimeConfigPath, JSON.stringify(cfg, null, 2), "utf8");
      return true;
    } catch (e) {
      console.error("Error escribiendo runtime-config.json:", e);
      return false;
    }
  };

  app.get("/api/config", (_req, res) => {
    const cfg = readRuntimeConfig();
    res.json({ userRfc: cfg.userRfc || null });
  });

  app.post("/api/config", async (req, res) => {
    try {
      const { userRfc } = req.body as { userRfc?: string };
      if (!userRfc) return res.status(400).json({ message: "userRfc es requerido" });
      const rfc = String(userRfc).toUpperCase().trim();
      // Validación básica de RFC (personas físicas o morales MX, sin homoclave estricta)
      const rfcRegex = /^(?:[A-ZÑ&]{3,4})\d{6}[A-Z0-9]{2,3}$/i;
      if (!rfcRegex.test(rfc)) return res.status(400).json({ message: "RFC inválido" });
      const ok = writeRuntimeConfig({ userRfc: rfc });
      if (!ok) return res.status(500).json({ message: "No se pudo guardar configuración" });
      res.json({ ok: true, userRfc: rfc });
    } catch (error) {
      console.error("Error guardando config:", error);
      res.status(500).json({ message: "Error guardando configuración", error: String(error) });
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo" });
    }
    
    res.json({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size
    });
  });

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    const filePath = path.join(uploadsDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "Archivo no encontrado" });
    }
  });
  // Vehicles routes
  app.get("/api/vehicles", async (req, res) => {
    const vehicles = await storage.getVehicles();
    res.json(vehicles);
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    const vehicle = await storage.getVehicle(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehículo no encontrado" });
    }
    res.json(vehicle);
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const validatedData = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(validatedData);
      res.status(201).json(vehicle);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  app.put("/api/vehicles/:id", async (req, res) => {
    try {
      const validatedData = insertVehicleSchema.partial().parse(req.body);
      const vehicle = await storage.updateVehicle(req.params.id, validatedData);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehículo no encontrado" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    const deleted = await storage.deleteVehicle(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Vehículo no encontrado" });
    }
    res.status(204).send();
  });

  // Drivers routes
  app.get("/api/drivers", async (req, res) => {
    const drivers = await storage.getDrivers();
    res.json(drivers);
  });

  app.get("/api/drivers/:id", async (req, res) => {
    const driver = await storage.getDriver(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: "Conductor no encontrado" });
    }
    res.json(driver);
  });

  app.post("/api/drivers", async (req, res) => {
    try {
      const validatedData = insertDriverSchema.parse(req.body);
      const driver = await storage.createDriver(validatedData);
      res.status(201).json(driver);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  app.put("/api/drivers/:id", async (req, res) => {
    try {
      const validatedData = insertDriverSchema.partial().parse(req.body);
      const driver = await storage.updateDriver(req.params.id, validatedData);
      if (!driver) {
        return res.status(404).json({ message: "Conductor no encontrado" });
      }
      res.json(driver);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  app.delete("/api/drivers/:id", async (req, res) => {
    const deleted = await storage.deleteDriver(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Conductor no encontrado" });
    }
    res.status(204).send();
  });

  // Maintenance records routes
  app.get("/api/maintenance", async (req, res) => {
    const { vehicleId } = req.query;
    if (vehicleId) {
      const records = await storage.getMaintenanceRecordsByVehicle(vehicleId as string);
      res.json(records);
    } else {
      const records = await storage.getMaintenanceRecords();
      res.json(records);
    }
  });

  app.post("/api/maintenance", async (req, res) => {
    try {
      const validatedData = insertMaintenanceRecordSchema.parse(req.body);
      const record = await storage.createMaintenanceRecord(validatedData);
      res.status(201).json(record);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  app.put("/api/maintenance/:id", async (req, res) => {
    try {
      const validatedData = insertMaintenanceRecordSchema.partial().parse(req.body);
      const record = await storage.updateMaintenanceRecord(req.params.id, validatedData);
      if (!record) {
        return res.status(404).json({ message: "Registro de mantenimiento no encontrado" });
      }
      res.json(record);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  app.delete("/api/maintenance/:id", async (req, res) => {
    const deleted = await storage.deleteMaintenanceRecord(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Registro de mantenimiento no encontrado" });
    }
    res.status(204).send();
  });

  // Expenses routes
  app.get("/api/expenses", async (req, res) => {
    const { vehicleId } = req.query;
    if (vehicleId) {
      const expenses = await storage.getExpensesByVehicle(vehicleId as string);
      res.json(expenses);
    } else {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.partial().parse(req.body);
      const expense = await storage.updateExpense(req.params.id, validatedData);
      if (!expense) {
        return res.status(404).json({ message: "Gasto no encontrado" });
      }
      res.json(expense);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    const deleted = await storage.deleteExpense(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Gasto no encontrado" });
    }
    res.status(204).send();
  });

  // Driver documents routes
  app.get("/api/driver-documents", async (req, res) => {
    const { driverId } = req.query;
    if (driverId) {
      const documents = await storage.getDriverDocumentsByDriver(driverId as string);
      res.json(documents);
    } else {
      const documents = await storage.getDriverDocuments();
      res.json(documents);
    }
  });

  app.post("/api/driver-documents", async (req, res) => {
    try {
      const validatedData = insertDriverDocumentSchema.parse(req.body);
      const document = await storage.createDriverDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  app.put("/api/driver-documents/:id", async (req, res) => {
    try {
      const validatedData = insertDriverDocumentSchema.partial().parse(req.body);
      const document = await storage.updateDriverDocument(req.params.id, validatedData);
      if (!document) {
        return res.status(404).json({ message: "Documento no encontrado" });
      }
      res.json(document);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  app.delete("/api/driver-documents/:id", async (req, res) => {
    const deleted = await storage.deleteDriverDocument(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Documento no encontrado" });
    }
    res.status(204).send();
  });

  // Invoices routes
  app.get("/api/invoices", async (req, res) => {
    const invoices = await storage.getInvoices();
    res.json(invoices);
  });

  app.get("/api/invoices/:id", async (req, res) => {
    const invoice = await storage.getInvoice(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Factura no encontrada" });
    }
    const items = await storage.getInvoiceItems(req.params.id);
    res.json({ ...invoice, items });
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const { items, ...invoiceData } = req.body;
      const validatedData = insertInvoiceSchema.parse(invoiceData);
      const invoice = await storage.createInvoice(validatedData, items);
      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  // Tax reports routes
  app.get("/api/tax-reports", async (req, res) => {
    const reports = await storage.getTaxReports();
    res.json(reports);
  });

  app.post("/api/tax-reports", async (req, res) => {
    try {
      const validatedData = insertTaxReportSchema.parse(req.body);
      const report = await storage.createTaxReport(validatedData);
      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  // Suppliers routes
  app.get("/api/suppliers", async (req, res) => {
    const suppliers = await storage.getSuppliers();
    res.json(suppliers);
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    const supplier = await storage.updateSupplier(req.params.id, req.body);
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    res.json(supplier);
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    const success = await storage.deleteSupplier(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    res.json({ success: true });
  });

  // RFC Validation endpoints
  app.post("/api/rfc/validate", async (req, res) => {
    try {
      const { rfc } = req.body;
      if (!rfc) {
        return res.status(400).json({ error: "RFC is required" });
      }
      
      const result = await rfcValidator.validateRfc(rfc);
      res.json(result);
    } catch (error) {
      console.error("Error validating RFC:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/validate-rfc-batch", async (req, res) => {
    try {
      const { rfcs } = req.body;
      if (!Array.isArray(rfcs)) {
        return res.status(400).json({ message: "Se requiere un array de RFCs" });
      }
      const results = await rfcValidator.validateRfcBatch(rfcs);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Error al validar RFCs", error });
    }
  });

  app.post("/api/fiscal-data", async (req, res) => {
    try {
      const { identifier } = req.body;
      if (!identifier) {
        return res.status(400).json({ message: "RFC o CURP es requerido" });
      }
      const result = await rfcValidator.getFiscalData(identifier);
      const vehicles = await storage.getVehicles();
      const drivers = await storage.getDrivers();
      const expenses = await storage.getExpenses();
      const maintenanceRecords = await storage.getMaintenanceRecords();

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyExpenses = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        })
        .reduce((total, expense) => total + parseFloat(expense.amount || "0"), 0);

      const pendingMaintenance = maintenanceRecords.filter(record => 
        record.status === "pending" || record.status === "overdue"
      ).length;

      const overdueMaintenance = maintenanceRecords.filter(record => 
        record.status === "overdue"
      ).length;

      const activeVehicles = vehicles.filter(vehicle => vehicle.status === "active").length;
      const maintenanceVehicles = vehicles.filter(vehicle => vehicle.status === "maintenance").length;
      const outOfServiceVehicles = vehicles.filter(vehicle => vehicle.status === "out_of_service").length;
      const activeDrivers = drivers.filter(driver => driver.status === "active").length;

      const stats = {
        totalVehicles: vehicles.length,
        activeVehicles,
        maintenanceVehicles,
        outOfServiceVehicles,
        activeDrivers,
        monthlyExpenses,
        pendingMaintenance,
        overdueMaintenance,
        availability: vehicles.length > 0 ? (activeVehicles / vehicles.length) * 100 : 0
      };

      // Responder una sola vez con datos SAT y estadísticas
      res.json({ sat: result, stats });
    } catch (error) {
      res.status(500).json({ message: "Error al obtener estadísticas", error });
    }
  });

  // Initialize services
  const cfdiProcessor = new CFDIProcessorService();
  const declarationsService = new DeclarationsService();

  // Declarations routes
  app.post("/api/declarations/upload", upload.single('pdf'), async (req, res) => {
    try {
      const { tipo, periodo, estado } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "Archivo PDF requerido" });
      }

      if (!tipo || !periodo || !estado) {
        return res.status(400).json({ message: "Tipo, periodo y estado son requeridos" });
      }

      const declaration = await declarationsService.saveDeclaration({
        periodo,
        tipo,
        estado,
        archivo: file.filename
      });

      res.json({ success: true, declaration });
    } catch (error) {
      console.error('Error uploading declaration:', error);
      res.status(500).json({ message: "Error al subir declaración", error });
    }
  });

  app.get("/api/declarations", async (req, res) => {
    try {
      const declarations = await declarationsService.getDeclarations();
      res.json(declarations);
    } catch (error) {
      console.error('Error getting declarations:', error);
      res.status(500).json({ message: "Error al obtener declaraciones", error });
    }
  });

  app.get("/api/declarations/inconsistencies", async (req, res) => {
    try {
      // Get CFDI data from processed files or use empty array for now
      const cfdiData: any[] = [];
      
      const inconsistencies = await declarationsService.detectInconsistencies(cfdiData);
      res.json(inconsistencies);
    } catch (error) {
      console.error('Error detecting inconsistencies:', error);
      res.status(500).json({ message: "Error al detectar inconsistencias", error });
    }
  });

  app.get("/api/declarations/file/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const fileBuffer = await declarationsService.getDeclarationFile(filename);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(fileBuffer);
    } catch (error) {
      console.error('Error getting declaration file:', error);
      res.status(404).json({ message: "Archivo no encontrado" });
    }
  });

  // User authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { nombre, rfc, password } = req.body;
      
      if (!nombre || !rfc || !password) {
        return res.status(400).json({ message: "Todos los campos son requeridos" });
      }

      const user = await userService.createUser({ nombre, rfc, password });
      res.status(201).json({ 
        message: "Usuario creado exitosamente",
        user: { id: user.id, nombre: user.nombre, rfc: user.rfc }
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { rfc, password } = req.body;
      
      if (!rfc || !password) {
        return res.status(400).json({ message: "RFC y contraseña son requeridos" });
      }

      const user = await userService.authenticateUser({ rfc, password });
      
      if (!user) {
        return res.status(401).json({ message: "RFC o contraseña incorrectos" });
      }

      res.json({ 
        message: "Login exitoso",
        user: { id: user.id, nombre: user.nombre, rfc: user.rfc }
      });
    } catch (error: any) {
      console.error('Error during login:', error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/auth/users", async (req, res) => {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (error: any) {
      console.error('Error getting users:', error);
      res.status(500).json({ message: "Error al obtener usuarios" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
