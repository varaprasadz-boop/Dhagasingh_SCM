import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Plus, Shield, Users, Settings, Loader2, Pencil, Trash2, Lock } from "lucide-react";

interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string;
}

interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission: Permission;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  rolePermissions?: RolePermission[];
}

export default function RolesManagement() {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isPermissionSheetOpen, setIsPermissionSheetOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery<Permission[]>({
    queryKey: ["/api/permissions"],
    enabled: isSuperAdmin,
  });

  const { data: roleWithPermissions, isLoading: rolePermissionsLoading } = useQuery<Role>({
    queryKey: ["/api/roles", selectedRole?.id],
    enabled: !!selectedRole?.id,
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      return apiRequest("/api/roles", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setIsCreateDialogOpen(false);
      setNewRoleName("");
      setNewRoleDescription("");
      toast({ title: "Role created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create role", description: error.message, variant: "destructive" });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      return apiRequest(`/api/roles/${roleId}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permissionIds }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/roles", selectedRole?.id] });
      toast({ title: "Permissions updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update permissions", description: error.message, variant: "destructive" });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      return apiRequest(`/api/roles/${roleId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({ title: "Role deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete role", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;
    createRoleMutation.mutate({
      name: newRoleName.trim(),
      description: newRoleDescription.trim(),
    });
  };

  const handleOpenPermissions = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionSheetOpen(true);
  };

  useEffect(() => {
    if (roleWithPermissions?.rolePermissions) {
      setSelectedPermissions(
        roleWithPermissions.rolePermissions.map(rp => rp.permission.id)
      );
    }
  }, [roleWithPermissions]);

  const handleSavePermissions = () => {
    if (!selectedRole) return;
    updatePermissionsMutation.mutate({
      roleId: selectedRole.id,
      permissionIds: selectedPermissions,
    });
  };

  const groupPermissionsByModule = (perms: Permission[]) => {
    return perms.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleModulePermissions = (modulePerms: Permission[], isChecked: boolean) => {
    if (isChecked) {
      setSelectedPermissions(prev => [...new Set([...prev, ...modulePerms.map(p => p.id)])]);
    } else {
      const modulePermIds = modulePerms.map(p => p.id);
      setSelectedPermissions(prev => prev.filter(id => !modulePermIds.includes(id)));
    }
  };

  const isModuleFullySelected = (modulePerms: Permission[]) => {
    return modulePerms.every(p => selectedPermissions.includes(p.id));
  };

  const isModulePartiallySelected = (modulePerms: Permission[]) => {
    const selected = modulePerms.filter(p => selectedPermissions.includes(p.id));
    return selected.length > 0 && selected.length < modulePerms.length;
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <Lock className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          Only Super Admins can access role management.
        </p>
      </div>
    );
  }

  if (rolesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const groupedPermissions = groupPermissionsByModule(permissions);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Manage user roles and their permissions
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-role">
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Create a custom role and assign permissions to it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  placeholder="e.g., Finance Manager"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  data-testid="input-role-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleDescription">Description</Label>
                <Textarea
                  id="roleDescription"
                  placeholder="Describe this role's responsibilities..."
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  data-testid="input-role-description"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateRole}
                disabled={!newRoleName.trim() || createRoleMutation.isPending}
                data-testid="button-save-role"
              >
                {createRoleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Role
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id} className="hover-elevate" data-testid={`card-role-${role.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                </div>
                {role.isSystem && (
                  <Badge variant="secondary">System</Badge>
                )}
              </div>
              <CardDescription className="line-clamp-2">
                {role.description || "No description"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    handleOpenPermissions(role);
                  }}
                  data-testid={`button-edit-permissions-${role.id}`}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Permissions
                </Button>
                {!role.isSystem && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => {
                      if (confirm(`Delete role "${role.name}"?`)) {
                        deleteRoleMutation.mutate(role.id);
                      }
                    }}
                    data-testid={`button-delete-role-${role.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet
        open={isPermissionSheetOpen}
        onOpenChange={(open) => {
          setIsPermissionSheetOpen(open);
          if (!open) {
            setSelectedRole(null);
            setSelectedPermissions([]);
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {selectedRole?.name} Permissions
            </SheetTitle>
            <SheetDescription>
              Select permissions for this role. Changes are saved when you click Save.
            </SheetDescription>
          </SheetHeader>

          {rolePermissionsLoading || permissionsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <ScrollArea className="h-[calc(100vh-200px)] mt-4 pr-4">
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([module, modulePerms]) => {
                    const isFullySelected = isModuleFullySelected(modulePerms);
                    const isPartiallySelected = isModulePartiallySelected(modulePerms);

                    return (
                      <div key={module} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`module-${module}`}
                            checked={isFullySelected}
                            onCheckedChange={(checked) => {
                              toggleModulePermissions(modulePerms, checked as boolean);
                            }}
                            className={isPartiallySelected ? "data-[state=checked]:bg-muted" : ""}
                          />
                          <Label
                            htmlFor={`module-${module}`}
                            className="text-sm font-semibold capitalize cursor-pointer"
                          >
                            {module}
                          </Label>
                          <Badge variant="outline" className="text-xs">
                            {modulePerms.filter(p => selectedPermissions.includes(p.id)).length}/{modulePerms.length}
                          </Badge>
                        </div>
                        <div className="ml-6 space-y-2">
                          {modulePerms.map((perm) => (
                            <div key={perm.id} className="flex items-start gap-2">
                              <Checkbox
                                id={`perm-${perm.id}`}
                                checked={selectedPermissions.includes(perm.id)}
                                onCheckedChange={() => togglePermission(perm.id)}
                              />
                              <div className="grid gap-0.5">
                                <Label
                                  htmlFor={`perm-${perm.id}`}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {perm.name}
                                </Label>
                                {perm.description && (
                                  <span className="text-xs text-muted-foreground">
                                    {perm.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <Separator />
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsPermissionSheetOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePermissions}
                  disabled={updatePermissionsMutation.isPending}
                  data-testid="button-save-permissions"
                >
                  {updatePermissionsMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Save Permissions
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
