import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Building2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Supplier } from "@shared/schema";
import Page from "@/components/layout/page";

export default function Suppliers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = 
      supplier.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.rfc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.commercialName && supplier.commercialName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || supplier.rfcStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Válido</Badge>;
      case "invalid":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Inválido</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const activeSuppliers = suppliers.filter(s => s.isActive).length;
  const validRfcs = suppliers.filter(s => s.rfcStatus === "valid").length;
  const pendingValidation = suppliers.filter(s => s.rfcStatus === "pending").length;

  if (isLoading) {
    return (
      <Page title="Proveedores" subtitle="Gestión de proveedores y validación de RFC">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Proveedores" subtitle="Gestión de proveedores y validación de RFC" actions={
      <Button className="bg-primary text-primary-foreground hover:opacity-90">
        <Plus className="w-4 h-4 mr-2" />
        Nuevo Proveedor
      </Button>
    }>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proveedores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeSuppliers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RFC Válidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{validRfcs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingValidation}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nombre, RFC o razón social..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-muted/50 border-border focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-md bg-transparent focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="all">Todos los estados</option>
          <option value="valid">RFC Válido</option>
          <option value="invalid">RFC Inválido</option>
          <option value="pending">Pendiente</option>
        </select>
      </div>

      {/* Suppliers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSuppliers.map((supplier) => (
          <Card key={supplier.id} className="hover:shadow-sm transition-all dark:hover:bg-white/5">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-foreground">{supplier.businessName}</CardTitle>
                  {supplier.commercialName && (
                    <p className="text-sm text-muted-foreground mt-1">{supplier.commercialName}</p>
                  )}
                </div>
                {getStatusBadge(supplier.rfcStatus)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">RFC:</span>
                  <span className="text-sm font-mono text-foreground">{supplier.rfc ?? "N/A"}</span>
                </div>
                {supplier.email && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Email:</span>
                    <span className="text-sm text-foreground">{supplier.email}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Teléfono:</span>
                    <span className="text-sm text-foreground">{supplier.phone}</span>
                  </div>
                )}
                {supplier.contactPerson && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Contacto:</span>
                    <span className="text-sm text-foreground">{supplier.contactPerson}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Última validación:</span>
                  <span className="text-sm text-foreground">
                    {typeof supplier.lastValidation === "string" && supplier.lastValidation
                      ? new Date(supplier.lastValidation).toLocaleDateString()
                      : "No validado"}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                <Badge variant={supplier.isActive ? "default" : "secondary"}>
                  {supplier.isActive ? "Activo" : "Inactivo"}
                </Badge>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-border">
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="border-border">
                    Validar RFC
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">No hay proveedores</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm || statusFilter !== "all" 
              ? "No se encontraron proveedores con los filtros aplicados."
              : "Comienza agregando un nuevo proveedor."
            }
          </p>
        </div>
      )}
    </Page>
  );
}
