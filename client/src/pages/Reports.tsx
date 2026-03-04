import { useState } from "react";
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

  const [complaintsReportRange, setComplaintsReportRange] = useState("30");
  const fromDate = (() => {
    const d = new Date();
    const n = parseInt(complaintsReportRange, 10) || 30;
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
  })();
  const toDate = new Date().toISOString().split("T")[0];
  const { data: complaintsReturnsReport } = useQuery<any>({
    queryKey: ["/api/reports/complaints-returns", fromDate, toDate],
    queryFn: async () => {
      const res = await fetch(`/api/reports/complaints-returns?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
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
          <TabsTrigger value="complaints-returns">Complaints & Returns</TabsTrigger>
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

        <TabsContent value="complaints-returns" className="space-y-6 mt-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Date range:</span>
            <Select value={complaintsReportRange} onValueChange={setComplaintsReportRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {complaintsReturnsReport && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Complaints</p>
                    <p className="text-2xl font-bold">{complaintsReturnsReport.complaintSummary?.total ?? 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Resolution Rate</p>
                    <p className="text-2xl font-bold">{(complaintsReturnsReport.complaintSummary?.resolutionRate ?? 0).toFixed(1)}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Avg Resolution (days)</p>
                    <p className="text-2xl font-bold">{(complaintsReturnsReport.complaintSummary?.avgResolutionDays ?? 0).toFixed(1)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Refund Amount</p>
                    <p className="text-2xl font-bold">₹{(complaintsReturnsReport.complaintSummary?.totalRefundAmount ?? 0).toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Replacements Sent</p>
                    <p className="text-2xl font-bold">{complaintsReturnsReport.complaintSummary?.totalReplacements ?? 0}</p>
                  </CardContent>
                </Card>
              </div>
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Complaints by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {["general", "refund", "replacement"].map((cat) => (
                        <div key={cat} className="flex justify-between text-sm">
                          <span className="capitalize">{cat}</span>
                          <span className="font-medium">{complaintsReturnsReport.byCategory?.[cat] ?? 0}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Return Product Condition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Good</span>
                        <span className="font-medium text-green-600">{complaintsReturnsReport.returnCondition?.good ?? 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Damaged</span>
                        <span className="font-medium text-orange-600">{complaintsReturnsReport.returnCondition?.damaged ?? 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Complaints by Reason</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(complaintsReturnsReport.byReason ?? []).map(({ reason, count }: { reason: string; count: number }) => (
                        <div key={reason} className="flex justify-between text-sm">
                          <span>{reason.replace(/_/g, " ")}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Damaged Stock Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Total damaged units</p>
                    <p className="text-2xl font-bold text-orange-600">{complaintsReturnsReport.damagedStock?.totalUnits ?? 0}</p>
                    <p className="text-sm text-muted-foreground mt-2">Value at cost</p>
                    <p className="text-xl font-bold">₹{(complaintsReturnsReport.damagedStock?.totalValue ?? 0).toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">RTO Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total RTO orders</p>
                      <p className="text-xl font-bold">{complaintsReturnsReport.rtoAnalysis?.totalRto ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">RTO received — Good</p>
                      <p className="text-xl font-bold text-green-600">{complaintsReturnsReport.rtoAnalysis?.rtoReceivedGood ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">RTO received — Damaged</p>
                      <p className="text-xl font-bold text-orange-600">{complaintsReturnsReport.rtoAnalysis?.rtoReceivedDamaged ?? 0}</p>
                    </div>
                  </div>
                  {(complaintsReturnsReport.rtoAnalysis?.byCourier ?? []).length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium text-muted-foreground mb-2">RTO rate by courier partner</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Courier</th>
                              <th className="text-right py-2">Total orders</th>
                              <th className="text-right py-2">RTO</th>
                              <th className="text-right py-2">RTO %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(complaintsReturnsReport.rtoAnalysis.byCourier ?? [])
                              .filter((c: any) => c.courierId !== "unknown" || c.rto > 0)
                              .sort((a: any, b: any) => (b.rtoRate ?? 0) - (a.rtoRate ?? 0))
                              .map((c: any, i: number) => (
                                <tr key={c.courierId ?? i} className="border-b">
                                  <td className="py-2">{c.courierName ?? c.courierId ?? "—"}</td>
                                  <td className="text-right py-2">{c.total ?? 0}</td>
                                  <td className="text-right py-2">{c.rto ?? 0}</td>
                                  <td className="text-right py-2 font-medium">{(c.rtoRate ?? 0).toFixed(1)}%</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Refund Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Order #</th>
                          <th className="text-right py-2">Amount</th>
                          <th className="text-left py-2">Mode</th>
                          <th className="text-left py-2">Date</th>
                          <th className="text-left py-2">Processed by</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(complaintsReturnsReport.refundList ?? []).map((r: any, i: number) => (
                          <tr key={i} className="border-b">
                            <td className="py-2 font-mono">{r.orderNumber}</td>
                            <td className="text-right py-2">₹{r.amount?.toLocaleString()}</td>
                            <td className="py-2">{r.mode}</td>
                            <td className="py-2">{r.date}</td>
                            <td className="py-2">{r.processedBy ?? "—"}</td>
                          </tr>
                        ))}
                        {(complaintsReturnsReport.refundList ?? []).length === 0 && (
                          <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No refunds in period</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
