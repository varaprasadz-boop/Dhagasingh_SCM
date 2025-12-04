import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { SearchInput } from "@/components/SearchInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Supplier } from "@shared/schema";

export default function Suppliers() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    gstNumber: "",
    status: "active" as "active" | "inactive",
  });

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiRequest("POST", "/api/suppliers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "Supplier created successfully" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create supplier", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) =>
      apiRequest("PATCH", `/api/suppliers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "Supplier updated successfully" });
      setDialogOpen(false);
      setEditingSupplier(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update supplier", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "Supplier deleted successfully" });
      setDeleteConfirmOpen(false);
      setSupplierToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete supplier", description: error.message, variant: "destructive" });
    },
  });

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.gstNumber && s.gstNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const columns = [
    { key: "name", header: "Name", sortable: true },
    { 
      key: "contactPerson", 
      header: "Contact Person",
      render: (s: Supplier) => s.contactPerson || "-",
    },
    { 
      key: "email", 
      header: "Email",
      render: (s: Supplier) => s.email || "-",
    },
    { 
      key: "phone", 
      header: "Phone",
      render: (s: Supplier) => s.phone || "-",
    },
    {
      key: "gstNumber",
      header: "GST Number",
      render: (s: Supplier) => (
        <span className="font-mono text-xs">{s.gstNumber || "-"}</span>
      ),
    },
    {
      key: "address",
      header: "Address",
      render: (s: Supplier) => (
        <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
          {s.address || "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s: Supplier) => <StatusBadge status={s.status} />,
    },
    {
      key: "actions",
      header: "",
      render: (s: Supplier) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(s);
            }}
            data-testid={`button-edit-supplier-${s.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setSupplierToDelete(s);
              setDeleteConfirmOpen(true);
            }}
            data-testid={`button-delete-supplier-${s.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      gstNumber: supplier.gstNumber || "",
      status: supplier.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      gstNumber: "",
      status: "active",
    });
  };

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    resetForm();
    setDialogOpen(true);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Suppliers</h1>
          <p className="text-muted-foreground">Manage your vendor relationships</p>
        </div>
        <Button onClick={handleOpenCreate} data-testid="button-add-supplier">
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Suppliers</p>
            <p className="text-2xl font-bold" data-testid="text-total-suppliers">{suppliers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Suppliers</p>
            <p className="text-2xl font-bold" data-testid="text-active-suppliers">
              {suppliers.filter((s) => s.status === "active").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <SearchInput
        placeholder="Search suppliers, GST..."
        value={searchQuery}
        onChange={setSearchQuery}
        className="max-w-md"
      />

      <Card>
        <CardContent className="p-0">
          <DataTable
            data={filteredSuppliers}
            columns={columns}
            getRowId={(s) => s.id}
            onRowClick={handleEdit}
            emptyMessage="No suppliers found"
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="modal-supplier">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? "Edit Supplier" : "Add Supplier"}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier ? "Update supplier information" : "Add a new supplier to your list"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="ABC Textiles"
                data-testid="input-supplier-name"
              />
            </div>

            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, contactPerson: e.target.value }))
                }
                placeholder="John Doe"
                data-testid="input-supplier-contact"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="contact@example.com"
                  data-testid="input-supplier-email"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+91 98765 43210"
                  data-testid="input-supplier-phone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>GST Number</Label>
              <Input
                value={formData.gstNumber}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))
                }
                placeholder="27AABCT1234F1ZP"
                data-testid="input-supplier-gst"
              />
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Full address..."
                data-testid="input-supplier-address"
              />
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
                data-testid="switch-supplier-status"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || isPending}
              data-testid="button-submit-supplier"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingSupplier ? "Update" : "Add"} Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{supplierToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => supplierToDelete && deleteMutation.mutate(supplierToDelete.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
