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
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", roles: ["admin", "warehouse", "customer_support", "stock_management"] },
  { icon: Package, label: "Products", path: "/products", roles: ["admin", "stock_management"] },
  { icon: ShoppingCart, label: "Orders", path: "/orders", roles: ["admin", "warehouse", "customer_support"] },
  { icon: Truck, label: "Inventory", path: "/inventory", roles: ["admin", "warehouse", "stock_management"] },
  { icon: Users, label: "Suppliers", path: "/suppliers", roles: ["admin", "stock_management"] },
  { icon: Building2, label: "Couriers", path: "/couriers", roles: ["admin", "warehouse"] },
  { icon: MessageSquare, label: "Complaints", path: "/complaints", roles: ["admin", "customer_support"] },
  { icon: FileBarChart, label: "Reports", path: "/reports", roles: ["admin"] },
  { icon: Settings, label: "Settings", path: "/settings", roles: ["admin"] },
];

const roleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  warehouse: "Warehouse",
  customer_support: "Customer Support",
  stock_management: "Stock Management",
};

export function AppSidebar() {
  const [location] = useLocation();
  const { user, setRole, logout } = useAuth();

  const filteredItems = user
    ? navItems.filter((item) => item.roles.includes(user.role))
    : [];

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
                        data-testid={`nav-${item.label.toLowerCase()}`}
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
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{roleLabels[user.role]}</p>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => setRole("admin")} data-testid="menu-role-admin">
                Switch to Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRole("warehouse")} data-testid="menu-role-warehouse">
                Switch to Warehouse
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRole("customer_support")} data-testid="menu-role-support">
                Switch to Customer Support
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRole("stock_management")} data-testid="menu-role-stock">
                Switch to Stock Management
              </DropdownMenuItem>
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
