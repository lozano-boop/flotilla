import { Switch, Route } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Vehicles from "@/pages/vehicles";
import Accounting from "@/pages/accounting";
import Maintenance from "@/pages/maintenance";
import Drivers from "@/pages/drivers";
import Documents from "@/pages/documents";
import Invoicing from "@/pages/invoicing";
import TaxReports from "@/pages/tax-reports";
import Suppliers from "@/pages/suppliers";
import Workpapers from "@/pages/workpapers";
import Settings from "@/pages/settings";
import LoginPage from "@/pages/login";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";

function AuthenticatedApp() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen bg-background text-foreground">
      <Sidebar collapsed={sidebarCollapsed} />
      <div
        className={`overflow-hidden transition-all duration-300 ${
          sidebarCollapsed ? "pl-16" : "pl-64"
        }`}
      >
        <Topbar
          collapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
        />
        <div className="pt-16 h-[calc(100vh-0px)] overflow-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/vehicles" component={Vehicles} />
            <Route path="/accounting" component={Accounting} />
            <Route path="/invoicing" component={Invoicing} />
            <Route path="/tax-reports" component={TaxReports} />
            <Route path="/workpapers" component={Workpapers} />
            <Route path="/suppliers" component={Suppliers} />
            <Route path="/maintenance" component={Maintenance} />
            <Route path="/drivers" component={Drivers} />
            <Route path="/documents" component={Documents} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </div>
    </div>
  );
}

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem("isAuthenticated");
      setIsAuthenticated(authStatus === "true");
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando FlotillaManager...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route>
        {isAuthenticated ? <AuthenticatedApp /> : <LoginPage />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
