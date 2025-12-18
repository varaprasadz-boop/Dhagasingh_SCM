import { db, getBooleanValue } from "./db";
import { eq, and, desc, asc, like, inArray, sql, or, isNull, gte, lte, count } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  users, roles, permissions, rolePermissions, sessions,
  suppliers, products, productVariants, courierPartners,
  orders, orderItems, orderStatusHistory, stockMovements,
  complaints, complaintTimeline, internalDeliveries, deliveryEvents,
  bulkUploadJobs, auditLogs, settings,
  b2bClients, b2bOrders, b2bOrderItems, b2bOrderArtwork, b2bOrderStatusHistory,
  b2bInvoices, b2bPaymentMilestones, b2bPayments,
  type User, type InsertUser, type Role, type InsertRole,
  type Permission, type InsertPermission, type RolePermission, type InsertRolePermission,
  type Supplier, type InsertSupplier, type Product, type InsertProduct,
  type ProductVariant, type InsertProductVariant, type CourierPartner, type InsertCourierPartner,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type StockMovement, type InsertStockMovement, type Complaint, type InsertComplaint,
  type ComplaintTimeline, type InsertComplaintTimeline, type InternalDelivery, type InsertInternalDelivery,
  type DeliveryEvent, type InsertDeliveryEvent, type BulkUploadJob, type InsertBulkUploadJob,
  type AuditLog, type InsertAuditLog, type Setting, type InsertSetting,
  type UserWithRole, type RoleWithPermissions, type ProductWithVariants,
  type OrderWithItems, type ComplaintWithTimeline, type InternalDeliveryWithDetails,
  type B2BClient, type InsertB2BClient, type B2BOrder, type InsertB2BOrder,
  type B2BOrderItem, type InsertB2BOrderItem, type B2BOrderArtwork, type InsertB2BOrderArtwork,
  type B2BOrderStatusHistory, type InsertB2BOrderStatusHistory,
  type B2BInvoice, type InsertB2BInvoice, type B2BPaymentMilestone, type InsertB2BPaymentMilestone,
  type B2BPayment, type InsertB2BPayment, type B2BOrderWithDetails,
  PERMISSION_CODES
} from "@shared/schema";
import { hash, compare } from "bcrypt";

const SALT_ROUNDS = 10;

export interface IStorage {
  // Permissions
  getPermissions(): Promise<Permission[]>;
  getPermissionByCode(code: string): Promise<Permission | undefined>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  
  // Roles
  getRoles(): Promise<Role[]>;
  getRoleById(id: string): Promise<Role | undefined>;
  getRoleWithPermissions(id: string): Promise<RoleWithPermissions | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: string): Promise<boolean>;
  
  // Role Permissions
  assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission>;
  removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean>;
  getRolePermissions(roleId: string): Promise<Permission[]>;
  setRolePermissions(roleId: string, permissionIds: string[]): Promise<void>;
  
  // Users
  getUsers(): Promise<UserWithRole[]>;
  getUserById(id: string): Promise<UserWithRole | undefined>;
  getUserByEmail(email: string): Promise<UserWithRole | undefined>;
  createUser(user: Omit<InsertUser, "password"> & { plainPassword: string }): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  validateUserPassword(email: string, password: string): Promise<UserWithRole | null>;
  getUserPermissions(userId: string): Promise<string[]>;
  
  // Sessions
  createSession(userId: string, expiresAt: Date): Promise<string>;
  getSession(sessionId: string): Promise<{ userId: string; expiresAt: Date } | undefined>;
  deleteSession(sessionId: string): Promise<boolean>;
  deleteUserSessions(userId: string): Promise<boolean>;
  
  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplierById(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<boolean>;
  
  // Products
  getProducts(): Promise<ProductWithVariants[]>;
  getProductById(id: string): Promise<ProductWithVariants | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Product Variants
  getProductVariants(productId: string): Promise<ProductVariant[]>;
  getProductVariantById(id: string): Promise<ProductVariant | undefined>;
  getProductVariantBySku(sku: string): Promise<ProductVariant | undefined>;
  createProductVariant(variant: InsertProductVariant): Promise<ProductVariant>;
  updateProductVariant(id: string, variant: Partial<InsertProductVariant>): Promise<ProductVariant | undefined>;
  deleteProductVariant(id: string): Promise<boolean>;
  updateStock(variantId: string, quantity: number, type: "inward" | "outward" | "adjustment"): Promise<ProductVariant | undefined>;
  
  // Courier Partners
  getCourierPartners(): Promise<CourierPartner[]>;
  getCourierPartnerById(id: string): Promise<CourierPartner | undefined>;
  getCourierPartnerByCode(code: string): Promise<CourierPartner | undefined>;
  createCourierPartner(courier: InsertCourierPartner): Promise<CourierPartner>;
  updateCourierPartner(id: string, courier: Partial<InsertCourierPartner>): Promise<CourierPartner | undefined>;
  deleteCourierPartner(id: string): Promise<boolean>;
  
  // Orders
  getOrders(filters?: OrderFilters): Promise<OrderWithItems[]>;
  getOrderById(id: string): Promise<OrderWithItems | undefined>;
  getOrderByNumber(orderNumber: string): Promise<OrderWithItems | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  updateOrderStatus(id: string, status: Order["status"], comment?: string, userId?: string): Promise<Order | undefined>;
  bulkUpdateOrderStatuses(updates: BulkStatusUpdate[], userId?: string): Promise<BulkStatusUpdateResult>;
  deleteOrder(id: string): Promise<boolean>;
  getOrderStatusHistory(orderId: string): Promise<any[]>;
  
  // Stock Movements
  getStockMovements(filters?: StockMovementFilters): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
  
  // Complaints
  getComplaints(filters?: ComplaintFilters): Promise<ComplaintWithTimeline[]>;
  getComplaintById(id: string): Promise<ComplaintWithTimeline | undefined>;
  getComplaintByTicketNumber(ticketNumber: string): Promise<ComplaintWithTimeline | undefined>;
  createComplaint(complaint: InsertComplaint): Promise<Complaint>;
  updateComplaint(id: string, complaint: Partial<InsertComplaint>): Promise<Complaint | undefined>;
  addComplaintTimelineEntry(entry: InsertComplaintTimeline): Promise<ComplaintTimeline>;
  
  // Internal Deliveries
  getInternalDeliveries(filters?: DeliveryFilters): Promise<InternalDeliveryWithDetails[]>;
  getInternalDeliveryById(id: string): Promise<InternalDeliveryWithDetails | undefined>;
  createInternalDelivery(delivery: InsertInternalDelivery): Promise<InternalDelivery>;
  updateInternalDelivery(id: string, delivery: Partial<InsertInternalDelivery>): Promise<InternalDelivery | undefined>;
  addDeliveryEvent(event: InsertDeliveryEvent): Promise<DeliveryEvent>;
  
  // Bulk Upload Jobs
  getBulkUploadJobs(): Promise<BulkUploadJob[]>;
  getBulkUploadJobById(id: string): Promise<BulkUploadJob | undefined>;
  createBulkUploadJob(job: InsertBulkUploadJob): Promise<BulkUploadJob>;
  updateBulkUploadJob(id: string, job: Partial<BulkUploadJob>): Promise<BulkUploadJob | undefined>;
  
  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: AuditLogFilters): Promise<AuditLog[]>;
  
  // Settings
  getSetting(key: string): Promise<Setting | undefined>;
  getSettings(): Promise<Setting[]>;
  setSetting(key: string, value: any, description?: string): Promise<Setting>;
  
  // Seed data
  seedDefaultData(): Promise<void>;
  
  // B2B Clients
  getB2BClients(filters?: B2BClientFilters): Promise<B2BClient[]>;
  getB2BClientById(id: string): Promise<B2BClient | undefined>;
  createB2BClient(client: InsertB2BClient): Promise<B2BClient>;
  updateB2BClient(id: string, client: Partial<InsertB2BClient>): Promise<B2BClient | undefined>;
  deleteB2BClient(id: string): Promise<boolean>;
  
  // B2B Orders
  getB2BOrders(filters?: B2BOrderFilters): Promise<B2BOrderWithDetails[]>;
  getB2BOrderById(id: string): Promise<B2BOrderWithDetails | undefined>;
  getB2BOrderByNumber(orderNumber: string): Promise<B2BOrderWithDetails | undefined>;
  createB2BOrder(order: InsertB2BOrder, items: InsertB2BOrderItem[]): Promise<B2BOrderWithDetails>;
  updateB2BOrder(id: string, order: Partial<InsertB2BOrder>): Promise<B2BOrder | undefined>;
  updateB2BOrderStatus(id: string, status: B2BOrder["status"], comment?: string, userId?: string): Promise<B2BOrder | undefined>;
  deleteB2BOrder(id: string): Promise<boolean>;
  
  // B2B Order Artwork
  addB2BOrderArtwork(artwork: InsertB2BOrderArtwork): Promise<B2BOrderArtwork>;
  getB2BOrderArtworkById(id: string): Promise<B2BOrderArtwork | undefined>;
  deleteB2BOrderArtwork(id: string): Promise<boolean>;
  
  // B2B Invoices
  getB2BInvoices(filters?: B2BInvoiceFilters): Promise<B2BInvoice[]>;
  getB2BInvoiceById(id: string): Promise<B2BInvoice | undefined>;
  createB2BInvoice(invoice: InsertB2BInvoice): Promise<B2BInvoice>;
  updateB2BInvoice(id: string, invoice: Partial<InsertB2BInvoice>): Promise<B2BInvoice | undefined>;
  
  // B2B Payments
  getB2BPayments(orderId?: string, createdBy?: string): Promise<B2BPayment[]>;
  createB2BPayment(payment: InsertB2BPayment): Promise<B2BPayment>;
  
  // B2B Payment Milestones
  getB2BPaymentMilestones(orderId: string): Promise<B2BPaymentMilestone[]>;
  getB2BPaymentMilestoneById(id: string): Promise<B2BPaymentMilestone | undefined>;
  createB2BPaymentMilestone(milestone: InsertB2BPaymentMilestone): Promise<B2BPaymentMilestone>;
  updateB2BPaymentMilestone(id: string, milestone: Partial<InsertB2BPaymentMilestone>): Promise<B2BPaymentMilestone | undefined>;
  
  // B2B Dashboard Stats
  getB2BDashboardStats(createdBy?: string): Promise<B2BDashboardStats>;
}

interface OrderFilters {
  status?: Order["status"];
  paymentStatus?: Order["paymentStatus"];
  courierType?: Order["courierType"];
  fromDate?: Date;
  toDate?: Date;
  search?: string;
}

interface StockMovementFilters {
  type?: StockMovement["type"];
  variantId?: string;
  supplierId?: string;
  fromDate?: Date;
  toDate?: Date;
}

interface ComplaintFilters {
  status?: Complaint["status"];
  reason?: Complaint["reason"];
  assignedTo?: string;
  fromDate?: Date;
  toDate?: Date;
}

interface DeliveryFilters {
  status?: InternalDelivery["status"];
  assignedTo?: string;
  fromDate?: Date;
  toDate?: Date;
}

interface AuditLogFilters {
  userId?: string;
  module?: string;
  action?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface BulkStatusUpdate {
  orderNumber: string;
  awbNumber?: string;
  newStatus: Order["status"];
  comment?: string;
}

export interface BulkStatusUpdateResult {
  successful: number;
  failed: number;
  errors: Array<{ orderNumber: string; error: string }>;
  updatedOrders: Array<{ orderNumber: string; orderId: string; status: Order["status"] }>;
}

interface B2BOrderFilters {
  status?: B2BOrder["status"];
  paymentStatus?: B2BOrder["paymentStatus"];
  clientId?: string;
  priority?: B2BOrder["priority"];
  fromDate?: Date;
  toDate?: Date;
  search?: string;
  createdBy?: string;
}

interface B2BInvoiceFilters {
  status?: B2BInvoice["status"];
  invoiceType?: B2BInvoice["invoiceType"];
  clientId?: string;
  orderId?: string;
  fromDate?: Date;
  toDate?: Date;
  createdBy?: string;
}

interface B2BClientFilters {
  createdBy?: string;
}

interface B2BPaymentFilters {
  orderId?: string;
  createdBy?: string;
}

export interface B2BDashboardStats {
  totalClients: number;
  activeOrders: number;
  totalOrders: number;
  totalRevenue: number;
  amountReceived: number;
  amountPending: number;
  ordersByStatus: Record<string, number>;
  ordersByPaymentStatus: Record<string, number>;
  recentOrders: B2BOrder[];
  overduePayments: { orderId: string; orderNumber: string; amount: number; dueDate: Date }[];
}

class DatabaseStorage implements IStorage {
  // Permissions
  async getPermissions(): Promise<Permission[]> {
    try {
      const result = await db.select().from(permissions).orderBy(asc(permissions.module), asc(permissions.name));
      return result || [];
    } catch (error) {
      console.log("Error getting permissions:", error);
      return [];
    }
  }

  async getPermissionByCode(code: string): Promise<Permission | undefined> {
    try {
      const result = await db.select().from(permissions).where(eq(permissions.code, code)).limit(1);
      return result?.[0];
    } catch (error) {
      console.log(`Error getting permission ${code}:`, error);
      return undefined;
    }
  }

  async getPermissionById(id: string): Promise<Permission | undefined> {
    try {
      const result = await db.select().from(permissions).where(eq(permissions.id, id)).limit(1);
      return result?.[0];
    } catch (error) {
      console.log(`Error getting permission ${id}:`, error);
      return undefined;
    }
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    const id = crypto.randomUUID();
    await db.insert(permissions).values({ ...permission, id });
    
    const created = await this.getPermissionById(id);
    if (!created) {
      throw new Error("Failed to create permission");
    }
    return created;
  }

  // Roles
  async getRoles(): Promise<Role[]> {
    try {
      const result = await db.select().from(roles).orderBy(asc(roles.name));
      return result || [];
    } catch (error) {
      console.log("Error getting roles:", error);
      return [];
    }
  }

  async getRoleById(id: string): Promise<Role | undefined> {
    try {
      const result = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
      return result?.[0];
    } catch (error) {
      console.log(`Error getting role ${id}:`, error);
      return undefined;
    }
  }

  async getRoleWithPermissions(id: string): Promise<RoleWithPermissions | undefined> {
    const role = await this.getRoleById(id);
    if (!role) return undefined;

    let perms: { rolePermission: RolePermission; permission: Permission }[] = [];
    try {
      const result = await db
        .select({
          rolePermission: rolePermissions,
          permission: permissions,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, id));
      perms = result || [];
    } catch (error) {
      console.log(`Error loading permissions for role ${id}:`, error);
    }

    return {
      ...role,
      rolePermissions: perms.map(p => ({
        ...p.rolePermission,
        permission: p.permission,
      })),
    };
  }

  async createRole(role: InsertRole): Promise<Role> {
    const id = crypto.randomUUID();
    await db.insert(roles).values({ ...role, id });
    
    const result = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
    const created = result?.[0];
    if (!created) {
      throw new Error("Failed to create role");
    }
    return created;
  }

  async updateRole(id: string, role: Partial<InsertRole>): Promise<Role | undefined> {
    const [updated] = await db.update(roles)
      .set({ ...role, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return updated;
  }

  async deleteRole(id: string): Promise<boolean> {
    const role = await this.getRoleById(id);
    if (!role || role.isSystem) return false;
    
    await db.delete(roles).where(eq(roles.id, id));
    return true;
  }

  // Role Permissions
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission> {
    const id = crypto.randomUUID();
    await db.insert(rolePermissions).values({ id, roleId, permissionId });
    
    const result = await db.select().from(rolePermissions).where(eq(rolePermissions.id, id)).limit(1);
    const created = result?.[0];
    if (!created) {
      throw new Error("Failed to assign permission to role");
    }
    return created;
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean> {
    await db.delete(rolePermissions)
      .where(and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, permissionId)
      ));
    return true;
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const result = await db
      .select({ permission: permissions })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));
    
    return result.map(r => r.permission);
  }

  async setRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    
    if (permissionIds.length > 0) {
      await db.insert(rolePermissions)
        .values(permissionIds.map(permissionId => ({ roleId, permissionId })));
    }
  }

  // Users
  async getUsers(): Promise<UserWithRole[]> {
    try {
      const result = await db
        .select()
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .orderBy(asc(users.name));

      const usersWithRoles: UserWithRole[] = [];
      for (const row of (result || [])) {
        const isSuperAdmin = await getBooleanValue('users', 'is_super_admin', 'id', row.users.id);
        const role = row.roles ? await this.getRoleWithPermissions(row.roles.id) ?? null : null;
        usersWithRoles.push({
          ...row.users,
          isSuperAdmin,
          role,
        });
      }
      return usersWithRoles;
    } catch (error) {
      console.log("Error getting users:", error);
      return [];
    }
  }

  async getUserById(id: string): Promise<UserWithRole | undefined> {
    try {
      const queryResult = await db
        .select()
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(eq(users.id, id))
        .limit(1);

      const result = queryResult?.[0];
      if (!result) return undefined;

      const isSuperAdmin = await getBooleanValue('users', 'is_super_admin', 'id', id);
      const role = result.roles ? await this.getRoleWithPermissions(result.roles.id) ?? null : null;
      return {
        ...result.users,
        isSuperAdmin,
        role,
      };
    } catch (error) {
      console.log(`Error getting user by id ${id}:`, error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<UserWithRole | undefined> {
    try {
      const queryResult = await db
        .select()
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(eq(users.email, email))
        .limit(1);

      const result = queryResult?.[0];
      if (!result) return undefined;

      const isSuperAdmin = await getBooleanValue('users', 'is_super_admin', 'id', result.users.id);
      const role = result.roles ? await this.getRoleWithPermissions(result.roles.id) ?? null : null;
      return {
        ...result.users,
        isSuperAdmin,
        role,
      };
    } catch (error) {
      console.log(`Error getting user by email ${email}:`, error);
      return undefined;
    }
  }

  async createUser(user: Omit<InsertUser, "password"> & { plainPassword: string }): Promise<User> {
    const hashedPassword = await hash(user.plainPassword, SALT_ROUNDS);
    const { plainPassword, ...userData } = user;
    const userId = randomUUID();
    
    await db.insert(users)
      .values({ id: userId, ...userData, password: hashedPassword });
    
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const created = result?.[0];
    
    if (!created) {
      throw new Error("Failed to create user");
    }
    
    const isSuperAdmin = await getBooleanValue('users', 'is_super_admin', 'id', userId);
    return { ...created, isSuperAdmin };
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    if (!updated) return undefined;
    
    const isSuperAdmin = await getBooleanValue('users', 'is_super_admin', 'id', id);
    return { ...updated, isSuperAdmin };
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = await this.getUserById(id);
    if (!user || user.isSuperAdmin) return false;
    
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async validateUserPassword(email: string, password: string): Promise<UserWithRole | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await compare(password, user.password);
    if (!isValid) return null;

    return user;
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.getUserById(userId);
    if (!user) return [];
    
    if (user.isSuperAdmin) {
      return Object.values(PERMISSION_CODES);
    }

    if (!user.role) return [];
    
    return user.role.rolePermissions.map(rp => rp.permission.code);
  }

  // Sessions
  async createSession(userId: string, expiresAt: Date): Promise<string> {
    try {
      const sessionId = randomUUID();
      await db.insert(sessions)
        .values({ id: sessionId, userId, expiresAt });
      return sessionId;
    } catch (error) {
      console.log("Error creating session:", error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<{ userId: string; expiresAt: Date } | undefined> {
    try {
      const result = await db.select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);
      
      const session = result?.[0];
      if (!session) return undefined;
      return { userId: session.userId, expiresAt: session.expiresAt };
    } catch (error) {
      console.log(`Error getting session ${sessionId}:`, error);
      return undefined;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return true;
  }

  async deleteUserSessions(userId: string): Promise<boolean> {
    await db.delete(sessions).where(eq(sessions.userId, userId));
    return true;
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    try {
      const result = await db.select().from(suppliers).orderBy(asc(suppliers.name));
      return result || [];
    } catch (error) {
      console.log("Error getting suppliers:", error);
      return [];
    }
  }

  async getSupplierById(id: string): Promise<Supplier | undefined> {
    try {
      const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
      return result?.[0];
    } catch (error) {
      console.log(`Error getting supplier ${id}:`, error);
      return undefined;
    }
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const id = crypto.randomUUID();
    await db.insert(suppliers).values({ ...supplier, id });
    
    const created = await this.getSupplierById(id);
    if (!created) {
      throw new Error("Failed to create supplier");
    }
    return created;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [updated] = await db.update(suppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return updated;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
    return true;
  }

  // Products
  async getProducts(): Promise<ProductWithVariants[]> {
    try {
      const prods = await db.select().from(products).orderBy(asc(products.name));
      if (!prods || prods.length === 0) return [];
      
      const result: ProductWithVariants[] = [];
      
      for (const prod of prods) {
        const variants = await db.select()
          .from(productVariants)
          .where(eq(productVariants.productId, prod.id));
        result.push({ ...prod, variants: variants || [] });
      }
      
      return result;
    } catch (error) {
      console.log("Error getting products:", error);
      return [];
    }
  }

  async getProductById(id: string): Promise<ProductWithVariants | undefined> {
    try {
      const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
      const prod = result?.[0];
      if (!prod) return undefined;

      const variants = await db.select()
        .from(productVariants)
        .where(eq(productVariants.productId, id));
      
      return { ...prod, variants: variants || [] };
    } catch (error) {
      console.log(`Error getting product ${id}:`, error);
      return undefined;
    }
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = crypto.randomUUID();
    await db.insert(products).values({ ...product, id });
    
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    const created = result?.[0];
    if (!created) {
      throw new Error("Failed to create product");
    }
    return created;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    return true;
  }

  // Product Variants
  async getProductVariants(productId: string): Promise<ProductVariant[]> {
    try {
      const result = await db.select().from(productVariants).where(eq(productVariants.productId, productId));
      return result || [];
    } catch (error) {
      console.log(`Error getting product variants for ${productId}:`, error);
      return [];
    }
  }

  async getProductVariantById(id: string): Promise<ProductVariant | undefined> {
    try {
      const result = await db.select().from(productVariants).where(eq(productVariants.id, id)).limit(1);
      return result?.[0];
    } catch (error) {
      console.log(`Error getting product variant ${id}:`, error);
      return undefined;
    }
  }

  async getProductVariantBySku(sku: string): Promise<ProductVariant | undefined> {
    try {
      const result = await db.select().from(productVariants).where(eq(productVariants.sku, sku)).limit(1);
      return result?.[0];
    } catch (error) {
      console.log(`Error getting product variant by SKU ${sku}:`, error);
      return undefined;
    }
  }

  async createProductVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const id = crypto.randomUUID();
    await db.insert(productVariants).values({ ...variant, id });
    
    const created = await this.getProductVariantById(id);
    if (!created) {
      throw new Error("Failed to create product variant");
    }
    return created;
  }

  async updateProductVariant(id: string, variant: Partial<InsertProductVariant>): Promise<ProductVariant | undefined> {
    const [updated] = await db.update(productVariants)
      .set({ ...variant, updatedAt: new Date() })
      .where(eq(productVariants.id, id))
      .returning();
    return updated;
  }

  async deleteProductVariant(id: string): Promise<boolean> {
    await db.delete(productVariants).where(eq(productVariants.id, id));
    return true;
  }

  async updateStock(variantId: string, quantity: number, type: "inward" | "outward" | "adjustment"): Promise<ProductVariant | undefined> {
    const variant = await this.getProductVariantById(variantId);
    if (!variant) return undefined;

    let newQuantity: number;
    if (type === "inward") {
      newQuantity = variant.stockQuantity + quantity;
    } else if (type === "outward") {
      newQuantity = variant.stockQuantity - quantity;
    } else {
      newQuantity = quantity;
    }

    return this.updateProductVariant(variantId, { stockQuantity: newQuantity });
  }

  // Courier Partners
  async getCourierPartners(): Promise<CourierPartner[]> {
    try {
      const result = await db.select().from(courierPartners).orderBy(asc(courierPartners.name));
      return result || [];
    } catch (error) {
      console.log("Error getting courier partners:", error);
      return [];
    }
  }

  async getCourierPartnerById(id: string): Promise<CourierPartner | undefined> {
    try {
      const result = await db.select().from(courierPartners).where(eq(courierPartners.id, id)).limit(1);
      return result?.[0];
    } catch (error) {
      console.log(`Error getting courier partner ${id}:`, error);
      return undefined;
    }
  }

  async getCourierPartnerByCode(code: string): Promise<CourierPartner | undefined> {
    try {
      const result = await db.select().from(courierPartners).where(eq(courierPartners.code, code)).limit(1);
      return result?.[0];
    } catch (error) {
      console.log(`Error getting courier partner by code ${code}:`, error);
      return undefined;
    }
  }

  async createCourierPartner(courier: InsertCourierPartner): Promise<CourierPartner> {
    const id = crypto.randomUUID();
    await db.insert(courierPartners).values({ ...courier, id });
    
    const created = await this.getCourierPartnerById(id);
    if (!created) {
      throw new Error("Failed to create courier partner");
    }
    return created;
  }

  async updateCourierPartner(id: string, courier: Partial<InsertCourierPartner>): Promise<CourierPartner | undefined> {
    const [updated] = await db.update(courierPartners)
      .set({ ...courier, updatedAt: new Date() })
      .where(eq(courierPartners.id, id))
      .returning();
    return updated;
  }

  async deleteCourierPartner(id: string): Promise<boolean> {
    await db.delete(courierPartners).where(eq(courierPartners.id, id));
    return true;
  }

  // Orders
  async getOrders(filters?: OrderFilters): Promise<OrderWithItems[]> {
    try {
      const conditions = [];
      if (filters?.status) {
        conditions.push(eq(orders.status, filters.status));
      }
      if (filters?.paymentStatus) {
        conditions.push(eq(orders.paymentStatus, filters.paymentStatus));
      }
      if (filters?.courierType) {
        conditions.push(eq(orders.courierType, filters.courierType));
      }
      if (filters?.fromDate) {
        conditions.push(gte(orders.createdAt, filters.fromDate));
      }
      if (filters?.toDate) {
        conditions.push(lte(orders.createdAt, filters.toDate));
      }
      if (filters?.search) {
        conditions.push(or(
          like(orders.orderNumber, `%${filters.search}%`),
          like(orders.customerName, `%${filters.search}%`),
          like(orders.customerPhone, `%${filters.search}%`)
        ));
      }

      const ordersResult = conditions.length > 0
        ? await db.select().from(orders).where(and(...conditions)).orderBy(desc(orders.createdAt))
        : await db.select().from(orders).orderBy(desc(orders.createdAt));

      if (!ordersResult || ordersResult.length === 0) return [];

      const result: OrderWithItems[] = [];
      for (const ord of ordersResult) {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, ord.id));
        const courierPartner = ord.courierPartnerId 
          ? await this.getCourierPartnerById(ord.courierPartnerId) 
          : null;
        const assignedUser = ord.assignedTo
          ? await db.select().from(users).where(eq(users.id, ord.assignedTo)).then(r => r?.[0])
          : null;
        
        result.push({ 
          ...ord, 
          items: items || [], 
          courierPartner,
          assignedUser
        });
      }
      
      return result;
    } catch (error) {
      console.log("Error getting orders:", error);
      return [];
    }
  }

  async getOrderById(id: string): Promise<OrderWithItems | undefined> {
    const [ord] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!ord) return undefined;

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    const courierPartner = ord.courierPartnerId 
      ? await this.getCourierPartnerById(ord.courierPartnerId) 
      : null;
    const assignedUser = ord.assignedTo
      ? await db.select().from(users).where(eq(users.id, ord.assignedTo)).then(r => r[0])
      : null;
    
    return { ...ord, items, courierPartner, assignedUser };
  }

  async getOrderByNumber(orderNumber: string): Promise<OrderWithItems | undefined> {
    const [ord] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
    if (!ord) return undefined;

    return this.getOrderById(ord.id);
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems> {
    const orderId = crypto.randomUUID();
    await db.insert(orders).values({ ...order, id: orderId });
    
    const orderResult = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    const created = orderResult?.[0];
    if (!created) {
      throw new Error("Failed to create order");
    }
    
    const createdItems: OrderItem[] = [];
    for (const item of items) {
      const itemId = crypto.randomUUID();
      await db.insert(orderItems).values({ ...item, id: itemId, orderId: created.id });
      const itemResult = await db.select().from(orderItems).where(eq(orderItems.id, itemId)).limit(1);
      if (itemResult?.[0]) {
        createdItems.push(itemResult[0]);
      }
    }

    await db.insert(orderStatusHistory).values({
      id: crypto.randomUUID(),
      orderId: created.id,
      status: created.status,
      comment: "Order created",
    });

    return { ...created, items: createdItems };
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updated] = await db.update(orders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async updateOrderStatus(id: string, status: Order["status"], comment?: string, userId?: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    if (updated) {
      await db.insert(orderStatusHistory).values({
        orderId: id,
        status,
        comment,
        changedBy: userId,
      });
    }

    return updated;
  }

  async bulkUpdateOrderStatuses(updates: BulkStatusUpdate[], userId?: string): Promise<BulkStatusUpdateResult> {
    const result: BulkStatusUpdateResult = {
      successful: 0,
      failed: 0,
      errors: [],
      updatedOrders: [],
    };

    for (const update of updates) {
      try {
        const order = await this.getOrderByNumber(update.orderNumber);
        if (!order) {
          result.failed++;
          result.errors.push({ orderNumber: update.orderNumber, error: "Order not found" });
          continue;
        }

        if (update.awbNumber && order.awbNumber !== update.awbNumber) {
          await db.update(orders)
            .set({ awbNumber: update.awbNumber, updatedAt: new Date() })
            .where(eq(orders.id, order.id));
        }

        const updatedOrder = await this.updateOrderStatus(
          order.id,
          update.newStatus,
          update.comment || `Status updated via bulk import`,
          userId
        );

        if (updatedOrder) {
          result.successful++;
          result.updatedOrders.push({
            orderNumber: update.orderNumber,
            orderId: order.id,
            status: update.newStatus,
          });
        } else {
          result.failed++;
          result.errors.push({ orderNumber: update.orderNumber, error: "Failed to update order status" });
        }
      } catch (error: any) {
        result.failed++;
        result.errors.push({ orderNumber: update.orderNumber, error: error.message || "Unknown error" });
      }
    }

    return result;
  }

  async deleteOrder(id: string): Promise<boolean> {
    await db.delete(orders).where(eq(orders.id, id));
    return true;
  }

  async getOrderStatusHistory(orderId: string): Promise<any[]> {
    return db.select()
      .from(orderStatusHistory)
      .leftJoin(users, eq(orderStatusHistory.changedBy, users.id))
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(desc(orderStatusHistory.createdAt));
  }

  // Stock Movements
  async getStockMovements(filters?: StockMovementFilters): Promise<StockMovement[]> {
    try {
      const conditions = [];
      if (filters?.type) {
        conditions.push(eq(stockMovements.type, filters.type));
      }
      if (filters?.variantId) {
        conditions.push(eq(stockMovements.productVariantId, filters.variantId));
      }
      if (filters?.supplierId) {
        conditions.push(eq(stockMovements.supplierId, filters.supplierId));
      }
      if (filters?.fromDate) {
        conditions.push(gte(stockMovements.createdAt, filters.fromDate));
      }
      if (filters?.toDate) {
        conditions.push(lte(stockMovements.createdAt, filters.toDate));
      }

      const result = conditions.length > 0
        ? await db.select().from(stockMovements).where(and(...conditions)).orderBy(desc(stockMovements.createdAt))
        : await db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt));
      
      return result || [];
    } catch (error) {
      console.log("Error getting stock movements:", error);
      return [];
    }
  }

  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    const id = crypto.randomUUID();
    await db.insert(stockMovements).values({ ...movement, id });
    
    const result = await db.select().from(stockMovements).where(eq(stockMovements.id, id)).limit(1);
    const created = result?.[0];
    if (!created) {
      throw new Error("Failed to create stock movement");
    }
    return created;
  }

  // Complaints
  async getComplaints(filters?: ComplaintFilters): Promise<ComplaintWithTimeline[]> {
    try {
      const conditions = [];
      if (filters?.status) {
        conditions.push(eq(complaints.status, filters.status));
      }
      if (filters?.reason) {
        conditions.push(eq(complaints.reason, filters.reason));
      }
      if (filters?.assignedTo) {
        conditions.push(eq(complaints.assignedTo, filters.assignedTo));
      }
      if (filters?.fromDate) {
        conditions.push(gte(complaints.createdAt, filters.fromDate));
      }
      if (filters?.toDate) {
        conditions.push(lte(complaints.createdAt, filters.toDate));
      }

      const complaintsResult = conditions.length > 0
        ? await db.select().from(complaints).where(and(...conditions)).orderBy(desc(complaints.createdAt))
        : await db.select().from(complaints).orderBy(desc(complaints.createdAt));

      if (!complaintsResult || complaintsResult.length === 0) return [];

      const result: ComplaintWithTimeline[] = [];
      for (const comp of complaintsResult) {
        const timeline = await db.select()
          .from(complaintTimeline)
          .where(eq(complaintTimeline.complaintId, comp.id))
          .orderBy(asc(complaintTimeline.createdAt));
        
        const order = await this.getOrderById(comp.orderId);
        const assignedUser = comp.assignedTo
          ? await db.select().from(users).where(eq(users.id, comp.assignedTo)).then(r => r?.[0])
          : null;
        
        result.push({ ...comp, timeline: timeline || [], order, assignedUser });
      }
      
      return result;
    } catch (error) {
      console.log("Error getting complaints:", error);
      return [];
    }
  }

  async getComplaintById(id: string): Promise<ComplaintWithTimeline | undefined> {
    const [comp] = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1);
    if (!comp) return undefined;

    const timeline = await db.select()
      .from(complaintTimeline)
      .where(eq(complaintTimeline.complaintId, id))
      .orderBy(asc(complaintTimeline.createdAt));
    
    const order = await this.getOrderById(comp.orderId);
    const assignedUser = comp.assignedTo
      ? await db.select().from(users).where(eq(users.id, comp.assignedTo)).then(r => r[0])
      : null;
    
    return { ...comp, timeline, order, assignedUser };
  }

  async getComplaintByTicketNumber(ticketNumber: string): Promise<ComplaintWithTimeline | undefined> {
    const [comp] = await db.select().from(complaints).where(eq(complaints.ticketNumber, ticketNumber)).limit(1);
    if (!comp) return undefined;
    return this.getComplaintById(comp.id);
  }

  async createComplaint(complaint: InsertComplaint): Promise<Complaint> {
    const id = crypto.randomUUID();
    await db.insert(complaints).values({ ...complaint, id });
    
    const result = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1);
    const created = result?.[0];
    if (!created) {
      throw new Error("Failed to create complaint");
    }
    return created;
  }

  async updateComplaint(id: string, complaint: Partial<InsertComplaint>): Promise<Complaint | undefined> {
    const updateData: any = { ...complaint, updatedAt: new Date() };
    if (complaint.status === "resolved" || complaint.status === "rejected") {
      updateData.resolvedAt = new Date();
    }
    
    const [updated] = await db.update(complaints)
      .set(updateData)
      .where(eq(complaints.id, id))
      .returning();
    return updated;
  }

  async addComplaintTimelineEntry(entry: InsertComplaintTimeline): Promise<ComplaintTimeline> {
    const id = crypto.randomUUID();
    await db.insert(complaintTimeline).values({ ...entry, id });
    
    const result = await db.select().from(complaintTimeline).where(eq(complaintTimeline.id, id)).limit(1);
    const created = result?.[0];
    if (!created) {
      throw new Error("Failed to create complaint timeline entry");
    }
    return created;
  }

  // Internal Deliveries
  async getInternalDeliveries(filters?: DeliveryFilters): Promise<InternalDeliveryWithDetails[]> {
    try {
      const conditions = [];
      if (filters?.status) {
        conditions.push(eq(internalDeliveries.status, filters.status));
      }
      if (filters?.assignedTo) {
        conditions.push(eq(internalDeliveries.assignedTo, filters.assignedTo));
      }
      if (filters?.fromDate) {
        conditions.push(gte(internalDeliveries.createdAt, filters.fromDate));
      }
      if (filters?.toDate) {
        conditions.push(lte(internalDeliveries.createdAt, filters.toDate));
      }

      const deliveriesResult = conditions.length > 0
        ? await db.select().from(internalDeliveries).where(and(...conditions)).orderBy(desc(internalDeliveries.createdAt))
        : await db.select().from(internalDeliveries).orderBy(desc(internalDeliveries.createdAt));

      if (!deliveriesResult || deliveriesResult.length === 0) return [];

      const result: InternalDeliveryWithDetails[] = [];
      for (const del of deliveriesResult) {
        const order = await this.getOrderById(del.orderId);
        const userResult = await db.select().from(users).where(eq(users.id, del.assignedTo)).limit(1);
        const assignedUser = userResult?.[0];
        const events = await db.select()
          .from(deliveryEvents)
          .where(eq(deliveryEvents.deliveryId, del.id))
          .orderBy(asc(deliveryEvents.createdAt));
        
        if (order && assignedUser) {
          result.push({ ...del, order, assignedUser, events: events || [] });
        }
      }
      
      return result;
    } catch (error) {
      console.log("Error getting internal deliveries:", error);
      return [];
    }
  }

  async getInternalDeliveryById(id: string): Promise<InternalDeliveryWithDetails | undefined> {
    const [del] = await db.select().from(internalDeliveries).where(eq(internalDeliveries.id, id)).limit(1);
    if (!del) return undefined;

    const order = await this.getOrderById(del.orderId);
    const [assignedUser] = await db.select().from(users).where(eq(users.id, del.assignedTo)).limit(1);
    const events = await db.select()
      .from(deliveryEvents)
      .where(eq(deliveryEvents.deliveryId, id))
      .orderBy(asc(deliveryEvents.createdAt));

    if (!order || !assignedUser) return undefined;
    
    return { ...del, order, assignedUser, events };
  }

  async createInternalDelivery(delivery: InsertInternalDelivery): Promise<InternalDelivery> {
    const id = crypto.randomUUID();
    await db.insert(internalDeliveries).values({ ...delivery, id });
    
    const result = await db.select().from(internalDeliveries).where(eq(internalDeliveries.id, id)).limit(1);
    const created = result?.[0];
    if (!created) {
      throw new Error("Failed to create internal delivery");
    }
    
    await db.insert(deliveryEvents).values({
      id: crypto.randomUUID(),
      deliveryId: created.id,
      event: "Assigned",
      comment: "Delivery assigned to staff",
      createdBy: delivery.assignedTo,
    });
    
    return created;
  }

  async updateInternalDelivery(id: string, delivery: Partial<InsertInternalDelivery>): Promise<InternalDelivery | undefined> {
    const [updated] = await db.update(internalDeliveries)
      .set({ ...delivery, updatedAt: new Date() })
      .where(eq(internalDeliveries.id, id))
      .returning();
    return updated;
  }

  async addDeliveryEvent(event: InsertDeliveryEvent): Promise<DeliveryEvent> {
    const id = crypto.randomUUID();
    await db.insert(deliveryEvents).values({ ...event, id });
    
    const result = await db.select().from(deliveryEvents).where(eq(deliveryEvents.id, id)).limit(1);
    const created = result?.[0];
    if (!created) {
      throw new Error("Failed to create delivery event");
    }
    return created;
  }

  // Bulk Upload Jobs
  async getBulkUploadJobs(): Promise<BulkUploadJob[]> {
    return db.select().from(bulkUploadJobs).orderBy(desc(bulkUploadJobs.createdAt));
  }

  async getBulkUploadJobById(id: string): Promise<BulkUploadJob | undefined> {
    const [job] = await db.select().from(bulkUploadJobs).where(eq(bulkUploadJobs.id, id)).limit(1);
    return job;
  }

  async createBulkUploadJob(job: InsertBulkUploadJob): Promise<BulkUploadJob> {
    const id = crypto.randomUUID();
    await db.insert(bulkUploadJobs).values({ ...job, id });
    
    const created = await this.getBulkUploadJobById(id);
    if (!created) {
      throw new Error("Failed to create bulk upload job");
    }
    return created;
  }

  async updateBulkUploadJob(id: string, job: Partial<BulkUploadJob>): Promise<BulkUploadJob | undefined> {
    const [updated] = await db.update(bulkUploadJobs)
      .set(job)
      .where(eq(bulkUploadJobs.id, id))
      .returning();
    return updated;
  }

  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const id = crypto.randomUUID();
    await db.insert(auditLogs).values({ ...log, id });
    
    const result = await db.select().from(auditLogs).where(eq(auditLogs.id, id)).limit(1);
    const created = result?.[0];
    if (!created) {
      throw new Error("Failed to create audit log");
    }
    return created;
  }

  async getAuditLogs(filters?: AuditLogFilters): Promise<AuditLog[]> {
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    if (filters?.module) {
      conditions.push(eq(auditLogs.module, filters.module));
    }
    if (filters?.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }
    if (filters?.fromDate) {
      conditions.push(gte(auditLogs.createdAt, filters.fromDate));
    }
    if (filters?.toDate) {
      conditions.push(lte(auditLogs.createdAt, filters.toDate));
    }

    return conditions.length > 0
      ? db.select().from(auditLogs).where(and(...conditions)).orderBy(desc(auditLogs.createdAt))
      : db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
  }

  // Settings
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    return setting;
  }

  async getSettings(): Promise<Setting[]> {
    return db.select().from(settings).orderBy(asc(settings.key));
  }

  async setSetting(key: string, value: any, description?: string): Promise<Setting> {
    const existing = await this.getSetting(key);
    if (existing) {
      await db.update(settings)
        .set({ value, description, updatedAt: new Date() })
        .where(eq(settings.key, key));
      
      const updated = await this.getSetting(key);
      if (!updated) {
        throw new Error("Failed to update setting");
      }
      return updated;
    }
    
    const id = crypto.randomUUID();
    await db.insert(settings).values({ id, key, value, description });
    
    const created = await this.getSetting(key);
    if (!created) {
      throw new Error("Failed to create setting");
    }
    return created;
  }

  // B2B Clients
  async getB2BClients(filters?: B2BClientFilters): Promise<B2BClient[]> {
    try {
      const conditions: any[] = [];
      
      if (filters?.createdBy) conditions.push(eq(b2bClients.createdBy, filters.createdBy));
      
      const result = await db.select().from(b2bClients)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(b2bClients.createdAt));
      return result || [];
    } catch (error) {
      console.error("Error fetching B2B clients:", error);
      return [];
    }
  }

  async getB2BClientById(id: string): Promise<B2BClient | undefined> {
    try {
      const result = await db.select().from(b2bClients).where(eq(b2bClients.id, id));
      return result?.[0];
    } catch (error) {
      console.error("Error fetching B2B client:", error);
      return undefined;
    }
  }

  async createB2BClient(client: InsertB2BClient): Promise<B2BClient> {
    const id = randomUUID();
    await db.insert(b2bClients).values({ ...client, id });
    const created = await this.getB2BClientById(id);
    if (!created) throw new Error("Failed to create B2B client");
    return created;
  }

  async updateB2BClient(id: string, client: Partial<InsertB2BClient>): Promise<B2BClient | undefined> {
    await db.update(b2bClients).set({ ...client, updatedAt: new Date() }).where(eq(b2bClients.id, id));
    return this.getB2BClientById(id);
  }

  async deleteB2BClient(id: string): Promise<boolean> {
    const result = await db.delete(b2bClients).where(eq(b2bClients.id, id));
    return true;
  }

  // B2B Orders
  async getB2BOrders(filters?: B2BOrderFilters): Promise<B2BOrderWithDetails[]> {
    try {
      const conditions: any[] = [];
      
      if (filters?.status) conditions.push(eq(b2bOrders.status, filters.status));
      if (filters?.paymentStatus) conditions.push(eq(b2bOrders.paymentStatus, filters.paymentStatus));
      if (filters?.clientId) conditions.push(eq(b2bOrders.clientId, filters.clientId));
      if (filters?.priority) conditions.push(eq(b2bOrders.priority, filters.priority));
      if (filters?.fromDate) conditions.push(gte(b2bOrders.createdAt, filters.fromDate));
      if (filters?.toDate) conditions.push(lte(b2bOrders.createdAt, filters.toDate));
      if (filters?.createdBy) conditions.push(eq(b2bOrders.createdBy, filters.createdBy));
      if (filters?.search) {
        conditions.push(or(
          like(b2bOrders.orderNumber, `%${filters.search}%`)
        ));
      }

      const result = await db.query.b2bOrders.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
          client: true,
          items: true,
          artwork: true,
          statusHistory: true,
          invoices: true,
          payments: true,
          milestones: true,
          courierPartner: true,
        },
        orderBy: [desc(b2bOrders.createdAt)],
      });
      return result || [];
    } catch (error) {
      console.error("Error fetching B2B orders:", error);
      return [];
    }
  }

  async getB2BOrderById(id: string): Promise<B2BOrderWithDetails | undefined> {
    try {
      const result = await db.query.b2bOrders.findFirst({
        where: eq(b2bOrders.id, id),
        with: {
          client: true,
          items: true,
          artwork: true,
          statusHistory: true,
          invoices: true,
          payments: true,
          milestones: true,
          courierPartner: true,
        },
      });
      return result;
    } catch (error) {
      console.error("Error fetching B2B order:", error);
      return undefined;
    }
  }

  async getB2BOrderByNumber(orderNumber: string): Promise<B2BOrderWithDetails | undefined> {
    try {
      const result = await db.query.b2bOrders.findFirst({
        where: eq(b2bOrders.orderNumber, orderNumber),
        with: {
          client: true,
          items: true,
          artwork: true,
          statusHistory: true,
          invoices: true,
          payments: true,
          milestones: true,
          courierPartner: true,
        },
      });
      return result;
    } catch (error) {
      console.error("Error fetching B2B order by number:", error);
      return undefined;
    }
  }

  async createB2BOrder(order: InsertB2BOrder, items: InsertB2BOrderItem[]): Promise<B2BOrderWithDetails> {
    const orderId = randomUUID();
    const orderNumber = `B2B-${Date.now().toString(36).toUpperCase()}`;
    
    await db.insert(b2bOrders).values({ 
      ...order, 
      id: orderId, 
      orderNumber,
      balancePending: order.totalAmount || "0"
    });
    
    for (const item of items) {
      const itemId = randomUUID();
      await db.insert(b2bOrderItems).values({ ...item, id: itemId, orderId });
    }
    
    await db.insert(b2bOrderStatusHistory).values({
      id: randomUUID(),
      orderId,
      status: "order_received",
      comment: "Order created",
      changedBy: order.createdBy,
    });
    
    const created = await this.getB2BOrderById(orderId);
    if (!created) throw new Error("Failed to create B2B order");
    return created;
  }

  async updateB2BOrder(id: string, order: Partial<InsertB2BOrder>): Promise<B2BOrder | undefined> {
    await db.update(b2bOrders).set({ ...order, updatedAt: new Date() }).where(eq(b2bOrders.id, id));
    const result = await db.select().from(b2bOrders).where(eq(b2bOrders.id, id));
    return result?.[0];
  }

  async updateB2BOrderStatus(id: string, status: B2BOrder["status"], comment?: string, userId?: string): Promise<B2BOrder | undefined> {
    await db.update(b2bOrders).set({ status, updatedAt: new Date() }).where(eq(b2bOrders.id, id));
    
    await db.insert(b2bOrderStatusHistory).values({
      id: randomUUID(),
      orderId: id,
      status,
      comment,
      changedBy: userId,
    });
    
    const result = await db.select().from(b2bOrders).where(eq(b2bOrders.id, id));
    return result?.[0];
  }

  async deleteB2BOrder(id: string): Promise<boolean> {
    await db.delete(b2bOrders).where(eq(b2bOrders.id, id));
    return true;
  }

  // B2B Order Artwork
  async addB2BOrderArtwork(artwork: InsertB2BOrderArtwork): Promise<B2BOrderArtwork> {
    const id = randomUUID();
    await db.insert(b2bOrderArtwork).values({ ...artwork, id });
    const result = await db.select().from(b2bOrderArtwork).where(eq(b2bOrderArtwork.id, id));
    if (!result?.[0]) throw new Error("Failed to create artwork");
    return result[0];
  }

  async getB2BOrderArtworkById(id: string): Promise<B2BOrderArtwork | undefined> {
    try {
      const result = await db.select().from(b2bOrderArtwork).where(eq(b2bOrderArtwork.id, id));
      return result?.[0];
    } catch (error) {
      console.error("Error fetching B2B order artwork:", error);
      return undefined;
    }
  }

  async deleteB2BOrderArtwork(id: string): Promise<boolean> {
    await db.delete(b2bOrderArtwork).where(eq(b2bOrderArtwork.id, id));
    return true;
  }

  // B2B Invoices
  async getB2BInvoices(filters?: B2BInvoiceFilters): Promise<B2BInvoice[]> {
    try {
      const conditions: any[] = [];
      
      if (filters?.status) conditions.push(eq(b2bInvoices.status, filters.status));
      if (filters?.invoiceType) conditions.push(eq(b2bInvoices.invoiceType, filters.invoiceType));
      if (filters?.clientId) conditions.push(eq(b2bInvoices.clientId, filters.clientId));
      if (filters?.orderId) conditions.push(eq(b2bInvoices.orderId, filters.orderId));
      if (filters?.fromDate) conditions.push(gte(b2bInvoices.invoiceDate, filters.fromDate));
      if (filters?.toDate) conditions.push(lte(b2bInvoices.invoiceDate, filters.toDate));
      if (filters?.createdBy) conditions.push(eq(b2bInvoices.createdBy, filters.createdBy));

      const result = await db.select().from(b2bInvoices)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(b2bInvoices.invoiceDate));
      return result || [];
    } catch (error) {
      console.error("Error fetching B2B invoices:", error);
      return [];
    }
  }

  async getB2BInvoiceById(id: string): Promise<B2BInvoice | undefined> {
    try {
      const result = await db.select().from(b2bInvoices).where(eq(b2bInvoices.id, id));
      return result?.[0];
    } catch (error) {
      console.error("Error fetching B2B invoice:", error);
      return undefined;
    }
  }

  async createB2BInvoice(invoice: InsertB2BInvoice): Promise<B2BInvoice> {
    const id = randomUUID();
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    
    // Convert date strings to Date objects and ensure monetary fields default to 0
    const invoiceData = {
      ...invoice,
      id,
      invoiceNumber,
      subtotal: invoice.subtotal ?? "0",
      taxAmount: invoice.taxAmount ?? "0",
      discount: invoice.discount ?? "0",
      totalAmount: invoice.totalAmount ?? "0",
      dueDate: invoice.dueDate ? (typeof invoice.dueDate === 'string' ? new Date(invoice.dueDate) : invoice.dueDate) : null,
      invoiceDate: invoice.invoiceDate ? (typeof invoice.invoiceDate === 'string' ? new Date(invoice.invoiceDate) : invoice.invoiceDate) : new Date(),
    };
    
    await db.insert(b2bInvoices).values(invoiceData);
    const created = await this.getB2BInvoiceById(id);
    if (!created) throw new Error("Failed to create B2B invoice");
    return created;
  }

  async updateB2BInvoice(id: string, invoice: Partial<InsertB2BInvoice>): Promise<B2BInvoice | undefined> {
    // Convert date strings to Date objects for database
    const updateData: any = { ...invoice, updatedAt: new Date() };
    if (invoice.dueDate && typeof invoice.dueDate === 'string') {
      updateData.dueDate = new Date(invoice.dueDate);
    }
    if (invoice.invoiceDate && typeof invoice.invoiceDate === 'string') {
      updateData.invoiceDate = new Date(invoice.invoiceDate);
    }
    await db.update(b2bInvoices).set(updateData).where(eq(b2bInvoices.id, id));
    return this.getB2BInvoiceById(id);
  }

  // B2B Payments
  async getB2BPayments(orderId?: string, createdBy?: string): Promise<B2BPayment[]> {
    try {
      // If createdBy is specified, we need to filter payments by order ownership
      if (createdBy) {
        // Join with orders to filter by creator
        const result = await db
          .select({ payment: b2bPayments })
          .from(b2bPayments)
          .innerJoin(b2bOrders, eq(b2bPayments.orderId, b2bOrders.id))
          .where(
            orderId 
              ? and(eq(b2bPayments.orderId, orderId), eq(b2bOrders.createdBy, createdBy))
              : eq(b2bOrders.createdBy, createdBy)
          )
          .orderBy(desc(b2bPayments.paymentDate));
        return (result || []).map(r => r.payment);
      }
      
      if (orderId) {
        const result = await db.select().from(b2bPayments).where(eq(b2bPayments.orderId, orderId)).orderBy(desc(b2bPayments.paymentDate));
        return result || [];
      }
      const result = await db.select().from(b2bPayments).orderBy(desc(b2bPayments.paymentDate));
      return result || [];
    } catch (error) {
      console.error("Error fetching B2B payments:", error);
      return [];
    }
  }

  async createB2BPayment(payment: InsertB2BPayment): Promise<B2BPayment> {
    const id = randomUUID();
    
    // Convert date strings to Date objects for database
    const paymentData = {
      ...payment,
      id,
      paymentDate: payment.paymentDate ? (typeof payment.paymentDate === 'string' ? new Date(payment.paymentDate) : payment.paymentDate) : new Date(),
    };
    
    await db.insert(b2bPayments).values(paymentData);
    
    const order = await this.getB2BOrderById(payment.orderId);
    if (order) {
      const currentReceived = parseFloat(order.amountReceived as string) || 0;
      const paymentAmount = parseFloat(payment.amount as string) || 0;
      const newReceived = currentReceived + paymentAmount;
      const totalAmount = parseFloat(order.totalAmount as string) || 0;
      const newPending = totalAmount - newReceived;
      
      let newPaymentStatus: B2BOrder["paymentStatus"] = "not_paid";
      if (newReceived >= totalAmount) {
        newPaymentStatus = "fully_paid";
      } else if (newReceived > 0 && newReceived < totalAmount * 0.5) {
        newPaymentStatus = "advance_received";
      } else if (newReceived >= totalAmount * 0.5) {
        newPaymentStatus = "partially_paid";
      }
      
      await db.update(b2bOrders).set({
        amountReceived: newReceived.toString(),
        balancePending: Math.max(0, newPending).toString(),
        paymentStatus: newPaymentStatus,
        updatedAt: new Date(),
      }).where(eq(b2bOrders.id, order.id));
    }
    
    const result = await db.select().from(b2bPayments).where(eq(b2bPayments.id, id));
    if (!result?.[0]) throw new Error("Failed to create payment");
    return result[0];
  }

  // B2B Payment Milestones
  async getB2BPaymentMilestones(orderId: string): Promise<B2BPaymentMilestone[]> {
    try {
      const result = await db.select().from(b2bPaymentMilestones).where(eq(b2bPaymentMilestones.orderId, orderId)).orderBy(asc(b2bPaymentMilestones.dueDate));
      return result || [];
    } catch (error) {
      console.error("Error fetching B2B payment milestones:", error);
      return [];
    }
  }

  async getB2BPaymentMilestoneById(id: string): Promise<B2BPaymentMilestone | undefined> {
    try {
      const result = await db.select().from(b2bPaymentMilestones).where(eq(b2bPaymentMilestones.id, id));
      return result?.[0];
    } catch (error) {
      console.error("Error fetching B2B payment milestone:", error);
      return undefined;
    }
  }

  async createB2BPaymentMilestone(milestone: InsertB2BPaymentMilestone): Promise<B2BPaymentMilestone> {
    const id = randomUUID();
    
    // Convert date strings to Date objects for database
    const milestoneData = {
      ...milestone,
      id,
      dueDate: milestone.dueDate ? (typeof milestone.dueDate === 'string' ? new Date(milestone.dueDate) : milestone.dueDate) : null,
      paidAt: milestone.paidAt ? (typeof milestone.paidAt === 'string' ? new Date(milestone.paidAt) : milestone.paidAt) : null,
    };
    
    await db.insert(b2bPaymentMilestones).values(milestoneData);
    const result = await db.select().from(b2bPaymentMilestones).where(eq(b2bPaymentMilestones.id, id));
    if (!result?.[0]) throw new Error("Failed to create milestone");
    return result[0];
  }

  async updateB2BPaymentMilestone(id: string, milestone: Partial<InsertB2BPaymentMilestone>): Promise<B2BPaymentMilestone | undefined> {
    // Convert date strings to Date objects for database
    const updateData: any = { ...milestone };
    if (milestone.dueDate && typeof milestone.dueDate === 'string') {
      updateData.dueDate = new Date(milestone.dueDate);
    }
    if (milestone.paidAt && typeof milestone.paidAt === 'string') {
      updateData.paidAt = new Date(milestone.paidAt);
    }
    await db.update(b2bPaymentMilestones).set(updateData).where(eq(b2bPaymentMilestones.id, id));
    const result = await db.select().from(b2bPaymentMilestones).where(eq(b2bPaymentMilestones.id, id));
    return result?.[0];
  }

  // B2B Dashboard Stats
  async getB2BDashboardStats(createdBy?: string): Promise<B2BDashboardStats> {
    try {
      // Apply ownership filter if createdBy is specified
      const clientConditions = createdBy 
        ? and(eq(b2bClients.status, "active"), eq(b2bClients.createdBy, createdBy))
        : eq(b2bClients.status, "active");
      const [clientCount] = await db.select({ count: count() }).from(b2bClients).where(clientConditions);
      
      const orderConditions = createdBy ? eq(b2bOrders.createdBy, createdBy) : undefined;
      const allOrders = await db.select().from(b2bOrders).where(orderConditions);
      
      const activeStatuses = ["order_received", "design_review", "client_approval", "production_scheduled", "printing_in_progress", "quality_check", "packed"];
      const activeOrders = allOrders.filter(o => activeStatuses.includes(o.status));
      
      const totalRevenue = allOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount as string) || 0), 0);
      const amountReceived = allOrders.reduce((sum, o) => sum + (parseFloat(o.amountReceived as string) || 0), 0);
      const amountPending = allOrders.reduce((sum, o) => sum + (parseFloat(o.balancePending as string) || 0), 0);
      
      const ordersByStatus: Record<string, number> = {};
      const ordersByPaymentStatus: Record<string, number> = {};
      
      for (const order of allOrders) {
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
        ordersByPaymentStatus[order.paymentStatus] = (ordersByPaymentStatus[order.paymentStatus] || 0) + 1;
      }
      
      const recentOrders = allOrders.slice(0, 10);
      
      return {
        totalClients: clientCount?.count || 0,
        activeOrders: activeOrders.length,
        totalOrders: allOrders.length,
        totalRevenue,
        amountReceived,
        amountPending,
        ordersByStatus,
        ordersByPaymentStatus,
        recentOrders,
        overduePayments: [],
      };
    } catch (error) {
      console.error("Error fetching B2B dashboard stats:", error);
      return {
        totalClients: 0,
        activeOrders: 0,
        totalOrders: 0,
        totalRevenue: 0,
        amountReceived: 0,
        amountPending: 0,
        ordersByStatus: {},
        ordersByPaymentStatus: {},
        recentOrders: [],
        overduePayments: [],
      };
    }
  }

  // Seed default data
  async seedDefaultData(): Promise<void> {
    try {
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers && existingUsers.length > 0) {
        console.log("Users already exist, skipping seed");
        return;
      }
    } catch (error) {
      console.log("Checking users table...", error);
    }

    console.log("Seeding default data...");

    const permissionData = [
      { code: "view_dashboard", name: "View Dashboard", description: "Access to main dashboard", module: "dashboard" },
      { code: "view_orders", name: "View Orders", description: "View order list", module: "orders" },
      { code: "create_orders", name: "Create Orders", description: "Create new orders", module: "orders" },
      { code: "edit_orders", name: "Edit Orders", description: "Edit existing orders", module: "orders" },
      { code: "delete_orders", name: "Delete Orders", description: "Delete orders", module: "orders" },
      { code: "dispatch_orders", name: "Dispatch Orders", description: "Dispatch orders to couriers", module: "orders" },
      { code: "import_orders", name: "Import Orders", description: "Bulk import orders", module: "orders" },
      { code: "view_inventory", name: "View Inventory", description: "View inventory levels", module: "inventory" },
      { code: "manage_inventory", name: "Manage Inventory", description: "Add/edit inventory", module: "inventory" },
      { code: "adjust_stock", name: "Adjust Stock", description: "Adjust stock quantities", module: "inventory" },
      { code: "view_products", name: "View Products", description: "View product list", module: "products" },
      { code: "create_products", name: "Create Products", description: "Create new products", module: "products" },
      { code: "edit_products", name: "Edit Products", description: "Edit existing products", module: "products" },
      { code: "delete_products", name: "Delete Products", description: "Delete products", module: "products" },
      { code: "import_products", name: "Import Products", description: "Bulk import products", module: "products" },
      { code: "view_suppliers", name: "View Suppliers", description: "View supplier list", module: "suppliers" },
      { code: "manage_suppliers", name: "Manage Suppliers", description: "Add/edit suppliers", module: "suppliers" },
      { code: "view_complaints", name: "View Complaints", description: "View complaint tickets", module: "complaints" },
      { code: "manage_complaints", name: "Manage Complaints", description: "Handle complaints", module: "complaints" },
      { code: "resolve_complaints", name: "Resolve Complaints", description: "Resolve/reject complaints", module: "complaints" },
      { code: "view_deliveries", name: "View Deliveries", description: "View internal deliveries", module: "deliveries" },
      { code: "manage_deliveries", name: "Manage Deliveries", description: "Manage deliveries", module: "deliveries" },
      { code: "collect_payments", name: "Collect Payments", description: "Collect COD payments", module: "deliveries" },
      { code: "view_users", name: "View Users", description: "View user list", module: "users" },
      { code: "manage_users", name: "Manage Users", description: "Add/edit users", module: "users" },
      { code: "view_roles", name: "View Roles", description: "View role list", module: "roles" },
      { code: "manage_roles", name: "Manage Roles", description: "Add/edit roles", module: "roles" },
      { code: "manage_permissions", name: "Manage Permissions", description: "Assign permissions to roles", module: "roles" },
      { code: "view_settings", name: "View Settings", description: "View system settings", module: "settings" },
      { code: "manage_settings", name: "Manage Settings", description: "Edit system settings", module: "settings" },
      { code: "view_couriers", name: "View Couriers", description: "View courier partners", module: "couriers" },
      { code: "manage_couriers", name: "Manage Couriers", description: "Add/edit couriers", module: "couriers" },
      { code: "manage_courier_status", name: "Manage Courier Status", description: "Bulk update order statuses from courier data", module: "orders" },
      { code: "view_reports", name: "View Reports", description: "View reports", module: "reports" },
      { code: "export_reports", name: "Export Reports", description: "Export reports", module: "reports" },
      { code: "view_b2b_clients", name: "View B2B Clients", description: "View B2B client list", module: "b2b" },
      { code: "manage_b2b_clients", name: "Manage B2B Clients", description: "Add/edit B2B clients", module: "b2b" },
      { code: "view_b2b_orders", name: "View B2B Orders", description: "View B2B order list", module: "b2b" },
      { code: "create_b2b_orders", name: "Create B2B Orders", description: "Create new B2B orders", module: "b2b" },
      { code: "edit_b2b_orders", name: "Edit B2B Orders", description: "Edit existing B2B orders", module: "b2b" },
      { code: "delete_b2b_orders", name: "Delete B2B Orders", description: "Delete B2B orders", module: "b2b" },
      { code: "update_b2b_order_status", name: "Update B2B Order Status", description: "Update B2B order workflow status", module: "b2b" },
      { code: "view_b2b_invoices", name: "View B2B Invoices", description: "View B2B invoices", module: "b2b" },
      { code: "manage_b2b_invoices", name: "Manage B2B Invoices", description: "Create/edit B2B invoices", module: "b2b" },
      { code: "view_b2b_payments", name: "View B2B Payments", description: "View B2B payments", module: "b2b" },
      { code: "manage_b2b_payments", name: "Manage B2B Payments", description: "Record B2B payments", module: "b2b" },
      { code: "view_b2b_dashboard", name: "View B2B Dashboard", description: "View B2B dashboard", module: "b2b" },
      { code: "view_all_b2b_data", name: "View All B2B Data", description: "View all B2B clients, orders, invoices regardless of who created them (for managers)", module: "b2b" },
    ];

    let existingPerms: Permission[] = [];
    try {
      existingPerms = await db.select().from(permissions);
    } catch (error) {
      console.log("Error loading permissions:", error);
    }
    const createdPermissions: Permission[] = [];
    
    if (!existingPerms || existingPerms.length === 0) {
      for (const perm of permissionData) {
        const created = await this.createPermission(perm);
        createdPermissions.push(created);
      }
    } else {
      createdPermissions.push(...existingPerms);
      
      const existingCodes = new Set(existingPerms.map(p => p.code));
      const missingPerms = permissionData.filter(p => !existingCodes.has(p.code));
      
      for (const perm of missingPerms) {
        console.log(`Adding missing permission: ${perm.code}`);
        const created = await this.createPermission(perm);
        createdPermissions.push(created);
      }
    }
    console.log(`Loaded ${createdPermissions.length} permissions`);

    let adminRole: Role | undefined;
    try {
      const result = await db.select().from(roles).where(eq(roles.name, "Admin")).limit(1);
      adminRole = result?.[0];
    } catch (error) {
      console.log("Error loading Admin role:", error);
    }
    if (!adminRole) {
      adminRole = await this.createRole({
        name: "Admin",
        description: "Full system access",
        isSystem: true,
      });
      
      for (const perm of createdPermissions) {
        await this.assignPermissionToRole(adminRole.id, perm.id);
      }
    } else {
      const adminPerms = await this.getRolePermissions(adminRole.id);
      const adminPermCodes = new Set(adminPerms.map(p => p.code));
      
      for (const perm of createdPermissions) {
        if (!adminPermCodes.has(perm.code)) {
          console.log(`Assigning missing permission to Admin: ${perm.code}`);
          await this.assignPermissionToRole(adminRole.id, perm.id);
        }
      }
    }
    console.log(`Admin role: ${adminRole.id}`);

    let csRole: Role | undefined;
    try {
      const result = await db.select().from(roles).where(eq(roles.name, "Customer Support")).limit(1);
      csRole = result?.[0];
    } catch (error) {
      console.log("Error loading Customer Support role:", error);
    }
    if (!csRole) {
      csRole = await this.createRole({
        name: "Customer Support",
        description: "Customer support team",
        isSystem: false,
      });
      const csPermissions = ["view_dashboard", "view_orders", "view_complaints", "manage_complaints", "resolve_complaints"];
      for (const code of csPermissions) {
        const perm = createdPermissions.find(p => p.code === code);
        if (perm) await this.assignPermissionToRole(csRole.id, perm.id);
      }
    }

    let warehouseRole: Role | undefined;
    try {
      const result = await db.select().from(roles).where(eq(roles.name, "Warehouse")).limit(1);
      warehouseRole = result?.[0];
    } catch (error) {
      console.log("Error loading Warehouse role:", error);
    }
    if (!warehouseRole) {
      warehouseRole = await this.createRole({
        name: "Warehouse",
        description: "Warehouse staff",
        isSystem: false,
      });
      const warehousePermissions = ["view_dashboard", "view_orders", "dispatch_orders", "view_inventory", "manage_inventory", "adjust_stock", "view_products"];
      for (const code of warehousePermissions) {
        const perm = createdPermissions.find(p => p.code === code);
        if (perm) await this.assignPermissionToRole(warehouseRole.id, perm.id);
      }
    }

    let stockRole: Role | undefined;
    try {
      const result = await db.select().from(roles).where(eq(roles.name, "Stock Management")).limit(1);
      stockRole = result?.[0];
    } catch (error) {
      console.log("Error loading Stock Management role:", error);
    }
    if (!stockRole) {
      stockRole = await this.createRole({
        name: "Stock Management",
        description: "Stock management team",
        isSystem: false,
      });
      const stockPermissions = ["view_dashboard", "view_inventory", "manage_inventory", "adjust_stock", "view_products", "view_suppliers", "manage_suppliers"];
      for (const code of stockPermissions) {
        const perm = createdPermissions.find(p => p.code === code);
        if (perm) await this.assignPermissionToRole(stockRole.id, perm.id);
      }
    }

    await this.createUser({
      email: "admin@dsscm.com",
      plainPassword: "admin123",
      name: "Super Admin",
      phone: "+91 98765 00000",
      roleId: adminRole.id,
      status: "active",
      isSuperAdmin: true,
    });

    console.log("Default data seeded successfully");
    console.log("Login with: admin@dsscm.com / admin123");
  }
}

export const storage = new DatabaseStorage();
