import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, CheckCircle2, Edit2, Loader2, X } from "lucide-react";
import { mockSuppliers } from "@/lib/mockData";

interface ExtractedItem {
  sku: string;
  productName: string;
  quantity: number;
  costPrice: number;
}

interface InvoiceScannerViewProps {
  onConfirm?: (data: { supplierId: string; items: ExtractedItem[] }) => void;
  onCancel?: () => void;
}

export function InvoiceScannerView({ onConfirm, onCancel }: InvoiceScannerViewProps) {
  const [step, setStep] = useState<"capture" | "review" | "confirm">("capture");
  const [isScanning, setIsScanning] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([
    { sku: "TSH-RED-M", productName: "Classic T-Shirt Red M", quantity: 50, costPrice: 200 },
    { sku: "TSH-BLU-L", productName: "Classic T-Shirt Blue L", quantity: 30, costPrice: 200 },
    { sku: "JNS-BLK-32", productName: "Denim Jeans Black 32", quantity: 25, costPrice: 500 },
  ]);

  const handleCapture = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setStep("review");
    }, 2000);
  };

  const handleUpdateItem = (index: number, field: keyof ExtractedItem, value: string | number) => {
    setExtractedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemoveItem = (index: number) => {
    setExtractedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (!supplierId) return;
    onConfirm?.({ supplierId, items: extractedItems });
    setStep("confirm");
  };

  if (step === "confirm") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-semibold">Stock Updated Successfully</h2>
        <p className="text-muted-foreground text-center">
          {extractedItems.reduce((sum, item) => sum + item.quantity, 0)} units added across {extractedItems.length} SKUs
        </p>
        <Button onClick={() => { setStep("capture"); setExtractedItems([]); }} data-testid="button-scan-another">
          Scan Another Invoice
        </Button>
      </div>
    );
  }

  if (step === "capture") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 relative bg-black/90 flex items-center justify-center">
          <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-lg" />
          <div className="text-center text-white z-10">
            {isScanning ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-12 w-12 animate-spin" />
                <p>Scanning invoice...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Camera className="h-12 w-12" />
                <p>Position invoice within the frame</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4 bg-background">
          <p className="text-sm text-muted-foreground text-center">
            AI-powered OCR will extract product details automatically
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onCancel} data-testid="button-cancel-scan">
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleCapture} disabled={isScanning} data-testid="button-capture">
              <Camera className="h-4 w-4 mr-2" />
              Capture
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Review Extracted Data</h2>
        <p className="text-sm text-muted-foreground">Verify and edit before confirming</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <Label>Supplier</Label>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger data-testid="select-supplier-scan">
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {mockSuppliers.filter((s) => s.status === "active").map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Extracted Items ({extractedItems.length})</Label>
          {extractedItems.map((item, index) => (
            <Card key={index} data-testid={`card-extracted-${index}`}>
              <CardContent className="p-3">
                {editingIndex === index ? (
                  <div className="space-y-2">
                    <Input
                      value={item.sku}
                      onChange={(e) => handleUpdateItem(index, "sku", e.target.value)}
                      placeholder="SKU"
                      data-testid={`input-edit-sku-${index}`}
                    />
                    <Input
                      value={item.productName}
                      onChange={(e) => handleUpdateItem(index, "productName", e.target.value)}
                      placeholder="Product Name"
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(index, "quantity", parseInt(e.target.value) || 0)}
                        placeholder="Qty"
                      />
                      <Input
                        type="number"
                        value={item.costPrice}
                        onChange={(e) => handleUpdateItem(index, "costPrice", parseFloat(e.target.value) || 0)}
                        placeholder="Cost"
                      />
                    </div>
                    <Button size="sm" onClick={() => setEditingIndex(null)}>Done</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm">{item.sku}</p>
                      <p className="text-sm text-muted-foreground truncate">{item.productName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">×{item.quantity}</p>
                      <p className="text-sm text-muted-foreground">₹{item.costPrice}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditingIndex(index)} data-testid={`button-edit-${index}`}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} data-testid={`button-remove-${index}`}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-muted/50">
          <CardContent className="p-3">
            <div className="flex justify-between text-sm">
              <span>Total Items:</span>
              <span className="font-semibold">{extractedItems.length} SKUs</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Units:</span>
              <span className="font-semibold">{extractedItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Value:</span>
              <span className="font-semibold">
                ₹{extractedItems.reduce((sum, item) => sum + item.quantity * item.costPrice, 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 border-t flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setStep("capture")} data-testid="button-rescan">
          Re-scan
        </Button>
        <Button className="flex-1" onClick={handleConfirm} disabled={!supplierId || extractedItems.length === 0} data-testid="button-confirm-scan">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Confirm & Add Stock
        </Button>
      </div>
    </div>
  );
}
