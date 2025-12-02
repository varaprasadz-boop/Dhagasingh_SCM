import { AppSidebar } from "../AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/AuthContext";

export default function AppSidebarExample() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <div className="flex h-[400px] border rounded-lg overflow-hidden">
          <AppSidebar />
          <div className="flex-1 p-4 bg-background">
            <p className="text-muted-foreground">Main content area</p>
          </div>
        </div>
      </SidebarProvider>
    </AuthProvider>
  );
}
