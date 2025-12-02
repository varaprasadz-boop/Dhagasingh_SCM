import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useMobile } from "@/contexts/MobileContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Moon, Sun, Monitor, LogOut, User, Shield, Smartphone } from "lucide-react";

const roleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  warehouse: "Warehouse",
  customer_support: "Customer Support",
  stock_management: "Stock Management",
};

export default function MobileProfile() {
  const { user, setRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isMobileView, setMobileView } = useMobile();

  if (!user) return null;

  return (
    <div className="pb-20 p-4 space-y-4">
      <h1 className="text-xl font-bold">Profile</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-primary font-medium mt-1">
                {roleLabels[user.role]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Role (Demo)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={user.role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger data-testid="select-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrator</SelectItem>
              <SelectItem value="warehouse">Warehouse</SelectItem>
              <SelectItem value="customer_support">Customer Support</SelectItem>
              <SelectItem value="stock_management">Stock Management</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            Switch roles to see different access levels
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === "dark" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span>Dark Mode</span>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
              data-testid="switch-theme"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span>Mobile View</span>
            </div>
            <Switch
              checked={isMobileView}
              onCheckedChange={setMobileView}
              data-testid="switch-mobile-view"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>DS_SCM - Supply Chain Management</p>
          <p>Version 1.0.0</p>
          <p>PWA enabled for offline access</p>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full"
        onClick={logout}
        data-testid="button-logout-mobile"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </div>
  );
}
