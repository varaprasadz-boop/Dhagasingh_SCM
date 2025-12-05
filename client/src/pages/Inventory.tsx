import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/DataTable";
import { SearchInput } from "@/components/SearchInput";
import { ReceiveStockModal } from "@/components/ReceiveStockModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { PackagePlus, PackageMinus, History, Download, Search, AlertCircle, Package, Truck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ProductWithVariants, ProductVariant, StockMovement, Order, CourierPartner } from "@shared/schema";
import type { ReceiveStockData } from "@/components/ReceiveStockModal";

type VariantWithProduct = ProductVariant & { productName: string };

export default function Inventory() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [manualDispatchOpen, setManualDispatchOpen] = useState(false);

  const [orderLookup, setOrderLookup] = useState("");
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [dispatchType, setDispatchType] = useState<"fresh" | "replacement">("fresh");
  const [selectedCourier, setSelectedCourier] = useState("");

  const { data: products = [], isLoading: productsLoading } = useQuery<ProductWithVariants[]>({
    queryKey: ["/api/products"],
  });

  const { data: stockMovements = [], isLoading: movementsLoading } = useQuery<StockMovement[]>({
    queryKey: ["/api/stock-movements"],
  });

  const { data: couriers = [] } = useQuery<CourierPartner[]>({
    queryKey: ["/api/couriers"],
  });

  const receiveStockMutation = useMutation({
    mutationFn: async (data: ReceiveStockData) => {
      const movements = [];
      for (const product of data.products) {
        for (const [variantId, variantData] of Object.entries(product.variants)) {
          if (variantData.quantity > 0) {
            movements.push({
              productVariantId: variantId,
              type: "inward" as const,
              quantity: variantData.quantity,
              supplierId: data.supplierId,
              costPrice: variantData.costPrice,
              invoiceNumber: data.invoiceNumber,
              invoiceDate: data.invoiceDate ? new Date(data.invoiceDate).toISOString() : undefined,
              reason: "Stock received from supplier",
            });
          }
        }
      }
      for (const movement of movements) {
        await apiRequest("POST", "/api/stock-movements", movement);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      toast({ title: "Stock received successfully" });
      setReceiveModalOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to receive stock", description: error.message, variant: "destructive" });
    },
  });

  const allVariants: VariantWithProduct[] = products.flatMap((p) =>
    p.variants.map((v) => ({ ...v, productName: p.name }))
  );

  const filteredVariants = allVariants.filter(
    (v) =>
      v.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.color && v.color.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStockStatus = (qty: number, threshold?: number | null) => {
    const lowThreshold = threshold || 10;
    if (qty === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (qty <= lowThreshold) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  const inventoryColumns = [
    { key: "sku", header: "SKU", sortable: true },
    { key: "productName", header: "Product", sortable: true },
    {
      key: "color",
      header: "Color",
      render: (v: VariantWithProduct) => (
        <div className="flex items-center gap-2">
          {v.color && (
            <div
              className="w-4 h-4 rounded-full border"
              style={{
                backgroundColor:
                  v.color.toLowerCase() === "white" ? "#f8f8f8" : v.color.toLowerCase(),
              }}
            />
          )}
          {v.color || "-"}
        </div>
      ),
    },
    { 
      key: "size", 
      header: "Size",
      render: (v: VariantWithProduct) => v.size || "-",
    },
    {
      key: "stockQuantity",
      header: "Stock",
      sortable: true,
      render: (v: VariantWithProduct) => {
        const status = getStockStatus(v.stockQuantity, v.lowStockThreshold);
        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold">{v.stockQuantity}</span>
            <Badge variant={status.variant} className="text-xs">
              {status.label}
            </Badge>
          </div>
        );
      },
    },
    {
      key: "costPrice",
      header: "Cost",
      render: (v: VariantWithProduct) => `₹${parseFloat(v.costPrice)}`,
    },
    {
      key: "sellingPrice",
      header: "Price",
      render: (v: VariantWithProduct) => `₹${parseFloat(v.sellingPrice)}`,
    },
    {
      key: "value",
      header: "Stock Value",
      render: (v: VariantWithProduct) =>
        `₹${(v.stockQuantity * parseFloat(v.costPrice)).toLocaleString()}`,
    },
  ];

  const movementColumns = [
    {
      key: "type",
      header: "Type",
      render: (m: StockMovement) => (
        <Badge variant={m.type === "inward" ? "default" : m.type === "outward" ? "secondary" : "outline"}>
          {m.type === "inward" ? "IN" : m.type === "outward" ? "OUT" : "ADJ"}
        </Badge>
      ),
    },
    { 
      key: "productVariantId", 
      header: "SKU",
      render: (m: StockMovement) => {
        const variant = allVariants.find(v => v.id === m.productVariantId);
        return <span className="font-mono text-sm">{variant?.sku || m.productVariantId}</span>;
      },
    },
    { 
      key: "productName", 
      header: "Product",
      render: (m: StockMovement) => {
        const variant = allVariants.find(v => v.id === m.productVariantId);
        return variant?.productName || "-";
      },
    },
    {
      key: "quantity",
      header: "Qty",
      render: (m: StockMovement) => (
        <span className={m.type === "inward" ? "text-green-600" : m.type === "outward" ? "text-red-600" : ""}>
          {m.type === "inward" ? "+" : m.type === "outward" ? "-" : ""}{m.quantity}
        </span>
      ),
    },
    {
      key: "costPrice",
      header: "Cost",
      render: (m: StockMovement) => (m.costPrice ? `₹${m.costPrice}` : "-"),
    },
    {
      key: "invoiceNumber",
      header: "Invoice",
      render: (m: StockMovement) => m.invoiceNumber || "-",
    },
    {
      key: "createdAt",
      header: "Date",
      render: (m: StockMovement) =>
        m.createdAt ? new Date(m.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }) : "-",
    },
  ];

  const handleOrderLookup = async () => {
    setLookupError("");
    setFoundOrder(null);

    if (!orderLookup.trim()) {
      setLookupError("Please enter an order number");
      return;
    }

    try {
      const response = await fetch(`/api/orders?orderNumber=${encodeURIComponent(orderLookup)}`);
      if (!response.ok) {
        setLookupError("Order not found");
        return;
      }
      const orders = await response.json();
      if (orders.length === 0) {
        setLookupError("Order not found");
        return;
      }
      const order = orders[0];

      if (dispatchType === "fresh" && order.status !== "pending") {
        setLookupError("This order is already dispatched. Select 'Replacement' if there's a replacement complaint.");
        return;
      }

      setFoundOrder(order);
    } catch (error) {
      setLookupError("Failed to look up order");
    }
  };

  const handleManualDispatch = () => {
    if (!foundOrder) return;
    console.log("Manual dispatch:", {
      order: foundOrder,
      dispatchType,
      courier: selectedCourier,
    });
    toast({ title: "Dispatch initiated successfully" });
    setManualDispatchOpen(false);
    resetDispatchForm();
  };

  const resetDispatchForm = () => {
    setOrderLookup("");
    setFoundOrder(null);
    setLookupError("");
    setDispatchType("fresh");
    setSelectedCourier("");
  };

  const totalInventoryValue = allVariants.reduce(
    (sum, v) => sum + v.stockQuantity * parseFloat(v.costPrice),
    0
  );
  const totalUnits = allVariants.reduce((sum, v) => sum + v.stockQuantity, 0);
  const lowStockCount = allVariants.filter((v) => v.stockQuantity <= (v.lowStockThreshold || 10)).length;

  const inHouseCouriers = couriers.filter((c) => c.type === "in_house");

  const isLoading = productsLoading || movementsLoading;

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
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Inventory</h1>
          <p className="text-muted-foreground">Track stock levels and movements</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setReceiveModalOpen(true)} data-testid="button-receive-stock">
            <PackagePlus className="h-4 w-4 mr-2" />
            Receive Stock
          </Button>
          <Button variant="outline" onClick={() => setManualDispatchOpen(true)} data-testid="button-manual-dispatch">
            <PackageMinus className="h-4 w-4 mr-2" />
            Manual Dispatch
          </Button>
          <Button variant="outline" data-testid="button-export-inventory">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Units</p>
            <p className="text-2xl font-bold" data-testid="text-total-units">{totalUnits.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total SKUs</p>
            <p className="text-2xl font-bold" data-testid="text-total-skus">{allVariants.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Inventory Value</p>
            <p className="text-2xl font-bold" data-testid="text-inventory-value">₹{totalInventoryValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
            <p className="text-2xl font-bold text-orange-600" data-testid="text-low-stock">{lowStockCount}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock" data-testid="tab-stock-levels">
            Stock Levels
          </TabsTrigger>
          <TabsTrigger value="movements" data-testid="tab-movements">
            <History className="h-4 w-4 mr-2" />
            Movements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4 mt-4">
          <SearchInput
            placeholder="Search by SKU, product, color..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="max-w-md"
          />
          <Card>
            <CardContent className="p-0">
              <DataTable
                data={filteredVariants}
                columns={inventoryColumns}
                getRowId={(v) => v.id}
                emptyMessage="No inventory items found"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Stock Movements</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={stockMovements}
                columns={movementColumns}
                getRowId={(m) => m.id}
                emptyMessage="No stock movements recorded"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ReceiveStockModal
        open={receiveModalOpen}
        onOpenChange={setReceiveModalOpen}
        onReceive={(data) => {
          receiveStockMutation.mutate(data);
        }}
      />

      <Dialog open={manualDispatchOpen} onOpenChange={(open) => {
        setManualDispatchOpen(open);
        if (!open) resetDispatchForm();
      }}>
        <DialogContent className="sm:max-w-lg" data-testid="modal-manual-dispatch">
          <DialogHeader>
            <DialogTitle>Manual Dispatch</DialogTitle>
            <DialogDescription>
              Look up an order and dispatch items manually
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Dispatch Type</Label>
              <RadioGroup
                value={dispatchType}
                onValueChange={(v) => {
                  setDispatchType(v as "fresh" | "replacement");
                  setFoundOrder(null);
                  setLookupError("");
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fresh" id="dispatch_fresh" />
                  <Label htmlFor="dispatch_fresh" className="font-normal">Fresh Dispatch</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="replacement" id="dispatch_replacement" />
                  <Label htmlFor="dispatch_replacement" className="font-normal">Replacement</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Order Number</Label>
              <div className="flex gap-2">
                <Input
                  value={orderLookup}
                  onChange={(e) => setOrderLookup(e.target.value)}
                  placeholder="Enter order number (e.g., ORD-2024-001)"
                  data-testid="input-order-lookup"
                />
                <Button onClick={handleOrderLookup} variant="secondary" data-testid="button-lookup-order">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {lookupError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {lookupError}
                </div>
              )}
            </div>

            {foundOrder && (
              <>
                <Separator />

                <div className="p-3 bg-muted rounded-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{foundOrder.orderNumber}</span>
                    <Badge variant="secondary">{foundOrder.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {foundOrder.customerName} | {foundOrder.shippingAddress}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Assign to Employee</Label>
                  <Select value={selectedCourier} onValueChange={setSelectedCourier}>
                    <SelectTrigger data-testid="select-dispatch-employee">
                      <SelectValue placeholder="Select internal courier" />
                    </SelectTrigger>
                    <SelectContent>
                      {inHouseCouriers.length === 0 ? (
                        <SelectItem value="none" disabled>No in-house couriers available</SelectItem>
                      ) : (
                        inHouseCouriers.map((courier) => (
                          <SelectItem key={courier.id} value={courier.id}>
                            {courier.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setManualDispatchOpen(false);
              resetDispatchForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleManualDispatch}
              disabled={!foundOrder || !selectedCourier}
              data-testid="button-confirm-manual-dispatch"
            >
              <Truck className="h-4 w-4 mr-2" />
              Dispatch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
