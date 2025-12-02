import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { SearchInput } from "@/components/SearchInput";
import { ProductVariantTable } from "@/components/ProductVariantTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Plus, Package, Eye } from "lucide-react";
import { mockProducts, type Product } from "@/lib/mockData";

export default function Products() {
  const [products, setProducts] = useState(mockProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "",
    colors: "",
    sizes: "",
    costPrice: "",
    sellingPrice: "",
  });

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      key: "name",
      header: "Product",
      sortable: true,
      render: (p: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.category}</p>
          </div>
        </div>
      ),
    },
    {
      key: "variants",
      header: "Variants",
      render: (p: Product) => (
        <Badge variant="secondary">{p.variants.length} SKUs</Badge>
      ),
    },
    {
      key: "totalStock",
      header: "Total Stock",
      render: (p: Product) => {
        const total = p.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
        return <span className="font-semibold">{total}</span>;
      },
    },
    {
      key: "priceRange",
      header: "Price Range",
      render: (p: Product) => {
        const prices = p.variants.map((v) => v.sellingPrice);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? `₹${min}` : `₹${min} - ₹${max}`;
      },
    },
    {
      key: "actions",
      header: "",
      render: (p: Product) => (
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
        id: `new-${Date.now()}-${color}-${size}`,
        sku: `${newProduct.name.substring(0, 3).toUpperCase()}-${color.substring(0, 3).toUpperCase()}-${size}`,
        color,
        size,
        stockQuantity: 0,
        costPrice: parseFloat(newProduct.costPrice) || 0,
        sellingPrice: parseFloat(newProduct.sellingPrice) || 0,
      }))
    );

    const product: Product = {
      id: String(products.length + 1),
      name: newProduct.name,
      description: newProduct.description,
      category: newProduct.category,
      variants,
    };

    setProducts((prev) => [...prev, product]);
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
  };

  const totalProducts = products.length;
  const totalSKUs = products.reduce((sum, p) => sum + p.variants.length, 0);
  const totalStock = products.reduce(
    (sum, p) => sum + p.variants.reduce((s, v) => s + v.stockQuantity, 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-add-product">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold">{totalProducts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total SKUs</p>
            <p className="text-2xl font-bold">{totalSKUs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Stock</p>
            <p className="text-2xl font-bold">{totalStock.toLocaleString()}</p>
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
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
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
                <Label>Colors (comma-separated)</Label>
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
                <Label>Sizes (comma-separated)</Label>
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
              disabled={!newProduct.name || !newProduct.colors || !newProduct.sizes}
              data-testid="button-submit-product"
            >
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
                <SheetTitle>{selectedProduct.name}</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p>{selectedProduct.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p>{selectedProduct.description}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Variants ({selectedProduct.variants.length})
                  </p>
                  <ProductVariantTable variants={selectedProduct.variants} />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
