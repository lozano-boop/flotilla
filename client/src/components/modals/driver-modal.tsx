import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDriverSchema, type InsertDriver } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DriverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DriverModal({ open, onOpenChange }: DriverModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertDriver>({
    resolver: zodResolver(insertDriverSchema),
    defaultValues: {
      name: "",
      licenseNumber: "",
      phone: "",
      email: "",
      address: "",
      licenseExpiry: "",
      status: "active",
    },
  });

  const createDriverMutation = useMutation({
    mutationFn: async (data: InsertDriver) => {
      const response = await apiRequest("POST", "/api/drivers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Éxito",
        description: "Conductor creado correctamente",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el conductor",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertDriver) => {
    createDriverMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Conductor</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre Completo</Label>
            <Input
              id="name"
              placeholder="Juan Pérez"
              {...form.register("name")}
              className="mt-1"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="licenseNumber">Número de Licencia</Label>
            <Input
              id="licenseNumber"
              placeholder="12345678"
              {...form.register("licenseNumber")}
              className="mt-1"
            />
            {form.formState.errors.licenseNumber && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.licenseNumber.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              placeholder="555-123-4567"
              {...form.register("phone")}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="juan@example.com"
              {...form.register("email")}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="licenseExpiry">Vencimiento de Licencia</Label>
            <Input
              id="licenseExpiry"
              type="date"
              {...form.register("licenseExpiry")}
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
              disabled={createDriverMutation.isPending}
            >
              {createDriverMutation.isPending ? "Guardando..." : "Guardar Conductor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
