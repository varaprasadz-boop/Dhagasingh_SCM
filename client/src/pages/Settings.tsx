import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FileUpload } from "@/components/FileUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/contexts/ThemeContext";
import { useMobile } from "@/contexts/MobileContext";
import {
  Settings as SettingsIcon,
  Bell,
  Palette,
  Database,
  Save,
  QrCode,
  Upload,
  Trash2,
  Printer,
  Plus,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { B2BPrintingType } from "@shared/schema";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { isMobileView, setMobileView } = useMobile();

  const [lowStockThreshold, setLowStockThreshold] = useState("20");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [stockAlerts, setStockAlerts] = useState(true);
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);

  const handleQrUpload = (file: File) => {
    setQrCodeFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setQrCodePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQr = () => {
    setQrCodeFile(null);
    setQrCodePreview(null);
  };

  const handleSave = () => {
    console.log("Settings saved", {
      lowStockThreshold,
      emailNotifications,
      orderNotifications,
      stockAlerts,
      qrCodeFile: qrCodeFile?.name,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your application preferences</p>
        </div>
        <Button onClick={handleSave} data-testid="button-save-settings">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">
            <SettingsIcon className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Database className="h-4 w-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="payment">
            <QrCode className="h-4 w-4 mr-2" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="b2b-printing">
            <Printer className="h-4 w-4 mr-2" />
            B2B Printing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Business Information</CardTitle>
              <CardDescription>Update your business details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input defaultValue="DS_SCM Store" data-testid="input-business-name" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input type="email" defaultValue="admin@dsscm.com" data-testid="input-contact-email" />
                </div>
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input defaultValue="+91 98765 43210" data-testid="input-phone" />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select defaultValue="INR">
                    <SelectTrigger data-testid="select-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Default Settings</CardTitle>
              <CardDescription>Configure default behaviors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Order Status</Label>
                  <Select defaultValue="pending">
                    <SelectTrigger data-testid="select-default-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Courier</Label>
                  <Select defaultValue="delhivery">
                    <SelectTrigger data-testid="select-default-courier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delhivery">Delhivery</SelectItem>
                      <SelectItem value="bluedart">BlueDart</SelectItem>
                      <SelectItem value="local">Local Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Email Notifications</CardTitle>
              <CardDescription>Configure email alert preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive email updates</p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  data-testid="switch-email-notifications"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Order Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified on new orders</p>
                </div>
                <Switch
                  checked={orderNotifications}
                  onCheckedChange={setOrderNotifications}
                  data-testid="switch-order-notifications"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Low Stock Alerts</p>
                  <p className="text-sm text-muted-foreground">Alert when stock is low</p>
                </div>
                <Switch
                  checked={stockAlerts}
                  onCheckedChange={setStockAlerts}
                  data-testid="switch-stock-alerts"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Theme</CardTitle>
              <CardDescription>Customize the application appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Toggle dark/light theme</p>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={toggleTheme}
                  data-testid="switch-dark-mode"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mobile View</p>
                  <p className="text-sm text-muted-foreground">Force mobile layout</p>
                </div>
                <Switch
                  checked={isMobileView}
                  onCheckedChange={setMobileView}
                  data-testid="switch-mobile-layout"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stock Thresholds</CardTitle>
              <CardDescription>Configure inventory alert levels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Low Stock Threshold</Label>
                <Input
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  data-testid="input-low-stock-threshold"
                />
                <p className="text-xs text-muted-foreground">
                  Items below this quantity will show as low stock
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">RTO Settings</CardTitle>
              <CardDescription>Configure Return to Origin behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-restock on RTO</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically add items back to inventory when marked RTO
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-auto-restock" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Company QR Code</CardTitle>
              <CardDescription>
                Upload the company QR code for internal courier payment collection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This QR code will be displayed to internal delivery employees when 
                    collecting payments from customers via QR method.
                  </p>

                  {!qrCodePreview && (
                    <FileUpload
                      accept="image/*"
                      label="Upload QR Code"
                      description="PNG, JPG up to 2MB"
                      onUpload={handleQrUpload}
                    />
                  )}

                  {qrCodePreview && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={handleRemoveQr}
                        data-testid="button-remove-qr"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove QR
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {qrCodeFile?.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-center">
                  {qrCodePreview ? (
                    <div className="border rounded-lg p-4 bg-white">
                      <img
                        src={qrCodePreview}
                        alt="Company QR Code"
                        className="w-48 h-48 object-contain"
                        data-testid="img-qr-preview"
                      />
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground">
                      <QrCode className="h-16 w-16 mb-2" />
                      <p className="text-sm">No QR code uploaded</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>UPI ID (Display only)</Label>
                <Input
                  placeholder="yourcompany@upi"
                  data-testid="input-upi-id"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Display UPI ID for manual entry if QR scan fails
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Settings</CardTitle>
              <CardDescription>Configure payment collection options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Allow Cash Collection</p>
                  <p className="text-sm text-muted-foreground">
                    Enable cash collection by internal couriers
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-allow-cash" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Allow QR Collection</p>
                  <p className="text-sm text-muted-foreground">
                    Enable QR code payment collection
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-allow-qr" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <PrintingTypesTab />
      </Tabs>
    </div>
  );
}

function PrintingTypesTab() {
  const { toast } = useToast();
  const [newTypeName, setNewTypeName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const { data: printingTypes = [], isLoading } = useQuery<B2BPrintingType[]>({
    queryKey: ["/api/b2b/printing-types"],
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/b2b/printing-types", { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/printing-types"] });
      setNewTypeName("");
      toast({ title: "Printing type added" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add printing type", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, isActive }: { id: string; name?: string; isActive?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/b2b/printing-types/${id}`, { name, isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/printing-types"] });
      setEditingId(null);
      toast({ title: "Printing type updated" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update printing type", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/b2b/printing-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/printing-types"] });
      toast({ title: "Printing type deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete printing type", description: error.message, variant: "destructive" });
    },
  });

  const handleAdd = () => {
    if (newTypeName.trim()) {
      createMutation.mutate(newTypeName.trim());
    }
  };

  const handleSaveEdit = (id: string) => {
    if (editingName.trim()) {
      updateMutation.mutate({ id, name: editingName.trim() });
    }
  };

  const handleToggleActive = (id: string, currentActive: boolean) => {
    updateMutation.mutate({ id, isActive: !currentActive });
  };

  return (
    <TabsContent value="b2b-printing" className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">B2B Printing Types</CardTitle>
          <CardDescription>
            Configure printing types available for B2B orders (Super Admin only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter new printing type name"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              data-testid="input-new-printing-type"
            />
            <Button
              onClick={handleAdd}
              disabled={!newTypeName.trim() || createMutation.isPending}
              data-testid="button-add-printing-type"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <Separator />

          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : printingTypes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No printing types configured yet. Add one above.
            </p>
          ) : (
            <div className="space-y-2">
              {printingTypes.map((pt) => (
                <div
                  key={pt.id}
                  className="flex items-center justify-between gap-2 p-3 border rounded-lg"
                  data-testid={`printing-type-${pt.id}`}
                >
                  {editingId === pt.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1"
                        data-testid={`input-edit-${pt.id}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleSaveEdit(pt.id)}
                        disabled={updateMutation.isPending}
                        data-testid={`button-save-${pt.id}`}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        data-testid={`button-cancel-${pt.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className={pt.isActive ? "" : "text-muted-foreground line-through"}>
                          {pt.name}
                        </span>
                        {!pt.isActive && (
                          <span className="text-xs text-muted-foreground">(inactive)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={pt.isActive}
                          onCheckedChange={() => handleToggleActive(pt.id, pt.isActive)}
                          data-testid={`switch-active-${pt.id}`}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(pt.id);
                            setEditingName(pt.name);
                          }}
                          data-testid={`button-edit-${pt.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(pt.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${pt.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
