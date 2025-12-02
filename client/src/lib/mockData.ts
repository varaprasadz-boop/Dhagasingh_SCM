export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
  gstNumber?: string;
  status: "active" | "inactive";
}

export interface CourierPartner {
  id: string;
  name: string;
  type: "third_party" | "in_house";
  contactPerson: string;
  phone: string;
  apiEnabled: boolean;
  apiKey?: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  color: string;
  size: string;
  stockQuantity: number;
  costPrice: number;
  sellingPrice: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  variants: ProductVariant[];
}

export type OrderStatus = "pending" | "dispatched" | "delivered" | "rto" | "returned" | "refunded";
export type PaymentMethod = "prepaid" | "cod";
export type InternalDeliveryStatus = "assigned" | "out_for_delivery" | "delivered" | "payment_collected" | "rto";
export type PaymentCollectionMethod = "cash" | "qr" | "none";

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: { sku: string; productName: string; color: string; size: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: "pending" | "paid" | "refunded";
  status: OrderStatus;
  courierPartner?: string;
  courierType?: "third_party" | "in_house";
  awbNumber?: string;
  assignedTo?: string;
  dispatchDate?: string;
  deliveryCost?: number;
  createdAt: string;
}

export interface ComplaintTimelineEntry {
  id: string;
  action: string;
  comment: string;
  employeeName: string;
  employeeRole: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  reason: "wrong_item" | "damaged" | "late_delivery" | "size_issue" | "quality_issue" | "other";
  description: string;
  status: "open" | "in_progress" | "resolved" | "rejected";
  resolution?: "refund" | "replacement" | "rejected";
  refundAmount?: number;
  timeline: ComplaintTimelineEntry[];
  createdAt: string;
}

export interface StockMovement {
  id: string;
  type: "inward" | "outward";
  sku: string;
  productName: string;
  quantity: number;
  supplierId?: string;
  orderId?: string;
  costPrice?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  createdAt: string;
}

export interface InternalDelivery {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  assignedTo: string;
  assignedToPhone: string;
  status: InternalDeliveryStatus;
  paymentCollected?: PaymentCollectionMethod;
  collectedAmount?: number;
  assignedAt: string;
  deliveredAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "warehouse" | "customer_support" | "stock_management";
  status: "active" | "inactive";
  createdAt: string;
}

export const mockSuppliers: Supplier[] = [
  { id: "1", name: "ABC Textiles", email: "contact@abctextiles.com", phone: "+91 98765 43210", alternatePhone: "+91 98765 43211", address: "123 Industrial Area, Mumbai", gstNumber: "27AABCT1234F1ZP", status: "active" },
  { id: "2", name: "XYZ Garments", email: "info@xyzgarments.com", phone: "+91 87654 32109", address: "456 Manufacturing Hub, Delhi", gstNumber: "07AABCX5678G1ZQ", status: "active" },
  { id: "3", name: "PQR Fabrics", email: "sales@pqrfabrics.com", phone: "+91 76543 21098", address: "789 Textile Park, Surat", status: "inactive" },
];

export const mockCouriers: CourierPartner[] = [
  { id: "1", name: "Delhivery", type: "third_party", contactPerson: "Support Team", phone: "1800-123-4567", apiEnabled: true },
  { id: "2", name: "BlueDart", type: "third_party", contactPerson: "Customer Care", phone: "1800-233-1234", apiEnabled: true },
  { id: "3", name: "Local Delivery", type: "in_house", contactPerson: "Ramesh Kumar", phone: "+91 98765 12345", apiEnabled: false },
  { id: "4", name: "Express Local", type: "in_house", contactPerson: "Suresh Patel", phone: "+91 87654 23456", apiEnabled: false },
];

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Classic T-Shirt",
    description: "Premium cotton t-shirt",
    category: "Apparel",
    variants: [
      { id: "1-1", sku: "TSH-RED-S", color: "Red", size: "S", stockQuantity: 50, costPrice: 200, sellingPrice: 499 },
      { id: "1-2", sku: "TSH-RED-M", color: "Red", size: "M", stockQuantity: 75, costPrice: 200, sellingPrice: 499 },
      { id: "1-3", sku: "TSH-RED-L", color: "Red", size: "L", stockQuantity: 30, costPrice: 200, sellingPrice: 499 },
      { id: "1-4", sku: "TSH-BLU-S", color: "Blue", size: "S", stockQuantity: 45, costPrice: 200, sellingPrice: 499 },
      { id: "1-5", sku: "TSH-BLU-M", color: "Blue", size: "M", stockQuantity: 60, costPrice: 200, sellingPrice: 499 },
      { id: "1-6", sku: "TSH-BLU-L", color: "Blue", size: "L", stockQuantity: 25, costPrice: 200, sellingPrice: 499 },
    ],
  },
  {
    id: "2",
    name: "Denim Jeans",
    description: "Slim fit denim jeans",
    category: "Apparel",
    variants: [
      { id: "2-1", sku: "JNS-BLK-30", color: "Black", size: "30", stockQuantity: 40, costPrice: 500, sellingPrice: 1299 },
      { id: "2-2", sku: "JNS-BLK-32", color: "Black", size: "32", stockQuantity: 55, costPrice: 500, sellingPrice: 1299 },
      { id: "2-3", sku: "JNS-BLK-34", color: "Black", size: "34", stockQuantity: 35, costPrice: 500, sellingPrice: 1299 },
      { id: "2-4", sku: "JNS-BLU-30", color: "Blue", size: "30", stockQuantity: 50, costPrice: 500, sellingPrice: 1299 },
      { id: "2-5", sku: "JNS-BLU-32", color: "Blue", size: "32", stockQuantity: 65, costPrice: 500, sellingPrice: 1299 },
    ],
  },
  {
    id: "3",
    name: "Casual Shirt",
    description: "Cotton casual shirt",
    category: "Apparel",
    variants: [
      { id: "3-1", sku: "SHT-WHT-S", color: "White", size: "S", stockQuantity: 20, costPrice: 350, sellingPrice: 899 },
      { id: "3-2", sku: "SHT-WHT-M", color: "White", size: "M", stockQuantity: 35, costPrice: 350, sellingPrice: 899 },
      { id: "3-3", sku: "SHT-WHT-L", color: "White", size: "L", stockQuantity: 15, costPrice: 350, sellingPrice: 899 },
    ],
  },
];

export const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-2024-001",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    customerPhone: "+91 98765 11111",
    shippingAddress: "123 Main Street, Apartment 4B, Mumbai 400001",
    items: [{ sku: "TSH-RED-M", productName: "Classic T-Shirt", color: "Red", size: "M", quantity: 2, price: 499 }],
    totalAmount: 998,
    paymentMethod: "prepaid",
    paymentStatus: "paid",
    status: "pending",
    createdAt: "2024-12-01T10:30:00Z",
  },
  {
    id: "2",
    orderNumber: "ORD-2024-002",
    customerName: "Jane Smith",
    customerEmail: "jane@example.com",
    customerPhone: "+91 87654 22222",
    shippingAddress: "456 Park Avenue, Delhi 110001",
    items: [
      { sku: "JNS-BLK-32", productName: "Denim Jeans", color: "Black", size: "32", quantity: 1, price: 1299 },
      { sku: "TSH-BLU-L", productName: "Classic T-Shirt", color: "Blue", size: "L", quantity: 1, price: 499 },
    ],
    totalAmount: 1798,
    paymentMethod: "cod",
    paymentStatus: "pending",
    status: "dispatched",
    courierPartner: "Delhivery",
    courierType: "third_party",
    awbNumber: "DL12345678",
    dispatchDate: "2024-12-01T14:00:00Z",
    createdAt: "2024-12-01T11:45:00Z",
  },
  {
    id: "3",
    orderNumber: "ORD-2024-003",
    customerName: "Rahul Kumar",
    customerEmail: "rahul@example.com",
    customerPhone: "+91 76543 33333",
    shippingAddress: "789 Gandhi Road, Bangalore 560001",
    items: [{ sku: "SHT-WHT-M", productName: "Casual Shirt", color: "White", size: "M", quantity: 1, price: 899 }],
    totalAmount: 899,
    paymentMethod: "prepaid",
    paymentStatus: "paid",
    status: "delivered",
    courierPartner: "BlueDart",
    courierType: "third_party",
    awbNumber: "BD98765432",
    dispatchDate: "2024-11-28T10:00:00Z",
    createdAt: "2024-11-28T09:15:00Z",
  },
  {
    id: "4",
    orderNumber: "ORD-2024-004",
    customerName: "Priya Sharma",
    customerEmail: "priya@example.com",
    customerPhone: "+91 65432 44444",
    shippingAddress: "321 Lake View, Chennai 600001",
    items: [{ sku: "TSH-RED-S", productName: "Classic T-Shirt", color: "Red", size: "S", quantity: 3, price: 499 }],
    totalAmount: 1497,
    paymentMethod: "cod",
    paymentStatus: "pending",
    status: "rto",
    courierPartner: "Local Delivery",
    courierType: "in_house",
    assignedTo: "Ramesh Kumar",
    deliveryCost: 50,
    createdAt: "2024-11-29T14:20:00Z",
  },
  {
    id: "5",
    orderNumber: "ORD-2024-005",
    customerName: "Amit Verma",
    customerEmail: "amit@example.com",
    customerPhone: "+91 54321 55555",
    shippingAddress: "555 Tech Park, Hyderabad 500081",
    items: [{ sku: "JNS-BLU-30", productName: "Denim Jeans", color: "Blue", size: "30", quantity: 1, price: 1299 }],
    totalAmount: 1299,
    paymentMethod: "prepaid",
    paymentStatus: "paid",
    status: "pending",
    createdAt: "2024-12-02T08:00:00Z",
  },
];

export const mockComplaints: Complaint[] = [
  {
    id: "1",
    ticketNumber: "TKT-001",
    orderId: "3",
    orderNumber: "ORD-2024-003",
    customerName: "Rahul Kumar",
    reason: "wrong_item",
    description: "Received blue shirt instead of white",
    status: "open",
    timeline: [
      { id: "1-1", action: "Ticket Created", comment: "Customer reported receiving wrong color shirt", employeeName: "System", employeeRole: "Auto", createdAt: "2024-12-01T16:00:00Z" },
    ],
    createdAt: "2024-12-01T16:00:00Z",
  },
  {
    id: "2",
    ticketNumber: "TKT-002",
    orderId: "2",
    orderNumber: "ORD-2024-002",
    customerName: "Jane Smith",
    reason: "damaged",
    description: "Package arrived with torn packaging, jeans have a stain",
    status: "in_progress",
    timeline: [
      { id: "2-1", action: "Ticket Created", comment: "Customer reported damaged product on arrival", employeeName: "System", employeeRole: "Auto", createdAt: "2024-12-01T12:30:00Z" },
      { id: "2-2", action: "Assigned", comment: "Ticket assigned for investigation", employeeName: "Priya Patel", employeeRole: "Customer Support", createdAt: "2024-12-01T13:00:00Z" },
      { id: "2-3", action: "Investigation", comment: "Requested photos from customer, awaiting response", employeeName: "Priya Patel", employeeRole: "Customer Support", createdAt: "2024-12-01T14:30:00Z" },
    ],
    createdAt: "2024-12-01T12:30:00Z",
  },
  {
    id: "3",
    ticketNumber: "TKT-003",
    orderId: "4",
    orderNumber: "ORD-2024-004",
    customerName: "Priya Sharma",
    reason: "late_delivery",
    description: "Order was supposed to be delivered in 3 days but took 7 days",
    status: "resolved",
    resolution: "refund",
    refundAmount: 100,
    timeline: [
      { id: "3-1", action: "Ticket Created", comment: "Customer complained about delivery delay", employeeName: "System", employeeRole: "Auto", createdAt: "2024-11-30T10:00:00Z" },
      { id: "3-2", action: "Assigned", comment: "Escalated to logistics team", employeeName: "Raj Kumar", employeeRole: "Customer Support", createdAt: "2024-11-30T11:00:00Z" },
      { id: "3-3", action: "Investigation", comment: "Confirmed delay due to courier issues. Approved partial refund.", employeeName: "Anita Desai", employeeRole: "Admin", createdAt: "2024-11-30T15:00:00Z" },
      { id: "3-4", action: "Resolved", comment: "Refund of Rs. 100 processed to customer account", employeeName: "Anita Desai", employeeRole: "Admin", createdAt: "2024-11-30T16:00:00Z" },
    ],
    createdAt: "2024-11-30T10:00:00Z",
  },
  {
    id: "4",
    ticketNumber: "TKT-004",
    orderId: "1",
    orderNumber: "ORD-2024-001",
    customerName: "John Doe",
    reason: "size_issue",
    description: "T-shirt size M is too small, need size L instead",
    status: "rejected",
    resolution: "rejected",
    timeline: [
      { id: "4-1", action: "Ticket Created", comment: "Customer requested size exchange", employeeName: "System", employeeRole: "Auto", createdAt: "2024-12-02T09:00:00Z" },
      { id: "4-2", action: "Review", comment: "Reviewed order - size M was ordered as per customer selection", employeeName: "Priya Patel", employeeRole: "Customer Support", createdAt: "2024-12-02T10:00:00Z" },
      { id: "4-3", action: "Rejected", comment: "Exchange rejected as correct size was shipped. Customer can return for refund per policy.", employeeName: "Raj Kumar", employeeRole: "Customer Support", createdAt: "2024-12-02T11:00:00Z" },
    ],
    createdAt: "2024-12-02T09:00:00Z",
  },
];

export const mockStockMovements: StockMovement[] = [
  { id: "1", type: "inward", sku: "TSH-RED-M", productName: "Classic T-Shirt - Red - M", quantity: 100, supplierId: "1", costPrice: 200, invoiceNumber: "INV-2024-001", invoiceDate: "2024-11-25", createdAt: "2024-11-25T10:00:00Z" },
  { id: "2", type: "outward", sku: "TSH-RED-M", productName: "Classic T-Shirt - Red - M", quantity: 2, orderId: "1", createdAt: "2024-12-01T10:35:00Z" },
  { id: "3", type: "inward", sku: "JNS-BLK-32", productName: "Denim Jeans - Black - 32", quantity: 50, supplierId: "2", costPrice: 500, invoiceNumber: "INV-2024-002", invoiceDate: "2024-11-26", createdAt: "2024-11-26T14:00:00Z" },
];

export const mockInternalDeliveries: InternalDelivery[] = [
  {
    id: "1",
    orderId: "4",
    orderNumber: "ORD-2024-004",
    customerName: "Priya Sharma",
    customerPhone: "+91 65432 44444",
    shippingAddress: "321 Lake View, Chennai 600001",
    totalAmount: 1497,
    paymentMethod: "cod",
    assignedTo: "Ramesh Kumar",
    assignedToPhone: "+91 98765 12345",
    status: "rto",
    assignedAt: "2024-11-29T15:00:00Z",
  },
  {
    id: "2",
    orderId: "6",
    orderNumber: "ORD-2024-006",
    customerName: "Sneha Gupta",
    customerPhone: "+91 43210 66666",
    shippingAddress: "777 MG Road, Pune 411001",
    totalAmount: 899,
    paymentMethod: "cod",
    assignedTo: "Suresh Patel",
    assignedToPhone: "+91 87654 23456",
    status: "assigned",
    assignedAt: "2024-12-02T09:00:00Z",
  },
  {
    id: "3",
    orderId: "7",
    orderNumber: "ORD-2024-007",
    customerName: "Vikram Singh",
    customerPhone: "+91 32109 77777",
    shippingAddress: "888 Anna Salai, Chennai 600002",
    totalAmount: 1798,
    paymentMethod: "cod",
    assignedTo: "Ramesh Kumar",
    assignedToPhone: "+91 98765 12345",
    status: "out_for_delivery",
    assignedAt: "2024-12-02T08:00:00Z",
  },
  {
    id: "4",
    orderId: "8",
    orderNumber: "ORD-2024-008",
    customerName: "Meera Nair",
    customerPhone: "+91 21098 88888",
    shippingAddress: "999 Brigade Road, Bangalore 560025",
    totalAmount: 2197,
    paymentMethod: "cod",
    assignedTo: "Suresh Patel",
    assignedToPhone: "+91 87654 23456",
    status: "delivered",
    paymentCollected: "cash",
    collectedAmount: 2197,
    assignedAt: "2024-12-01T10:00:00Z",
    deliveredAt: "2024-12-01T14:00:00Z",
  },
  {
    id: "5",
    orderId: "9",
    orderNumber: "ORD-2024-009",
    customerName: "Arjun Reddy",
    customerPhone: "+91 10987 99999",
    shippingAddress: "111 Jubilee Hills, Hyderabad 500033",
    totalAmount: 1299,
    paymentMethod: "cod",
    assignedTo: "Ramesh Kumar",
    assignedToPhone: "+91 98765 12345",
    status: "payment_collected",
    paymentCollected: "qr",
    collectedAmount: 1299,
    assignedAt: "2024-12-01T09:00:00Z",
    deliveredAt: "2024-12-01T12:00:00Z",
  },
];

export const mockUsers: User[] = [
  { id: "1", name: "Admin User", email: "admin@dsscm.com", phone: "+91 98765 00001", role: "admin", status: "active", createdAt: "2024-01-01T00:00:00Z" },
  { id: "2", name: "Priya Patel", email: "priya@dsscm.com", phone: "+91 98765 00002", role: "customer_support", status: "active", createdAt: "2024-02-15T00:00:00Z" },
  { id: "3", name: "Raj Kumar", email: "raj@dsscm.com", phone: "+91 98765 00003", role: "customer_support", status: "active", createdAt: "2024-03-01T00:00:00Z" },
  { id: "4", name: "Anita Desai", email: "anita@dsscm.com", phone: "+91 98765 00004", role: "admin", status: "active", createdAt: "2024-01-15T00:00:00Z" },
  { id: "5", name: "Warehouse Manager", email: "warehouse@dsscm.com", phone: "+91 98765 00005", role: "warehouse", status: "active", createdAt: "2024-04-01T00:00:00Z" },
  { id: "6", name: "Stock Controller", email: "stock@dsscm.com", phone: "+91 98765 00006", role: "stock_management", status: "inactive", createdAt: "2024-05-01T00:00:00Z" },
];

export const dashboardStats = {
  totalInventory: 600,
  pendingOrders: 12,
  dispatchedOrders: 45,
  deliveredOrders: 156,
  rtoOrders: 8,
  openComplaints: 5,
  totalDeliveryCost: 2500,
  lowStockItems: 3,
};
