import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Users,
  ShoppingCart,
  Clock,
  Plus,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Building2,
  Calendar,
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

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
  monthlyRevenue: number;
  amountReceived: number;
  amountPending: number;
  ordersByStatus: Record<string, number>;
  ordersByPaymentStatus: Record<string, number>;
  recentOrders: any[];
  recentPayments: any[];
  topClients: { id: string; companyName: string; totalRevenue: number; orderCount: number }[];
  actionItems: {
    pendingApprovals: number;
    overduePayments: number;
    pendingInvoices: number;
  };
  byPeriod?: { today: PeriodMetrics };
  customRange?: PeriodMetrics;
}

function formatDateForInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  order_received: "Order Received",
  design_review: "Design Review",
  client_approval: "Client Approval",
  production_scheduled: "Production Scheduled",
  printing_in_progress: "Printing",
  quality_check: "Quality Check",
  packed: "Packed",
  dispatched: "Dispatched",
  delivered: "Delivered",
  closed: "Closed",
  cancelled: "Cancelled",
};

const PIPELINE_STAGES = [
  { key: "order_received", label: "Received", color: "bg-blue-500" },
  { key: "design_review", label: "Design", color: "bg-purple-500" },
  { key: "client_approval", label: "Approval", color: "bg-yellow-500" },
  { key: "production_scheduled", label: "Scheduled", color: "bg-orange-500" },
  { key: "printing_in_progress", label: "Printing", color: "bg-indigo-500" },
  { key: "quality_check", label: "QC", color: "bg-pink-500" },
  { key: "packed", label: "Packed", color: "bg-teal-500" },
  { key: "dispatched", label: "Dispatched", color: "bg-cyan-500" },
  { key: "delivered", label: "Delivered", color: "bg-green-500" },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function B2BSalesAgentDashboard() {
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
  const displayOrders = periodMetrics?.orderCount ?? stats?.totalOrders ?? 0;
  const displayOpenOrders = viewMode === "all" ? (stats?.activeOrders ?? 0) : (periodMetrics?.orderCount ?? 0);
  const displayRevenue = periodMetrics?.revenue ?? stats?.totalRevenue ?? 0;
  const displayAmountReceived = periodMetrics?.amountReceived ?? stats?.amountReceived ?? 0;
  const displayAmountPending = periodMetrics?.amountPending ?? stats?.amountPending ?? 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalPipelineOrders = PIPELINE_STAGES.reduce(
    (sum, stage) => sum + (stats?.ordersByStatus[stage.key] || 0),
    0
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">My Dashboard</h1>
          <p className="text-muted-foreground">Track your sales performance and pipeline</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/b2b/clients">
          <Button data-testid="button-add-client">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </Link>
        <Link href="/b2b/orders">
          <Button variant="outline" data-testid="button-create-order">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Create Order
          </Button>
        </Link>
        <Link href="/b2b/payments">
          <Button variant="outline" data-testid="button-record-payment">
            <CreditCard className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-3 space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Period</Label>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "today" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("today")}
                  className="flex-1"
                >
                  Today
                </Button>
                <Button
                  variant={viewMode === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("all")}
                  className="flex-1"
                >
                  All
                </Button>
              </div>
            </div>
            <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">From</Label>
                <DatePicker
                  id="sales-from-date"
                  value={fromDate}
                  onChange={setFromDate}
                  placeholder="From date"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">To</Label>
                <DatePicker
                  id="sales-to-date"
                  value={toDate}
                  onChange={setToDate}
                  placeholder="To date"
                />
              </div>
              <Button
                variant={viewMode === "range" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("range")}
                className="h-10 shrink-0"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Apply range
              </Button>
            </div>
            <div className="md:col-span-3" />
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
            <CardTitle className="text-sm font-medium">My Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-clients">{stats?.totalClients || 0}</div>
            <p className="text-xs text-muted-foreground">Clients assigned to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
            <CardTitle className="text-sm font-medium">{viewMode === "all" ? "Open Orders" : "Orders"}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-open-orders">{displayOpenOrders}</div>
            <p className="text-xs text-muted-foreground">
              {viewMode === "all" ? "Orders in progress" : "In selected period"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
            <CardTitle className="text-sm font-medium">
              {viewMode === "all" ? "Monthly Revenue" : "Revenue"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-monthly-revenue">
              {formatCurrency(displayRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {viewMode === "all" ? "This month's orders" : "In selected period"}
            </p>
          </CardContent>
        </Card>

        <Link href="/b2b/orders?view=pending">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50 h-full" data-testid="card-pending-payments">
            <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600" data-testid="text-pending-payments">
                {formatCurrency(displayAmountPending)}
              </div>
              <p className="text-xs text-muted-foreground">Outstanding — click to view list</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Action Items */}
      {stats?.actionItems && (stats.actionItems.pendingApprovals > 0 || stats.actionItems.overduePayments > 0 || stats.actionItems.pendingInvoices > 0) && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {stats.actionItems.pendingApprovals > 0 && (
                <Link href="/b2b/orders?status=client_approval">
                  <Badge variant="outline" className="cursor-pointer hover:bg-amber-100" data-testid="badge-pending-approvals">
                    {stats.actionItems.pendingApprovals} orders awaiting client approval
                  </Badge>
                </Link>
              )}
              {stats.actionItems.overduePayments > 0 && (
                <Link href="/b2b/orders?paymentStatus=overdue">
                  <Badge variant="destructive" className="cursor-pointer" data-testid="badge-overdue-payments">
                    {stats.actionItems.overduePayments} overdue payments
                  </Badge>
                </Link>
              )}
              {stats.actionItems.pendingInvoices > 0 && (
                <Link href="/b2b/invoices?status=draft">
                  <Badge variant="outline" className="cursor-pointer hover:bg-amber-100" data-testid="badge-pending-invoices">
                    {stats.actionItems.pendingInvoices} invoices to send
                  </Badge>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Order Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {PIPELINE_STAGES.map((stage) => {
              const count = stats?.ordersByStatus[stage.key] || 0;
              const percentage = totalPipelineOrders > 0 ? (count / totalPipelineOrders) * 100 : 0;
              return (
                <div key={stage.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.label}</span>
                    <span className="text-muted-foreground">{count} orders</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stage.color} transition-all`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Link href="/b2b/orders">
              <Button variant="ghost" size="sm" data-testid="button-view-all-orders">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {stats.recentOrders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{formatCurrency(parseFloat(order.totalAmount))}</p>
                      <Badge variant="outline" className="text-xs">
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent orders</p>
            )}
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg">Top Clients</CardTitle>
            <Link href="/b2b/clients">
              <Button variant="ghost" size="sm" data-testid="button-view-all-clients">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.topClients && stats.topClients.length > 0 ? (
              <div className="space-y-3">
                {stats.topClients.map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{client.companyName}</p>
                        <p className="text-xs text-muted-foreground">{client.orderCount} orders</p>
                      </div>
                    </div>
                    <p className="font-medium text-sm">{formatCurrency(client.totalRevenue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No clients yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-lg">Recent Payments</CardTitle>
          <Link href="/b2b/payments">
            <Button variant="ghost" size="sm" data-testid="button-view-all-payments">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats?.recentPayments && stats.recentPayments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.recentPayments.slice(0, 6).map((payment: any) => (
                <div key={payment.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{payment.paymentMode}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(payment.paymentDate), "MMM d")}
                    </span>
                  </div>
                  <p className="font-bold text-lg">{formatCurrency(parseFloat(payment.amount))}</p>
                  {payment.transactionRef && (
                    <p className="text-xs text-muted-foreground truncate">Ref: {payment.transactionRef}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No recent payments</p>
          )}
        </CardContent>
      </Card>

      {/* Total Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {viewMode === "all" ? "Total Revenue" : "Revenue"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(displayRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Amount Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">{formatCurrency(displayAmountReceived)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {viewMode === "all" ? "Total Orders" : "Orders"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{displayOrders}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
