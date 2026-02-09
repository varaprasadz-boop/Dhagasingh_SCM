import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, ShoppingCart, IndianRupee, Clock, TrendingUp, Package, Calendar } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { B2BOrder } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import B2BSalesAgentDashboard from "./B2BSalesAgentDashboard";

type ViewMode = "today" | "range" | "all";

interface PeriodMetrics {
  orderCount: number;
  revenue: number;
  amountReceived: number;
  amountPending: number;
}

interface DashboardStats {
  totalClients: number;
  activeOrders: number;
  totalOrders: number;
  totalRevenue: number;
  amountReceived: number;
  amountPending: number;
  totalTShirtsDelivered: number;
  earningsDelivered: number;
  ordersByStatus: Record<string, number>;
  ordersByPaymentStatus: Record<string, number>;
  recentOrders: B2BOrder[];
  overduePayments: { orderId: string; orderNumber: string; amount: number; dueDate: Date }[];
  byPeriod?: { today: PeriodMetrics };
  customRange?: PeriodMetrics;
}

const statusLabels: Record<string, string> = {
  order_received: "Order Received",
  design_review: "Design Review",
  client_approval: "Client Approval",
  production_scheduled: "Production Scheduled",
  printing_in_progress: "Printing",
  quality_check: "Quality Check",
  packed: "Packed",
  dispatched: "Dispatched",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

const paymentStatusLabels: Record<string, string> = {
  not_paid: "Not Paid",
  advance_received: "Advance Received",
  partially_paid: "Partially Paid",
  fully_paid: "Fully Paid",
};

function formatDateForInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function B2BDashboard() {
  const { hasPermission, isSuperAdmin } = useAuth();
  const canViewAllB2BData = isSuperAdmin || hasPermission("view_all_b2b_data");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const todayStr = formatDateForInput(new Date());
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);

  const dashboardUrl =
    viewMode === "range" && fromDate && toDate
      ? `/api/b2b/dashboard?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`
      : "/api/b2b/dashboard";
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: [dashboardUrl],
  });

  const periodMetrics =
    viewMode === "today" && stats?.byPeriod
      ? stats.byPeriod.today
      : viewMode === "range"
        ? stats?.customRange
        : null;
  const displayOrderCount = periodMetrics?.orderCount ?? stats?.totalOrders ?? 0;
  const displayActiveOrders = viewMode === "all" ? (stats?.activeOrders ?? 0) : (periodMetrics?.orderCount ?? 0);
  const displayAmountReceived = periodMetrics?.amountReceived ?? stats?.amountReceived ?? 0;
  const displayAmountPending = periodMetrics?.amountPending ?? stats?.amountPending ?? 0;
  const displayRevenue = periodMetrics?.revenue ?? stats?.totalRevenue ?? 0;

  // Show sales agent dashboard for users who can only see their own data
  if (!canViewAllB2BData) {
    return <B2BSalesAgentDashboard />;
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">B2B Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">B2B Dashboard</h1>
          <p className="text-muted-foreground">Corporate orders and printing customization</p>
        </div>
        <div className="flex gap-2">
          <Link href="/b2b/clients">
            <Button variant="outline" data-testid="link-clients">
              <Building2 className="h-4 w-4 mr-2" />
              Manage Clients
            </Button>
          </Link>
          <Link href="/b2b/orders">
            <Button data-testid="link-new-order">
              <ShoppingCart className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4" data-testid="dashboard-date-controls">
        <Button
          variant={viewMode === "today" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("today")}
          data-testid="button-today"
        >
          Today
        </Button>
        <Button
          variant={viewMode === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("all")}
          data-testid="button-all"
        >
          All
        </Button>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="b2b-from-date" className="text-xs">From</Label>
            <Input
              id="b2b-from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-[140px]"
              data-testid="input-from-date"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="b2b-to-date" className="text-xs">To</Label>
            <Input
              id="b2b-to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-[140px]"
              data-testid="input-to-date"
            />
          </div>
          <Button
            variant={viewMode === "range" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("range")}
            data-testid="button-apply-range"
          >
            <Calendar className="h-4 w-4 mr-1" />
            Apply range
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-clients">
              {stats?.totalClients || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active corporate accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {viewMode === "all" ? "Active Orders" : "Orders"}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-active-orders">
              {displayActiveOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              {viewMode === "all"
                ? `of ${stats?.totalOrders || 0} total orders`
                : "in selected period"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-amount-received">
              {formatCurrency(displayAmountReceived)}
            </div>
            <p className="text-xs text-muted-foreground">
              of {formatCurrency(displayRevenue)} {viewMode === "all" ? "total" : "in period"}
            </p>
          </CardContent>
        </Card>

        <Link href="/b2b/orders?view=pending">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50 h-full" data-testid="card-amount-pending">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Amount Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600" data-testid="stat-amount-pending">
                {formatCurrency(displayAmountPending)}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting collection — click to view list</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total T-shirts (delivered)</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-tshirts-delivered">
              {stats?.totalTShirtsDelivered ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Item count from delivered orders only</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earnings (delivered)</CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600" data-testid="stat-earnings-delivered">
              {formatCurrency(stats?.earningsDelivered ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Amount received from delivered orders only</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats?.ordersByStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm">{statusLabels[status] || status}</span>
                  <Badge variant="secondary" data-testid={`status-count-${status}`}>
                    {count}
                  </Badge>
                </div>
              ))}
              {Object.keys(stats?.ordersByStatus || {}).length === 0 && (
                <p className="text-sm text-muted-foreground">No orders yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats?.ordersByPaymentStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm">{paymentStatusLabels[status] || status}</span>
                  <Badge
                    variant={status === "fully_paid" ? "default" : "secondary"}
                    data-testid={`payment-status-count-${status}`}
                  >
                    {count}
                  </Badge>
                </div>
              ))}
              {Object.keys(stats?.ordersByPaymentStatus || {}).length === 0 && (
                <p className="text-sm text-muted-foreground">No orders yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-lg">Recent Orders</CardTitle>
          <Link href="/b2b/orders">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="space-y-3">
              {stats.recentOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                >
                  <div>
                    <p className="font-medium" data-testid={`order-number-${order.id}`}>
                      {order.orderNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(parseFloat(order.totalAmount))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{statusLabels[order.status] || order.status}</Badge>
                    <Link href={`/b2b/orders/${order.id}`}>
                      <Button size="sm" variant="ghost">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No orders yet</p>
              <Link href="/b2b/orders">
                <Button className="mt-4" variant="outline">
                  Create First Order
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
