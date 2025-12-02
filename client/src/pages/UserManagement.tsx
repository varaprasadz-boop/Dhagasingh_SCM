import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { SearchInput } from "@/components/SearchInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Shield, Users, UserCheck, Package } from "lucide-react";
import { mockUsers, type User } from "@/lib/mockData";

type UserRole = "admin" | "warehouse" | "customer_support" | "stock_management";

const roleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  warehouse: "Warehouse",
  customer_support: "Customer Support",
  stock_management: "Stock Management",
};

const roleColors: Record<UserRole, string> = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  warehouse: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  customer_support: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  stock_management: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export default function UserManagement() {
  const [users, setUsers] = useState(mockUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "customer_support" as UserRole,
    status: "active" as "active" | "inactive",
  });

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roleLabels[u.role].toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { key: "name", header: "Name", sortable: true },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    {
      key: "role",
      header: "Role",
      render: (u: User) => (
        <Badge className={roleColors[u.role]} variant="secondary">
          {roleLabels[u.role]}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (u: User) => <StatusBadge status={u.status} />,
    },
    {
      key: "createdAt",
      header: "Created",
      render: (u: User) =>
        new Date(u.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
    },
    {
      key: "actions",
      header: "",
      render: (u: User) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(u);
            }}
            data-testid={`button-edit-user-${u.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(u.id);
            }}
            data-testid={`button-delete-user-${u.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleSubmit = () => {
    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id ? { ...u, ...formData } : u
        )
      );
    } else {
      const newUser: User = {
        id: String(users.length + 1),
        ...formData,
        createdAt: new Date().toISOString(),
      };
      setUsers((prev) => [...prev, newUser]);
    }

    setDialogOpen(false);
    setEditingUser(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "customer_support",
      status: "active",
    });
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    resetForm();
    setDialogOpen(true);
  };

  const roleCounts = {
    admin: users.filter((u) => u.role === "admin").length,
    warehouse: users.filter((u) => u.role === "warehouse").length,
    customer_support: users.filter((u) => u.role === "customer_support").length,
    stock_management: users.filter((u) => u.role === "stock_management").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users and their roles</p>
        </div>
        <Button onClick={handleOpenCreate} data-testid="button-add-user">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <p className="text-sm text-muted-foreground">Admins</p>
            </div>
            <p className="text-2xl font-bold mt-1">{roleCounts.admin}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-muted-foreground">Warehouse</p>
            </div>
            <p className="text-2xl font-bold mt-1">{roleCounts.warehouse}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <p className="text-sm text-muted-foreground">Customer Support</p>
            </div>
            <p className="text-2xl font-bold mt-1">{roleCounts.customer_support}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              <p className="text-sm text-muted-foreground">Stock Management</p>
            </div>
            <p className="text-2xl font-bold mt-1">{roleCounts.stock_management}</p>
          </CardContent>
        </Card>
      </div>

      <SearchInput
        placeholder="Search users, roles..."
        value={searchQuery}
        onChange={setSearchQuery}
        className="max-w-md"
      />

      <Card>
        <CardContent className="p-0">
          <DataTable
            data={filteredUsers}
            columns={columns}
            getRowId={(u) => u.id}
            onRowClick={handleEdit}
            emptyMessage="No users found"
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="modal-user">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Add User"}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? "Update user information and role" : "Add a new user to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="John Doe"
                data-testid="input-user-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="user@dsscm.com"
                  data-testid="input-user-email"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+91 98765 43210"
                  data-testid="input-user-phone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, role: v as UserRole }))}
              >
                <SelectTrigger data-testid="select-user-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="warehouse">Warehouse</SelectItem>
                  <SelectItem value="customer_support">Customer Support</SelectItem>
                  <SelectItem value="stock_management">Stock Management</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.role === "admin" && "Full access to all features"}
                {formData.role === "warehouse" && "Manage orders, inventory, and couriers"}
                {formData.role === "customer_support" && "Handle orders and complaints"}
                {formData.role === "stock_management" && "Manage products, inventory, and suppliers"}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label>Active Status</Label>
              <Switch
                checked={formData.status === "active"}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: checked ? "active" : "inactive",
                  }))
                }
                data-testid="switch-user-status"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.email || !formData.phone}
              data-testid="button-submit-user"
            >
              {editingUser ? "Update" : "Add"} User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
