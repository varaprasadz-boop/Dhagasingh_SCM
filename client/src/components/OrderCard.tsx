import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { Package, MapPin, Phone, Truck, CreditCard } from "lucide-react";
import type { Order } from "@/lib/mockData";

interface OrderCardProps {
  order: Order;
  onUpdateStatus?: (order: Order) => void;
  onViewDetails?: (order: Order) => void;
  compact?: boolean;
}

export function OrderCard({ order, onUpdateStatus, onViewDetails, compact = false }: OrderCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (compact) {
    return (
      <Card className="hover-elevate active-elevate-2" data-testid={`card-order-${order.id}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground truncate">{order.customerName}</span>
            <span className="font-semibold">₹{order.totalAmount}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover-elevate" data-testid={`card-order-${order.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-semibold">{order.orderNumber}</span>
            <StatusBadge status={order.status} />
          </div>
          <span className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2">
          <Package className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div className="flex-1">
            {order.items.map((item, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-mono text-xs text-muted-foreground">{item.sku}</span>
                <span className="mx-2">×</span>
                <span>{item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="text-right">
            <p className="font-semibold">₹{order.totalAmount}</p>
            <p className={`text-xs ${order.paymentMethod === "cod" ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"}`}>
              {order.paymentMethod === "cod" ? "COD" : "Prepaid"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-muted-foreground line-clamp-2">{order.shippingAddress}</p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{order.customerPhone}</span>
          </div>
          {order.courierPartner && (
            <div className="flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span>{order.courierPartner}</span>
            </div>
          )}
          {order.awbNumber && (
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{order.awbNumber}</span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails?.(order)}
            data-testid={`button-view-order-${order.id}`}
          >
            View Details
          </Button>
          {order.status === "pending" && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onUpdateStatus?.(order)}
              data-testid={`button-dispatch-order-${order.id}`}
            >
              <Truck className="h-4 w-4 mr-1" />
              Dispatch
            </Button>
          )}
          {order.status === "dispatched" && order.paymentMethod === "cod" && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onUpdateStatus?.(order)}
              data-testid={`button-collect-order-${order.id}`}
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Collect Payment
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
