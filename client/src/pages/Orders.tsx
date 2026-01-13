import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { SearchInput } from "@/components/SearchInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Truck, Download, Eye, MapPin, Phone, Mail, Package, Clock, ArrowUpDown, Loader2, Upload, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { OrderImportModal } from "@/components/OrderImportModal";
import type { OrderWithItems, CourierPartner, User, ProductWithVariants } from "@shared/schema";

type OrderStatus = "pending" | "dispatched" | "delivered" | "rto" | "returned" | "refunded";
type SortOption = "newest" | "oldest" | "amount_high" | "amount_low";

function getAgeing(createdAt: string | Date | null): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatAgeing(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export default function Orders() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [selectedOrders, setSelectedOrders] = useState<OrderWithItems[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [showReplacementForm, setShowReplacementForm] = useState(false);

  const [dispatchForm, setDispatchForm] = useState({
    courierType: "third_party" as "third_party" | "in_house",
    courierId: "",
    awbNumber: "",
    assignedTo: "",
    dispatchDate: new Date().toISOString().split("T")[0],
    deliveryCost: "",
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
  });

  const { data: couriers = [] } = useQuery<CourierPartner[]>({
    queryKey: ["/api/couriers"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: products = [] } = useQuery<ProductWithVariants[]>({
    queryKey: ["/api/products"],
  });

  const getStockForSku = (sku: string): { available: number; inStock: boolean } => {
    for (const product of products) {
      const variant = product.variants.find((v) => v.sku === sku);
      if (variant) {
        return { available: variant.stockQuantity, inStock: variant.stockQuantity > 0 };
      }
    }
    return { available: 0, inStock: false };
  };

  const checkAllItemsInStock = (order: OrderWithItems): boolean => {
    if (!order.items || order.items.length === 0) return false;
    return order.items.every((item) => {
      const stock = getStockForSku(item.sku);
      return stock.available >= item.quantity;
    });
  };

  const dispatchMutation = useMutation({
    mutationFn: (data: { orderId: string; courierPartnerId: string; courierType: string; awbNumber?: string; assignedTo?: string }) =>
      apiRequest("POST", `/api/orders/${data.orderId}/dispatch`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Order dispatched successfully" });
      setDetailSheetOpen(false);
      resetDispatchForm();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to dispatch order", description: error.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { orderId: string; status: string; comment?: string }) =>
      apiRequest("POST", `/api/orders/${data.orderId}/status`, { status: data.status, comment: data.comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
    },
  });

  const replacementMutation = useMutation({
    mutationFn: (data: { orderId: string; courierPartnerId: string; courierType: string; awbNumber?: string; assignedTo?: string }) =>
      apiRequest("POST", `/api/orders/${data.orderId}/replacement`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Replacement dispatched successfully" });
      setShowReplacementForm(false);
      setDetailSheetOpen(false);
      resetDispatchForm();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to dispatch replacement", description: error.message, variant: "destructive" });
    },
  });

  const resetDispatchForm = () => {
    setDispatchForm({
      courierType: "third_party",
      courierId: "",
      awbNumber: "",
      assignedTo: "",
      dispatchDate: new Date().toISOString().split("T")[0],
      deliveryCost: "",
    });
  };

  const filteredAndSortedOrders = useMemo(() => {
    let result = orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customerEmail || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.shippingAddress.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      switch (sortOption) {
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "amount_high":
          return parseFloat(String(b.totalAmount)) - parseFloat(String(a.totalAmount));
        case "amount_low":
          return parseFloat(String(a.totalAmount)) - parseFloat(String(b.totalAmount));
        default:
          return 0;
      }
    });

    return result;
  }, [orders, searchQuery, statusFilter, sortOption]);

  const columns = [
    { key: "orderNumber", header: "Order #", sortable: true },
    { key: "customerName", header: "Customer", sortable: true },
    {
      key: "shippingAddress",
      header: "Address",
      render: (order: OrderWithItems) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
          {order.shippingAddress}
        </span>
      ),
    },
    {
      key: "items",
      header: "Items",
      render: (order: OrderWithItems) => (
        <span className="text-sm text-muted-foreground">
          {order.items?.length || 0} item(s)
        </span>
      ),
    },
    {
      key: "totalAmount",
      header: "Amount",
      sortable: true,
      render: (order: OrderWithItems) => `₹${order.totalAmount}`,
    },
    {
      key: "ageing",
      header: "Ageing",
      render: (order: OrderWithItems) => {
        const days = getAgeing(order.createdAt);
        const colorClass = days > 7 
          ? "text-red-500" 
          : days > 3 
            ? "text-orange-500" 
            : "text-muted-foreground";
        const textClass = days > 7 
          ? "text-red-600 dark:text-red-400 font-medium" 
          : days > 3 
            ? "text-orange-600 dark:text-orange-400 font-medium" 
            : "text-muted-foreground";
        return (
          <div className="flex items-center gap-1">
            <Clock className={`h-3 w-3 ${colorClass}`} />
            <span className={`text-sm ${textClass}`}>
              {formatAgeing(days)}
            </span>
          </div>
        );
      },
    },
    {
      key: "paymentMethod",
      header: "Payment",
      render: (order: OrderWithItems) => (
        <span
          className={`text-xs font-medium ${
            order.paymentMethod === "cod"
              ? "text-orange-600 dark:text-orange-400"
              : "text-green-600 dark:text-green-400"
          }`}
        >
          {order.paymentMethod.toUpperCase()}
        </span>
      ),
    },
    {
      key: "courierPartner",
      header: "Courier",
      render: (order: OrderWithItems) => order.courierPartner?.name || "-",
    },
    {
      key: "status",
      header: "Status",
      render: (order: OrderWithItems) => <StatusBadge status={order.status} />,
    },
    {
      key: "actions",
      header: "",
      render: (order: OrderWithItems) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedOrder(order);
            setDetailSheetOpen(true);
          }}
          data-testid={`button-view-order-${order.id}`}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      ),
    },
  ];

  const handleDispatch = () => {
    if (!selectedOrder || !dispatchForm.courierId) return;

    dispatchMutation.mutate({
      orderId: selectedOrder.id,
      courierPartnerId: dispatchForm.courierId,
      courierType: dispatchForm.courierType,
      awbNumber: dispatchForm.awbNumber || undefined,
      assignedTo: dispatchForm.assignedTo || undefined,
    });
  };

  const handleReplacement = () => {
    if (!selectedOrder || !dispatchForm.courierId) return;

    replacementMutation.mutate({
      orderId: selectedOrder.id,
      courierPartnerId: dispatchForm.courierId,
      courierType: dispatchForm.courierType,
      awbNumber: dispatchForm.awbNumber || undefined,
      assignedTo: dispatchForm.assignedTo || undefined,
    });
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handleBulkDispatch = () => {
    if (selectedOrders.length === 1) {
      setSelectedOrder(selectedOrders[0]);
      setDetailSheetOpen(true);
    }
  };

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    dispatched: orders.filter((o) => o.status === "dispatched").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    rto: orders.filter((o) => o.status === "rto").length,
  };

  const thirdPartyCouriers = couriers.filter((c) => c.type === "third_party");
  const inHouseCouriers = couriers.filter((c) => c.type === "in_house");
  const deliveryUsers = users.filter((u) => u.roleId);

  if (ordersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Orders</h1>
            <p className="text-muted-foreground">Manage and track all your orders</p>
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage and track all your orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)} data-testid="button-import-orders">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" data-testid="button-export-orders">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}>
        <TabsList className="flex-wrap" data-testid="tabs-order-status">
          <TabsTrigger value="all" data-testid="tab-all">
            All ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending ({statusCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="dispatched" data-testid="tab-dispatched">
            Dispatched ({statusCounts.dispatched})
          </TabsTrigger>
          <TabsTrigger value="delivered" data-testid="tab-delivered">
            Delivered ({statusCounts.delivered})
          </TabsTrigger>
          <TabsTrigger value="rto" data-testid="tab-rto">
            RTO ({statusCounts.rto})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col lg:flex-row gap-4">
        <SearchInput
          placeholder="Search orders, customers, address..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="lg:w-80"
        />
        <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
          <SelectTrigger className="w-full lg:w-48" data-testid="select-sort-order">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First (Ageing)</SelectItem>
            <SelectItem value="amount_high">Amount: High to Low</SelectItem>
            <SelectItem value="amount_low">Amount: Low to High</SelectItem>
          </SelectContent>
        </Select>

        {selectedOrders.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">
              {selectedOrders.length} selected
            </span>
            <Button onClick={handleBulkDispatch} data-testid="button-bulk-dispatch">
              <Truck className="h-4 w-4 mr-2" />
              Dispatch Selected
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            data={filteredAndSortedOrders}
            columns={columns}
            selectable
            getRowId={(order) => order.id}
            onSelectionChange={setSelectedOrders}
            onRowClick={(order) => {
              setSelectedOrder(order);
              setDetailSheetOpen(true);
            }}
            emptyMessage="No orders found. Import orders from Shopify to get started."
          />
        </CardContent>
      </Card>

      <Sheet open={detailSheetOpen} onOpenChange={(open) => {
        setDetailSheetOpen(open);
        if (!open) {
          setShowReplacementForm(false);
          resetDispatchForm();
        }
      }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto" data-testid="sheet-order-details">
          {selectedOrder && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  <span>{selectedOrder.orderNumber}</span>
                  <StatusBadge status={selectedOrder.status} />
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Order Age: <strong>{formatAgeing(getAgeing(selectedOrder.createdAt))}</strong></span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">CUSTOMER DETAILS</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{selectedOrder.customerName}</span>
                    </div>
                    {selectedOrder.customerEmail && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {selectedOrder.customerEmail}
                      </div>
                    )}
                    {selectedOrder.customerPhone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {selectedOrder.customerPhone}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">SHIPPING ADDRESS</h3>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                    <p className="text-sm">{selectedOrder.shippingAddress}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">ORDER ITEMS</h3>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, idx) => {
                      const stock = getStockForSku(item.sku);
                      const hasEnoughStock = stock.available >= item.quantity;
                      return (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{item.productName}</p>
                              <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-sm font-medium">₹{item.price} x {item.quantity}</p>
                            {(selectedOrder.status === "pending" || selectedOrder.status === "delivered") && (
                              <div className="flex items-center justify-end gap-1">
                                {hasEnoughStock ? (
                                  <Badge variant="default" className="text-xs">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {stock.available} in stock
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    {stock.available === 0 ? "Out of stock" : `Only ${stock.available}`}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">PAYMENT</h3>
                  <div className="flex items-center justify-between">
                    <span>Method</span>
                    <Badge variant={selectedOrder.paymentMethod === "cod" ? "secondary" : "default"}>
                      {selectedOrder.paymentMethod.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span>Total Amount</span>
                    <span className="font-bold text-lg">₹{selectedOrder.totalAmount}</span>
                  </div>
                </div>

                {selectedOrder.courierPartner && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">DISPATCH INFO</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Courier</span>
                          <span>{selectedOrder.courierPartner.name}</span>
                        </div>
                        {selectedOrder.awbNumber && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">AWB Number</span>
                            <span className="font-mono">{selectedOrder.awbNumber}</span>
                          </div>
                        )}
                        {selectedOrder.assignedUser && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Assigned To</span>
                            <span>{selectedOrder.assignedUser.name}</span>
                          </div>
                        )}
                        {selectedOrder.dispatchDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Dispatch Date</span>
                            <span>{new Date(selectedOrder.dispatchDate).toLocaleDateString("en-IN")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-4 space-y-4">
                  {selectedOrder.status === "pending" && (
                    <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Dispatch Order
                        </h4>
                        {!checkAllItemsInStock(selectedOrder) && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Insufficient Stock
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Courier Type</Label>
                        <RadioGroup
                          value={dispatchForm.courierType}
                          onValueChange={(v) =>
                            setDispatchForm((prev) => ({
                              ...prev,
                              courierType: v as "third_party" | "in_house",
                              courierId: "",
                              awbNumber: "",
                              assignedTo: "",
                            }))
                          }
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="third_party" id="type_third_inline" />
                            <Label htmlFor="type_third_inline" className="font-normal">Third Party</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="in_house" id="type_internal_inline" />
                            <Label htmlFor="type_internal_inline" className="font-normal">Internal</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label>Select Courier</Label>
                        <Select
                          value={dispatchForm.courierId}
                          onValueChange={(v) => setDispatchForm((prev) => ({ ...prev, courierId: v }))}
                        >
                          <SelectTrigger data-testid="select-inline-courier">
                            <SelectValue placeholder="Select courier partner" />
                          </SelectTrigger>
                          <SelectContent>
                            {(dispatchForm.courierType === "third_party" ? thirdPartyCouriers : inHouseCouriers).map((courier) => (
                              <SelectItem key={courier.id} value={courier.id}>
                                {courier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {dispatchForm.courierType === "third_party" && (
                        <div className="space-y-2">
                          <Label>AWB Number</Label>
                          <Input
                            value={dispatchForm.awbNumber}
                            onChange={(e) => setDispatchForm((prev) => ({ ...prev, awbNumber: e.target.value }))}
                            placeholder="Enter AWB/Tracking number"
                            data-testid="input-inline-awb"
                          />
                        </div>
                      )}

                      {dispatchForm.courierType === "in_house" && (
                        <div className="space-y-2">
                          <Label>Assign To</Label>
                          <Select
                            value={dispatchForm.assignedTo}
                            onValueChange={(v) => setDispatchForm((prev) => ({ ...prev, assignedTo: v }))}
                          >
                            <SelectTrigger data-testid="select-inline-assign">
                              <SelectValue placeholder="Select delivery person" />
                            </SelectTrigger>
                            <SelectContent>
                              {deliveryUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <Button
                        className="w-full"
                        onClick={handleDispatch}
                        disabled={!dispatchForm.courierId || dispatchMutation.isPending || !checkAllItemsInStock(selectedOrder)}
                        data-testid="button-confirm-inline-dispatch"
                      >
                        {dispatchMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Truck className="h-4 w-4 mr-2" />
                        )}
                        Dispatch Order
                      </Button>
                    </div>
                  )}

                  {selectedOrder.status === "dispatched" && (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => handleStatusUpdate(selectedOrder.id, "delivered")}
                      disabled={updateStatusMutation.isPending}
                      data-testid="button-mark-delivered"
                    >
                      {updateStatusMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Mark as Delivered
                    </Button>
                  )}

                  {selectedOrder.status === "delivered" && !showReplacementForm && (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => setShowReplacementForm(true)}
                      disabled={!checkAllItemsInStock(selectedOrder)}
                      data-testid="button-replacement-order"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {checkAllItemsInStock(selectedOrder) ? "Send Replacement" : "Insufficient Stock for Replacement"}
                    </Button>
                  )}

                  {selectedOrder.status === "delivered" && showReplacementForm && (
                    <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                      <h4 className="font-semibold">Replacement Dispatch</h4>
                      
                      <div className="space-y-2">
                        <Label>Courier Type</Label>
                        <RadioGroup
                          value={dispatchForm.courierType}
                          onValueChange={(v) =>
                            setDispatchForm((prev) => ({
                              ...prev,
                              courierType: v as "third_party" | "in_house",
                              courierId: "",
                              awbNumber: "",
                              assignedTo: "",
                            }))
                          }
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="third_party" id="repl_type_third" />
                            <Label htmlFor="repl_type_third" className="font-normal">Third Party</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="in_house" id="repl_type_internal" />
                            <Label htmlFor="repl_type_internal" className="font-normal">Internal</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label>Select Courier</Label>
                        <Select
                          value={dispatchForm.courierId}
                          onValueChange={(v) => setDispatchForm((prev) => ({ ...prev, courierId: v }))}
                        >
                          <SelectTrigger data-testid="select-replacement-courier">
                            <SelectValue placeholder="Select courier partner" />
                          </SelectTrigger>
                          <SelectContent>
                            {(dispatchForm.courierType === "third_party" ? thirdPartyCouriers : inHouseCouriers).map((courier) => (
                              <SelectItem key={courier.id} value={courier.id}>
                                {courier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {dispatchForm.courierType === "third_party" && (
                        <div className="space-y-2">
                          <Label>AWB Number</Label>
                          <Input
                            value={dispatchForm.awbNumber}
                            onChange={(e) => setDispatchForm((prev) => ({ ...prev, awbNumber: e.target.value }))}
                            placeholder="Enter AWB/Tracking number"
                            data-testid="input-replacement-awb"
                          />
                        </div>
                      )}

                      {dispatchForm.courierType === "in_house" && (
                        <div className="space-y-2">
                          <Label>Assign To</Label>
                          <Select
                            value={dispatchForm.assignedTo}
                            onValueChange={(v) => setDispatchForm((prev) => ({ ...prev, assignedTo: v }))}
                          >
                            <SelectTrigger data-testid="select-replacement-assign">
                              <SelectValue placeholder="Select delivery person" />
                            </SelectTrigger>
                            <SelectContent>
                              {deliveryUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setShowReplacementForm(false);
                            resetDispatchForm();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={handleReplacement}
                          disabled={!dispatchForm.courierId || replacementMutation.isPending}
                          data-testid="button-confirm-replacement"
                        >
                          {replacementMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Send Replacement
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <OrderImportModal open={importDialogOpen} onOpenChange={setImportDialogOpen} />
    </div>
  );
}
