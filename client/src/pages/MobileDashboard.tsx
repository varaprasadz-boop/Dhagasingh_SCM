import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { KPICard } from "@/components/KPICard";
import { QuickActionButton } from "@/components/QuickActionButton";
import { OrderCard } from "@/components/OrderCard";
import { ReceiveStockModal } from "@/components/ReceiveStockModal";
import { DispatchModal } from "@/components/DispatchModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  ShoppingCart,
  Truck,
  AlertCircle,
  PackagePlus,
  Camera,
  FileUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Order } from "@shared/schema";
import type { ReceiveStockData } from "@/components/ReceiveStockModal";

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

interface DispatchOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  paymentMethod: string;
  totalAmount: string;
}

export default function MobileDashboard() {
  const { toast } = useToast();
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DispatchOrder | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const receiveStockMutation = useMutation({
    mutationFn: async (data: ReceiveStockData) => {
      const movements = [];
      for (const product of data.products) {
        for (const [variantId, quantity] of Object.entries(product.quantities)) {
          if (quantity > 0) {
            movements.push({
              productVariantId: variantId,
              type: "inward" as const,
              quantity,
              supplierId: data.supplierId,
              costPrice: product.costPrice,
              invoiceNumber: data.invoiceNumber,
              invoiceDate: data.invoiceDate ? new Date(data.invoiceDate).toISOString() : undefined,
              reason: "Stock received from supplier",
            });
          }
        }
      }
      for (const movement of movements) {
        await apiRequest("POST", "/api/stock-movements", movement);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      toast({ title: "Stock received successfully" });
      setReceiveModalOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to receive stock", description: error.message, variant: "destructive" });
    },
  });

  const pendingOrders = orders.filter((o) => o.status === "pending");

  const handleDispatch = (order: Order) => {
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
      <div className="pb-20 space-y-4">
        <div className="p-4">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-3 px-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <div className="px-4">
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 space-y-4">
      <div className="p-4">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Supply chain overview</p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4">
        <KPICard
          title="Total SKUs"
          value={(stats?.products.variants || 0).toLocaleString()}
          icon={Package}
        />
        <KPICard
          title="Pending"
          value={stats?.orders.pending || 0}
          icon={ShoppingCart}
        />
        <KPICard
          title="Dispatched"
          value={stats?.orders.dispatched || 0}
          icon={Truck}
        />
        <KPICard
          title="Complaints"
          value={stats?.complaints.open || 0}
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
                handleDispatch(pendingOrders[0]);
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
                {orders.slice(0, 5).map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    compact
                    onViewDetails={(o) => {
                      if (o.status === "pending") {
                        handleDispatch(o);
                      }
                    }}
                  />
                ))}
                {orders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <ReceiveStockModal
        open={receiveModalOpen}
        onOpenChange={setReceiveModalOpen}
        onReceive={(data) => {
          receiveStockMutation.mutate(data);
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
