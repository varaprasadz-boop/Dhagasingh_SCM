import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  parseCSV,
  parseShopifyOrders,
  validateOrderImport,
  fileToCSVString,
  isExcelFile,
  type ShopifyOrderRow,
  type ParsedOrder,
} from "@/lib/shopifyImport";

interface OrderImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportStep = "upload" | "preview" | "importing" | "complete";

export function OrderImportModal({ open, onOpenChange }: OrderImportModalProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parsedOrders, setParsedOrders] = useState<ParsedOrder[]>([]);
  const [summary, setSummary] = useState({ totalRows: 0, ordersFound: 0, lineItemsFound: 0 });
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: number;
    errorDetails: Array<{ orderNumber: string; error: string }>;
  } | null>(null);

  const importMutation = useMutation({
    mutationFn: async (data: { csvData: string; fileName: string }) => {
      const response = await apiRequest("POST", "/api/orders/import", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      setImportResult({
        imported: data.imported,
        errors: data.errors,
        errorDetails: data.errorDetails || [],
      });
      setStep("complete");
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      if (data.errors === 0) {
        toast({
          title: "Import Successful",
          description: `${data.imported} orders imported successfully`,
        });
      } else {
        toast({
          title: "Import Completed with Errors",
          description: `${data.imported} imported, ${data.errors} failed`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import orders",
        variant: "destructive",
      });
      setStep("preview");
    },
  });

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);

    const text = await fileToCSVString(selectedFile);
    setCsvData(text);

    const { data: rows, errors: csvErrors } = await parseCSV<ShopifyOrderRow>(selectedFile);
    
    if (csvErrors.length > 0) {
      setParseErrors(csvErrors);
    }

    const { orders, errors: parseErrors, summary: parseSummary } = parseShopifyOrders(rows);
    
    const validationErrors = validateOrderImport(orders);
    const allErrors = [...csvErrors, ...parseErrors, ...validationErrors];
    
    setParseErrors(allErrors);
    setParsedOrders(orders);
    setSummary(parseSummary);
    setStep("preview");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const name = droppedFile.name.toLowerCase();
      if (name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls")) {
        handleFile(droppedFile);
      }
    }
  };

  const handleImport = () => {
    if (!csvData || !file) return;
    setStep("importing");
    importMutation.mutate({ csvData, fileName: file.name });
  };

  const resetModal = () => {
    setStep("upload");
    setFile(null);
    setCsvData("");
    setParseErrors([]);
    setParsedOrders([]);
    setSummary({ totalRows: 0, ordersFound: 0, lineItemsFound: 0 });
    setImportResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Import Orders from Shopify
          </DialogTitle>
          <DialogDescription>
            Upload a Shopify orders export (CSV or Excel) to bulk import orders with line items.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-4">
          {step === "upload" && (
            <div className="space-y-4">
              <Card
                className={`border-2 border-dashed p-8 transition-colors cursor-pointer ${
                  isDragging ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                data-testid="dropzone-order-import"
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  data-testid="input-order-csv"
                />
                <div className="flex flex-col items-center gap-3 text-center">
                  <Upload className={`h-12 w-12 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <p className="font-medium text-lg">Drag and drop your Shopify Orders export file</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      CSV or Excel (.xlsx, .xls) formats supported. Max file size: 10MB
                    </p>
                  </div>
                </div>
              </Card>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Required columns:</strong> Name, Total, Shipping Name.
                  <br />
                  <strong>Optional:</strong> Email, Financial Status, Fulfillment Status, Shipping Address fields, Lineitem name/sku/quantity/price.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              {file && (
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={resetModal}
                      data-testid="button-remove-order-csv"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <p className="text-2xl font-bold" data-testid="text-total-rows">{summary.totalRows}</p>
                  <p className="text-sm text-muted-foreground">Total Rows</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary" data-testid="text-orders-found">{summary.ordersFound}</p>
                  <p className="text-sm text-muted-foreground">Orders Found</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary" data-testid="text-line-items-found">{summary.lineItemsFound}</p>
                  <p className="text-sm text-muted-foreground">Line Items</p>
                </Card>
              </div>

              {parseErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">{parseErrors.length} validation issue(s) found:</p>
                    <ScrollArea className="max-h-24">
                      <ul className="text-sm list-disc list-inside space-y-1">
                        {parseErrors.slice(0, 10).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                        {parseErrors.length > 10 && (
                          <li>...and {parseErrors.length - 10} more</li>
                        )}
                      </ul>
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <h4 className="font-medium mb-2">Preview ({Math.min(parsedOrders.length, 10)} of {parsedOrders.length} orders)</h4>
                <ScrollArea className="h-64 border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Items</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedOrders.slice(0, 10).map((order, i) => (
                        <TableRow key={i} data-testid={`row-order-preview-${i}`}>
                          <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.customerName}</p>
                              <p className="text-xs text-muted-foreground">{order.customerEmail || "-"}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">₹{parseFloat(order.totalAmount).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={order.paymentMethod === "prepaid" ? "default" : "secondary"}>
                              {order.paymentMethod.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.lineItems.length} items</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          )}

          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Importing orders...</p>
              <p className="text-sm text-muted-foreground">
                Please wait while we process {parsedOrders.length} orders.
              </p>
            </div>
          )}

          {step === "complete" && importResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8 gap-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
                <div className="text-center">
                  <p className="text-2xl font-bold">{importResult.imported} Orders Imported</p>
                  {importResult.errors > 0 && (
                    <p className="text-destructive">{importResult.errors} failed</p>
                  )}
                </div>
              </div>

              {importResult.errorDetails.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Import errors:</p>
                    <ScrollArea className="max-h-32">
                      <ul className="text-sm list-disc list-inside space-y-1">
                        {importResult.errorDetails.map((err, i) => (
                          <li key={i}>
                            <span className="font-mono">{err.orderNumber}</span>: {err.error}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <Separator />

        <DialogFooter className="gap-2">
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose} data-testid="button-cancel-order-import">
              Cancel
            </Button>
          )}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={resetModal} data-testid="button-back-order">
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={parsedOrders.length === 0}
                data-testid="button-confirm-order-import"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Import {parsedOrders.length} Orders
              </Button>
            </>
          )}

          {step === "importing" && (
            <Button disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importing...
            </Button>
          )}

          {step === "complete" && (
            <Button onClick={handleClose} data-testid="button-close-order-import">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
