import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ProductVariant } from "@/lib/mockData";

interface ProductVariantTableProps {
  variants: ProductVariant[];
  editable?: boolean;
  onQuantityChange?: (variantId: string, quantity: number) => void;
}

export function ProductVariantTable({
  variants,
  editable = false,
  onQuantityChange,
}: ProductVariantTableProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleQuantityChange = (variantId: string, value: string) => {
    const qty = parseInt(value) || 0;
    setQuantities((prev) => ({ ...prev, [variantId]: qty }));
    onQuantityChange?.(variantId, qty);
  };

  const getStockStatus = (qty: number) => {
    if (qty === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (qty < 20) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Size</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="text-right">Price</TableHead>
            {editable && <TableHead className="text-right">Quantity</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.map((variant) => {
            const status = getStockStatus(variant.stockQuantity);
            return (
              <TableRow key={variant.id} data-testid={`row-variant-${variant.id}`}>
                <TableCell className="font-mono text-sm">{variant.sku}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{
                        backgroundColor:
                          variant.color.toLowerCase() === "white"
                            ? "#f8f8f8"
                            : variant.color.toLowerCase(),
                      }}
                    />
                    {variant.color}
                  </div>
                </TableCell>
                <TableCell>{variant.size}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span>{variant.stockQuantity}</span>
                    <Badge variant={status.variant} className="text-xs">
                      {status.label}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">₹{variant.costPrice}</TableCell>
                <TableCell className="text-right">₹{variant.sellingPrice}</TableCell>
                {editable && (
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min="0"
                      className="w-20 ml-auto"
                      value={quantities[variant.id] ?? ""}
                      onChange={(e) => handleQuantityChange(variant.id, e.target.value)}
                      placeholder="0"
                      data-testid={`input-qty-${variant.id}`}
                    />
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
