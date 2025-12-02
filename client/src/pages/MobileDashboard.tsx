import { useState } from "react";
import { KPICard } from "@/components/KPICard";
import { QuickActionButton } from "@/components/QuickActionButton";
import { OrderCard } from "@/components/OrderCard";
import { ReceiveStockModal } from "@/components/ReceiveStockModal";
import { DispatchModal } from "@/components/DispatchModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Package,
  ShoppingCart,
  Truck,
  AlertCircle,
  PackagePlus,
  Camera,
  FileUp,
} from "lucide-react";
import { mockOrders, dashboardStats, type Order } from "@/lib/mockData";

export default function MobileDashboard() {
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const pendingOrders = mockOrders.filter((o) => o.status === "pending");

  return (
    <div className="pb-20 space-y-4">
      <div className="p-4">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Supply chain overview</p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4">
        <KPICard
          title="Inventory"
          value={dashboardStats.totalInventory.toLocaleString()}
          icon={Package}
        />
        <KPICard
          title="Pending"
          value={dashboardStats.pendingOrders}
          icon={ShoppingCart}
        />
        <KPICard
          title="Dispatched"
          value={dashboardStats.dispatchedOrders}
          icon={Truck}
        />
        <KPICard
          title="Complaints"
          value={dashboardStats.openComplaints}
          icon={AlertCircle}
        />
      </div>

      <div className="px-4">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">QUICK ACTIONS</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickActionButton
            icon={PackagePlus}
            label="Receive Stock"
            onClick={() => setReceiveModalOpen(true)}
          />
          <QuickActionButton
            icon={Truck}
            label="Dispatch"
            onClick={() => {
              if (pendingOrders.length > 0) {
                setSelectedOrder(pendingOrders[0]);
                setDispatchModalOpen(true);
              }
            }}
          />
          <QuickActionButton
            icon={Camera}
            label="Scan Invoice"
            onClick={() => console.log("Navigate to scan")}
          />
          <QuickActionButton
            icon={FileUp}
            label="Import CSV"
            onClick={() => console.log("Navigate to import")}
          />
        </div>
      </div>

      <div className="px-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              RECENT ORDERS
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-64">
              <div className="space-y-2 p-4 pt-0">
                {mockOrders.slice(0, 5).map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    compact
                    onViewDetails={(o) => {
                      setSelectedOrder(o);
                      if (o.status === "pending") {
                        setDispatchModalOpen(true);
                      }
                    }}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
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
