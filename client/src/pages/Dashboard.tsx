import { useState } from "react";
import { KPICard } from "@/components/KPICard";
import { QuickActionButton } from "@/components/QuickActionButton";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StockAlertList } from "@/components/StockAlertList";
import { ReceiveStockModal } from "@/components/ReceiveStockModal";
import { DispatchModal } from "@/components/DispatchModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  mockOrders,
  mockProducts,
  dashboardStats,
  type Order,
} from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const allVariants = mockProducts.flatMap((p) => p.variants);
  const pendingOrders = mockOrders.filter((o) => o.status === "pending");

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

  const handleDispatch = (order: Order) => {
    setSelectedOrder(order);
    setDispatchModalOpen(true);
  };

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
          value={dashboardStats.totalInventory.toLocaleString()}
          icon={Package}
          trend={{ value: 12, positive: true }}
        />
        <KPICard
          title="Pending Orders"
          value={dashboardStats.pendingOrders}
          icon={ShoppingCart}
          subtitle="3 high priority"
        />
        <KPICard
          title="Dispatched Today"
          value={dashboardStats.dispatchedOrders}
          icon={Truck}
          trend={{ value: 8, positive: true }}
        />
        <KPICard
          title="Delivered"
          value={dashboardStats.deliveredOrders}
          icon={CheckCircle2}
          trend={{ value: 15, positive: true }}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="RTO Orders"
          value={dashboardStats.rtoOrders}
          icon={RotateCcw}
          trend={{ value: 5, positive: false }}
        />
        <KPICard
          title="Open Complaints"
          value={dashboardStats.openComplaints}
          icon={AlertCircle}
          trend={{ value: 2, positive: false }}
        />
        <KPICard
          title="Delivery Costs"
          value={`₹${dashboardStats.totalDeliveryCost.toLocaleString()}`}
          icon={Truck}
          subtitle="This month"
        />
        <KPICard
          title="Low Stock Items"
          value={dashboardStats.lowStockItems}
          icon={Package}
          subtitle="Below threshold"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickActionButton
          icon={PackagePlus}
          label="Receive Stock"
          description="Add inventory"
          onClick={() => setReceiveModalOpen(true)}
        />
        <QuickActionButton
          icon={Truck}
          label="Dispatch Order"
          description="Ship pending"
          onClick={() => {
            if (pendingOrders.length > 0) {
              handleDispatch(pendingOrders[0]);
            }
          }}
        />
        <QuickActionButton
          icon={Camera}
          label="Scan Invoice"
          description="OCR capture"
          onClick={() => console.log("Navigate to scan")}
        />
        <QuickActionButton
          icon={FileUp}
          label="Import Orders"
          description="CSV upload"
          onClick={() => console.log("Navigate to import")}
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
                data={mockOrders.slice(0, 5)}
                columns={orderColumns}
                getRowId={(order) => order.id}
                onRowClick={handleDispatch}
              />
            </CardContent>
          </Card>
        </div>
        <div>
          <StockAlertList variants={allVariants} threshold={40} />
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
