# DS_SCM - eCommerce Supply Chain Management System

## Overview

DS_SCM is a comprehensive supply chain management system for eCommerce, managing inventory, orders, logistics, and customer complaints. It provides role-based interfaces (admin, warehouse, customer support, stock management) and supports both desktop (data-heavy operations) and mobile PWA (on-the-go actions like scanning and status updates) experiences. Key features include a B2B corporate module with a 10-stage workflow, bulk import/export capabilities for products and orders, enhanced stock receiving with per-variant pricing, and a custom complaint reason input. The system aims to streamline eCommerce supply chain operations from end to end.

## User Preferences

Preferred communication style: Simple, everyday language.

## Test Credentials

### B2B Sales Employee
- **Email**: b2bsales@dsscm.com
- **Password**: b2btest123
- **Role**: B2B Sales (full B2B permissions - clients, orders, invoices, payments)

### Admin User
- **Email**: admin@dsscm.com
- **Password**: admin123
- **Role**: Admin (full system access)

## Development Notes

### B2B Module API Notes
- **Date fields**: All date fields (dueDate, invoiceDate, paymentDate, paidAt) accept ISO date strings and are converted to Date objects in storage layer
- **Payment field naming**: Use `paymentMode` not `paymentMethod` in API requests
- **Required fields**: 
  - B2B orders require `deliveryAddress` (NOT NULL constraint)
  - B2B invoices require `orderId`, `clientId`, `invoiceType`
  - B2B payments require `orderId`, `amount`, `paymentMode`
- **Permission structure**: B2B uses VIEW_ALL_B2B_DATA permission to allow managers to see all data; regular B2B employees only see their own clients/orders

## System Architecture

### Frontend Architecture

-   **Framework & Build System**: React 18, TypeScript, Vite, Wouter for routing, PWA capabilities.
-   **UI Framework & Styling**: shadcn/ui (built on Radix UI), Tailwind CSS with custom theming (light/dark modes), Material Design principles. Design philosophy prioritizes information density and quick task completion.
-   **State Management**: React Context API for global state, TanStack Query for server state and caching, React hooks for local component state.
-   **Responsive Design**: Desktop-first for data-heavy tasks, mobile-optimized views with separate components (e.g., MobileDashboard) for touch-optimized experiences.

### Backend Architecture

-   **Server Framework**: Express.js with TypeScript, Node's native `http` module for WebSocket upgrade capability.
-   **Data Layer**: Drizzle ORM for type-safe queries, PostgreSQL (@neondatabase/serverless) as the primary database, Drizzle-Zod for runtime validation. Specific workarounds implemented for Neon HTTP driver issues (Boolean type mapping, INSERT...RETURNING undefined, empty result sets returning null).
-   **API Design**: RESTful API (`/api` prefix), request/response logging, credential-based authentication (cookies).
-   **Build & Deployment**: Custom esbuild script for server bundling, separate client (Vite) and server (esbuild) build processes.

### Role-Based Access Control

-   **User Roles**: Admin, Warehouse, Customer Support, Stock Management with context-based authorization.
-   **Permissions**: Component-level role filtering for navigation and feature access.

### Data Models

-   **Core Entities**: Users, Products (multi-variant), Product Variants, Orders, Suppliers, Courier Partners, Complaints, Stock Movements, Internal Deliveries.
-   **Status Workflows**: Defined for Orders, Complaints, and Internal Deliveries.

### Key Features

-   **Inventory Management**: Stock receiving (multi-product, multi-variant pricing), variant management, low stock alerts, stock movement history.
-   **Order Processing**: Bulk import (CSV/Excel) from Shopify, manual dispatch with courier selection, AWB management.
-   **Complaint Management**: Ticket-based system, resolution options, timeline tracking.
-   **Mobile-Optimized Workflows**: Invoice scanning (OCR), barcode/QR scanning, one-tap status updates, mobile payment collection.
-   **B2B Corporate Module**: Dedicated B2B module with clients, orders, invoices, payments, and a 10-stage workflow, including payment milestone tracking.
-   **Courier Status Center**: Bulk order status updates via CSV/Excel, status history tracking.

## External Dependencies

### UI Component Libraries

-   **@radix-ui/react-\***: Accessible, unstyled UI primitives.
-   **shadcn/ui**: Styled components built on Radix UI.
-   **lucide-react**: Icon library.

### Data & Forms

-   **@tanstack/react-query**: Server state management.
-   **@hookform/resolvers**: Form validation integration.
-   **zod**: Schema validation.
-   **drizzle-zod**: Drizzle ORM and Zod integration.

### Database & ORM

-   **drizzle-orm**: Type-safe ORM for PostgreSQL.
-   **@neondatabase/serverless**: Serverless PostgreSQL driver.
-   **drizzle-kit**: Schema migrations and introspection.

### Styling & Theming

-   **tailwindcss**: Utility-first CSS framework.
-   **class-variance-authority**: Component variant management.
-   **clsx & tailwind-merge**: Class name composition.

### Utilities

-   **date-fns**: Date manipulation.
-   **nanoid**: Unique ID generation.
-   **wouter**: Minimal routing library.

### Development Tools

-   **vite**: Build tool.
-   **tsx**: TypeScript execution.
-   **@replit/vite-plugin-\***: Replit-specific tooling.