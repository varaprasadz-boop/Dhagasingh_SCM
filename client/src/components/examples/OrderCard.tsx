import { OrderCard } from "../OrderCard";
import { mockOrders } from "@/lib/mockData";

export default function OrderCardExample() {
  return (
    <div className="space-y-4">
      <OrderCard
        order={mockOrders[0]}
        onViewDetails={(order) => console.log("View:", order.orderNumber)}
        onUpdateStatus={(order) => console.log("Update:", order.orderNumber)}
      />
      <OrderCard order={mockOrders[1]} compact />
    </div>
  );
}
