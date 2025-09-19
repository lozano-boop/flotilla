import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface FleetStatusProps {
  activeVehicles: number;
  maintenanceVehicles: number;
  outOfServiceVehicles: number;
  availability: number;
}

export default function FleetStatus({ 
  activeVehicles, 
  maintenanceVehicles, 
  outOfServiceVehicles,
  availability 
}: FleetStatusProps) {
  const statusItems = [
    {
      label: "Activos",
      value: activeVehicles,
      color: "bg-success"
    },
    {
      label: "En Mantenimiento",
      value: maintenanceVehicles,  
      color: "bg-warning"
    },
    {
      label: "Fuera de Servicio",
      value: outOfServiceVehicles,
      color: "bg-error"
    }
  ];

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader className="border-b px-6 py-4">
        <h3 className="text-[18px] font-medium text-[#333333] flex items-center justify-between">
          Estado de la Flotilla
          <span className="text-xs font-normal text-[#666666] bg-[#f6f6f6] px-2 py-1 rounded">Actualizado</span>
        </h3>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          {statusItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className={`w-2 h-2 ${
                  item.color === 'bg-success' ? 'bg-[#06c167]' : 
                  item.color === 'bg-warning' ? 'bg-[#ffbe0b]' : 
                  'bg-[#e60000]'
                } rounded-full mr-3`}></div>
                <span className="text-[#333333] text-sm">{item.label}</span>
              </div>
              <span className="font-medium text-[#333333]">{item.value}</span>
            </div>
          ))}
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#666666]">Disponibilidad Total</span>
              <span className="text-[18px] font-medium text-[#333333]">
                {availability.toFixed(1)}%
              </span>
            </div>
            <div className="relative">
              <Progress 
                value={availability} 
                className="h-2 rounded-full" 
                style={{
                  backgroundColor: '#f6f6f6',
                  '--progress-background': '#000000'
                } as any}
              />
              <div className="absolute -bottom-5 left-0 w-full flex justify-between text-xs text-[#666666]">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
