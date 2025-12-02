import { useState } from "react";
import { OrderCard } from "@/components/OrderCard";
import { SearchInput } from "@/components/SearchInput";
import { DispatchModal } from "@/components/DispatchModal";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { mockOrders, type Order, type OrderStatus } from "@/lib/mockData";

const statusFilters: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "dispatched", label: "Dispatched" },
  { value: "delivered", label: "Delivered" },
  { value: "rto", label: "RTO" },
];

export default function MobileOrders() {
  const [orders] = useState(mockOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOrderAction = (order: Order) => {
    setSelectedOrder(order);
    if (order.status === "pending") {
      setDispatchModalOpen(true);
    }
  };

  return (
    <div className="pb-20">
      <div className="sticky top-0 z-10 bg-background p-4 space-y-3 border-b">
        <h1 className="text-xl font-bold">Orders</h1>
        <SearchInput
          placeholder="Search orders..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2">
            {statusFilters.map((filter) => {
              const count = filter.value === "all"
                ? orders.length
                : orders.filter((o) => o.status === filter.value).length;
              const isActive = statusFilter === filter.value;
              return (
                <Badge
                  key={filter.value}
                  variant={isActive ? "default" : "outline"}
                  className="cursor-pointer shrink-0"
                  onClick={() => setStatusFilter(filter.value)}
                  data-testid={`filter-${filter.value}`}
                >
                  {filter.label} ({count})
                </Badge>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <div className="p-4 space-y-3">
        {filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onViewDetails={handleOrderAction}
            onUpdateStatus={handleOrderAction}
          />
        ))}
        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No orders found
          </div>
        )}
      </div>

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
