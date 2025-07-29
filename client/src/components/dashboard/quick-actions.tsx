import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wrench, Receipt, UserPlus, ChevronRight } from "lucide-react";

interface QuickActionsProps {
  onNewVehicle: () => void;
  onNewMaintenance: () => void;
  onNewExpense: () => void;
  onNewDriver: () => void;
}

export default function QuickActions({ 
  onNewVehicle, 
  onNewMaintenance, 
  onNewExpense, 
  onNewDriver 
}: QuickActionsProps) {
  const actions = [
    {
      label: "Nuevo Vehículo",
      icon: Plus,
      onClick: onNewVehicle,
      bgColor: "bg-primary bg-opacity-5 hover:bg-opacity-10",
      iconColor: "text-primary"
    },
    {
      label: "Registrar Mantenimiento",
      icon: Wrench,
      onClick: onNewMaintenance,
      bgColor: "bg-success bg-opacity-5 hover:bg-opacity-10",
      iconColor: "text-success"
    },
    {
      label: "Nuevo Gasto",
      icon: Receipt,
      onClick: onNewExpense,
      bgColor: "bg-warning bg-opacity-5 hover:bg-opacity-10",
      iconColor: "text-warning"
    },
    {
      label: "Nuevo Conductor",
      icon: UserPlus,
      onClick: onNewDriver,
      bgColor: "bg-gray-50 hover:bg-gray-100",
      iconColor: "text-gray-600"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-800">Acciones Rápidas</h3>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              className={`w-full justify-between p-3 h-auto ${action.bgColor} transition-colors`}
              onClick={action.onClick}
            >
              <div className="flex items-center">
                <action.icon className={`mr-3 ${action.iconColor}`} size={16} />
                <span className="font-medium text-gray-800">{action.label}</span>
              </div>
              <ChevronRight className="text-gray-400" size={16} />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
