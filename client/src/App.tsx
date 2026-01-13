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
import CourierStatus from "@/pages/CourierStatus";
import Complaints from "@/pages/Complaints";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import InternalDelivery from "@/pages/InternalDelivery";
import UserManagement from "@/pages/UserManagement";
import RolesManagement from "@/pages/RolesManagement";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

import MobileDashboard from "@/pages/MobileDashboard";
import MobileOrders from "@/pages/MobileOrders";
import MobileStock from "@/pages/MobileStock";
import MobileScan from "@/pages/MobileScan";
import MobileProfile from "@/pages/MobileProfile";

import B2BDashboard from "@/pages/b2b/B2BDashboard";
import B2BClients from "@/pages/b2b/B2BClients";
import B2BOrders from "@/pages/b2b/B2BOrders";
import B2BOrderDetail from "@/pages/b2b/B2BOrderDetail";
import B2BInvoices from "@/pages/b2b/B2BInvoices";
import B2BPayments from "@/pages/b2b/B2BPayments";
import ReceiveStock from "@/pages/ReceiveStock";

function DesktopRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/orders" component={Orders} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/inventory/receive-stock" component={ReceiveStock} />
      <Route path="/products" component={Products} />
      <Route path="/suppliers" component={Suppliers} />
      <Route path="/couriers" component={Couriers} />
      <Route path="/courier-status" component={CourierStatus} />
      <Route path="/complaints" component={Complaints} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/internal-delivery" component={InternalDelivery} />
      <Route path="/users" component={UserManagement} />
      <Route path="/roles" component={RolesManagement} />
      <Route path="/b2b" component={B2BDashboard} />
      <Route path="/b2b/clients" component={B2BClients} />
      <Route path="/b2b/orders" component={B2BOrders} />
      <Route path="/b2b/orders/:id" component={B2BOrderDetail} />
      <Route path="/b2b/invoices" component={B2BInvoices} />
      <Route path="/b2b/payments" component={B2BPayments} />
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
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">DS_SCM</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
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
