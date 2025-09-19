import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import Page from "@/components/layout/page";

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
      <Page title="Dashboard" subtitle="Resumen general de tu flota y actividad reciente">
        {/* Alert System */}
        {!alertDismissed && stats && stats.overdueMaintenance > 0 && (
          <div className="mb-6">
            <Alert className="border-warning bg-warning bg-opacity-10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-warning">Mantenimientos Pendientes</h4>
                  <p className="text-sm text-foreground">
                    Tienes {stats.overdueMaintenance} vehículos con mantenimiento vencido
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setAlertDismissed(true)}
                  className="text-warning hover:text-warning"
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

        {/* Fleet Map + Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Placeholder */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <h3 className="text-lg font-semibold text-foreground">Mapa de Vehículos</h3>
            </CardHeader>
            <CardContent>
              <div className="w-full h-64 md:h-[340px] rounded-lg bg-[url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\'%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' font-family=\'Arial\' font-size=\'16\' fill=\'%23999\' text-anchor=\'middle\' dy=\'.3em\'%3EMapa (placeholder) Estilo Uber\3C/text%3E%3C/svg%3E')] bg-center bg-cover border border-border flex items-center justify-center" />
              <div className="flex items-center gap-3 mt-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
                  Activos
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-warning"></span>
                  Mantenimiento
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
                  Fuera de servicio
                </span>
              </div>
            </CardContent>
          </Card>

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
              <h3 className="text-lg font-semibold text-foreground">Vehículos Recientes</h3>
              <Button 
                onClick={() => setVehicleModalOpen(true)}
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                + Nuevo Vehículo
              </Button>
            </CardHeader>
            
            <CardContent>
              {recentVehicles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
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
                            <div className="font-medium text-foreground">{vehicle.plate}</div>
                            <div className="text-sm text-muted-foreground">
                              {vehicle.brand} {vehicle.model} {vehicle.year}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium text-foreground">
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
      </Page>

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
