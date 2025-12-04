# DS_SCM - eCommerce Supply Chain Management System

## Overview

DS_SCM is a comprehensive supply chain management system designed for eCommerce operations. The application manages the complete lifecycle of inventory, orders, logistics, and customer complaints. It provides role-based interfaces for administrators, warehouse staff, customer support, and stock management teams. The system supports both desktop and mobile (PWA) experiences, with desktop optimized for data-heavy operations and mobile optimized for on-the-go actions like scanning and status updates.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR and optimized production builds
- Wouter for lightweight client-side routing
- Progressive Web App (PWA) capabilities with manifest.json for mobile installation

**UI Framework & Styling**
- shadcn/ui component library built on Radix UI primitives for accessible, composable components
- Tailwind CSS with custom design tokens following Material Design principles with Linear's typography and Notion's information hierarchy
- Custom theming system supporting light/dark modes with CSS variables
- Design philosophy: Information density over whitespace, optimized for quick task completion
- Typography: Inter font family for UI, JetBrains Mono for monospace data (SKUs, order IDs)

**State Management**
- React Context API for global state (Auth, Theme, Mobile detection)
- TanStack Query (React Query) for server state management and caching
- Local component state with React hooks for UI interactions

**Responsive Design Strategy**
- Desktop-first for data-heavy operations with persistent sidebar navigation
- Mobile-optimized views with bottom navigation bar for one-handed operation
- Separate mobile page components (MobileDashboard, MobileOrders, etc.) for touch-optimized experiences
- Responsive breakpoint at 768px (md) for mobile/desktop switching

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for the API server
- HTTP server using Node's native `http` module for WebSocket upgrade capability
- Middleware chain: JSON body parsing, URL encoding, request logging with timestamps

**Data Layer**
- Drizzle ORM for type-safe database queries and schema management
- PostgreSQL as the primary database (configured via @neondatabase/serverless)
- Schema-first approach with Drizzle-Zod integration for runtime validation
- Memory storage implementation (MemStorage) for development/testing with interface-based design for easy database swapping
- **Important**: Neon HTTP driver has a known issue with boolean type mapping where PostgreSQL 't'/'f' values are incorrectly converted to JavaScript `false`. Use raw SQL with `::text` cast and `getBooleanValue()` helper function in `server/db.ts` to get correct boolean values.

**API Design**
- RESTful API pattern with `/api` prefix for all application routes
- Request/response logging middleware tracking method, path, status, and duration
- Credential-based authentication (cookies) for session management
- Separation of concerns: routes.ts for route definitions, storage.ts for data operations

**Build & Deployment**
- Custom build script using esbuild for server bundling with selective dependency bundling
- Separate client (Vite) and server (esbuild) build processes
- Production-ready bundle with externalized dependencies and optimized tree-shaking
- Development mode with Vite HMR and live reload

### Role-Based Access Control

**User Roles**
- **Admin**: Full system access including analytics, user management, and system settings
- **Warehouse**: Order fulfillment, inventory management, and dispatch operations
- **Customer Support**: Complaint handling, order status management, and customer communication
- **Stock Management**: Inventory tracking, stock receiving, and supplier coordination

**Context-Based Authorization**
- AuthContext provides current user role and authentication state
- Component-level role filtering for navigation items and feature access
- Role-specific page layouts and available actions

### Data Models

**Core Entities**
- **Users**: Authentication with username/password, role assignment
- **Products**: Multi-variant support (color, size), category organization
- **Product Variants**: SKU-based tracking with cost/selling prices, stock quantities
- **Orders**: Customer information, payment method (COD/prepaid), status workflow
- **Suppliers**: Contact details, GST information, active/inactive status
- **Courier Partners**: Third-party and in-house delivery options with API integration support
- **Complaints**: Ticket-based system with reason categorization and resolution workflow
- **Stock Movements**: Audit trail for inventory changes with timestamps and reasons
- **Internal Deliveries**: In-house delivery tracking with payment collection

**Status Workflows**
- Orders: pending → dispatched → delivered (or RTO → returned → refunded)
- Complaints: open → in_progress → resolved/rejected
- Internal Deliveries: assigned → out_for_delivery → delivered → payment_collected

### Key Features

**Inventory Management**
- Stock receiving with supplier tracking and invoice documentation
- Product variant management with color/size combinations
- Low stock alerts and reorder notifications
- Manual stock adjustment with reason tracking
- Stock movement history with filtering and search

**Order Processing**
- CSV import for bulk order creation (Shopify integration)
- Manual order dispatch with courier selection
- Third-party courier API integration framework
- In-house delivery assignment with driver tracking
- AWB number management for shipment tracking

**Complaint Management**
- Ticket-based system with unique ticket numbers
- Resolution options: refund, replacement, rejection
- Timeline tracking for complaint lifecycle
- Integration with order and inventory systems for replacements

**Mobile-Optimized Workflows**
- Invoice scanning with OCR for quick stock receiving
- Barcode/QR scanning for order verification
- One-tap status updates for delivery personnel
- Mobile payment collection (cash/QR code) for COD orders
- Touch-friendly action buttons and minimal input forms

## External Dependencies

### UI Component Libraries
- **@radix-ui/react-***: Comprehensive set of accessible, unstyled UI primitives (dialogs, dropdowns, tabs, etc.)
- **shadcn/ui**: Pre-styled components built on Radix UI following design system
- **lucide-react**: Icon library for consistent iconography

### Data & Forms
- **@tanstack/react-query**: Server state management with caching and automatic refetching
- **@hookform/resolvers**: Form validation integration with react-hook-form
- **zod**: Schema validation for runtime type checking
- **drizzle-zod**: Integration layer between Drizzle ORM and Zod validation

### Database & ORM
- **drizzle-orm**: Type-safe ORM for PostgreSQL with migrations support
- **@neondatabase/serverless**: Serverless PostgreSQL driver for edge deployments
- **drizzle-kit**: CLI tool for schema migrations and database introspection

### Styling & Theming
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variant management
- **clsx & tailwind-merge**: Conditional class name composition

### Utilities
- **date-fns**: Date manipulation and formatting
- **nanoid**: Unique ID generation for entities
- **wouter**: Minimal routing library for React

### Development Tools
- **vite**: Build tool with HMR and optimized production builds
- **tsx**: TypeScript execution for development server
- **@replit/vite-plugin-***: Replit-specific development tooling (runtime error overlay, cartographer, dev banner)

### Future Integration Points
- **CSV parsing**: papaparse for order/product imports
- **File handling**: multer for invoice/image uploads
- **Email notifications**: nodemailer for order/stock alerts
- **Payment processing**: Stripe integration framework
- **Session management**: express-session with connect-pg-simple for PostgreSQL-backed sessions
- **Authentication**: passport.js with local strategy
- **WebSocket support**: ws for real-time updates
- **Spreadsheet export**: xlsx for report generation