import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { ProductVariant } from "@/lib/mockData";

interface StockAlertListProps {
  variants: ProductVariant[];
  threshold?: number;
}

export function StockAlertList({ variants, threshold = 25 }: StockAlertListProps) {
  const lowStockItems = variants.filter((v) => v.stockQuantity <= threshold);

  if (lowStockItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            All items are well stocked
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-stock-alerts">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Stock Alerts
          <Badge variant="secondary" className="ml-auto">
            {lowStockItems.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {lowStockItems.map((variant) => (
          <div
            key={variant.id}
            className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover-elevate"
            data-testid={`alert-${variant.id}`}
          >
            <div>
              <p className="font-mono text-sm">{variant.sku}</p>
              <p className="text-xs text-muted-foreground">
                {variant.color} / {variant.size}
              </p>
            </div>
            <Badge
              variant={variant.stockQuantity === 0 ? "destructive" : "secondary"}
            >
              {variant.stockQuantity === 0 ? "Out of Stock" : `${variant.stockQuantity} left`}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
