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
import { Upload, FileText, X } from "lucide-react";
import { useState, useRef } from "react";

interface VehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VehicleModal({ open, onOpenChange }: VehicleModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedFile, setUploadedFile] = useState<{filename: string, originalName: string, path: string} | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      insurancePdf: null,
      insuranceExpiry: null,
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setUploadedFile(data);
      form.setValue('insurancePdf', data.path);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo subir el archivo PDF",
        variant: "destructive",
      });
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
      setUploadedFile(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el vehículo",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Error",
          description: "Solo se permiten archivos PDF",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo es demasiado grande (máximo 5MB)",
          variant: "destructive",
        });
        return;
      }
      
      setIsUploading(true);
      uploadFileMutation.mutate(file, {
        onSettled: () => setIsUploading(false)
      });
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    form.setValue('insurancePdf', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

          <div>
            <Label htmlFor="insuranceExpiry">Vencimiento del Seguro</Label>
            <Input
              id="insuranceExpiry"
              type="date"
              {...form.register("insuranceExpiry")}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="insurancePdf">PDF del Seguro</Label>
            <div className="mt-1">
              {!uploadedFile ? (
                <div className="flex items-center space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="insurancePdf"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center space-x-2"
                  >
                    <Upload size={16} />
                    <span>{isUploading ? "Subiendo..." : "Subir PDF"}</span>
                  </Button>
                  <span className="text-sm text-gray-500">Máximo 5MB</span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {uploadedFile.originalName}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X size={16} />
                  </Button>
                </div>
              )}
            </div>
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
