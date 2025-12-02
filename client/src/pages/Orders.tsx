import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { SearchInput } from "@/components/SearchInput";
import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { FileUp, Truck, Download, Filter, Eye, MapPin, Phone, Mail, Package } from "lucide-react";
import { mockOrders, mockCouriers, type Order, type OrderStatus } from "@/lib/mockData";

export default function Orders() {
  const [orders, setOrders] = useState(mockOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);

  const [dispatchForm, setDispatchForm] = useState({
    courierType: "third_party" as "third_party" | "in_house",
    courierId: "",
    awbNumber: "",
    assignedTo: "",
    dispatchDate: new Date().toISOString().split("T")[0],
    deliveryCost: "",
  });

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shippingAddress.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { key: "orderNumber", header: "Order #", sortable: true },
    { key: "customerName", header: "Customer", sortable: true },
    {
      key: "shippingAddress",
      header: "Address",
      render: (order: Order) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
          {order.shippingAddress}
        </span>
      ),
    },
    {
      key: "items",
      header: "Items",
      render: (order: Order) => (
        <span className="text-sm text-muted-foreground">
          {order.items.length} item(s)
        </span>
      ),
    },
    {
      key: "totalAmount",
      header: "Amount",
      sortable: true,
      render: (order: Order) => `₹${order.totalAmount}`,
    },
    {
      key: "paymentMethod",
      header: "Payment",
      render: (order: Order) => (
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
      render: (order: Order) => order.courierPartner || "-",
    },
    {
      key: "status",
      header: "Status",
      render: (order: Order) => <StatusBadge status={order.status} />,
    },
    {
      key: "actions",
      header: "",
      render: (order: Order) => (
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

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const handleDispatch = () => {
    if (!selectedOrder) return;

    const courier = mockCouriers.find((c) => c.id === dispatchForm.courierId);
    
    setOrders((prev) =>
      prev.map((order) =>
        order.id === selectedOrder.id
          ? {
              ...order,
              status: "dispatched" as OrderStatus,
              courierPartner: courier?.name,
              courierType: dispatchForm.courierType,
              awbNumber: dispatchForm.awbNumber || undefined,
              assignedTo: dispatchForm.assignedTo || undefined,
              dispatchDate: dispatchForm.dispatchDate,
              deliveryCost: parseFloat(dispatchForm.deliveryCost) || undefined,
            }
          : order
      )
    );

    setDispatchDialogOpen(false);
    setDispatchForm({
      courierType: "third_party",
      courierId: "",
      awbNumber: "",
      assignedTo: "",
      dispatchDate: new Date().toISOString().split("T")[0],
      deliveryCost: "",
    });
  };

  const handleBulkDispatch = () => {
    if (selectedOrders.length === 1) {
      setSelectedOrder(selectedOrders[0]);
      setDispatchDialogOpen(true);
    }
  };

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    dispatched: orders.filter((o) => o.status === "dispatched").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    rto: orders.filter((o) => o.status === "rto").length,
  };

  const thirdPartyCouriers = mockCouriers.filter((c) => c.type === "third_party");
  const inHouseCouriers = mockCouriers.filter((c) => c.type === "in_house");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage and track all your orders</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-import-orders">
                <FileUp className="h-4 w-4 mr-2" />
                Import Orders
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg" data-testid="modal-import">
              <DialogHeader>
                <DialogTitle>Import Orders from Shopify</DialogTitle>
                <DialogDescription>Upload CSV files to import orders or update dispatch status</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="orders" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="orders">Import Orders</TabsTrigger>
                  <TabsTrigger value="dispatch">Bulk Dispatch</TabsTrigger>
                </TabsList>
                <TabsContent value="orders" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Upload a Shopify-format CSV file to import orders. All orders will start with "Pending" status.
                  </p>
                  <FileUpload
                    accept=".csv"
                    label="Upload Orders CSV"
                    description="Shopify export format"
                    onUpload={(file) => {
                      console.log("Importing orders from:", file.name);
                      setImportDialogOpen(false);
                    }}
                  />
                </TabsContent>
                <TabsContent value="dispatch" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV with Order Number, Courier Name, and AWB Number to bulk update dispatch status.
                  </p>
                  <FileUpload
                    accept=".csv"
                    label="Upload Dispatch CSV"
                    description="Order #, Courier, AWB, Delivery Cost"
                    onUpload={(file) => {
                      console.log("Bulk dispatch from:", file.name);
                      setImportDialogOpen(false);
                    }}
                  />
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          <Button variant="outline" data-testid="button-export-orders">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <SearchInput
          placeholder="Search orders, customers, address..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="lg:w-80"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}
        >
          <SelectTrigger className="w-full lg:w-48" data-testid="select-status-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders ({statusCounts.all})</SelectItem>
            <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
            <SelectItem value="dispatched">Dispatched ({statusCounts.dispatched})</SelectItem>
            <SelectItem value="delivered">Delivered ({statusCounts.delivered})</SelectItem>
            <SelectItem value="rto">RTO ({statusCounts.rto})</SelectItem>
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
            data={filteredOrders}
            columns={columns}
            selectable
            getRowId={(order) => order.id}
            onSelectionChange={setSelectedOrders}
            onRowClick={(order) => {
              setSelectedOrder(order);
              setDetailSheetOpen(true);
            }}
            emptyMessage="No orders found"
          />
        </CardContent>
      </Card>

      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
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
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">CUSTOMER DETAILS</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {selectedOrder.customerEmail}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {selectedOrder.customerPhone}
                    </div>
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
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{item.productName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{item.sku} | {item.color} | {item.size}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">₹{item.price} x {item.quantity}</p>
                          <p className="text-xs text-muted-foreground">₹{item.price * item.quantity}</p>
                        </div>
                      </div>
                    ))}
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
                          <span>{selectedOrder.courierPartner}</span>
                        </div>
                        {selectedOrder.awbNumber && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">AWB Number</span>
                            <span className="font-mono">{selectedOrder.awbNumber}</span>
                          </div>
                        )}
                        {selectedOrder.assignedTo && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Assigned To</span>
                            <span>{selectedOrder.assignedTo}</span>
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

                <div className="pt-4 space-y-2">
                  {selectedOrder.status === "pending" && (
                    <Button
                      className="w-full"
                      onClick={() => {
                        setDetailSheetOpen(false);
                        setDispatchDialogOpen(true);
                      }}
                      data-testid="button-dispatch-order"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Dispatch Order
                    </Button>
                  )}
                  {selectedOrder.status === "dispatched" && (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => handleStatusUpdate(selectedOrder.id, "delivered")}
                      data-testid="button-mark-delivered"
                    >
                      Mark as Delivered
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={dispatchDialogOpen} onOpenChange={setDispatchDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="modal-dispatch">
          <DialogHeader>
            <DialogTitle>Dispatch Order</DialogTitle>
            <DialogDescription>
              {selectedOrder?.orderNumber} - {selectedOrder?.customerName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
                  <RadioGroupItem value="third_party" id="type_third" />
                  <Label htmlFor="type_third" className="font-normal">Third Party</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="in_house" id="type_internal" />
                  <Label htmlFor="type_internal" className="font-normal">Internal</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Select Courier</Label>
              <Select
                value={dispatchForm.courierId}
                onValueChange={(v) => setDispatchForm((prev) => ({ ...prev, courierId: v }))}
              >
                <SelectTrigger data-testid="select-dispatch-courier">
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
              <>
                <div className="space-y-2">
                  <Label>Dispatch Date</Label>
                  <Input
                    type="date"
                    value={dispatchForm.dispatchDate}
                    onChange={(e) => setDispatchForm((prev) => ({ ...prev, dispatchDate: e.target.value }))}
                    data-testid="input-dispatch-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>AWB Number</Label>
                  <Input
                    value={dispatchForm.awbNumber}
                    onChange={(e) => setDispatchForm((prev) => ({ ...prev, awbNumber: e.target.value }))}
                    placeholder="Enter AWB number"
                    data-testid="input-awb-number"
                  />
                </div>
              </>
            )}

            {dispatchForm.courierType === "in_house" && (
              <div className="space-y-2">
                <Label>Assigned To</Label>
                <Input
                  value={dispatchForm.assignedTo}
                  onChange={(e) => setDispatchForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
                  placeholder="Employee name"
                  data-testid="input-assigned-to"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Delivery Cost (₹)</Label>
              <Input
                type="number"
                value={dispatchForm.deliveryCost}
                onChange={(e) => setDispatchForm((prev) => ({ ...prev, deliveryCost: e.target.value }))}
                placeholder="Optional"
                data-testid="input-delivery-cost"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDispatchDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDispatch}
              disabled={!dispatchForm.courierId}
              data-testid="button-confirm-dispatch"
            >
              Dispatch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
