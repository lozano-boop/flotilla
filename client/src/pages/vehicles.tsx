import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import VehicleModal from "@/components/modals/vehicle-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Edit, Eye } from "lucide-react";
import { type Vehicle, type Driver } from "@shared/schema";

export default function Vehicles() {
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success bg-opacity-10 text-success">Activo</Badge>;
      case "maintenance":
        return <Badge className="bg-warning bg-opacity-10 text-warning">Mantenimiento</Badge>;
      case "out_of_service":
        return <Badge className="bg-error bg-opacity-10 text-error">Fuera de Servicio</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getVehicleDriver = (vehicleId: string | null) => {
    if (!vehicleId) return "Sin asignar";
    const driver = drivers.find(d => d.id === vehicleId);
    return driver ? driver.name : "Sin asignar";
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case "truck":
        return "🚛";
      case "van":
        return "🚐";
      case "pickup":
        return "🛻";
      default:
        return "🚗";
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="Vehículos" subtitle="Gestión de la flotilla vehicular" />
        <div className="p-6">
          <div className="text-center">Cargando vehículos...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Vehículos" subtitle="Gestión de la flotilla vehicular" />
      
      <div className="p-6 overflow-y-auto h-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Lista de Vehículos</h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar vehículos..."
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
                onClick={() => setVehicleModalOpen(true)}
                className="bg-primary hover:bg-blue-600 text-white"
              >
                + Nuevo Vehículo
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {filteredVehicles.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🚗</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {vehicles.length === 0 ? "No hay vehículos registrados" : "No se encontraron vehículos"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {vehicles.length === 0 
                    ? "Comienza agregando tu primer vehículo a la flotilla"
                    : "Intenta con otro término de búsqueda"
                  }
                </p>
                {vehicles.length === 0 && (
                  <Button 
                    onClick={() => setVehicleModalOpen(true)}
                    className="bg-primary hover:bg-blue-600 text-white"
                  >
                    + Agregar Primer Vehículo
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Conductor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Año</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center">
                          <div className="text-2xl mr-3">
                            {getVehicleIcon(vehicle.type)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{vehicle.plate}</div>
                            <div className="text-sm text-gray-500">
                              {vehicle.brand} {vehicle.model}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-gray-900">
                          {getVehicleDriver(vehicle.driverId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(vehicle.status)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {vehicle.type === "sedan" ? "Sedán" :
                         vehicle.type === "pickup" ? "Pickup" :
                         vehicle.type === "van" ? "Van" :
                         vehicle.type === "truck" ? "Camión" :
                         vehicle.type}
                      </TableCell>
                      <TableCell>{vehicle.year}</TableCell>
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

      <VehicleModal 
        open={vehicleModalOpen} 
        onOpenChange={setVehicleModalOpen} 
      />
    </>
  );
}
