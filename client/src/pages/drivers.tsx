import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import DriverModal from "@/components/modals/driver-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Edit, Eye, Phone, Mail, FileText, AlertTriangle } from "lucide-react";
import { type Driver } from "@shared/schema";

export default function Drivers() {
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: drivers = [], isLoading } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (driver.email && driver.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success bg-opacity-10 text-success">Activo</Badge>;
      case "inactive":
        return <Badge className="bg-gray-500 bg-opacity-10 text-gray-600">Inactivo</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isLicenseExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isLicenseExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  const getDocumentStatus = (driver: Driver) => {
    const documents = [
      { name: 'Licencia', file: driver.licensePdf },
      { name: 'Domicilio', file: driver.addressProofPdf },
      { name: 'INE', file: driver.inePdf }
    ];
    
    const completedDocs = documents.filter(doc => doc.file).length;
    const totalDocs = documents.length;
    
    if (completedDocs === totalDocs) {
      return { status: 'complete', color: 'bg-green-100 text-green-800', text: 'Completo' };
    } else if (completedDocs > 0) {
      return { status: 'partial', color: 'bg-yellow-100 text-yellow-800', text: `${completedDocs}/${totalDocs}` };
    } else {
      return { status: 'missing', color: 'bg-red-100 text-red-800', text: 'Pendiente' };
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="Conductores" subtitle="Gestión de personal de conducción" />
        <div className="p-6">
          <div className="text-center">Cargando conductores...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Conductores" subtitle="Gestión de personal de conducción" />
      
      <div className="p-6 overflow-y-auto h-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Lista de Conductores</h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar conductores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
                <Search className="absolute left-3 top-3 text-gray-400" size={16} />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2" size={16} />
                Filtrar
              </Button>
              <Button 
                onClick={() => setDriverModalOpen(true)}
                className="bg-primary hover:bg-blue-600 text-white"
              >
                + Nuevo Conductor
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {filteredDrivers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👨‍💼</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {drivers.length === 0 ? "No hay conductores registrados" : "No se encontraron conductores"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {drivers.length === 0 
                    ? "Comienza agregando tu primer conductor"
                    : "Intenta con otro término de búsqueda"
                  }
                </p>
                {drivers.length === 0 && (
                  <Button 
                    onClick={() => setDriverModalOpen(true)}
                    className="bg-primary hover:bg-blue-600 text-white"
                  >
                    + Agregar Primer Conductor
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conductor</TableHead>
                    <TableHead>Licencia</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Documentos</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.map((driver) => (
                    <TableRow key={driver.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mr-3">
                            <span className="text-primary font-semibold text-sm">
                              {driver.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{driver.name}</div>
                            {driver.email && (
                              <div className="flex items-center text-sm text-gray-500">
                                <Mail size={12} className="mr-1" />
                                {driver.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{driver.licenseNumber}</div>
                      </TableCell>
                      <TableCell>
                        {driver.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone size={12} className="mr-1" />
                            {driver.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(driver.status)}
                      </TableCell>
                      <TableCell>
                        {driver.licenseExpiry ? (
                          <div>
                            <div className={`text-sm ${
                              isLicenseExpired(driver.licenseExpiry) ? 'text-error font-semibold' :
                              isLicenseExpiringSoon(driver.licenseExpiry) ? 'text-warning font-semibold' :
                              'text-gray-600'
                            }`}>
                              {new Date(driver.licenseExpiry).toLocaleDateString()}
                            </div>
                            {isLicenseExpired(driver.licenseExpiry) && (
                              <Badge className="bg-error bg-opacity-10 text-error text-xs mt-1">
                                Vencida
                              </Badge>
                            )}
                            {isLicenseExpiringSoon(driver.licenseExpiry) && !isLicenseExpired(driver.licenseExpiry) && (
                              <Badge className="bg-warning bg-opacity-10 text-warning text-xs mt-1">
                                Por vencer
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No registrada</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getDocumentStatus(driver).color} px-2 py-1 text-xs font-medium rounded-full`}>
                            {getDocumentStatus(driver).text}
                          </Badge>
                          <div className="flex space-x-1">
                            {driver.licensePdf && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(driver.licensePdf!, '_blank')}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Ver Licencia"
                              >
                                <FileText size={12} />
                              </Button>
                            )}
                            {driver.addressProofPdf && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(driver.addressProofPdf!, '_blank')}
                                className="text-green-600 hover:text-green-800 p-1"
                                title="Ver Comprobante de Domicilio"
                              >
                                <FileText size={12} />
                              </Button>
                            )}
                            {driver.inePdf && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(driver.inePdf!, '_blank')}
                                className="text-purple-600 hover:text-purple-800 p-1"
                                title="Ver INE"
                              >
                                <FileText size={12} />
                              </Button>
                            )}
                            {getDocumentStatus(driver).status !== 'complete' && (
                              <span title="Documentos pendientes">
                                <AlertTriangle size={12} className="text-yellow-600" />
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" className="text-primary hover:text-blue-600">
                            <Edit size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                            <Eye size={16} />
                          </Button>
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

      <DriverModal 
        open={driverModalOpen} 
        onOpenChange={setDriverModalOpen} 
      />
    </>
  );
}
