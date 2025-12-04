import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  rolePermissions: { permission: Permission }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  roleId: string | null;
  status: "active" | "inactive";
  isSuperAdmin: boolean;
  role: Role | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        const user = data.user;
        setUser(user);
        
        // Extract permissions directly from the user response
        setIsSuperAdmin(user.isSuperAdmin || false);
        
        if (user.isSuperAdmin) {
          setPermissions([]);
        } else if (user.role?.rolePermissions) {
          const perms = user.role.rolePermissions.map(
            (rp: { permission: { code: string } }) => rp.permission.code
          );
          setPermissions(perms);
        } else {
          setPermissions([]);
        }
      } else {
        setUser(null);
        setPermissions([]);
        setIsSuperAdmin(false);
      }
    } catch (error) {
      setUser(null);
      setPermissions([]);
      setIsSuperAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      const user = data.user;
      setUser(user);
      
      // Extract permissions directly from the login response
      // The login response includes isSuperAdmin and role with rolePermissions
      setIsSuperAdmin(user.isSuperAdmin || false);
      
      if (user.isSuperAdmin) {
        // Super admin has all permissions - we'll handle this in hasPermission
        setPermissions([]);
      } else if (user.role?.rolePermissions) {
        // Extract permission codes from role
        const perms = user.role.rolePermissions.map(
          (rp: { permission: { code: string } }) => rp.permission.code
        );
        setPermissions(perms);
      } else {
        setPermissions([]);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "Connection failed" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setPermissions([]);
      setIsSuperAdmin(false);
    }
  };

  const hasPermission = (permission: string) => {
    if (isSuperAdmin) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (...requiredPermissions: string[]) => {
    if (isSuperAdmin) return true;
    return requiredPermissions.some(p => permissions.includes(p));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        permissions,
        isSuperAdmin,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
