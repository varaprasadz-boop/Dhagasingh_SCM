import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { SearchInput } from "@/components/SearchInput";
import { ReceiveStockModal } from "@/components/ReceiveStockModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackagePlus, PackageMinus, History, Download } from "lucide-react";
import { mockProducts, mockStockMovements, type ProductVariant, type StockMovement } from "@/lib/mockData";

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);

  const allVariants = mockProducts.flatMap((p) =>
    p.variants.map((v) => ({ ...v, productName: p.name }))
  );

  const filteredVariants = allVariants.filter(
    (v) =>
      v.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.color.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatus = (qty: number) => {
    if (qty === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (qty < 20) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  const inventoryColumns = [
    { key: "sku", header: "SKU", sortable: true },
    { key: "productName", header: "Product", sortable: true },
    {
      key: "color",
      header: "Color",
      render: (v: ProductVariant & { productName: string }) => (
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border"
            style={{
              backgroundColor:
                v.color.toLowerCase() === "white" ? "#f8f8f8" : v.color.toLowerCase(),
            }}
          />
          {v.color}
        </div>
      ),
    },
    { key: "size", header: "Size" },
    {
      key: "stockQuantity",
      header: "Stock",
      sortable: true,
      render: (v: ProductVariant & { productName: string }) => {
        const status = getStockStatus(v.stockQuantity);
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
      render: (v: ProductVariant & { productName: string }) => `₹${v.costPrice}`,
    },
    {
      key: "sellingPrice",
      header: "Price",
      render: (v: ProductVariant & { productName: string }) => `₹${v.sellingPrice}`,
    },
    {
      key: "value",
      header: "Stock Value",
      render: (v: ProductVariant & { productName: string }) =>
        `₹${(v.stockQuantity * v.costPrice).toLocaleString()}`,
    },
  ];

  const movementColumns = [
    {
      key: "type",
      header: "Type",
      render: (m: StockMovement) => (
        <Badge variant={m.type === "inward" ? "default" : "secondary"}>
          {m.type === "inward" ? "IN" : "OUT"}
        </Badge>
      ),
    },
    { key: "sku", header: "SKU" },
    { key: "productName", header: "Product" },
    {
      key: "quantity",
      header: "Qty",
      render: (m: StockMovement) => (
        <span className={m.type === "inward" ? "text-green-600" : "text-red-600"}>
          {m.type === "inward" ? "+" : "-"}{m.quantity}
        </span>
      ),
    },
    {
      key: "costPrice",
      header: "Cost",
      render: (m: StockMovement) => (m.costPrice ? `₹${m.costPrice}` : "-"),
    },
    {
      key: "createdAt",
      header: "Date",
      render: (m: StockMovement) =>
        new Date(m.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
  ];

  const totalInventoryValue = allVariants.reduce(
    (sum, v) => sum + v.stockQuantity * v.costPrice,
    0
  );
  const totalUnits = allVariants.reduce((sum, v) => sum + v.stockQuantity, 0);
  const lowStockCount = allVariants.filter((v) => v.stockQuantity < 20).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Track stock levels and movements</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setReceiveModalOpen(true)} data-testid="button-receive-stock">
            <PackagePlus className="h-4 w-4 mr-2" />
            Receive Stock
          </Button>
          <Button variant="outline" data-testid="button-dispatch-stock">
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
            <p className="text-2xl font-bold">{totalUnits.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total SKUs</p>
            <p className="text-2xl font-bold">{allVariants.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Inventory Value</p>
            <p className="text-2xl font-bold">₹{totalInventoryValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
            <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
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
                data={mockStockMovements}
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
          console.log("Stock received:", data);
          setReceiveModalOpen(false);
        }}
      />
    </div>
  );
}
