import { DataTable } from "../DataTable";
import { StatusBadge } from "../StatusBadge";
import { mockOrders, type Order } from "@/lib/mockData";

export default function DataTableExample() {
  const columns = [
    { key: "orderNumber", header: "Order #", sortable: true },
    { key: "customerName", header: "Customer", sortable: true },
    { key: "totalAmount", header: "Amount", render: (order: Order) => `₹${order.totalAmount}` },
    { key: "status", header: "Status", render: (order: Order) => <StatusBadge status={order.status} /> },
  ];

  return (
    <DataTable
      data={mockOrders}
      columns={columns}
      selectable
      getRowId={(order) => order.id}
      onRowClick={(order) => console.log("Clicked order:", order.orderNumber)}
      onSelectionChange={(selected) => console.log("Selected:", selected.length)}
    />
  );
}
