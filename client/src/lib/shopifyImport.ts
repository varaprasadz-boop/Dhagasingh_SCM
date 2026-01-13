import Papa from "papaparse";
import * as XLSX from "xlsx";

// Shopify Product CSV Column Mappings
export interface ShopifyProductRow {
  Handle: string;
  Title: string;
  "Body (HTML)"?: string;
  Vendor?: string;
  Type?: string;
  Tags?: string;
  "Option1 Name"?: string;
  "Option1 Value"?: string;
  "Option2 Name"?: string;
  "Option2 Value"?: string;
  "Option3 Name"?: string;
  "Option3 Value"?: string;
  "Variant SKU"?: string;
  "Variant Price"?: string;
  "Cost per item"?: string;
  "Variant Inventory Qty"?: string;
  "Variant Compare at Price"?: string;
  [key: string]: string | undefined;
}

// Shopify Order CSV Column Mappings
export interface ShopifyOrderRow {
  Name: string;
  Email?: string;
  "Financial Status"?: string;
  "Paid at"?: string;
  "Fulfillment Status"?: string;
  "Fulfilled at"?: string;
  Currency?: string;
  Subtotal?: string;
  Shipping?: string;
  Taxes?: string;
  Total?: string;
  "Discount Code"?: string;
  "Discount Amount"?: string;
  "Shipping Method"?: string;
  "Created at"?: string;
  "Lineitem quantity"?: string;
  "Lineitem name"?: string;
  "Lineitem price"?: string;
  "Lineitem compare at price"?: string;
  "Lineitem sku"?: string;
  "Lineitem requires shipping"?: string;
  "Lineitem taxable"?: string;
  "Lineitem fulfillment status"?: string;
  "Billing Name"?: string;
  "Billing Street"?: string;
  "Billing Address1"?: string;
  "Billing Address2"?: string;
  "Billing City"?: string;
  "Billing Zip"?: string;
  "Billing Province"?: string;
  "Billing Country"?: string;
  "Billing Phone"?: string;
  "Shipping Name"?: string;
  "Shipping Street"?: string;
  "Shipping Address1"?: string;
  "Shipping Address2"?: string;
  "Shipping City"?: string;
  "Shipping Zip"?: string;
  "Shipping Province"?: string;
  "Shipping Country"?: string;
  "Shipping Phone"?: string;
  Notes?: string;
  "Payment Method"?: string;
  Id?: string;
  Tags?: string;
  [key: string]: string | undefined;
}

// Parsed product structure for DS_SCM
export interface ParsedProduct {
  handle: string;
  name: string;
  description?: string;
  category?: string;
  vendor?: string;
  variants: ParsedVariant[];
}

export interface ParsedVariant {
  sku: string;
  color?: string;
  size?: string;
  costPrice: string;
  sellingPrice: string;
  stockQuantity: number;
}

// Parsed order structure for DS_SCM
export interface ParsedOrder {
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZip?: string;
  shippingCountry?: string;
  subtotal: string;
  shippingCost: string;
  discount: string;
  taxes: string;
  totalAmount: string;
  paymentMethod: "cod" | "prepaid";
  paymentStatus: "pending" | "paid";
  status: "pending" | "dispatched" | "delivered";
  notes?: string;
  createdAt?: string;
  lineItems: ParsedLineItem[];
}

export interface ParsedLineItem {
  sku: string;
  productName: string;
  quantity: number;
  price: string;
  compareAtPrice?: string;
}

// Check if file is Excel format
export function isExcelFile(file: File): boolean {
  const extension = file.name.toLowerCase();
  return extension.endsWith('.xlsx') || extension.endsWith('.xls');
}

// Parse Excel file to rows
async function parseExcel<T>(file: File): Promise<{ data: T[]; errors: string[] }> {
  const errors: string[] = [];
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      errors.push('No sheets found in Excel file');
      return { data: [], errors };
    }
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with headers
    const jsonData = XLSX.utils.sheet_to_json<T>(worksheet, {
      defval: '', // Use empty string for missing values
    });
    
    return { data: jsonData, errors };
  } catch (error: any) {
    errors.push(`Excel parse error: ${error.message}`);
    return { data: [], errors };
  }
}

// Parse CSV file to rows
function parseCSVFile<T>(file: File): Promise<{ data: T[]; errors: string[] }> {
  return new Promise((resolve) => {
    const errors: string[] = [];
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          results.errors.forEach((err) => {
            errors.push(`Row ${err.row}: ${err.message}`);
          });
        }
        resolve({ data: results.data as T[], errors });
      },
      error: (error) => {
        errors.push(`Parse error: ${error.message}`);
        resolve({ data: [], errors });
      },
    });
  });
}

// Parse file (CSV or Excel) to rows
export async function parseCSV<T>(file: File): Promise<{ data: T[]; errors: string[] }> {
  if (isExcelFile(file)) {
    return parseExcel<T>(file);
  }
  return parseCSVFile<T>(file);
}

// Convert Excel data to CSV string (for sending to server)
export async function fileToCSVString(file: File): Promise<string> {
  if (isExcelFile(file)) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_csv(worksheet);
  }
  return file.text();
}

// Determine color/size from Shopify options
function extractColorSize(row: ShopifyProductRow): { color?: string; size?: string } {
  let color: string | undefined;
  let size: string | undefined;
  
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
  
  return { color, size };
}

// Parse Shopify product CSV to DS_SCM format
export function parseShopifyProducts(rows: ShopifyProductRow[]): {
  products: ParsedProduct[];
  errors: string[];
  summary: { totalRows: number; productsFound: number; variantsFound: number };
} {
  const errors: string[] = [];
  const productMap = new Map<string, ParsedProduct>();
  let variantsFound = 0;
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 for header row and 0-index
    
    const handle = row.Handle?.trim();
    if (!handle) {
      errors.push(`Row ${rowNum}: Missing Handle`);
      continue;
    }
    
    // Get or create product
    let product = productMap.get(handle);
    if (!product) {
      const title = row.Title?.trim();
      if (!title) {
        errors.push(`Row ${rowNum}: Missing Title for new product "${handle}"`);
        continue;
      }
      
      product = {
        handle,
        name: title,
        description: row["Body (HTML)"] || undefined,
        category: row.Type || undefined,
        vendor: row.Vendor || undefined,
        variants: [],
      };
      productMap.set(handle, product);
    }
    
    // Add variant if SKU exists
    const sku = row["Variant SKU"]?.trim();
    if (sku) {
      const { color, size } = extractColorSize(row);
      
      product.variants.push({
        sku,
        color,
        size,
        costPrice: row["Cost per item"] || "0",
        sellingPrice: row["Variant Price"] || "0",
        stockQuantity: parseInt(row["Variant Inventory Qty"] || "0") || 0,
      });
      variantsFound++;
    }
  }
  
  const products = Array.from(productMap.values());
  
  return {
    products,
    errors,
    summary: {
      totalRows: rows.length,
      productsFound: products.length,
      variantsFound,
    },
  };
}

// Parse Shopify order CSV to DS_SCM format
export function parseShopifyOrders(rows: ShopifyOrderRow[]): {
  orders: ParsedOrder[];
  errors: string[];
  summary: { totalRows: number; ordersFound: number; lineItemsFound: number };
} {
  const errors: string[] = [];
  const orderMap = new Map<string, ParsedOrder>();
  let lineItemsFound = 0;
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    
    const orderName = row.Name?.trim();
    if (!orderName) {
      errors.push(`Row ${rowNum}: Missing Order Name`);
      continue;
    }
    
    // Get or create order
    let order = orderMap.get(orderName);
    if (!order) {
      // Determine payment method from Financial Status
      const financialStatus = (row["Financial Status"] || "").toLowerCase();
      const paymentMethod: "cod" | "prepaid" = 
        financialStatus === "pending" || financialStatus === "unpaid" ? "cod" : "prepaid";
      const paymentStatus: "pending" | "paid" = 
        financialStatus === "paid" ? "paid" : "pending";
      
      // All imported orders default to pending status (ignore Fulfillment Status column)
      const status: "pending" | "dispatched" | "delivered" = "pending";
      
      // Build shipping address
      const addressParts = [
        row["Shipping Address1"],
        row["Shipping Address2"],
        row["Shipping Street"],
      ].filter(Boolean);
      const shippingAddress = addressParts.join(", ") || row["Shipping Name"] || "N/A";
      
      order = {
        orderNumber: orderName,
        customerName: row["Shipping Name"] || row["Billing Name"] || "Unknown",
        customerEmail: row.Email || undefined,
        customerPhone: row["Shipping Phone"] || row["Billing Phone"] || undefined,
        shippingAddress,
        shippingCity: row["Shipping City"] || undefined,
        shippingState: row["Shipping Province"] || undefined,
        shippingZip: row["Shipping Zip"] || undefined,
        shippingCountry: row["Shipping Country"] || undefined,
        subtotal: row.Subtotal || "0",
        shippingCost: row.Shipping || "0",
        discount: row["Discount Amount"] || "0",
        taxes: row.Taxes || "0",
        totalAmount: row.Total || "0",
        paymentMethod,
        paymentStatus,
        status,
        notes: row.Notes || undefined,
        createdAt: row["Created at"] || undefined,
        lineItems: [],
      };
      orderMap.set(orderName, order);
    }
    
    // Add line item if present
    const lineItemName = row["Lineitem name"]?.trim();
    const lineItemQty = parseInt(row["Lineitem quantity"] || "0");
    if (lineItemName && lineItemQty > 0) {
      order.lineItems.push({
        sku: row["Lineitem sku"] || `NOSKU-${lineItemsFound}`,
        productName: lineItemName,
        quantity: lineItemQty,
        price: row["Lineitem price"] || "0",
        compareAtPrice: row["Lineitem compare at price"] || undefined,
      });
      lineItemsFound++;
    }
  }
  
  const orders = Array.from(orderMap.values());
  
  return {
    orders,
    errors,
    summary: {
      totalRows: rows.length,
      ordersFound: orders.length,
      lineItemsFound,
    },
  };
}

// Validation helpers
export function validateProductImport(products: ParsedProduct[]): string[] {
  const errors: string[] = [];
  const skuSet = new Set<string>();
  
  for (const product of products) {
    if (!product.name) {
      errors.push(`Product "${product.handle}": Missing name`);
    }
    
    if (product.variants.length === 0) {
      errors.push(`Product "${product.name}": No variants with SKU found`);
    }
    
    for (const variant of product.variants) {
      if (skuSet.has(variant.sku)) {
        errors.push(`Duplicate SKU: ${variant.sku}`);
      }
      skuSet.add(variant.sku);
    }
  }
  
  return errors;
}

export function validateOrderImport(orders: ParsedOrder[]): string[] {
  const errors: string[] = [];
  const orderNumSet = new Set<string>();
  
  for (const order of orders) {
    if (orderNumSet.has(order.orderNumber)) {
      errors.push(`Duplicate order number: ${order.orderNumber}`);
    }
    orderNumSet.add(order.orderNumber);
    
    if (!order.customerName) {
      errors.push(`Order "${order.orderNumber}": Missing customer name`);
    }
    
    if (order.lineItems.length === 0) {
      errors.push(`Order "${order.orderNumber}": No line items found`);
    }
  }
  
  return errors;
}
