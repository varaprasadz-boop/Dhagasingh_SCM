import { useState } from "react";
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
import { Plus, Edit, Trash2 } from "lucide-react";
import { mockSuppliers, type Supplier } from "@/lib/mockData";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    alternatePhone: "",
    address: "",
    gstNumber: "",
    status: "active" as "active" | "inactive",
  });

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.gstNumber && s.gstNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const columns = [
    { key: "name", header: "Name", sortable: true },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
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
              handleDelete(s.id);
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
      email: supplier.email,
      phone: supplier.phone,
      alternatePhone: supplier.alternatePhone || "",
      address: supplier.address || "",
      gstNumber: supplier.gstNumber || "",
      status: supplier.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = () => {
    if (editingSupplier) {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === editingSupplier.id ? { ...s, ...formData } : s
        )
      );
    } else {
      const newSupplier: Supplier = {
        id: String(suppliers.length + 1),
        ...formData,
      };
      setSuppliers((prev) => [...prev, newSupplier]);
    }

    setDialogOpen(false);
    setEditingSupplier(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      alternatePhone: "",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">Manage your vendor relationships</p>
        </div>
        <Button onClick={handleOpenCreate} data-testid="button-add-supplier">
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
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
                <Label>Phone *</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Alternate Phone (Optional)</Label>
                <Input
                  value={formData.alternatePhone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, alternatePhone: e.target.value }))
                  }
                  placeholder="+91 98765 43211"
                  data-testid="input-supplier-alt-phone"
                />
              </div>
              <div className="space-y-2">
                <Label>GST Number (Optional)</Label>
                <Input
                  value={formData.gstNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))
                  }
                  placeholder="27AABCT1234F1ZP"
                  data-testid="input-supplier-gst"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address (Optional)</Label>
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
              disabled={!formData.name || !formData.email || !formData.phone}
              data-testid="button-submit-supplier"
            >
              {editingSupplier ? "Update" : "Add"} Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
