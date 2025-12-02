import { useState } from "react";
import { SearchInput } from "@/components/SearchInput";
import { ReceiveStockModal } from "@/components/ReceiveStockModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PackagePlus, Package } from "lucide-react";
import { mockProducts, type ProductVariant } from "@/lib/mockData";

const allVariants = mockProducts.flatMap((p) =>
  p.variants.map((v) => ({ ...v, productName: p.name }))
);

const stockFilters = [
  { value: "all", label: "All" },
  { value: "in_stock", label: "In Stock" },
  { value: "low", label: "Low Stock" },
  { value: "out", label: "Out of Stock" },
];

export default function MobileStock() {
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);

  const getStockStatus = (qty: number) => {
    if (qty === 0) return "out";
    if (qty < 20) return "low";
    return "in_stock";
  };

  const filteredVariants = allVariants.filter((v) => {
    const matchesSearch =
      v.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const status = getStockStatus(v.stockQuantity);
    const matchesFilter = stockFilter === "all" || status === stockFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (qty: number) => {
    if (qty === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (qty < 20) {
      return <Badge variant="secondary">Low Stock</Badge>;
    }
    return <Badge variant="default">In Stock</Badge>;
  };

  return (
    <div className="pb-20">
      <div className="sticky top-0 z-10 bg-background p-4 space-y-3 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Stock</h1>
          <Button size="sm" onClick={() => setReceiveModalOpen(true)} data-testid="button-receive-mobile">
            <PackagePlus className="h-4 w-4 mr-1" />
            Receive
          </Button>
        </div>
        <SearchInput
          placeholder="Search SKU or product..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2">
            {stockFilters.map((filter) => {
              const count = filter.value === "all"
                ? allVariants.length
                : allVariants.filter((v) => getStockStatus(v.stockQuantity) === filter.value).length;
              const isActive = stockFilter === filter.value;
              return (
                <Badge
                  key={filter.value}
                  variant={isActive ? "default" : "outline"}
                  className="cursor-pointer shrink-0"
                  onClick={() => setStockFilter(filter.value)}
                  data-testid={`filter-stock-${filter.value}`}
                >
                  {filter.label} ({count})
                </Badge>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <div className="p-4 space-y-2">
        {filteredVariants.map((variant) => (
          <Card key={variant.id} className="hover-elevate" data-testid={`card-stock-${variant.id}`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm">{variant.sku}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {variant.productName} - {variant.color} / {variant.size}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold">{variant.stockQuantity}</p>
                  {getStatusBadge(variant.stockQuantity)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredVariants.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No stock items found
          </div>
        )}
      </div>

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
