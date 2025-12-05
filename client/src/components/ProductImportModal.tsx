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
  Package,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  parseCSV,
  parseShopifyProducts,
  validateProductImport,
  fileToCSVString,
  isExcelFile,
  type ShopifyProductRow,
  type ParsedProduct,
} from "@/lib/shopifyImport";

interface ProductImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportStep = "upload" | "preview" | "importing" | "complete";

export function ProductImportModal({ open, onOpenChange }: ProductImportModalProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [summary, setSummary] = useState({ totalRows: 0, productsFound: 0, variantsFound: 0 });
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: number;
    errorDetails: Array<{ handle: string; error: string }>;
  } | null>(null);

  const importMutation = useMutation({
    mutationFn: async (data: { csvData: string; fileName: string }) => {
      const response = await apiRequest("POST", "/api/products/import", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      setImportResult({
        imported: data.imported,
        errors: data.errors,
        errorDetails: data.errorDetails || [],
      });
      setStep("complete");
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      if (data.errors === 0) {
        toast({
          title: "Import Successful",
          description: `${data.imported} products imported successfully`,
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
        description: error.message || "Failed to import products",
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

    const { data: rows, errors: csvErrors } = await parseCSV<ShopifyProductRow>(selectedFile);
    
    if (csvErrors.length > 0) {
      setParseErrors(csvErrors);
    }

    const { products, errors: parseErrors, summary: parseSummary } = parseShopifyProducts(rows);
    
    const validationErrors = validateProductImport(products);
    const allErrors = [...csvErrors, ...parseErrors, ...validationErrors];
    
    setParseErrors(allErrors);
    setParsedProducts(products);
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
    setParsedProducts([]);
    setSummary({ totalRows: 0, productsFound: 0, variantsFound: 0 });
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
            <Package className="h-5 w-5" />
            Import Products from Shopify
          </DialogTitle>
          <DialogDescription>
            Upload a Shopify product export (CSV or Excel) to bulk import products with variants.
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
                data-testid="dropzone-product-import"
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  data-testid="input-product-csv"
                />
                <div className="flex flex-col items-center gap-3 text-center">
                  <Upload className={`h-12 w-12 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <p className="font-medium text-lg">Drag and drop your Shopify export file</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      CSV or Excel (.xlsx, .xls) formats supported. Max file size: 10MB
                    </p>
                  </div>
                </div>
              </Card>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Required columns:</strong> Handle, Title, Variant SKU, Variant Price.
                  <br />
                  <strong>Optional:</strong> Body (HTML), Type, Vendor, Cost per item, Variant Inventory Qty, Option1/2/3 Name & Value.
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
                      data-testid="button-remove-csv"
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
                  <p className="text-2xl font-bold text-primary" data-testid="text-products-found">{summary.productsFound}</p>
                  <p className="text-sm text-muted-foreground">Products Found</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary" data-testid="text-variants-found">{summary.variantsFound}</p>
                  <p className="text-sm text-muted-foreground">Variants Found</p>
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
                <h4 className="font-medium mb-2">Preview ({Math.min(parsedProducts.length, 10)} of {parsedProducts.length} products)</h4>
                <ScrollArea className="h-64 border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Handle</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Variants</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedProducts.slice(0, 10).map((product, i) => (
                        <TableRow key={i} data-testid={`row-product-preview-${i}`}>
                          <TableCell className="font-mono text-sm">{product.handle}</TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.category || "-"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {product.variants.slice(0, 3).map((v, j) => (
                                <Badge key={j} variant="outline" className="text-xs">
                                  {v.sku} {v.color && `(${v.color})`}
                                </Badge>
                              ))}
                              {product.variants.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{product.variants.length - 3}
                                </Badge>
                              )}
                            </div>
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
              <p className="text-lg font-medium">Importing products...</p>
              <p className="text-sm text-muted-foreground">
                Please wait while we process {parsedProducts.length} products.
              </p>
            </div>
          )}

          {step === "complete" && importResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8 gap-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
                <div className="text-center">
                  <p className="text-2xl font-bold">{importResult.imported} Products Imported</p>
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
                            <span className="font-mono">{err.handle}</span>: {err.error}
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
            <Button variant="outline" onClick={handleClose} data-testid="button-cancel-import">
              Cancel
            </Button>
          )}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={resetModal} data-testid="button-back">
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={parsedProducts.length === 0}
                data-testid="button-confirm-import"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Import {parsedProducts.length} Products
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
            <Button onClick={handleClose} data-testid="button-close-import">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
