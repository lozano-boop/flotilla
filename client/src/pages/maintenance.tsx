import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import MaintenanceModal from "@/components/modals/maintenance-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, Wrench } from "lucide-react";
import { type MaintenanceRecord, type Vehicle } from "@shared/schema";

export default function Maintenance() {
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: maintenanceRecords = [], isLoading } = useQuery<MaintenanceRecord[]>({
    queryKey: ["/api/maintenance"],
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const filteredRecords = maintenanceRecords.filter(record => {
    const vehicle = vehicles.find(v => v.id === record.vehicleId);
    const vehiclePlate = vehicle ? vehicle.plate : "";
    
    return vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
           record.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (record.description && record.description.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success bg-opacity-10 text-success">Completado</Badge>;
      case "pending":
        return <Badge className="bg-warning bg-opacity-10 text-warning">Pendiente</Badge>;
      case "overdue":
        return <Badge className="bg-error bg-opacity-10 text-error">Vencido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.plate} - ${vehicle.brand} ${vehicle.model}` : "Vehículo no encontrado";
  };

  const getMaintenanceTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      oil_change: "Cambio de aceite",
      general_inspection: "Revisión general",
      alignment: "Alineación",
      brakes: "Frenos",
      tires: "Llantas",
      other: "Otro"
    };
    return types[type] || type;
  };

  if (isLoading) {
    return (
      <>
        <Header title="Mantenimiento" subtitle="Registro y seguimiento de mantenimientos" />
        <div className="p-6">
          <div className="text-center">Cargando registros de mantenimiento...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Mantenimiento" subtitle="Registro y seguimiento de mantenimientos" />
      
      <div className="p-6 overflow-y-auto h-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Registros de Mantenimiento</h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar mantenimientos..."
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
                onClick={() => setMaintenanceModalOpen(true)}
                className="bg-primary hover:bg-blue-600 text-white"
              >
                <Plus className="mr-2" size={16} />
                Nuevo Mantenimiento
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔧</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {maintenanceRecords.length === 0 ? "No hay registros de mantenimiento" : "No se encontraron registros"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {maintenanceRecords.length === 0 
                    ? "Comienza registrando el primer mantenimiento de tu flotilla"
                    : "Intenta con otro término de búsqueda"
                  }
                </p>
                {maintenanceRecords.length === 0 && (
                  <Button 
                    onClick={() => setMaintenanceModalOpen(true)}
                    className="bg-primary hover:bg-blue-600 text-white"
                  >
                    <Plus className="mr-2" size={16} />
                    Registrar Primer Mantenimiento
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Próximo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mr-3">
                            <Wrench className="text-primary" size={16} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {getVehicleInfo(record.vehicleId)}
                            </div>
                            {record.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {record.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {getMaintenanceTypeLabel(record.type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {new Date(record.performedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.cost ? (
                          <div className="font-medium text-gray-900">
                            ${parseFloat(record.cost).toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-gray-400">No registrado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell>
                        {record.nextDue ? (
                          <div className="text-sm text-gray-900">
                            {new Date(record.nextDue).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-gray-400">No programado</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <MaintenanceModal 
        open={maintenanceModalOpen} 
        onOpenChange={setMaintenanceModalOpen} 
      />
    </>
  );
}
