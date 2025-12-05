import { db, getBooleanValue } from "./db";
import { eq, and, desc, asc, like, inArray, sql, or, isNull, gte, lte, count } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  users, roles, permissions, rolePermissions, sessions,
  suppliers, products, productVariants, courierPartners,
  orders, orderItems, orderStatusHistory, stockMovements,
  complaints, complaintTimeline, internalDeliveries, deliveryEvents,
  bulkUploadJobs, auditLogs, settings,
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
