import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { MessageSquare, RefreshCw, Ban, DollarSign } from "lucide-react";
import type { Complaint } from "@/lib/mockData";

interface ComplaintCardProps {
  complaint: Complaint;
  onResolve?: (complaint: Complaint, resolution: "refund" | "replacement" | "rejected") => void;
}

const reasonLabels: Record<string, string> = {
  wrong_item: "Wrong Item",
  damaged: "Damaged Product",
  late_delivery: "Late Delivery",
  other: "Other",
};

export function ComplaintCard({ complaint, onResolve }: ComplaintCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="hover-elevate" data-testid={`card-complaint-${complaint.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <span className="font-mono font-semibold">{complaint.ticketNumber}</span>
            <StatusBadge status={complaint.status} />
          </div>
          <span className="text-sm text-muted-foreground">{formatDate(complaint.createdAt)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Order</p>
            <p className="font-mono">{complaint.orderNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Reason</p>
            <p className="font-medium">{reasonLabels[complaint.reason]}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
          {complaint.description}
        </p>

        {complaint.resolution && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            <span className="text-sm font-medium">Resolution:</span>
            <StatusBadge status={complaint.resolution === "refund" ? "refunded" : complaint.resolution === "replacement" ? "dispatched" : "rejected"} />
            {complaint.refundAmount && (
              <span className="text-sm">₹{complaint.refundAmount}</span>
            )}
          </div>
        )}

        {(complaint.status === "open" || complaint.status === "in_progress") && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onResolve?.(complaint, "refund")}
              data-testid={`button-refund-${complaint.id}`}
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Refund
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onResolve?.(complaint, "replacement")}
              data-testid={`button-replace-${complaint.id}`}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Replace
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onResolve?.(complaint, "rejected")}
              data-testid={`button-reject-${complaint.id}`}
            >
              <Ban className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
