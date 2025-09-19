import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import InvoiceModal from "@/components/modals/invoice-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, FileText, Download, Eye } from "lucide-react";
import { type Invoice } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Page from "@/components/layout/page";

export default function Invoicing() {
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState<"all" | "issued" | "received">("all");
  const uploadRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: config } = useQuery<{ userRfc: string | null }>({
    queryKey: ["/api/config"],
  });

  const rfc = (config?.userRfc || "").toUpperCase();
  const matchesTab = (inv: Invoice) => {
    if (tab === "all") return true;
    const received = (inv.clientRfc || "").toUpperCase() === rfc; // si el cliente somos nosotros, es recibida
    return tab === "received" ? received : !received;
  };
  const filteredInvoices = invoices
    .filter(matchesTab)
    .filter((invoice) =>
      invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.folio || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

  const importMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("files", f));
      const res = await fetch("/api/invoices/import", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
  });

  // Calculate totals
  const totalInvoiced = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.total), 0);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyInvoiced = invoices
    .filter(invoice => {
      const invoiceDate = new Date(invoice.issueDate);
      return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
    })
    .reduce((sum, invoice) => sum + parseFloat(invoice.total), 0);

  const pendingInvoices = invoices.filter(invoice => invoice.status === "draft").length;

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    };
    
    const labels: Record<string, string> = {
      draft: "Borrador",
      sent: "Enviada",
      paid: "Pagada",
      cancelled: "Cancelada"
    };
    
    return (
      <Badge className={colors[status] || colors.draft}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Page title="Facturación" subtitle="Emisión y control de CFDI 4.0">
        <div className="text-center text-muted-foreground">Cargando facturas...</div>
      </Page>
    );
  }

  return (
    <Page title="Facturación" subtitle="Emisión y control de CFDI 4.0">
      <div className="overflow-y-auto h-full">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Facturado</p>
                  <p className="text-3xl font-bold text-foreground">
                    ${totalInvoiced.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-success bg-opacity-10 rounded-lg flex items-center justify-center">
                  <FileText className="text-success" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Facturado este Mes</p>
                  <p className="text-3xl font-bold text-foreground">
                    ${monthlyInvoiced.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                  <FileText className="text-primary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Facturas Pendientes</p>
                  <p className="text-3xl font-bold text-foreground">
                    {pendingInvoices}
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning bg-opacity-10 rounded-lg flex items-center justify-center">
                  <FileText className="text-warning" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Facturas CFDI 4.0</h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar facturas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 bg-muted/50 border-border focus-visible:ring-1 focus-visible:ring-ring"
                />
                <Search className="absolute left-3 top-3 text-muted-foreground" size={16} />
              </div>
              <Button variant="outline" size="sm" className="border-border">
                <Filter className="mr-2" size={16} />
                Filtrar
              </Button>
              <input
                ref={uploadRef}
                type="file"
                accept=".xml"
                multiple
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length) {
                    importMutation.mutate(files);
                    // reset input so selecting same files again re-triggers
                    e.currentTarget.value = "";
                  }
                }}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="border-border"
                onClick={() => uploadRef.current?.click()}
                disabled={importMutation.isPending}
                title="Importar CFDI XML del SAT (emitidas/recibidas)"
              >
                <Download className="mr-2" size={16} />
                {importMutation.isPending ? "Importando..." : "Importar SAT"}
              </Button>
              <Button 
                onClick={() => setInvoiceModalOpen(true)}
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                <Plus className="mr-2" size={16} />
                Nueva Factura
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Button variant={tab === "all" ? "default" : "outline"} size="sm" onClick={() => setTab("all")}>Todas</Button>
              <Button variant={tab === "issued" ? "default" : "outline"} size="sm" onClick={() => setTab("issued")}>Emitidas</Button>
              <Button variant={tab === "received" ? "default" : "outline"} size="sm" onClick={() => setTab("received")}>Recibidas</Button>
            </div>
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {invoices.length === 0 ? "No hay facturas registradas" : "No se encontraron facturas"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {invoices.length === 0 
                    ? "Comienza creando tu primera factura CFDI 4.0"
                    : "Intenta con otro término de búsqueda"
                  }
                </p>
                {invoices.length === 0 && (
                  <Button 
                    onClick={() => setInvoiceModalOpen(true)}
                    className="bg-primary text-primary-foreground hover:opacity-90"
                  >
                    <Plus className="mr-2" size={16} />
                    Crear Primera Factura
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Folio</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>RFC</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {invoice.series ? `${invoice.series}-${invoice.folio}` : invoice.folio}
                        </div>
                        {invoice.uuid && (
                          <div className="text-xs text-muted-foreground font-mono">
                            UUID: {invoice.uuid.substring(0, 8)}...
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {invoice.clientName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground font-mono">
                          {invoice.clientRfc}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-foreground">
                          {new Date(invoice.issueDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">
                          ${parseFloat(invoice.total).toLocaleString()} {invoice.currency}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {invoice.pdfPath && (
                            <Button variant="outline" size="sm" onClick={() => window.open(invoice.pdfPath!, "_blank")}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <InvoiceModal 
        open={invoiceModalOpen} 
        onOpenChange={setInvoiceModalOpen} 
      />
    </Page>
  );
}
