# DS_SCM - Detailed Application Analysis

## Executive Summary

**DS_SCM** (eCommerce Supply Chain Management System) is a comprehensive, full-stack web application designed to manage the entire supply chain lifecycle for eCommerce businesses. It handles everything from inventory management and order processing to B2B corporate orders, logistics, customer complaints, and financial tracking. The system is built with a modern tech stack and provides both desktop (data-heavy) and mobile PWA (action-oriented) interfaces.

---

## 1. Application Purpose & Use Cases

### Primary Purpose
DS_SCM is an enterprise-grade supply chain management platform that helps eCommerce businesses:
- Manage inventory across multiple product variants
- Process and fulfill customer orders (B2C)
- Handle corporate/B2B orders with complex workflows
- Track logistics and courier integrations
- Manage customer complaints and support tickets
- Monitor stock levels and receive inventory from suppliers
- Generate reports and analytics
- Handle payments and invoicing (especially for B2B)

### Target Users
1. **Super Admins**: Full system access, role management, user management
2. **Warehouse Staff**: Stock receiving, order dispatch, inventory management
3. **Customer Support**: Complaint management, order status updates
4. **Stock Management Team**: Inventory adjustments, supplier management
5. **Finance Team**: Payment tracking, invoicing (B2B)
6. **B2B Sales Team**: Client management, order creation, artwork approval workflows

---

## 2. Technical Architecture

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter (lightweight router)
- **State Management**: 
  - TanStack Query (React Query) for server state
  - React Context API for global state (Auth, Theme, Mobile detection)
- **UI Framework**: 
  - shadcn/ui components (built on Radix UI)
  - Tailwind CSS for styling
  - Custom theme system (light/dark mode)
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts
- **PWA**: Progressive Web App capabilities for mobile

### Backend Stack
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Neon serverless)
- **ORM**: Drizzle ORM (type-safe queries)
- **Validation**: Zod + Drizzle-Zod
- **Authentication**: Cookie-based sessions with bcrypt password hashing
- **HTTP Server**: Native Node.js `http` module (for WebSocket upgrade capability)
- **Build**: Custom esbuild script for server bundling

### Database Schema
The application uses a comprehensive PostgreSQL schema with the following main entities:

**Core Entities:**
- `users` - System users with role-based access
- `roles` - Dynamic roles with permissions
- `permissions` - Granular permission system
- `products` - Product master data
- `product_variants` - SKU-level inventory (color, size, etc.)
- `orders` - Customer orders (B2C)
- `order_items` - Order line items
- `suppliers` - Supplier/vendor information
- `courier_partners` - Logistics partners (Delhivery, etc.)
- `stock_movements` - Inventory transaction history
- `complaints` - Customer complaint tickets
- `internal_deliveries` - In-house courier deliveries
- `audit_logs` - System audit trail
- `settings` - System configuration

**B2B Module Entities:**
- `b2b_clients` - Corporate clients
- `b2b_orders` - B2B orders with 10-stage workflow
- `b2b_order_items` - Customized product orders
- `b2b_order_artwork` - Artwork files for printing
- `b2b_invoices` - Proforma and tax invoices
- `b2b_payments` - Payment records
- `b2b_payment_milestones` - Payment schedule tracking

---

## 3. Core Features & Modules

### 3.1 Order Management (B2C)
**Purpose**: Manage customer orders from eCommerce platforms (primarily Shopify)

**Key Features:**
- **Bulk Import**: CSV/Excel import from Shopify with automatic product/variant matching
- **Order Lifecycle**: 
  - Statuses: `pending` → `dispatched` → `delivered` / `rto` / `returned` / `refunded`
  - Payment statuses: `pending` → `paid` / `refunded` / `failed`
- **Dispatch Management**: 
  - Third-party courier integration (Delhivery API)
  - In-house courier assignment
  - AWB number tracking
- **Order Tracking**: Real-time status updates, history tracking
- **Bulk Status Updates**: CSV import for courier status updates

**Workflow:**
1. Orders imported from Shopify CSV
2. Orders appear in "Pending" status
3. Warehouse dispatches order (selects courier, generates AWB)
4. Status updates tracked via courier API or manual updates
5. Delivery confirmation or RTO handling

### 3.2 Inventory Management
**Purpose**: Track stock levels across product variants

**Key Features:**
- **Multi-Variant Products**: Products with SKUs (color, size combinations)
- **Stock Receiving**: 
  - Batch receiving from suppliers
  - Per-variant cost pricing
  - Invoice number tracking
  - Supplier association
- **Stock Movements**: Complete audit trail of all inventory changes
- **Low Stock Alerts**: Automatic alerts when stock falls below threshold
- **Stock Adjustments**: Manual adjustments with reason tracking
- **Stock History**: View all movements (inward, outward, adjustments)

**Workflow:**
1. Receive stock from supplier (via invoice scan or manual entry)
2. System creates stock movements for each variant
3. Updates stock quantities automatically
4. Alerts generated for low stock items
5. Stock deducted when orders are dispatched

### 3.3 Product Management
**Purpose**: Manage product catalog and variants

**Key Features:**
- **Product Master**: Name, description, category
- **Variant Management**: SKU, color, size, cost price, selling price
- **Bulk Import**: Shopify CSV import with automatic variant creation
- **Duplicate Detection**: SKU uniqueness validation
- **Stock Thresholds**: Low stock warning levels per variant

**Import Process:**
- Parses Shopify CSV format
- Groups by Handle (product identifier)
- Creates variants from Option1/Option2/Option3
- Validates SKU uniqueness
- Handles errors gracefully with detailed reporting

### 3.4 B2B Corporate Module
**Purpose**: Manage corporate/B2B orders with complex workflows

**Key Features:**
- **Client Management**: Corporate clients with billing/shipping addresses, GST numbers
- **10-Stage Order Workflow**:
  1. Order Received
  2. Design Review
  3. Client Approval
  4. Production Scheduled
  5. Printing In Progress
  6. Quality Check
  7. Packed
  8. Dispatched
  9. Delivered
  10. Closed
- **Artwork Management**: Upload and manage design files per order item
- **Customization**: Apparel type, color, fabric, printing type (DTG, screen, sublimation, embroidery)
- **Size Breakup**: JSON-based size distribution tracking
- **Invoicing**: 
  - Proforma invoices
  - Tax invoices
  - Version control
- **Payment Management**:
  - Payment milestones (advance, partial, final)
  - Multiple payment modes (cash, UPI, bank transfer, card, cheque)
  - Payment status tracking (not_paid, advance_received, partially_paid, fully_paid, overdue)
  - Balance pending calculations

**B2B Workflow:**
1. Create B2B client
2. Create order with items (apparel + customization details)
3. Upload artwork files
4. Move through workflow stages
5. Generate invoices at appropriate stages
6. Track payments against milestones
7. Update order status as production progresses

### 3.5 Complaint Management
**Purpose**: Handle customer complaints and support tickets

**Key Features:**
- **Ticket System**: Unique ticket numbers (TKT-XXXXX)
- **Complaint Reasons**: 
  - Wrong item
  - Damaged
  - Delayed
  - Not received
  - Quality issues
  - Size exchange
  - Other
- **Status Tracking**: `open` → `in_progress` → `resolved` / `rejected`
- **Timeline**: Complete history of actions and comments
- **Assignment**: Assign to support staff
- **Resolution Types**: Refund, replacement, rejected

**Workflow:**
1. Customer complaint received
2. Ticket created with order association
3. Assigned to support staff
4. Investigation and updates via timeline
5. Resolution (refund/replacement) or rejection

### 3.6 Courier & Logistics
**Purpose**: Manage shipping and delivery

**Key Features:**
- **Courier Partners**: Manage third-party courier companies
- **Delhivery Integration**: 
  - API integration for shipment creation
  - Waybill generation
  - Pincode serviceability check
  - Shipment tracking
  - Shipment cancellation
- **In-House Delivery**: 
  - Assign deliveries to staff
  - Track delivery status
  - Payment collection (COD)
  - Delivery events timeline
- **AWB Management**: Track air waybill numbers
- **Bulk Status Updates**: Import courier status updates via CSV

### 3.7 Internal Delivery Management
**Purpose**: Manage in-house courier deliveries

**Key Features:**
- **Assignment**: Assign orders to delivery staff
- **Status Tracking**: 
  - `assigned` → `out_for_delivery` → `delivered` / `failed` / `rto`
- **Payment Collection**: 
  - COD payment tracking
  - Payment mode (cash, UPI, QR)
  - Amount collected
- **Delivery Events**: Timeline of delivery attempts and updates
- **Location Tracking**: Optional location updates

### 3.8 User & Role Management
**Purpose**: Control access and permissions

**Key Features:**
- **Role-Based Access Control (RBAC)**:
  - Dynamic roles (Admin, Customer Support, Warehouse, Stock Management)
  - Granular permissions (50+ permission codes)
  - Super admin override
- **Permission System**: 
  - Module-based permissions
  - View, Create, Edit, Delete, Manage permissions per module
- **User Management**: 
  - Create/edit users
  - Assign roles
  - Activate/deactivate users
  - Password management
- **Audit Logging**: Complete audit trail of all user actions

**Default Roles:**
- **Super Admin**: Full access, cannot be deleted
- **Admin**: Full system access (all permissions)
- **Customer Support**: View orders, manage complaints
- **Warehouse**: Dispatch orders, manage inventory
- **Stock Management**: Inventory and supplier management

### 3.9 Reports & Analytics
**Purpose**: Business intelligence and reporting

**Key Features:**
- **Dashboard Stats**: 
  - Order counts by status
  - Inventory metrics
  - Complaint statistics
  - Revenue tracking
  - Low stock alerts
- **Order Reports**: Filter by status, date range, payment status
- **Inventory Reports**: Stock levels, movements, supplier reports
- **B2B Reports**: Order status, payment status, revenue by client

### 3.10 Mobile PWA Features
**Purpose**: On-the-go operations for warehouse and delivery staff

**Key Features:**
- **Mobile-Optimized UI**: Touch-friendly interface
- **Invoice Scanning**: OCR-based invoice scanning (planned)
- **Barcode Scanning**: Product/SKU scanning
- **Quick Actions**: 
  - Receive stock
  - Dispatch orders
  - Update order status
  - Collect payments
- **Mobile Dashboard**: Simplified view with key metrics
- **Bottom Navigation**: Easy access to main features

---

## 4. API Architecture

### Authentication
- **Method**: Cookie-based sessions
- **Session Duration**: 24 hours
- **Security**: 
  - HTTP-only cookies
  - Secure flag in production
  - SameSite: lax
- **Endpoints**:
  - `POST /api/auth/login` - User login
  - `POST /api/auth/logout` - User logout
  - `GET /api/auth/me` - Current user info
  - `GET /api/auth/permissions` - User permissions

### API Structure
All APIs follow RESTful conventions with `/api` prefix:

**Order APIs:**
- `GET /api/orders` - List orders (with filters)
- `GET /api/orders/:id` - Order details
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id` - Update order
- `POST /api/orders/:id/status` - Update status
- `POST /api/orders/:id/dispatch` - Dispatch order
- `POST /api/orders/import` - Bulk import
- `POST /api/orders/bulk-status` - Bulk status update

**Product APIs:**
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `POST /api/products/import` - Bulk import
- `POST /api/products/:id/variants` - Add variant

**Inventory APIs:**
- `GET /api/stock-movements` - Stock movement history
- `POST /api/stock-movements` - Create movement
- `POST /api/stock-movements/batch-receive` - Batch stock receive

**B2B APIs:**
- `GET /api/b2b/clients` - List clients
- `POST /api/b2b/orders` - Create B2B order
- `GET /api/b2b/invoices` - List invoices
- `POST /api/b2b/payments` - Record payment

**Courier APIs:**
- `GET /api/courier/delhivery/status` - Delhivery config status
- `POST /api/courier/delhivery/ship/:orderId` - Create shipment
- `GET /api/courier/delhivery/track/:awb` - Track shipment

### Error Handling
- Consistent error response format: `{ error: string }`
- HTTP status codes: 200, 201, 400, 401, 403, 404, 500
- Request/response logging for API calls
- Error middleware catches unhandled errors

---

## 5. Data Flow & Workflows

### Order Processing Flow
```
Shopify CSV Export
    ↓
Bulk Import API
    ↓
Order Created (pending)
    ↓
Warehouse Reviews Order
    ↓
Dispatch Order (select courier)
    ↓
AWB Generated / Assigned
    ↓
Status: Dispatched
    ↓
Courier Updates Status
    ↓
Status: Delivered / RTO
```

### Stock Receiving Flow
```
Supplier Invoice Received
    ↓
Scan Invoice (OCR) OR Manual Entry
    ↓
Select Products & Variants
    ↓
Enter Quantities & Cost Prices
    ↓
Submit Batch Receive
    ↓
Stock Movements Created
    ↓
Variant Stock Updated
    ↓
Audit Log Created
```

### B2B Order Flow
```
Create B2B Client
    ↓
Create B2B Order
    ↓
Upload Artwork Files
    ↓
Design Review → Client Approval
    ↓
Production Scheduled
    ↓
Printing → Quality Check → Packed
    ↓
Generate Invoice
    ↓
Dispatch → Deliver
    ↓
Track Payments
    ↓
Close Order
```

### Complaint Resolution Flow
```
Customer Complaint
    ↓
Create Ticket
    ↓
Assign to Support Staff
    ↓
Investigation (Timeline Updates)
    ↓
Resolution Decision
    ↓
Refund/Replacement OR Reject
    ↓
Ticket Closed
```

---

## 6. Security & Permissions

### Permission System
The application uses a granular permission system with 50+ permission codes:

**Permission Categories:**
- Dashboard: `view_dashboard`
- Orders: `view_orders`, `create_orders`, `edit_orders`, `delete_orders`, `dispatch_orders`, `import_orders`
- Products: `view_products`, `create_products`, `edit_products`, `delete_products`, `import_products`
- Inventory: `view_inventory`, `manage_inventory`, `adjust_stock`
- Suppliers: `view_suppliers`, `manage_suppliers`
- Complaints: `view_complaints`, `manage_complaints`, `resolve_complaints`
- Deliveries: `view_deliveries`, `manage_deliveries`, `collect_payments`
- Users: `view_users`, `manage_users`
- Roles: `view_roles`, `manage_roles` (Super Admin only)
- Settings: `view_settings`, `manage_settings`
- B2B: `view_b2b_clients`, `manage_b2b_clients`, `view_b2b_orders`, `create_b2b_orders`, etc.

### Authorization
- **Middleware**: `authMiddleware` - Validates session
- **Permission Middleware**: `requirePermission(...permissions)` - Checks user permissions
- **Super Admin Check**: `requireSuperAdmin` - Super admin only
- **Frontend**: Components check permissions before rendering

### Security Features
- Password hashing with bcrypt (10 salt rounds)
- Session expiration (24 hours)
- HTTP-only cookies
- SQL injection prevention (parameterized queries)
- Input validation with Zod schemas
- Audit logging for sensitive operations

---

## 7. Integration Points

### External Integrations

**1. Delhivery API**
- Shipment creation
- Waybill generation
- Pincode serviceability
- Shipment tracking
- Shipment cancellation
- Supports both staging and live environments

**2. Shopify Integration** (via CSV Import)
- Order import format
- Product import format
- Automatic mapping of Shopify fields

**3. Neon Database**
- Serverless PostgreSQL
- HTTP-based queries
- Connection pooling

### Internal Integrations
- File upload handling (artwork, invoices)
- Email notifications (planned)
- SMS notifications (planned)

---

## 8. UI/UX Design Philosophy

### Design Principles
1. **Information Density**: Maximize visible data without clutter
2. **Action-Oriented**: Optimized for quick task completion
3. **Role-Specific**: Different interfaces for different user roles
4. **Mobile-First Operations**: Touch-friendly for warehouse/delivery staff

### Design System
- **Typography**: Inter font family
- **Spacing**: Tailwind utility classes (2, 4, 6, 8px units)
- **Colors**: Theme-aware (light/dark mode)
- **Components**: shadcn/ui component library
- **Icons**: Lucide React
- **Layout**: Responsive grid system

### Key UI Patterns
- **Data Tables**: Sortable, filterable, paginated
- **Modals**: For forms and confirmations
- **Sheets**: Side panels for details
- **Cards**: Information grouping
- **Badges**: Status indicators
- **Toast Notifications**: User feedback

---

## 9. Business Logic Highlights

### Order Number Generation
- Format: `ORD-YYYY-XXXXX` (e.g., ORD-2024-00123)
- Uses timestamp + random component to prevent race conditions
- Uniqueness validation with retry logic

### Stock Management
- Stock quantities tracked at variant level
- Movements tracked with before/after quantities
- Low stock alerts based on threshold
- Cost price tracking per variant

### Payment Tracking (B2B)
- Payment milestones with percentages
- Automatic payment status calculation
- Balance pending calculations
- Multiple payment modes supported

### Status Workflows
- Order statuses: Linear workflow with specific transitions
- Complaint statuses: Open → In Progress → Resolved/Rejected
- B2B order statuses: 10-stage workflow
- Delivery statuses: Assigned → Out for Delivery → Delivered/Failed

---

## 10. Deployment & Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: `development` or `production`
- `DELHIVERY_API_TOKEN`: Delhivery API token
- `DELHIVERY_MODE`: `staging` or `live`

### Build Process
1. **Client**: Vite builds React app
2. **Server**: esbuild bundles Express server
3. **Database**: Drizzle Kit handles migrations

### Deployment
- Designed for Replit deployment
- Single port serving both API and client
- Static file serving in production
- Vite dev server in development

---

## 11. Known Limitations & Future Enhancements

### Current Limitations
- OCR invoice scanning (UI exists, backend integration pending)
- Email/SMS notifications (planned)
- Advanced reporting/analytics (basic reports exist)
- Multi-warehouse support (single warehouse assumed)
- Barcode scanning (UI exists, hardware integration pending)

### Potential Enhancements
- Real-time notifications (WebSocket)
- Advanced analytics dashboard
- Export capabilities (PDF reports, Excel exports)
- Mobile app (native)
- Multi-currency support
- Tax calculation automation
- Automated reorder points
- Supplier portal
- Customer portal for order tracking

---

## 12. Code Quality & Architecture

### Strengths
- Type-safe codebase (TypeScript throughout)
- Consistent error handling
- Comprehensive audit logging
- Modular code structure
- Separation of concerns (routes, storage, services)
- Reusable components
- Permission-based access control

### Areas for Improvement
- Some code duplication (could use more shared utilities)
- Error messages could be more user-friendly
- Some functions are quite long (could be refactored)
- Test coverage (no tests currently)
- Documentation (API documentation could be improved)

---

## Conclusion

DS_SCM is a well-architected, feature-rich supply chain management system that handles the complete lifecycle of eCommerce operations. It successfully combines B2C order management with sophisticated B2B workflows, comprehensive inventory tracking, and robust permission systems. The dual interface approach (desktop + mobile PWA) makes it versatile for different user roles and use cases.

The application demonstrates good software engineering practices with type safety, proper error handling, and a scalable architecture. While there are areas for enhancement (notifications, advanced analytics, etc.), the core functionality is solid and production-ready.
