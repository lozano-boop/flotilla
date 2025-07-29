import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVehicleSchema, type InsertVehicle } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VehicleModal({ open, onOpenChange }: VehicleModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertVehicle>({
    resolver: zodResolver(insertVehicleSchema),
    defaultValues: {
      plate: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      type: "",
      status: "active",
      driverId: null,
    },
  });

  const createVehicleMutation = useMutation({
    mutationFn: async (data: InsertVehicle) => {
      const response = await apiRequest("POST", "/api/vehicles", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Éxito",
        description: "Vehículo creado correctamente",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el vehículo",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertVehicle) => {
    createVehicleMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Vehículo</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="plate">Placa del Vehículo</Label>
            <Input
              id="plate"
              placeholder="ABC-123"
              {...form.register("plate")}
              className="mt-1"
            />
            {form.formState.errors.plate && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.plate.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="brand">Marca</Label>
            <Input
              id="brand"
              placeholder="Ford"
              {...form.register("brand")}
              className="mt-1"
            />
            {form.formState.errors.brand && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.brand.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="model">Modelo</Label>
            <Input
              id="model"
              placeholder="Transit"
              {...form.register("model")}
              className="mt-1"
            />
            {form.formState.errors.model && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.model.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="year">Año</Label>
            <Input
              id="year"
              type="number"
              placeholder="2023"
              {...form.register("year", { valueAsNumber: true })}
              className="mt-1"
            />
            {form.formState.errors.year && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.year.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="type">Tipo de Vehículo</Label>
            <Select onValueChange={(value) => form.setValue("type", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedan">Sedán</SelectItem>
                <SelectItem value="pickup">Pickup</SelectItem>
                <SelectItem value="van">Van</SelectItem>
                <SelectItem value="truck">Camión</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.type.message}
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
              disabled={createVehicleMutation.isPending}
            >
              {createVehicleMutation.isPending ? "Guardando..." : "Guardar Vehículo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
