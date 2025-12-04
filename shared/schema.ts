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
export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({ id: true, createdAt: true });
export const insertComplaintSchema = createInsertSchema(complaints).omit({ id: true, createdAt: true, updatedAt: true, resolvedAt: true });
export const insertComplaintTimelineSchema = createInsertSchema(complaintTimeline).omit({ id: true, createdAt: true });
export const insertInternalDeliverySchema = createInsertSchema(internalDeliveries).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDeliveryEventSchema = createInsertSchema(deliveryEvents).omit({ id: true, createdAt: true });
export const insertBulkUploadJobSchema = createInsertSchema(bulkUploadJobs).omit({ id: true, createdAt: true, completedAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ id: true, updatedAt: true });

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
  
  // Reports
  VIEW_REPORTS: "view_reports",
  EXPORT_REPORTS: "export_reports",
} as const;

export type PermissionCode = typeof PERMISSION_CODES[keyof typeof PERMISSION_CODES];
