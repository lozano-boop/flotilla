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
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-800">Estado de la Flotilla</h3>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {statusItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 ${item.color} rounded-full mr-3`}></div>
                <span className="text-gray-700">{item.label}</span>
              </div>
              <span className="font-semibold text-gray-800">{item.value}</span>
            </div>
          ))}
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Disponibilidad</span>
              <span className="text-sm font-semibold text-gray-800">
                {availability.toFixed(1)}%
              </span>
            </div>
            <Progress value={availability} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
