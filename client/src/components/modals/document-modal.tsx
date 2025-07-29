import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDriverDocumentSchema, type InsertDriverDocument, type Driver } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DocumentModal({ open, onOpenChange }: DocumentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const form = useForm<InsertDriverDocument>({
    resolver: zodResolver(insertDriverDocumentSchema),
    defaultValues: {
      driverId: "",
      type: "",
      documentNumber: "",
      issueDate: "",
      expiryDate: "",
      status: "valid",
      filePath: null,
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data: InsertDriverDocument) => {
      const response = await apiRequest("POST", "/api/driver-documents", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/driver-documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Éxito",
        description: "Documento registrado correctamente",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar el documento",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertDriverDocument) => {
    createDocumentMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Documento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="driverId">Conductor</Label>
            <Select onValueChange={(value) => form.setValue("driverId", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecciona un conductor..." />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name} - {driver.licenseNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.driverId && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.driverId.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="type">Tipo de Documento</Label>
            <Select onValueChange={(value) => form.setValue("type", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="license">Licencia de Conducir</SelectItem>
                <SelectItem value="medical_certificate">Certificado Médico</SelectItem>
                <SelectItem value="insurance">Seguro</SelectItem>
                <SelectItem value="identification">Identificación</SelectItem>
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
            <Label htmlFor="documentNumber">Número de Documento</Label>
            <Input
              id="documentNumber"
              placeholder="Ej: 12345678"
              {...form.register("documentNumber")}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="issueDate">Fecha de Expedición</Label>
            <Input
              id="issueDate"
              type="date"
              {...form.register("issueDate")}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="expiryDate">Fecha de Vencimiento</Label>
            <Input
              id="expiryDate"
              type="date"
              {...form.register("expiryDate")}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="status">Estado</Label>
            <Select onValueChange={(value) => form.setValue("status", value)} defaultValue="valid">
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar estado..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="valid">Válido</SelectItem>
                <SelectItem value="expired">Vencido</SelectItem>
                <SelectItem value="expiring_soon">Por vencer</SelectItem>
              </SelectContent>
            </Select>
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
              disabled={createDocumentMutation.isPending}
            >
              {createDocumentMutation.isPending ? "Guardando..." : "Registrar Documento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
