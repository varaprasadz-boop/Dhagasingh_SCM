import { DeliveryCard } from "../DeliveryCard";
import { mockOrders } from "@/lib/mockData";

export default function DeliveryCardExample() {
  const codOrder = { ...mockOrders[1], status: "dispatched" as const };

  return (
    <DeliveryCard
      order={codOrder}
      onStatusUpdate={(order, status) => console.log("Status:", order.orderNumber, status)}
      onPaymentCollected={(order, method) => console.log("Payment:", order.orderNumber, method)}
    />
  );
}
