import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/DataTable";
import { SearchInput } from "@/components/SearchInput";
import { ProductVariantTable } from "@/components/ProductVariantTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Package, Eye, Loader2, Trash2, Upload, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ProductImportModal } from "@/components/ProductImportModal";
import type { ProductWithVariants, ProductVariant } from "@shared/schema";
import type { UseMutationResult } from "@tanstack/react-query";

function EditProductDialog({
  product,
  open,
  onOpenChange,
  onSuccess,
  updateProductMutation,
  updateVariantMutation,
}: {
  product: ProductWithVariants;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  updateProductMutation: UseMutationResult<unknown, Error, { id: string; data: { name?: string; description?: string; category?: string; isActive?: boolean } }>;
  updateVariantMutation: UseMutationResult<unknown, Error, { id: string; data: Partial<{ stockQuantity: number; costPrice: string; sellingPrice: string }> }>;
}) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [category, setCategory] = useState(product.category ?? "");
  const [isActive, setIsActive] = useState((product as ProductWithVariants & { isActive?: boolean }).isActive !== false);
  const [variants, setVariants] = useState(
    product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      color: v.color ?? "",
      size: v.size ?? "",
      stockQuantity: v.stockQuantity,
      costPrice: String(v.costPrice ?? "0"),
      sellingPrice: String(v.sellingPrice ?? "0"),
    }))
  );

  const handleSave = async () => {
    updateProductMutation.mutate(
      { id: product.id, data: { name, description, category, isActive } },
      {
        onSuccess: () => {
          variants.forEach((v) => {
            const orig = product.variants.find((p) => p.id === v.id);
            if (!orig) return;
            const changed =
              orig.stockQuantity !== v.stockQuantity ||
              String(orig.costPrice) !== v.costPrice ||
              String(orig.sellingPrice) !== v.sellingPrice;
            if (changed) {
              updateVariantMutation.mutate({
                id: v.id,
                data: {
                  stockQuantity: v.stockQuantity,
                  costPrice: v.costPrice,
                  sellingPrice: v.sellingPrice,
                },
              });
            }
          });
          onSuccess();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-product">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update product details and variant prices/stock.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Product Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="edit-product-name" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} data-testid="edit-product-category" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} data-testid="edit-product-description" />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Active</Label>
              <p className="text-xs text-muted-foreground">Inactive products can be hidden from listings.</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} data-testid="edit-product-active" />
          </div>
          <div>
            <Label className="mb-2 block">Variants</Label>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {variants.map((v, i) => (
                <div key={v.id} className="p-3 border rounded-lg space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">{v.sku} {v.color && `• ${v.color}`} {v.size && `• ${v.size}`}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Stock</Label>
                      <Input
                        type="number"
                        min={0}
                        value={v.stockQuantity}
                        onChange={(e) =>
                          setVariants((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], stockQuantity: parseInt(e.target.value, 10) || 0 };
                            return next;
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Cost (₹)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={v.costPrice}
                        onChange={(e) =>
                          setVariants((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], costPrice: e.target.value };
                            return next;
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Selling (₹)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={v.sellingPrice}
                        onChange={(e) =>
                          setVariants((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], sellingPrice: e.target.value };
                            return next;
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateProductMutation.isPending}
            data-testid="button-save-edit-product"
          >
            {updateProductMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Products() {
  const { toast } = useToast();
  const { hasPermission, isSuperAdmin } = useAuth();
  const canEdit = isSuperAdmin || hasPermission("edit_products");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithVariants | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithVariants | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductWithVariants | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "",
    colors: "",
    sizes: "",
    costPrice: "",
    sellingPrice: "",
  });

  const { data: products = [], isLoading } = useQuery<ProductWithVariants[]>({
    queryKey: ["/api/products"],
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description: string;
      category: string;
      variants: {
        sku: string;
        color: string;
        size: string;
        stockQuantity: number;
        costPrice: string;
        sellingPrice: string;
      }[];
    }) => apiRequest("POST", "/api/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product created successfully" });
      setCreateDialogOpen(false);
      setNewProduct({
        name: "",
        description: "",
        category: "",
        colors: "",
        sizes: "",
        costPrice: "",
        sellingPrice: "",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create product", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product deleted successfully" });
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
      setDetailsOpen(false);
      setSelectedProduct(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete product", description: error.message, variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; category?: string; isActive?: boolean } }) =>
      apiRequest("PATCH", `/api/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update product", description: error.message, variant: "destructive" });
    },
  });

  const updateVariantMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ stockQuantity: number; costPrice: string; sellingPrice: string }> }) =>
      apiRequest("PATCH", `/api/variants/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update variant", description: error.message, variant: "destructive" });
    },
  });

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const columns = [
    {
      key: "name",
      header: "Product",
      sortable: true,
      render: (p: ProductWithVariants & { isActive?: boolean }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{p.name}</p>
              {(p as { isActive?: boolean }).isActive === false && (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{p.category || "Uncategorized"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "variants",
      header: "Variants",
      render: (p: ProductWithVariants) => (
        <Badge variant="secondary">{p.variants.length} SKUs</Badge>
      ),
    },
    {
      key: "totalStock",
      header: "Total Stock",
      render: (p: ProductWithVariants) => {
        const total = p.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
        return <span className="font-semibold">{total}</span>;
      },
    },
    {
      key: "priceRange",
      header: "Price Range",
      render: (p: ProductWithVariants) => {
        if (p.variants.length === 0) return "-";
        const prices = p.variants.map((v) => parseFloat(v.sellingPrice));
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? `₹${min}` : `₹${min} - ₹${max}`;
      },
    },
    {
      key: "actions",
      header: "",
      render: (p: ProductWithVariants) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedProduct(p);
            setDetailsOpen(true);
          }}
          data-testid={`button-view-product-${p.id}`}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      ),
    },
  ];

  const handleCreateProduct = () => {
    const colors = newProduct.colors.split(",").map((c) => c.trim()).filter(Boolean);
    const sizes = newProduct.sizes.split(",").map((s) => s.trim()).filter(Boolean);

    const variants = colors.flatMap((color) =>
      sizes.map((size) => ({
        sku: `${newProduct.name.substring(0, 3).toUpperCase()}-${color.substring(0, 3).toUpperCase()}-${size}`,
        color,
        size,
        stockQuantity: 0,
        costPrice: newProduct.costPrice || "0",
        sellingPrice: newProduct.sellingPrice || "0",
      }))
    );

    createMutation.mutate({
      name: newProduct.name,
      description: newProduct.description,
      category: newProduct.category,
      variants,
    });
  };

  const totalProducts = products.length;
  const totalSKUs = products.reduce((sum, p) => sum + p.variants.length, 0);
  const totalStock = products.reduce(
    (sum, p) => sum + p.variants.reduce((s, v) => s + v.stockQuantity, 0),
    0
  );

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
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportModalOpen(true)} data-testid="button-import-products">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-add-product">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold" data-testid="text-total-products">{totalProducts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total SKUs</p>
            <p className="text-2xl font-bold" data-testid="text-total-skus">{totalSKUs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Stock</p>
            <p className="text-2xl font-bold" data-testid="text-total-stock">{totalStock.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <SearchInput
        placeholder="Search products..."
        value={searchQuery}
        onChange={setSearchQuery}
        className="max-w-md"
      />

      <Card>
        <CardContent className="p-0">
          <DataTable
            data={filteredProducts}
            columns={columns}
            getRowId={(p) => p.id}
            onRowClick={(p) => {
              setSelectedProduct(p);
              setDetailsOpen(true);
            }}
            emptyMessage="No products found"
          />
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="modal-create-product">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Create a new product with multiple variants</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Name *</Label>
                <Input
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Classic T-Shirt"
                  data-testid="input-product-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct((prev) => ({ ...prev, category: e.target.value }))
                  }
                  placeholder="Apparel"
                  data-testid="input-product-category"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Product description..."
                data-testid="input-product-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Colors (comma-separated) *</Label>
                <Input
                  value={newProduct.colors}
                  onChange={(e) =>
                    setNewProduct((prev) => ({ ...prev, colors: e.target.value }))
                  }
                  placeholder="Red, Blue, Black"
                  data-testid="input-product-colors"
                />
              </div>
              <div className="space-y-2">
                <Label>Sizes (comma-separated) *</Label>
                <Input
                  value={newProduct.sizes}
                  onChange={(e) =>
                    setNewProduct((prev) => ({ ...prev, sizes: e.target.value }))
                  }
                  placeholder="S, M, L, XL"
                  data-testid="input-product-sizes"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cost Price (₹)</Label>
                <Input
                  type="number"
                  value={newProduct.costPrice}
                  onChange={(e) =>
                    setNewProduct((prev) => ({ ...prev, costPrice: e.target.value }))
                  }
                  placeholder="200"
                  data-testid="input-product-cost"
                />
              </div>
              <div className="space-y-2">
                <Label>Selling Price (₹)</Label>
                <Input
                  type="number"
                  value={newProduct.sellingPrice}
                  onChange={(e) =>
                    setNewProduct((prev) => ({ ...prev, sellingPrice: e.target.value }))
                  }
                  placeholder="499"
                  data-testid="input-product-price"
                />
              </div>
            </div>
            {newProduct.colors && newProduct.sizes && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  This will create{" "}
                  <span className="font-semibold">
                    {newProduct.colors.split(",").filter(Boolean).length *
                      newProduct.sizes.split(",").filter(Boolean).length}
                  </span>{" "}
                  variant SKUs
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateProduct}
              disabled={!newProduct.name || !newProduct.colors || !newProduct.sizes || createMutation.isPending}
              data-testid="button-submit-product"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto" data-testid="sheet-product-details">
          {selectedProduct && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedProduct.name}
                  {(selectedProduct as ProductWithVariants & { isActive?: boolean }).isActive === false && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p>{selectedProduct.category || "Uncategorized"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p>{selectedProduct.description || "No description"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Variants ({selectedProduct.variants.length})
                  </p>
                  <ProductVariantTable variants={selectedProduct.variants as any} />
                </div>
                <div className="pt-4 flex gap-2">
                  {canEdit && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingProduct(selectedProduct);
                        setEditDialogOpen(true);
                      }}
                      data-testid="button-edit-product"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Product
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setProductToDelete(selectedProduct);
                      setDeleteConfirmOpen(true);
                    }}
                    data-testid="button-delete-product"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Product
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This will also delete all variants. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => productToDelete && deleteMutation.mutate(productToDelete.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editingProduct && (
        <EditProductDialog
          key={editingProduct.id}
          product={editingProduct}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={() => {
            setEditDialogOpen(false);
            setEditingProduct(null);
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
          }}
          updateProductMutation={updateProductMutation}
          updateVariantMutation={updateVariantMutation}
        />
      )}

      <ProductImportModal open={importModalOpen} onOpenChange={setImportModalOpen} />
    </div>
  );
}
