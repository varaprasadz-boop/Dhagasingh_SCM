import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3, Filter, RotateCcw, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/DataTable";
import * as XLSX from "xlsx";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

interface SummaryResult {
  totalOrders: number;
  totalRevenue: number;
  totalProductCost: number;
  totalCommission: number;
  totalEarning: number;
  ordersByStatus: Record<string, number>;
  paymentCollectionRate: number;
}
interface ClientRow {
  clientId: string;
  clientName: string;
  ordersCount: number;
  totalQty: number;
  revenue: number;
  received: number;
  pending: number;
  commission: number;
  earning: number;
}
interface AgentRow {
  agentId: string;
  agentName: string;
  clientsCount: number;
  ordersCount: number;
  revenue: number;
  commissionEarned: number;
  commissionPending: number;
  collectionRate: number;
}
interface ProductRow {
  productId: string;
  productName: string;
  category: string;
  qtyOrdered: number;
  revenue: number;
  costTotal: number;
  margin: number;
}
interface StatusRow {
  status: string;
  orderCount: number;
  totalValue: number;
  percentOfTotal: number;
}
interface PaymentRow {
  orderId: string;
  orderNumber: string;
  clientName: string;
  totalAmount: number;
  received: number;
  pending: number;
  paymentStatus: string;
  daysOverdue: number;
}
interface CommissionRow {
  agentId: string;
  agentName: string;
  orderId: string;
  orderNumber: string;
  clientName: string;
  orderValue: number;
  commissionType: string;
  commissionAmount: number;
  status: string;
}

const DATE_PRESETS = [
  { id: "today", label: "Today" },
  { id: "this_week", label: "This Week" },
  { id: "this_month", label: "This Month" },
  { id: "last_month", label: "Last Month" },
  { id: "last_3_months", label: "Last 3 Months" },
  { id: "custom", label: "Custom" },
] as const;

const B2B_ORDER_STATUSES = [
  "order_received", "design_review", "client_approval", "production_scheduled",
  "printing_in_progress", "quality_check", "packed", "dispatched", "delivered", "closed", "cancelled",
];

const B2B_PAYMENT_STATUSES = ["not_paid", "advance_received", "partially_paid", "fully_paid", "overdue"];

function getDateRange(preset: string, customFrom?: string, customTo?: string): { startDate: string; endDate: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start: Date;
  let end: Date = new Date(today);
  end.setDate(end.getDate() + 1);

  switch (preset) {
    case "today":
      start = new Date(today);
      break;
    case "this_week": {
      const day = now.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
      start = monday;
      break;
    }
    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "last_month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "last_3_months":
      start = new Date(today);
      start.setMonth(start.getMonth() - 3);
      break;
    case "custom":
      if (customFrom && customTo) {
        return { startDate: customFrom, endDate: customTo };
      }
      start = new Date(today);
      start.setMonth(start.getMonth() - 1);
      break;
    default:
      start = new Date(today);
      start.setMonth(start.getMonth() - 1);
  }
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export default function B2BReports() {
  const { isSuperAdmin } = useAuth();
  const [datePreset, setDatePreset] = useState<string>("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [agentId, setAgentId] = useState<string>("all");
  const [clientId, setClientId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<{
    startDate: string;
    endDate: string;
    agentId: string;
    clientId: string;
    status: string[];
    paymentStatus: string[];
  } | null>(null);

  const { data: users = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/users"],
    select: (data: any[]) => data.map((u) => ({ id: u.id, name: u.name })),
  });
  const { data: clients = [] } = useQuery<{ id: string; companyName: string }[]>({
    queryKey: ["/api/b2b/clients"],
    select: (data: any[]) => data.map((c) => ({ id: c.id, companyName: c.companyName })),
  });

  const queryParams = useMemo(() => {
    if (!appliedFilters) return null;
    const p = new URLSearchParams();
    p.set("startDate", appliedFilters.startDate);
    p.set("endDate", appliedFilters.endDate);
    if (appliedFilters.agentId && appliedFilters.agentId !== "all") p.set("agentId", appliedFilters.agentId);
    if (appliedFilters.clientId && appliedFilters.clientId !== "all") p.set("clientId", appliedFilters.clientId);
    if (appliedFilters.status.length) p.set("status", appliedFilters.status.join(","));
    if (appliedFilters.paymentStatus.length) p.set("paymentStatus", appliedFilters.paymentStatus.join(","));
    return p.toString();
  }, [appliedFilters]);

  const { data: summary, isLoading: summaryLoading } = useQuery<SummaryResult>({
    queryKey: ["/api/b2b/reports/summary", queryParams],
    enabled: !!queryParams,
  });

  const { data: clientWise = [], isLoading: clientWiseLoading } = useQuery<ClientRow[]>({
    queryKey: ["/api/b2b/reports/client-wise", queryParams],
    enabled: !!queryParams,
  });

  const { data: agentWise = [], isLoading: agentWiseLoading } = useQuery<AgentRow[]>({
    queryKey: ["/api/b2b/reports/agent-wise", queryParams],
    enabled: !!queryParams && isSuperAdmin,
  });

  const { data: productWise = [], isLoading: productWiseLoading } = useQuery<ProductRow[]>({
    queryKey: ["/api/b2b/reports/product-wise", queryParams],
    enabled: !!queryParams,
  });

  const { data: statusWise = [], isLoading: statusWiseLoading } = useQuery<StatusRow[]>({
    queryKey: ["/api/b2b/reports/status-wise", queryParams],
    enabled: !!queryParams,
  });

  const { data: paymentsReport = [], isLoading: paymentsReportLoading } = useQuery<PaymentRow[]>({
    queryKey: ["/api/b2b/reports/payments", queryParams],
    enabled: !!queryParams,
  });

  const { data: commissionsReport = [], isLoading: commissionsReportLoading } = useQuery<CommissionRow[]>({
    queryKey: ["/api/b2b/reports/commissions", queryParams],
    enabled: !!queryParams && isSuperAdmin,
  });

  const exportToExcel = (data: Record<string, unknown>[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, filename);
  };

  const applyFilters = () => {
    const { startDate, endDate } = getDateRange(datePreset, customFrom, customTo);
    setAppliedFilters({
      startDate,
      endDate,
      agentId,
      clientId,
      status: statusFilter,
      paymentStatus: paymentStatusFilter,
    });
  };

  const resetFilters = () => {
    setDatePreset("this_month");
    setCustomFrom("");
    setCustomTo("");
    setAgentId("all");
    setClientId("all");
    setStatusFilter([]);
    setPaymentStatusFilter([]);
    setAppliedFilters(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-7 w-7" />
          B2B Corporate Reports
        </h1>
        <p className="text-muted-foreground">Filter and export B2B order and commission reports</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={datePreset} onValueChange={setDatePreset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRESETS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {datePreset === "custom" && (
                <div className="flex gap-2 mt-2">
                  <DatePicker value={customFrom} onChange={setCustomFrom} placeholder="From" />
                  <DatePicker value={customTo} onChange={setCustomTo} placeholder="To" />
                </div>
              )}
            </div>

            {isSuperAdmin && (
              <div className="space-y-2">
                <Label>Sales Agent</Label>
                <Select value={agentId} onValueChange={setAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All agents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="All clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Order Status</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {statusFilter.length ? `${statusFilter.length} selected` : "All statuses"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  {B2B_ORDER_STATUSES.map((s) => (
                    <label key={s} className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                      <Checkbox
                        checked={statusFilter.includes(s)}
                        onCheckedChange={(checked) =>
                          setStatusFilter((prev) =>
                            checked ? [...prev, s] : prev.filter((x) => x !== s)
                          )
                        }
                      />
                      <span className="text-sm capitalize">{s.replace(/_/g, " ")}</span>
                    </label>
                  ))}
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {paymentStatusFilter.length ? `${paymentStatusFilter.length} selected` : "All"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  {B2B_PAYMENT_STATUSES.map((s) => (
                    <label key={s} className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                      <Checkbox
                        checked={paymentStatusFilter.includes(s)}
                        onCheckedChange={(checked) =>
                          setPaymentStatusFilter((prev) =>
                            checked ? [...prev, s] : prev.filter((x) => x !== s)
                          )
                        }
                      />
                      <span className="text-sm">{s.replace(/_/g, " ")}</span>
                    </label>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={applyFilters}>Apply Filters</Button>
            <Button variant="outline" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="client">Client-wise</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="agent">Agent-wise</TabsTrigger>}
          <TabsTrigger value="product">Product-wise</TabsTrigger>
          <TabsTrigger value="status">Status-wise</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="commissions">Commissions</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {!appliedFilters ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Apply filters above to load the overview report.</CardContent></Card>
          ) : summaryLoading ? (
            <Skeleton className="h-64" />
          ) : summary ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Total Orders</p><p className="text-2xl font-bold">{summary.totalOrders}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Product Cost</p><p className="text-2xl font-bold">{formatCurrency(summary.totalProductCost)}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Commission</p><p className="text-2xl font-bold">{formatCurrency(summary.totalCommission)}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Earning</p><p className={`text-2xl font-bold ${summary.totalEarning >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(summary.totalEarning)}</p></CardContent></Card>
              </div>
              <Card>
                <CardHeader><CardTitle>Orders by Status</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(summary.ordersByStatus || {}).map(([status, count]: [string, number]) => (
                      <div key={status} className="flex items-center gap-2">
                        <span className="capitalize text-muted-foreground">{status.replace(/_/g, " ")}:</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                    {Object.keys(summary.ordersByStatus || {}).length === 0 && <p className="text-muted-foreground">No data</p>}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Payment Collection Rate</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{Number(summary.paymentCollectionRate ?? 0).toFixed(1)}%</p>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>
        <TabsContent value="client" className="space-y-4">
          {!appliedFilters ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Apply filters to load client-wise data.</CardContent></Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Client-wise Report</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportToExcel(clientWise.map((r) => ({ Client: r.clientName, Orders: r.ordersCount, "Total Qty": r.totalQty, Revenue: r.revenue, Received: r.received, Pending: r.pending, Commission: r.commission, Earning: r.earning })), "B2B-Report-ClientWise.xlsx")}>
                  <Download className="h-4 w-4 mr-2" /> Export to Excel
                </Button>
              </CardHeader>
              <CardContent>
                {clientWiseLoading ? <Skeleton className="h-64" /> : (
                  <DataTable
                    data={clientWise}
                    columns={[
                      { key: "clientName", header: "Client", sortable: true },
                      { key: "ordersCount", header: "Orders", sortable: true },
                      { key: "totalQty", header: "Total Qty", sortable: true },
                      { key: "revenue", header: "Revenue", sortable: true, render: (r) => formatCurrency(r.revenue) },
                      { key: "received", header: "Received", sortable: true, render: (r) => formatCurrency(r.received) },
                      { key: "pending", header: "Pending", sortable: true, render: (r) => formatCurrency(r.pending) },
                      { key: "commission", header: "Commission", sortable: true, render: (r) => formatCurrency(r.commission) },
                      { key: "earning", header: "Earning", sortable: true, render: (r) => formatCurrency(r.earning) },
                    ]}
                    getRowId={(r) => r.clientId}
                    emptyMessage="No data"
                  />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        {isSuperAdmin && (
          <TabsContent value="agent" className="space-y-4">
            {!appliedFilters ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Apply filters to load agent-wise data.</CardContent></Card>
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Agent-wise Report</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportToExcel(agentWise.map((r) => ({ Agent: r.agentName, Clients: r.clientsCount, Orders: r.ordersCount, Revenue: r.revenue, "Commission Earned": r.commissionEarned, "Commission Pending": r.commissionPending, "Collection Rate %": r.collectionRate.toFixed(1) })), "B2B-Report-AgentWise.xlsx")}>
                    <Download className="h-4 w-4 mr-2" /> Export to Excel
                  </Button>
                </CardHeader>
                <CardContent>
                  {agentWiseLoading ? <Skeleton className="h-64" /> : (
                    <DataTable
                      data={agentWise}
                      columns={[
                        { key: "agentName", header: "Agent", sortable: true },
                        { key: "clientsCount", header: "Clients", sortable: true },
                        { key: "ordersCount", header: "Orders", sortable: true },
                        { key: "revenue", header: "Revenue", sortable: true, render: (r) => formatCurrency(r.revenue) },
                        { key: "commissionEarned", header: "Commission Earned", sortable: true, render: (r) => formatCurrency(r.commissionEarned) },
                        { key: "commissionPending", header: "Commission Pending", sortable: true, render: (r) => formatCurrency(r.commissionPending) },
                        { key: "collectionRate", header: "Collection Rate", sortable: true, render: (r) => `${r.collectionRate.toFixed(1)}%` },
                      ]}
                      getRowId={(r) => r.agentId}
                      emptyMessage="No data"
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
        <TabsContent value="product" className="space-y-4">
          {!appliedFilters ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Apply filters to load product-wise data.</CardContent></Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Product/Category-wise Report</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportToExcel(productWise.map((r) => ({ Product: r.productName, Category: r.category, "Qty Ordered": r.qtyOrdered, Revenue: r.revenue, "Cost Total": r.costTotal, Margin: r.margin })), "B2B-Report-ProductWise.xlsx")}>
                  <Download className="h-4 w-4 mr-2" /> Export to Excel
                </Button>
              </CardHeader>
              <CardContent>
                {productWiseLoading ? <Skeleton className="h-64" /> : (
                  <DataTable
                    data={productWise}
                    columns={[
                      { key: "productName", header: "Product", sortable: true },
                      { key: "category", header: "Category", sortable: true },
                      { key: "qtyOrdered", header: "Qty Ordered", sortable: true },
                      { key: "revenue", header: "Revenue", sortable: true, render: (r) => formatCurrency(r.revenue) },
                      { key: "costTotal", header: "Cost Total", sortable: true, render: (r) => formatCurrency(r.costTotal) },
                      { key: "margin", header: "Margin", sortable: true, render: (r) => formatCurrency(r.margin) },
                    ]}
                    getRowId={(r) => r.productId}
                    emptyMessage="No data"
                  />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="status" className="space-y-4">
          {!appliedFilters ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Apply filters to load status-wise data.</CardContent></Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Status-wise Report</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportToExcel(statusWise.map((r) => ({ Status: r.status.replace(/_/g, " "), "Order Count": r.orderCount, "Total Value": r.totalValue, "% of Total": r.percentOfTotal.toFixed(1) })), "B2B-Report-StatusWise.xlsx")}>
                  <Download className="h-4 w-4 mr-2" /> Export to Excel
                </Button>
              </CardHeader>
              <CardContent>
                {statusWiseLoading ? <Skeleton className="h-64" /> : (
                  <DataTable
                    data={statusWise}
                    columns={[
                      { key: "status", header: "Status", sortable: true, render: (r) => r.status.replace(/_/g, " ") },
                      { key: "orderCount", header: "Order Count", sortable: true },
                      { key: "totalValue", header: "Total Value", sortable: true, render: (r) => formatCurrency(r.totalValue) },
                      { key: "percentOfTotal", header: "% of Total", sortable: true, render: (r) => `${r.percentOfTotal.toFixed(1)}%` },
                    ]}
                    getRowId={(r) => r.status}
                    emptyMessage="No data"
                  />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="payments" className="space-y-4">
          {!appliedFilters ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Apply filters to load payment collection data.</CardContent></Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Payment Collection</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportToExcel(paymentsReport.map((r) => ({ "Order #": r.orderNumber, Client: r.clientName, "Total Amount": r.totalAmount, Received: r.received, Pending: r.pending, "Payment Status": r.paymentStatus, "Days Overdue": r.daysOverdue })), "B2B-Report-Payments.xlsx")}>
                  <Download className="h-4 w-4 mr-2" /> Export to Excel
                </Button>
              </CardHeader>
              <CardContent>
                {paymentsReportLoading ? <Skeleton className="h-64" /> : (
                  <DataTable
                    data={paymentsReport}
                    columns={[
                      { key: "orderNumber", header: "Order #", sortable: true },
                      { key: "clientName", header: "Client", sortable: true },
                      { key: "totalAmount", header: "Total", sortable: true, render: (r) => formatCurrency(r.totalAmount) },
                      { key: "received", header: "Received", sortable: true, render: (r) => formatCurrency(r.received) },
                      { key: "pending", header: "Pending", sortable: true, render: (r) => formatCurrency(r.pending) },
                      { key: "paymentStatus", header: "Payment Status", sortable: true, render: (r) => r.paymentStatus.replace(/_/g, " ") },
                      { key: "daysOverdue", header: "Days Overdue", sortable: true, render: (r) => r.daysOverdue > 0 ? <span className="text-red-600 font-medium">{r.daysOverdue}</span> : r.daysOverdue },
                    ]}
                    getRowId={(r) => r.orderId}
                    emptyMessage="No data"
                  />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        {isSuperAdmin && (
          <TabsContent value="commissions" className="space-y-4">
            {!appliedFilters ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Apply filters to load commission report.</CardContent></Card>
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Commission Report</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportToExcel(commissionsReport.map((r) => ({ Agent: r.agentName, "Order #": r.orderNumber, Client: r.clientName, "Order Value": r.orderValue, "Commission Type": r.commissionType, "Commission Amount": r.commissionAmount, Status: r.status })), "B2B-Report-Commissions.xlsx")}>
                    <Download className="h-4 w-4 mr-2" /> Export to Excel
                  </Button>
                </CardHeader>
                <CardContent>
                  {commissionsReportLoading ? <Skeleton className="h-64" /> : (
                    <>
                      <DataTable
                        data={commissionsReport}
                        columns={[
                          { key: "agentName", header: "Agent", sortable: true },
                          { key: "orderNumber", header: "Order #", sortable: true },
                          { key: "clientName", header: "Client", sortable: true },
                          { key: "orderValue", header: "Order Value", sortable: true, render: (r) => formatCurrency(r.orderValue) },
                          { key: "commissionType", header: "Commission Type", sortable: true, render: (r) => r.commissionType.replace(/_/g, " ") },
                          { key: "commissionAmount", header: "Commission Amount", sortable: true, render: (r) => formatCurrency(r.commissionAmount) },
                          { key: "status", header: "Status", sortable: true },
                        ]}
                        getRowId={(r) => `${r.agentId}-${r.orderId}`}
                        emptyMessage="No data"
                      />
                      <div className="mt-4 flex gap-6 text-sm">
                        <span>Total Paid: {formatCurrency(commissionsReport.filter((r) => r.status === "earned").reduce((s, r) => s + r.commissionAmount, 0))}</span>
                        <span>Total Pending: {formatCurrency(commissionsReport.filter((r) => r.status === "pending").reduce((s, r) => s + r.commissionAmount, 0))}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
