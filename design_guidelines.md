# DS_SCM Design Guidelines

## Design Approach
**System-Based Approach**: Material Design for data-heavy operations with Linear's clean typography and Notion's information hierarchy. This enterprise tool prioritizes efficiency, clarity, and quick task completion over visual flourish.

## Core Design Principles
1. **Information Density Over Whitespace**: Maximize visible data without clutter - users need to see multiple orders/products at once
2. **Action-Oriented**: Every screen optimized for quick task completion (scan, dispatch, update status)
3. **Role-Specific Layouts**: Different interfaces for Admin (analytics-heavy), Warehouse (action-heavy), Support (ticket-focused)
4. **Mobile-First for Operations**: PWA prioritizes touch-friendly, one-handed scanning and status updates

---

## Typography
- **Headings**: Inter Bold - H1: 32px, H2: 24px, H3: 18px
- **Body**: Inter Regular - 15px for desktop, 16px for mobile
- **Data Tables**: Inter Medium - 14px (compact yet readable)
- **Input Labels**: Inter Medium - 13px, uppercase tracking
- **Monospace**: JetBrains Mono - 14px for SKUs, AWB numbers, order IDs

---

## Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8 for consistent rhythm
- Component padding: p-4 to p-6
- Section spacing: my-6 to my-8
- Form field gaps: gap-4
- Table cell padding: p-3

**Grid Structure**:
- Desktop: 12-column grid with max-w-7xl container
- Data tables: Full-width with horizontal scroll on mobile
- Forms: 2-column layouts (lg:grid-cols-2) for efficiency
- Dashboard: 3-4 column card grid (lg:grid-cols-4)

---

## Desktop Web App Layout

**Navigation**: Persistent left sidebar (w-64) with:
- Logo/branding at top
- Role-based menu items with icons (Heroicons outline)
- Active state with subtle left border indicator
- User profile and logout at bottom

**Main Content Area**:
- Sticky top bar with: breadcrumbs, search, notifications, quick actions
- Content with max-w-6xl centering for readability
- Floating action buttons for primary actions (bottom-right corner)

**Dashboard Components**:
- 4-column KPI cards at top (grid-cols-4) - Inventory count, Pending orders, Active complaints, Today's dispatches
- 2-column section below: Left - Recent orders table, Right - Stock alerts/low inventory
- Charts use Chart.js for inventory trends and order status distribution

**Data Tables**:
- Sticky header rows
- Row hover states for selection clarity
- Inline action buttons (Edit, Dispatch, View) on row hover
- Bulk selection checkboxes with sticky bulk action bar
- Pagination at bottom with items per page selector

**Forms**:
- Two-column layouts for efficiency
- Grouped related fields with subtle dividers
- Input validation with inline error messages
- Auto-complete for product/supplier selection
- File upload zones for CSV imports with drag-drop

---

## Mobile PWA Layout

**Bottom Navigation**: 5 tabs with icons only
- Home (Dashboard), Scan, Orders, Stock, Profile
- Active state with icon fill and small indicator dot

**Home Screen**:
- Compact KPI cards (2-column grid)
- Quick action buttons: "Receive Stock", "Dispatch Order", "Scan Invoice"
- Scrollable recent activity feed

**Scan Interface** (OCR Feature):
- Full-screen camera viewfinder
- Overlay guides for invoice placement
- Bottom sheet for extracted data review
- Large "Confirm & Add Stock" button
- Edit fields accessible via tap

**Order Management**:
- Swipeable order cards with status badges
- Tap card to expand details
- Bottom action buttons: "Update Status", "Add AWB", "Contact Customer"
- Filter chips at top for status quick-filter

**Stock Receiving**:
- Step-by-step wizard with progress indicator
- Large touch targets for quantity +/- buttons
- Barcode scanner icon in input fields
- Preview summary before confirm

**In-House Courier View**:
- List view of assigned deliveries
- Each card shows: address, payment method, amount
- Tap to expand: full address, map preview (Google Maps embed), contact button
- Payment collection: Toggle between QR code display and "Cash Received" button
- Success confirmation with checkmark animation

---

## Component Library

**Buttons**:
- Primary: Solid with medium font weight, px-6 py-3
- Secondary: Outlined with 2px border
- Icon buttons: p-2 with circular hover state
- FAB: Large circular (w-14 h-14) with shadow-lg

**Cards**:
- Rounded corners (rounded-lg)
- Shadow: shadow-sm default, shadow-md on hover
- Header with title and action icon
- Content padding: p-6

**Status Badges**:
- Rounded-full px-3 py-1
- Uppercase text (text-xs font-medium)
- Pending, Dispatched, Delivered, RTO, Returned, Refunded states

**Inputs**:
- Border-2 with focus ring
- Height: h-11 for text inputs
- Labels above inputs with required asterisk
- Helper text below in smaller font

**Modals**:
- Centered overlay with backdrop blur
- Max-width: max-w-2xl for forms, max-w-4xl for tables
- Sticky header with close button
- Sticky footer with action buttons

**Tables**:
- Alternating row backgrounds for scannability
- Sortable column headers with arrow indicators
- Responsive: cards on mobile, table on desktop
- Fixed column widths for consistency

**File Upload**:
- Dashed border upload zone
- Drag-drop with hover state
- File type/size limits displayed
- Preview uploaded files with remove option

---

## Animations
Minimal and purposeful only:
- Smooth page transitions (200ms ease)
- Success confirmation: Checkmark scale animation (300ms)
- Loading states: Subtle skeleton screens
- Mobile: Swipe gestures for card actions

---

## Images
No hero imagery. This is a data-first application.

**Icons Only**:
- Heroicons throughout for consistency
- Product placeholder icons for items without images
- Courier logos in courier selection dropdowns

**Mobile Camera**:
- Live camera feed for invoice scanning
- Invoice image thumbnail in confirmation screen

---

## Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation throughout
- Focus indicators on all inputs and buttons
- Screen reader text for status badges
- Minimum touch target: 44x44px on mobile
- Sufficient contrast ratios (WCAG AA minimum)