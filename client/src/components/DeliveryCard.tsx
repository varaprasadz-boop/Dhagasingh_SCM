import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Phone, Navigation, CreditCard, Banknote, CheckCircle2, QrCode } from "lucide-react";
import type { Order } from "@/lib/mockData";

interface DeliveryCardProps {
  order: Order;
  onStatusUpdate?: (order: Order, status: "delivered" | "rto") => void;
  onPaymentCollected?: (order: Order, method: "qr" | "cash") => void;
}

export function DeliveryCard({ order, onStatusUpdate, onPaymentCollected }: DeliveryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentCollected, setPaymentCollected] = useState(false);

  const handlePaymentCollect = (method: "qr" | "cash") => {
    setPaymentCollected(true);
    onPaymentCollected?.(order, method);
    setTimeout(() => setShowPayment(false), 1500);
  };

  const handleStatusUpdate = (status: "delivered" | "rto") => {
    onStatusUpdate?.(order, status);
  };

  return (
    <>
      <Card
        className="hover-elevate active-elevate-2"
        onClick={() => setExpanded(!expanded)}
        data-testid={`card-delivery-${order.id}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold">{order.orderNumber}</span>
              <StatusBadge status={order.status} />
            </div>
            <Badge variant={order.paymentMethod === "cod" ? "secondary" : "default"}>
              {order.paymentMethod === "cod" ? "COD" : "Prepaid"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">{order.customerName}</span>
            <span className="font-semibold">₹{order.totalAmount}</span>
          </div>

          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <p className={expanded ? "" : "line-clamp-2"}>{order.shippingAddress}</p>
          </div>

          {expanded && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`tel:${order.customerPhone}`);
                  }}
                  data-testid={`button-call-${order.id}`}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    const encoded = encodeURIComponent(order.shippingAddress);
                    window.open(`https://maps.google.com/?q=${encoded}`);
                  }}
                  data-testid={`button-navigate-${order.id}`}
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Navigate
                </Button>
              </div>

              <div className="rounded-lg overflow-hidden h-32 bg-muted">
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(order.shippingAddress)}&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  title="Delivery location"
                />
              </div>

              <div className="flex gap-2">
                {order.paymentMethod === "cod" && order.paymentStatus === "pending" && (
                  <Button
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPayment(true);
                    }}
                    data-testid={`button-collect-payment-${order.id}`}
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    Collect ₹{order.totalAmount}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusUpdate("delivered");
                  }}
                  data-testid={`button-mark-delivered-${order.id}`}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Delivered
                </Button>
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusUpdate("rto");
                  }}
                  data-testid={`button-mark-rto-${order.id}`}
                >
                  RTO
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-sm" data-testid="modal-payment">
          <DialogHeader>
            <DialogTitle>Collect Payment</DialogTitle>
          </DialogHeader>

          {paymentCollected ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-lg font-semibold">Payment Collected!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Amount to collect</p>
                <p className="text-3xl font-bold">₹{order.totalAmount}</p>
              </div>

              <div className="flex flex-col items-center gap-4 p-4 bg-muted rounded-lg">
                <QrCode className="h-32 w-32" />
                <p className="text-sm text-muted-foreground">Scan with any UPI app</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handlePaymentCollect("qr")}
                  data-testid="button-qr-paid"
                >
                  <QrCode className="h-4 w-4 mr-1" />
                  QR Paid
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handlePaymentCollect("cash")}
                  data-testid="button-cash-received"
                >
                  <Banknote className="h-4 w-4 mr-1" />
                  Cash Received
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
