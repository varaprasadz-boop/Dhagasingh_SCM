import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { SearchInput } from "@/components/SearchInput";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Truck, MapPin, Phone, Banknote, QrCode, RotateCcw, CheckCircle, Eye, Clock, AlertCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InternalDelivery, Order, User, DeliveryEvent } from "@shared/schema";

type DeliveryStatus = "assigned" | "out_for_delivery" | "delivered" | "payment_collected" | "rto";
type PaymentMode = "cash" | "upi" | "qr";

interface DeliveryWithRelations extends InternalDelivery {
  order?: Order;
  assignedUser?: User;
  events?: DeliveryEvent[];
}

const statusLabels: Record<DeliveryStatus, string> = {
  assigned: "Assigned",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  payment_collected: "Payment Collected",
  rto: "RTO",
};

export default function InternalDeliveryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<DeliveryStatus | "all">("all");
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryWithRelations | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMode>("cash");
  const [collectedAmount, setCollectedAmount] = useState("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  
  const { toast } = useToast();

  const { data: deliveries = [], isLoading, error } = useQuery<DeliveryWithRelations[]>({
    queryKey: ["/api/deliveries"],
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const deliveryDrivers = users.filter(u => u.role?.name?.toLowerCase().includes("delivery") || u.role?.name?.toLowerCase().includes("warehouse"));

  const unassignedCODOrders = orders.filter(o => 
    o.paymentMethod === "cod" && 
    o.status === "pending" &&
    !deliveries.some(d => d.orderId === o.id)
  );

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, comment }: { id: string; status: DeliveryStatus; comment?: string }) => {
      const res = await apiRequest("POST", `/api/deliveries/${id}/status`, { status, comment });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      setSelectedDelivery(data);
      toast({
        title: "Status Updated",
        description: `Delivery marked as ${statusLabels[data.status as DeliveryStatus]}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update delivery status",
        variant: "destructive",
      });
    },
  });

  const collectPaymentMutation = useMutation({
    mutationFn: async ({ id, amountCollected, paymentMode }: { id: string; amountCollected: number; paymentMode: PaymentMode }) => {
      const res = await apiRequest("POST", `/api/deliveries/${id}/collect-payment`, { amountCollected, paymentMode });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      setPaymentDialogOpen(false);
      setDetailDialogOpen(false);
      setPaymentMethod("cash");
      setCollectedAmount("");
      toast({
        title: "Payment Collected",
        description: `₹${data.amountCollected} collected via ${data.paymentMode}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record payment collection",
        variant: "destructive",
      });
    },
  });

  const createDeliveryMutation = useMutation({
    mutationFn: async ({ orderId, assignedTo }: { orderId: string; assignedTo: string }) => {
      const res = await apiRequest("POST", "/api/deliveries", { orderId, assignedTo });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setAssignDialogOpen(false);
      setSelectedOrderId("");
      setSelectedDriverId("");
      toast({
        title: "Delivery Assigned",
        description: "Order assigned for internal delivery",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign delivery",
        variant: "destructive",
      });
    },
  });

  const filteredDeliveries = useMemo(() => {
    let result = deliveries;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((d) =>
        d.order?.orderNumber?.toLowerCase().includes(query) ||
        d.order?.customerName?.toLowerCase().includes(query) ||
        d.order?.customerPhone?.includes(query) ||
        d.order?.shippingAddress?.toLowerCase().includes(query) ||
        d.assignedUser?.name?.toLowerCase().includes(query)
      );
    }

    if (activeTab !== "all") {
      result = result.filter((d) => d.status === activeTab);
    }

    return result;
  }, [deliveries, searchQuery, activeTab]);

  const columns = [
    { 
      key: "orderNumber", 
      header: "Order #", 
      sortable: true,
      render: (d: DeliveryWithRelations) => d.order?.orderNumber || "-"
    },
    { 
      key: "customerName", 
      header: "Customer", 
      sortable: true,
      render: (d: DeliveryWithRelations) => d.order?.customerName || "-"
    },
    {
      key: "shippingAddress",
      header: "Address",
      render: (d: DeliveryWithRelations) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
          {d.order?.shippingAddress || "-"}
        </span>
      ),
    },
    {
      key: "totalAmount",
      header: "Amount",
      render: (d: DeliveryWithRelations) => d.order?.totalAmount ? `₹${d.order.totalAmount}` : "-",
    },
    {
      key: "paymentMethod",
      header: "Payment",
      render: (d: DeliveryWithRelations) => (
        <Badge variant={d.order?.paymentMethod === "cod" ? "secondary" : "default"}>
          {(d.order?.paymentMethod || "").toUpperCase()}
        </Badge>
      ),
    },
    { 
      key: "assignedTo", 
      header: "Assigned To",
      render: (d: DeliveryWithRelations) => d.assignedUser?.name || "-"
    },
    {
      key: "status",
      header: "Status",
      render: (d: DeliveryWithRelations) => <StatusBadge status={d.status as string} />,
    },
    {
      key: "paymentCollected",
      header: "Collection",
      render: (d: DeliveryWithRelations) => {
        if (!d.amountCollected) return "-";
        return (
          <Badge variant="outline">
            {d.paymentMode === "cash" && <Banknote className="h-3 w-3 mr-1" />}
            {(d.paymentMode === "qr" || d.paymentMode === "upi") && <QrCode className="h-3 w-3 mr-1" />}
            ₹{d.amountCollected}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "",
      render: (d: DeliveryWithRelations) => (
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

  const handleStatusUpdate = (newStatus: DeliveryStatus) => {
    if (!selectedDelivery) return;
    updateStatusMutation.mutate({ id: selectedDelivery.id, status: newStatus });
  };

  const handlePaymentCollection = () => {
    if (!selectedDelivery) return;
    collectPaymentMutation.mutate({
      id: selectedDelivery.id,
      amountCollected: parseFloat(collectedAmount) || parseFloat(selectedDelivery.order?.totalAmount || "0"),
      paymentMode: paymentMethod,
    });
  };

  const handleAssignDelivery = () => {
    if (!selectedOrderId || !selectedDriverId) return;
    createDeliveryMutation.mutate({
      orderId: selectedOrderId,
      assignedTo: selectedDriverId,
    });
  };

  const statusCounts = {
    all: deliveries.length,
    assigned: deliveries.filter((d) => d.status === "assigned").length,
    out_for_delivery: deliveries.filter((d) => d.status === "out_for_delivery").length,
    delivered: deliveries.filter((d) => d.status === "delivered").length,
    payment_collected: deliveries.filter((d) => d.status === "payment_collected").length,
    rto: deliveries.filter((d) => d.status === "rto").length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-destructive">Failed to load deliveries</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] })}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Internal Delivery</h1>
          <p className="text-muted-foreground">Manage in-house delivery assignments and status</p>
        </div>
        <Button 
          onClick={() => setAssignDialogOpen(true)}
          disabled={unassignedCODOrders.length === 0 || deliveryDrivers.length === 0}
          data-testid="button-assign-delivery"
        >
          <Plus className="h-4 w-4 mr-2" />
          Assign Delivery
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold" data-testid="stat-total">{statusCounts.all}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Assigned</p>
            <p className="text-2xl font-bold text-blue-600" data-testid="stat-assigned">{statusCounts.assigned}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Out for Delivery</p>
            <p className="text-2xl font-bold text-orange-600" data-testid="stat-out">{statusCounts.out_for_delivery}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Delivered</p>
            <p className="text-2xl font-bold text-green-600" data-testid="stat-delivered">{statusCounts.delivered}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Payment Collected</p>
            <p className="text-2xl font-bold text-emerald-600" data-testid="stat-collected">{statusCounts.payment_collected}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">RTO</p>
            <p className="text-2xl font-bold text-red-600" data-testid="stat-rto">{statusCounts.rto}</p>
          </CardContent>
        </Card>
      </div>

      <SearchInput
        placeholder="Search orders, customers, address, driver..."
        value={searchQuery}
        onChange={setSearchQuery}
        className="max-w-md"
        data-testid="input-search-delivery"
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DeliveryStatus | "all")}>
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
        <DialogContent className="sm:max-w-lg" data-testid="modal-delivery-details">
          {selectedDelivery && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-2">
                  <span>{selectedDelivery.order?.orderNumber}</span>
                  <StatusBadge status={selectedDelivery.status as string} />
                </DialogTitle>
                <DialogDescription>
                  Assigned to {selectedDelivery.assignedUser?.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">CUSTOMER</h4>
                  <p className="font-medium">{selectedDelivery.order?.customerName}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Phone className="h-4 w-4" />
                    {selectedDelivery.order?.customerPhone}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">ADDRESS</h4>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                    <p className="text-sm">{selectedDelivery.order?.shippingAddress}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount to Collect</span>
                  <span className="text-xl font-bold">
                    {selectedDelivery.order?.paymentMethod === "cod" ? `₹${selectedDelivery.order.totalAmount}` : "Prepaid"}
                  </span>
                </div>

                {selectedDelivery.amountCollected && (
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Payment collected via {selectedDelivery.paymentMode?.toUpperCase()}
                      {selectedDelivery.amountCollected && ` - ₹${selectedDelivery.amountCollected}`}
                    </p>
                  </div>
                )}

                {selectedDelivery.events && selectedDelivery.events.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3">TIMELINE</h4>
                      <div className="space-y-3">
                        {selectedDelivery.events.map((event, idx) => (
                          <div key={event.id} className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              {idx < selectedDelivery.events!.length - 1 && (
                                <div className="w-0.5 h-8 bg-border mt-1" />
                              )}
                            </div>
                            <div className="flex-1 -mt-1">
                              <p className="text-sm font-medium">{event.event}</p>
                              {event.comment && (
                                <p className="text-xs text-muted-foreground">{event.comment}</p>
                              )}
                              {event.location && (
                                <p className="text-xs text-muted-foreground">
                                  <MapPin className="inline h-3 w-3 mr-1" />
                                  {event.location}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                <Clock className="inline h-3 w-3 mr-1" />
                                {new Date(event.createdAt!).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-2">
                  {selectedDelivery.status === "assigned" && (
                    <Button
                      className="w-full"
                      onClick={() => handleStatusUpdate("out_for_delivery")}
                      disabled={updateStatusMutation.isPending}
                      data-testid="button-mark-out"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      {updateStatusMutation.isPending ? "Updating..." : "Mark Out for Delivery"}
                    </Button>
                  )}

                  {selectedDelivery.status === "out_for_delivery" && (
                    <>
                      <Button
                        className="w-full"
                        onClick={() => handleStatusUpdate("delivered")}
                        disabled={updateStatusMutation.isPending}
                        data-testid="button-mark-delivered"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {updateStatusMutation.isPending ? "Updating..." : "Mark Delivered"}
                      </Button>
                      <Button
                        className="w-full"
                        variant="destructive"
                        onClick={() => handleStatusUpdate("rto")}
                        disabled={updateStatusMutation.isPending}
                        data-testid="button-mark-rto"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {updateStatusMutation.isPending ? "Updating..." : "Mark RTO"}
                      </Button>
                    </>
                  )}

                  {selectedDelivery.status === "delivered" && selectedDelivery.order?.paymentMethod === "cod" && !selectedDelivery.amountCollected && (
                    <Button
                      className="w-full"
                      onClick={() => {
                        setCollectedAmount(String(selectedDelivery.order?.totalAmount || ""));
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
              {selectedDelivery?.order?.orderNumber} - ₹{selectedDelivery?.order?.totalAmount}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMode)}>
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
                  <SelectItem value="upi">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      UPI
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

            {(paymentMethod === "qr" || paymentMethod === "upi") && (
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
              disabled={!collectedAmount || collectPaymentMutation.isPending}
              data-testid="button-confirm-payment"
            >
              {collectPaymentMutation.isPending ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent data-testid="modal-assign-delivery">
          <DialogHeader>
            <DialogTitle>Assign Internal Delivery</DialogTitle>
            <DialogDescription>
              Select a COD order and assign it to a delivery driver
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Order</Label>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger data-testid="select-order">
                  <SelectValue placeholder="Choose an order" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedCODOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.orderNumber} - {order.customerName} (₹{order.totalAmount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {unassignedCODOrders.length === 0 && (
                <p className="text-sm text-muted-foreground">No pending COD orders available</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger data-testid="select-driver">
                  <SelectValue placeholder="Choose a driver" />
                </SelectTrigger>
                <SelectContent>
                  {deliveryDrivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name} ({driver.role?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {deliveryDrivers.length === 0 && (
                <p className="text-sm text-muted-foreground">No delivery drivers available</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignDelivery}
              disabled={!selectedOrderId || !selectedDriverId || createDeliveryMutation.isPending}
              data-testid="button-confirm-assign"
            >
              {createDeliveryMutation.isPending ? "Assigning..." : "Assign Delivery"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
