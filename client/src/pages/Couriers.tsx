import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { SearchInput } from "@/components/SearchInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Edit, Trash2, Zap, Settings } from "lucide-react";
import { mockCouriers, type CourierPartner } from "@/lib/mockData";

export default function Couriers() {
  const [couriers, setCouriers] = useState(mockCouriers);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState<CourierPartner | null>(null);
  const [apiDialogOpen, setApiDialogOpen] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<CourierPartner | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "third_party" as "third_party" | "in_house",
    contactPerson: "",
    phone: "",
    apiEnabled: false,
  });

  const [apiKey, setApiKey] = useState("");

  const filteredCouriers = couriers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { key: "name", header: "Name", sortable: true },
    {
      key: "type",
      header: "Type",
      render: (c: CourierPartner) => (
        <Badge variant={c.type === "third_party" ? "default" : "secondary"}>
          {c.type === "third_party" ? "Third Party" : "In-House"}
        </Badge>
      ),
    },
    { key: "contactPerson", header: "Contact Person" },
    { key: "phone", header: "Phone" },
    {
      key: "apiEnabled",
      header: "API",
      render: (c: CourierPartner) =>
        c.type === "third_party" ? (
          <Badge variant={c.apiEnabled ? "default" : "outline"}>
            {c.apiEnabled ? "Connected" : "Not Connected"}
          </Badge>
        ) : (
          "-"
        ),
    },
    {
      key: "actions",
      header: "",
      render: (c: CourierPartner) => (
        <div className="flex gap-1">
          {c.type === "third_party" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCourier(c);
                setApiKey(c.apiKey || "");
                setApiDialogOpen(true);
              }}
              data-testid={`button-api-${c.id}`}
            >
              <Zap className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(c);
            }}
            data-testid={`button-edit-courier-${c.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(c.id);
            }}
            data-testid={`button-delete-courier-${c.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleEdit = (courier: CourierPartner) => {
    setEditingCourier(courier);
    setFormData({
      name: courier.name,
      type: courier.type,
      contactPerson: courier.contactPerson,
      phone: courier.phone,
      apiEnabled: courier.apiEnabled,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setCouriers((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSubmit = () => {
    if (editingCourier) {
      setCouriers((prev) =>
        prev.map((c) =>
          c.id === editingCourier.id ? { ...c, ...formData } : c
        )
      );
    } else {
      const newCourier: CourierPartner = {
        id: String(couriers.length + 1),
        ...formData,
      };
      setCouriers((prev) => [...prev, newCourier]);
    }

    setDialogOpen(false);
    setEditingCourier(null);
    setFormData({
      name: "",
      type: "third_party",
      contactPerson: "",
      phone: "",
      apiEnabled: false,
    });
  };

  const handleApiSave = () => {
    if (!selectedCourier) return;

    setCouriers((prev) =>
      prev.map((c) =>
        c.id === selectedCourier.id
          ? { ...c, apiEnabled: !!apiKey, apiKey: apiKey || undefined }
          : c
      )
    );

    setApiDialogOpen(false);
    setApiKey("");
    setSelectedCourier(null);
  };

  const handleOpenCreate = () => {
    setEditingCourier(null);
    setFormData({
      name: "",
      type: "third_party",
      contactPerson: "",
      phone: "",
      apiEnabled: false,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Courier Partners</h1>
          <p className="text-muted-foreground">
            Manage delivery partners and API integrations
          </p>
        </div>
        <Button onClick={handleOpenCreate} data-testid="button-add-courier">
          <Plus className="h-4 w-4 mr-2" />
          Add Courier
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Partners</p>
            <p className="text-2xl font-bold">{couriers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Third Party</p>
            <p className="text-2xl font-bold">
              {couriers.filter((c) => c.type === "third_party").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">In-House</p>
            <p className="text-2xl font-bold">
              {couriers.filter((c) => c.type === "in_house").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">API Connected</p>
            <p className="text-2xl font-bold">
              {couriers.filter((c) => c.apiEnabled).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <SearchInput
        placeholder="Search couriers..."
        value={searchQuery}
        onChange={setSearchQuery}
        className="max-w-md"
      />

      <Card>
        <CardContent className="p-0">
          <DataTable
            data={filteredCouriers}
            columns={columns}
            getRowId={(c) => c.id}
            onRowClick={handleEdit}
            emptyMessage="No courier partners found"
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="modal-courier">
          <DialogHeader>
            <DialogTitle>
              {editingCourier ? "Edit Courier" : "Add Courier Partner"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Partner Type</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(v) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: v as "third_party" | "in_house",
                  }))
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="third_party" id="type_third" />
                  <Label htmlFor="type_third" className="font-normal">
                    Third Party (Delhivery, BlueDart, etc.)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="in_house" id="type_inhouse" />
                  <Label htmlFor="type_inhouse" className="font-normal">
                    In-House
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Partner Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Delhivery"
                data-testid="input-courier-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input
                  value={formData.contactPerson}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactPerson: e.target.value,
                    }))
                  }
                  placeholder="Name"
                  data-testid="input-courier-contact"
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
                  data-testid="input-courier-phone"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name} data-testid="button-submit-courier">
              {editingCourier ? "Update" : "Add"} Courier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={apiDialogOpen} onOpenChange={setApiDialogOpen}>
        <DialogContent data-testid="modal-api-config">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              API Configuration - {selectedCourier?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Enter your API credentials to enable automatic AWB generation and
              tracking updates.
            </p>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API key"
                data-testid="input-api-key"
              />
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Features with API:</p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li>Automatic AWB generation</li>
                <li>Real-time tracking updates</li>
                <li>Shipping cost calculation</li>
                <li>Delivery status webhooks</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApiDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApiSave} data-testid="button-save-api">
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
