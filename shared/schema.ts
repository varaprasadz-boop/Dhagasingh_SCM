import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const orderStatusEnum = pgEnum("order_status", ["pending", "dispatched", "delivered", "rto", "returned", "refunded", "cancelled"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cod", "prepaid"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "refunded", "failed"]);
export const courierTypeEnum = pgEnum("courier_type", ["third_party", "in_house"]);
export const complaintStatusEnum = pgEnum("complaint_status", ["open", "in_progress", "resolved", "rejected"]);
export const complaintReasonEnum = pgEnum("complaint_reason", ["wrong_item", "damaged", "delayed", "not_received", "quality", "size_exchange", "other"]);
export const stockMovementTypeEnum = pgEnum("stock_movement_type", ["inward", "outward", "adjustment"]);
export const deliveryStatusEnum = pgEnum("delivery_status", ["assigned", "out_for_delivery", "delivered", "payment_collected", "failed", "rto"]);
export const userStatusEnum = pgEnum("user_status", ["active", "inactive"]);

// B2B Enums
export const b2bOrderStatusEnum = pgEnum("b2b_order_status", [
  "order_received", "design_review", "client_approval", "production_scheduled",
  "printing_in_progress", "quality_check", "packed", "dispatched", "delivered", "closed", "cancelled"
]);
export const b2bOrderPriorityEnum = pgEnum("b2b_order_priority", ["normal", "urgent"]);
export const b2bPrintingTypeEnum = pgEnum("b2b_printing_type", ["dtg", "screen", "sublimation", "embroidery"]);
export const b2bInvoiceTypeEnum = pgEnum("b2b_invoice_type", ["proforma", "tax"]);
export const b2bInvoiceStatusEnum = pgEnum("b2b_invoice_status", ["draft", "sent", "paid", "cancelled"]);
export const b2bPaymentStatusEnum = pgEnum("b2b_payment_status", ["not_paid", "advance_received", "partially_paid", "fully_paid", "overdue"]);
export const b2bPaymentModeEnum = pgEnum("b2b_payment_mode", ["cash", "upi", "bank_transfer", "card", "cheque", "online_gateway"]);
export const b2bArtworkStatusEnum = pgEnum("b2b_artwork_status", ["pending", "received", "approved", "revision_needed"]);

// B2B Printing Types (Super Admin configurable)
export const b2bPrintingTypes = pgTable("b2b_printing_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Permissions table - stores all available permissions in the system
export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // e.g., "view_orders", "edit_orders", "manage_users"
  name: text("name").notNull(), // Display name
  description: text("description"),
  module: text("module").notNull(), // e.g., "orders", "inventory", "users", "complaints"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Roles table - dynamic roles that super admin can create
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // e.g., "Admin", "Customer Support", "Finance"
  description: text("description"),
  isSystem: boolean("is_system").default(false).notNull(), // System roles like super_admin cannot be deleted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Role-Permission junction table
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: varchar("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  roleId: varchar("role_id").references(() => roles.id),
  status: userStatusEnum("status").default("active").notNull(),
  isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sessions table for auth
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  gstNumber: text("gst_number"),
  status: userStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product variants table
export const productVariants = pgTable("product_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  sku: text("sku").notNull().unique(),
  color: text("color"),
  size: text("size"),
  stockQuantity: integer("stock_quantity").default(0).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).default("0").notNull(),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).default("0").notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(10),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Courier partners table
export const courierPartners = pgTable("courier_partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // e.g., "delhivery", "bluedart"
  type: courierTypeEnum("type").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  baseUrl: text("base_url"),
  apiEnabled: boolean("api_enabled").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  shopifyOrderId: text("shopify_order_id"), // For Shopify imported orders
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  shippingAddress: text("shipping_address").notNull(),
  shippingCity: text("shipping_city"),
  shippingState: text("shipping_state"),
  shippingZip: text("shipping_zip"),
  shippingCountry: text("shipping_country"),
  billingAddress: text("billing_address"),
  billingCity: text("billing_city"),
  billingState: text("billing_state"),
  billingZip: text("billing_zip"),
  billingCountry: text("billing_country"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0").notNull(),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0").notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0").notNull(),
  taxes: decimal("taxes", { precision: 10, scale: 2 }).default("0").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
  status: orderStatusEnum("status").default("pending").notNull(),
  courierPartnerId: varchar("courier_partner_id").references(() => courierPartners.id),
  courierType: courierTypeEnum("courier_type"),
  awbNumber: text("awb_number"),
  dispatchDate: timestamp("dispatch_date"),
  deliveryDate: timestamp("delivery_date"),
  assignedTo: varchar("assigned_to").references(() => users.id), // For in-house delivery
  notes: text("notes"),
  rtoReason: text("rto_reason"),
  shopifyData: jsonb("shopify_data"), // Store raw Shopify data for reference
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productVariantId: varchar("product_variant_id").references(() => productVariants.id),
  sku: text("sku").notNull(),
  productName: text("product_name").notNull(),
  color: text("color"),
  size: text("size"),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  fulfillmentStatus: text("fulfillment_status"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Order status history
export const orderStatusHistory = pgTable("order_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  status: orderStatusEnum("status").notNull(),
  comment: text("comment"),
  changedBy: varchar("changed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Stock movements table
export const stockMovements = pgTable("stock_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productVariantId: varchar("product_variant_id").notNull().references(() => productVariants.id, { onDelete: "cascade" }),
  type: stockMovementTypeEnum("type").notNull(),
  quantity: integer("quantity").notNull(),
  previousQuantity: integer("previous_quantity").notNull(),
  newQuantity: integer("new_quantity").notNull(),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  orderId: varchar("order_id").references(() => orders.id),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  invoiceNumber: text("invoice_number"),
  invoiceDate: timestamp("invoice_date"),
  reason: text("reason"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Complaints table
export const complaints = pgTable("complaints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNumber: text("ticket_number").notNull().unique(),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  reason: complaintReasonEnum("reason").notNull(),
  description: text("description"),
  status: complaintStatusEnum("status").default("open").notNull(),
  priority: text("priority").default("medium"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  resolutionType: text("resolution_type"), // refund, replacement, rejected
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

// Complaint timeline entries
export const complaintTimeline = pgTable("complaint_timeline", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  complaintId: varchar("complaint_id").notNull().references(() => complaints.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // e.g., "Ticket Created", "Assigned", "Investigation", "Resolved"
  comment: text("comment"),
  employeeId: varchar("employee_id").references(() => users.id),
  employeeName: text("employee_name").notNull(),
  employeeRole: text("employee_role"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Internal deliveries table
export const internalDeliveries = pgTable("internal_deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  assignedTo: varchar("assigned_to").notNull().references(() => users.id),
  status: deliveryStatusEnum("status").default("assigned").notNull(),
  scheduledDate: timestamp("scheduled_date"),
  deliveredAt: timestamp("delivered_at"),
  paymentCollectedAt: timestamp("payment_collected_at"),
  amountCollected: decimal("amount_collected", { precision: 10, scale: 2 }),
  paymentMode: text("payment_mode"), // cash, upi, qr
  deliveryNotes: text("delivery_notes"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Delivery events (timeline for each delivery)
export const deliveryEvents = pgTable("delivery_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deliveryId: varchar("delivery_id").notNull().references(() => internalDeliveries.id, { onDelete: "cascade" }),
  event: text("event").notNull(), // e.g., "Assigned", "Out for Delivery", "Delivered", "Payment Collected"
  comment: text("comment"),
  location: text("location"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bulk upload jobs
export const bulkUploadJobs = pgTable("bulk_upload_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // orders, products
  fileName: text("file_name").notNull(),
  status: text("status").default("pending").notNull(), // pending, processing, completed, failed
  totalRows: integer("total_rows").default(0),
  processedRows: integer("processed_rows").default(0),
  successRows: integer("success_rows").default(0),
  errorRows: integer("error_rows").default(0),
  errors: jsonb("errors"), // Array of error details
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Audit log
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  module: text("module").notNull(),
  entityId: text("entity_id"),
  entityType: text("entity_type"),
  oldData: jsonb("old_data"),
  newData: jsonb("new_data"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Settings table
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: jsonb("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// B2B Module Tables
// ============================================

// B2B Clients table
export const b2bClients = pgTable("b2b_clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  contactPerson: text("contact_person").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  alternatePhone: text("alternate_phone"),
  industryType: text("industry_type"),
  gstNumber: text("gst_number"),
  panNumber: text("pan_number"),
  billingAddress: text("billing_address"),
  billingCity: text("billing_city"),
  billingState: text("billing_state"),
  billingZip: text("billing_zip"),
  billingCountry: text("billing_country").default("India"),
  shippingAddress: text("shipping_address"),
  shippingCity: text("shipping_city"),
  shippingState: text("shipping_state"),
  shippingZip: text("shipping_zip"),
  shippingCountry: text("shipping_country").default("India"),
  notes: text("notes"),
  status: userStatusEnum("status").default("active").notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// B2B Orders table
export const b2bOrders = pgTable("b2b_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  clientId: varchar("client_id").notNull().references(() => b2bClients.id),
  printingTypeId: varchar("printing_type_id").references(() => b2bPrintingTypes.id),
  artworkStatus: b2bArtworkStatusEnum("artwork_status").default("pending").notNull(),
  eventType: text("event_type"),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryCity: text("delivery_city"),
  deliveryState: text("delivery_state"),
  deliveryZip: text("delivery_zip"),
  deliveryCountry: text("delivery_country").default("India"),
  requiredDeliveryDate: timestamp("required_delivery_date"),
  priority: b2bOrderPriorityEnum("priority").default("normal").notNull(),
  status: b2bOrderStatusEnum("status").default("order_received").notNull(),
  // Financial fields
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  advanceAmount: decimal("advance_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  advanceMode: b2bPaymentModeEnum("advance_mode"),
  advanceDate: timestamp("advance_date"),
  advanceReference: text("advance_reference"),
  advanceProofUrl: text("advance_proof_url"),
  paymentStatus: b2bPaymentStatusEnum("payment_status").default("advance_received").notNull(),
  amountReceived: decimal("amount_received", { precision: 10, scale: 2 }).default("0").notNull(),
  balancePending: decimal("balance_pending", { precision: 10, scale: 2 }).default("0").notNull(),
  // Legacy fields kept for compatibility
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0").notNull(),
  printingCost: decimal("printing_cost", { precision: 10, scale: 2 }).default("0").notNull(),
  designCharges: decimal("design_charges", { precision: 10, scale: 2 }).default("0").notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0").notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("18").notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  specialInstructions: text("special_instructions"),
  internalNotes: text("internal_notes"),
  cancellationReason: text("cancellation_reason"),
  delayReason: text("delay_reason"),
  // Dispatch fields
  courierPartnerId: varchar("courier_partner_id").references(() => courierPartners.id),
  courierType: courierTypeEnum("courier_type"),
  awbNumber: text("awb_number"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  dispatchDate: timestamp("dispatch_date"),
  deliveryDate: timestamp("delivery_date"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// B2B Order Items (products with variants)
export const b2bOrderItems = pgTable("b2b_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => b2bOrders.id, { onDelete: "cascade" }),
  productId: varchar("product_id").references(() => products.id),
  productVariantId: varchar("product_variant_id").references(() => productVariants.id),
  // Variant snapshot for historical record
  variantSku: text("variant_sku"),
  variantColor: text("variant_color"),
  variantSize: text("variant_size"),
  quantity: integer("quantity").notNull(),
  // Legacy fields for backward compatibility
  apparelType: text("apparel_type"),
  color: text("color"),
  fabric: text("fabric"),
  printingType: b2bPrintingTypeEnum("printing_type"),
  printPlacement: text("print_placement"),
  sizeBreakup: jsonb("size_breakup"),
  totalQuantity: integer("total_quantity"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  printingCostPerUnit: decimal("printing_cost_per_unit", { precision: 10, scale: 2 }).default("0"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// B2B Order Artwork files
export const b2bOrderArtwork = pgTable("b2b_order_artwork", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => b2bOrders.id, { onDelete: "cascade" }),
  orderItemId: varchar("order_item_id").references(() => b2bOrderItems.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  description: text("description"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// B2B Order Status History
export const b2bOrderStatusHistory = pgTable("b2b_order_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => b2bOrders.id, { onDelete: "cascade" }),
  status: b2bOrderStatusEnum("status").notNull(),
  comment: text("comment"),
  changedBy: varchar("changed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// B2B Invoices
export const b2bInvoices = pgTable("b2b_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  orderId: varchar("order_id").notNull().references(() => b2bOrders.id),
  clientId: varchar("client_id").notNull().references(() => b2bClients.id),
  invoiceType: b2bInvoiceTypeEnum("invoice_type").notNull(),
  invoiceDate: timestamp("invoice_date").defaultNow().notNull(),
  dueDate: timestamp("due_date"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("18").notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: b2bInvoiceStatusEnum("status").default("draft").notNull(),
  pdfUrl: text("pdf_url"),
  notes: text("notes"),
  version: integer("version").default(1).notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// B2B Payment Milestones (configurable payment schedule)
export const b2bPaymentMilestones = pgTable("b2b_payment_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => b2bOrders.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date"),
  isPaid: boolean("is_paid").default(false).notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// B2B Payments
export const b2bPayments = pgTable("b2b_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => b2bOrders.id, { onDelete: "cascade" }),
  invoiceId: varchar("invoice_id").references(() => b2bInvoices.id),
  milestoneId: varchar("milestone_id").references(() => b2bPaymentMilestones.id),
  paymentDate: timestamp("payment_date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMode: b2bPaymentModeEnum("payment_mode").notNull(),
  transactionRef: text("transaction_ref"),
  proofUrl: text("proof_url"),
  remarks: text("remarks"),
  recordedBy: varchar("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  users: many(users),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  sessions: many(sessions),
  complaints: many(complaints),
  deliveries: many(internalDeliveries),
}));

export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  stockMovements: many(stockMovements),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
  courierPartner: one(courierPartners, {
    fields: [orders.courierPartnerId],
    references: [courierPartners.id],
  }),
  assignedUser: one(users, {
    fields: [orders.assignedTo],
    references: [users.id],
  }),
  complaints: many(complaints),
  internalDeliveries: many(internalDeliveries),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  productVariant: one(productVariants, {
    fields: [orderItems.productVariantId],
    references: [productVariants.id],
  }),
}));

export const complaintsRelations = relations(complaints, ({ one, many }) => ({
  order: one(orders, {
    fields: [complaints.orderId],
    references: [orders.id],
  }),
  assignedUser: one(users, {
    fields: [complaints.assignedTo],
    references: [users.id],
  }),
  timeline: many(complaintTimeline),
}));

export const complaintTimelineRelations = relations(complaintTimeline, ({ one }) => ({
  complaint: one(complaints, {
    fields: [complaintTimeline.complaintId],
    references: [complaints.id],
  }),
  employee: one(users, {
    fields: [complaintTimeline.employeeId],
    references: [users.id],
  }),
}));

export const internalDeliveriesRelations = relations(internalDeliveries, ({ one, many }) => ({
  order: one(orders, {
    fields: [internalDeliveries.orderId],
    references: [orders.id],
  }),
  assignedUser: one(users, {
    fields: [internalDeliveries.assignedTo],
    references: [users.id],
  }),
  events: many(deliveryEvents),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  productVariant: one(productVariants, {
    fields: [stockMovements.productVariantId],
    references: [productVariants.id],
  }),
  supplier: one(suppliers, {
    fields: [stockMovements.supplierId],
    references: [suppliers.id],
  }),
  order: one(orders, {
    fields: [stockMovements.orderId],
    references: [orders.id],
  }),
  createdByUser: one(users, {
    fields: [stockMovements.createdBy],
    references: [users.id],
  }),
}));

// B2B Relations
export const b2bClientsRelations = relations(b2bClients, ({ one, many }) => ({
  orders: many(b2bOrders),
  invoices: many(b2bInvoices),
  createdByUser: one(users, {
    fields: [b2bClients.createdBy],
    references: [users.id],
  }),
}));

export const b2bOrdersRelations = relations(b2bOrders, ({ one, many }) => ({
  client: one(b2bClients, {
    fields: [b2bOrders.clientId],
    references: [b2bClients.id],
  }),
  printingType: one(b2bPrintingTypes, {
    fields: [b2bOrders.printingTypeId],
    references: [b2bPrintingTypes.id],
  }),
  items: many(b2bOrderItems),
  artwork: many(b2bOrderArtwork),
  statusHistory: many(b2bOrderStatusHistory),
  invoices: many(b2bInvoices),
  payments: many(b2bPayments),
  milestones: many(b2bPaymentMilestones),
  courierPartner: one(courierPartners, {
    fields: [b2bOrders.courierPartnerId],
    references: [courierPartners.id],
  }),
  assignedUser: one(users, {
    fields: [b2bOrders.assignedTo],
    references: [users.id],
    relationName: "assignedUser",
  }),
  createdByUser: one(users, {
    fields: [b2bOrders.createdBy],
    references: [users.id],
    relationName: "createdByUser",
  }),
}));

export const b2bOrderItemsRelations = relations(b2bOrderItems, ({ one, many }) => ({
  order: one(b2bOrders, {
    fields: [b2bOrderItems.orderId],
    references: [b2bOrders.id],
  }),
  product: one(products, {
    fields: [b2bOrderItems.productId],
    references: [products.id],
  }),
  productVariant: one(productVariants, {
    fields: [b2bOrderItems.productVariantId],
    references: [productVariants.id],
  }),
  artwork: many(b2bOrderArtwork),
}));

export const b2bOrderArtworkRelations = relations(b2bOrderArtwork, ({ one }) => ({
  order: one(b2bOrders, {
    fields: [b2bOrderArtwork.orderId],
    references: [b2bOrders.id],
  }),
  orderItem: one(b2bOrderItems, {
    fields: [b2bOrderArtwork.orderItemId],
    references: [b2bOrderItems.id],
  }),
  uploadedByUser: one(users, {
    fields: [b2bOrderArtwork.uploadedBy],
    references: [users.id],
  }),
}));

export const b2bOrderStatusHistoryRelations = relations(b2bOrderStatusHistory, ({ one }) => ({
  order: one(b2bOrders, {
    fields: [b2bOrderStatusHistory.orderId],
    references: [b2bOrders.id],
  }),
  changedByUser: one(users, {
    fields: [b2bOrderStatusHistory.changedBy],
    references: [users.id],
  }),
}));

export const b2bInvoicesRelations = relations(b2bInvoices, ({ one, many }) => ({
  order: one(b2bOrders, {
    fields: [b2bInvoices.orderId],
    references: [b2bOrders.id],
  }),
  client: one(b2bClients, {
    fields: [b2bInvoices.clientId],
    references: [b2bClients.id],
  }),
  payments: many(b2bPayments),
  createdByUser: one(users, {
    fields: [b2bInvoices.createdBy],
    references: [users.id],
  }),
}));

export const b2bPaymentMilestonesRelations = relations(b2bPaymentMilestones, ({ one, many }) => ({
  order: one(b2bOrders, {
    fields: [b2bPaymentMilestones.orderId],
    references: [b2bOrders.id],
  }),
  payments: many(b2bPayments),
}));

export const b2bPaymentsRelations = relations(b2bPayments, ({ one }) => ({
  order: one(b2bOrders, {
    fields: [b2bPayments.orderId],
    references: [b2bOrders.id],
  }),
  invoice: one(b2bInvoices, {
    fields: [b2bPayments.invoiceId],
    references: [b2bInvoices.id],
  }),
  milestone: one(b2bPaymentMilestones, {
    fields: [b2bPayments.milestoneId],
    references: [b2bPaymentMilestones.id],
  }),
  recordedByUser: one(users, {
    fields: [b2bPayments.recordedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertPermissionSchema = createInsertSchema(permissions).omit({ id: true, createdAt: true });
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProductVariantSchema = createInsertSchema(productVariants).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCourierPartnerSchema = createInsertSchema(courierPartners).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true, createdAt: true });
export const insertOrderStatusHistorySchema = createInsertSchema(orderStatusHistory).omit({ id: true, createdAt: true });
export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({ id: true, createdAt: true });
export const insertComplaintSchema = createInsertSchema(complaints).omit({ id: true, createdAt: true, updatedAt: true, resolvedAt: true });
export const insertComplaintTimelineSchema = createInsertSchema(complaintTimeline).omit({ id: true, createdAt: true });
export const insertInternalDeliverySchema = createInsertSchema(internalDeliveries).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDeliveryEventSchema = createInsertSchema(deliveryEvents).omit({ id: true, createdAt: true });
export const insertBulkUploadJobSchema = createInsertSchema(bulkUploadJobs).omit({ id: true, createdAt: true, completedAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ id: true, updatedAt: true });

// Dispatch/Replacement payload schema for API validation
export const dispatchPayloadSchema = z.object({
  courierPartnerId: z.string().min(1, "Courier partner is required"),
  courierType: z.enum(["third_party", "in_house"], { required_error: "Courier type is required" }),
  awbNumber: z.string().optional(),
  assignedTo: z.string().optional(),
});

// B2B Order Item for new order creation
export const b2bOrderItemInputSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  productVariantId: z.string().min(1, "Variant is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

// B2B Order Creation payload schema with mandatory advance payment
export const createB2BOrderPayloadSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  printingTypeId: z.string().optional(),
  artworkStatus: z.enum(["pending", "received", "approved", "revision_needed"]).default("pending"),
  priority: z.enum(["normal", "urgent"]).default("normal"),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  deliveryCity: z.string().optional(),
  deliveryState: z.string().optional(),
  deliveryZip: z.string().optional(),
  requiredDeliveryDate: z.string().optional(),
  specialInstructions: z.string().optional(),
  // Financial fields
  totalAmount: z.number().positive("Total amount must be greater than 0"),
  advanceAmount: z.number().positive("Advance amount is required and must be greater than 0"),
  advanceMode: z.enum(["cash", "upi", "bank_transfer", "card", "cheque", "online_gateway"], {
    required_error: "Advance payment mode is required"
  }),
  advanceDate: z.string().min(1, "Advance date is required"),
  advanceReference: z.string().min(1, "Transaction reference is required"),
  advanceProofUrl: z.string().min(1, "Payment proof is required"),
  // Items array
  items: z.array(b2bOrderItemInputSchema).min(1, "At least one product item is required"),
}).refine(data => data.advanceAmount <= data.totalAmount, {
  message: "Advance amount cannot exceed total amount",
  path: ["advanceAmount"],
});

// B2B Insert Schemas
export const insertB2BPrintingTypeSchema = createInsertSchema(b2bPrintingTypes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertB2BClientSchema = createInsertSchema(b2bClients).omit({ id: true, createdAt: true, updatedAt: true });
export const insertB2BOrderSchema = createInsertSchema(b2bOrders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertB2BOrderItemSchema = createInsertSchema(b2bOrderItems).omit({ id: true, createdAt: true });
export const insertB2BOrderArtworkSchema = createInsertSchema(b2bOrderArtwork).omit({ id: true, createdAt: true });
export const insertB2BOrderStatusHistorySchema = createInsertSchema(b2bOrderStatusHistory).omit({ id: true, createdAt: true });
export const insertB2BInvoiceSchema = createInsertSchema(b2bInvoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertB2BPaymentMilestoneSchema = createInsertSchema(b2bPaymentMilestones).omit({ id: true, createdAt: true });
export const insertB2BPaymentSchema = createInsertSchema(b2bPayments).omit({ id: true, createdAt: true });

// Types
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
export type CourierPartner = typeof courierPartners.$inferSelect;
export type InsertCourierPartner = z.infer<typeof insertCourierPartnerSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type InsertOrderStatusHistory = z.infer<typeof insertOrderStatusHistorySchema>;
export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type ComplaintTimeline = typeof complaintTimeline.$inferSelect;
export type InsertComplaintTimeline = z.infer<typeof insertComplaintTimelineSchema>;
export type InternalDelivery = typeof internalDeliveries.$inferSelect;
export type InsertInternalDelivery = z.infer<typeof insertInternalDeliverySchema>;
export type DeliveryEvent = typeof deliveryEvents.$inferSelect;
export type InsertDeliveryEvent = z.infer<typeof insertDeliveryEventSchema>;
export type BulkUploadJob = typeof bulkUploadJobs.$inferSelect;
export type InsertBulkUploadJob = z.infer<typeof insertBulkUploadJobSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// B2B Types
export type B2BPrintingType = typeof b2bPrintingTypes.$inferSelect;
export type InsertB2BPrintingType = z.infer<typeof insertB2BPrintingTypeSchema>;
export type B2BClient = typeof b2bClients.$inferSelect;
export type InsertB2BClient = z.infer<typeof insertB2BClientSchema>;
export type B2BOrder = typeof b2bOrders.$inferSelect;
export type InsertB2BOrder = z.infer<typeof insertB2BOrderSchema>;
export type B2BOrderItem = typeof b2bOrderItems.$inferSelect;
export type InsertB2BOrderItem = z.infer<typeof insertB2BOrderItemSchema>;
export type B2BOrderArtwork = typeof b2bOrderArtwork.$inferSelect;
export type InsertB2BOrderArtwork = z.infer<typeof insertB2BOrderArtworkSchema>;
export type B2BOrderStatusHistory = typeof b2bOrderStatusHistory.$inferSelect;
export type InsertB2BOrderStatusHistory = z.infer<typeof insertB2BOrderStatusHistorySchema>;
export type B2BInvoice = typeof b2bInvoices.$inferSelect;
export type InsertB2BInvoice = z.infer<typeof insertB2BInvoiceSchema>;
export type B2BPaymentMilestone = typeof b2bPaymentMilestones.$inferSelect;
export type InsertB2BPaymentMilestone = z.infer<typeof insertB2BPaymentMilestoneSchema>;
export type B2BPayment = typeof b2bPayments.$inferSelect;
export type InsertB2BPayment = z.infer<typeof insertB2BPaymentSchema>;

// Extended types with relations
export type RoleWithPermissions = Role & {
  rolePermissions: (RolePermission & { permission: Permission })[];
};

export type UserWithRole = User & {
  role: RoleWithPermissions | null;
};

export type ProductWithVariants = Product & {
  variants: ProductVariant[];
};

export type OrderWithItems = Order & {
  items: OrderItem[];
  courierPartner?: CourierPartner | null;
  assignedUser?: User | null;
};

export type ComplaintWithTimeline = Complaint & {
  timeline: ComplaintTimeline[];
  order?: Order;
  assignedUser?: User | null;
};

export type InternalDeliveryWithDetails = InternalDelivery & {
  order: Order;
  assignedUser: User;
  events: DeliveryEvent[];
};

// B2B Extended Types
export type B2BClientWithOrders = B2BClient & {
  orders: B2BOrder[];
};

export type B2BOrderWithDetails = B2BOrder & {
  client: B2BClient;
  items: B2BOrderItem[];
  artwork: B2BOrderArtwork[];
  statusHistory: B2BOrderStatusHistory[];
  invoices: B2BInvoice[];
  payments: B2BPayment[];
  milestones: B2BPaymentMilestone[];
  courierPartner?: CourierPartner | null;
};

// All available permissions in the system
export const PERMISSION_CODES = {
  // Dashboard
  VIEW_DASHBOARD: "view_dashboard",
  
  // Orders
  VIEW_ORDERS: "view_orders",
  CREATE_ORDERS: "create_orders",
  EDIT_ORDERS: "edit_orders",
  DELETE_ORDERS: "delete_orders",
  DISPATCH_ORDERS: "dispatch_orders",
  IMPORT_ORDERS: "import_orders",
  
  // Inventory
  VIEW_INVENTORY: "view_inventory",
  MANAGE_INVENTORY: "manage_inventory",
  ADJUST_STOCK: "adjust_stock",
  
  // Products
  VIEW_PRODUCTS: "view_products",
  CREATE_PRODUCTS: "create_products",
  EDIT_PRODUCTS: "edit_products",
  DELETE_PRODUCTS: "delete_products",
  IMPORT_PRODUCTS: "import_products",
  
  // Suppliers
  VIEW_SUPPLIERS: "view_suppliers",
  MANAGE_SUPPLIERS: "manage_suppliers",
  
  // Complaints
  VIEW_COMPLAINTS: "view_complaints",
  MANAGE_COMPLAINTS: "manage_complaints",
  RESOLVE_COMPLAINTS: "resolve_complaints",
  
  // Internal Delivery
  VIEW_DELIVERIES: "view_deliveries",
  MANAGE_DELIVERIES: "manage_deliveries",
  COLLECT_PAYMENTS: "collect_payments",
  
  // Users
  VIEW_USERS: "view_users",
  MANAGE_USERS: "manage_users",
  
  // Roles & Permissions (Super Admin only)
  VIEW_ROLES: "view_roles",
  MANAGE_ROLES: "manage_roles",
  MANAGE_PERMISSIONS: "manage_permissions",
  
  // Settings
  VIEW_SETTINGS: "view_settings",
  MANAGE_SETTINGS: "manage_settings",
  
  // Courier Partners
  VIEW_COURIERS: "view_couriers",
  MANAGE_COURIERS: "manage_couriers",
  
  // Courier Status (Bulk Updates)
  MANAGE_COURIER_STATUS: "manage_courier_status",
  
  // Reports
  VIEW_REPORTS: "view_reports",
  EXPORT_REPORTS: "export_reports",
  
  // B2B Module
  VIEW_B2B_CLIENTS: "view_b2b_clients",
  MANAGE_B2B_CLIENTS: "manage_b2b_clients",
  VIEW_B2B_ORDERS: "view_b2b_orders",
  CREATE_B2B_ORDERS: "create_b2b_orders",
  EDIT_B2B_ORDERS: "edit_b2b_orders",
  DELETE_B2B_ORDERS: "delete_b2b_orders",
  UPDATE_B2B_ORDER_STATUS: "update_b2b_order_status",
  VIEW_B2B_INVOICES: "view_b2b_invoices",
  MANAGE_B2B_INVOICES: "manage_b2b_invoices",
  VIEW_B2B_PAYMENTS: "view_b2b_payments",
  MANAGE_B2B_PAYMENTS: "manage_b2b_payments",
  VIEW_B2B_DASHBOARD: "view_b2b_dashboard",
  VIEW_ALL_B2B_DATA: "view_all_b2b_data",
} as const;

export type PermissionCode = typeof PERMISSION_CODES[keyof typeof PERMISSION_CODES];
