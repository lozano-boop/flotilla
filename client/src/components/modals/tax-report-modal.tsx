import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingUp, FileText } from "lucide-react";
import { type InsertTaxReport, type Expense } from "@shared/schema";

const taxReportSchema = z.object({
  reportType: z.string().min(1, "Tipo de reporte es requerido"),
  period: z.string().min(1, "Período es requerido"),
  totalIncome: z.string().optional(),
  totalExpenses: z.string().optional(),
  deductibleExpenses: z.string().optional(),
  taxableIncome: z.string().optional(),
  taxOwed: z.string().optional(),
});

type TaxReportFormData = z.infer<typeof taxReportSchema>;

interface TaxReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TaxReportModal({ open, onOpenChange }: TaxReportModalProps) {
  const [calculatedData, setCalculatedData] = useState<{
    totalExpenses: number;
    deductibleExpenses: number;
    estimatedTax: number;
    potentialSavings: number;
  } | null>(null);

  const queryClient = useQueryClient();

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const form = useForm<TaxReportFormData>({
    resolver: zodResolver(taxReportSchema),
    defaultValues: {
      reportType: "monthly",
      period: new Date().toISOString().slice(0, 7), // YYYY-MM
      totalIncome: "",
      totalExpenses: "",
      deductibleExpenses: "",
      taxableIncome: "",
      taxOwed: "",
    },
  });

  const createTaxReportMutation = useMutation({
    mutationFn: async (data: InsertTaxReport) => {
      const response = await fetch("/api/tax-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al crear el reporte fiscal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tax-reports"] });
      onOpenChange(false);
      form.reset();
      setCalculatedData(null);
    },
  });

  const calculateTaxData = () => {
    const reportType = form.getValues("reportType");
    const period = form.getValues("period");

    let filteredExpenses = expenses;

    if (reportType === "monthly") {
      filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.toISOString().slice(0, 7) === period;
      });
    } else if (reportType === "annual") {
      const year = period.split('-')[0];
      filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear().toString() === year;
      });
    }

    const totalExpenses = filteredExpenses.reduce((sum, expense) => 
      sum + parseFloat(expense.amount), 0
    );

    // Categorías deducibles según SAT
    const deductibleCategories = ['fuel', 'maintenance', 'repairs', 'insurance', 'registration'];
    const deductibleExpenses = filteredExpenses
      .filter(expense => deductibleCategories.includes(expense.category))
      .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

    // Estimaciones fiscales simplificadas
    const totalIncome = parseFloat(form.getValues("totalIncome") || "0");
    const taxableIncome = Math.max(0, totalIncome - deductibleExpenses);
    const estimatedTax = taxableIncome * 0.30; // Tasa estimada 30%
    const potentialSavings = (totalExpenses - deductibleExpenses) * 0.30;

    setCalculatedData({
      totalExpenses,
      deductibleExpenses,
      estimatedTax,
      potentialSavings
    });

    // Actualizar formulario con datos calculados
    form.setValue("totalExpenses", totalExpenses.toFixed(2));
    form.setValue("deductibleExpenses", deductibleExpenses.toFixed(2));
    form.setValue("taxableIncome", taxableIncome.toFixed(2));
    form.setValue("taxOwed", estimatedTax.toFixed(2));
  };

  const onSubmit = (data: TaxReportFormData) => {
    const reportData: InsertTaxReport = {
      reportType: data.reportType,
      period: data.period,
      totalIncome: data.totalIncome || null,
      totalExpenses: data.totalExpenses || null,
      deductibleExpenses: data.deductibleExpenses || null,
      taxableIncome: data.taxableIncome || null,
      taxOwed: data.taxOwed || null,
      status: "draft",
    };

    createTaxReportMutation.mutate(reportData);
  };

  const getCurrentPeriodOptions = () => {
    const currentDate = new Date();
    const options = [];

    // Últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const period = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long' });
      options.push({ value: period, label });
    }

    return options;
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [];

    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      options.push({ value: year.toString(), label: year.toString() });
    }

    return options;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Reporte Fiscal</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Configuración del reporte */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuración del Reporte</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="reportType">Tipo de Reporte *</Label>
                <Select onValueChange={(value) => form.setValue("reportType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="annual">Anual</SelectItem>
                    <SelectItem value="iva">IVA</SelectItem>
                    <SelectItem value="isr">ISR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="period">Período *</Label>
                {form.watch("reportType") === "annual" ? (
                  <Select onValueChange={(value) => form.setValue("period", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar año" />
                    </SelectTrigger>
                    <SelectContent>
                      {getYearOptions().map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select onValueChange={(value) => form.setValue("period", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar período" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCurrentPeriodOptions().map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={calculateTaxData}
                  variant="outline"
                  className="w-full"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Calcular
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Datos financieros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datos Financieros</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalIncome">Ingresos Totales</Label>
                <Input
                  id="totalIncome"
                  type="number"
                  step="0.01"
                  {...form.register("totalIncome")}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="totalExpenses">Gastos Totales</Label>
                <Input
                  id="totalExpenses"
                  type="number"
                  step="0.01"
                  {...form.register("totalExpenses")}
                  placeholder="0.00"
                  readOnly={!!calculatedData}
                />
              </div>
              <div>
                <Label htmlFor="deductibleExpenses">Gastos Deducibles</Label>
                <Input
                  id="deductibleExpenses"
                  type="number"
                  step="0.01"
                  {...form.register("deductibleExpenses")}
                  placeholder="0.00"
                  readOnly={!!calculatedData}
                />
              </div>
              <div>
                <Label htmlFor="taxableIncome">Base Gravable</Label>
                <Input
                  id="taxableIncome"
                  type="number"
                  step="0.01"
                  {...form.register("taxableIncome")}
                  placeholder="0.00"
                  readOnly={!!calculatedData}
                />
              </div>
              <div>
                <Label htmlFor="taxOwed">Impuesto a Pagar</Label>
                <Input
                  id="taxOwed"
                  type="number"
                  step="0.01"
                  {...form.register("taxOwed")}
                  placeholder="0.00"
                  readOnly={!!calculatedData}
                />
              </div>
            </CardContent>
          </Card>

          {/* Resumen calculado */}
          {calculatedData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Análisis Fiscal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      ${calculatedData.totalExpenses.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Gastos Totales</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ${calculatedData.deductibleExpenses.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Deducibles</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      ${calculatedData.estimatedTax.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Impuesto Estimado</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      ${calculatedData.potentialSavings.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Ahorro Potencial</div>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-yellow-600 mr-2" />
                    <div className="text-sm text-yellow-800">
                      <strong>Recomendación:</strong> Considera optimizar tus gastos deducibles para maximizar el ahorro fiscal. 
                      Los gastos de combustible, mantenimiento y seguros son 100% deducibles para flotillas.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createTaxReportMutation.isPending}
              className="bg-primary hover:bg-blue-600 text-white"
            >
              {createTaxReportMutation.isPending ? "Creando..." : "Crear Reporte"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
