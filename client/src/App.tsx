import { Switch, Route } from "wouter";
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
import Sidebar from "@/components/layout/sidebar";

function Router() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/vehicles" component={Vehicles} />
          <Route path="/accounting" component={Accounting} />
          <Route path="/maintenance" component={Maintenance} />
          <Route path="/drivers" component={Drivers} />
          <Route path="/documents" component={Documents} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
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
