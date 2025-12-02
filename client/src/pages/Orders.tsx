import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { SearchInput } from "@/components/SearchInput";
import { FileUpload } from "@/components/FileUpload";
import { DispatchModal } from "@/components/DispatchModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, Truck, Download, Filter } from "lucide-react";
import { mockOrders, type Order, type OrderStatus } from "@/lib/mockData";

export default function Orders() {
  const [orders, setOrders] = useState(mockOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { key: "orderNumber", header: "Order #", sortable: true },
    { key: "customerName", header: "Customer", sortable: true },
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
      key: "awbNumber",
      header: "AWB",
      render: (order: Order) =>
        order.awbNumber ? (
          <span className="font-mono text-xs">{order.awbNumber}</span>
        ) : (
          "-"
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (order: Order) => <StatusBadge status={order.status} />,
    },
  ];

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const handleBulkDispatch = () => {
    if (selectedOrders.length === 1) {
      setSelectedOrder(selectedOrders[0]);
      setDispatchModalOpen(true);
    } else {
      console.log("Bulk dispatch:", selectedOrders.length, "orders");
    }
  };

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    dispatched: orders.filter((o) => o.status === "dispatched").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    rto: orders.filter((o) => o.status === "rto").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">
            Manage and track all your orders
          </p>
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
              </DialogHeader>
              <Tabs defaultValue="orders" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="orders">Import Orders</TabsTrigger>
                  <TabsTrigger value="dispatch">Bulk Dispatch</TabsTrigger>
                </TabsList>
                <TabsContent value="orders" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Upload a Shopify-format CSV file to import orders. All orders
                    will start with "Pending" status.
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
                    Upload a CSV with Order Number, Courier Name, and AWB Number
                    to bulk update dispatch status.
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
          placeholder="Search orders, customers..."
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
              if (order.status === "pending") {
                setDispatchModalOpen(true);
              }
            }}
            emptyMessage="No orders found"
          />
        </CardContent>
      </Card>

      <DispatchModal
        order={selectedOrder}
        open={dispatchModalOpen}
        onOpenChange={setDispatchModalOpen}
        onDispatch={(data) => {
          if (selectedOrder) {
            handleStatusUpdate(selectedOrder.id, "dispatched");
          }
          console.log("Dispatched:", data);
          setDispatchModalOpen(false);
        }}
      />
    </div>
  );
}
