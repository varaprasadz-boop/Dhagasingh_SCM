# DS_SCM - Complete Testing Checklist

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dsscm.com | admin123 |
| B2B Sales | b2bsales@dsscm.com | b2btest123 |

---

## AUTHENTICATION

- [ ] Login page loads correctly
- [ ] Login with valid admin credentials
- [ ] Login with valid B2B credentials
- [ ] Invalid credentials show error message
- [ ] Logout functionality works
- [ ] Session persists on page refresh
- [ ] Unauthorized routes redirect to login

---

## MAIN NAVIGATION TABS

### 1. Dashboard (/)

- [ ] Dashboard loads with key metrics
- [ ] Summary cards display correctly (orders, inventory, complaints)
- [ ] Charts/graphs render properly
- [ ] Quick action links work

### 2. Products (/products)

- [ ] Product list displays with pagination
- [ ] Add new product with name, SKU, description
- [ ] Add product variants (size, color, etc.)
- [ ] Edit existing product
- [ ] Delete product (with confirmation)
- [ ] Search/filter products
- [ ] View product details

### 3. Orders (/orders)

- [ ] Order list displays with status badges
- [ ] Create manual order
- [ ] Bulk import orders via CSV/Excel
- [ ] View order details
- [ ] Update order status
- [ ] Assign courier partner
- [ ] Add/update AWB number
- [ ] Filter by status, date range
- [ ] Search by order ID, customer

### 4. Inventory (/inventory)

- [ ] Inventory list with stock levels
- [ ] Stock receiving - add stock for products
- [ ] Per-variant pricing during stock receive
- [ ] Multi-product stock receiving
- [ ] Low stock alerts visible
- [ ] Stock movement history
- [ ] Filter by product, variant

### 5. Internal Delivery (/internal-delivery)

- [ ] Internal delivery list displays
- [ ] Create new internal delivery
- [ ] Update delivery status
- [ ] View delivery timeline
- [ ] Assign warehouse location

### 6. Suppliers (/suppliers)

- [ ] Supplier list displays
- [ ] Add new supplier with contact details
- [ ] Edit supplier information
- [ ] Delete supplier
- [ ] Search/filter suppliers

### 7. Couriers (/couriers)

- [ ] Courier partner list displays
- [ ] Add new courier partner
- [ ] Edit courier details
- [ ] Set courier as active/inactive
- [ ] View courier performance metrics

### 8. Courier Status (/courier-status)

- [ ] Bulk status update interface loads
- [ ] Upload CSV/Excel for bulk status update
- [ ] Preview changes before applying
- [ ] Status history tracking
- [ ] Error handling for invalid data

### 9. Complaints (/complaints)

- [ ] Complaint list displays
- [ ] Create new complaint ticket
- [ ] Link complaint to order
- [ ] Custom complaint reason input
- [ ] Update complaint status
- [ ] Add resolution notes
- [ ] View complaint timeline
- [ ] Filter by status, date

### 10. Reports (/reports)

- [ ] Report page loads
- [ ] Generate sales report
- [ ] Generate inventory report
- [ ] Date range selection works
- [ ] Export reports (if available)

### 11. Users (/users)

- [ ] User list displays
- [ ] Add new user with role assignment
- [ ] Edit user information
- [ ] Deactivate/activate user
- [ ] Reset password functionality
- [ ] Role-based permission assignment

### 12. Roles (/roles) - Super Admin Only

- [ ] Role list displays
- [ ] Create new role
- [ ] Edit role permissions
- [ ] Delete role (with validation)
- [ ] Permission checkboxes work correctly

### 13. Settings (/settings)

- [ ] Settings page loads
- [ ] Update company information
- [ ] Configure notification preferences
- [ ] Save settings successfully

---

## B2B CORPORATE MODULE

### B2B Dashboard (/b2b)

- [ ] B2B metrics display correctly
- [ ] Client count, order summary, payment status
- [ ] Quick links to B2B sections

### B2B Clients (/b2b/clients)

- [ ] Client list displays
- [ ] Add new client with company details
- [ ] Edit client information
- [ ] View client order history
- [ ] Sales employee sees only their clients
- [ ] Manager with VIEW_ALL_B2B_DATA sees all clients

### B2B Orders (/b2b/orders)

- [ ] Order list displays
- [ ] Create new B2B order
- [ ] Delivery address capture (required field)
- [ ] Add special instructions
- [ ] Select client from dropdown

#### 10-Stage Workflow Status Changes:

- [ ] Inquiry
- [ ] Quote Sent
- [ ] Quote Approved
- [ ] Design Pending
- [ ] Design Approved
- [ ] Production
- [ ] Quality Check
- [ ] Ready for Dispatch
- [ ] Dispatched
- [ ] Delivered

#### Additional Order Tests:

- [ ] View order details (/b2b/orders/:id)
- [ ] Filter by status, client, date

### B2B Invoices (/b2b/invoices)

- [ ] Invoice list displays
- [ ] Create Proforma Invoice
- [ ] Create Tax Invoice
- [ ] Auto-calculate tax (taxAmount = subtotal × taxRate / 100)
- [ ] Auto-calculate total (subtotal + taxAmount - discount)
- [ ] Default taxRate: 18%, default discount: 0
- [ ] Due date selection
- [ ] View/download invoice PDF (if available)
- [ ] Invoice status updates (Draft → Sent → Paid)

### B2B Payments (/b2b/payments)

- [ ] Payment list displays
- [ ] Record new payment
- [ ] Payment modes work: Bank Transfer, Cheque, Cash, UPI
- [ ] paymentMode field saves correctly
- [ ] transactionRef field saves correctly
- [ ] remarks field saves correctly
- [ ] Link payment to order
- [ ] Payment milestone tracking
- [ ] View payment history per order

---

## MOBILE PWA EXPERIENCE

### Mobile Dashboard (/)

- [ ] Mobile-optimized dashboard loads
- [ ] Touch-friendly cards and metrics
- [ ] Quick action buttons work

### Mobile Scan (/scan)

- [ ] Barcode/QR scanner opens
- [ ] Camera permissions requested
- [ ] Successful scan triggers action
- [ ] Manual entry fallback

### Mobile Orders (/orders)

- [ ] Order list scrolls smoothly
- [ ] Pull to refresh
- [ ] Quick status updates
- [ ] One-tap actions

### Mobile Stock (/stock)

- [ ] Stock list displays
- [ ] Quick stock updates
- [ ] Low stock indicators

### Mobile Profile (/profile)

- [ ] Profile information displays
- [ ] Edit profile
- [ ] Logout button works

### Bottom Navigation

- [ ] Home, Scan, Orders, Stock, Profile tabs work
- [ ] Active tab highlighted
- [ ] Smooth transitions

---

## CROSS-CUTTING CONCERNS

### Role-Based Access Control

- [ ] Admin sees all menu items
- [ ] B2B Sales sees only B2B module
- [ ] Warehouse role sees relevant items only
- [ ] Customer Support sees complaints/orders
- [ ] Unauthorized routes blocked

### Data Validation

- [ ] Required field validation on all forms
- [ ] Numeric fields accept only numbers
- [ ] Date pickers work correctly
- [ ] Dropdown selections required

### Error Handling

- [ ] API errors show user-friendly messages
- [ ] Network errors handled gracefully
- [ ] Form validation errors displayed

### UI/UX

- [ ] Dark/Light theme toggle works
- [ ] Responsive on different screen sizes
- [ ] Loading states displayed
- [ ] Toast notifications appear
- [ ] Modal dialogs close properly

---

## BULK OPERATIONS

### Order Import

- [ ] CSV file upload works
- [ ] Excel file upload works
- [ ] Shopify format import
- [ ] Validation errors displayed
- [ ] Preview before import
- [ ] Success confirmation with count

### Courier Status Bulk Update

- [ ] CSV upload for status updates
- [ ] Excel upload for status updates
- [ ] Column mapping works
- [ ] Error rows highlighted
- [ ] Partial success handling

---

## DATABASE & DATA INTEGRITY

- [ ] Orders reference valid products
- [ ] Payments linked to valid orders
- [ ] Invoices linked to valid orders and clients
- [ ] Stock movements tracked correctly
- [ ] Soft delete preserves historical data

---

## PERFORMANCE

- [ ] Page load times acceptable (<3 seconds)
- [ ] Large lists paginate properly
- [ ] Filters respond quickly
- [ ] No UI freezing during operations

---

## TEST SUMMARY

| Section | Total Tests | Passed | Failed | Notes |
|---------|-------------|--------|--------|-------|
| Authentication | 7 | | | |
| Dashboard | 4 | | | |
| Products | 7 | | | |
| Orders | 9 | | | |
| Inventory | 7 | | | |
| Internal Delivery | 5 | | | |
| Suppliers | 5 | | | |
| Couriers | 5 | | | |
| Courier Status | 5 | | | |
| Complaints | 8 | | | |
| Reports | 5 | | | |
| Users | 6 | | | |
| Roles | 5 | | | |
| Settings | 4 | | | |
| B2B Dashboard | 3 | | | |
| B2B Clients | 6 | | | |
| B2B Orders | 15 | | | |
| B2B Invoices | 9 | | | |
| B2B Payments | 9 | | | |
| Mobile PWA | 17 | | | |
| Cross-Cutting | 15 | | | |
| Bulk Operations | 11 | | | |
| Database | 5 | | | |
| Performance | 4 | | | |
| **TOTAL** | **171** | | | |

---

**Tested By:** ____________________  
**Date:** ____________________  
**Environment:** Development / Staging / Production  
**Browser:** ____________________  
**Device:** ____________________
