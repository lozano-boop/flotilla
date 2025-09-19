import { Link, useLocation } from "wouter";
import { 
  Truck, 
  Car, 
  Calculator, 
  Wrench, 
  Users, 
  FileText,
  Settings,
  LogOut,
  BarChart3,
  Receipt,
  PieChart,
  Building2,
  CreditCard
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Vehículos", href: "/vehicles", icon: Car },
  { name: "Contabilidad", href: "/accounting", icon: Calculator },
  { name: "Facturación", href: "/invoicing", icon: Receipt },
  { name: "Reportes Fiscales", href: "/tax-reports", icon: PieChart },
  { name: "Papel de Trabajo", href: "/workpapers", icon: FileText },
  { name: "Planes y Precios", href: "/pricing", icon: CreditCard },
  { name: "Proveedores", href: "/suppliers", icon: Building2 },
  { name: "Mantenimiento", href: "/maintenance", icon: Wrench },
  { name: "Conductores", href: "/drivers", icon: Users },
  { name: "Documentación", href: "/documents", icon: FileText },
];

interface SidebarProps {
  collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const [location] = useLocation();

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-64"} bg-sidebar text-sidebar-foreground flex-shrink-0 h-screen fixed left-0 border-r border-sidebar-border transition-all duration-300`}
    >
      <div className={`py-5 ${collapsed ? "px-3" : "px-6"}`}>
        <h1 className="text-[18px] font-semibold flex items-center tracking-tight">
          <Truck className="mr-0 text-sidebar-foreground" size={22} />
          {!collapsed && <span className="ml-2">FlotaManager</span>}
        </h1>
      </div>

      <nav className="mt-2">
        <div className="px-2">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={`flex items-center ${collapsed ? "px-3 justify-center" : "px-4"} py-2.5 rounded-md font-normal transition-colors duration-150 group ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <item.icon
                      className={`${collapsed ? "mr-0" : "mr-3"} ${
                        isActive
                          ? "text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground"
                      }`}
                      size={18}
                    />
                    {!collapsed && <span className="text-[13px]">{item.name}</span>}
                  </a>
                </Link>
              );
            })}
          </div>
        </div>
        <div className={`mt-auto ${collapsed ? "px-2" : "px-2"} absolute bottom-6 w-full`}>
          <div className="border-t border-sidebar-border pt-3">
            <Link href="/settings">
              <a className={`flex items-center ${collapsed ? "px-3 justify-center" : "px-4"} py-2.5 text-sidebar-foreground/70 hover:bg-sidebar-accent rounded-md font-normal transition-colors duration-150 group hover:text-sidebar-accent-foreground`}>
                <Settings className={`${collapsed ? "mr-0" : "mr-3"}`} size={18} />
                {!collapsed && <span className="text-[13px]">Configuración</span>}
              </a>
            </Link>

            <button 
              onClick={() => {
                localStorage.removeItem("isAuthenticated");
                localStorage.removeItem("userRfc");
                window.location.href = "/login";
              }}
              className={`w-full flex items-center ${collapsed ? "px-3 justify-center" : "px-4"} py-2.5 text-sidebar-foreground/70 hover:bg-sidebar-accent rounded-md font-normal transition-colors duration-150 group hover:text-sidebar-accent-foreground mt-1`}
            >
              <LogOut className={`${collapsed ? "mr-0" : "mr-3"}`} size={18} />
              {!collapsed && <span className="text-[13px]">Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </nav>
    </aside>
  );
}
