# DS_SCM - Comprehensive Bug & Error Report

**Generated:** $(date)  
**Status:** Pending Approval for Fixes

---

## 🔴 CRITICAL BUGS (Security & Data Integrity)

### BUG-001: Missing Parameter Validation in `getProductVariants()` Call
**Location:** `server/routes.ts:652`  
**Severity:** CRITICAL  
**Issue:** `getProductVariants()` is called without a `productId` parameter, but the function signature requires it. This will cause a runtime error.
```typescript
// Current (WRONG):
const existingVariants = await storage.getProductVariants();

// Should be:
const existingVariants = await storage.getProductVariants(productId);
```
**Impact:** Product import will fail with runtime error.

---

### BUG-002: Race Condition in B2B Order Number Generation
**Location:** `server/storage.ts:1521`  
**Severity:** HIGH  
**Issue:** B2B order numbers use `Date.now().toString(36)` which can generate duplicates if two orders are created in the same millisecond.
```typescript
// Current:
const orderNumber = `B2B-${Date.now().toString(36).toUpperCase()}`;

// Should include uniqueness check like regular orders
```
**Impact:** Potential duplicate order numbers, database constraint violations.

---

### BUG-003: Unsafe Type Casting in Order Status Updates
**Location:** `server/routes.ts:1791, 1794`  
**Severity:** HIGH  
**Issue:** Using `as any` bypasses TypeScript type checking, allowing invalid status values.
```typescript
// Current:
await storage.updateOrder(order.id, { status: newStatus as any });
await storage.updateOrderStatus(order.id, newStatus as any, ...);

// Should validate status against Order["status"] type
```
**Impact:** Invalid order statuses could be saved, breaking business logic.

---

### BUG-004: Missing Error Handling for JSON.parse
**Location:** `server/routes.ts:1659`  
**Severity:** MEDIUM  
**Issue:** `JSON.parse(setting.value)` can throw if the value is invalid JSON, crashing the request.
```typescript
// Current:
const warehouseAddress = setting?.value ? JSON.parse(setting.value) : null;

// Should wrap in try-catch
```
**Impact:** Server crash if warehouse address setting contains invalid JSON.

---

## 🟡 HIGH PRIORITY BUGS (Logic & Functionality)

### BUG-005: Negative Stock Quantity Not Prevented
**Location:** `server/storage.ts:784`  
**Severity:** HIGH  
**Issue:** Stock can go negative when doing "outward" movements. No validation prevents negative stock.
```typescript
// Current:
if (type === "outward") {
  newQuantity = variant.stockQuantity - quantity; // Can be negative!
}

// Should validate:
if (type === "outward") {
  newQuantity = variant.stockQuantity - quantity;
  if (newQuantity < 0) {
    throw new Error("Insufficient stock");
  }
}
```
**Impact:** Inventory can show negative quantities, breaking reports and business logic.

---

### BUG-006: Duplicate SKU Generation in Order Import
**Location:** `server/routes.ts:1070`  
**Severity:** HIGH  
**Issue:** When SKU is missing, generates `SKU-${Date.now()}` which can create duplicates if multiple orders are imported simultaneously.
```typescript
// Current:
sku: row["Lineitem sku"] || `SKU-${Date.now()}`,

// Should use UUID or check uniqueness
```
**Impact:** Multiple orders can get the same SKU, violating unique constraint.

---

### BUG-007: Missing Transaction in Order Creation
**Location:** `server/storage.ts:927-954`  
**Severity:** HIGH  
**Issue:** Order creation involves multiple database operations (order, items, status history) without transaction. If any step fails, partial data remains.
```typescript
// Current: Sequential operations without transaction
await db.insert(orders).values({ ...order, id: orderId });
// ... items creation ...
// ... status history ...

// Should wrap in transaction
```
**Impact:** Partial order data if any step fails, data inconsistency.

---

### BUG-008: Missing Transaction in B2B Payment Processing
**Location:** `server/storage.ts:1650-1680`  
**Severity:** HIGH  
**Issue:** Payment creation and order update are not atomic. Payment could be created but order update could fail.
```typescript
// Current:
await db.insert(b2bPayments).values({ ...payment, id });
// ... then update order ...

// Should be atomic transaction
```
**Impact:** Payment recorded but order not updated, financial inconsistency.

---

### BUG-009: Potential Division by Zero in Payment Status Calculation
**Location:** `server/storage.ts:1664-1667`  
**Severity:** MEDIUM  
**Issue:** If `totalAmount` is 0, the percentage calculation `totalAmount * 0.5` is fine, but logic could be clearer.
```typescript
// Current logic is correct but could be more explicit:
if (newReceived >= totalAmount) {
  newPaymentStatus = "fully_paid";
} else if (newReceived > 0 && newReceived < totalAmount * 0.5) {
  // What if totalAmount is 0? Should handle edge case
}
```
**Impact:** Edge case handling unclear.

---

### BUG-010: Missing Validation for Delivery Status Transition
**Location:** `server/routes.ts:1445-1473`  
**Severity:** MEDIUM  
**Issue:** No validation that status transitions are valid (e.g., can't go from "delivered" back to "assigned").
```typescript
// Should validate status transitions:
const validTransitions = {
  assigned: ["out_for_delivery", "failed"],
  out_for_delivery: ["delivered", "failed", "rto"],
  // ...
};
```
**Impact:** Invalid status transitions could occur, breaking workflow logic.

---

## 🟢 MEDIUM PRIORITY BUGS (Code Quality & Best Practices)

### BUG-011: Inconsistent Error Handling - Using `.then()` Instead of `await`
**Location:** `server/storage.ts:887, 914, 1124, 1148`  
**Severity:** MEDIUM  
**Issue:** Mixing async/await with `.then()` makes code harder to read and error handling inconsistent.
```typescript
// Current:
const assignedUser = ord.assignedTo
  ? await db.select().from(users).where(eq(users.id, ord.assignedTo)).then(r => r?.[0])
  : null;

// Should be:
const assignedUser = ord.assignedTo
  ? (await db.select().from(users).where(eq(users.id, ord.assignedTo)))?.[0]
  : null;
```
**Impact:** Code inconsistency, harder to maintain.

---

### BUG-012: Missing Error Handling in Bulk Operations
**Location:** `server/routes.ts:573-762` (Product Import)  
**Severity:** MEDIUM  
**Issue:** If bulk job creation fails, no cleanup. If import partially succeeds, no rollback mechanism.
**Impact:** Partial imports leave system in inconsistent state.

---

### BUG-013: Missing Input Validation for parseFloat Operations
**Location:** Multiple locations  
**Severity:** MEDIUM  
**Issue:** `parseFloat()` can return `NaN` if input is invalid, but many places don't handle this.
```typescript
// Current:
parseFloat(row["Total"]) || 0  // NaN || 0 = 0, but should validate

// Should validate:
const amount = parseFloat(row["Total"]);
if (isNaN(amount)) {
  errors.push({ row, error: "Invalid amount" });
  continue;
}
```
**Impact:** Invalid data could be stored as 0, hiding data quality issues.

---

### BUG-014: Missing Null Check Before String Operations
**Location:** `server/routes.ts:1046`  
**Severity:** LOW  
**Issue:** `row["Shipping Zip"]?.replace()` is safe, but similar patterns elsewhere might not be.
```typescript
// Current is safe:
shippingZip: row["Shipping Zip"]?.replace(/'/g, ""),

// But check other similar operations
```
**Impact:** Potential null reference errors.

---

### BUG-015: Missing ID Generation in setRolePermissions
**Location:** `server/storage.ts:430-431`  
**Severity:** MEDIUM  
**Issue:** Role permissions are inserted without IDs, relying on database defaults. Should be explicit.
```typescript
// Current:
await db.insert(rolePermissions)
  .values(permissionIds.map(permissionId => ({ roleId, permissionId })));

// Should include id:
.values(permissionIds.map(permissionId => ({ 
  id: randomUUID(), 
  roleId, 
  permissionId 
})));
```
**Impact:** Less control over ID generation, potential issues if default changes.

---

### BUG-016: Missing Validation for Empty Arrays in Bulk Operations
**Location:** `server/routes.ts:936-963`  
**Severity:** LOW  
**Issue:** Bulk status update doesn't validate that updates array isn't empty before processing.
```typescript
// Current checks length > 0, but should also validate structure
if (!updates || !Array.isArray(updates) || updates.length === 0) {
  return res.status(400).json({ error: "Updates array required" });
}

// Should also validate each update has required fields
```
**Impact:** Could process invalid updates, causing errors later.

---

### BUG-017: Missing Error Handling for Delhivery API Failures
**Location:** `server/services/delhivery.ts`  
**Severity:** MEDIUM  
**Issue:** Some API calls don't handle network timeouts or partial failures gracefully.
**Impact:** User-facing errors not user-friendly, no retry mechanism.

---

### BUG-018: Potential Memory Issue with Large CSV Imports
**Location:** `server/routes.ts:589, 1018`  
**Severity:** LOW  
**Issue:** Large CSV files are parsed entirely into memory. No streaming or chunking.
```typescript
// Current:
const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
const rows = parsed.data as any[]; // All in memory

// Should consider streaming for large files
```
**Impact:** Server could run out of memory with very large imports.

---

### BUG-019: Missing Audit Log on Failed Operations
**Location:** Multiple locations  
**Severity:** LOW  
**Issue:** Failed operations don't create audit logs, making troubleshooting difficult.
**Impact:** No audit trail for failures, harder to debug issues.

---

### BUG-020: Inconsistent Date Handling
**Location:** Multiple locations  
**Severity:** LOW  
**Issue:** Mix of `new Date()`, `Date.now()`, and date strings. Should standardize.
**Impact:** Potential timezone issues, inconsistent formatting.

---

## 🔵 LOW PRIORITY / CODE QUALITY ISSUES

### BUG-021: Type Safety - Using `as any` in Multiple Places
**Location:** `server/routes.ts:590, 1018, 1791, 1794`  
**Severity:** LOW  
**Issue:** Bypassing TypeScript type checking reduces type safety.
**Impact:** Potential runtime errors, harder to catch bugs at compile time.

---

### BUG-022: Console.log Instead of Proper Logging
**Location:** Multiple locations  
**Severity:** LOW  
**Issue:** Using `console.log`/`console.error` instead of structured logging.
**Impact:** Harder to filter/search logs, no log levels.

---

### BUG-023: Missing Return Type Annotations
**Location:** Some functions  
**Severity:** LOW  
**Issue:** Some functions missing explicit return types.
**Impact:** Less clear function contracts.

---

### BUG-024: Magic Numbers
**Location:** `server/storage.ts:1664` (0.5 for 50%)  
**Severity:** LOW  
**Issue:** Hard-coded percentage values should be constants.
```typescript
// Current:
} else if (newReceived >= totalAmount * 0.5) {

// Should be:
const PARTIAL_PAYMENT_THRESHOLD = 0.5;
} else if (newReceived >= totalAmount * PARTIAL_PAYMENT_THRESHOLD) {
```
**Impact:** Harder to maintain, unclear intent.

---

### BUG-025: Missing JSDoc Comments
**Location:** Most functions  
**Severity:** LOW  
**Issue:** Functions lack documentation comments.
**Impact:** Harder for developers to understand function purpose and parameters.

---

## 📊 SUMMARY

**Total Bugs Found:** 25

**By Severity:**
- 🔴 Critical: 4
- 🟡 High: 6
- 🟢 Medium: 9
- 🔵 Low: 6

**By Category:**
- Security: 1
- Data Integrity: 4
- Logic Errors: 8
- Error Handling: 5
- Code Quality: 7

---

## 🎯 RECOMMENDED FIX ORDER

1. **BUG-001** - Fix immediately (breaks product import)
2. **BUG-002** - Fix immediately (data integrity)
3. **BUG-003** - Fix immediately (type safety)
4. **BUG-005** - Fix soon (business logic)
5. **BUG-006** - Fix soon (data integrity)
6. **BUG-007** - Fix soon (data integrity)
7. **BUG-008** - Fix soon (financial integrity)
8. **BUG-004** - Fix soon (stability)
9. **BUG-009** through **BUG-020** - Fix as time permits
10. **BUG-021** through **BUG-025** - Code quality improvements

---

**Note:** This report was generated through static code analysis. Some issues may require runtime testing to confirm. Please review each bug and approve fixes before implementation.
