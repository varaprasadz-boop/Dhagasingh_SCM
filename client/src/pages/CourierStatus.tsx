import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/DataTable";
import { SearchInput } from "@/components/SearchInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  Truck,
  RefreshCw,
  Download,
  History,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { parseCSV, isExcelFile } from "@/lib/shopifyImport";
import type { Order, OrderStatusHistory } from "@shared/schema";

const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-500" },
  { value: "dispatched", label: "Dispatched", color: "bg-blue-500" },
  { value: "delivered", label: "Delivered", color: "bg-green-500" },
  { value: "rto", label: "RTO", color: "bg-orange-500" },
  { value: "returned", label: "Returned", color: "bg-purple-500" },
  { value: "refunded", label: "Refunded", color: "bg-pink-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
];

interface BulkUpdateRow {
  orderNumber: string;
  awbNumber?: string;
  newStatus: string;
}

interface UpdateResult {
  successful: number;
  failed: number;
  errors: Array<{ orderNumber: string; error: string }>;
  updatedOrders: Array<{ orderNumber: string; orderId: string; status: string }>;
}

type ImportStep = "upload" | "preview" | "importing" | "complete";

export default function CourierStatus() {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("bulk-update");
  
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<BulkUpdateRow[]>([]);
  const [importResult, setImportResult] = useState<UpdateResult | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: orderHistory = [] } = useQuery<any[]>({
    queryKey: ["/api/orders", selectedOrder?.id, "history"],
    enabled: !!selectedOrder,
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates: BulkUpdateRow[]) => {
      const res = await apiRequest("POST", "/api/orders/bulk-status", { updates });
      return res.json();
    },
    onSuccess: (data: UpdateResult) => {
      setImportResult(data);
      setStep("complete");
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      if (data.failed === 0) {
        toast({
          title: "Update Successful",
          description: `${data.successful} orders updated successfully`,
        });
      } else {
        toast({
          title: "Update Completed with Errors",
          description: `${data.successful} updated, ${data.failed} failed`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update order statuses",
        variant: "destructive",
      });
      setStep("preview");
    },
  });

  const recentlyUpdatedOrders = orders
    .filter((o) => o.status !== "pending")
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
    .slice(0, 50);

  const filteredOrders = searchQuery
    ? recentlyUpdatedOrders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (o.awbNumber && o.awbNumber.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : recentlyUpdatedOrders;

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return;
    }

    const isExcel = isExcelFile(selectedFile);
    const isCSV = selectedFile.name.toLowerCase().endsWith('.csv');
    
    if (!isExcel && !isCSV) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    
    try {
      interface StatusRow {
        orderNumber?: string;
        ordernumber?: string;
        OrderNumber?: string;
        order_number?: string;
        awbNumber?: string;
        awbnumber?: string;
        AWBNumber?: string;
        awb?: string;
        tracking?: string;
        newStatus?: string;
        newstatus?: string;
        NewStatus?: string;
        status?: string;
        Status?: string;
        [key: string]: string | undefined;
      }

      const { data, errors: parseErrs } = await parseCSV<StatusRow>(selectedFile);
      
      if (parseErrs.length > 0) {
        setParseErrors(parseErrs);
      }

      if (data.length === 0) {
        setParseErrors(["File must have at least one data row"]);
        return;
      }

      const parsed: BulkUpdateRow[] = [];
      const errors: string[] = [...parseErrs];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        const orderNumber = row.orderNumber || row.ordernumber || row.OrderNumber || row.order_number || 
          Object.entries(row).find(([k]) => k.toLowerCase().includes('order') && k.toLowerCase().includes('number'))?.[1];
        
        const rawStatus = row.newStatus || row.newstatus || row.NewStatus || row.status || row.Status ||
          Object.entries(row).find(([k]) => k.toLowerCase().includes('status'))?.[1];
        
        const awbNumber = row.awbNumber || row.awbnumber || row.AWBNumber || row.awb || row.tracking ||
          Object.entries(row).find(([k]) => k.toLowerCase().includes('awb') || k.toLowerCase().includes('tracking'))?.[1];

        if (!orderNumber) {
          errors.push(`Row ${i + 2}: Missing order number`);
          continue;
        }

        const newStatus = rawStatus?.toLowerCase().replace(/\s+/g, "_");
        if (!newStatus || !ORDER_STATUSES.some((s) => s.value === newStatus)) {
          errors.push(`Row ${i + 2}: Invalid status "${rawStatus}". Valid: ${ORDER_STATUSES.map((s) => s.value).join(", ")}`);
          continue;
        }

        parsed.push({ orderNumber, awbNumber: awbNumber || undefined, newStatus });
      }

      if (errors.length > 0 && parsed.length === 0) {
        setParseErrors(errors);
        return;
      }

      setParseErrors(errors);
      setParsedRows(parsed);
      setStep("preview");
    } catch (error: any) {
      setParseErrors([`Failed to parse file: ${error.message}`]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    const fileName = droppedFile?.name.toLowerCase() || "";
    const isValidFile = fileName.endsWith(".csv") || 
                        fileName.endsWith(".xlsx") || 
                        fileName.endsWith(".xls") ||
                        droppedFile?.type === "text/csv";
    if (droppedFile && isValidFile) {
      handleFile(droppedFile);
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = () => {
    if (parsedRows.length === 0) return;
    setStep("importing");
    bulkUpdateMutation.mutate(parsedRows);
  };

  const resetUpload = () => {
    setStep("upload");
    setFile(null);
    setParseErrors([]);
    setParsedRows([]);
    setImportResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const downloadTemplate = () => {
    const template = "orderNumber,awbNumber,newStatus\n#12001,,dispatched\n#12002,AWB123456,delivered\n#12003,,rto";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "courier_status_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const viewOrderHistory = (order: Order) => {
    setSelectedOrder(order);
    setHistoryDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = ORDER_STATUSES.find((s) => s.value === status);
    return (
      <Badge
        variant="outline"
        className={`${statusConfig?.color || "bg-gray-500"} text-white border-0`}
      >
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const orderColumns = [
    {
      header: "Order",
      accessorKey: "orderNumber",
      cell: (row: Order) => (
        <span className="font-mono font-medium">{row.orderNumber}</span>
      ),
    },
    {
      header: "AWB",
      accessorKey: "awbNumber",
      cell: (row: Order) => (
        <span className="font-mono text-muted-foreground">
          {row.awbNumber || "-"}
        </span>
      ),
    },
    {
      header: "Customer",
      accessorKey: "customerName",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: Order) => getStatusBadge(row.status),
    },
    {
      header: "Updated",
      accessorKey: "updatedAt",
      cell: (row: Order) => (
        <span className="text-muted-foreground text-sm">
          {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "-"}
        </span>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (row: Order) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => viewOrderHistory(row)}
          data-testid={`button-view-history-${row.orderNumber}`}
        >
          <History className="h-4 w-4 mr-1" />
          History
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Courier Status Center</h1>
          <p className="text-muted-foreground">
            Bulk update order statuses and track courier updates
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="bulk-update" data-testid="tab-bulk-update">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Update
          </TabsTrigger>
          <TabsTrigger value="recent-updates" data-testid="tab-recent-updates">
            <RefreshCw className="h-4 w-4 mr-2" />
            Recent Updates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bulk-update" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bulk Status Update</CardTitle>
                  <CardDescription>
                    Upload a CSV file to update multiple order statuses at once
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate} data-testid="button-download-template">
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {step === "upload" && (
                <div className="space-y-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">
                      Drop your CSV or Excel file here or click to browse
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Required columns: orderNumber, newStatus | Optional: awbNumber
                    </p>
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                      data-testid="input-file-upload"
                    />
                    <Button onClick={() => inputRef.current?.click()} data-testid="button-browse-files">
                      <Upload className="h-4 w-4 mr-2" />
                      Select CSV File
                    </Button>
                  </div>

                  {parseErrors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc pl-4 space-y-1">
                          {parseErrors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">CSV Format</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Your CSV file should have the following columns:
                    </p>
                    <pre className="text-xs bg-muted p-2 rounded font-mono">
                      orderNumber,awbNumber,newStatus{"\n"}
                      #12001,,dispatched{"\n"}
                      #12002,AWB123456,delivered{"\n"}
                      #12003,,rto
                    </pre>
                    <p className="text-xs text-muted-foreground mt-2">
                      Valid statuses: pending, dispatched, delivered, rto, returned, refunded, cancelled
                    </p>
                  </div>
                </div>
              )}

              {step === "preview" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{file?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {parsedRows.length} orders to update
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={resetUpload}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {parseErrors.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {parseErrors.length} rows skipped due to errors. Valid rows will be processed.
                      </AlertDescription>
                    </Alert>
                  )}

                  <ScrollArea className="h-[300px] border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order Number</TableHead>
                          <TableHead>AWB Number</TableHead>
                          <TableHead>New Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedRows.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono">{row.orderNumber}</TableCell>
                            <TableCell className="font-mono text-muted-foreground">
                              {row.awbNumber || "-"}
                            </TableCell>
                            <TableCell>{getStatusBadge(row.newStatus)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={resetUpload} data-testid="button-cancel-import">
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} data-testid="button-process-update">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Update {parsedRows.length} Orders
                    </Button>
                  </div>
                </div>
              )}

              {step === "importing" && (
                <div className="py-12 text-center">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                  <h3 className="text-lg font-medium mb-2">Updating Orders...</h3>
                  <p className="text-muted-foreground">
                    Processing {parsedRows.length} orders. Please wait.
                  </p>
                </div>
              )}

              {step === "complete" && importResult && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    {importResult.failed === 0 ? (
                      <CheckCircle2 className="h-10 w-10 text-green-500" />
                    ) : (
                      <AlertCircle className="h-10 w-10 text-orange-500" />
                    )}
                    <div>
                      <h3 className="text-lg font-medium">Update Complete</h3>
                      <p className="text-muted-foreground">
                        {importResult.successful} orders updated successfully
                        {importResult.failed > 0 && `, ${importResult.failed} failed`}
                      </p>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-destructive">Errors:</h4>
                      <ScrollArea className="h-[150px] border border-destructive/20 rounded-md p-2">
                        {importResult.errors.map((err, idx) => (
                          <div key={idx} className="text-sm py-1 border-b last:border-0">
                            <span className="font-mono">{err.orderNumber}</span>:{" "}
                            <span className="text-muted-foreground">{err.error}</span>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                  )}

                  {importResult.updatedOrders.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-600">Updated Orders:</h4>
                      <ScrollArea className="h-[150px] border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order</TableHead>
                              <TableHead>New Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {importResult.updatedOrders.map((order, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-mono">{order.orderNumber}</TableCell>
                                <TableCell>{getStatusBadge(order.status)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  )}

                  <Button onClick={resetUpload} className="w-full" data-testid="button-new-upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Another File
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent-updates" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Recent Status Updates</CardTitle>
                  <CardDescription>
                    Orders with recent status changes
                  </CardDescription>
                </div>
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by order or AWB..."
                  className="w-64"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent status updates found</p>
                </div>
              ) : (
                <DataTable
                  data={filteredOrders}
                  columns={orderColumns}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Status History</DialogTitle>
            <DialogDescription>
              Order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px]">
            {orderHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No history available
              </div>
            ) : (
              <div className="space-y-4">
                {orderHistory.map((entry: any, idx: number) => (
                  <div key={idx} className="flex gap-3 pb-4 border-b last:border-0">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(entry.order_status_history?.status || entry.status)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.order_status_history?.createdAt || entry.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {(entry.order_status_history?.comment || entry.comment) && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {entry.order_status_history?.comment || entry.comment}
                        </p>
                      )}
                      {(entry.users?.fullName || entry.changedByName) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          by {entry.users?.fullName || entry.changedByName}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
