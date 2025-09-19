import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TaxReportModal from "@/components/modals/tax-report-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, FileText, Download, Calculator, TrendingUp } from "lucide-react";
import { type TaxReport, type Expense } from "@shared/schema";
import Page from "@/components/layout/page";

export default function TaxReports() {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: taxReports = [], isLoading } = useQuery<TaxReport[]>({
    queryKey: ["/api/tax-reports"],
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const filteredReports = taxReports.filter(report => 
    report.period.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.reportType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate current period totals
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentYear = new Date().getFullYear().toString();

  const monthlyExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.toISOString().slice(0, 7) === currentMonth;
    })
    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  const yearlyExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear().toString() === currentYear;
    })
    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  // Calculate deductible expenses (simplified logic)
  const deductibleCategories = ['fuel', 'maintenance', 'repairs', 'insurance'];
  const deductibleExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear().toString() === currentYear && 
             deductibleCategories.includes(expense.category);
    })
    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  const getReportTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      monthly: "Mensual",
      annual: "Anual",
      iva: "IVA",
      isr: "ISR"
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800"
    };
    
    const labels: Record<string, string> = {
      draft: "Borrador",
      submitted: "Enviado",
      approved: "Aprobado"
    };
    
    return (
      <Badge className={colors[status] || colors.draft}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Page title="Reportes Fiscales" subtitle="Declaraciones y análisis fiscal">
        <div className="text-center text-muted-foreground">Cargando reportes fiscales...</div>
      </Page>
    );
  }

  return (
    <Page title="Reportes Fiscales" subtitle="Declaraciones y análisis fiscal">
      <div className="overflow-y-auto h-full">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Gastos Deducibles {currentYear}</p>
                  <p className="text-3xl font-bold text-foreground">
                    ${deductibleExpenses.toLocaleString()}
                  </p>
                  <p className="text-sm text-success mt-1">
                    Ahorro fiscal estimado: ${(deductibleExpenses * 0.30).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-success bg-opacity-10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-success" size={24} />
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
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentMonth}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                  <Calculator className="text-primary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Anual</p>
                  <p className="text-3xl font-bold text-foreground">
                    ${yearlyExpenses.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Año {currentYear}
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning bg-opacity-10 rounded-lg flex items-center justify-center">
                  <FileText className="text-warning" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Calculator className="mx-auto mb-2 text-primary" size={32} />
              <h3 className="font-medium text-foreground">Declaración Mensual</h3>
              <p className="text-sm text-muted-foreground">Generar reporte mensual</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <FileText className="mx-auto mb-2 text-success" size={32} />
              <h3 className="font-medium text-foreground">Declaración Anual</h3>
              <p className="text-sm text-muted-foreground">Preparar anual {currentYear}</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <TrendingUp className="mx-auto mb-2 text-foreground" size={32} />
              <h3 className="font-medium text-foreground">Análisis Fiscal</h3>
              <p className="text-sm text-muted-foreground">Optimizar impuestos</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Download className="mx-auto mb-2 text-warning" size={32} />
              <h3 className="font-medium text-foreground">Certificados</h3>
              <p className="text-sm text-muted-foreground">Retenciones y constancias</p>
            </CardContent>
          </Card>
        </div>

        {/* Tax Reports Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Reportes Fiscales</h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar reportes..."
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
                onClick={() => setReportModalOpen(true)}
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                <Plus className="mr-2" size={16} />
                Nuevo Reporte
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {taxReports.length === 0 ? "No hay reportes fiscales" : "No se encontraron reportes"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {taxReports.length === 0 
                    ? "Comienza generando tu primer reporte fiscal"
                    : "Intenta con otro término de búsqueda"
                  }
                </p>
                {taxReports.length === 0 && (
                  <Button 
                    onClick={() => setReportModalOpen(true)}
                    className="bg-primary text-primary-foreground hover:opacity-90"
                  >
                    <Plus className="mr-2" size={16} />
                    Generar Primer Reporte
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Ingresos</TableHead>
                    <TableHead>Gastos</TableHead>
                    <TableHead>Deducibles</TableHead>
                    <TableHead>Impuesto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id} className="hover:bg-muted/50 dark:hover:bg-white/5">
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {getReportTypeLabel(report.reportType)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-foreground">
                          {report.period}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-foreground">
                          ${report.totalIncome ? parseFloat(report.totalIncome).toLocaleString() : '0'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-foreground">
                          ${report.totalExpenses ? parseFloat(report.totalExpenses).toLocaleString() : '0'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-green-600 font-medium">
                          ${report.deductibleExpenses ? parseFloat(report.deductibleExpenses).toLocaleString() : '0'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-foreground">
                          ${report.taxOwed ? parseFloat(report.taxOwed).toLocaleString() : '0'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(report.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" className="border-border">
                            <FileText className="w-4 h-4" />
                          </Button>
                          {report.filePath && (
                            <Button variant="outline" size="sm" className="border-border">
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
      <TaxReportModal 
        open={reportModalOpen} 
        onOpenChange={setReportModalOpen} 
      />
    </Page>
  );
}
