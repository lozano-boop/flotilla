import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, UserPlus, AlertTriangle, DollarSign } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "maintenance",
    title: "Mantenimiento completado - Veh. ABC-123",
    description: "Cambio de aceite y filtros realizado",
    timestamp: "Hace 2 horas",
    icon: Wrench,
    iconBg: "bg-success bg-opacity-10 text-success"
  },
  {
    id: 2,
    type: "driver",
    title: "Nuevo conductor registrado",
    description: "María González agregada al sistema",
    timestamp: "Hace 4 horas",
    icon: UserPlus,
    iconBg: "bg-primary bg-opacity-10 text-primary"
  },
  {
    id: 3,
    type: "warning",
    title: "Documento próximo a vencer",
    description: "Licencia de Carlos Ruiz vence en 15 días",
    timestamp: "Hace 1 día",
    icon: AlertTriangle,
    iconBg: "bg-warning bg-opacity-10 text-warning"
  },
  {
    id: 4,
    type: "expense",
    title: "Gasto registrado",
    description: "Combustible - $1,250.00",
    timestamp: "Hace 2 días",
    icon: DollarSign,
    iconBg: "bg-error bg-opacity-10 text-error"
  }
];

export default function ActivityFeed() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Actividad Reciente</h3>
        <Button variant="ghost" size="sm" className="text-primary hover:text-blue-600">
          Ver todas
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4">
              <div className={`w-10 h-10 ${activity.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <activity.icon size={16} />
              </div>
              <div className="flex-1">
                <p className="text-gray-800 font-medium">{activity.title}</p>
                <p className="text-gray-600 text-sm">{activity.description}</p>
                <p className="text-gray-500 text-xs mt-1">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
