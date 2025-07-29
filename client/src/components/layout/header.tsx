import { Search, Bell, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
            <p className="text-gray-600 text-sm">{subtitle}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input 
                type="text" 
                placeholder="Buscar..." 
                className="pl-10 pr-4 py-2 w-64"
              />
              <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            </div>
            
            <Button variant="ghost" size="sm" className="relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="text-white" size={16} />
              </div>
              <span className="text-gray-700 font-medium">Juan Pérez</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
