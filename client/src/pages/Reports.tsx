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
import { Download, TrendingUp, TrendingDown, Package, Truck, AlertCircle } from "lucide-react";
import { dashboardStats, mockOrders, mockProducts } from "@/lib/mockData";

export default function Reports() {
  const totalOrderValue = mockOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgOrderValue = totalOrderValue / mockOrders.length;
  const codOrders = mockOrders.filter((o) => o.paymentMethod === "cod").length;
  const prepaidOrders = mockOrders.filter((o) => o.paymentMethod === "prepaid").length;

  const totalInventoryValue = mockProducts.reduce(
    (sum, p) => sum + p.variants.reduce((s, v) => s + v.stockQuantity * v.costPrice, 0),
    0
  );

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
                <p className="text-2xl font-bold mt-2">₹{totalOrderValue.toLocaleString()}</p>
                <p className="text-xs text-green-600">+12% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Total Orders</span>
                </div>
                <p className="text-2xl font-bold mt-2">{mockOrders.length}</p>
                <p className="text-xs text-muted-foreground">Avg ₹{avgOrderValue.toFixed(0)}/order</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-muted-foreground">Delivery Rate</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {((dashboardStats.deliveredOrders / (dashboardStats.deliveredOrders + dashboardStats.rtoOrders)) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-green-600">Above target</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-muted-foreground">RTO Rate</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {((dashboardStats.rtoOrders / (dashboardStats.deliveredOrders + dashboardStats.rtoOrders)) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-red-600">Needs attention</p>
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
                    { label: "Pending", value: dashboardStats.pendingOrders, color: "bg-yellow-500" },
                    { label: "Dispatched", value: dashboardStats.dispatchedOrders, color: "bg-blue-500" },
                    { label: "Delivered", value: dashboardStats.deliveredOrders, color: "bg-green-500" },
                    { label: "RTO", value: dashboardStats.rtoOrders, color: "bg-red-500" },
                  ].map((item) => {
                    const total = dashboardStats.pendingOrders + dashboardStats.dispatchedOrders + dashboardStats.deliveredOrders + dashboardStats.rtoOrders;
                    const percentage = (item.value / total) * 100;
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.label}</span>
                          <span className="font-medium">{item.value} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full`}
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
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Prepaid</span>
                      <span className="font-medium text-green-600">{prepaidOrders} orders</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(prepaidOrders / mockOrders.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Cash on Delivery</span>
                      <span className="font-medium text-orange-600">{codOrders} orders</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${(codOrders / mockOrders.length) * 100}%` }}
                      />
                    </div>
                  </div>
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
                <p className="text-2xl font-bold">{mockOrders.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">₹{avgOrderValue.toFixed(0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">COD Orders</p>
                <p className="text-2xl font-bold">{codOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Prepaid Orders</p>
                <p className="text-2xl font-bold">{prepaidOrders}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Units</p>
                <p className="text-2xl font-bold">{dashboardStats.totalInventory.toLocaleString()}</p>
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
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-orange-600">{dashboardStats.lowStockItems}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total SKUs</p>
                <p className="text-2xl font-bold">
                  {mockProducts.reduce((sum, p) => sum + p.variants.length, 0)}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Deliveries</p>
                <p className="text-2xl font-bold">{dashboardStats.deliveredOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">RTO Count</p>
                <p className="text-2xl font-bold text-red-600">{dashboardStats.rtoOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Delivery Cost</p>
                <p className="text-2xl font-bold">₹{dashboardStats.totalDeliveryCost.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Avg Cost/Delivery</p>
                <p className="text-2xl font-bold">
                  ₹{(dashboardStats.totalDeliveryCost / dashboardStats.deliveredOrders).toFixed(0)}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
