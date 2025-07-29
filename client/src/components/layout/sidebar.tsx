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
  BarChart3
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Vehículos", href: "/vehicles", icon: Car },
  { name: "Contabilidad", href: "/accounting", icon: Calculator },
  { name: "Mantenimiento", href: "/maintenance", icon: Wrench },
  { name: "Conductores", href: "/drivers", icon: Users },
  { name: "Documentación", href: "/documents", icon: FileText },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-lg flex-shrink-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">
          <Truck className="inline mr-2" size={24} />
          FlotaManager
        </h1>
      </div>
      
      <nav className="mt-6">
        <div className="px-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive
                        ? "text-primary bg-blue-50"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon className="mr-3" size={20} />
                    {item.name}
                  </a>
                </Link>
              );
            })}
          </div>
        </div>
        
        <div className="mt-8 px-4">
          <div className="border-t pt-4">
            <Link href="/settings">
              <a className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                <Settings className="mr-3" size={20} />
                Configuración
              </a>
            </Link>
            
            <button className="w-full flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
              <LogOut className="mr-3" size={20} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>
    </aside>
  );
}
