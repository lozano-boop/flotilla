import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema, type InsertExpense, type Vehicle } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExpenseModal({ open, onOpenChange }: ExpenseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const form = useForm<InsertExpense>({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      vehicleId: null,
      category: "",
      description: "",
      amount: "0",
      date: new Date().toISOString().split('T')[0],
      receipt: null,
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: InsertExpense) => {
      const response = await apiRequest("POST", "/api/expenses", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Éxito",
        description: "Gasto registrado correctamente",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar el gasto",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertExpense) => {
    createExpenseMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Gasto</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="category">Categoría</Label>
            <Select onValueChange={(value) => form.setValue("category", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fuel">Combustible</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
                <SelectItem value="insurance">Seguro</SelectItem>
                <SelectItem value="registration">Registro</SelectItem>
                <SelectItem value="repairs">Reparaciones</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.category.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="vehicleId">Vehículo (Opcional)</Label>
            <Select onValueChange={(value) => form.setValue("vehicleId", value || null)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecciona un vehículo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin vehículo específico</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate} - {vehicle.brand} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Detalles del gasto..."
              {...form.register("description")}
              className="mt-1"
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...form.register("amount")}
              className="mt-1"
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              {...form.register("date")}
              className="mt-1"
            />
            {form.formState.errors.date && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.date.message}
              </p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createExpenseMutation.isPending}
            >
              {createExpenseMutation.isPending ? "Guardando..." : "Registrar Gasto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
