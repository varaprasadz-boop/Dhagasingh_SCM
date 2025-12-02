import { InvoiceScannerView } from "@/components/InvoiceScannerView";

export default function MobileScan() {
  return (
    <div className="h-[calc(100vh-4rem)] pb-16">
      <InvoiceScannerView
        onConfirm={(data) => {
          console.log("Scan confirmed:", data);
        }}
        onCancel={() => {
          console.log("Scan cancelled");
        }}
      />
    </div>
  );
}
