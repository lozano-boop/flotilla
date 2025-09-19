import { Search, Bell, User, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ui/theme-toggle";

interface TopbarProps {
  collapsed?: boolean;
  onToggleSidebar?: () => void;
}

export default function Topbar({ collapsed, onToggleSidebar }: TopbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur border-b border-border z-40">
      <div className="px-3 md:px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            className="rounded-full h-10 w-10 hover:bg-muted"
          >
            <Menu size={18} />
          </Button>
          <div className="text-sm md:text-[15px] font-medium text-foreground">FlotaManager</div>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar vehículos, conductores, facturas..."
              className="pl-10 pr-4 py-2 w-[260px] md:w-[360px] bg-muted/50 border-border focus-visible:ring-1 focus-visible:ring-ring rounded-lg text-sm"
            />
            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="relative rounded-full h-10 w-10 hover:bg-muted"
            aria-label="Notificaciones"
          >
            <Bell size={20} className="text-foreground" />
            <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
              <User className="text-primary-foreground" size={18} />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-foreground font-medium text-sm">Juan Pérez</span>
              <span className="text-muted-foreground text-xs">Administrador</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
