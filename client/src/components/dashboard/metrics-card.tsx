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
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md bg-white border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#666666] text-sm font-normal">{title}</p>
            <p className="text-[32px] font-medium text-[#333333] mt-1">{value}</p>
          </div>
          <div className={`w-12 h-12 bg-[#f6f6f6] rounded-full flex items-center justify-center`}>
            <Icon size={24} className="text-[#333333]" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center">
            <span className={`text-sm ${
              trend.isPositive ? "text-[#06c167]" : "text-[#e60000]"
            }`}>
              {trend.value}
            </span>
            <span className="text-[#666666] text-sm ml-2">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
