import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Page from "@/components/layout/page";
import DocumentModal from "@/components/modals/document-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, FileText, AlertTriangle } from "lucide-react";
import { type DriverDocument, type Driver } from "@shared/schema";

export default function Documents() {
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: documents = [], isLoading } = useQuery<DriverDocument[]>({
    queryKey: ["/api/driver-documents"],
  });

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const filteredDocuments = documents.filter(document => {
    const driver = drivers.find(d => d.id === document.driverId);
    const driverName = driver ? driver.name : "";
    
    return driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           document.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (document.documentNumber && document.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const getStatusBadge = (status: string, expiryDate: string | null) => {
    if (status === "expired" || (expiryDate && new Date(expiryDate) < new Date())) {
      return <Badge className="bg-error bg-opacity-10 text-error">Vencido</Badge>;
    }
    
    if (expiryDate && isExpiringSoon(expiryDate)) {
      return <Badge className="bg-warning bg-opacity-10 text-warning">Por vencer</Badge>;
    }
    
    switch (status) {
      case "valid":
        return <Badge className="bg-success bg-opacity-10 text-success">Válido</Badge>;
      case "expiring_soon":
        return <Badge className="bg-warning bg-opacity-10 text-warning">Por vencer</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  const getDriverInfo = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : "Conductor no encontrado";
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      license: "Licencia de Conducir",
      medical_certificate: "Certificado Médico",
      insurance: "Seguro",
      identification: "Identificación",
      other: "Otro"
    };
    return types[type] || type;
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "license":
        return "🪪";
      case "medical_certificate":
        return "🏥";
      case "insurance":
        return "🛡️";
      case "identification":
        return "🆔";
      default:
        return "📄";
    }
  };

  // Calculate summary stats
  const totalDocuments = documents.length;
  const expiredDocuments = documents.filter(doc => 
    doc.status === "expired" || (doc.expiryDate && isExpired(doc.expiryDate))
  ).length;
  const expiringSoonDocuments = documents.filter(doc => 
    doc.expiryDate && isExpiringSoon(doc.expiryDate) && !isExpired(doc.expiryDate)
  ).length;

  if (isLoading) {
    return (
      <Page title="Documentación" subtitle="Control de papelería y documentos">
        <div className="text-center text-muted-foreground">Cargando documentos...</div>
      </Page>
    );
  }

  return (
    <Page title="Documentación" subtitle="Control de papelería y documentos">
      <div className="overflow-y-auto h-full">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Documentos</p>
                  <p className="text-3xl font-bold text-foreground">{totalDocuments}</p>
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
                  <p className="text-muted-foreground text-sm font-medium">Por Vencer</p>
                  <p className="text-3xl font-bold text-foreground">{expiringSoonDocuments}</p>
                </div>
                <div className="w-12 h-12 bg-warning bg-opacity-10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-warning" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Vencidos</p>
                  <p className="text-3xl font-bold text-foreground">{expiredDocuments}</p>
                </div>
                <div className="w-12 h-12 bg-error bg-opacity-10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-error" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Documentos de Conductores</h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar documentos..."
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
              <Button 
                onClick={() => setDocumentModalOpen(true)}
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                <Plus className="mr-2" size={16} />
                Nuevo Documento
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {documents.length === 0 ? "No hay documentos registrados" : "No se encontraron documentos"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {documents.length === 0 
                    ? "Comienza registrando los documentos de tus conductores"
                    : "Intenta con otro término de búsqueda"
                  }
                </p>
                {documents.length === 0 && (
                  <Button 
                    onClick={() => setDocumentModalOpen(true)}
                    className="bg-primary text-primary-foreground hover:opacity-90"
                  >
                    <Plus className="mr-2" size={16} />
                    Registrar Primer Documento
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conductor</TableHead>
                    <TableHead>Tipo de Documento</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Expedición</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((document) => (
                    <TableRow key={document.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mr-3">
                            <span className="text-primary font-semibold text-sm">
                              {getDriverInfo(document.driverId).split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {getDriverInfo(document.driverId)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">
                            {getDocumentIcon(document.type)}
                          </span>
                          <div className="font-medium text-foreground">
                            {getDocumentTypeLabel(document.type)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {document.documentNumber ? (
                          <div className="font-medium text-foreground">
                            {document.documentNumber}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No registrado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {document.issueDate ? (
                          <div className="text-sm text-foreground">
                            {new Date(document.issueDate).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No registrada</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {document.expiryDate ? (
                          <div>
                            <div className={`text-sm ${
                              isExpired(document.expiryDate) ? 'text-error font-semibold' :
                              isExpiringSoon(document.expiryDate) ? 'text-warning font-semibold' :
                              'text-foreground'
                            }`}>
                              {new Date(document.expiryDate).toLocaleDateString()}
                            </div>
                            {isExpired(document.expiryDate) && (
                              <div className="text-xs text-error mt-1">
                                Vencido hace{' '}
                                {Math.abs(Math.ceil((new Date(document.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} días
                              </div>
                            )}
                            {isExpiringSoon(document.expiryDate) && !isExpired(document.expiryDate) && (
                              <div className="text-xs text-warning mt-1">
                                Vence en{' '}
                                {Math.ceil((new Date(document.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No registrado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(document.status, document.expiryDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <DocumentModal 
        open={documentModalOpen} 
        onOpenChange={setDocumentModalOpen} 
      />
    </Page>
  );
}
