import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { KPICard } from "@/components/KPICard";
import { QuickActionButton } from "@/components/QuickActionButton";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StockAlertList } from "@/components/StockAlertList";
import { ReceiveStockModal } from "@/components/ReceiveStockModal";
import { DispatchModal } from "@/components/DispatchModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  ShoppingCart,
  Truck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  PackagePlus,
  FileUp,
  Camera,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Order, Product } from "@shared/schema";

interface DispatchOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  paymentMethod: string;
  totalAmount: string;
}

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
    name?: string | null;
    color?: string | null;
    size?: string | null;
    stockQuantity: number;
    lowStockThreshold?: number | null;
    costPrice: string;
    sellingPrice: string;
    mrp?: string | null;
  }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DispatchOrder | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: products = [] } = useQuery<ProductWithVariants[]>({
    queryKey: ["/api/products"],
  });

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const recentOrders = orders.slice(0, 5);

  const allVariants = products.flatMap((p) =>
    p.variants.map((v) => ({
      id: v.id,
      productName: p.name,
      variantName: v.name || `${v.color || ""} ${v.size || ""}`.trim() || "Default",
      sku: v.sku,
      stockQuantity: v.stockQuantity,
      lowStockThreshold: v.lowStockThreshold || 10,
    }))
  );

  const orderColumns = [
    { key: "orderNumber", header: "Order #", sortable: true },
    { key: "customerName", header: "Customer", sortable: true },
    {
      key: "totalAmount",
      header: "Amount",
      render: (order: Order) => `₹${order.totalAmount}`,
    },
    {
      key: "paymentMethod",
      header: "Payment",
      render: (order: Order) => (
        <span
          className={`text-xs font-medium ${
            order.paymentMethod === "cod"
              ? "text-orange-600 dark:text-orange-400"
              : "text-green-600 dark:text-green-400"
          }`}
        >
          {order.paymentMethod.toUpperCase()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (order: Order) => <StatusBadge status={order.status} />,
    },
  ];

  const handleDispatch = (order: Order | DispatchOrder) => {
    setSelectedOrder({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount,
    });
    setDispatchModalOpen(true);
  };

  const isLoading = statsLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}. Here's your supply chain overview.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Inventory"
          value={(stats?.products.variants || 0).toLocaleString()}
          icon={Package}
          data-testid="kpi-inventory"
        />
        <KPICard
          title="Pending Orders"
          value={stats?.orders.pending || 0}
          icon={ShoppingCart}
          subtitle={`${pendingOrders.filter(o => o.paymentMethod === "cod").length} COD`}
          data-testid="kpi-pending"
        />
        <KPICard
          title="Dispatched"
          value={stats?.orders.dispatched || 0}
          icon={Truck}
          data-testid="kpi-dispatched"
        />
        <KPICard
          title="Delivered"
          value={stats?.orders.delivered || 0}
          icon={CheckCircle2}
          data-testid="kpi-delivered"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="RTO Orders"
          value={stats?.orders.rto || 0}
          icon={RotateCcw}
          data-testid="kpi-rto"
        />
        <KPICard
          title="Open Complaints"
          value={stats?.complaints.open || 0}
          icon={AlertCircle}
          data-testid="kpi-complaints"
        />
        <KPICard
          title="Revenue"
          value={`₹${(stats?.revenue.total || 0).toLocaleString()}`}
          icon={Truck}
          subtitle="Paid orders"
          data-testid="kpi-revenue"
        />
        <KPICard
          title="Low Stock Items"
          value={stats?.products.lowStock || 0}
          icon={Package}
          subtitle="Below threshold"
          data-testid="kpi-low-stock"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickActionButton
          icon={PackagePlus}
          label="Receive Stock"
          description="Add inventory"
          onClick={() => setReceiveModalOpen(true)}
          data-testid="action-receive"
        />
        <QuickActionButton
          icon={Truck}
          label="Dispatch Order"
          description="Ship pending"
          onClick={() => {
            if (pendingOrders.length > 0) {
              handleDispatch(pendingOrders[0]);
            } else {
              navigate("/orders");
            }
          }}
          data-testid="action-dispatch"
        />
        <QuickActionButton
          icon={Camera}
          label="Scan Invoice"
          description="OCR capture"
          onClick={() => navigate("/scan")}
          data-testid="action-scan"
        />
        <QuickActionButton
          icon={FileUp}
          label="Import Orders"
          description="CSV upload"
          onClick={() => navigate("/orders")}
          data-testid="action-import"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={recentOrders}
                columns={orderColumns}
                getRowId={(order) => order.id}
                onRowClick={handleDispatch}
                emptyMessage="No orders yet"
              />
            </CardContent>
          </Card>
        </div>
        <div>
          <StockAlertList variants={allVariants} threshold={10} />
        </div>
      </div>

      <ReceiveStockModal
        open={receiveModalOpen}
        onOpenChange={setReceiveModalOpen}
        onReceive={(data) => {
          console.log("Stock received:", data);
          setReceiveModalOpen(false);
        }}
      />

      <DispatchModal
        order={selectedOrder}
        open={dispatchModalOpen}
        onOpenChange={setDispatchModalOpen}
        onDispatch={(data) => {
          console.log("Order dispatched:", data);
          setDispatchModalOpen(false);
        }}
      />
    </div>
  );
}
