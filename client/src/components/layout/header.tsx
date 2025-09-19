import { Search, Bell, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="bg-white border-b sticky top-0 z-50 ml-64">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[28px] font-medium text-[#333333]">
              {title}
            </h2>
            <p className="text-[#666666] text-sm mt-1">{subtitle}</p>
          </div>
          
          <div className="flex items-center space-x-8">
            <div className="relative">
              <Input 
                type="text" 
                placeholder="Buscar..." 
                className="pl-10 pr-4 py-2 w-[320px] border-gray-300 focus:border-black focus:ring-black transition-all duration-200 rounded-lg text-sm"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative hover:bg-gray-100 transition-colors duration-200 rounded-full h-10 w-10"
            >
              <Bell size={20} className="text-[#333333]" />
              <span className="absolute top-1 right-1 bg-[#e60000] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span>
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#333333] rounded-full flex items-center justify-center">
                <User className="text-white" size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[#333333] font-medium text-sm">Juan Pérez</span>
                <span className="text-[#666666] text-xs">Administrador</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
