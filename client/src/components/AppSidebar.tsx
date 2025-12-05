import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Building2,
  MessageSquare,
  FileBarChart,
  Settings,
  LogOut,
  ChevronDown,
  UserCog,
  PackageCheck,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  permission?: string;
  superAdminOnly?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", permission: "view_dashboard" },
  { icon: Package, label: "Products", path: "/products", permission: "view_products" },
  { icon: ShoppingCart, label: "Orders", path: "/orders", permission: "view_orders" },
  { icon: Truck, label: "Inventory", path: "/inventory", permission: "view_inventory" },
  { icon: PackageCheck, label: "Internal Delivery", path: "/internal-delivery", permission: "view_deliveries" },
  { icon: Users, label: "Suppliers", path: "/suppliers", permission: "view_suppliers" },
  { icon: Building2, label: "Couriers", path: "/couriers", permission: "view_couriers" },
  { icon: RefreshCw, label: "Courier Status", path: "/courier-status", permission: "manage_courier_status" },
  { icon: MessageSquare, label: "Complaints", path: "/complaints", permission: "view_complaints" },
  { icon: FileBarChart, label: "Reports", path: "/reports", permission: "view_reports" },
  { icon: UserCog, label: "Users", path: "/users", permission: "manage_users" },
  { icon: Shield, label: "Roles", path: "/roles", superAdminOnly: true },
  { icon: Settings, label: "Settings", path: "/settings", permission: "manage_settings" },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isSuperAdmin, hasPermission, logout } = useAuth();

  const filteredItems = navItems.filter((item) => {
    if (item.superAdminOnly) {
      return isSuperAdmin;
    }
    if (item.permission) {
      return hasPermission(item.permission);
    }
    return true;
  });

  const getRoleName = () => {
    if (isSuperAdmin) return "Super Admin";
    if (user?.role) return user.role.name;
    return "User";
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">DS_SCM</h1>
            <p className="text-xs text-muted-foreground">Supply Chain</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={item.path}
                        className="flex items-center gap-3"
                        data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground truncate">{getRoleName()}</p>
                    {isSuperAdmin && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1">Super</Badge>
                    )}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={logout} data-testid="menu-logout">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
