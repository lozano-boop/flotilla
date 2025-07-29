import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import MetricsCard from "@/components/dashboard/metrics-card";
import ActivityFeed from "@/components/dashboard/activity-feed";
import QuickActions from "@/components/dashboard/quick-actions";
import FleetStatus from "@/components/dashboard/fleet-status";
import VehicleModal from "@/components/modals/vehicle-modal";
import DriverModal from "@/components/modals/driver-modal";
import MaintenanceModal from "@/components/modals/maintenance-modal";
import ExpenseModal from "@/components/modals/expense-modal";
import { Car, Users, TrendingDown, Wrench, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { type Vehicle, type Driver } from "@shared/schema";

interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  maintenanceVehicles: number;
  outOfServiceVehicles: number;
  activeDrivers: number;
  monthlyExpenses: number;
  pendingMaintenance: number;
  overdueMaintenance: number;
  availability: number;
}

export default function Dashboard() {
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  // Get recent vehicles for the table (last 3)
  const recentVehicles = vehicles.slice(-3);

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

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Resumen general de tu flotilla" 
      />
      
      <div className="p-6 overflow-y-auto h-full">
        {/* Alert System */}
        {!alertDismissed && stats && stats.overdueMaintenance > 0 && (
          <div className="mb-6">
            <Alert className="border-warning bg-warning bg-opacity-10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-warning">Mantenimientos Pendientes</h4>
                  <p className="text-sm text-gray-700">
                    Tienes {stats.overdueMaintenance} vehículos con mantenimiento vencido
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setAlertDismissed(true)}
                  className="text-warning hover:text-orange-600"
                >
                  ×
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Total Vehículos"
            value={stats?.totalVehicles || 0}
            icon={Car}
            iconBgColor="bg-primary bg-opacity-10 text-primary"
            trend={{
              value: "+2.5%",
              isPositive: true,
              label: "vs mes anterior"
            }}
          />
          
          <MetricsCard
            title="Conductores Activos"
            value={stats?.activeDrivers || 0}
            icon={Users}
            iconBgColor="bg-success bg-opacity-10 text-success"
            trend={{
              value: "100%",
              isPositive: true,
              label: "documentados"
            }}
          />
          
          <MetricsCard
            title="Gastos del Mes"
            value={`$${stats?.monthlyExpenses?.toLocaleString() || "0"}`}
            icon={TrendingDown}
            iconBgColor="bg-error bg-opacity-10 text-error"
            trend={{
              value: "+8.2%",
              isPositive: false,
              label: "vs mes anterior"
            }}
          />
          
          <MetricsCard
            title="Mantenimientos"
            value={stats?.pendingMaintenance || 0}
            icon={Wrench}
            iconBgColor="bg-warning bg-opacity-10 text-warning"
            trend={{
              value: `${stats?.overdueMaintenance || 0} vencidos`,
              isPositive: false,
              label: "requieren atención"
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <ActivityFeed />
          </div>

          {/* Quick Actions & Fleet Status */}
          <div className="space-y-6">
            <QuickActions
              onNewVehicle={() => setVehicleModalOpen(true)}
              onNewMaintenance={() => setMaintenanceModalOpen(true)}
              onNewExpense={() => setExpenseModalOpen(true)}
              onNewDriver={() => setDriverModalOpen(true)}
            />
            
            {stats && (
              <FleetStatus
                activeVehicles={stats.activeVehicles}
                maintenanceVehicles={stats.maintenanceVehicles}
                outOfServiceVehicles={stats.outOfServiceVehicles}
                availability={stats.availability}
              />
            )}
          </div>
        </div>

        {/* Recent Vehicles Table */}
        <div className="mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Vehículos Recientes</h3>
              <Button 
                onClick={() => setVehicleModalOpen(true)}
                className="bg-primary hover:bg-blue-600 text-white"
              >
                + Nuevo Vehículo
              </Button>
            </CardHeader>
            
            <CardContent>
              {recentVehicles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay vehículos registrados. ¡Comienza agregando tu primer vehículo!
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehículo</TableHead>
                      <TableHead>Conductor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentVehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{vehicle.plate}</div>
                            <div className="text-sm text-gray-500">
                              {vehicle.brand} {vehicle.model} {vehicle.year}
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
                          {vehicle.type}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <VehicleModal 
        open={vehicleModalOpen} 
        onOpenChange={setVehicleModalOpen} 
      />
      <DriverModal 
        open={driverModalOpen} 
        onOpenChange={setDriverModalOpen} 
      />
      <MaintenanceModal 
        open={maintenanceModalOpen} 
        onOpenChange={setMaintenanceModalOpen} 
      />
      <ExpenseModal 
        open={expenseModalOpen} 
        onOpenChange={setExpenseModalOpen} 
      />
    </>
  );
}
