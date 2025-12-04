import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/DataTable";
import { SearchInput } from "@/components/SearchInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Plus, Edit, Trash2, Zap, Settings, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CourierPartner } from "@shared/schema";

export default function Couriers() {
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
    isActive: true,
  });

  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();

  const { data: couriers = [], isLoading, error } = useQuery<CourierPartner[]>({
    queryKey: ["/api/couriers"],
  });

  const { data: delhiveryStatus } = useQuery<{ configured: boolean; mode: string }>({
    queryKey: ["/api/courier/delhivery/status"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<CourierPartner>) => {
      const res = await apiRequest("POST", "/api/couriers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/couriers"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Courier partner added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add courier partner", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CourierPartner> }) => {
      const res = await apiRequest("PATCH", `/api/couriers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/couriers"] });
      setDialogOpen(false);
      setApiDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Courier partner updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update courier partner", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/couriers/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/couriers"] });
      toast({ title: "Success", description: "Courier partner removed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove courier partner", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setEditingCourier(null);
    setFormData({
      name: "",
      type: "third_party",
      contactPerson: "",
      phone: "",
      isActive: true,
    });
  };

  const filteredCouriers = useMemo(() => {
    if (!searchQuery) return couriers;
    const query = searchQuery.toLowerCase();
    return couriers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.contactPerson || "").toLowerCase().includes(query)
    );
  }, [couriers, searchQuery]);

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
    { 
      key: "contactPerson", 
      header: "Contact Person",
      render: (c: CourierPartner) => c.contactPerson || "-"
    },
    { 
      key: "phone", 
      header: "Phone",
      render: (c: CourierPartner) => c.phone || "-"
    },
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
      key: "isActive",
      header: "Status",
      render: (c: CourierPartner) => (
        <Badge variant={c.isActive ? "default" : "secondary"}>
          {c.isActive ? "Active" : "Inactive"}
        </Badge>
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
              if (confirm("Are you sure you want to delete this courier partner?")) {
                deleteMutation.mutate(c.id);
              }
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
      type: courier.type as "third_party" | "in_house",
      contactPerson: courier.contactPerson || "",
      phone: courier.phone || "",
      isActive: courier.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      type: formData.type,
      contactPerson: formData.contactPerson || null,
      phone: formData.phone || null,
      isActive: formData.isActive,
    };

    if (editingCourier) {
      updateMutation.mutate({ id: editingCourier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleApiSave = () => {
    if (!selectedCourier) return;

    updateMutation.mutate({
      id: selectedCourier.id,
      data: {
        apiEnabled: !!apiKey,
        apiKey: apiKey || null,
      },
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-destructive">Failed to load courier partners</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/couriers"] })}>
          Retry
        </Button>
      </div>
    );
  }

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
            <p className="text-2xl font-bold" data-testid="stat-total">{couriers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Third Party</p>
            <p className="text-2xl font-bold" data-testid="stat-third-party">
              {couriers.filter((c) => c.type === "third_party").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">In-House</p>
            <p className="text-2xl font-bold" data-testid="stat-in-house">
              {couriers.filter((c) => c.type === "in_house").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">API Connected</p>
            <p className="text-2xl font-bold" data-testid="stat-api-connected">
              {couriers.filter((c) => c.apiEnabled).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {delhiveryStatus && (
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Zap className={`h-5 w-5 ${delhiveryStatus.configured ? "text-green-500" : "text-muted-foreground"}`} />
              <div>
                <p className="font-medium">Delhivery Integration</p>
                <p className="text-sm text-muted-foreground">
                  {delhiveryStatus.configured 
                    ? `Connected (${delhiveryStatus.mode} mode)` 
                    : "Not configured - Set DELHIVERY_API_TOKEN in environment variables"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <SearchInput
        placeholder="Search couriers..."
        value={searchQuery}
        onChange={setSearchQuery}
        className="max-w-md"
        data-testid="input-search-couriers"
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
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
                data-testid="switch-courier-active"
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.name || createMutation.isPending || updateMutation.isPending} 
              data-testid="button-submit-courier"
            >
              {createMutation.isPending || updateMutation.isPending 
                ? "Saving..." 
                : editingCourier ? "Update" : "Add"} Courier
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
            <Button 
              onClick={handleApiSave} 
              disabled={updateMutation.isPending}
              data-testid="button-save-api"
            >
              {updateMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
