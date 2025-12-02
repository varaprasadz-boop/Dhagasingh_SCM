import { KPICard } from "../KPICard";
import { Package, ShoppingCart, Truck, AlertCircle } from "lucide-react";

export default function KPICardExample() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Total Inventory"
        value="600"
        icon={Package}
        trend={{ value: 12, positive: true }}
      />
      <KPICard
        title="Pending Orders"
        value="12"
        icon={ShoppingCart}
        subtitle="3 high priority"
      />
      <KPICard
        title="Dispatched"
        value="45"
        icon={Truck}
        trend={{ value: 8, positive: true }}
      />
      <KPICard
        title="Open Complaints"
        value="5"
        icon={AlertCircle}
        trend={{ value: 2, positive: false }}
      />
    </div>
  );
}
