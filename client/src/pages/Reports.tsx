import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, TrendingUp, Package, Truck, AlertCircle } from "lucide-react";
import type { Order, Product, Complaint } from "@shared/schema";

interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    dispatched: number;
    delivered: number;
    rto: number;
  };
  products: {
    total: number;
    variants: number;
    lowStock: number;
  };
  complaints: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
  deliveries: {
    total: number;
    pending: number;
    completed: number;
  };
  revenue: {
    total: number;
    pending: number;
  };
}

interface ProductWithVariants extends Product {
  variants: Array<{
    id: string;
    sku: string;
    stockQuantity: number;
    costPrice: string;
    sellingPrice: string;
  }>;
}

export default function Reports() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: products = [] } = useQuery<ProductWithVariants[]>({
    queryKey: ["/api/products"],
  });

  const { data: complaints = [] } = useQuery<Complaint[]>({
    queryKey: ["/api/complaints"],
  });

  const totalOrderValue = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || "0"), 0);
  const avgOrderValue = orders.length > 0 ? totalOrderValue / orders.length : 0;
  const codOrders = orders.filter((o) => o.paymentMethod === "cod").length;
  const prepaidOrders = orders.filter((o) => o.paymentMethod === "prepaid").length;

  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.variants.reduce((s, v) => s + v.stockQuantity * parseFloat(v.costPrice || "0"), 0),
    0
  );

  const deliveredCount = stats?.orders.delivered || 0;
  const rtoCount = stats?.orders.rto || 0;
  const totalDelivered = deliveredCount + rtoCount;
  const deliveryRate = totalDelivered > 0 ? (deliveredCount / totalDelivered) * 100 : 100;
  const rtoRate = totalDelivered > 0 ? (rtoCount / totalDelivered) * 100 : 0;

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="30">
            <SelectTrigger className="w-40" data-testid="select-period">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-export-report">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Total Revenue</span>
                </div>
                <p className="text-2xl font-bold mt-2" data-testid="stat-revenue">₹{totalOrderValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Total Orders</span>
                </div>
                <p className="text-2xl font-bold mt-2" data-testid="stat-orders">{orders.length}</p>
                <p className="text-xs text-muted-foreground">Avg ₹{avgOrderValue.toFixed(0)}/order</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-muted-foreground">Delivery Rate</span>
                </div>
                <p className="text-2xl font-bold mt-2" data-testid="stat-delivery-rate">
                  {deliveryRate.toFixed(1)}%
                </p>
                <p className={`text-xs ${deliveryRate >= 90 ? "text-green-600" : "text-orange-600"}`}>
                  {deliveryRate >= 90 ? "Above target" : "Below target"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-muted-foreground">RTO Rate</span>
                </div>
                <p className="text-2xl font-bold mt-2" data-testid="stat-rto-rate">
                  {rtoRate.toFixed(1)}%
                </p>
                <p className={`text-xs ${rtoRate <= 5 ? "text-green-600" : "text-red-600"}`}>
                  {rtoRate <= 5 ? "On target" : "Needs attention"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "Pending", value: stats?.orders.pending || 0, color: "bg-yellow-500" },
                    { label: "Dispatched", value: stats?.orders.dispatched || 0, color: "bg-blue-500" },
                    { label: "Delivered", value: stats?.orders.delivered || 0, color: "bg-green-500" },
                    { label: "RTO", value: stats?.orders.rto || 0, color: "bg-red-500" },
                  ].map((item) => {
                    const total = (stats?.orders.pending || 0) + (stats?.orders.dispatched || 0) + 
                                  (stats?.orders.delivered || 0) + (stats?.orders.rto || 0);
                    const percentage = total > 0 ? (item.value / total) * 100 : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.label}</span>
                          <span className="font-medium">{item.value} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Method Split</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "COD", value: codOrders, color: "bg-orange-500" },
                    { label: "Prepaid", value: prepaidOrders, color: "bg-green-500" },
                  ].map((item) => {
                    const total = codOrders + prepaidOrders;
                    const percentage = total > 0 ? (item.value / total) * 100 : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.label}</span>
                          <span className="font-medium">{item.value} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{stats?.orders.total || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.orders.pending || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Dispatched</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.orders.dispatched || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold text-green-600">{stats?.orders.delivered || 0}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-xl font-bold">₹{(stats?.revenue.total || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Collection</p>
                  <p className="text-xl font-bold text-orange-600">₹{(stats?.revenue.pending || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Order Value</p>
                  <p className="text-xl font-bold">₹{avgOrderValue.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{stats?.products.total || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Variants</p>
                <p className="text-2xl font-bold">{stats?.products.variants || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.products.lowStock || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Inventory Value</p>
                <p className="text-2xl font-bold">₹{totalInventoryValue.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Internal Deliveries</p>
                <p className="text-2xl font-bold">{stats?.deliveries.total || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Pending Delivery</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.deliveries.pending || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats?.deliveries.completed || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Open Complaints</p>
                <p className="text-2xl font-bold text-red-600">{stats?.complaints.open || 0}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Complaint Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">{stats?.complaints.total || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Open</p>
                  <p className="text-xl font-bold text-orange-600">{stats?.complaints.open || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-xl font-bold text-blue-600">{stats?.complaints.inProgress || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-xl font-bold text-green-600">{stats?.complaints.resolved || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
