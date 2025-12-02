export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
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

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: { sku: string; productName: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: "pending" | "paid" | "refunded";
  status: OrderStatus;
  courierPartner?: string;
  awbNumber?: string;
  deliveryCost?: number;
  createdAt: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  orderId: string;
  orderNumber: string;
  reason: "wrong_item" | "damaged" | "late_delivery" | "other";
  description: string;
  status: "open" | "in_progress" | "resolved" | "rejected";
  resolution?: "refund" | "replacement" | "rejected";
  refundAmount?: number;
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
  createdAt: string;
}

export const mockSuppliers: Supplier[] = [
  { id: "1", name: "ABC Textiles", email: "contact@abctextiles.com", phone: "+91 98765 43210", address: "123 Industrial Area, Mumbai", status: "active" },
  { id: "2", name: "XYZ Garments", email: "info@xyzgarments.com", phone: "+91 87654 32109", address: "456 Manufacturing Hub, Delhi", status: "active" },
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
    items: [{ sku: "TSH-RED-M", productName: "Classic T-Shirt - Red - M", quantity: 2, price: 499 }],
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
      { sku: "JNS-BLK-32", productName: "Denim Jeans - Black - 32", quantity: 1, price: 1299 },
      { sku: "TSH-BLU-L", productName: "Classic T-Shirt - Blue - L", quantity: 1, price: 499 },
    ],
    totalAmount: 1798,
    paymentMethod: "cod",
    paymentStatus: "pending",
    status: "dispatched",
    courierPartner: "Delhivery",
    awbNumber: "DL12345678",
    createdAt: "2024-12-01T11:45:00Z",
  },
  {
    id: "3",
    orderNumber: "ORD-2024-003",
    customerName: "Rahul Kumar",
    customerEmail: "rahul@example.com",
    customerPhone: "+91 76543 33333",
    shippingAddress: "789 Gandhi Road, Bangalore 560001",
    items: [{ sku: "SHT-WHT-M", productName: "Casual Shirt - White - M", quantity: 1, price: 899 }],
    totalAmount: 899,
    paymentMethod: "prepaid",
    paymentStatus: "paid",
    status: "delivered",
    courierPartner: "BlueDart",
    awbNumber: "BD98765432",
    createdAt: "2024-11-28T09:15:00Z",
  },
  {
    id: "4",
    orderNumber: "ORD-2024-004",
    customerName: "Priya Sharma",
    customerEmail: "priya@example.com",
    customerPhone: "+91 65432 44444",
    shippingAddress: "321 Lake View, Chennai 600001",
    items: [{ sku: "TSH-RED-S", productName: "Classic T-Shirt - Red - S", quantity: 3, price: 499 }],
    totalAmount: 1497,
    paymentMethod: "cod",
    paymentStatus: "pending",
    status: "rto",
    courierPartner: "Local Delivery",
    deliveryCost: 50,
    createdAt: "2024-11-29T14:20:00Z",
  },
];

export const mockComplaints: Complaint[] = [
  {
    id: "1",
    ticketNumber: "TKT-001",
    orderId: "3",
    orderNumber: "ORD-2024-003",
    reason: "wrong_item",
    description: "Received blue shirt instead of white",
    status: "open",
    createdAt: "2024-12-01T16:00:00Z",
  },
  {
    id: "2",
    ticketNumber: "TKT-002",
    orderId: "2",
    orderNumber: "ORD-2024-002",
    reason: "damaged",
    description: "Package arrived with torn packaging, jeans have a stain",
    status: "in_progress",
    createdAt: "2024-12-01T12:30:00Z",
  },
];

export const mockStockMovements: StockMovement[] = [
  { id: "1", type: "inward", sku: "TSH-RED-M", productName: "Classic T-Shirt - Red - M", quantity: 100, supplierId: "1", costPrice: 200, createdAt: "2024-11-25T10:00:00Z" },
  { id: "2", type: "outward", sku: "TSH-RED-M", productName: "Classic T-Shirt - Red - M", quantity: 2, orderId: "1", createdAt: "2024-12-01T10:35:00Z" },
  { id: "3", type: "inward", sku: "JNS-BLK-32", productName: "Denim Jeans - Black - 32", quantity: 50, supplierId: "2", costPrice: 500, createdAt: "2024-11-26T14:00:00Z" },
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
