import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "./FileUpload";
import { Plus, Trash2, Package, Loader2 } from "lucide-react";
import type { Supplier, ProductWithVariants } from "@shared/schema";

interface ProductEntry {
  id: string;
  productId: string;
  quantities: Record<string, number>;
  costPrice: string;
}

export interface ReceiveStockData {
  supplierId: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoicePhoto?: File;
  products: ProductEntry[];
}

interface ReceiveStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReceive?: (data: ReceiveStockData) => void;
}

export function ReceiveStockModal({ open, onOpenChange, onReceive }: ReceiveStockModalProps) {
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [invoicePhoto, setInvoicePhoto] = useState<File | null>(null);
  const [productEntries, setProductEntries] = useState<ProductEntry[]>([
    { id: "1", productId: "", quantities: {}, costPrice: "" },
  ]);

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
    enabled: open,
  });

  const { data: products = [] } = useQuery<ProductWithVariants[]>({
    queryKey: ["/api/products"],
    enabled: open,
  });

  const activeSuppliers = suppliers.filter((s) => s.status === "active");

  const addProduct = () => {
    setProductEntries((prev) => [
      ...prev,
      { id: String(Date.now()), productId: "", quantities: {}, costPrice: "" },
    ]);
  };

  const removeProduct = (id: string) => {
    if (productEntries.length > 1) {
      setProductEntries((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const updateProduct = (id: string, field: keyof ProductEntry, value: any) => {
    setProductEntries((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const updateVariantQuantity = (productEntryId: string, variantId: string, qty: number) => {
    setProductEntries((prev) =>
      prev.map((p) =>
        p.id === productEntryId
          ? { ...p, quantities: { ...p.quantities, [variantId]: qty } }
          : p
      )
    );
  };

  const getProductData = (productId: string): ProductWithVariants | undefined => {
    return products.find((p) => p.id === productId);
  };

  const getTotalQuantity = (entry: ProductEntry) => {
    return Object.values(entry.quantities).reduce((sum, qty) => sum + (qty || 0), 0);
  };

  const getTotalCost = (entry: ProductEntry) => {
    const qty = getTotalQuantity(entry);
    const cost = parseFloat(entry.costPrice) || 0;
    return qty * cost;
  };

  const grandTotal = productEntries.reduce((sum, p) => sum + getTotalCost(p), 0);
  const grandQuantity = productEntries.reduce((sum, p) => sum + getTotalQuantity(p), 0);

  const handleSubmit = () => {
    if (!selectedSupplier || productEntries.every((p) => !p.productId)) return;

    onReceive?.({
      supplierId: selectedSupplier,
      invoiceNumber,
      invoiceDate,
      invoicePhoto: invoicePhoto || undefined,
      products: productEntries.filter((p) => p.productId && getTotalQuantity(p) > 0),
    });

    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setSelectedSupplier("");
    setInvoiceNumber("");
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setInvoicePhoto(null);
    setProductEntries([{ id: "1", productId: "", quantities: {}, costPrice: "" }]);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="modal-receive-stock">
        <DialogHeader>
          <DialogTitle>Receive Stock</DialogTitle>
          <DialogDescription>Add multiple products with variants in a single receipt</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger data-testid="select-supplier">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeSuppliers.length === 0 ? (
                      <SelectItem value="none" disabled>No active suppliers</SelectItem>
                    ) : (
                      activeSuppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-2024-001"
                  data-testid="input-invoice-number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice Date</Label>
                <Input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  data-testid="input-invoice-date"
                />
              </div>

              <div className="space-y-2">
                <Label>Invoice Photo (Optional)</Label>
                <FileUpload
                  accept="image/*"
                  label="Upload Photo"
                  description="JPG, PNG up to 5MB"
                  onUpload={(file) => setInvoicePhoto(file)}
                />
                {invoicePhoto && (
                  <p className="text-xs text-muted-foreground">{invoicePhoto.name}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Products</Label>
                <Button variant="outline" size="sm" onClick={addProduct} data-testid="button-add-product">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Product
                </Button>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No products available. Create products first.</p>
                </div>
              ) : (
                productEntries.map((entry, index) => {
                  const productData = getProductData(entry.productId);
                  const entryTotal = getTotalQuantity(entry);

                  return (
                    <div key={entry.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Product {index + 1}</span>
                        </div>
                        {productEntries.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeProduct(entry.id)}
                            data-testid={`button-remove-product-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Product</Label>
                          <Select
                            value={entry.productId}
                            onValueChange={(v) => updateProduct(entry.id, "productId", v)}
                          >
                            <SelectTrigger data-testid={`select-product-${index}`}>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Cost Price per Unit (₹)</Label>
                          <Input
                            type="number"
                            value={entry.costPrice}
                            onChange={(e) => updateProduct(entry.id, "costPrice", e.target.value)}
                            placeholder="Enter cost price"
                            data-testid={`input-cost-price-${index}`}
                          />
                        </div>
                      </div>

                      {productData && productData.variants.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm">Variants (Color / Size)</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {productData.variants.map((variant) => (
                              <div key={variant.id} className="flex items-center gap-2 p-2 border rounded-md">
                                <div className="flex-1 text-sm">
                                  <div className="flex items-center gap-1">
                                    {variant.color && (
                                      <div
                                        className="w-3 h-3 rounded-full border"
                                        style={{
                                          backgroundColor:
                                            variant.color.toLowerCase() === "white"
                                              ? "#f8f8f8"
                                              : variant.color.toLowerCase(),
                                        }}
                                      />
                                    )}
                                    <span>{variant.color || "-"}</span>
                                    <span className="text-muted-foreground">/ {variant.size || "-"}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground font-mono">{variant.sku}</p>
                                </div>
                                <Input
                                  type="number"
                                  min="0"
                                  className="w-16 h-8 text-sm"
                                  value={entry.quantities[variant.id] || ""}
                                  onChange={(e) =>
                                    updateVariantQuantity(entry.id, variant.id, parseInt(e.target.value) || 0)
                                  }
                                  placeholder="0"
                                  data-testid={`input-qty-${variant.sku}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {productData && productData.variants.length === 0 && (
                        <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                          No variants found for this product.
                        </div>
                      )}

                      {entryTotal > 0 && (
                        <div className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                          <span>Subtotal:</span>
                          <span className="font-medium">{entryTotal} units | ₹{getTotalCost(entry).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {grandQuantity > 0 && (
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span>Total Units:</span>
                  <span className="font-semibold">{grandQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Grand Total:</span>
                  <span className="text-lg font-bold">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-receive">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedSupplier || grandQuantity === 0}
            data-testid="button-confirm-receive"
          >
            Receive Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
