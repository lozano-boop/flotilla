import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { type InsertInvoice } from "@shared/schema";

const invoiceSchema = z.object({
  folio: z.string().min(1, "El folio es requerido"),
  series: z.string().optional(),
  clientRfc: z.string().min(12, "RFC debe tener al menos 12 caracteres"),
  clientName: z.string().min(1, "El nombre del cliente es requerido"),
  clientAddress: z.string().optional(),
  paymentMethod: z.string().min(1, "Método de pago es requerido"),
  paymentForm: z.string().min(1, "Forma de pago es requerida"),
  cfdiUse: z.string().min(1, "Uso de CFDI es requerido"),
  currency: z.string().default("MXN"),
  issueDate: z.string().min(1, "La fecha es requerida"),
  dueDate: z.string().optional(),
});

const invoiceItemSchema = z.object({
  productCode: z.string().min(1, "Código de producto requerido"),
  unitCode: z.string().min(1, "Unidad requerida"),
  description: z.string().min(1, "Descripción requerida"),
  quantity: z.number().min(0.01, "Cantidad debe ser mayor a 0"),
  unitPrice: z.number().min(0.01, "Precio debe ser mayor a 0"),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;
type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>;

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InvoiceModal({ open, onOpenChange }: InvoiceModalProps) {
  const [items, setItems] = useState<InvoiceItemFormData[]>([
    {
      productCode: "84111506",
      unitCode: "E48",
      description: "Servicio de transporte",
      quantity: 1,
      unitPrice: 0,
    },
  ]);

  const queryClient = useQueryClient();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      folio: "",
      series: "A",
      clientRfc: "",
      clientName: "",
      clientAddress: "",
      paymentMethod: "01", // Efectivo
      paymentForm: "PUE", // Pago en una sola exhibición
      cfdiUse: "G01", // Adquisición de mercancías
      currency: "MXN",
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: "",
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InsertInvoice & { items: InvoiceItemFormData[] }) => {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al crear la factura");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      onOpenChange(false);
      form.reset();
      setItems([{
        productCode: "84111506",
        unitCode: "E48",
        description: "Servicio de transporte",
        quantity: 1,
        unitPrice: 0,
      }]);
    },
  });

  const addItem = () => {
    setItems([...items, {
      productCode: "",
      unitCode: "E48",
      description: "",
      quantity: 1,
      unitPrice: 0,
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItemFormData, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.16; // IVA 16%
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const onSubmit = (data: InvoiceFormData) => {
    const { subtotal, tax, total } = calculateTotals();
    
    const invoiceData: InsertInvoice & { items: InvoiceItemFormData[] } = {
      ...data,
      subtotal: subtotal.toString(),
      tax: tax.toString(),
      total: total.toString(),
      issueDate: new Date(data.issueDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      items,
    };

    createInvoiceMutation.mutate(invoiceData);
  };

  const { subtotal, tax, total } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Factura CFDI 4.0</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Datos de la factura */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datos de la Factura</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="series">Serie</Label>
                <Input
                  id="series"
                  {...form.register("series")}
                  placeholder="A"
                />
              </div>
              <div>
                <Label htmlFor="folio">Folio *</Label>
                <Input
                  id="folio"
                  {...form.register("folio")}
                  placeholder="001"
                />
                {form.formState.errors.folio && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.folio.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="issueDate">Fecha de Emisión *</Label>
                <Input
                  id="issueDate"
                  type="date"
                  {...form.register("issueDate")}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...form.register("dueDate")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Datos del cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datos del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientRfc">RFC del Cliente *</Label>
                <Input
                  id="clientRfc"
                  {...form.register("clientRfc")}
                  placeholder="XAXX010101000"
                  className="uppercase"
                />
                {form.formState.errors.clientRfc && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.clientRfc.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="clientName">Razón Social *</Label>
                <Input
                  id="clientName"
                  {...form.register("clientName")}
                  placeholder="Nombre del cliente"
                />
                {form.formState.errors.clientName && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.clientName.message}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="clientAddress">Dirección</Label>
                <Textarea
                  id="clientAddress"
                  {...form.register("clientAddress")}
                  placeholder="Dirección del cliente"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Datos fiscales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datos Fiscales</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="paymentMethod">Método de Pago *</Label>
                <Select onValueChange={(value) => form.setValue("paymentMethod", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="01">01 - Efectivo</SelectItem>
                    <SelectItem value="02">02 - Cheque nominativo</SelectItem>
                    <SelectItem value="03">03 - Transferencia electrónica</SelectItem>
                    <SelectItem value="04">04 - Tarjeta de crédito</SelectItem>
                    <SelectItem value="28">28 - Tarjeta de débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentForm">Forma de Pago *</Label>
                <Select onValueChange={(value) => form.setValue("paymentForm", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUE">PUE - Pago en una exhibición</SelectItem>
                    <SelectItem value="PPD">PPD - Pago en parcialidades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cfdiUse">Uso de CFDI *</Label>
                <Select onValueChange={(value) => form.setValue("cfdiUse", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="G01">G01 - Adquisición de mercancías</SelectItem>
                    <SelectItem value="G02">G02 - Devoluciones, descuentos</SelectItem>
                    <SelectItem value="G03">G03 - Gastos en general</SelectItem>
                    <SelectItem value="I04">I04 - Construcciones, instalaciones</SelectItem>
                    <SelectItem value="P01">P01 - Por definir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Conceptos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Conceptos</CardTitle>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Concepto
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Concepto {index + 1}</h4>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeItem(index)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <Label>Código SAT</Label>
                      <Input
                        value={item.productCode}
                        onChange={(e) => updateItem(index, "productCode", e.target.value)}
                        placeholder="84111506"
                      />
                    </div>
                    <div>
                      <Label>Unidad</Label>
                      <Select
                        value={item.unitCode}
                        onValueChange={(value) => updateItem(index, "unitCode", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="E48">E48 - Unidad de servicio</SelectItem>
                          <SelectItem value="H87">H87 - Pieza</SelectItem>
                          <SelectItem value="KGM">KGM - Kilogramo</SelectItem>
                          <SelectItem value="LTR">LTR - Litro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Cantidad</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Precio Unitario</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Importe</Label>
                      <Input
                        value={`$${(item.quantity * item.unitPrice).toFixed(2)}`}
                        disabled
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Descripción</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      placeholder="Descripción del servicio o producto"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Totales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-right">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA (16%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${total.toFixed(2)} MXN</span>
                </div>
              </div>
            </CardContent>
          </Card>

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
              disabled={createInvoiceMutation.isPending}
              className="bg-primary hover:bg-blue-600 text-white"
            >
              {createInvoiceMutation.isPending ? "Creando..." : "Crear Factura"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
