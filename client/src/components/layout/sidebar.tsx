import { Link, useLocation } from "wouter";
import { useState } from "react";
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
  ChevronDown,
  ChevronRight
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Vehículos", href: "/vehicles", icon: Car },
  { 
    name: "Contabilidad", 
    icon: Calculator,
    submenu: [
      { name: "Contabilidad General", href: "/accounting", icon: Calculator },
      { name: "Facturación", href: "/invoicing", icon: Receipt },
      { name: "Papeles de Trabajo", href: "/workpapers", icon: FileText },
      { name: "Reportes Fiscales", href: "/tax-reports", icon: PieChart },
    ]
  },
  { name: "Proveedores", href: "/suppliers", icon: Building2 },
  { name: "Mantenimiento", href: "/maintenance", icon: Wrench },
  { name: "Conductores", href: "/drivers", icon: Users },
];

interface SidebarProps {
  collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const [location] = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const isSubmenuActive = (submenu: any[]) => {
    return submenu.some(item => location === item.href);
  };

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
              if (item.submenu) {
                const isExpanded = expandedMenus.includes(item.name);
                const hasActiveSubmenu = isSubmenuActive(item.submenu);
                
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => !collapsed && toggleSubmenu(item.name)}
                      className={`w-full flex items-center ${collapsed ? "px-3 justify-center" : "px-4 justify-between"} py-2.5 rounded-md font-normal transition-colors duration-150 group ${
                        hasActiveSubmenu
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon
                          className={`${collapsed ? "mr-0" : "mr-3"} ${
                            hasActiveSubmenu
                              ? "text-sidebar-primary-foreground"
                              : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground"
                          }`}
                          size={18}
                        />
                        {!collapsed && <span className="text-[13px]">{item.name}</span>}
                      </div>
                      {!collapsed && (
                        isExpanded ? 
                          <ChevronDown size={14} className="text-sidebar-foreground/50" /> :
                          <ChevronRight size={14} className="text-sidebar-foreground/50" />
                      )}
                    </button>
                    
                    {!collapsed && isExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.submenu.map((subItem) => {
                          const isActive = location === subItem.href;
                          return (
                            <Link key={subItem.name} href={subItem.href}>
                              <a
                                className={`flex items-center px-4 py-2 rounded-md font-normal transition-colors duration-150 group text-[12px] ${
                                  isActive
                                    ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                }`}
                              >
                                <subItem.icon
                                  className={`mr-3 ${
                                    isActive
                                      ? "text-sidebar-primary-foreground"
                                      : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground"
                                  }`}
                                  size={16}
                                />
                                <span>{subItem.name}</span>
                              </a>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              } else {
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
              }
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
