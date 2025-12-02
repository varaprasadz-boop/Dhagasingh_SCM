import { Badge } from "@/components/ui/badge";
import type { OrderStatus, InternalDeliveryStatus } from "@/lib/mockData";

interface StatusBadgeProps {
  status: OrderStatus | InternalDeliveryStatus | "open" | "in_progress" | "resolved" | "rejected" | "active" | "inactive";
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "PENDING", variant: "secondary" },
  dispatched: { label: "DISPATCHED", variant: "default" },
  delivered: { label: "DELIVERED", variant: "default" },
  rto: { label: "RTO", variant: "destructive" },
  returned: { label: "RETURNED", variant: "outline" },
  refunded: { label: "REFUNDED", variant: "outline" },
  open: { label: "OPEN", variant: "destructive" },
  in_progress: { label: "IN PROGRESS", variant: "secondary" },
  resolved: { label: "RESOLVED", variant: "default" },
  rejected: { label: "REJECTED", variant: "outline" },
  active: { label: "ACTIVE", variant: "default" },
  inactive: { label: "INACTIVE", variant: "secondary" },
  assigned: { label: "ASSIGNED", variant: "secondary" },
  out_for_delivery: { label: "OUT FOR DELIVERY", variant: "default" },
  payment_collected: { label: "PAYMENT COLLECTED", variant: "default" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status.toUpperCase(), variant: "secondary" as const };

  return (
    <Badge
      variant={config.variant}
      className={`text-xs font-medium uppercase tracking-wide ${className || ""}`}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}
