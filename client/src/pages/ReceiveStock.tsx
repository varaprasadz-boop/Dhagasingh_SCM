import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/FileUpload";
import { Plus, Trash2, Package, Loader2, Check, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Supplier, ProductWithVariants } from "@shared/schema";

interface VariantEntry {
  quantity: number;
  costPrice: string;
}

interface ProductEntry {
  id: string;
  productId: string;
  variants: Record<string, VariantEntry>;
}

export default function ReceiveStock() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [invoicePhoto, setInvoicePhoto] = useState<File | null>(null);
  const [productEntries, setProductEntries] = useState<ProductEntry[]>([
    { id: "1", productId: "", variants: {} },
  ]);
  const productsContainerRef = useRef<HTMLDivElement>(null);

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<ProductWithVariants[]>({
    queryKey: ["/api/products"],
  });

  const batchReceiveMutation = useMutation({
    mutationFn: async (data: {
      supplierId: string;
      invoiceNumber: string;
      invoiceDate: string;
      products: ProductEntry[];
    }) => {
      const response = await apiRequest("POST", "/api/stock-movements/batch-receive", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      const summary = data?.summary || { totalUnits: 0, totalValue: 0 };
      toast({
        title: "Stock Received Successfully",
        description: `${summary.totalUnits} units received (₹${summary.totalValue.toFixed(2)} total)`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      navigate("/inventory");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to receive stock",
        variant: "destructive",
      });
    },
  });

  const activeSuppliers = suppliers.filter((s) => s.status === "active");

  const addProduct = () => {
    setProductEntries((prev) => [
      ...prev,
      { id: String(Date.now()), productId: "", variants: {} },
    ]);
  };

  useEffect(() => {
    if (productEntries.length > 1 && productsContainerRef.current) {
      setTimeout(() => {
        productsContainerRef.current?.scrollTo({
          top: productsContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [productEntries.length]);

  const removeProduct = (id: string) => {
    if (productEntries.length > 1) {
      setProductEntries((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const updateVariant = (
    productEntryId: string,
    variantId: string,
    field: "quantity" | "costPrice",
    value: number | string
  ) => {
    setProductEntries((prev) =>
      prev.map((p) => {
        if (p.id !== productEntryId) return p;
        const existingVariant = p.variants[variantId] || { quantity: 0, costPrice: "" };
        return {
          ...p,
          variants: {
            ...p.variants,
            [variantId]: { ...existingVariant, [field]: value },
          },
        };
      })
    );
  };

  const initializeVariantsWithDefaultPrice = (productEntryId: string, productId: string) => {
    const productData = products.find((p) => p.id === productId);
    if (!productData) return;

    setProductEntries((prev) =>
      prev.map((p) => {
        if (p.id !== productEntryId) return p;
        const newVariants: Record<string, VariantEntry> = {};
        productData.variants.forEach((v) => {
          newVariants[v.id] = { quantity: 0, costPrice: v.costPrice || "" };
        });
        return { ...p, productId, variants: newVariants };
      })
    );
  };

  const getProductData = (productId: string): ProductWithVariants | undefined => {
    return products.find((p) => p.id === productId);
  };

  const getTotalQuantity = (entry: ProductEntry) => {
    if (!entry.variants || Object.keys(entry.variants).length === 0) return 0;
    return Object.values(entry.variants).reduce((sum, v) => {
      const qty = typeof v.quantity === 'number' ? v.quantity : (parseInt(String(v.quantity)) || 0);
      return sum + qty;
    }, 0);
  };

  const getTotalCost = (entry: ProductEntry) => {
    if (!entry.variants || Object.keys(entry.variants).length === 0) return 0;
    return Object.values(entry.variants).reduce((sum, v) => {
      const qty = typeof v.quantity === 'number' ? v.quantity : (parseInt(String(v.quantity)) || 0);
      const cost = parseFloat(String(v.costPrice)) || 0;
      return sum + qty * cost;
    }, 0);
  };

  const grandTotal = productEntries.reduce((sum, p) => sum + getTotalCost(p), 0);
  const grandQuantity = productEntries.reduce((sum, p) => sum + getTotalQuantity(p), 0);

  const handleSubmit = () => {
    if (!selectedSupplier) {
      toast({
        title: "Supplier required",
        description: "Please select a supplier before receiving stock",
        variant: "destructive",
      });
      return;
    }
    
    if (productEntries.every((p) => !p.productId)) {
      toast({
        title: "Product required",
        description: "Please select at least one product to receive stock",
        variant: "destructive",
      });
      return;
    }

    const validProducts = productEntries.filter((p) => {
      if (!p.productId || !p.variants) return false;
      return Object.values(p.variants).some((v) => {
        const qty = typeof v.quantity === 'number' ? v.quantity : (parseInt(String(v.quantity)) || 0);
        return qty > 0;
      });
    });
    
    if (validProducts.length === 0) {
      toast({
        title: "No items to receive",
        description: "Please enter quantity for at least one variant",
        variant: "destructive",
      });
      return;
    }

    batchReceiveMutation.mutate({
      supplierId: selectedSupplier,
      invoiceNumber,
      invoiceDate,
      products: validProducts,
    });
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-receive-stock">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/inventory")}
          data-testid="button-back-to-inventory"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Receive Stock</h1>
          <p className="text-muted-foreground">Add multiple products with variants in a single receipt</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Products</CardTitle>
              <Button variant="outline" size="sm" onClick={addProduct} data-testid="button-add-product">
                <Plus className="h-4 w-4 mr-1" />
                Add Product
              </Button>
            </CardHeader>
            <CardContent>
              <div 
                ref={productsContainerRef}
                className="space-y-4 max-h-[60vh] overflow-y-auto pr-2"
              >
                {productsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin opacity-50" />
                    <p>Loading products...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No products available. Create products first.</p>
                  </div>
                ) : (
                  productEntries.map((entry, index) => {
                    const productData = getProductData(entry.productId);
                    const entryTotal = getTotalQuantity(entry);

                    return (
                      <div key={entry.id} className="border-2 border-border bg-card rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-foreground">Product {index + 1}</span>
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

                        <div className="space-y-2">
                          <Label>Select a product to add stock</Label>
                          <Select
                            value={entry.productId}
                            onValueChange={(v) => initializeVariantsWithDefaultPrice(entry.id, v)}
                          >
                            <SelectTrigger data-testid={`select-product-${index}`}>
                              <SelectValue placeholder="Choose product from list..." />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} ({product.variants.length} variants)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {productData && productData.variants.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                              Add each color+size as a <strong>separate variant</strong> in Products (e.g. Maroon / S, Maroon / M, Maroon / L) for correct stock tracking. One row per variant here.
                            </p>
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">Variants (Color / Size)</Label>
                              <span className="text-xs text-muted-foreground">
                                Enter quantity and cost for each variant
                              </span>
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-muted/50">
                                    <tr>
                                      <th className="text-left p-3 font-medium">Variant</th>
                                      <th className="text-left p-3 font-medium">SKU</th>
                                      <th className="text-center p-3 font-medium w-28">Qty</th>
                                      <th className="text-center p-3 font-medium w-32">Cost (₹)</th>
                                      <th className="text-right p-3 font-medium w-28">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {productData.variants.map((variant) => {
                                      const variantData = (entry.variants && entry.variants[variant.id]) || { quantity: 0, costPrice: "" };
                                      const lineTotal = (variantData.quantity || 0) * (parseFloat(variantData.costPrice) || 0);
                                      return (
                                        <tr key={variant.id} className="hover:bg-muted/30">
                                          <td className="p-3">
                                            <div className="flex items-center gap-2">
                                              {variant.color && (
                                                <div
                                                  className="w-4 h-4 rounded-full border shrink-0"
                                                  style={{
                                                    backgroundColor:
                                                      variant.color.toLowerCase() === "white"
                                                        ? "#f8f8f8"
                                                        : variant.color.toLowerCase(),
                                                  }}
                                                />
                                              )}
                                              <span>
                                                {variant.color || "-"} / {variant.size || "-"}
                                              </span>
                                            </div>
                                          </td>
                                          <td className="p-3">
                                            <span className="font-mono text-xs text-muted-foreground">
                                              {variant.sku}
                                            </span>
                                          </td>
                                          <td className="p-3">
                                            <Input
                                              type="number"
                                              min="0"
                                              className="w-24 h-9 text-sm text-center"
                                              value={variantData.quantity || ""}
                                              onChange={(e) =>
                                                updateVariant(entry.id, variant.id, "quantity", parseInt(e.target.value) || 0)
                                              }
                                              placeholder="0"
                                              data-testid={`input-qty-${variant.sku}`}
                                            />
                                          </td>
                                          <td className="p-3">
                                            <Input
                                              type="number"
                                              min="0"
                                              step="0.01"
                                              className="w-28 h-9 text-sm text-center"
                                              value={variantData.costPrice || ""}
                                              onChange={(e) =>
                                                updateVariant(entry.id, variant.id, "costPrice", e.target.value)
                                              }
                                              placeholder="0.00"
                                              data-testid={`input-cost-${variant.sku}`}
                                            />
                                          </td>
                                          <td className="p-3 text-right font-medium">
                                            {lineTotal > 0 ? `₹${lineTotal.toFixed(2)}` : "-"}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}

                        {productData && productData.variants.length === 0 && (
                          <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                            No variants found for this product.
                          </div>
                        )}

                        {entryTotal > 0 && (
                          <div className="flex items-center justify-between p-3 bg-muted rounded-md text-sm">
                            <span>Subtotal:</span>
                            <span className="font-medium">{entryTotal} units | ₹{getTotalCost(entry).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {grandQuantity > 0 ? (
                <>
                  <div className="p-4 bg-primary/10 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Units:</span>
                      <span className="font-semibold">{grandQuantity}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-medium">Grand Total:</span>
                      <span className="text-xl font-bold">₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {productEntries.filter(p => p.productId && getTotalQuantity(p) > 0).length} product(s) with stock to receive
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select products and enter quantities to see summary</p>
                </div>
              )}

              <Separator />

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedSupplier || grandTotal === 0 || batchReceiveMutation.isPending}
                  className="w-full"
                  size="lg"
                  data-testid="button-confirm-receive"
                >
                  {batchReceiveMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Receiving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Receive Stock
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/inventory")} 
                  disabled={batchReceiveMutation.isPending}
                  className="w-full"
                  data-testid="button-cancel-receive"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
