import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, AlertCircle, Download, CheckCircle, Calculator, Receipt, FileCheck, AlertTriangle, Calendar, CheckSquare, Lock, Crown } from "lucide-react";
import Page from "@/components/layout/page";

interface UserSubscriptionInfo {
  subscription: any;
  plan: any;
  canGenerateMonthly: boolean;
  canGenerateAnnual: boolean;
  monthlyReportsRemaining: number;
  annualReportsRemaining: number;
}

interface WorkpaperRow {
  date: string;
  direction: "issued" | "received";
  emitterRfc: string;
  receiverRfc: string;
  uuid?: string | null;
  concept?: string | null;
  subtotal: number;
  tax: number;
  total: number;
  category?: string | null; // ingreso/egreso u otras
}

interface ImportResponse {
  period: string | null;
  rows: WorkpaperRow[];
}

interface CFDIProcessResponse {
  success: boolean;
  data: {
    ingresos: any[];
    gastos: any[];
    retenciones?: any[];
    totalesMensuales: any[];
    calculoISR: any[];
    resumenAnual: {
      totalIngresos: number;
      totalGastos: number;
      totalIVACausado: number;
      totalIVARetenido: number;
      isrAnual: number;
    };
  };
  message: string;
}

export default function Workpapers() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [workpaperData, setWorkpaperData] = useState<WorkpaperRow[]>([]);
  const [period, setPeriod] = useState<string | null>(null);
  const [processedData, setProcessedData] = useState<CFDIProcessResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("upload");
  const [userSubscriptionInfo, setUserSubscriptionInfo] = useState<UserSubscriptionInfo | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [rows, setRows] = useState<WorkpaperRow[]>([]);
  const [preview, setPreview] = useState<NonNullable<{
    count: number;
    issued: { subtotal: number; tax: number; total: number };
    received: { subtotal: number; tax: number; total: number };
    overall: { subtotal: number; tax: number; total: number };
  }> | null>(null);
  const [years, setYears] = useState<{ year: number; months: number[] }[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | "">("");
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | "">("");
  const [cedulaData, setCedulaData] = useState<CFDIProcessResponse['data'] | null>(null);
  const [userRfc, setUserRfc] = useState(() => localStorage.getItem("userRfc") || "");
  const [showArchive, setShowArchive] = useState(false);
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [inconsistencies, setInconsistencies] = useState<any[]>([]);
  const [declarationForm, setDeclarationForm] = useState({
    tipo: '',
    ano: '',
    mes: '',
    estado: ''
  });
  const uploaderRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLInputElement>(null);
  const cfdiUploaderRef = useRef<HTMLInputElement>(null);
  const retencionesUploaderRef = useRef<HTMLInputElement>(null);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/workpapers/import", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as ImportResponse;
    },
    onSuccess: (data) => {
      setRows(data.rows);
      if (data.period) setPeriod(data.period);
    },
  });

  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/workpapers/preview", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as NonNullable<typeof preview>;
    },
    onSuccess: (data) => setPreview(data),
  });

  // Load multi-year periods
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/workpapers/periods", { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          setYears(json.years || []);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (selectedYear === "") {
      setAvailableMonths([]);
      return;
    }
    const y = years.find((yy) => yy.year === selectedYear);
    setAvailableMonths(y?.months || []);
  }, [selectedYear, years]);

  const totals = useMemo(() => {
    const issued = rows.filter(r => r.direction === "issued");
    const received = rows.filter(r => r.direction === "received");
    const sum = (arr: WorkpaperRow[], key: keyof WorkpaperRow) => arr.reduce((a, b) => a + Number(b[key] || 0), 0);
    return {
      issuedSubtotal: sum(issued, "subtotal"),
      issuedTax: sum(issued, "tax"),
      issuedTotal: sum(issued, "total"),
      receivedSubtotal: sum(received, "subtotal"),
      receivedTax: sum(received, "tax"),
      receivedTotal: sum(received, "total"),
      netIncome: sum(issued, "total") - sum(received, "total"),
    };
  }, [rows]);

  const commitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/workpapers/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period, rows }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
  });

  const cfdiProcessMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const form = new FormData();
      files.forEach(file => form.append("files", file));
      const currentUserRfc = localStorage.getItem("userRfc");
      if (currentUserRfc) form.append("userRfc", currentUserRfc);
      
      const res = await fetch("/api/cfdi/process", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as CFDIProcessResponse;
    },
    onSuccess: (data) => {
      setCedulaData(data.data);
      // Convert CFDI data to workpaper rows
      const cfdiRows: WorkpaperRow[] = [
        ...data.data.ingresos.map((ing: any) => ({
          date: ing.fecha || new Date().toISOString(),
          direction: "issued" as const,
          emitterRfc: ing.rfcEmisor || "",
          receiverRfc: ing.rfcReceptor || "",
          uuid: ing.uuid || null,
          concept: ing.concepto || null,
          subtotal: Number(ing.subtotal || 0),
          tax: Number(ing.iva || 0),
          total: Number(ing.total || 0),
          category: "ingreso",
        })),
        ...data.data.gastos.map((gasto: any) => ({
          date: gasto.fecha || new Date().toISOString(),
          direction: "received" as const,
          emitterRfc: gasto.rfcEmisor || "",
          receiverRfc: gasto.rfcReceptor || "",
          uuid: gasto.uuid || null,
          concept: gasto.concepto || null,
          subtotal: Number(gasto.subtotal || 0),
          tax: Number(gasto.iva || 0),
          total: Number(gasto.total || 0),
          category: "egreso",
        }))
      ];
      setRows(cfdiRows);
    },
  });

  const generatePapelTrabajoMutation = useMutation({
    mutationFn: async (year?: number) => {
      const res = await fetch("/api/cfdi/generate-papel-trabajo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          cedulaData, 
          year: year || new Date().getFullYear() 
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
  });

  const retencionesProcessMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const form = new FormData();
      files.forEach(file => form.append("files", file));
      const currentUserRfc = localStorage.getItem("userRfc");
      if (currentUserRfc) form.append("userRfc", currentUserRfc);
      
      const res = await fetch("/api/cfdi/process-retenciones", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as CFDIProcessResponse;
    },
  });

  // Mutations for declarations
  const uploadDeclarationMutation = useMutation({
    mutationFn: async ({ file, formData }: { file: File; formData: any }) => {
      const form = new FormData();
      form.append('pdf', file);
      form.append('tipo', formData.tipo);
      form.append('periodo', `${formData.ano}-${formData.mes.padStart(2, '0')}`);
      form.append('estado', formData.estado);
      
      const res = await fetch("/api/declarations/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    onSuccess: () => {
      // Reset form 
      setDeclarationForm({ tipo: '', ano: '', mes: '', estado: '' });
      loadDeclarations();
    }
  });

  const loadDeclarations = async () => {
    try {
      const res = await fetch("/api/declarations", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setDeclarations(data);
      }
    } catch (error) {
      console.error('Error loading declarations:', error);
    }
  };

  const loadInconsistencies = async () => {
    try {
      const res = await fetch("/api/declarations/inconsistencies", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setInconsistencies(data);
      }
    } catch (error) {
      console.error('Error loading inconsistencies:', error);
    }
  };

  // Load declarations and inconsistencies on mount
  useEffect(() => {
    loadDeclarations();
    loadInconsistencies();
  }, []);

  const handleDeclarationUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    
    if (!file || !declarationForm.tipo || !declarationForm.ano || !declarationForm.mes || !declarationForm.estado) {
      alert('Por favor completa todos los campos y selecciona un archivo');
      return;
    }

    uploadDeclarationMutation.mutate({ file, formData: declarationForm });
  };

  return (
    <Page title="Papel de Trabajo" subtitle="Construcción y edición del papel de trabajo por periodo">
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="cfdi">Procesamiento CFDI</TabsTrigger>
          <TabsTrigger value="fiscal">Cédula Fiscal</TabsTrigger>
          <TabsTrigger value="declarations">Declaraciones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Periodo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-[200px]"
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      if (!period) return;
                      const res = await fetch(`/api/workpapers/generate?period=${encodeURIComponent(period)}`, { credentials: "include" });
                      if (!res.ok) throw new Error(await res.text());
                      const json = await res.json();
                      setRows(json.rows || []);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  disabled={!period}
                >
                  Cargar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border"
                  onClick={() => setShowArchive((v: boolean) => !v)}
                >
                  Archivo
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Periodos disponibles (detectados):
              </div>
              <div className="flex gap-2 items-center">
                <select
                  className="px-2 py-1 border border-border rounded bg-transparent"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">Año</option>
                  {years.map((y) => (
                    <option key={y.year} value={y.year}>{y.year}</option>
                  ))}
                </select>
                <select className="px-2 py-1 border border-border rounded bg-transparent">
                  <option value="">Meses</option>
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
              {showArchive && (
                <div className="mt-3 border border-border rounded p-3 max-h-56 overflow-auto">
                  {years.length === 0 && (
                    <div className="text-xs text-muted-foreground">No hay meses detectados aún.</div>
                  )}
                  {years.map((y) => (
                    <div key={y.year} className="mb-2">
                      <div className="text-sm font-medium">{y.year}</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {y.months.map((m) => {
                          const p = `${y.year}-${String(m).padStart(2,'0')}`;
                          return (
                            <Button
                              key={p}
                              variant="outline"
                              size="sm" asChild
                            >
                              <a
                                href="#"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  setPeriod(p);
                                  try {
                                    const res = await fetch(`/api/workpapers/generate?period=${p}`, { credentials: "include" });
                                    if (!res.ok) throw new Error(await res.text());
                                    const json = await res.json();
                                    setRows(json.rows || []);
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                              >{String(m).padStart(2,'0')}</a>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Totales Emitidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Subtotal</div>
            <div className="text-xl font-semibold">${totals.issuedSubtotal.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-2">IVA</div>
            <div className="text-xl font-semibold">${totals.issuedTax.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-2">Total</div>
            <div className="text-xl font-semibold">${totals.issuedTotal.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Totales Recibidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Subtotal</div>
            <div className="text-xl font-semibold">${totals.receivedSubtotal.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-2">IVA</div>
            <div className="text-xl font-semibold">${totals.receivedTax.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-2">Total</div>
            <div className="text-xl font-semibold">${totals.receivedTotal.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Renglones del papel de trabajo</CardTitle>
          <div className="flex gap-2 items-center">
            <input
              ref={uploaderRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importMutation.mutate(file);
                if (e.currentTarget) e.currentTarget.value = "";
              }}
            />
            <Button variant="outline" size="sm" className="border-border" onClick={() => uploaderRef.current?.click()} disabled={importMutation.isPending}>
              <Upload className="w-4 h-4 mr-2" />
              {importMutation.isPending ? "Importando..." : "Importar Excel/CSV"}
            </Button>
            <input
              ref={previewRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) previewMutation.mutate(file);
                if (e.currentTarget) e.currentTarget.value = "";
              }}
            />
            <Button variant="outline" size="sm" className="border-border" onClick={() => previewRef.current?.click()} disabled={previewMutation.isPending}>
              <Calculator className="w-4 h-4 mr-2" />
              {previewMutation.isPending ? "Calculando..." : "Previsualizar cálculos"}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/api/workpapers/template?name=ramon" target="_blank" rel="noreferrer">
                <Download className="w-4 h-4 mr-2" />
                Plantilla "Ramon"
              </a>
            </Button>
            <Button variant="outline" size="sm" className="border-border" onClick={() => window.print()}>
              <Download className="w-4 h-4 mr-2" />
              Exportar (PDF)
            </Button>
            <Button size="sm" onClick={() => commitMutation.mutate()} disabled={!period || rows.length === 0 || commitMutation.isPending}>
              <Calculator className="w-4 h-4 mr-2" />
              Enviar a Reporte Fiscal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            {preview && (
              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader><CardTitle>Emitidas (preview)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">Subtotal</div>
                    <div className="text-xl font-semibold">${preview.issued.subtotal.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground mt-2">IVA</div>
                    <div className="text-xl font-semibold">${preview.issued.tax.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground mt-2">Total</div>
                    <div className="text-xl font-semibold">${preview.issued.total.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Recibidas (preview)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">Subtotal</div>
                    <div className="text-xl font-semibold">${preview.received.subtotal.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground mt-2">IVA</div>
                    <div className="text-xl font-semibold">${preview.received.tax.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground mt-2">Total</div>
                    <div className="text-xl font-semibold">${preview.received.total.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Global (preview)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">Subtotal</div>
                    <div className="text-xl font-semibold">${preview.overall.subtotal.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground mt-2">IVA</div>
                    <div className="text-xl font-semibold">${preview.overall.tax.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground mt-2">Total</div>
                    <div className="text-xl font-semibold">${preview.overall.total.toLocaleString()}</div>
                  </CardContent>
                </Card>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>RFC Emisor</TableHead>
                  <TableHead>RFC Receptor</TableHead>
                  <TableHead>UUID</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">IVA</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Clasificación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Input type="date" value={r.date?.slice(0,10)} onChange={(e) => setRows(prev => prev.map((x,i)=> i===idx? {...x, date: e.target.value}: x))} /></TableCell>
                    <TableCell>
                      <select value={r.direction} onChange={(e) => setRows(prev => prev.map((x,i)=> i===idx? {...x, direction: e.target.value as any}: x))} className="px-2 py-1 border border-border rounded bg-transparent">
                        <option value="issued">Emitida</option>
                        <option value="received">Recibida</option>
                      </select>
                    </TableCell>
                    <TableCell><Input value={r.emitterRfc || ""} onChange={(e) => setRows(prev => prev.map((x,i)=> i===idx? {...x, emitterRfc: e.target.value}: x))} /></TableCell>
                    <TableCell><Input value={r.receiverRfc || ""} onChange={(e) => setRows(prev => prev.map((x,i)=> i===idx? {...x, receiverRfc: e.target.value}: x))} /></TableCell>
                    <TableCell><Input value={r.uuid || ""} onChange={(e) => setRows(prev => prev.map((x,i)=> i===idx? {...x, uuid: e.target.value}: x))} /></TableCell>
                    <TableCell><Input value={r.concept || ""} onChange={(e) => setRows(prev => prev.map((x,i)=> i===idx? {...x, concept: e.target.value}: x))} /></TableCell>
                    <TableCell className="text-right"><Input type="number" step="0.01" value={String(r.subtotal)} onChange={(e) => setRows(prev => prev.map((x,i)=> i===idx? {...x, subtotal: Number(e.target.value||0)}: x))} /></TableCell>
                    <TableCell className="text-right"><Input type="number" step="0.01" value={String(r.tax)} onChange={(e) => setRows(prev => prev.map((x,i)=> i===idx? {...x, tax: Number(e.target.value||0)}: x))} /></TableCell>
                    <TableCell className="text-right"><Input type="number" step="0.01" value={String(r.total)} onChange={(e) => setRows(prev => prev.map((x,i)=> i===idx? {...x, total: Number(e.target.value||0)}: x))} /></TableCell>
                    <TableCell>
                      <select value={r.category || ""} onChange={(e) => setRows(prev => prev.map((x,i)=> i===idx? {...x, category: e.target.value}: x))} className="px-2 py-1 border border-border rounded bg-transparent">
                        <option value="">—</option>
                        <option value="ingreso">Ingreso</option>
                        <option value="egreso">Egreso</option>
                        <option value="otro">Otro</option>
                      </select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="cfdi" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Procesamiento CFDI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Receipt className="w-4 h-4" />
                    <span className="text-sm font-medium">RFC Usuario:</span>
                    <code className="bg-blue-100 px-2 py-1 rounded text-sm">{userRfc || "No autenticado"}</code>
                  </div>
                </div>
                
                <div>
                  <input
                    ref={cfdiUploaderRef}
                    type="file"
                    multiple
                    accept=".xml,.zip"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        cfdiProcessMutation.mutate(files);
                      }
                      if (e.currentTarget) e.currentTarget.value = "";
                    }}
                  />
                  <Button
                    onClick={() => cfdiUploaderRef.current?.click()}
                    disabled={cfdiProcessMutation.isPending}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {cfdiProcessMutation.isPending ? "Procesando..." : "Subir Archivos CFDI (XML/ZIP)"}
                  </Button>
                </div>

                {cfdiProcessMutation.isPending && (
                  <div className="space-y-2">
                    <Progress value={33} />
                    <p className="text-sm text-muted-foreground">Procesando archivos CFDI...</p>
                  </div>
                )}

                {cfdiProcessMutation.isError && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Error procesando CFDI: {cfdiProcessMutation.error?.message}
                    </AlertDescription>
                  </Alert>
                )}

                {cfdiProcessMutation.isSuccess && (
                  <Alert>
                    <AlertDescription>
                      {cfdiProcessMutation.data.message}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Ventana de Progreso de Carga */}
                {cedulaData && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-green-800 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Progreso de Carga
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Ingresos */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-green-700">Ingresos</span>
                          <span className="text-sm text-green-600">{cedulaData.ingresos.length} registros</span>
                        </div>
                        {cedulaData.ingresos.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-xs text-green-600">Meses cargados:</div>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(new Set(cedulaData.ingresos.map((ing: any) => {
                                const fecha = new Date(ing.fecha);
                                return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                              }))).sort().map((mes) => (
                                <span key={mes} className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">
                                  {new Date(mes + '-01').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Gastos */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-700">Gastos</span>
                          <span className="text-sm text-blue-600">{cedulaData.gastos.length} registros</span>
                        </div>
                        {cedulaData.gastos.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-xs text-blue-600">Meses cargados:</div>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(new Set(cedulaData.gastos.map((gasto: any) => {
                                const fecha = new Date(gasto.fecha);
                                return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                              }))).sort().map((mes) => (
                                <span key={mes} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
                                  {new Date(mes + '-01').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Retenciones */}
                      {cedulaData.retenciones && cedulaData.retenciones.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-purple-700">Retenciones</span>
                            <span className="text-sm text-purple-600">{cedulaData.retenciones.length} registros</span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-purple-600">Meses cargados:</div>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(new Set(cedulaData.retenciones.map((ret: any) => {
                                const fecha = new Date(ret.fecha);
                                return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                              }))).sort().map((mes: string) => (
                                <span key={mes} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs">
                                  {new Date(mes + '-01').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Resumen Total */}
                      <div className="pt-2 border-t border-green-200">
                        <div className="text-sm text-green-700">
                          <strong>Total cargado:</strong> {cedulaData.ingresos.length + cedulaData.gastos.length + (cedulaData.retenciones?.length || 0)} registros
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Retenciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <input
                    ref={retencionesUploaderRef}
                    type="file"
                    multiple
                    accept=".xml,.zip"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        retencionesProcessMutation.mutate(files);
                      }
                      if (e.currentTarget) e.currentTarget.value = "";
                    }}
                  />
                  <Button
                    onClick={() => retencionesUploaderRef.current?.click()}
                    disabled={retencionesProcessMutation.isPending}
                    className="w-full"
                    variant="outline"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {retencionesProcessMutation.isPending ? "Procesando..." : "Subir Retenciones (Uber/Didi)"}
                  </Button>
                </div>

                {retencionesProcessMutation.isPending && (
                  <div className="space-y-2">
                    <Progress value={50} />
                    <p className="text-sm text-muted-foreground">Procesando retenciones...</p>
                  </div>
                )}

                {retencionesProcessMutation.isError && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Error procesando retenciones: {retencionesProcessMutation.error?.message}
                    </AlertDescription>
                  </Alert>
                )}

                {retencionesProcessMutation.isSuccess && (
                  <Alert>
                    <AlertDescription>
                      {retencionesProcessMutation.data.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fiscal" className="space-y-6">
          {cedulaData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen Anual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Ingresos:</span>
                      <span className="font-semibold">${cedulaData.resumenAnual.totalIngresos.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Gastos:</span>
                      <span className="font-semibold">${cedulaData.resumenAnual.totalGastos.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">IVA Causado:</span>
                      <span className="font-semibold">${cedulaData.resumenAnual.totalIVACausado.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">IVA Retenido:</span>
                      <span className="font-semibold">${cedulaData.resumenAnual.totalIVARetenido.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm text-muted-foreground">ISR Anual:</span>
                      <span className="font-semibold">${cedulaData.resumenAnual.isrAnual.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Acciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => generatePapelTrabajoMutation.mutate(new Date().getFullYear())}
                    disabled={generatePapelTrabajoMutation.isPending}
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {generatePapelTrabajoMutation.isPending ? "Generando..." : "Generar Papel de Trabajo Anual"}
                  </Button>

                  {generatePapelTrabajoMutation.isSuccess && (
                    <Button asChild variant="outline" className="w-full">
                      <a href={generatePapelTrabajoMutation.data.downloadUrl} download>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar Excel
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Totales Mensuales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-2">
                    {cedulaData.totalesMensuales.length} meses procesados
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {cedulaData.totalesMensuales.map((mes: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>Mes {mes.mes}:</span>
                        <span>${mes.total?.toLocaleString() || 0}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!cedulaData && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Procesa archivos CFDI primero para ver la cédula fiscal
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="declarations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel de Subida de Declaraciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Subir Declaraciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Declaración</label>
                  <select 
                    className="w-full px-3 py-2 border border-border rounded bg-transparent"
                    value={declarationForm.tipo}
                    onChange={(e) => setDeclarationForm(prev => ({ ...prev, tipo: e.target.value }))}
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="mensual">Mensual</option>
                    <option value="bimestral">Bimestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Año</label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 border border-border rounded bg-transparent"
                      placeholder="2024"
                      min="2020"
                      max="2030"
                      value={declarationForm.ano}
                      onChange={(e) => setDeclarationForm(prev => ({ ...prev, ano: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mes/Periodo</label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 border border-border rounded bg-transparent"
                      placeholder="01"
                      min="1"
                      max="12"
                      value={declarationForm.mes}
                      onChange={(e) => setDeclarationForm(prev => ({ ...prev, mes: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado de la Declaración</label>
                  <select 
                    className="w-full px-3 py-2 border border-border rounded bg-transparent"
                    value={declarationForm.estado}
                    onChange={(e) => setDeclarationForm(prev => ({ ...prev, estado: e.target.value }))}
                  >
                    <option value="">Seleccionar estado</option>
                    <option value="ceros">En Ceros</option>
                    <option value="datos">Con Datos Reales</option>
                    <option value="complementaria">Complementaria</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Archivo PDF</label>
                  <input 
                    type="file" 
                    accept=".pdf"
                    className="w-full px-3 py-2 border border-border rounded bg-transparent file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                  />
                </div>

                <form onSubmit={handleDeclarationUpload}>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={uploadDeclarationMutation.isPending}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadDeclarationMutation.isPending ? 'Subiendo...' : 'Subir Declaración'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Panel de Inconsistencias */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Inconsistencias Detectadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {inconsistencies.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckSquare className="h-12 w-12 mx-auto text-green-500 mb-2" />
                    <p className="text-muted-foreground">No se detectaron inconsistencias</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inconsistencies.map((inconsistency, idx) => (
                      <Alert key={idx} className="border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          <div className="font-medium">{inconsistency.periodo}</div>
                          <div className="text-sm">{inconsistency.descripcion}</div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Declaraciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Historial de Declaraciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Subida</TableHead>
                      <TableHead>Ingresos CFDI</TableHead>
                      <TableHead>Estado Validación</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {declarations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay declaraciones registradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      declarations.map((declaration, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{declaration.periodo}</TableCell>
                          <TableCell>{declaration.tipo}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              declaration.estado === 'ceros' 
                                ? 'bg-red-100 text-red-800' 
                                : declaration.estado === 'datos'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {declaration.estado === 'ceros' ? 'En Ceros' : 
                               declaration.estado === 'datos' ? 'Con Datos' : 'Complementaria'}
                            </span>
                          </TableCell>
                          <TableCell>{declaration.fechaSubida}</TableCell>
                          <TableCell>
                            {declaration.ingresosCfdi ? (
                              <span className="text-green-600 font-medium">
                                ${declaration.ingresosCfdi.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-gray-400">Sin datos</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {declaration.inconsistencia ? (
                              <span className="flex items-center gap-1 text-yellow-600">
                                <AlertTriangle className="h-4 w-4" />
                                Inconsistencia
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckSquare className="h-4 w-4" />
                                Válida
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Panel de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Declaraciones</p>
                    <p className="text-2xl font-bold">{declarations.length}</p>
                  </div>
                  <FileCheck className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">En Ceros</p>
                    <p className="text-2xl font-bold text-red-600">
                      {declarations.filter(d => d.estado === 'ceros').length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Inconsistencias</p>
                    <p className="text-2xl font-bold text-yellow-600">{inconsistencies.length}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </Page>
  );
}
