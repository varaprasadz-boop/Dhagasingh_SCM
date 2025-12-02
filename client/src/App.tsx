import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MobileProvider, useMobile } from "@/contexts/MobileContext";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileBottomNav } from "@/components/MobileBottomNav";

import Dashboard from "@/pages/Dashboard";
import Orders from "@/pages/Orders";
import Inventory from "@/pages/Inventory";
import Products from "@/pages/Products";
import Suppliers from "@/pages/Suppliers";
import Couriers from "@/pages/Couriers";
import Complaints from "@/pages/Complaints";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import InternalDelivery from "@/pages/InternalDelivery";
import UserManagement from "@/pages/UserManagement";
import NotFound from "@/pages/not-found";

import MobileDashboard from "@/pages/MobileDashboard";
import MobileOrders from "@/pages/MobileOrders";
import MobileStock from "@/pages/MobileStock";
import MobileScan from "@/pages/MobileScan";
import MobileProfile from "@/pages/MobileProfile";

function DesktopRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/orders" component={Orders} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/products" component={Products} />
      <Route path="/suppliers" component={Suppliers} />
      <Route path="/couriers" component={Couriers} />
      <Route path="/complaints" component={Complaints} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/internal-delivery" component={InternalDelivery} />
      <Route path="/users" component={UserManagement} />
      <Route component={NotFound} />
    </Switch>
  );
}

function MobileRouter() {
  return (
    <Switch>
      <Route path="/" component={MobileDashboard} />
      <Route path="/scan" component={MobileScan} />
      <Route path="/orders" component={MobileOrders} />
      <Route path="/stock" component={MobileStock} />
      <Route path="/profile" component={MobileProfile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function DesktopLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 px-4 py-2 border-b bg-background shrink-0 sticky top-0 z-40">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <DesktopRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function MobileLayout() {
  return (
    <div className="min-h-screen bg-background">
      <MobileRouter />
      <MobileBottomNav />
    </div>
  );
}

function AppContent() {
  const { isMobileView } = useMobile();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">DS_SCM</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return isMobileView ? <MobileLayout /> : <DesktopLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <MobileProvider>
            <TooltipProvider>
              <AppContent />
              <Toaster />
            </TooltipProvider>
          </MobileProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
