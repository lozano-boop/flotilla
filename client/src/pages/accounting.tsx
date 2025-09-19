import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Page from "@/components/layout/page";
import ExpenseModal from "@/components/modals/expense-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, TrendingDown, TrendingUp, DollarSign } from "lucide-react";
import { type Expense, type Vehicle } from "@shared/schema";

export default function Accounting() {
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const filteredExpenses = expenses.filter(expense => {
    const vehicle = expense.vehicleId ? vehicles.find(v => v.id === expense.vehicleId) : null;
    const vehiclePlate = vehicle ? vehicle.plate : "";
    
    return expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
           expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
           vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    })
    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      fuel: "Combustible",
      maintenance: "Mantenimiento",
      insurance: "Seguro",
      registration: "Registro",
      repairs: "Reparaciones",
      other: "Otro"
    };
    return categories[category] || category;
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      fuel: "bg-blue-100 text-blue-800",
      maintenance: "bg-yellow-100 text-yellow-800",
      insurance: "bg-green-100 text-green-800",
      registration: "bg-purple-100 text-purple-800",
      repairs: "bg-red-100 text-red-800",
      other: "bg-gray-100 text-gray-800"
    };
    
    return (
      <Badge className={colors[category] || colors.other}>
        {getCategoryLabel(category)}
      </Badge>
    );
  };

  const getVehicleInfo = (vehicleId: string | null) => {
    if (!vehicleId) return "General";
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.plate} - ${vehicle.brand} ${vehicle.model}` : "Vehículo no encontrado";
  };

  if (isLoading) {
    return (
      <Page title="Contabilidad" subtitle="Control de gastos e ingresos">
        <div className="text-center text-muted-foreground">Cargando registros contables...</div>
      </Page>
    );
  }

  return (
    <Page title="Contabilidad" subtitle="Control de gastos e ingresos">
      <div className="overflow-y-auto h-full">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Gastos Totales</p>
                  <p className="text-3xl font-bold text-foreground">
                    ${totalExpenses.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-error bg-opacity-10 rounded-lg flex items-center justify-center">
                  <TrendingDown className="text-error" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Gastos del Mes</p>
                  <p className="text-3xl font-bold text-foreground">
                    ${monthlyExpenses.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning bg-opacity-10 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-warning" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Promedio Mensual</p>
                  <p className="text-3xl font-bold text-foreground">
                    ${expenses.length > 0 ? (totalExpenses / 12).toLocaleString() : "0"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-primary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expenses Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Registro de Gastos</h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar gastos..."
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
                variant="outline" 
                size="sm" 
                className="border-border"
                onClick={() => {
                  // Portal CFDI del SAT (Consulta de Facturas)
                  const url = "https://portalcfdi.facturaelectronica.sat.gob.mx/";
                  window.open(url, "_blank");
                }}
                title="Abrir portal del SAT para descargar facturas del mes en curso"
              >
                Ingresos SAT
              </Button>
              <Button 
                onClick={() => setExpenseModalOpen(true)}
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                <Plus className="mr-2" size={16} />
                Nuevo Gasto
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {expenses.length === 0 ? "No hay gastos registrados" : "No se encontraron gastos"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {expenses.length === 0 
                    ? "Comienza registrando los gastos de tu flotilla"
                    : "Intenta con otro término de búsqueda"
                  }
                </p>
                {expenses.length === 0 && (
                  <Button 
                    onClick={() => setExpenseModalOpen(true)}
                    className="bg-primary text-primary-foreground hover:opacity-90"
                  >
                    <Plus className="mr-2" size={16} />
                    Registrar Primer Gasto
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {expense.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(expense.category)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {getVehicleInfo(expense.vehicleId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-foreground">
                          {new Date(expense.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">
                          ${parseFloat(expense.amount).toLocaleString()}
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
      <ExpenseModal 
        open={expenseModalOpen} 
        onOpenChange={setExpenseModalOpen} 
      />
    </Page>
  );
}
