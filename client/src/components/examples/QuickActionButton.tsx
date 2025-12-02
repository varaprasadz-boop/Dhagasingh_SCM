import { QuickActionButton } from "../QuickActionButton";
import { PackagePlus, Truck, Camera, FileUp } from "lucide-react";

export default function QuickActionButtonExample() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <QuickActionButton
        icon={PackagePlus}
        label="Receive Stock"
        description="Add inventory"
        onClick={() => console.log("Receive stock")}
      />
      <QuickActionButton
        icon={Truck}
        label="Dispatch Order"
        description="Ship pending"
        onClick={() => console.log("Dispatch")}
      />
      <QuickActionButton
        icon={Camera}
        label="Scan Invoice"
        description="OCR capture"
        onClick={() => console.log("Scan")}
      />
      <QuickActionButton
        icon={FileUp}
        label="Import Orders"
        description="CSV upload"
        onClick={() => console.log("Import")}
      />
    </div>
  );
}
