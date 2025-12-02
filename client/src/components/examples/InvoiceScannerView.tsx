import { InvoiceScannerView } from "../InvoiceScannerView";

export default function InvoiceScannerViewExample() {
  return (
    <div className="h-[500px] border rounded-lg overflow-hidden">
      <InvoiceScannerView
        onConfirm={(data) => console.log("Confirmed:", data)}
        onCancel={() => console.log("Cancelled")}
      />
    </div>
  );
}
