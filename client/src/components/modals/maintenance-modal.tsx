import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMaintenanceRecordSchema, type InsertMaintenanceRecord, type Vehicle } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MaintenanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MaintenanceModal({ open, onOpenChange }: MaintenanceModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const form = useForm<InsertMaintenanceRecord>({
    resolver: zodResolver(insertMaintenanceRecordSchema),
    defaultValues: {
      vehicleId: "",
      type: "",
      description: "",
      cost: "0",
      performedAt: new Date().toISOString().split('T')[0],
      nextDue: "",
      status: "completed",
    },
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: async (data: InsertMaintenanceRecord) => {
      const response = await apiRequest("POST", "/api/maintenance", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Éxito",
        description: "Mantenimiento registrado correctamente",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar el mantenimiento",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertMaintenanceRecord) => {
    createMaintenanceMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Mantenimiento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="vehicleId">Vehículo</Label>
            <Select onValueChange={(value) => form.setValue("vehicleId", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecciona un vehículo..." />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate} - {vehicle.brand} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.vehicleId && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.vehicleId.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="type">Tipo de Mantenimiento</Label>
            <Select onValueChange={(value) => form.setValue("type", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oil_change">Cambio de aceite</SelectItem>
                <SelectItem value="general_inspection">Revisión general</SelectItem>
                <SelectItem value="alignment">Alineación</SelectItem>
                <SelectItem value="brakes">Frenos</SelectItem>
                <SelectItem value="tires">Llantas</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.type.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Detalles del mantenimiento realizado..."
              {...form.register("description")}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="cost">Costo</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...form.register("cost")}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="performedAt">Fecha de Realización</Label>
            <Input
              id="performedAt"
              type="date"
              {...form.register("performedAt")}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="nextDue">Próximo Mantenimiento</Label>
            <Input
              id="nextDue"
              type="date"
              {...form.register("nextDue")}
              className="mt-1"
            />
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
              disabled={createMaintenanceMutation.isPending}
            >
              {createMaintenanceMutation.isPending ? "Guardando..." : "Registrar Mantenimiento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
