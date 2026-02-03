import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, ShoppingCart, Calendar, User, DollarSign, Eye, ChevronDown, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import type { B2BOrderWithDetails, B2BClient } from "@shared/schema";

const orderFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  fabricType: z.string().optional().or(z.literal("")),
  printingType: z.string().optional().or(z.literal("")),
  artworkStatus: z.enum(["pending", "received", "approved", "revision_needed"]),
  sizeBreakup: z.string().optional().or(z.literal("")),
  priority: z.enum(["normal", "urgent", "express"]),
  totalAmount: z.coerce.number().positive("Total amount must be greater than 0"),
  expectedDeliveryDate: z.string().optional(),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  specialInstructions: z.string().optional().or(z.literal("")),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

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

const statusColors: Record<string, string> = {
  order_received: "bg-blue-100 text-blue-800",
  design_review: "bg-purple-100 text-purple-800",
  client_approval: "bg-amber-100 text-amber-800",
  production_scheduled: "bg-indigo-100 text-indigo-800",
  printing_in_progress: "bg-orange-100 text-orange-800",
  quality_check: "bg-cyan-100 text-cyan-800",
  packed: "bg-lime-100 text-lime-800",
  dispatched: "bg-sky-100 text-sky-800",
  delivered: "bg-green-100 text-green-800",
  closed: "bg-emerald-100 text-emerald-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const paymentStatusLabels: Record<string, string> = {
  not_paid: "Not Paid",
  advance_received: "Advance",
  partially_paid: "Partial",
  fully_paid: "Paid",
};

const paymentStatusColors: Record<string, string> = {
  not_paid: "bg-red-100 text-red-800",
  advance_received: "bg-amber-100 text-amber-800",
  partially_paid: "bg-blue-100 text-blue-800",
  fully_paid: "bg-green-100 text-green-800",
};

const ITEMS_PER_PAGE = 10;

export default function B2BOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusOrderId, setStatusOrderId] = useState<string | null>(null);
  const [quickStatus, setQuickStatus] = useState("");
  const [quickStatusComment, setQuickStatusComment] = useState("");
  const { toast } = useToast();

  const { data: orders, isLoading } = useQuery<B2BOrderWithDetails[]>({
    queryKey: ["/api/b2b/orders"],
  });

  const { data: clients } = useQuery<B2BClient[]>({
    queryKey: ["/api/b2b/clients"],
  });

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      clientId: "",
      fabricType: "",
      printingType: "",
      artworkStatus: "pending",
      sizeBreakup: "",
      priority: "normal",
      totalAmount: 0,
      expectedDeliveryDate: "",
      deliveryAddress: "",
      specialInstructions: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: OrderFormData) =>
      apiRequest("POST", "/api/b2b/orders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/dashboard"] });
      toast({ title: "Order created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      const message = error?.message || "";
      toast({ 
        title: "Could not create order", 
        description: message.includes("403") ? "You don't have permission to create orders for this client" : "Please check the form and try again",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (data: OrderFormData) => {
    createMutation.mutate(data);
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status, comment }: { orderId: string; status: string; comment: string }) =>
      apiRequest("POST", `/api/b2b/orders/${orderId}/status`, { status, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/dashboard"] });
      toast({ title: "Status updated successfully" });
      setStatusDialogOpen(false);
      setStatusOrderId(null);
      setQuickStatus("");
      setQuickStatusComment("");
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const openStatusDialog = (orderId: string) => {
    setStatusOrderId(orderId);
    setQuickStatus("");
    setQuickStatusComment("");
    setStatusDialogOpen(true);
  };

  const handleQuickStatusUpdate = () => {
    if (!statusOrderId || !quickStatus) return;
    updateStatusMutation.mutate({ orderId: statusOrderId, status: quickStatus, comment: quickStatusComment });
  };

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.client?.companyName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [search, statusFilter]);

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
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">B2B Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">B2B Orders</h1>
          <p className="text-muted-foreground">Corporate printing and customization orders</p>
        </div>

        <Link href="/b2b/orders/new">
          <Button data-testid="button-new-order">
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </Link>
      </div>

      {/* Legacy dialog (deprecated - using landing page now) */}
      {false && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-order-legacy">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create B2B Order</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-client">
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients?.filter(c => c.status === "active").map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fabricType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fabric Type</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Cotton, Polyester" data-testid="input-fabric" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="printingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Printing Type</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Screen, DTG, Sublimation" data-testid="input-printing" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="artworkStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Artwork Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-artwork-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="received">Received</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="revision_needed">Revision Needed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="express">Express</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="sizeBreakup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size Breakup</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="e.g., S-10, M-25, L-30, XL-20, XXL-15" data-testid="input-sizes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount (INR) *</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0" data-testid="input-amount" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expectedDeliveryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Delivery</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-delivery-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Address *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Full delivery address" data-testid="input-delivery-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Instructions</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Any special requirements or notes" data-testid="input-instructions" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-create-order">
                    {createMutation.isPending ? "Creating..." : "Create Order"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Status</Label>
              <Select value={quickStatus} onValueChange={setQuickStatus}>
                <SelectTrigger data-testid="select-quick-status">
                  <SelectValue placeholder="Select status" />
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
                value={quickStatusComment}
                onChange={(e) => setQuickStatusComment(e.target.value)}
                placeholder="Comment about this status change"
                data-testid="input-quick-status-comment"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleQuickStatusUpdate}
                disabled={!quickStatus || updateStatusMutation.isPending}
                data-testid="button-save-quick-status"
              >
                {updateStatusMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredOrders && filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.slice(0, displayCount).map((order) => (
            <Card key={order.id} className="hover-elevate" data-testid={`order-card-${order.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-lg" data-testid={`order-number-${order.id}`}>
                        {order.orderNumber}
                      </span>
                      <Badge className={statusColors[order.status] || ""}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                      <Badge className={paymentStatusColors[order.paymentStatus] || ""}>
                        {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
                      </Badge>
                      {order.priority !== "normal" && (
                        <Badge variant="destructive">{order.priority.toUpperCase()}</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{order.client?.companyName || "Unknown Client"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatCurrency(order.totalAmount)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(order.createdAt), "MMM d, yyyy")}</span>
                      </div>
                      {order.specialInstructions && <span className="truncate max-w-[200px]">{order.specialInstructions}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <p className="text-sm text-muted-foreground">Received</p>
                      <p className="font-medium text-green-600">{formatCurrency(order.amountReceived)}</p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="font-medium text-amber-600">{formatCurrency(order.balancePending)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openStatusDialog(order.id)}
                      data-testid={`button-status-${order.id}`}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Update status
                    </Button>
                    <Link href={`/b2b/orders/${order.id}`}>
                      <Button variant="outline" data-testid={`button-view-${order.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredOrders.length > displayCount && (
            <div className="flex justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => setDisplayCount(prev => prev + ITEMS_PER_PAGE)}
                data-testid="button-load-more"
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                Show More ({filteredOrders.length - displayCount} remaining)
              </Button>
            </div>
          )}
          
          {filteredOrders.length > ITEMS_PER_PAGE && displayCount > ITEMS_PER_PAGE && (
            <p className="text-center text-sm text-muted-foreground">
              Showing {Math.min(displayCount, filteredOrders.length)} of {filteredOrders.length} orders
            </p>
          )}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium mb-1">No orders found</h3>
            <p className="text-sm">Create your first B2B order to get started</p>
          </div>
        </Card>
      )}
    </div>
  );
}
