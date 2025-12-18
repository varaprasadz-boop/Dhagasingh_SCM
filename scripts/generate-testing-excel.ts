import * as XLSX from 'xlsx';
import * as fs from 'fs';

const testData = {
  "Credentials": [
    { "Role": "Admin", "Email": "admin@dsscm.com", "Password": "admin123" },
    { "Role": "B2B Sales", "Email": "b2bsales@dsscm.com", "Password": "b2btest123" }
  ],
  "Authentication": [
    { "Test Case": "Login page loads correctly", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Login with valid admin credentials", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Login with valid B2B credentials", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Invalid credentials show error message", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Logout functionality works", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Session persists on page refresh", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Unauthorized routes redirect to login", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Dashboard": [
    { "Test Case": "Dashboard loads with key metrics", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Summary cards display correctly (orders, inventory, complaints)", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Charts/graphs render properly", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Quick action links work", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Products": [
    { "Test Case": "Product list displays with pagination", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Add new product with name, SKU, description", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Add product variants (size, color, etc.)", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Edit existing product", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Delete product (with confirmation)", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Search/filter products", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "View product details", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Orders": [
    { "Test Case": "Order list displays with status badges", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Create manual order", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Bulk import orders via CSV/Excel", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "View order details", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Update order status", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Assign courier partner", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Add/update AWB number", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Filter by status, date range", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Search by order ID, customer", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Inventory": [
    { "Test Case": "Inventory list with stock levels", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Stock receiving - add stock for products", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Per-variant pricing during stock receive", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Multi-product stock receiving", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Low stock alerts visible", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Stock movement history", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Filter by product, variant", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Internal Delivery": [
    { "Test Case": "Internal delivery list displays", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Create new internal delivery", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Update delivery status", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "View delivery timeline", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Assign warehouse location", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Suppliers": [
    { "Test Case": "Supplier list displays", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Add new supplier with contact details", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Edit supplier information", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Delete supplier", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Search/filter suppliers", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Couriers": [
    { "Test Case": "Courier partner list displays", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Add new courier partner", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Edit courier details", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Set courier as active/inactive", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "View courier performance metrics", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Courier Status": [
    { "Test Case": "Bulk status update interface loads", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Upload CSV/Excel for bulk status update", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Preview changes before applying", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Status history tracking", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Error handling for invalid data", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Complaints": [
    { "Test Case": "Complaint list displays", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Create new complaint ticket", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Link complaint to order", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Custom complaint reason input", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Update complaint status", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Add resolution notes", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "View complaint timeline", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Filter by status, date", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Reports": [
    { "Test Case": "Report page loads", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Generate sales report", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Generate inventory report", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Date range selection works", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Export reports (if available)", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Users": [
    { "Test Case": "User list displays", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Add new user with role assignment", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Edit user information", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Deactivate/activate user", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Reset password functionality", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Role-based permission assignment", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Roles": [
    { "Test Case": "Role list displays", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Create new role", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Edit role permissions", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Delete role (with validation)", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Permission checkboxes work correctly", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Settings": [
    { "Test Case": "Settings page loads", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Update company information", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Configure notification preferences", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Save settings successfully", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "B2B Dashboard": [
    { "Test Case": "B2B metrics display correctly", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Client count, order summary, payment status", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Quick links to B2B sections", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "B2B Clients": [
    { "Test Case": "Client list displays", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Add new client with company details", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Edit client information", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "View client order history", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Sales employee sees only their clients", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Manager with VIEW_ALL_B2B_DATA sees all clients", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "B2B Orders": [
    { "Test Case": "Order list displays", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Create new B2B order", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Delivery address capture (required field)", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Add special instructions", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Select client from dropdown", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Workflow: Inquiry stage", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Workflow: Quote Sent stage", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Workflow: Quote Approved stage", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Workflow: Design Pending stage", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Workflow: Design Approved stage", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Workflow: Production stage", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Workflow: Quality Check stage", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Workflow: Ready for Dispatch stage", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Workflow: Dispatched stage", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Workflow: Delivered stage", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "View order details (/b2b/orders/:id)", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Filter by status, client, date", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "B2B Invoices": [
    { "Test Case": "Invoice list displays", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Create Proforma Invoice", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Create Tax Invoice", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Auto-calculate tax (taxAmount = subtotal x taxRate / 100)", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Auto-calculate total (subtotal + taxAmount - discount)", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Default taxRate: 18%, default discount: 0", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Due date selection", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "View/download invoice PDF (if available)", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Invoice status updates (Draft > Sent > Paid)", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "B2B Payments": [
    { "Test Case": "Payment list displays", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Record new payment", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Payment modes work: Bank Transfer, Cheque, Cash, UPI", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "paymentMode field saves correctly", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "transactionRef field saves correctly", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "remarks field saves correctly", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Link payment to order", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Payment milestone tracking", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "View payment history per order", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Mobile Dashboard": [
    { "Test Case": "Mobile-optimized dashboard loads", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Touch-friendly cards and metrics", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Quick action buttons work", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Mobile Scan": [
    { "Test Case": "Barcode/QR scanner opens", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Camera permissions requested", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Successful scan triggers action", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Manual entry fallback", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Mobile Orders": [
    { "Test Case": "Order list scrolls smoothly", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Pull to refresh", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Quick status updates", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "One-tap actions", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Mobile Stock": [
    { "Test Case": "Stock list displays", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Quick stock updates", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Low stock indicators", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Mobile Profile": [
    { "Test Case": "Profile information displays", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Edit profile", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Logout button works", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Mobile Navigation": [
    { "Test Case": "Home, Scan, Orders, Stock, Profile tabs work", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Active tab highlighted", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Smooth transitions", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Role-Based Access": [
    { "Test Case": "Admin sees all menu items", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "B2B Sales sees only B2B module", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Warehouse role sees relevant items only", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Customer Support sees complaints/orders", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Unauthorized routes blocked", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Data Validation": [
    { "Test Case": "Required field validation on all forms", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Numeric fields accept only numbers", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Date pickers work correctly", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Dropdown selections required", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Error Handling": [
    { "Test Case": "API errors show user-friendly messages", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Network errors handled gracefully", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Form validation errors displayed", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "UI-UX": [
    { "Test Case": "Dark/Light theme toggle works", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Responsive on different screen sizes", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Loading states displayed", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Toast notifications appear", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Modal dialogs close properly", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Order Import": [
    { "Test Case": "CSV file upload works", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Excel file upload works", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Shopify format import", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Validation errors displayed", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Preview before import", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Success confirmation with count", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Bulk Status Update": [
    { "Test Case": "CSV upload for status updates", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Excel upload for status updates", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Column mapping works", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Error rows highlighted", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Partial success handling", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Database Integrity": [
    { "Test Case": "Orders reference valid products", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Payments linked to valid orders", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Invoices linked to valid orders and clients", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Stock movements tracked correctly", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Soft delete preserves historical data", "Pass": "", "Fail": "", "Notes": "" }
  ],
  "Performance": [
    { "Test Case": "Page load times acceptable (<3 seconds)", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Large lists paginate properly", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "Filters respond quickly", "Pass": "", "Fail": "", "Notes": "" },
    { "Test Case": "No UI freezing during operations", "Pass": "", "Fail": "", "Notes": "" }
  ]
};

const workbook = XLSX.utils.book_new();

let summaryData: { Section: string; "Total Tests": number; Passed: string; Failed: string; Notes: string }[] = [];

for (const [sheetName, data] of Object.entries(testData)) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  const colWidths = [
    { wch: 60 },
    { wch: 8 },
    { wch: 8 },
    { wch: 40 }
  ];
  worksheet['!cols'] = colWidths;
  
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));
  
  if (sheetName !== "Credentials") {
    summaryData.push({
      "Section": sheetName,
      "Total Tests": data.length,
      "Passed": "",
      "Failed": "",
      "Notes": ""
    });
  }
}

summaryData.push({
  "Section": "TOTAL",
  "Total Tests": summaryData.reduce((sum, row) => sum + row["Total Tests"], 0),
  "Passed": "",
  "Failed": "",
  "Notes": ""
});

const summarySheet = XLSX.utils.json_to_sheet(summaryData);
summarySheet['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 40 }];

const infoData = [
  { "Field": "Tested By", "Value": "" },
  { "Field": "Date", "Value": "" },
  { "Field": "Environment", "Value": "Development / Staging / Production" },
  { "Field": "Browser", "Value": "" },
  { "Field": "Device", "Value": "" }
];
const infoSheet = XLSX.utils.json_to_sheet(infoData);
infoSheet['!cols'] = [{ wch: 15 }, { wch: 40 }];

XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
XLSX.utils.book_append_sheet(workbook, infoSheet, "Test Info");

const sheets = workbook.SheetNames;
workbook.SheetNames = ["Test Info", "Summary", "Credentials", ...sheets.filter(s => !["Test Info", "Summary", "Credentials"].includes(s))];

XLSX.writeFile(workbook, "DS_SCM_Testing_Checklist.xlsx");
console.log("Excel file created: DS_SCM_Testing_Checklist.xlsx");
