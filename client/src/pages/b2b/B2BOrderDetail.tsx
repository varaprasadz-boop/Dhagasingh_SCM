import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  RefreshCw,
  FileText,
  CreditCard,
  Pencil,
  Trash2,
  Package,
  MapPin,
  ExternalLink,
  Download,
  ImageIcon,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { B2BOrderWithDetails, B2BPaymentMilestone, B2BPayment, B2BOrderItem } from "@shared/schema";

const statusLabels: Record<string, string> = {
  order_received: "Order Received",
  design_review: "Design Review",
  client_approval: "Client Approval",
  production_scheduled: "Production Scheduled",
  printing_in_progress: "Printing",
  quality_check: "Quality Check",
  packed: "Packed",
  dispatched: "Dispatched",
  delivered: "Delivered",
  closed: "Closed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const statusFlow = [
  "order_received",
  "design_review",
  "client_approval",
  "production_scheduled",
  "printing_in_progress",
  "quality_check",
  "packed",
  "dispatched",
  "delivered",
  "closed",
  "completed",
];

const paymentStatusLabels: Record<string, string> = {
  not_paid: "Not Paid",
  advance_received: "Advance Received",
  partially_paid: "Partially Paid",
  fully_paid: "Fully Paid",
};

export default function B2BOrderDetail() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const { hasPermission, isSuperAdmin } = useAuth();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const canEdit = isSuperAdmin || hasPermission("edit_b2b_orders");
  const canDelete = isSuperAdmin;

  const { data: order, isLoading } = useQuery<B2BOrderWithDetails>({
    queryKey: ["/api/b2b/orders", params.id],
  });

  const { data: milestones } = useQuery<B2BPaymentMilestone[]>({
    queryKey: ["/api/b2b/orders", params.id, "milestones"],
    enabled: !!params.id,
  });

  const { data: payments } = useQuery<B2BPayment[]>({
    queryKey: ["/api/b2b/payments"],
  });

  const orderPayments = payments?.filter((p) => p.orderId === params.id);

  const updateStatusMutation = useMutation({
    mutationFn: (data: { status: string; comment: string }) =>
      apiRequest("POST", `/api/b2b/orders/${params.id}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/orders", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/dashboard"] });
      toast({ title: "Status updated successfully" });
      setStatusDialogOpen(false);
      setNewStatus("");
      setStatusComment("");
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/b2b/payments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/orders", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/dashboard"] });
      toast({ title: "Payment recorded successfully" });
      setPaymentDialogOpen(false);
      setPaymentAmount("");
      setPaymentReference("");
    },
    onError: () => {
      toast({ title: "Failed to record payment", variant: "destructive" });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/b2b/orders/${params.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/dashboard"] });
      toast({ title: "Order deleted" });
      window.location.href = "/b2b/orders";
    },
    onError: () => {
      toast({ title: "Failed to delete order", variant: "destructive" });
    },
  });

  const handleStatusUpdate = () => {
    if (!newStatus) return;
    updateStatusMutation.mutate({ status: newStatus, comment: statusComment });
  };

  const handleAddPayment = () => {
    if (!paymentAmount) return;
    addPaymentMutation.mutate({
      orderId: params.id,
      amount: parseFloat(paymentAmount),
      paymentMethod,
      referenceNumber: paymentReference,
      paymentDate: new Date().toISOString(),
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Order not found</p>
          <Link href="/b2b/orders">
            <Button className="mt-4" variant="outline">
              Back to Orders
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const currentStatusIndex = statusFlow.indexOf(order.status);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/b2b/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" data-testid="order-number">
            {order.orderNumber}
          </h1>
          <p className="text-muted-foreground">
            Created {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canEdit && (
            <Link href={`/b2b/orders/${params.id}/edit`}>
              <Button variant="outline" data-testid="button-edit-order">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Order
              </Button>
            </Link>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" data-testid="button-delete-order">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Order
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete order {order.orderNumber} and all related items, artwork, and history. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteOrderMutation.mutate()}
                    disabled={deleteOrderMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteOrderMutation.isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-add-payment">
                <CreditCard className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Amount (INR)</Label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0"
                    data-testid="input-payment-amount"
                  />
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger data-testid="select-payment-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reference Number</Label>
                  <Input
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Transaction/Cheque number"
                    data-testid="input-payment-reference"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddPayment}
                    disabled={!paymentAmount || addPaymentMutation.isPending}
                    data-testid="button-save-payment"
                  >
                    {addPaymentMutation.isPending ? "Saving..." : "Save Payment"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-update-status">
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Order Status</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>New Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger data-testid="select-new-status">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Comment (optional)</Label>
                  <Textarea
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    placeholder="Add a comment about this status change"
                    data-testid="input-status-comment"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={!newStatus || updateStatusMutation.isPending}
                    data-testid="button-save-status"
                  >
                    {updateStatusMutation.isPending ? "Updating..." : "Update"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Badge variant="secondary" className="text-base px-3 py-1">
          {statusLabels[order.status] || order.status}
        </Badge>
        <Badge variant="outline" className="text-base px-3 py-1">
          {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
        </Badge>
        {order.priority !== "normal" && (
          <Badge variant="destructive" className="text-base px-3 py-1">
            {order.priority.toUpperCase()}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {statusFlow.map((status, index) => {
              const isCompleted = index < currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              return (
                <div
                  key={status}
                  className={`flex-1 min-w-[100px] p-2 rounded text-center text-xs ${
                    isCompleted
                      ? "bg-green-100 text-green-800"
                      : isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {statusLabels[status]}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Client Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{order.client?.companyName || "Unknown"}</p>
            <p className="text-sm text-muted-foreground">{order.client?.contactPerson}</p>
            <p className="text-sm text-muted-foreground">{order.client?.phone}</p>
            {order.client?.email && (
              <p className="text-sm text-muted-foreground">{order.client?.email}</p>
            )}
            {order.client?.gstNumber && (
              <p className="text-sm text-muted-foreground">GST: {order.client?.gstNumber}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority:</span>
              <Badge variant={order.priority === "urgent" ? "destructive" : "outline"}>{order.priority}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Artwork Status:</span>
              <Badge variant="outline">{order.artworkStatus}</Badge>
            </div>
            {order.printingType && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Printing Type:</span>
                <span>{order.printingType.name}</span>
              </div>
            )}
            {order.eventType && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Event Type:</span>
                <span>{order.eventType}</span>
              </div>
            )}
            {order.requiredDeliveryDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Required Delivery:</span>
                <span>{format(new Date(order.requiredDeliveryDate), "MMM d, yyyy")}</span>
              </div>
            )}
            {order.specialInstructions && (
              <div>
                <span className="text-muted-foreground">Special Instructions:</span>
                <p className="mt-1">{order.specialInstructions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-bold">{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Received:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(order.amountReceived)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending:</span>
              <span className="font-medium text-amber-600">
                {formatCurrency(order.balancePending)}
              </span>
            </div>
            <Separator />
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${
                    (parseFloat(order.amountReceived) / parseFloat(order.totalAmount)) * 100
                  }%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Delivery Address
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="whitespace-pre-wrap">{order.deliveryAddress}</p>
          {(order.deliveryCity || order.deliveryState || order.deliveryZip || order.deliveryCountry) && (
            <p className="mt-2 text-muted-foreground">
              {[order.deliveryCity, order.deliveryState, order.deliveryZip].filter(Boolean).join(", ")}
              {order.deliveryCountry && (order.deliveryCity || order.deliveryState || order.deliveryZip) ? `, ${order.deliveryCountry}` : order.deliveryCountry ?? ""}
            </p>
          )}
        </CardContent>
      </Card>

      {order.artwork && order.artwork.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Artwork / High resolution logo
            </CardTitle>
            <p className="text-sm text-muted-foreground">Uploaded files for this order. Download to view or use.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.artwork.map((file: { id: string; fileName: string; fileUrl: string; fileType?: string }) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium truncate flex-1 mr-2">{file.fileName}</span>
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={file.fileName}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline shrink-0"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {order.items && order.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Details
            </CardTitle>
            <p className="text-sm text-muted-foreground">Size-wise, color with quantity. Total quantity of the order below.</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium p-3">Product</th>
                    <th className="text-left font-medium p-3">Color</th>
                    <th className="text-left font-medium p-3">Size</th>
                    <th className="text-right font-medium p-3">Qty</th>
                    <th className="text-right font-medium p-3">Unit price</th>
                    <th className="text-right font-medium p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item: B2BOrderItem & { product?: { name: string } }) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="p-3 font-medium">{(item as { product?: { name: string } }).product?.name ?? "Product"}</td>
                      <td className="p-3 text-muted-foreground">{item.variantColor ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{item.variantSize ?? "—"}</td>
                      <td className="p-3 text-right font-medium">{item.quantity}</td>
                      <td className="p-3 text-right">{item.unitPrice != null ? `₹${item.unitPrice}` : "—"}</td>
                      <td className="p-3 text-right">{item.totalPrice != null ? `₹${item.totalPrice}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/30 font-medium">
                    <td colSpan={3} className="p-3">Total quantity (order)</td>
                    <td className="p-3 text-right">
                      {order.items.reduce((sum: number, item: B2BOrderItem) => sum + (item.quantity ?? 0), 0)}
                    </td>
                    <td colSpan={2} className="p-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {order.specialInstructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Special Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{order.specialInstructions}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment History</CardTitle>
            <p className="text-sm text-muted-foreground">All payments recorded for this order.</p>
          </CardHeader>
          <CardContent>
            {orderPayments && orderPayments.length > 0 ? (
              <div className="space-y-3">
                {orderPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.paymentMode} • {payment.transactionRef || "No ref"}
                      </p>
                      {payment.proofUrl && (
                        <a
                          href={payment.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View proof
                        </a>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(payment.paymentDate), "MMM d, yyyy")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No payments recorded yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status History</CardTitle>
          </CardHeader>
          <CardContent>
            {order.statusHistory && order.statusHistory.length > 0 ? (
              <div className="space-y-3">
                {order.statusHistory.map((entry) => (
                  <div key={entry.id} className="flex gap-3 border-l-2 border-muted pl-4 pb-3">
                    <div>
                      <Badge variant="outline">{statusLabels[entry.status] || entry.status}</Badge>
                      {entry.comment && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {entry.createdAt ? format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a") : "Unknown date"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No status history</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
