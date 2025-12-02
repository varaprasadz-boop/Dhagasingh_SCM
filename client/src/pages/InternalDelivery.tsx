import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Truck, MapPin, Phone, Banknote, QrCode, RotateCcw, CheckCircle, Eye } from "lucide-react";
import { mockInternalDeliveries, type InternalDelivery, type InternalDeliveryStatus, type PaymentCollectionMethod } from "@/lib/mockData";

const statusLabels: Record<InternalDeliveryStatus, string> = {
  assigned: "Assigned",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  payment_collected: "Payment Collected",
  rto: "RTO",
};

export default function InternalDeliveryPage() {
  const [deliveries, setDeliveries] = useState(mockInternalDeliveries);
  const [activeTab, setActiveTab] = useState<InternalDeliveryStatus | "all">("all");
  const [selectedDelivery, setSelectedDelivery] = useState<InternalDelivery | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentCollectionMethod>("cash");
  const [collectedAmount, setCollectedAmount] = useState("");

  const filteredDeliveries = activeTab === "all"
    ? deliveries
    : deliveries.filter((d) => d.status === activeTab);

  const columns = [
    { key: "orderNumber", header: "Order #", sortable: true },
    { key: "customerName", header: "Customer", sortable: true },
    {
      key: "shippingAddress",
      header: "Address",
      render: (d: InternalDelivery) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
          {d.shippingAddress}
        </span>
      ),
    },
    {
      key: "totalAmount",
      header: "Amount",
      render: (d: InternalDelivery) => `₹${d.totalAmount}`,
    },
    {
      key: "paymentMethod",
      header: "Payment",
      render: (d: InternalDelivery) => (
        <Badge variant={d.paymentMethod === "cod" ? "secondary" : "default"}>
          {d.paymentMethod.toUpperCase()}
        </Badge>
      ),
    },
    { key: "assignedTo", header: "Assigned To" },
    {
      key: "status",
      header: "Status",
      render: (d: InternalDelivery) => <StatusBadge status={d.status} />,
    },
    {
      key: "paymentCollected",
      header: "Collection",
      render: (d: InternalDelivery) => {
        if (!d.paymentCollected || d.paymentCollected === "none") return "-";
        return (
          <Badge variant="outline">
            {d.paymentCollected === "cash" && <Banknote className="h-3 w-3 mr-1" />}
            {d.paymentCollected === "qr" && <QrCode className="h-3 w-3 mr-1" />}
            {d.paymentCollected.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "",
      render: (d: InternalDelivery) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDelivery(d);
            setDetailDialogOpen(true);
          }}
          data-testid={`button-view-delivery-${d.id}`}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      ),
    },
  ];

  const handleStatusUpdate = (deliveryId: string, newStatus: InternalDeliveryStatus) => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? { ...d, status: newStatus, deliveredAt: newStatus === "delivered" ? new Date().toISOString() : d.deliveredAt }
          : d
      )
    );

    if (selectedDelivery && selectedDelivery.id === deliveryId) {
      setSelectedDelivery((prev) =>
        prev ? { ...prev, status: newStatus } : null
      );
    }
  };

  const handlePaymentCollection = () => {
    if (!selectedDelivery) return;

    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === selectedDelivery.id
          ? {
              ...d,
              status: "payment_collected",
              paymentCollected: paymentMethod,
              collectedAmount: parseFloat(collectedAmount) || d.totalAmount,
            }
          : d
      )
    );

    setPaymentDialogOpen(false);
    setPaymentMethod("cash");
    setCollectedAmount("");
  };

  const statusCounts = {
    all: deliveries.length,
    assigned: deliveries.filter((d) => d.status === "assigned").length,
    out_for_delivery: deliveries.filter((d) => d.status === "out_for_delivery").length,
    delivered: deliveries.filter((d) => d.status === "delivered").length,
    payment_collected: deliveries.filter((d) => d.status === "payment_collected").length,
    rto: deliveries.filter((d) => d.status === "rto").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Internal Delivery</h1>
        <p className="text-muted-foreground">Manage in-house delivery assignments and status</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{statusCounts.all}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Assigned</p>
            <p className="text-2xl font-bold text-blue-600">{statusCounts.assigned}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Out for Delivery</p>
            <p className="text-2xl font-bold text-orange-600">{statusCounts.out_for_delivery}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Delivered</p>
            <p className="text-2xl font-bold text-green-600">{statusCounts.delivered}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Payment Collected</p>
            <p className="text-2xl font-bold text-emerald-600">{statusCounts.payment_collected}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">RTO</p>
            <p className="text-2xl font-bold text-red-600">{statusCounts.rto}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InternalDeliveryStatus | "all")}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">
            All ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="assigned" data-testid="tab-assigned">
            Assigned ({statusCounts.assigned})
          </TabsTrigger>
          <TabsTrigger value="out_for_delivery" data-testid="tab-out">
            Out ({statusCounts.out_for_delivery})
          </TabsTrigger>
          <TabsTrigger value="delivered" data-testid="tab-delivered">
            Delivered ({statusCounts.delivered})
          </TabsTrigger>
          <TabsTrigger value="payment_collected" data-testid="tab-collected">
            Collected ({statusCounts.payment_collected})
          </TabsTrigger>
          <TabsTrigger value="rto" data-testid="tab-rto">
            RTO ({statusCounts.rto})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <DataTable
                data={filteredDeliveries}
                columns={columns}
                getRowId={(d) => d.id}
                onRowClick={(d) => {
                  setSelectedDelivery(d);
                  setDetailDialogOpen(true);
                }}
                emptyMessage="No deliveries found"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="modal-delivery-details">
          {selectedDelivery && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedDelivery.orderNumber}</span>
                  <StatusBadge status={selectedDelivery.status} />
                </DialogTitle>
                <DialogDescription>
                  Assigned to {selectedDelivery.assignedTo}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">CUSTOMER</h4>
                  <p className="font-medium">{selectedDelivery.customerName}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Phone className="h-4 w-4" />
                    {selectedDelivery.customerPhone}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">ADDRESS</h4>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                    <p className="text-sm">{selectedDelivery.shippingAddress}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount to Collect</span>
                  <span className="text-xl font-bold">
                    {selectedDelivery.paymentMethod === "cod" ? `₹${selectedDelivery.totalAmount}` : "Prepaid"}
                  </span>
                </div>

                {selectedDelivery.paymentCollected && selectedDelivery.paymentCollected !== "none" && (
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Payment collected via {selectedDelivery.paymentCollected.toUpperCase()}
                      {selectedDelivery.collectedAmount && ` - ₹${selectedDelivery.collectedAmount}`}
                    </p>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  {selectedDelivery.status === "assigned" && (
                    <Button
                      className="w-full"
                      onClick={() => handleStatusUpdate(selectedDelivery.id, "out_for_delivery")}
                      data-testid="button-mark-out"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Mark Out for Delivery
                    </Button>
                  )}

                  {selectedDelivery.status === "out_for_delivery" && (
                    <>
                      <Button
                        className="w-full"
                        onClick={() => handleStatusUpdate(selectedDelivery.id, "delivered")}
                        data-testid="button-mark-delivered"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Delivered
                      </Button>
                      <Button
                        className="w-full"
                        variant="destructive"
                        onClick={() => handleStatusUpdate(selectedDelivery.id, "rto")}
                        data-testid="button-mark-rto"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Mark RTO
                      </Button>
                    </>
                  )}

                  {selectedDelivery.status === "delivered" && selectedDelivery.paymentMethod === "cod" && (
                    <Button
                      className="w-full"
                      onClick={() => {
                        setCollectedAmount(String(selectedDelivery.totalAmount));
                        setPaymentDialogOpen(true);
                      }}
                      data-testid="button-collect-payment"
                    >
                      <Banknote className="h-4 w-4 mr-2" />
                      Collect Payment
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent data-testid="modal-collect-payment">
          <DialogHeader>
            <DialogTitle>Collect Payment</DialogTitle>
            <DialogDescription>
              {selectedDelivery?.orderNumber} - ₹{selectedDelivery?.totalAmount}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentCollectionMethod)}>
                <SelectTrigger data-testid="select-payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="qr">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      QR Code
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount Collected (₹)</Label>
              <Input
                type="number"
                value={collectedAmount}
                onChange={(e) => setCollectedAmount(e.target.value)}
                placeholder="Enter collected amount"
                data-testid="input-collected-amount"
              />
            </div>

            {paymentMethod === "qr" && (
              <div className="p-4 bg-muted rounded-md text-center">
                <QrCode className="h-24 w-24 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">
                  Show company QR code to customer
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePaymentCollection}
              disabled={!collectedAmount}
              data-testid="button-confirm-payment"
            >
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
