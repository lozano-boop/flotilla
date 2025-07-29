import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  iconBgColor: string;
}

export default function MetricsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  iconBgColor 
}: MetricsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
          </div>
          <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
            <Icon size={24} />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center">
            <span className={`text-sm font-medium ${
              trend.isPositive ? "text-success" : "text-error"
            }`}>
              {trend.value}
            </span>
            <span className="text-gray-600 text-sm ml-2">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
