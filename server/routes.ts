import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { rawQuery } from "./db";
import { z } from "zod";
import {
  insertRoleSchema, insertUserSchema, insertSupplierSchema,
  insertProductSchema, insertProductVariantSchema, insertCourierPartnerSchema,
  insertOrderSchema, insertOrderItemSchema, insertStockMovementSchema,
  insertComplaintSchema, insertComplaintTimelineSchema,
  insertInternalDeliverySchema, insertDeliveryEventSchema,
  PERMISSION_CODES,
  type UserWithRole, type PermissionCode
} from "@shared/schema";
import Papa from "papaparse";
import { delhiveryService, createDelhiveryShipmentFromOrder } from "./services/delhivery";

declare global {
  namespace Express {
    interface Request {
      user?: UserWithRole;
      sessionId?: string;
    }
  }
}

const SESSION_DURATION = 24 * 60 * 60 * 1000;

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.sessionId;
  
  if (!sessionId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const session = await storage.getSession(sessionId);
  if (!session || session.expiresAt < new Date()) {
    return res.status(401).json({ error: "Session expired" });
  }

  const user = await storage.getUserById(session.userId);
  if (!user || user.status !== "active") {
    return res.status(401).json({ error: "User not found or inactive" });
  }

  req.user = user;
  req.sessionId = sessionId;
  next();
}

function requirePermission(...permissions: PermissionCode[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (req.user.isSuperAdmin) {
      return next();
    }

    const userPermissions = await storage.getUserPermissions(req.user.id);
    const hasPermission = permissions.some(p => userPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({ error: "Permission denied" });
    }

    next();
  };
}

function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.isSuperAdmin) {
    return res.status(403).json({ error: "Super admin access required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await storage.seedDefaultData();

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const user = await storage.validateUserPassword(email, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const expiresAt = new Date(Date.now() + SESSION_DURATION);
      const sessionId = await storage.createSession(user.id, expiresAt);

      res.cookie("sessionId", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    const sessionId = req.cookies?.sessionId;
    if (sessionId) {
      await storage.deleteSession(sessionId);
    }
    res.clearCookie("sessionId");
    res.json({ success: true });
  });

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    const { password: _, ...userWithoutPassword } = req.user!;
    res.json({ user: userWithoutPassword });
  });

  app.get("/api/auth/permissions", authMiddleware, async (req, res) => {
    const permissions = await storage.getUserPermissions(req.user!.id);
    res.json({ permissions, isSuperAdmin: req.user!.isSuperAdmin });
  });

  app.get("/api/permissions", authMiddleware, requireSuperAdmin, async (req, res) => {
    const permissions = await storage.getPermissions();
    res.json(permissions);
  });

  app.get("/api/roles", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_ROLES), async (req, res) => {
    const roles = await storage.getRoles();
    res.json(roles);
  });

  app.get("/api/roles/:id", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_ROLES), async (req, res) => {
    const role = await storage.getRoleWithPermissions(req.params.id);
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    res.json(role);
  });

  app.post("/api/roles", authMiddleware, requireSuperAdmin, async (req, res) => {
    try {
      const data = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(data);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: "create",
        module: "roles",
        entityId: role.id,
        entityType: "role",
        newData: role,
      });
      
      res.status(201).json(role);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create role" });
    }
  });

  app.patch("/api/roles/:id", authMiddleware, requireSuperAdmin, async (req, res) => {
    try {
      const oldRole = await storage.getRoleById(req.params.id);
      if (!oldRole) {
        return res.status(404).json({ error: "Role not found" });
      }

      const role = await storage.updateRole(req.params.id, req.body);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: "update",
        module: "roles",
        entityId: req.params.id,
        entityType: "role",
        oldData: oldRole,
        newData: role,
      });
      
      res.json(role);
    } catch (error) {
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  app.delete("/api/roles/:id", authMiddleware, requireSuperAdmin, async (req, res) => {
    const role = await storage.getRoleById(req.params.id);
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    
    if (role.isSystem) {
      return res.status(400).json({ error: "Cannot delete system role" });
    }

    await storage.deleteRole(req.params.id);
    
    await storage.createAuditLog({
      userId: req.user!.id,
      action: "delete",
      module: "roles",
      entityId: req.params.id,
      entityType: "role",
      oldData: role,
    });
    
    res.json({ success: true });
  });

  app.get("/api/roles/:id/permissions", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_ROLES), async (req, res) => {
    const permissions = await storage.getRolePermissions(req.params.id);
    res.json(permissions);
  });

  app.put("/api/roles/:id/permissions", authMiddleware, requireSuperAdmin, async (req, res) => {
    try {
      const { permissionIds } = req.body;
      if (!Array.isArray(permissionIds)) {
        return res.status(400).json({ error: "permissionIds must be an array" });
      }

      await storage.setRolePermissions(req.params.id, permissionIds);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: "update_permissions",
        module: "roles",
        entityId: req.params.id,
        entityType: "role",
        newData: { permissionIds },
      });
      
      const permissions = await storage.getRolePermissions(req.params.id);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to update permissions" });
    }
  });

  app.get("/api/users", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_USERS), async (req, res) => {
    const users = await storage.getUsers();
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  });

  app.get("/api/users/:id", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_USERS), async (req, res) => {
    const user = await storage.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.post("/api/users", authMiddleware, requirePermission(PERMISSION_CODES.MANAGE_USERS), async (req, res) => {
    try {
      const { password, ...userData } = req.body;
      
      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const user = await storage.createUser({ ...userData, plainPassword: password });
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: "create",
        module: "users",
        entityId: user.id,
        entityType: "user",
        newData: { ...user, password: "[HIDDEN]" },
      });
      
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create user error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", authMiddleware, requirePermission(PERMISSION_CODES.MANAGE_USERS), async (req, res) => {
    try {
      const oldUser = await storage.getUserById(req.params.id);
      if (!oldUser) {
        return res.status(404).json({ error: "User not found" });
      }

      if (oldUser.isSuperAdmin && !req.user!.isSuperAdmin) {
        return res.status(403).json({ error: "Cannot modify super admin" });
      }

      const { password, ...updateData } = req.body;
      const user = await storage.updateUser(req.params.id, updateData);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: "update",
        module: "users",
        entityId: req.params.id,
        entityType: "user",
        oldData: { ...oldUser, password: "[HIDDEN]" },
        newData: { ...user, password: "[HIDDEN]" },
      });
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", authMiddleware, requirePermission(PERMISSION_CODES.MANAGE_USERS), async (req, res) => {
    const user = await storage.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (user.isSuperAdmin) {
      return res.status(400).json({ error: "Cannot delete super admin" });
    }

    await storage.deleteUser(req.params.id);
    
    await storage.createAuditLog({
      userId: req.user!.id,
      action: "delete",
      module: "users",
      entityId: req.params.id,
      entityType: "user",
      oldData: { ...user, password: "[HIDDEN]" },
    });
    
    res.json({ success: true });
  });

  app.get("/api/suppliers", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_SUPPLIERS), async (req, res) => {
    const suppliers = await storage.getSuppliers();
    res.json(suppliers);
  });

  app.get("/api/suppliers/:id", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_SUPPLIERS), async (req, res) => {
    const supplier = await storage.getSupplierById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    res.json(supplier);
  });

  app.post("/api/suppliers", authMiddleware, requirePermission(PERMISSION_CODES.MANAGE_SUPPLIERS), async (req, res) => {
    try {
      const data = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(data);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: "create",
        module: "suppliers",
        entityId: supplier.id,
        entityType: "supplier",
        newData: supplier,
      });
      
      res.status(201).json(supplier);
    } catch (error) {
      console.log("Error creating supplier:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });

  app.patch("/api/suppliers/:id", authMiddleware, requirePermission(PERMISSION_CODES.MANAGE_SUPPLIERS), async (req, res) => {
    try {
      const oldSupplier = await storage.getSupplierById(req.params.id);
      if (!oldSupplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      const supplier = await storage.updateSupplier(req.params.id, req.body);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: "update",
        module: "suppliers",
        entityId: req.params.id,
        entityType: "supplier",
        oldData: oldSupplier,
        newData: supplier,
      });
      
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ error: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", authMiddleware, requirePermission(PERMISSION_CODES.MANAGE_SUPPLIERS), async (req, res) => {
    const supplier = await storage.getSupplierById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    await storage.deleteSupplier(req.params.id);
    
    await storage.createAuditLog({
      userId: req.user!.id,
      action: "delete",
      module: "suppliers",
      entityId: req.params.id,
      entityType: "supplier",
      oldData: supplier,
    });
    
    res.json({ success: true });
  });

  app.get("/api/products", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_PRODUCTS), async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get("/api/products/:id", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_PRODUCTS), async (req, res) => {
    const product = await storage.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  });

  app.post("/api/products", authMiddleware, requirePermission(PERMISSION_CODES.CREATE_PRODUCTS), async (req, res) => {
    try {
      const { variants, ...productData } = req.body;
      const data = insertProductSchema.parse(productData);
      const product = await storage.createProduct(data);

      if (variants && Array.isArray(variants)) {
        for (const variant of variants) {
          await storage.createProductVariant({ ...variant, productId: product.id });
        }
      }
      
      const productWithVariants = await storage.getProductById(product.id);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: "create",
        module: "products",
        entityId: product.id,
        entityType: "product",
        newData: productWithVariants,
      });
      
      res.status(201).json(productWithVariants);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create product error:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", authMiddleware, requirePermission(PERMISSION_CODES.EDIT_PRODUCTS), async (req, res) => {
    try {
      const oldProduct = await storage.getProductById(req.params.id);
      if (!oldProduct) {
        return res.status(404).json({ error: "Product not found" });
      }

      const product = await storage.updateProduct(req.params.id, req.body);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: "update",
        module: "products",
        entityId: req.params.id,
        entityType: "product",
        oldData: oldProduct,
        newData: product,
      });
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", authMiddleware, requirePermission(PERMISSION_CODES.DELETE_PRODUCTS), async (req, res) => {
    const product = await storage.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    await storage.deleteProduct(req.params.id);
    
    await storage.createAuditLog({
      userId: req.user!.id,
      action: "delete",
      module: "products",
      entityId: req.params.id,
      entityType: "product",
      oldData: product,
    });
    
    res.json({ success: true });
  });

  app.post("/api/products/:id/variants", authMiddleware, requirePermission(PERMISSION_CODES.EDIT_PRODUCTS), async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const data = insertProductVariantSchema.parse({ ...req.body, productId: req.params.id });
      const variant = await storage.createProductVariant(data);
      
      res.status(201).json(variant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create variant" });
    }
  });

  app.patch("/api/variants/:id", authMiddleware, requirePermission(PERMISSION_CODES.EDIT_PRODUCTS), async (req, res) => {
    try {
      const variant = await storage.updateProductVariant(req.params.id, req.body);
      if (!variant) {
        return res.status(404).json({ error: "Variant not found" });
      }
      res.json(variant);
    } catch (error) {
      res.status(500).json({ error: "Failed to update variant" });
    }
  });

  app.delete("/api/variants/:id", authMiddleware, requirePermission(PERMISSION_CODES.DELETE_PRODUCTS), async (req, res) => {
    const variant = await storage.getProductVariantById(req.params.id);
    if (!variant) {
      return res.status(404).json({ error: "Variant not found" });
    }
    await storage.deleteProductVariant(req.params.id);
    res.json({ success: true });
  });

  // Products bulk import from Shopify CSV
  app.post("/api/products/import", authMiddleware, requirePermission(PERMISSION_CODES.IMPORT_PRODUCTS), async (req, res) => {
    try {
      const { csvData, fileName } = req.body;
      
      if (!csvData) {
        return res.status(400).json({ error: "CSV data required" });
      }

      // Create bulk job for tracking
      const job = await storage.createBulkUploadJob({
        type: "products",
        fileName: fileName || "products_import.csv",
        status: "processing",
        createdBy: req.user!.id,
      });

      const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
      const rows = parsed.data as any[];

      await storage.updateBulkUploadJob(job.id, { totalRows: rows.length });

      const errors: any[] = [];
      let successCount = 0;
      const productGroups: { [handle: string]: any } = {};

      // Get existing suppliers for vendor matching
      const suppliers = await storage.getSuppliers();
      const supplierByName = new Map(suppliers.map(s => [s.name.toLowerCase(), s]));

      // Group rows by Handle (each Handle = one product with multiple variants)
      for (const row of rows) {
        const handle = row["Handle"]?.trim();
        if (!handle) continue;

        if (!productGroups[handle]) {
          productGroups[handle] = {
            name: row["Title"]?.trim() || handle,
            description: row["Body (HTML)"] || null,
            category: row["Type"] || null,
            vendor: row["Vendor"] || null,
            variants: [],
          };
        }

        // Add variant if SKU exists
        const sku = row["Variant SKU"]?.trim();
        if (sku) {
          // Extract color and size from options
          let color: string | null = null;
          let size: string | null = null;

          const options = [
            { name: row["Option1 Name"], value: row["Option1 Value"] },
            { name: row["Option2 Name"], value: row["Option2 Value"] },
            { name: row["Option3 Name"], value: row["Option3 Value"] },
          ];

          for (const opt of options) {
            if (!opt.name || !opt.value) continue;
            const nameLower = opt.name.toLowerCase();
            if (nameLower.includes("color") || nameLower.includes("colour")) {
              color = opt.value;
            } else if (nameLower.includes("size")) {
              size = opt.value;
            }
          }

          productGroups[handle].variants.push({
            sku,
            color,
            size,
            costPrice: parseFloat(row["Cost per item"]) || 0,
            sellingPrice: parseFloat(row["Variant Price"]) || 0,
            stockQuantity: parseInt(row["Variant Inventory Qty"]) || 0,
          });
        }
      }

      // Get existing SKUs from database to check for duplicates
      const existingVariants = await storage.getProductVariants();
      const databaseSkus = new Set(existingVariants.map(v => v.sku));

      // First pass: Check for all duplicate SKUs within the batch and against database
      const batchSkuToHandle = new Map<string, string>();
      const batchDuplicates: { handle: string; sku: string; conflictWith: string }[] = [];
      
      for (const handle of Object.keys(productGroups)) {
        const productData = productGroups[handle];
        for (const variant of productData.variants) {
          const sku = variant.sku;
          
          // Check if SKU exists in database
          if (databaseSkus.has(sku)) {
            batchDuplicates.push({ handle, sku, conflictWith: "existing database" });
          }
          // Check if SKU was already seen in this batch
          else if (batchSkuToHandle.has(sku)) {
            batchDuplicates.push({ handle, sku, conflictWith: `product "${batchSkuToHandle.get(sku)}"` });
          } else {
            batchSkuToHandle.set(sku, handle);
          }
        }
      }

      // Group duplicate errors by handle for clearer error messages
      const handleDuplicateErrors = new Map<string, string[]>();
      for (const dup of batchDuplicates) {
        if (!handleDuplicateErrors.has(dup.handle)) {
          handleDuplicateErrors.set(dup.handle, []);
        }
        handleDuplicateErrors.get(dup.handle)!.push(`${dup.sku} (conflicts with ${dup.conflictWith})`);
      }

      // Mark products with duplicates as errors and build valid products set
      const invalidHandles = new Set<string>();
      for (const [handle, duplicateSkus] of handleDuplicateErrors) {
        errors.push({ handle, error: `Duplicate SKU(s): ${duplicateSkus.join(", ")}` });
        invalidHandles.add(handle);
      }

      // Create products and variants (only for valid products)
      for (const handle of Object.keys(productGroups)) {
        if (invalidHandles.has(handle)) continue;
        
        try {
          const productData = productGroups[handle];
          
          // Skip products with no variants
          if (productData.variants.length === 0) {
            errors.push({ handle, error: "No variants with SKU found" });
            continue;
          }

          // Create product
          const product = await storage.createProduct({
            name: productData.name,
            description: productData.description,
            category: productData.category,
          });

          // Create variants
          for (const variantData of productData.variants) {
            await storage.createProductVariant({
              productId: product.id,
              sku: variantData.sku,
              color: variantData.color,
              size: variantData.size,
              costPrice: variantData.costPrice.toString(),
              sellingPrice: variantData.sellingPrice.toString(),
              stockQuantity: variantData.stockQuantity,
            });
          }

          successCount++;
        } catch (error: any) {
          errors.push({ handle, error: error.message });
        }
      }

      await storage.updateBulkUploadJob(job.id, {
        status: "completed",
        processedRows: Object.keys(productGroups).length,
        successRows: successCount,
        errorRows: errors.length,
        errors: errors.length > 0 ? errors : null,
        completedAt: new Date(),
      });

      await storage.createAuditLog({
        userId: req.user!.id,
        action: "import",
        module: "products",
        entityId: job.id,
        entityType: "bulk_import",
        newData: { totalProducts: successCount, totalRows: rows.length },
      });

      res.json({
        success: true,
        jobId: job.id,
        totalProducts: Object.keys(productGroups).length,
        imported: successCount,
        errors: errors.length,
        errorDetails: errors,
      });
    } catch (error) {
      console.error("Products import error:", error);
      res.status(500).json({ error: "Failed to import products" });
    }
  });

  app.get("/api/couriers", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_COURIERS), async (req, res) => {
    const couriers = await storage.getCourierPartners();
    res.json(couriers);
  });

  app.get("/api/couriers/:id", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_COURIERS), async (req, res) => {
    const courier = await storage.getCourierPartnerById(req.params.id);
    if (!courier) {
      return res.status(404).json({ error: "Courier not found" });
    }
    res.json(courier);
  });

  app.post("/api/couriers", authMiddleware, requirePermission(PERMISSION_CODES.MANAGE_COURIERS), async (req, res) => {
    try {
      const data = insertCourierPartnerSchema.parse(req.body);
      const courier = await storage.createCourierPartner(data);
      res.status(201).json(courier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create courier" });
    }
  });

  app.patch("/api/couriers/:id", authMiddleware, requirePermission(PERMISSION_CODES.MANAGE_COURIERS), async (req, res) => {
    try {
      const courier = await storage.updateCourierPartner(req.params.id, req.body);
      if (!courier) {
        return res.status(404).json({ error: "Courier not found" });
      }
      res.json(courier);
    } catch (error) {
      res.status(500).json({ error: "Failed to update courier" });
    }
  });

  app.delete("/api/couriers/:id", authMiddleware, requirePermission(PERMISSION_CODES.MANAGE_COURIERS), async (req, res) => {
    await storage.deleteCourierPartner(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/orders", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_ORDERS), async (req, res) => {
    const filters: any = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.paymentStatus) filters.paymentStatus = req.query.paymentStatus;
    if (req.query.courierType) filters.courierType = req.query.courierType;
    if (req.query.search) filters.search = req.query.search;
    if (req.query.fromDate) filters.fromDate = new Date(req.query.fromDate as string);
    if (req.query.toDate) filters.toDate = new Date(req.query.toDate as string);

    const orders = await storage.getOrders(filters);
    res.json(orders);
  });

  app.get("/api/orders/:id", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_ORDERS), async (req, res) => {
    const order = await storage.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  });

  app.get("/api/orders/:id/history", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_ORDERS), async (req, res) => {
    const history = await storage.getOrderStatusHistory(req.params.id);
    res.json(history);
  });

  app.post("/api/orders", authMiddleware, requirePermission(PERMISSION_CODES.CREATE_ORDERS), async (req, res) => {
    try {
      const { items, ...orderData } = req.body;
      
      const orderCount = (await storage.getOrders()).length + 1;
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount).padStart(5, '0')}`;
      
      const order = await storage.createOrder(
        { ...orderData, orderNumber },
        items
      );
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: "create",
        module: "orders",
        entityId: order.id,
        entityType: "order",
        newData: order,
      });
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id", authMiddleware, requirePermission(PERMISSION_CODES.EDIT_ORDERS), async (req, res) => {
    try {
      const oldOrder = await storage.getOrderById(req.params.id);
      if (!oldOrder) {
        return res.status(404).json({ error: "Order not found" });
      }

      const order = await storage.updateOrder(req.params.id, req.body);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: "update",
        module: "orders",
        entityId: req.params.id,
        entityType: "order",
        oldData: oldOrder,
        newData: order,
      });
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  app.post("/api/orders/:id/status", authMiddleware, requirePermission(PERMISSION_CODES.DISPATCH_ORDERS), async (req, res) => {
    try {
      const { status, comment } = req.body;
      const order = await storage.updateOrderStatus(req.params.id, status, comment, req.user!.id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  app.post("/api/orders/:id/dispatch", authMiddleware, requirePermission(PERMISSION_CODES.DISPATCH_ORDERS), async (req, res) => {
    try {
      const { courierPartnerId, courierType, awbNumber, assignedTo } = req.body;
      
      const order = await storage.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      await storage.updateOrder(req.params.id, {
        courierPartnerId,
        courierType,
        awbNumber,
        assignedTo,
        dispatchDate: new Date(),
      });

      await storage.updateOrderStatus(req.params.id, "dispatched", "Order dispatched", req.user!.id);

      if (courierType === "in_house" && assignedTo) {
        await storage.createInternalDelivery({
          orderId: req.params.id,
          assignedTo,
          status: "assigned",
        });
      }

      const updatedOrder = await storage.getOrderById(req.params.id);
      res.json(updatedOrder);
    } catch (error) {
      console.error("Dispatch error:", error);
      res.status(500).json({ error: "Failed to dispatch order" });
    }
  });

  app.post("/api/orders/bulk-status", authMiddleware, requirePermission(PERMISSION_CODES.MANAGE_COURIER_STATUS), async (req, res) => {
    try {
      const { updates } = req.body;
      
      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ error: "Updates array required" });
      }

      const result = await storage.bulkUpdateOrderStatuses(updates, req.user!.id);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: "bulk_update",
        module: "orders",
        entityType: "order_status",
        newData: { 
          successful: result.successful, 
          failed: result.failed,
          updatedOrders: result.updatedOrders.map(o => o.orderNumber)
        },
      });

      res.json(result);
    } catch (error: any) {
      console.error("Bulk status update error:", error);
      res.status(500).json({ error: "Failed to update order statuses" });
    }
  });

  app.delete("/api/orders/:id", authMiddleware, requirePermission(PERMISSION_CODES.DELETE_ORDERS), async (req, res) => {
    const order = await storage.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    await storage.deleteOrder(req.params.id);
    
    await storage.createAuditLog({
      userId: req.user!.id,
      action: "delete",
      module: "orders",
      entityId: req.params.id,
      entityType: "order",
      oldData: order,
    });
    
    res.json({ success: true });
  });

  app.post("/api/orders/import", authMiddleware, requirePermission(PERMISSION_CODES.IMPORT_ORDERS), async (req, res) => {
    try {
      const { csvData, fileName } = req.body;
      
      if (!csvData) {
        return res.status(400).json({ error: "CSV data required" });
      }

      const job = await storage.createBulkUploadJob({
        type: "orders",
        fileName: fileName || "orders_import.csv",
        status: "processing",
        createdBy: req.user!.id,
      });

      const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
      const rows = parsed.data as any[];

      await storage.updateBulkUploadJob(job.id, { totalRows: rows.length });

      const errors: any[] = [];
      let successCount = 0;
      const orderGroups: { [key: string]: any } = {};

      for (const row of rows) {
        const orderName = row["Name"]?.trim();
        if (!orderName) continue;

        if (!orderGroups[orderName]) {
          orderGroups[orderName] = {
            orderNumber: orderName,
            shopifyOrderId: orderName,
            customerName: row["Billing Name"] || row["Shipping Name"] || "Unknown",
            customerEmail: row["Email"],
            customerPhone: row["Billing Phone"] || row["Shipping Phone"],
            shippingAddress: [
              row["Shipping Address1"],
              row["Shipping Address2"],
              row["Shipping City"],
              row["Shipping Province"],
              row["Shipping Zip"],
            ].filter(Boolean).join(", "),
            shippingCity: row["Shipping City"],
            shippingState: row["Shipping Province"],
            shippingZip: row["Shipping Zip"]?.replace(/'/g, ""),
            shippingCountry: row["Shipping Country"],
            billingAddress: [
              row["Billing Address1"],
              row["Billing Address2"],
              row["Billing City"],
              row["Billing Province"],
              row["Billing Zip"],
            ].filter(Boolean).join(", "),
            subtotal: parseFloat(row["Subtotal"]) || 0,
            shippingCost: parseFloat(row["Shipping"]) || 0,
            taxes: parseFloat(row["Taxes"]) || 0,
            discount: parseFloat(row["Discount Amount"]) || 0,
            totalAmount: parseFloat(row["Total"]) || 0,
            paymentMethod: row["Payment Method"]?.toLowerCase().includes("cod") ? "cod" : "prepaid",
            paymentStatus: row["Financial Status"]?.toLowerCase() === "paid" ? "paid" : "pending",
            status: row["Fulfillment Status"]?.toLowerCase() === "fulfilled" ? "delivered" : "pending",
            shopifyData: row,
            items: [],
          };
        }

        if (row["Lineitem name"]) {
          orderGroups[orderName].items.push({
            sku: row["Lineitem sku"] || `SKU-${Date.now()}`,
            productName: row["Lineitem name"],
            quantity: parseInt(row["Lineitem quantity"]) || 1,
            price: parseFloat(row["Lineitem price"]) || 0,
            compareAtPrice: parseFloat(row["Lineitem compare at price"]) || null,
            fulfillmentStatus: row["Lineitem fulfillment status"],
          });
        }
      }

      for (const orderNumber of Object.keys(orderGroups)) {
        try {
          const existingOrder = await storage.getOrderByNumber(orderNumber);
          if (existingOrder) {
            errors.push({ orderNumber, error: "Order already exists" });
            continue;
          }

          const orderData = orderGroups[orderNumber];
          const { items, ...order } = orderData;
          
          await storage.createOrder(order, items);
          successCount++;
        } catch (error: any) {
          errors.push({ orderNumber, error: error.message });
        }
      }

      await storage.updateBulkUploadJob(job.id, {
        status: "completed",
        processedRows: Object.keys(orderGroups).length,
        successRows: successCount,
        errorRows: errors.length,
        errors: errors.length > 0 ? errors : null,
        completedAt: new Date(),
      });

      res.json({
        success: true,
        jobId: job.id,
        totalOrders: Object.keys(orderGroups).length,
        imported: successCount,
        errors: errors.length,
        errorDetails: errors,
      });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ error: "Failed to import orders" });
    }
  });

  app.get("/api/stock-movements", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_INVENTORY), async (req, res) => {
    const filters: any = {};
    if (req.query.type) filters.type = req.query.type;
    if (req.query.variantId) filters.variantId = req.query.variantId;
    if (req.query.supplierId) filters.supplierId = req.query.supplierId;

    const movements = await storage.getStockMovements(filters);
    res.json(movements);
  });

  app.post("/api/stock-movements", authMiddleware, requirePermission(PERMISSION_CODES.ADJUST_STOCK), async (req, res) => {
    try {
      const { productVariantId, type, quantity, supplierId, invoiceNumber, invoiceDate, costPrice, reason } = req.body;
      
      const variant = await storage.getProductVariantById(productVariantId);
      if (!variant) {
        return res.status(404).json({ error: "Product variant not found" });
      }

      const previousQuantity = variant.stockQuantity;
      await storage.updateStock(productVariantId, quantity, type);
      const updatedVariant = await storage.getProductVariantById(productVariantId);

      const movement = await storage.createStockMovement({
        productVariantId,
        type,
        quantity,
        previousQuantity,
        newQuantity: updatedVariant!.stockQuantity,
        supplierId,
        invoiceNumber,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
        costPrice,
        reason,
        createdBy: req.user!.id,
      });
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: "stock_" + type,
        module: "inventory",
        entityId: productVariantId,
        entityType: "product_variant",
        oldData: { stockQuantity: previousQuantity },
        newData: { stockQuantity: updatedVariant!.stockQuantity },
      });
      
      res.status(201).json(movement);
    } catch (error) {
      console.error("Stock movement error:", error);
      res.status(500).json({ error: "Failed to create stock movement" });
    }
  });

  // Batch stock receive - handles multiple products with multiple variants per invoice
  app.post("/api/stock-movements/batch-receive", authMiddleware, requirePermission(PERMISSION_CODES.ADJUST_STOCK), async (req, res) => {
    try {
      const { supplierId, invoiceNumber, invoiceDate, products } = req.body;

      if (!supplierId || !products || !Array.isArray(products)) {
        return res.status(400).json({ error: "Supplier and products are required" });
      }

      const movements: any[] = [];
      let totalUnits = 0;
      let totalValue = 0;

      for (const product of products) {
        const { productId, variants } = product;
        
        if (!variants || typeof variants !== "object") continue;

        for (const [variantId, variantData] of Object.entries(variants)) {
          const { quantity, costPrice } = variantData as { quantity: number; costPrice: string };
          
          if (!quantity || quantity <= 0) continue;

          const variant = await storage.getProductVariantById(variantId);
          if (!variant) {
            console.log(`Variant ${variantId} not found, skipping`);
            continue;
          }

          const previousQuantity = variant.stockQuantity;
          await storage.updateStock(variantId, quantity, "inward");
          const updatedVariant = await storage.getProductVariantById(variantId);

          // Update the variant's cost price if provided
          const cost = parseFloat(costPrice) || 0;
          if (cost > 0) {
            await storage.updateProductVariant(variantId, { costPrice: costPrice });
          }

          const movement = await storage.createStockMovement({
            productVariantId: variantId,
            type: "inward",
            quantity,
            previousQuantity,
            newQuantity: updatedVariant!.stockQuantity,
            supplierId,
            invoiceNumber,
            invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
            costPrice: costPrice || undefined,
            reason: `Stock received via invoice ${invoiceNumber || "N/A"}`,
            createdBy: req.user!.id,
          });

          movements.push(movement);
          totalUnits += quantity;
          totalValue += quantity * cost;

          await storage.createAuditLog({
            userId: req.user!.id,
            action: "stock_inward",
            module: "inventory",
            entityId: variantId,
            entityType: "product_variant",
            oldData: { stockQuantity: previousQuantity },
            newData: { stockQuantity: updatedVariant!.stockQuantity, costPrice },
          });
        }
      }

      res.status(201).json({
        success: true,
        movements,
        summary: {
          totalMovements: movements.length,
          totalUnits,
          totalValue,
        },
      });
    } catch (error) {
      console.error("Batch stock receive error:", error);
      res.status(500).json({ error: "Failed to receive stock" });
    }
  });

  app.get("/api/complaints", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_COMPLAINTS), async (req, res) => {
    const filters: any = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.reason) filters.reason = req.query.reason;
    if (req.query.assignedTo) filters.assignedTo = req.query.assignedTo;

    const complaints = await storage.getComplaints(filters);
    res.json(complaints);
  });

  app.get("/api/complaints/:id", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_COMPLAINTS), async (req, res) => {
    const complaint = await storage.getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    res.json(complaint);
  });

  app.post("/api/complaints", authMiddleware, requirePermission(PERMISSION_CODES.MANAGE_COMPLAINTS), async (req, res) => {
    try {
      const complaintCount = (await storage.getComplaints()).length + 1;
      const ticketNumber = `TKT-${String(complaintCount).padStart(5, '0')}`;

      const order = await storage.getOrderById(req.body.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const complaint = await storage.createComplaint({
        ...req.body,
        ticketNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
      });

      await storage.addComplaintTimelineEntry({
        complaintId: complaint.id,
        action: "Ticket Created",
        comment: req.body.description || "Ticket created",
        employeeId: req.user!.id,
        employeeName: req.user!.name,
        employeeRole: req.user!.role?.name || "Staff",
      });
      
      const complaintWithTimeline = await storage.getComplaintById(complaint.id);
      res.status(201).json(complaintWithTimeline);
    } catch (error) {
      console.error("Create complaint error:", error);
      res.status(500).json({ error: "Failed to create complaint" });
    }
  });

  app.patch("/api/complaints/:id", authMiddleware, requirePermission(PERMISSION_CODES.MANAGE_COMPLAINTS), async (req, res) => {
    try {
      const oldComplaint = await storage.getComplaintById(req.params.id);
      if (!oldComplaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }

      const complaint = await storage.updateComplaint(req.params.id, req.body);
      
      if (req.body.status && req.body.status !== oldComplaint.status) {
        await storage.addComplaintTimelineEntry({
          complaintId: req.params.id,
          action: `Status changed to ${req.body.status}`,
          comment: req.body.statusComment || undefined,
          employeeId: req.user!.id,
          employeeName: req.user!.name,
          employeeRole: req.user!.role?.name || "Staff",
        });
      }

      const updatedComplaint = await storage.getComplaintById(req.params.id);
      res.json(updatedComplaint);
    } catch (error) {
      res.status(500).json({ error: "Failed to update complaint" });
    }
  });

  app.post("/api/complaints/:id/timeline", authMiddleware, requirePermission(PERMISSION_CODES.MANAGE_COMPLAINTS), async (req, res) => {
    try {
      const complaint = await storage.getComplaintById(req.params.id);
      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }

      const entry = await storage.addComplaintTimelineEntry({
        complaintId: req.params.id,
        action: req.body.action,
        comment: req.body.comment,
        employeeId: req.user!.id,
        employeeName: req.user!.name,
        employeeRole: req.user!.role?.name || "Staff",
      });

      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to add timeline entry" });
    }
  });

  app.post("/api/complaints/:id/resolve", authMiddleware, requirePermission(PERMISSION_CODES.RESOLVE_COMPLAINTS), async (req, res) => {
    try {
      const { resolutionType, resolutionNotes, status } = req.body;
      
      const complaint = await storage.updateComplaint(req.params.id, {
        status: status || "resolved",
        resolutionType,
        resolutionNotes,
      });

      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }

      await storage.addComplaintTimelineEntry({
        complaintId: req.params.id,
        action: status === "rejected" ? "Rejected" : "Resolved",
        comment: resolutionNotes,
        employeeId: req.user!.id,
        employeeName: req.user!.name,
        employeeRole: req.user!.role?.name || "Staff",
      });

      const updatedComplaint = await storage.getComplaintById(req.params.id);
      res.json(updatedComplaint);
    } catch (error) {
      res.status(500).json({ error: "Failed to resolve complaint" });
    }
  });

  app.get("/api/deliveries", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_DELIVERIES), async (req, res) => {
    const filters: any = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.assignedTo) filters.assignedTo = req.query.assignedTo;

    const deliveries = await storage.getInternalDeliveries(filters);
    res.json(deliveries);
  });

  app.get("/api/deliveries/:id", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_DELIVERIES), async (req, res) => {
    const delivery = await storage.getInternalDeliveryById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ error: "Delivery not found" });
    }
    res.json(delivery);
  });

  app.post("/api/deliveries", authMiddleware, requirePermission(PERMISSION_CODES.MANAGE_DELIVERIES), async (req, res) => {
    try {
      const delivery = await storage.createInternalDelivery(req.body);
      res.status(201).json(delivery);
    } catch (error) {
      res.status(500).json({ error: "Failed to create delivery" });
    }
  });

  app.patch("/api/deliveries/:id", authMiddleware, requirePermission(PERMISSION_CODES.MANAGE_DELIVERIES), async (req, res) => {
    try {
      const delivery = await storage.updateInternalDelivery(req.params.id, req.body);
      if (!delivery) {
        return res.status(404).json({ error: "Delivery not found" });
      }
      res.json(delivery);
    } catch (error) {
      res.status(500).json({ error: "Failed to update delivery" });
    }
  });

  app.post("/api/deliveries/:id/status", authMiddleware, requirePermission(PERMISSION_CODES.MANAGE_DELIVERIES), async (req, res) => {
    try {
      const { status, comment, location } = req.body;
      
      const delivery = await storage.getInternalDeliveryById(req.params.id);
      if (!delivery) {
        return res.status(404).json({ error: "Delivery not found" });
      }

      const updateData: any = { status };
      if (status === "delivered") {
        updateData.deliveredAt = new Date();
      }

      await storage.updateInternalDelivery(req.params.id, updateData);

      await storage.addDeliveryEvent({
        deliveryId: req.params.id,
        event: status.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
        comment,
        location,
        createdBy: req.user!.id,
      });

      if (status === "delivered") {
        await storage.updateOrderStatus(delivery.orderId, "delivered", "Delivered by in-house courier", req.user!.id);
      } else if (status === "failed" || status === "rto") {
        await storage.updateOrderStatus(delivery.orderId, "rto", req.body.failureReason || "Delivery failed", req.user!.id);
      }

      const updatedDelivery = await storage.getInternalDeliveryById(req.params.id);
      res.json(updatedDelivery);
    } catch (error) {
      res.status(500).json({ error: "Failed to update delivery status" });
    }
  });

  app.post("/api/deliveries/:id/collect-payment", authMiddleware, requirePermission(PERMISSION_CODES.COLLECT_PAYMENTS), async (req, res) => {
    try {
      const { amountCollected, paymentMode } = req.body;
      
      const delivery = await storage.getInternalDeliveryById(req.params.id);
      if (!delivery) {
        return res.status(404).json({ error: "Delivery not found" });
      }

      await storage.updateInternalDelivery(req.params.id, {
        status: "payment_collected",
        amountCollected: amountCollected.toString(),
        paymentMode,
        paymentCollectedAt: new Date(),
      });

      await storage.addDeliveryEvent({
        deliveryId: req.params.id,
        event: "Payment Collected",
        comment: `${paymentMode.toUpperCase()}: ₹${amountCollected}`,
        createdBy: req.user!.id,
      });

      await storage.updateOrder(delivery.orderId, { paymentStatus: "paid" });

      const updatedDelivery = await storage.getInternalDeliveryById(req.params.id);
      res.json(updatedDelivery);
    } catch (error) {
      res.status(500).json({ error: "Failed to collect payment" });
    }
  });

  app.get("/api/bulk-jobs", authMiddleware, async (req, res) => {
    const jobs = await storage.getBulkUploadJobs();
    res.json(jobs);
  });

  app.get("/api/bulk-jobs/:id", authMiddleware, async (req, res) => {
    const job = await storage.getBulkUploadJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
  });

  app.get("/api/settings", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_SETTINGS), async (req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  });

  app.get("/api/settings/:key", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_SETTINGS), async (req, res) => {
    const setting = await storage.getSetting(req.params.key);
    if (!setting) {
      return res.status(404).json({ error: "Setting not found" });
    }
    res.json(setting);
  });

  app.put("/api/settings/:key", authMiddleware, requirePermission(PERMISSION_CODES.MANAGE_SETTINGS), async (req, res) => {
    try {
      const { value, description } = req.body;
      const setting = await storage.setSetting(req.params.key, value, description);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: "update",
        module: "settings",
        entityId: req.params.key,
        entityType: "setting",
        newData: setting,
      });
      
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  app.get("/api/audit-logs", authMiddleware, requireSuperAdmin, async (req, res) => {
    const filters: any = {};
    if (req.query.userId) filters.userId = req.query.userId;
    if (req.query.module) filters.module = req.query.module;
    if (req.query.action) filters.action = req.query.action;

    const logs = await storage.getAuditLogs(filters);
    res.json(logs);
  });

  app.get("/api/dashboard/stats", authMiddleware, requirePermission(PERMISSION_CODES.VIEW_DASHBOARD), async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const products = await storage.getProducts();
      const complaints = await storage.getComplaints();
      const deliveries = await storage.getInternalDeliveries();

      const stats = {
        orders: {
          total: orders.length,
          pending: orders.filter(o => o.status === "pending").length,
          dispatched: orders.filter(o => o.status === "dispatched").length,
          delivered: orders.filter(o => o.status === "delivered").length,
          rto: orders.filter(o => o.status === "rto").length,
        },
        products: {
          total: products.length,
          variants: products.reduce((acc, p) => acc + p.variants.length, 0),
          lowStock: products.reduce((acc, p) => 
            acc + p.variants.filter(v => v.stockQuantity <= (v.lowStockThreshold || 10)).length, 0
          ),
        },
        complaints: {
          total: complaints.length,
          open: complaints.filter(c => c.status === "open").length,
          inProgress: complaints.filter(c => c.status === "in_progress").length,
          resolved: complaints.filter(c => c.status === "resolved").length,
        },
        deliveries: {
          total: deliveries.length,
          pending: deliveries.filter(d => d.status === "assigned" || d.status === "out_for_delivery").length,
          completed: deliveries.filter(d => d.status === "delivered" || d.status === "payment_collected").length,
        },
        revenue: {
          total: orders.filter(o => o.paymentStatus === "paid").reduce((acc, o) => acc + parseFloat(o.totalAmount), 0),
          pending: orders.filter(o => o.paymentStatus === "pending").reduce((acc, o) => acc + parseFloat(o.totalAmount), 0),
        },
      };

      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });

  app.get("/api/courier/delhivery/status", authMiddleware, async (req, res) => {
    res.json({
      configured: delhiveryService.isConfigured(),
      mode: process.env.DELHIVERY_MODE || "staging",
    });
  });

  app.get("/api/courier/delhivery/pincode/:pincode", authMiddleware, async (req, res) => {
    try {
      const result = await delhiveryService.checkPincodeServiceability(req.params.pincode);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to check pincode serviceability" });
    }
  });

  app.post("/api/courier/delhivery/waybill", authMiddleware, requirePermission(PERMISSION_CODES.DISPATCH_ORDERS), async (req, res) => {
    try {
      const { count } = req.body;
      const result = await delhiveryService.generateWaybills(count || 1);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      
      res.json({ waybills: result.waybills });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate waybills" });
    }
  });

  app.post("/api/courier/delhivery/ship/:orderId", authMiddleware, requirePermission(PERMISSION_CODES.DISPATCH_ORDERS), async (req, res) => {
    try {
      const order = await storage.getOrderById(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.status !== "pending") {
        return res.status(400).json({ error: "Order has already been dispatched" });
      }

      const setting = await storage.getSetting("warehouse_address");
      const warehouseAddress = setting?.value ? JSON.parse(setting.value) : null;

      if (!warehouseAddress) {
        return res.status(400).json({ error: "Warehouse address not configured. Please configure in Settings." });
      }

      const shipmentRequest = createDelhiveryShipmentFromOrder(
        {
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail,
          shippingAddress: order.shippingAddress,
          shippingCity: order.shippingCity,
          shippingState: order.shippingState,
          shippingPincode: order.shippingZip || "",
          paymentMethod: order.paymentMethod,
          totalAmount: order.totalAmount,
          items: order.items?.map(i => ({
            productName: i.productName,
            quantity: i.quantity,
          })),
        },
        {
          name: warehouseAddress.name || "Warehouse",
          add: warehouseAddress.address,
          city: warehouseAddress.city,
          pin_code: warehouseAddress.pincode,
          country: "India",
          phone: warehouseAddress.phone,
          state: warehouseAddress.state,
        },
        req.body.waybill
      );

      const result = await delhiveryService.createShipment(shipmentRequest);

      if (!result.success) {
        return res.status(400).json({ 
          error: result.error,
          details: result.response,
        });
      }

      const delhiveryCourier = await storage.getCourierPartners();
      const delhiveryPartner = delhiveryCourier.find(c => c.name.toLowerCase().includes("delhivery"));

      await storage.updateOrder(order.id, {
        status: "dispatched",
        awbNumber: result.waybill,
        courierPartnerId: delhiveryPartner?.id,
        courierType: "third_party",
        dispatchDate: new Date(),
      });

      await storage.updateOrderStatus(
        order.id,
        "dispatched",
        `Shipped via Delhivery. AWB: ${result.waybill}`,
        req.user!.id
      );

      const updatedOrder = await storage.getOrderById(order.id);
      res.json({
        success: true,
        awbNumber: result.waybill,
        order: updatedOrder,
      });
    } catch (error) {
      console.error("Delhivery shipping error:", error);
      res.status(500).json({ error: "Failed to create shipment" });
    }
  });

  app.get("/api/courier/delhivery/track/:awb", authMiddleware, async (req, res) => {
    try {
      const result = await delhiveryService.trackShipment(req.params.awb);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to track shipment" });
    }
  });

  app.post("/api/courier/delhivery/cancel/:awb", authMiddleware, requirePermission(PERMISSION_CODES.DISPATCH_ORDERS), async (req, res) => {
    try {
      const result = await delhiveryService.cancelShipment(req.params.awb);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      
      res.json({ success: true, message: "Shipment cancelled successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel shipment" });
    }
  });

  app.post("/api/orders/:id/track", authMiddleware, async (req, res) => {
    try {
      const order = await storage.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (!order.awbNumber) {
        return res.status(400).json({ error: "Order has no AWB number" });
      }

      const result = await delhiveryService.trackShipment(order.awbNumber);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      if (result.status) {
        const statusMap: Record<string, string> = {
          "Delivered": "delivered",
          "In Transit": "dispatched",
          "Out for Delivery": "dispatched",
          "Pending": "dispatched",
          "RTO": "rto",
          "Returned": "returned",
        };

        const newStatus = statusMap[result.status];
        if (newStatus && newStatus !== order.status) {
          await storage.updateOrder(order.id, { status: newStatus as any });
          await storage.updateOrderStatus(
            order.id,
            newStatus as any,
            `Auto-updated from Delhivery tracking: ${result.status}`,
            req.user!.id
          );
        }
      }
      
      res.json({
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          awbNumber: order.awbNumber,
        },
        tracking: result,
      });
    } catch (error) {
      console.error("Order tracking error:", error);
      res.status(500).json({ error: "Failed to track order" });
    }
  });

  return httpServer;
}
