import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductVariantTable } from "./ProductVariantTable";
import { mockSuppliers, mockProducts, type Product } from "@/lib/mockData";

interface ReceiveStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReceive?: (data: {
    supplierId: string;
    productId: string;
    quantities: Record<string, number>;
    costPrice: number;
  }) => void;
}

export function ReceiveStockModal({ open, onOpenChange, onReceive }: ReceiveStockModalProps) {
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const selectedProductData = mockProducts.find((p) => p.id === selectedProduct);

  const handleQuantityChange = (variantId: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [variantId]: qty }));
  };

  const handleSubmit = () => {
    if (!selectedSupplier || !selectedProduct) return;

    onReceive?.({
      supplierId: selectedSupplier,
      productId: selectedProduct,
      quantities,
      costPrice: parseFloat(costPrice) || 0,
    });

    setSelectedSupplier("");
    setSelectedProduct("");
    setCostPrice("");
    setQuantities({});
    onOpenChange(false);
  };

  const totalQuantity = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-receive-stock">
        <DialogHeader>
          <DialogTitle>Receive Stock</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger data-testid="select-supplier">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {mockSuppliers.filter((s) => s.status === "active").map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger data-testid="select-product">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {mockProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cost Price per Unit (₹)</Label>
            <Input
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="Enter cost price"
              data-testid="input-cost-price"
            />
          </div>

          {selectedProductData && (
            <div className="space-y-2">
              <Label>Enter Quantities by Variant</Label>
              <ProductVariantTable
                variants={selectedProductData.variants}
                editable
                onQuantityChange={handleQuantityChange}
              />
            </div>
          )}

          {totalQuantity > 0 && (
            <div className="p-3 bg-muted rounded-md">
              <div className="flex justify-between text-sm">
                <span>Total Units:</span>
                <span className="font-semibold">{totalQuantity}</span>
              </div>
              {costPrice && (
                <div className="flex justify-between text-sm mt-1">
                  <span>Total Cost:</span>
                  <span className="font-semibold">₹{(totalQuantity * parseFloat(costPrice)).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-receive">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedSupplier || !selectedProduct || totalQuantity === 0}
            data-testid="button-confirm-receive"
          >
            Receive Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
