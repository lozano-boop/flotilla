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
import { Upload, FileText, X, Camera, Image } from "lucide-react";
import { useState, useRef } from "react";

interface DriverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DriverModal({ open, onOpenChange }: DriverModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<{
    license: {filename: string, originalName: string, path: string} | null,
    addressProof: {filename: string, originalName: string, path: string} | null,
    ine: {filename: string, originalName: string, path: string} | null
  }>({
    license: null,
    addressProof: null,
    ine: null
  });
  
  const [isUploading, setIsUploading] = useState({
    license: false,
    addressProof: false,
    ine: false
  });
  
  const licenseFileRef = useRef<HTMLInputElement>(null);
  const addressProofFileRef = useRef<HTMLInputElement>(null);
  const ineFileRef = useRef<HTMLInputElement>(null);

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
      licensePdf: null,
      addressProofPdf: null,
      inePdf: null,
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, documentType }: { file: File, documentType: 'license' | 'addressProof' | 'ine' }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }
      
      return { data: await response.json(), documentType };
    },
    onSuccess: ({ data, documentType }) => {
      setUploadedFiles(prev => ({
        ...prev,
        [documentType]: data
      }));
      
      // Update form values
      if (documentType === 'license') {
        form.setValue('licensePdf', data.path);
      } else if (documentType === 'addressProof') {
        form.setValue('addressProofPdf', data.path);
      } else if (documentType === 'ine') {
        form.setValue('inePdf', data.path);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo subir el archivo",
        variant: "destructive",
      });
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
      setUploadedFiles({ license: null, addressProof: null, ine: null });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el conductor",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, documentType: 'license' | 'addressProof' | 'ine') => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Solo se permiten archivos PDF, JPG, PNG o WebP",
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
      
      setIsUploading(prev => ({ ...prev, [documentType]: true }));
      uploadFileMutation.mutate({ file, documentType }, {
        onSettled: () => setIsUploading(prev => ({ ...prev, [documentType]: false }))
      });
    }
  };

  const removeFile = (documentType: 'license' | 'addressProof' | 'ine') => {
    setUploadedFiles(prev => ({ ...prev, [documentType]: null }));
    
    if (documentType === 'license') {
      form.setValue('licensePdf', null);
      if (licenseFileRef.current) licenseFileRef.current.value = '';
    } else if (documentType === 'addressProof') {
      form.setValue('addressProofPdf', null);
      if (addressProofFileRef.current) addressProofFileRef.current.value = '';
    } else if (documentType === 'ine') {
      form.setValue('inePdf', null);
      if (ineFileRef.current) ineFileRef.current.value = '';
    }
  };

  const onSubmit = (data: InsertDriver) => {
    createDriverMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

          {/* Document Upload Section */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-gray-900">Documentos</h4>
            
            {/* License Document */}
            <div>
              <Label htmlFor="licensePdf">Licencia de Conducir</Label>
              <div className="mt-1">
                {!uploadedFiles.license ? (
                  <div className="flex items-center space-x-2">
                    <input
                      ref={licenseFileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileUpload(e, 'license')}
                      className="hidden"
                      id="licensePdf"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => licenseFileRef.current?.click()}
                      disabled={isUploading.license}
                      className="flex items-center space-x-2"
                    >
                      <Upload size={16} />
                      <span>{isUploading.license ? "Subiendo..." : "Subir Archivo"}</span>
                    </Button>
                    <span className="text-sm text-gray-500">PDF, JPG, PNG (máx. 5MB)</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText size={16} className="text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        {uploadedFiles.license.originalName}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile('license')}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Address Proof Document */}
            <div>
              <Label htmlFor="addressProofPdf">Comprobante de Domicilio</Label>
              <div className="mt-1">
                {!uploadedFiles.addressProof ? (
                  <div className="flex items-center space-x-2">
                    <input
                      ref={addressProofFileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileUpload(e, 'addressProof')}
                      className="hidden"
                      id="addressProofPdf"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addressProofFileRef.current?.click()}
                      disabled={isUploading.addressProof}
                      className="flex items-center space-x-2"
                    >
                      <Upload size={16} />
                      <span>{isUploading.addressProof ? "Subiendo..." : "Subir Archivo"}</span>
                    </Button>
                    <span className="text-sm text-gray-500">PDF, JPG, PNG (máx. 5MB)</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText size={16} className="text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        {uploadedFiles.addressProof.originalName}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile('addressProof')}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* INE Document */}
            <div>
              <Label htmlFor="inePdf">Identificación (INE)</Label>
              <div className="mt-1">
                {!uploadedFiles.ine ? (
                  <div className="flex items-center space-x-2">
                    <input
                      ref={ineFileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileUpload(e, 'ine')}
                      className="hidden"
                      id="inePdf"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => ineFileRef.current?.click()}
                      disabled={isUploading.ine}
                      className="flex items-center space-x-2"
                    >
                      <Upload size={16} />
                      <span>{isUploading.ine ? "Subiendo..." : "Subir Archivo"}</span>
                    </Button>
                    <span className="text-sm text-gray-500">PDF, JPG, PNG (máx. 5MB)</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText size={16} className="text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        {uploadedFiles.ine.originalName}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile('ine')}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}
              </div>
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
