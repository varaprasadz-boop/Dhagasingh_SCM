--
-- PostgreSQL database dump
--

\restrict yUiii3WaFSyCbyNj5apfLbKmpCStqciELe8MsIstO4ExUJaVbw38vup7ZGByyUS

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: b2b_invoice_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.b2b_invoice_status AS ENUM (
    'draft',
    'sent',
    'paid',
    'cancelled'
);


ALTER TYPE public.b2b_invoice_status OWNER TO postgres;

--
-- Name: b2b_invoice_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.b2b_invoice_type AS ENUM (
    'proforma',
    'tax'
);


ALTER TYPE public.b2b_invoice_type OWNER TO postgres;

--
-- Name: b2b_order_priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.b2b_order_priority AS ENUM (
    'normal',
    'urgent'
);


ALTER TYPE public.b2b_order_priority OWNER TO postgres;

--
-- Name: b2b_order_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.b2b_order_status AS ENUM (
    'order_received',
    'design_review',
    'client_approval',
    'production_scheduled',
    'printing_in_progress',
    'quality_check',
    'packed',
    'dispatched',
    'delivered',
    'closed',
    'cancelled'
);


ALTER TYPE public.b2b_order_status OWNER TO postgres;

--
-- Name: b2b_payment_mode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.b2b_payment_mode AS ENUM (
    'cash',
    'upi',
    'bank_transfer',
    'card',
    'cheque',
    'online_gateway'
);


ALTER TYPE public.b2b_payment_mode OWNER TO postgres;

--
-- Name: b2b_payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.b2b_payment_status AS ENUM (
    'not_paid',
    'advance_received',
    'partially_paid',
    'fully_paid',
    'overdue'
);


ALTER TYPE public.b2b_payment_status OWNER TO postgres;

--
-- Name: b2b_printing_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.b2b_printing_type AS ENUM (
    'dtg',
    'screen',
    'sublimation',
    'embroidery'
);


ALTER TYPE public.b2b_printing_type OWNER TO postgres;

--
-- Name: complaint_reason; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.complaint_reason AS ENUM (
    'wrong_item',
    'damaged',
    'delayed',
    'not_received',
    'quality',
    'size_exchange',
    'other'
);


ALTER TYPE public.complaint_reason OWNER TO postgres;

--
-- Name: complaint_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.complaint_status AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'rejected'
);


ALTER TYPE public.complaint_status OWNER TO postgres;

--
-- Name: courier_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.courier_type AS ENUM (
    'third_party',
    'in_house'
);


ALTER TYPE public.courier_type OWNER TO postgres;

--
-- Name: delivery_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.delivery_status AS ENUM (
    'assigned',
    'out_for_delivery',
    'delivered',
    'payment_collected',
    'failed',
    'rto'
);


ALTER TYPE public.delivery_status OWNER TO postgres;

--
-- Name: order_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'dispatched',
    'delivered',
    'rto',
    'returned',
    'refunded',
    'cancelled'
);


ALTER TYPE public.order_status OWNER TO postgres;

--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_method AS ENUM (
    'cod',
    'prepaid'
);


ALTER TYPE public.payment_method OWNER TO postgres;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'paid',
    'refunded',
    'failed'
);


ALTER TYPE public.payment_status OWNER TO postgres;

--
-- Name: stock_movement_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.stock_movement_type AS ENUM (
    'inward',
    'outward',
    'adjustment'
);


ALTER TYPE public.stock_movement_type OWNER TO postgres;

--
-- Name: user_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_status AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE public.user_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    action text NOT NULL,
    module text NOT NULL,
    entity_id text,
    entity_type text,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: b2b_clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.b2b_clients (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_name text NOT NULL,
    contact_person text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    alternate_phone text,
    industry_type text,
    gst_number text,
    pan_number text,
    billing_address text,
    billing_city text,
    billing_state text,
    billing_zip text,
    billing_country text DEFAULT 'India'::text,
    shipping_address text,
    shipping_city text,
    shipping_state text,
    shipping_zip text,
    shipping_country text DEFAULT 'India'::text,
    notes text,
    status public.user_status DEFAULT 'active'::public.user_status NOT NULL,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.b2b_clients OWNER TO postgres;

--
-- Name: b2b_invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.b2b_invoices (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    invoice_number text NOT NULL,
    order_id character varying NOT NULL,
    client_id character varying NOT NULL,
    invoice_type public.b2b_invoice_type NOT NULL,
    invoice_date timestamp without time zone DEFAULT now() NOT NULL,
    due_date timestamp without time zone,
    subtotal numeric(10,2) NOT NULL,
    tax_rate numeric(5,2) DEFAULT '18'::numeric NOT NULL,
    tax_amount numeric(10,2) NOT NULL,
    discount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status public.b2b_invoice_status DEFAULT 'draft'::public.b2b_invoice_status NOT NULL,
    pdf_url text,
    notes text,
    version integer DEFAULT 1 NOT NULL,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.b2b_invoices OWNER TO postgres;

--
-- Name: b2b_order_artwork; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.b2b_order_artwork (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    order_item_id character varying,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text,
    file_size integer,
    description text,
    uploaded_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.b2b_order_artwork OWNER TO postgres;

--
-- Name: b2b_order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.b2b_order_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    product_id character varying,
    apparel_type text NOT NULL,
    color text NOT NULL,
    fabric text,
    printing_type public.b2b_printing_type NOT NULL,
    print_placement text,
    size_breakup jsonb NOT NULL,
    total_quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    printing_cost_per_unit numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    total_price numeric(10,2) NOT NULL,
    special_instructions text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.b2b_order_items OWNER TO postgres;

--
-- Name: b2b_order_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.b2b_order_status_history (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    status public.b2b_order_status NOT NULL,
    comment text,
    changed_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.b2b_order_status_history OWNER TO postgres;

--
-- Name: b2b_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.b2b_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_number text NOT NULL,
    client_id character varying NOT NULL,
    event_type text,
    delivery_address text NOT NULL,
    delivery_city text,
    delivery_state text,
    delivery_zip text,
    delivery_country text DEFAULT 'India'::text,
    required_delivery_date timestamp without time zone,
    priority public.b2b_order_priority DEFAULT 'normal'::public.b2b_order_priority NOT NULL,
    status public.b2b_order_status DEFAULT 'order_received'::public.b2b_order_status NOT NULL,
    subtotal numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    printing_cost numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    design_charges numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    discount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    tax_rate numeric(5,2) DEFAULT '18'::numeric NOT NULL,
    tax_amount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    total_amount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    payment_status public.b2b_payment_status DEFAULT 'not_paid'::public.b2b_payment_status NOT NULL,
    amount_received numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    balance_pending numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    special_instructions text,
    internal_notes text,
    cancellation_reason text,
    delay_reason text,
    courier_partner_id character varying,
    awb_number text,
    dispatch_date timestamp without time zone,
    delivery_date timestamp without time zone,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.b2b_orders OWNER TO postgres;

--
-- Name: b2b_payment_milestones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.b2b_payment_milestones (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    name text NOT NULL,
    percentage numeric(5,2) NOT NULL,
    amount numeric(10,2) NOT NULL,
    due_date timestamp without time zone,
    is_paid boolean DEFAULT false NOT NULL,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.b2b_payment_milestones OWNER TO postgres;

--
-- Name: b2b_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.b2b_payments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    invoice_id character varying,
    milestone_id character varying,
    payment_date timestamp without time zone NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_mode public.b2b_payment_mode NOT NULL,
    transaction_ref text,
    proof_url text,
    remarks text,
    recorded_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.b2b_payments OWNER TO postgres;

--
-- Name: bulk_upload_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bulk_upload_jobs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    file_name text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    total_rows integer DEFAULT 0,
    processed_rows integer DEFAULT 0,
    success_rows integer DEFAULT 0,
    error_rows integer DEFAULT 0,
    errors jsonb,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone
);


ALTER TABLE public.bulk_upload_jobs OWNER TO postgres;

--
-- Name: complaint_timeline; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.complaint_timeline (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    complaint_id character varying NOT NULL,
    action text NOT NULL,
    comment text,
    employee_id character varying,
    employee_name text NOT NULL,
    employee_role text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.complaint_timeline OWNER TO postgres;

--
-- Name: complaints; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.complaints (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    ticket_number text NOT NULL,
    order_id character varying NOT NULL,
    customer_name text NOT NULL,
    customer_email text,
    customer_phone text,
    reason public.complaint_reason NOT NULL,
    description text,
    status public.complaint_status DEFAULT 'open'::public.complaint_status NOT NULL,
    priority text DEFAULT 'medium'::text,
    assigned_to character varying,
    resolution_type text,
    resolution_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    resolved_at timestamp without time zone
);


ALTER TABLE public.complaints OWNER TO postgres;

--
-- Name: courier_partners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courier_partners (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    type public.courier_type NOT NULL,
    api_key text,
    api_secret text,
    base_url text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    contact_person text,
    phone text,
    api_enabled boolean DEFAULT false NOT NULL
);


ALTER TABLE public.courier_partners OWNER TO postgres;

--
-- Name: delivery_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delivery_events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    delivery_id character varying NOT NULL,
    event text NOT NULL,
    comment text,
    location text,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.delivery_events OWNER TO postgres;

--
-- Name: internal_deliveries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.internal_deliveries (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    assigned_to character varying NOT NULL,
    status public.delivery_status DEFAULT 'assigned'::public.delivery_status NOT NULL,
    scheduled_date timestamp without time zone,
    delivered_at timestamp without time zone,
    payment_collected_at timestamp without time zone,
    amount_collected numeric(10,2),
    payment_mode text,
    delivery_notes text,
    failure_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.internal_deliveries OWNER TO postgres;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    product_variant_id character varying,
    sku text NOT NULL,
    product_name text NOT NULL,
    color text,
    size text,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    compare_at_price numeric(10,2),
    fulfillment_status text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_status_history (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    status public.order_status NOT NULL,
    comment text,
    changed_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.order_status_history OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_number text NOT NULL,
    shopify_order_id text,
    customer_name text NOT NULL,
    customer_email text,
    customer_phone text,
    shipping_address text NOT NULL,
    shipping_city text,
    shipping_state text,
    shipping_zip text,
    shipping_country text,
    billing_address text,
    billing_city text,
    billing_state text,
    billing_zip text,
    billing_country text,
    subtotal numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    shipping_cost numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    discount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    taxes numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    payment_method public.payment_method NOT NULL,
    payment_status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
    courier_partner_id character varying,
    courier_type public.courier_type,
    awb_number text,
    dispatch_date timestamp without time zone,
    delivery_date timestamp without time zone,
    assigned_to character varying,
    notes text,
    rto_reason text,
    shopify_data jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    module text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_variants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    product_id character varying NOT NULL,
    sku text NOT NULL,
    color text,
    size text,
    stock_quantity integer DEFAULT 0 NOT NULL,
    cost_price numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    selling_price numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    low_stock_threshold integer DEFAULT 10,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.product_variants OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    role_id character varying NOT NULL,
    permission_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    is_system boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value jsonb,
    description text,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_movements (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    product_variant_id character varying NOT NULL,
    type public.stock_movement_type NOT NULL,
    quantity integer NOT NULL,
    previous_quantity integer NOT NULL,
    new_quantity integer NOT NULL,
    supplier_id character varying,
    order_id character varying,
    cost_price numeric(10,2),
    invoice_number text,
    invoice_date timestamp without time zone,
    reason text,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.stock_movements OWNER TO postgres;

--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    contact_person text,
    email text,
    phone text,
    address text,
    gst_number text,
    status public.user_status DEFAULT 'active'::public.user_status NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    phone text,
    role_id character varying,
    status public.user_status DEFAULT 'active'::public.user_status NOT NULL,
    is_super_admin boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, module, entity_id, entity_type, old_data, new_data, ip_address, created_at) FROM stdin;
12bc0673-712d-4424-89e4-b9a596a11757	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	create	users	425b7bad-e0e7-46da-ad61-81259144d158	user	\N	{"id": "425b7bad-e0e7-46da-ad61-81259144d158", "name": "Test User slMgsn", "email": "testuserslMgsn@test.com", "phone": "+91 98765 12345", "roleId": "4154b2ac-d065-42f2-ac49-9d09568381bc", "status": "active", "password": "[HIDDEN]", "createdAt": null, "updatedAt": null, "isSuperAdmin": false}	\N	2025-12-04 14:04:41.627184
4f438d28-5985-4721-8358-ef8ccad10f43	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	create	suppliers	f4fcf5ca-a1dc-4948-a099-7bf9bf377438	supplier	\N	{"id": "f4fcf5ca-a1dc-4948-a099-7bf9bf377438", "name": "Test Supplier 123", "email": "test123@test.com", "phone": "+919876543210", "status": "active", "address": null, "createdAt": null, "gstNumber": "27AABCT1234F1ZP", "updatedAt": null, "contactPerson": null}	\N	2025-12-04 14:24:39.299916
b8d8f2da-c6d9-4eaf-8bd9-251b56ab9a59	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	create	suppliers	3ab8b5c8-8433-432d-b409-0128a5cf62d6	supplier	\N	{"id": "3ab8b5c8-8433-432d-b409-0128a5cf62d6", "name": "Test Supplier Ty2CMf", "email": "supplier6NTg30@test.com", "phone": "+91 98765 12345", "status": "active", "address": "", "createdAt": null, "gstNumber": "27AABCT1234F1ZP", "updatedAt": null, "contactPerson": ""}	\N	2025-12-04 14:26:12.509546
84115008-1932-4492-9077-8e10e2f3ff13	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	create	products	0b103035-e411-4b69-bcad-7f294f358769	product	\N	{"id": "0b103035-e411-4b69-bcad-7f294f358769", "name": "Test Product ajaP8Z", "category": "Apparel", "variants": [{"id": "bea88027-0005-49c9-a651-8e8022a84a84", "sku": "TES-RED-S", "size": "S", "color": "Red", "costPrice": "200", "createdAt": null, "productId": "0b103035-e411-4b69-bcad-7f294f358769", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "cbe3a512-5c30-407f-963f-a3d6f5f774ae", "sku": "TES-RED-M", "size": "M", "color": "Red", "costPrice": "200", "createdAt": null, "productId": "0b103035-e411-4b69-bcad-7f294f358769", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "989a9693-ee5c-440f-b8ca-828d91bb3809", "sku": "TES-RED-L", "size": "L", "color": "Red", "costPrice": "200", "createdAt": null, "productId": "0b103035-e411-4b69-bcad-7f294f358769", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "61943483-3ccb-4f23-8a98-e540b26ff4cb", "sku": "TES-BLU-S", "size": "S", "color": "Blue", "costPrice": "200", "createdAt": null, "productId": "0b103035-e411-4b69-bcad-7f294f358769", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "2949f250-5138-488a-b99b-d0c148f7f83e", "sku": "TES-BLU-M", "size": "M", "color": "Blue", "costPrice": "200", "createdAt": null, "productId": "0b103035-e411-4b69-bcad-7f294f358769", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "3f9253ac-9448-42ae-a956-17a8dc9e0ce8", "sku": "TES-BLU-L", "size": "L", "color": "Blue", "costPrice": "200", "createdAt": null, "productId": "0b103035-e411-4b69-bcad-7f294f358769", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}], "createdAt": null, "updatedAt": null, "description": ""}	\N	2025-12-04 14:26:59.613363
17c83b85-6fec-4983-a6e6-f3ee58a260db	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	stock_inward	inventory	cbe3a512-5c30-407f-963f-a3d6f5f774ae	product_variant	{"stockQuantity": 0}	{"costPrice": "100", "stockQuantity": 5}	\N	2025-12-04 16:38:13.026821
63f61c3b-f355-4b92-ba87-752575d3cf55	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	stock_inward	inventory	989a9693-ee5c-440f-b8ca-828d91bb3809	product_variant	{"stockQuantity": 0}	{"costPrice": "200", "stockQuantity": 3}	\N	2025-12-04 16:42:12.680435
2bc43835-f1f0-42bf-8b2f-e96f6e30d2d2	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	stock_inward	inventory	61943483-3ccb-4f23-8a98-e540b26ff4cb	product_variant	{"stockQuantity": 0}	{"costPrice": "150", "stockQuantity": 2}	\N	2025-12-04 16:45:48.565065
151f6aa1-ddb4-4f62-b151-9cefc3ab9637	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	create	products	ff1dc478-acdf-4785-be9c-0c987f0b772e	product	\N	{"id": "ff1dc478-acdf-4785-be9c-0c987f0b772e", "name": "test", "category": "test", "variants": [{"id": "901bd4e8-23d7-4488-901e-735f75ddaa31", "sku": "TES-RED-s", "size": "s", "color": "red", "costPrice": "200", "createdAt": null, "productId": "ff1dc478-acdf-4785-be9c-0c987f0b772e", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "7f9dad67-5297-43bd-9508-f4e083ea3512", "sku": "TES-RED-m", "size": "m", "color": "red", "costPrice": "200", "createdAt": null, "productId": "ff1dc478-acdf-4785-be9c-0c987f0b772e", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "ad6bb15e-e4ff-4e23-8326-bcf6f611b2a6", "sku": "TES-RED-l", "size": "l", "color": "red", "costPrice": "200", "createdAt": null, "productId": "ff1dc478-acdf-4785-be9c-0c987f0b772e", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "a527ccbf-5f41-49d5-abf9-5b5ec7b58627", "sku": "TES-RED-xl", "size": "xl", "color": "red", "costPrice": "200", "createdAt": null, "productId": "ff1dc478-acdf-4785-be9c-0c987f0b772e", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "bc449a0f-e4e9-4209-b81f-9e23685dbfa1", "sku": "TES-BLU-s", "size": "s", "color": "blue", "costPrice": "200", "createdAt": null, "productId": "ff1dc478-acdf-4785-be9c-0c987f0b772e", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "3a099387-306c-4c68-853e-515340996acf", "sku": "TES-BLU-m", "size": "m", "color": "blue", "costPrice": "200", "createdAt": null, "productId": "ff1dc478-acdf-4785-be9c-0c987f0b772e", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "1aa87077-8f06-483d-97a4-508ca40c42fb", "sku": "TES-BLU-l", "size": "l", "color": "blue", "costPrice": "200", "createdAt": null, "productId": "ff1dc478-acdf-4785-be9c-0c987f0b772e", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "4fb2ead4-55ff-4a43-8044-e08dc57645ae", "sku": "TES-BLU-xl", "size": "xl", "color": "blue", "costPrice": "200", "createdAt": null, "productId": "ff1dc478-acdf-4785-be9c-0c987f0b772e", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "f388d268-7eaa-4f1f-9778-6ae5cd2b6910", "sku": "TES-BLA-s", "size": "s", "color": "black", "costPrice": "200", "createdAt": null, "productId": "ff1dc478-acdf-4785-be9c-0c987f0b772e", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "71e7c732-0f54-455d-bcda-187874524c9e", "sku": "TES-BLA-m", "size": "m", "color": "black", "costPrice": "200", "createdAt": null, "productId": "ff1dc478-acdf-4785-be9c-0c987f0b772e", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "045690e6-fae3-4e75-b4c3-cfc487e7632c", "sku": "TES-BLA-l", "size": "l", "color": "black", "costPrice": "200", "createdAt": null, "productId": "ff1dc478-acdf-4785-be9c-0c987f0b772e", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "a11cf898-2846-47da-9757-83427916890c", "sku": "TES-BLA-xl", "size": "xl", "color": "black", "costPrice": "200", "createdAt": null, "productId": "ff1dc478-acdf-4785-be9c-0c987f0b772e", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}], "createdAt": null, "updatedAt": null, "description": "test"}	\N	2025-12-05 06:34:59.246673
db033718-25e9-4b33-bbdb-d155615d4d48	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	create	products	1e9725ce-46fa-447c-9fa3-ccbb457ddb09	product	\N	{"id": "1e9725ce-46fa-447c-9fa3-ccbb457ddb09", "name": "Micropoly t-shirt", "category": "", "variants": [{"id": "68420f96-ec18-485b-8ca6-1a6c24b3abfe", "sku": "MIC-RED-S", "size": "S", "color": "Red", "costPrice": "200", "createdAt": null, "productId": "1e9725ce-46fa-447c-9fa3-ccbb457ddb09", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "5d8a76f1-033a-43d9-bd66-f4fcdeb4e0cb", "sku": "MIC-RED-M", "size": "M", "color": "Red", "costPrice": "200", "createdAt": null, "productId": "1e9725ce-46fa-447c-9fa3-ccbb457ddb09", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "89d7121c-aa7c-47d5-bad0-539bc6439f46", "sku": "MIC-RED-L", "size": "L", "color": "Red", "costPrice": "200", "createdAt": null, "productId": "1e9725ce-46fa-447c-9fa3-ccbb457ddb09", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "d366173b-52e7-4146-aa43-ea2cad002c2c", "sku": "MIC-RED-XL", "size": "XL", "color": "Red", "costPrice": "200", "createdAt": null, "productId": "1e9725ce-46fa-447c-9fa3-ccbb457ddb09", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "6bac9c1d-15f5-4171-93f6-3d39f4064f1f", "sku": "MIC-RED-2XL", "size": "2XL", "color": "Red", "costPrice": "200", "createdAt": null, "productId": "1e9725ce-46fa-447c-9fa3-ccbb457ddb09", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "80b595d7-6ded-4187-98c5-5fe7ad51bcca", "sku": "MIC-BLA-S", "size": "S", "color": "Black", "costPrice": "200", "createdAt": null, "productId": "1e9725ce-46fa-447c-9fa3-ccbb457ddb09", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "32a8be86-7b1b-4b0c-8498-43c1e4c1a02b", "sku": "MIC-BLA-M", "size": "M", "color": "Black", "costPrice": "200", "createdAt": null, "productId": "1e9725ce-46fa-447c-9fa3-ccbb457ddb09", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "f653ea86-79e4-4ea7-8183-1014cfc160ad", "sku": "MIC-BLA-L", "size": "L", "color": "Black", "costPrice": "200", "createdAt": null, "productId": "1e9725ce-46fa-447c-9fa3-ccbb457ddb09", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "623c3ddb-fa55-4d43-92d9-4779a461a25f", "sku": "MIC-BLA-XL", "size": "XL", "color": "Black", "costPrice": "200", "createdAt": null, "productId": "1e9725ce-46fa-447c-9fa3-ccbb457ddb09", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "4c49a84c-9801-47e0-bd29-574179a62a1e", "sku": "MIC-BLA-2XL", "size": "2XL", "color": "Black", "costPrice": "200", "createdAt": null, "productId": "1e9725ce-46fa-447c-9fa3-ccbb457ddb09", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "7a116aff-da6e-4b80-bb1e-df58b4875904", "sku": "MIC-GRE-S", "size": "S", "color": "Green", "costPrice": "200", "createdAt": null, "productId": "1e9725ce-46fa-447c-9fa3-ccbb457ddb09", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "28301d97-4057-49b4-a025-ca6cc06a1cb1", "sku": "MIC-GRE-M", "size": "M", "color": "Green", "costPrice": "200", "createdAt": null, "productId": "1e9725ce-46fa-447c-9fa3-ccbb457ddb09", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "911159a1-ba1d-44ee-b5a2-f066a743029b", "sku": "MIC-GRE-L", "size": "L", "color": "Green", "costPrice": "200", "createdAt": null, "productId": "1e9725ce-46fa-447c-9fa3-ccbb457ddb09", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "67ee97d7-2ef3-4103-96a8-440c9a802e5c", "sku": "MIC-GRE-XL", "size": "XL", "color": "Green", "costPrice": "200", "createdAt": null, "productId": "1e9725ce-46fa-447c-9fa3-ccbb457ddb09", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}, {"id": "d1c77cf3-cd6e-4aa4-a2e0-7ec4d8f6d654", "sku": "MIC-GRE-2XL", "size": "2XL", "color": "Green", "costPrice": "200", "createdAt": null, "productId": "1e9725ce-46fa-447c-9fa3-ccbb457ddb09", "updatedAt": null, "sellingPrice": "499", "stockQuantity": 0, "lowStockThreshold": 10}], "createdAt": null, "updatedAt": null, "description": ""}	\N	2025-12-09 09:40:59.244216
e0acc968-e09f-4338-a258-9a7e49bb3e99	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	create	suppliers	ef9ebfc3-a04c-49e9-9268-23bef2b325b4	supplier	\N	{"id": "ef9ebfc3-a04c-49e9-9268-23bef2b325b4", "name": "Dhaaga Singh Inhouse", "email": "", "phone": "", "status": "active", "address": "Road No. 1, Banjara Hills, Hyderabad", "createdAt": null, "gstNumber": "", "updatedAt": null, "contactPerson": "Rakesh"}	\N	2025-12-13 08:59:29.111248
4f6d70a6-f143-4ca2-9c7b-4fa71335c404	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	stock_inward	inventory	68420f96-ec18-485b-8ca6-1a6c24b3abfe	product_variant	{"stockQuantity": 0}	{"costPrice": "200", "stockQuantity": 10}	\N	2025-12-13 09:01:59.287463
5163765a-17db-4fc7-b238-dfdd74fee57c	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	stock_inward	inventory	5d8a76f1-033a-43d9-bd66-f4fcdeb4e0cb	product_variant	{"stockQuantity": 0}	{"costPrice": "200", "stockQuantity": 5}	\N	2025-12-13 09:01:59.320062
bd05c858-4d3e-4447-9aa8-12729d69677b	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	stock_inward	inventory	89d7121c-aa7c-47d5-bad0-539bc6439f46	product_variant	{"stockQuantity": 0}	{"costPrice": "200", "stockQuantity": 10}	\N	2025-12-13 09:01:59.341495
6931864e-e6a5-47df-8a61-abc4f6d7ab02	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	stock_inward	inventory	d366173b-52e7-4146-aa43-ea2cad002c2c	product_variant	{"stockQuantity": 0}	{"costPrice": "200", "stockQuantity": 5}	\N	2025-12-13 09:01:59.363409
ada57616-6374-410e-9922-187707157c0a	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	stock_inward	inventory	6bac9c1d-15f5-4171-93f6-3d39f4064f1f	product_variant	{"stockQuantity": 0}	{"costPrice": "200", "stockQuantity": 7}	\N	2025-12-13 09:01:59.39035
\.


--
-- Data for Name: b2b_clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.b2b_clients (id, company_name, contact_person, email, phone, alternate_phone, industry_type, gst_number, pan_number, billing_address, billing_city, billing_state, billing_zip, billing_country, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country, notes, status, created_by, created_at, updated_at) FROM stdin;
907a6c30-a07d-4bd6-864e-3f78905199d5	Test Corp YZACUU	John Doe	testAbm7@testcorp.com	9876543210	\N	\N				\N	\N	\N	India		\N	\N	\N	India		active	\N	2025-12-17 13:11:42.480159	2025-12-17 13:11:42.480159
9f42f527-bd2a-4453-8a57-7b12d7a67eaa	Dhaaga Singh	Ug	ug@trade2online.com	8008888445	\N	\N			Begumpet, Hyderabad	\N	\N	\N	India		\N	\N	\N	India		active	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-18 10:44:38.385686	2025-12-18 10:44:38.385686
2273b6f2-891e-409a-8be0-9052bd5e8f0c	Test B2B Company	John Test	john@testb2b.com	9876543210	\N	\N	\N	\N	123 Test Street, Mumbai	\N	\N	\N	India	123 Test Street, Mumbai	\N	\N	\N	India	\N	active	86a9c11a-be00-4ab8-b264-387e7d1fed8e	2025-12-18 12:28:47.396356	2025-12-18 12:28:47.396356
\.


--
-- Data for Name: b2b_invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.b2b_invoices (id, invoice_number, order_id, client_id, invoice_type, invoice_date, due_date, subtotal, tax_rate, tax_amount, discount, total_amount, status, pdf_url, notes, version, created_by, created_at, updated_at) FROM stdin;
ff62cd46-e514-4e8d-a162-e5cff953ea95	INV-MJBF47SC	6d84e490-3111-40db-9772-09a67f485645	2273b6f2-891e-409a-8be0-9052bd5e8f0c	proforma	2025-12-18 12:29:53.388	2025-12-31 00:00:00	10000.00	18.00	1800.00	0.00	11800.00	draft	\N	\N	1	86a9c11a-be00-4ab8-b264-387e7d1fed8e	2025-12-18 12:29:53.389277	2025-12-18 12:29:53.389277
5d900929-9038-4781-bbea-a02dde2b33b5	INV-MJBGMLD4	f5ba319e-7bf5-4cef-acc1-a22ef1ebf9a0	9f42f527-bd2a-4453-8a57-7b12d7a67eaa	tax	2025-12-18 13:12:10.408	2025-12-31 00:00:00	5000.00	18.00	900.00	0.00	5900.00	draft	\N		1	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-18 13:12:10.411438	2025-12-18 13:12:10.411438
\.


--
-- Data for Name: b2b_order_artwork; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.b2b_order_artwork (id, order_id, order_item_id, file_name, file_url, file_type, file_size, description, uploaded_by, created_at) FROM stdin;
\.


--
-- Data for Name: b2b_order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.b2b_order_items (id, order_id, product_id, apparel_type, color, fabric, printing_type, print_placement, size_breakup, total_quantity, unit_price, printing_cost_per_unit, total_price, special_instructions, created_at) FROM stdin;
\.


--
-- Data for Name: b2b_order_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.b2b_order_status_history (id, order_id, status, comment, changed_by, created_at) FROM stdin;
d6b15902-efbd-41c3-9bee-c059ca1d12a6	f5ba319e-7bf5-4cef-acc1-a22ef1ebf9a0	order_received	Order created	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-18 11:04:52.821183
a46a3514-4ce8-4e6e-b523-2822bec9d3dd	6d84e490-3111-40db-9772-09a67f485645	order_received	Order created	86a9c11a-be00-4ab8-b264-387e7d1fed8e	2025-12-18 12:29:43.140563
a8ec4940-69eb-4c1f-9959-aa428f1e2ed1	6d84e490-3111-40db-9772-09a67f485645	dispatched	Order dispatched to customer	86a9c11a-be00-4ab8-b264-387e7d1fed8e	2025-12-18 12:30:30.613009
83faec11-67e8-4d3a-a060-96f097a4a994	6d84e490-3111-40db-9772-09a67f485645	delivered	Order delivered to customer	86a9c11a-be00-4ab8-b264-387e7d1fed8e	2025-12-18 12:30:41.680533
\.


--
-- Data for Name: b2b_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.b2b_orders (id, order_number, client_id, event_type, delivery_address, delivery_city, delivery_state, delivery_zip, delivery_country, required_delivery_date, priority, status, subtotal, printing_cost, design_charges, discount, tax_rate, tax_amount, total_amount, payment_status, amount_received, balance_pending, special_instructions, internal_notes, cancellation_reason, delay_reason, courier_partner_id, awb_number, dispatch_date, delivery_date, created_by, created_at, updated_at) FROM stdin;
6d84e490-3111-40db-9772-09a67f485645	B2B-MJBF3ZVI	2273b6f2-891e-409a-8be0-9052bd5e8f0c	\N	123 Test Street, Mumbai, India	\N	\N	\N	India	\N	normal	delivered	0.00	0.00	0.00	0.00	18.00	0.00	10000.00	fully_paid	10000.00	0.00	Test B2B order for workflow testing	\N	\N	\N	\N	\N	\N	\N	86a9c11a-be00-4ab8-b264-387e7d1fed8e	2025-12-18 12:29:43.13652	2025-12-18 12:30:50.641
f5ba319e-7bf5-4cef-acc1-a22ef1ebf9a0	B2B-MJBC2W5F	9f42f527-bd2a-4453-8a57-7b12d7a67eaa	\N	Begumpet, Hyderabad	\N	\N	\N	India	\N	normal	order_received	0.00	0.00	0.00	0.00	18.00	0.00	5000.00	partially_paid	3000.00	2000.00		\N	\N	\N	\N	\N	\N	\N	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-18 11:04:52.805495	2025-12-18 13:12:49.859
\.


--
-- Data for Name: b2b_payment_milestones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.b2b_payment_milestones (id, order_id, name, percentage, amount, due_date, is_paid, paid_at, created_at) FROM stdin;
\.


--
-- Data for Name: b2b_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.b2b_payments (id, order_id, invoice_id, milestone_id, payment_date, amount, payment_mode, transaction_ref, proof_url, remarks, recorded_by, created_at) FROM stdin;
3be308d3-bbeb-4b15-9cad-27f5d71ce60c	6d84e490-3111-40db-9772-09a67f485645	\N	\N	2025-12-18 00:00:00	3000.00	bank_transfer	\N	\N	\N	86a9c11a-be00-4ab8-b264-387e7d1fed8e	2025-12-18 12:30:22.625955
4b3dc5b6-b41d-489d-99d0-fd5cb10c76ab	6d84e490-3111-40db-9772-09a67f485645	\N	\N	2025-12-18 00:00:00	7000.00	bank_transfer	\N	\N	\N	86a9c11a-be00-4ab8-b264-387e7d1fed8e	2025-12-18 12:30:50.602879
964ae181-9d1c-426b-bef3-31a980535ec3	f5ba319e-7bf5-4cef-acc1-a22ef1ebf9a0	\N	\N	2025-12-18 00:00:00	3000.00	upi	123456	\N		e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-18 13:12:49.846076
\.


--
-- Data for Name: bulk_upload_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bulk_upload_jobs (id, type, file_name, status, total_rows, processed_rows, success_rows, error_rows, errors, created_by, created_at, completed_at) FROM stdin;
\.


--
-- Data for Name: complaint_timeline; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.complaint_timeline (id, complaint_id, action, comment, employee_id, employee_name, employee_role, created_at) FROM stdin;
\.


--
-- Data for Name: complaints; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.complaints (id, ticket_number, order_id, customer_name, customer_email, customer_phone, reason, description, status, priority, assigned_to, resolution_type, resolution_notes, created_at, updated_at, resolved_at) FROM stdin;
\.


--
-- Data for Name: courier_partners; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courier_partners (id, name, code, type, api_key, api_secret, base_url, is_active, created_at, updated_at, contact_person, phone, api_enabled) FROM stdin;
e7489aed-3c18-473c-935b-70ad325ebd15	Delhivery	delhivery	third_party	\N	\N	\N	t	2025-12-04 14:37:58.951461	2025-12-04 14:37:58.951461	\N	\N	f
745a35a2-7039-4dc4-9d63-f694538b91e1	Bluedart	bluedart	third_party	\N	\N	\N	t	2025-12-04 14:37:59.108909	2025-12-04 14:37:59.108909	\N	\N	f
0321cd77-bc12-4f64-83c5-a2cd08975ef0	DTDC	dtdc	third_party	\N	\N	\N	t	2025-12-04 14:37:59.168556	2025-12-04 14:37:59.168556	\N	\N	f
aa0297f6-eb7c-4d9a-bb69-6580f9b8c1b2	In-House Delivery	inhouse	in_house	\N	\N	\N	t	2025-12-04 14:37:59.237698	2025-12-04 14:37:59.237698	\N	\N	f
\.


--
-- Data for Name: delivery_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_events (id, delivery_id, event, comment, location, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: internal_deliveries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.internal_deliveries (id, order_id, assigned_to, status, scheduled_date, delivered_at, payment_collected_at, amount_collected, payment_mode, delivery_notes, failure_reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_variant_id, sku, product_name, color, size, quantity, price, compare_at_price, fulfillment_status, created_at) FROM stdin;
\.


--
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_status_history (id, order_id, status, comment, changed_by, created_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, order_number, shopify_order_id, customer_name, customer_email, customer_phone, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country, billing_address, billing_city, billing_state, billing_zip, billing_country, subtotal, shipping_cost, discount, taxes, total_amount, payment_method, payment_status, status, courier_partner_id, courier_type, awb_number, dispatch_date, delivery_date, assigned_to, notes, rto_reason, shopify_data, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, code, name, description, module, created_at) FROM stdin;
71648405-b5fe-4240-a375-2755803e67a3	view_dashboard	View Dashboard	Access to main dashboard	dashboard	2025-12-04 13:17:01.168172
53f0861d-d2c1-4747-bea5-1ede03a23579	view_orders	View Orders	View order list	orders	2025-12-04 13:17:01.175215
694753a9-f8e0-4838-8ed7-804ba579fdc1	create_orders	Create Orders	Create new orders	orders	2025-12-04 13:17:01.18115
3e357dcf-0bde-4bb4-ba8b-cc93bf597fed	edit_orders	Edit Orders	Edit existing orders	orders	2025-12-04 13:17:01.187534
c5b111e7-c590-4413-a6a7-508900fa08bd	delete_orders	Delete Orders	Delete orders	orders	2025-12-04 13:17:01.193097
d2a5a169-1d73-45a9-85bd-631b80270e2f	dispatch_orders	Dispatch Orders	Dispatch orders to couriers	orders	2025-12-04 13:17:01.200886
69feebc5-a9eb-46e7-84be-ffeea3dc0141	import_orders	Import Orders	Bulk import orders	orders	2025-12-04 13:17:01.210664
23220165-9536-4e77-8893-f3699c42ed6b	view_inventory	View Inventory	View inventory levels	inventory	2025-12-04 13:17:01.220122
06d55f4f-04c4-4ec9-8a0e-c0ce560b4721	manage_inventory	Manage Inventory	Add/edit inventory	inventory	2025-12-04 13:17:01.227463
fc0fdabd-cb00-4193-b978-9ca2d69cb568	adjust_stock	Adjust Stock	Adjust stock quantities	inventory	2025-12-04 13:17:01.235404
5d21175f-f476-4e11-ab21-8610ca1cc055	view_products	View Products	View product list	products	2025-12-04 13:17:01.244645
daa68eb6-627b-4525-9f0a-d3ae77d03b1b	create_products	Create Products	Create new products	products	2025-12-04 13:17:01.255153
2f40695e-5bd2-42f3-9321-6a93dfb88cec	edit_products	Edit Products	Edit existing products	products	2025-12-04 13:17:01.265018
738dbc23-cdb0-4364-9932-eb493c62f5cf	delete_products	Delete Products	Delete products	products	2025-12-04 13:17:01.273613
974c7c5f-a752-4797-98af-17f44a49d2eb	import_products	Import Products	Bulk import products	products	2025-12-04 13:17:01.27953
c7a437cc-a62a-4900-9cee-c3b65bec392d	view_suppliers	View Suppliers	View supplier list	suppliers	2025-12-04 13:17:01.284718
3ff92d49-a344-4e88-8234-d56c9e1f3ed4	manage_suppliers	Manage Suppliers	Add/edit suppliers	suppliers	2025-12-04 13:17:01.290393
e2880ec2-09e1-4dad-96f5-6811d4106ca2	view_complaints	View Complaints	View complaint tickets	complaints	2025-12-04 13:17:01.296394
d5e713e5-7b30-4aef-be34-17791f4945e6	manage_complaints	Manage Complaints	Handle complaints	complaints	2025-12-04 13:17:01.300368
8eae587f-23f2-4330-bdc2-3038d7527735	resolve_complaints	Resolve Complaints	Resolve/reject complaints	complaints	2025-12-04 13:17:01.305593
7540c05c-0557-4c4c-bd5c-b44bf8f21db5	view_deliveries	View Deliveries	View internal deliveries	deliveries	2025-12-04 13:17:01.310519
5a508f79-c821-4104-ab13-08e5ed1bdaae	manage_deliveries	Manage Deliveries	Manage deliveries	deliveries	2025-12-04 13:17:01.324624
66fc1f01-1748-4f1d-8b9d-29f7967736c0	collect_payments	Collect Payments	Collect COD payments	deliveries	2025-12-04 13:17:01.331169
9b11e6e8-40f7-4621-9bd6-22ffb524bdf0	view_users	View Users	View user list	users	2025-12-04 13:17:01.337139
bc9c26a4-15c7-4a44-a0b7-0c406e3f51cb	manage_users	Manage Users	Add/edit users	users	2025-12-04 13:17:01.34222
a9d59fe5-dca6-4e40-9324-504faed2494e	view_roles	View Roles	View role list	roles	2025-12-04 13:17:01.34958
add3a18d-c0a7-4da4-a91f-0e83b35f9de3	manage_roles	Manage Roles	Add/edit roles	roles	2025-12-04 13:17:01.357197
b435d191-f75e-4af8-a0ec-0f366fc838d7	manage_permissions	Manage Permissions	Assign permissions to roles	roles	2025-12-04 13:17:01.363775
f1698ee2-9647-454f-bd38-9d0236d348e4	view_settings	View Settings	View system settings	settings	2025-12-04 13:17:01.369164
b872eb1e-41a8-452c-9b2a-873c0330a0c7	manage_settings	Manage Settings	Edit system settings	settings	2025-12-04 13:17:01.37382
82482d33-fb00-40d1-bd00-502df6e77851	view_couriers	View Couriers	View courier partners	couriers	2025-12-04 13:17:01.379053
0f2cbeb1-9283-458c-ac30-e24f087d5396	manage_couriers	Manage Couriers	Add/edit couriers	couriers	2025-12-04 13:17:01.385024
9e775d6f-52ee-479a-b0e2-a93166893b39	view_reports	View Reports	View reports	reports	2025-12-04 13:17:01.389276
126dc15f-2f65-4961-8e6f-44dab26cf5a7	export_reports	Export Reports	Export reports	reports	2025-12-04 13:17:01.506181
c995a78b-c95f-49cf-8af2-e5eed93b6c7b	manage_courier_status	Manage Courier Status	Bulk update order statuses from courier data	orders	2025-12-05 08:27:17.562951
e865303d-6bc9-448e-b47a-310fa0d7eeef	view_all_b2b_data	View All B2B Data	View all B2B clients, orders, invoices regardless of who created them (for managers)	b2b	2025-12-18 12:26:36.298866
08b6dc52-78e6-4221-911a-5fe8d8cf3a93	view_b2b_clients	View B2B Clients	View B2B client list	b2b	2025-12-18 12:28:25.646078
fb024fc5-1100-44e4-9fb4-8eb954b4bd40	manage_b2b_clients	Manage B2B Clients	Create/edit B2B clients	b2b	2025-12-18 12:28:25.646078
613a2b74-6251-4882-b5ef-b8057acc4551	view_b2b_orders	View B2B Orders	View B2B order list	b2b	2025-12-18 12:28:25.646078
f3567508-0e17-432f-993c-e7314989877c	manage_b2b_orders	Manage B2B Orders	Create/edit B2B orders	b2b	2025-12-18 12:28:25.646078
f2ca6ac7-dca8-44ac-ac88-e8467af5fd6b	view_b2b_invoices	View B2B Invoices	View B2B invoices	b2b	2025-12-18 12:28:25.646078
0ce57a38-87ca-442d-b384-0db75f4f4124	manage_b2b_invoices	Manage B2B Invoices	Create/edit B2B invoices	b2b	2025-12-18 12:28:25.646078
98543f43-8607-44ca-9fb0-46be1d4272ed	view_b2b_payments	View B2B Payments	View B2B payments	b2b	2025-12-18 12:28:25.646078
eef2e512-97b7-4fa6-a745-254c753f7a90	manage_b2b_payments	Manage B2B Payments	Record B2B payments	b2b	2025-12-18 12:28:25.646078
afe71bb0-3a44-48c3-9a40-536579544b49	view_b2b_dashboard	View B2B Dashboard	Access B2B dashboard	b2b	2025-12-18 12:28:25.646078
adc9d115-f385-4768-9f40-54cfed24b888	create_b2b_orders	Create B2B Orders	Create new B2B orders	b2b	2025-12-18 12:29:22.908968
59eafeaa-b6be-4551-996c-627d697ae385	edit_b2b_orders	Edit B2B Orders	Edit existing B2B orders	b2b	2025-12-18 12:29:22.908968
00a76a34-7c67-46df-9175-abefd2679b77	update_b2b_order_status	Update B2B Order Status	Change B2B order status	b2b	2025-12-18 12:29:22.908968
\.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_variants (id, product_id, sku, color, size, stock_quantity, cost_price, selling_price, low_stock_threshold, created_at, updated_at) FROM stdin;
2949f250-5138-488a-b99b-d0c148f7f83e	0b103035-e411-4b69-bcad-7f294f358769	TES-BLU-M	Blue	M	0	200.00	499.00	10	2025-12-04 14:26:59.576053	2025-12-04 14:26:59.576053
3f9253ac-9448-42ae-a956-17a8dc9e0ce8	0b103035-e411-4b69-bcad-7f294f358769	TES-BLU-L	Blue	L	0	200.00	499.00	10	2025-12-04 14:26:59.591176	2025-12-04 14:26:59.591176
bea88027-0005-49c9-a651-8e8022a84a84	0b103035-e411-4b69-bcad-7f294f358769	TES-RED-S	Red	S	10	200.00	499.00	10	2025-12-04 14:26:59.484302	2025-12-04 16:24:46.369
d366173b-52e7-4146-aa43-ea2cad002c2c	1e9725ce-46fa-447c-9fa3-ccbb457ddb09	MIC-RED-XL	Red	XL	5	200.00	499.00	10	2025-12-09 09:40:59.174881	2025-12-13 09:01:59.352
cbe3a512-5c30-407f-963f-a3d6f5f774ae	0b103035-e411-4b69-bcad-7f294f358769	TES-RED-M	Red	M	5	100.00	499.00	10	2025-12-04 14:26:59.528438	2025-12-04 16:38:12.996
989a9693-ee5c-440f-b8ca-828d91bb3809	0b103035-e411-4b69-bcad-7f294f358769	TES-RED-L	Red	L	3	200.00	499.00	10	2025-12-04 14:26:59.545005	2025-12-04 16:42:12.65
6bac9c1d-15f5-4171-93f6-3d39f4064f1f	1e9725ce-46fa-447c-9fa3-ccbb457ddb09	MIC-RED-2XL	Red	2XL	7	200.00	499.00	10	2025-12-09 09:40:59.181183	2025-12-13 09:01:59.378
61943483-3ccb-4f23-8a98-e540b26ff4cb	0b103035-e411-4b69-bcad-7f294f358769	TES-BLU-S	Blue	S	2	150.00	499.00	10	2025-12-04 14:26:59.559296	2025-12-04 16:45:48.544
901bd4e8-23d7-4488-901e-735f75ddaa31	ff1dc478-acdf-4785-be9c-0c987f0b772e	TES-RED-s	red	s	0	200.00	499.00	10	2025-12-05 06:34:59.181969	2025-12-05 06:34:59.181969
7f9dad67-5297-43bd-9508-f4e083ea3512	ff1dc478-acdf-4785-be9c-0c987f0b772e	TES-RED-m	red	m	0	200.00	499.00	10	2025-12-05 06:34:59.186888	2025-12-05 06:34:59.186888
ad6bb15e-e4ff-4e23-8326-bcf6f611b2a6	ff1dc478-acdf-4785-be9c-0c987f0b772e	TES-RED-l	red	l	0	200.00	499.00	10	2025-12-05 06:34:59.19184	2025-12-05 06:34:59.19184
a527ccbf-5f41-49d5-abf9-5b5ec7b58627	ff1dc478-acdf-4785-be9c-0c987f0b772e	TES-RED-xl	red	xl	0	200.00	499.00	10	2025-12-05 06:34:59.197947	2025-12-05 06:34:59.197947
bc449a0f-e4e9-4209-b81f-9e23685dbfa1	ff1dc478-acdf-4785-be9c-0c987f0b772e	TES-BLU-s	blue	s	0	200.00	499.00	10	2025-12-05 06:34:59.201914	2025-12-05 06:34:59.201914
3a099387-306c-4c68-853e-515340996acf	ff1dc478-acdf-4785-be9c-0c987f0b772e	TES-BLU-m	blue	m	0	200.00	499.00	10	2025-12-05 06:34:59.20641	2025-12-05 06:34:59.20641
1aa87077-8f06-483d-97a4-508ca40c42fb	ff1dc478-acdf-4785-be9c-0c987f0b772e	TES-BLU-l	blue	l	0	200.00	499.00	10	2025-12-05 06:34:59.211634	2025-12-05 06:34:59.211634
4fb2ead4-55ff-4a43-8044-e08dc57645ae	ff1dc478-acdf-4785-be9c-0c987f0b772e	TES-BLU-xl	blue	xl	0	200.00	499.00	10	2025-12-05 06:34:59.216935	2025-12-05 06:34:59.216935
f388d268-7eaa-4f1f-9778-6ae5cd2b6910	ff1dc478-acdf-4785-be9c-0c987f0b772e	TES-BLA-s	black	s	0	200.00	499.00	10	2025-12-05 06:34:59.222251	2025-12-05 06:34:59.222251
71e7c732-0f54-455d-bcda-187874524c9e	ff1dc478-acdf-4785-be9c-0c987f0b772e	TES-BLA-m	black	m	0	200.00	499.00	10	2025-12-05 06:34:59.226927	2025-12-05 06:34:59.226927
045690e6-fae3-4e75-b4c3-cfc487e7632c	ff1dc478-acdf-4785-be9c-0c987f0b772e	TES-BLA-l	black	l	0	200.00	499.00	10	2025-12-05 06:34:59.231855	2025-12-05 06:34:59.231855
a11cf898-2846-47da-9757-83427916890c	ff1dc478-acdf-4785-be9c-0c987f0b772e	TES-BLA-xl	black	xl	0	200.00	499.00	10	2025-12-05 06:34:59.237021	2025-12-05 06:34:59.237021
80b595d7-6ded-4187-98c5-5fe7ad51bcca	1e9725ce-46fa-447c-9fa3-ccbb457ddb09	MIC-BLA-S	Black	S	0	200.00	499.00	10	2025-12-09 09:40:59.186856	2025-12-09 09:40:59.186856
32a8be86-7b1b-4b0c-8498-43c1e4c1a02b	1e9725ce-46fa-447c-9fa3-ccbb457ddb09	MIC-BLA-M	Black	M	0	200.00	499.00	10	2025-12-09 09:40:59.19175	2025-12-09 09:40:59.19175
f653ea86-79e4-4ea7-8183-1014cfc160ad	1e9725ce-46fa-447c-9fa3-ccbb457ddb09	MIC-BLA-L	Black	L	0	200.00	499.00	10	2025-12-09 09:40:59.196588	2025-12-09 09:40:59.196588
623c3ddb-fa55-4d43-92d9-4779a461a25f	1e9725ce-46fa-447c-9fa3-ccbb457ddb09	MIC-BLA-XL	Black	XL	0	200.00	499.00	10	2025-12-09 09:40:59.202087	2025-12-09 09:40:59.202087
4c49a84c-9801-47e0-bd29-574179a62a1e	1e9725ce-46fa-447c-9fa3-ccbb457ddb09	MIC-BLA-2XL	Black	2XL	0	200.00	499.00	10	2025-12-09 09:40:59.207057	2025-12-09 09:40:59.207057
7a116aff-da6e-4b80-bb1e-df58b4875904	1e9725ce-46fa-447c-9fa3-ccbb457ddb09	MIC-GRE-S	Green	S	0	200.00	499.00	10	2025-12-09 09:40:59.212165	2025-12-09 09:40:59.212165
28301d97-4057-49b4-a025-ca6cc06a1cb1	1e9725ce-46fa-447c-9fa3-ccbb457ddb09	MIC-GRE-M	Green	M	0	200.00	499.00	10	2025-12-09 09:40:59.218067	2025-12-09 09:40:59.218067
911159a1-ba1d-44ee-b5a2-f066a743029b	1e9725ce-46fa-447c-9fa3-ccbb457ddb09	MIC-GRE-L	Green	L	0	200.00	499.00	10	2025-12-09 09:40:59.223036	2025-12-09 09:40:59.223036
67ee97d7-2ef3-4103-96a8-440c9a802e5c	1e9725ce-46fa-447c-9fa3-ccbb457ddb09	MIC-GRE-XL	Green	XL	0	200.00	499.00	10	2025-12-09 09:40:59.228209	2025-12-09 09:40:59.228209
d1c77cf3-cd6e-4aa4-a2e0-7ec4d8f6d654	1e9725ce-46fa-447c-9fa3-ccbb457ddb09	MIC-GRE-2XL	Green	2XL	0	200.00	499.00	10	2025-12-09 09:40:59.234387	2025-12-09 09:40:59.234387
68420f96-ec18-485b-8ca6-1a6c24b3abfe	1e9725ce-46fa-447c-9fa3-ccbb457ddb09	MIC-RED-S	Red	S	10	200.00	499.00	10	2025-12-09 09:40:59.153388	2025-12-13 09:01:59.265
5d8a76f1-033a-43d9-bd66-f4fcdeb4e0cb	1e9725ce-46fa-447c-9fa3-ccbb457ddb09	MIC-RED-M	Red	M	5	200.00	499.00	10	2025-12-09 09:40:59.161756	2025-12-13 09:01:59.306
89d7121c-aa7c-47d5-bad0-539bc6439f46	1e9725ce-46fa-447c-9fa3-ccbb457ddb09	MIC-RED-L	Red	L	10	200.00	499.00	10	2025-12-09 09:40:59.168313	2025-12-13 09:01:59.332
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, description, category, created_at, updated_at) FROM stdin;
0b103035-e411-4b69-bcad-7f294f358769	Test Product ajaP8Z		Apparel	2025-12-04 14:26:59.416279	2025-12-04 14:26:59.416279
ff1dc478-acdf-4785-be9c-0c987f0b772e	test	test	test	2025-12-05 06:34:59.174584	2025-12-05 06:34:59.174584
1e9725ce-46fa-447c-9fa3-ccbb457ddb09	Micropoly t-shirt			2025-12-09 09:40:59.144857	2025-12-09 09:40:59.144857
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (id, role_id, permission_id, created_at) FROM stdin;
96b09e5e-9342-4179-af53-9b232d812599	4154b2ac-d065-42f2-ac49-9d09568381bc	71648405-b5fe-4240-a375-2755803e67a3	2025-12-04 13:32:11.306738
ec5a3db0-ba39-4353-bc94-1fe6ea5c7380	4154b2ac-d065-42f2-ac49-9d09568381bc	53f0861d-d2c1-4747-bea5-1ede03a23579	2025-12-04 13:32:11.306738
dcb2aea6-4ec1-4bdb-83c8-ac40ac25c01e	4154b2ac-d065-42f2-ac49-9d09568381bc	694753a9-f8e0-4838-8ed7-804ba579fdc1	2025-12-04 13:32:11.306738
b7bc15ce-5437-4fbf-866f-c7372d0e8dce	4154b2ac-d065-42f2-ac49-9d09568381bc	3e357dcf-0bde-4bb4-ba8b-cc93bf597fed	2025-12-04 13:32:11.306738
31e2e8a9-ad5b-4f9c-b3a3-4349a9f34a06	4154b2ac-d065-42f2-ac49-9d09568381bc	c5b111e7-c590-4413-a6a7-508900fa08bd	2025-12-04 13:32:11.306738
b8601b0d-cca5-424f-9ece-6fd434ce4d29	4154b2ac-d065-42f2-ac49-9d09568381bc	d2a5a169-1d73-45a9-85bd-631b80270e2f	2025-12-04 13:32:11.306738
aa0bd956-dff8-400c-b43e-9e67a93de1e0	4154b2ac-d065-42f2-ac49-9d09568381bc	69feebc5-a9eb-46e7-84be-ffeea3dc0141	2025-12-04 13:32:11.306738
3291e53e-d227-4d11-a969-52858e215c87	4154b2ac-d065-42f2-ac49-9d09568381bc	23220165-9536-4e77-8893-f3699c42ed6b	2025-12-04 13:32:11.306738
086e2bf2-443b-49c8-b138-3a54a21d81e7	4154b2ac-d065-42f2-ac49-9d09568381bc	06d55f4f-04c4-4ec9-8a0e-c0ce560b4721	2025-12-04 13:32:11.306738
7f04298c-5346-489d-9244-597c157855f8	4154b2ac-d065-42f2-ac49-9d09568381bc	fc0fdabd-cb00-4193-b978-9ca2d69cb568	2025-12-04 13:32:11.306738
48ae5d0a-1d5a-40f9-bfb0-89add84dadd4	4154b2ac-d065-42f2-ac49-9d09568381bc	5d21175f-f476-4e11-ab21-8610ca1cc055	2025-12-04 13:32:11.306738
d570ea48-5713-4dfe-9282-800e3373f975	4154b2ac-d065-42f2-ac49-9d09568381bc	daa68eb6-627b-4525-9f0a-d3ae77d03b1b	2025-12-04 13:32:11.306738
2c251b58-076d-4364-a98d-8f83758a3253	4154b2ac-d065-42f2-ac49-9d09568381bc	2f40695e-5bd2-42f3-9321-6a93dfb88cec	2025-12-04 13:32:11.306738
befcc3dc-da81-4aa0-805d-6efd618e61ae	4154b2ac-d065-42f2-ac49-9d09568381bc	738dbc23-cdb0-4364-9932-eb493c62f5cf	2025-12-04 13:32:11.306738
42f3f8b0-3ef4-4cca-bd5a-7a41a4ae678b	4154b2ac-d065-42f2-ac49-9d09568381bc	974c7c5f-a752-4797-98af-17f44a49d2eb	2025-12-04 13:32:11.306738
40d80fe4-6fa3-429c-a4a7-2e63d83f4459	4154b2ac-d065-42f2-ac49-9d09568381bc	c7a437cc-a62a-4900-9cee-c3b65bec392d	2025-12-04 13:32:11.306738
46012384-7bc8-4bfe-a6c6-bb50f5e37c8f	4154b2ac-d065-42f2-ac49-9d09568381bc	3ff92d49-a344-4e88-8234-d56c9e1f3ed4	2025-12-04 13:32:11.306738
c0d92394-c11e-4b64-9f25-04ed4d7e895e	4154b2ac-d065-42f2-ac49-9d09568381bc	e2880ec2-09e1-4dad-96f5-6811d4106ca2	2025-12-04 13:32:11.306738
e7ebfa8a-5e56-488e-aa4c-a41dbf37eb1e	4154b2ac-d065-42f2-ac49-9d09568381bc	d5e713e5-7b30-4aef-be34-17791f4945e6	2025-12-04 13:32:11.306738
723653ab-f56e-4069-b052-2e0fbb3478e5	4154b2ac-d065-42f2-ac49-9d09568381bc	8eae587f-23f2-4330-bdc2-3038d7527735	2025-12-04 13:32:11.306738
8b6dd21d-2ea2-4745-bf95-4fe0d74917b2	4154b2ac-d065-42f2-ac49-9d09568381bc	7540c05c-0557-4c4c-bd5c-b44bf8f21db5	2025-12-04 13:32:11.306738
ee983249-a0d6-41e6-a66f-1781a3c89211	4154b2ac-d065-42f2-ac49-9d09568381bc	5a508f79-c821-4104-ab13-08e5ed1bdaae	2025-12-04 13:32:11.306738
48fc825d-1af6-4dc9-88b4-03c2b88fcb99	4154b2ac-d065-42f2-ac49-9d09568381bc	66fc1f01-1748-4f1d-8b9d-29f7967736c0	2025-12-04 13:32:11.306738
84f7c23e-a2a4-4e96-84e4-60e6231a3933	4154b2ac-d065-42f2-ac49-9d09568381bc	9b11e6e8-40f7-4621-9bd6-22ffb524bdf0	2025-12-04 13:32:11.306738
4eb87361-0d57-4e64-8d4e-abe7584a2ad2	4154b2ac-d065-42f2-ac49-9d09568381bc	bc9c26a4-15c7-4a44-a0b7-0c406e3f51cb	2025-12-04 13:32:11.306738
ca456cff-7787-4142-8c7e-ae4f764111a9	4154b2ac-d065-42f2-ac49-9d09568381bc	a9d59fe5-dca6-4e40-9324-504faed2494e	2025-12-04 13:32:11.306738
c75e84b2-a5eb-4016-85ed-fa89d1d20c1f	4154b2ac-d065-42f2-ac49-9d09568381bc	add3a18d-c0a7-4da4-a91f-0e83b35f9de3	2025-12-04 13:32:11.306738
bac0679c-f367-473c-8ce8-7b45f6816416	4154b2ac-d065-42f2-ac49-9d09568381bc	b435d191-f75e-4af8-a0ec-0f366fc838d7	2025-12-04 13:32:11.306738
4a019e13-c323-4187-97fc-152fa0713424	4154b2ac-d065-42f2-ac49-9d09568381bc	f1698ee2-9647-454f-bd38-9d0236d348e4	2025-12-04 13:32:11.306738
5f39641e-05be-4dea-899c-875e4b3bf2b8	4154b2ac-d065-42f2-ac49-9d09568381bc	b872eb1e-41a8-452c-9b2a-873c0330a0c7	2025-12-04 13:32:11.306738
ab12efea-c35d-4847-9833-bf6245433749	4154b2ac-d065-42f2-ac49-9d09568381bc	82482d33-fb00-40d1-bd00-502df6e77851	2025-12-04 13:32:11.306738
96b8dbf6-3d96-4a41-8b95-dd8c89bf9c5d	4154b2ac-d065-42f2-ac49-9d09568381bc	0f2cbeb1-9283-458c-ac30-e24f087d5396	2025-12-04 13:32:11.306738
c9abb6fb-6600-4426-926a-2eecce4349ca	4154b2ac-d065-42f2-ac49-9d09568381bc	9e775d6f-52ee-479a-b0e2-a93166893b39	2025-12-04 13:32:11.306738
fb5a9a0e-bce1-4dcb-b297-ca78c9814411	4154b2ac-d065-42f2-ac49-9d09568381bc	126dc15f-2f65-4961-8e6f-44dab26cf5a7	2025-12-04 13:32:11.306738
219085a3-c38b-49b0-9f45-a5a16867d14c	4154b2ac-d065-42f2-ac49-9d09568381bc	c995a78b-c95f-49cf-8af2-e5eed93b6c7b	2025-12-05 08:27:38.258247
702fad5a-5a14-429e-b15c-2b53d918377d	ea87ef23-62a2-4e1c-aa25-ad5a28c4514c	71648405-b5fe-4240-a375-2755803e67a3	2025-12-18 12:26:57.013836
d53dcda0-3d0f-4bfa-8df5-e77054bb6165	ea87ef23-62a2-4e1c-aa25-ad5a28c4514c	9e775d6f-52ee-479a-b0e2-a93166893b39	2025-12-18 12:26:57.013836
da65bb7f-7129-4cb2-9762-86c15a9e94de	ea87ef23-62a2-4e1c-aa25-ad5a28c4514c	08b6dc52-78e6-4221-911a-5fe8d8cf3a93	2025-12-18 12:28:37.128691
25f5b757-9a35-4122-b7f0-cf1864bc8e90	ea87ef23-62a2-4e1c-aa25-ad5a28c4514c	fb024fc5-1100-44e4-9fb4-8eb954b4bd40	2025-12-18 12:28:37.128691
9cf275ae-b0e4-45fd-872c-c03556a4dc08	ea87ef23-62a2-4e1c-aa25-ad5a28c4514c	613a2b74-6251-4882-b5ef-b8057acc4551	2025-12-18 12:28:37.128691
9fe38b55-1825-48a7-ac71-e2948dd9b3e4	ea87ef23-62a2-4e1c-aa25-ad5a28c4514c	f3567508-0e17-432f-993c-e7314989877c	2025-12-18 12:28:37.128691
502c994f-6c51-4faf-831a-fad0b3f15743	ea87ef23-62a2-4e1c-aa25-ad5a28c4514c	f2ca6ac7-dca8-44ac-ac88-e8467af5fd6b	2025-12-18 12:28:37.128691
1d169277-65fb-415a-8956-b025b5c9d73f	ea87ef23-62a2-4e1c-aa25-ad5a28c4514c	0ce57a38-87ca-442d-b384-0db75f4f4124	2025-12-18 12:28:37.128691
915acda0-5484-49f7-896f-4c4fed1e8b9c	ea87ef23-62a2-4e1c-aa25-ad5a28c4514c	98543f43-8607-44ca-9fb0-46be1d4272ed	2025-12-18 12:28:37.128691
552bd5ab-ddaa-48af-a6ba-cc0cd9b2e714	ea87ef23-62a2-4e1c-aa25-ad5a28c4514c	eef2e512-97b7-4fa6-a745-254c753f7a90	2025-12-18 12:28:37.128691
2a3207a3-e752-420a-b304-1817215853b6	ea87ef23-62a2-4e1c-aa25-ad5a28c4514c	afe71bb0-3a44-48c3-9a40-536579544b49	2025-12-18 12:28:37.128691
97bd5f8c-adad-499c-a6a6-d240c0e8bb9d	ea87ef23-62a2-4e1c-aa25-ad5a28c4514c	adc9d115-f385-4768-9f40-54cfed24b888	2025-12-18 12:29:33.408429
2ccf7580-7c92-4f12-8b0e-99c9fc3f40cb	ea87ef23-62a2-4e1c-aa25-ad5a28c4514c	59eafeaa-b6be-4551-996c-627d697ae385	2025-12-18 12:29:33.408429
3d1cad19-934c-45e9-8f51-545cb874d102	ea87ef23-62a2-4e1c-aa25-ad5a28c4514c	00a76a34-7c67-46df-9175-abefd2679b77	2025-12-18 12:29:33.408429
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description, is_system, created_at, updated_at) FROM stdin;
4154b2ac-d065-42f2-ac49-9d09568381bc	Admin	Full system access	t	2025-12-04 13:17:01.518469	2025-12-04 13:17:01.518469
8953e8da-b3c6-4c8f-ae2d-dfc99a2e6370	Customer Support	Customer support team	f	2025-12-04 13:25:27.154875	2025-12-04 13:25:27.154875
f36b4b2e-b72f-4284-98cc-6e6f72c6cbaf	Warehouse	Warehouse staff	f	2025-12-04 13:25:35.820543	2025-12-04 13:25:35.820543
eab3f36f-d4db-4f74-92e4-287c60d2d4d6	Stock Management	Stock management team	f	2025-12-04 13:25:46.63867	2025-12-04 13:25:46.63867
ea87ef23-62a2-4e1c-aa25-ad5a28c4514c	B2B Sales	B2B sales team - can create and manage their own clients and orders	f	2025-12-18 12:26:46.387758	2025-12-18 12:26:46.387758
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, expires_at, created_at) FROM stdin;
9091b1e7-59c6-4a51-9f95-6bd5379b1b83	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 13:50:51.89	2025-12-04 13:50:51.893108
fe755933-64a1-428c-bbcf-77a05f67fcbe	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 13:50:57.168	2025-12-04 13:50:57.172063
30cbddeb-6f41-4c0e-9a93-15f4eb20a37f	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 13:51:20.11	2025-12-04 13:51:20.113295
c3d6136b-a75b-4bd8-a8c2-91bf763231ab	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 13:52:13.309	2025-12-04 13:52:13.313015
8a0df5ea-cbf3-46d3-91d1-7f7e55b32e70	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 13:54:56.819	2025-12-04 13:54:56.822091
a22d0107-1cc6-4a5f-9941-a3bd2eda806b	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 13:56:14.488	2025-12-04 13:56:14.491797
4708030c-b0b7-4714-b91e-6b02f0779a9b	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 13:57:38.045	2025-12-04 13:57:38.049533
95c57b37-0eae-410d-ad51-8a9d6d699cc3	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 14:01:11.464	2025-12-04 14:01:11.467947
424dc300-f1c2-4959-a261-50232c1d52b7	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 14:01:28.27	2025-12-04 14:01:28.273735
e1c2de86-d11c-43dd-ba97-44e5be72de12	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 14:02:23.034	2025-12-04 14:02:23.037965
6c4398b8-f53e-40bc-a424-0b2f6c96f4fe	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 14:03:24.169	2025-12-04 14:03:24.173643
4f33e791-fb89-4891-bc94-208b2b7fcb8c	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 14:13:40.019	2025-12-04 14:13:40.037124
e2950303-610f-426b-b220-33533839120b	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 14:18:29.313	2025-12-04 14:18:29.316713
dcb0ff25-75ec-4ea1-a191-f85b7e027736	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 14:21:11.127	2025-12-04 14:21:11.132338
76b4f37a-590e-4add-83d1-dd8b6ac87e66	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 14:25:34.435	2025-12-04 14:25:34.441897
1005f9fa-98fd-40f6-a199-f32681ff9989	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 14:30:47.823	2025-12-04 14:30:47.827912
36c63b41-0ded-4357-a2d9-9b5d2b0c3371	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 14:31:41.547	2025-12-04 14:31:41.54942
6a67a9d0-1e3c-494d-b84a-e31dbeb03554	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 14:37:17.215	2025-12-04 14:37:17.218971
0f06340c-c84f-4dfc-a7ad-5db524a14920	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 15:29:01.009	2025-12-04 15:29:01.012507
de19a28b-e738-4239-88cd-c3b9ac7f1e3c	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 15:32:47.422	2025-12-04 15:32:47.426916
71b5f862-c9a2-42ab-b056-76dde6ce9dcb	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 15:46:38.366	2025-12-04 15:46:38.370124
b9cfefd1-da2c-4d51-babd-4660d53f8841	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 15:49:27.031	2025-12-04 15:49:27.033984
7fc50128-bfe4-42e2-95ea-b8a6afacc811	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 15:53:04.432	2025-12-04 15:53:04.437453
7724e2c4-e900-49a7-ab52-e8cdad9dc3ef	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 15:56:32.205	2025-12-04 15:56:32.209605
1845aac9-e16e-4118-83f8-4ad71467b566	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 16:00:51.322	2025-12-04 16:00:51.325537
8e817e7f-b403-442c-9789-abd0e39d0ecd	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 16:05:20.655	2025-12-04 16:05:20.660071
f02600a4-eb29-42a6-8c81-190f3839b4ce	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 16:06:58.916	2025-12-04 16:06:58.921129
c1122520-73cd-453b-9b39-d8db7862d2f6	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 16:17:45.872	2025-12-04 16:17:45.883817
ed5c9a0d-da31-4b9e-97b1-ed0e868c76e8	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 16:22:57.876	2025-12-04 16:22:57.880843
ee5699dd-b145-4dc1-874e-a090715da7fb	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 16:26:38.009	2025-12-04 16:26:38.014813
1ae31a44-138d-4740-9422-54c011bae489	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 16:33:19.935	2025-12-04 16:33:19.941424
b1d0980c-af29-4d56-a11c-6db0acd25f20	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 16:39:45.623	2025-12-04 16:39:45.627005
88d70a37-cb88-4514-a5ad-4140c7bc8ad6	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 16:44:17.507	2025-12-04 16:44:17.511599
572abbae-e8de-4e77-aad0-e8404dbecd33	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-05 19:06:46.574	2025-12-04 19:06:46.578369
a2f8e1db-6909-46ab-8d75-a3597118b7cc	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-06 05:46:04.645	2025-12-05 05:46:04.651032
537941f2-04be-4825-ae01-d92ef3c24447	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-06 06:06:31.799	2025-12-05 06:06:31.801516
a335346d-efbb-4007-88df-33f8828863be	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-06 06:32:06.651	2025-12-05 06:32:06.655337
5b8dc8df-93f7-4a0d-a252-1143c53c2b8f	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-06 06:34:32.865	2025-12-05 06:34:32.870407
c51de974-8890-4656-adf0-586506bf4bd5	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-06 07:24:56.798	2025-12-05 07:24:56.804753
47cdb6b0-dfd7-4023-b023-1a0444e81ca0	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-06 08:31:12.271	2025-12-05 08:31:12.278215
870271d3-8f4b-4d9c-8fbe-4904760e4248	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-06 08:38:01.264	2025-12-05 08:38:01.268078
ca824e95-fb91-4399-b155-d9f4652e4776	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-10 09:20:35.956	2025-12-09 09:20:35.966027
9ef233e0-0734-4e03-bac8-4f23514cb256	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-10 09:21:46.69	2025-12-09 09:21:46.69299
2a6deac4-2bcb-4dfc-8a3a-662c958fb709	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-10 09:24:17.579	2025-12-09 09:24:17.583167
8ba119a7-3ff5-4486-bb64-510b9a5a458c	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-10 09:40:09.489	2025-12-09 09:40:09.491658
b0c09054-6fd6-4f8f-8409-0dd91a3474b3	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-14 08:58:00.473	2025-12-13 08:58:00.477341
ddf344d4-d0ec-4a3f-8ba3-a2f8524931da	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-18 13:01:21.951	2025-12-17 13:01:21.961193
ff9255b5-302d-4a7d-b013-2962a00ae2e2	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-18 13:10:57.607	2025-12-17 13:10:57.610095
71cbd0b6-781b-4c69-b223-ab2e3d44e80b	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-18 13:27:13.196	2025-12-17 13:27:13.200124
0bb52b6b-062e-4fe1-af0d-4ff9e75737e8	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-19 10:43:26.307	2025-12-18 10:43:26.310744
623c1f45-0533-485e-9b3f-e101165903b9	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-19 10:49:18.355	2025-12-18 10:49:18.357082
eb49766f-2199-4780-a110-ac7bb097ba49	86a9c11a-be00-4ab8-b264-387e7d1fed8e	2025-12-19 12:27:43.199	2025-12-18 12:27:43.205971
74cda2fd-8e71-4e9e-a396-ba9247d1ccd6	86a9c11a-be00-4ab8-b264-387e7d1fed8e	2025-12-19 12:28:47.303	2025-12-18 12:28:47.304527
6a15ccfd-ed31-4c6a-b1d0-5893aa8d3da9	86a9c11a-be00-4ab8-b264-387e7d1fed8e	2025-12-19 12:29:43.059	2025-12-18 12:29:43.062335
64c59229-e6ee-4685-b609-652325c26175	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-19 12:59:06.7	2025-12-18 12:59:06.701956
cfd9774a-d138-4afa-9565-aa7868a8e997	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-20 08:44:44.064	2025-12-19 08:44:44.067283
36e396ef-c1a2-4265-9eaf-5e68a925d380	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2026-01-07 08:57:19.81	2026-01-06 08:57:19.816135
b9ceaa6a-56f8-4426-a96d-3fb099fedbc7	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2026-01-07 08:58:25.384	2026-01-06 08:58:25.386514
08008617-92f5-430a-9a25-0a9865e243a7	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2026-01-07 09:00:20.023	2026-01-06 09:00:20.024743
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id, key, value, description, updated_at) FROM stdin;
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_movements (id, product_variant_id, type, quantity, previous_quantity, new_quantity, supplier_id, order_id, cost_price, invoice_number, invoice_date, reason, created_by, created_at) FROM stdin;
515575e9-36d5-4d43-9d05-3fe439554a24	cbe3a512-5c30-407f-963f-a3d6f5f774ae	inward	5	0	5	6af13321-0035-41b3-b8a0-bf39b78ede16	\N	100.00		2025-12-04 00:00:00	Stock received via invoice N/A	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-04 16:38:13.009987
1aa76d93-6b19-4ed8-9999-98832e736f2e	989a9693-ee5c-440f-b8ca-828d91bb3809	inward	3	0	3	6af13321-0035-41b3-b8a0-bf39b78ede16	\N	200.00	INV-TEST-005	2025-12-04 00:00:00	Stock received via invoice INV-TEST-005	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-04 16:42:12.666887
bd8ec8fd-313a-4c44-91c6-75c40222859e	61943483-3ccb-4f23-8a98-e540b26ff4cb	inward	2	0	2	6af13321-0035-41b3-b8a0-bf39b78ede16	\N	150.00		2025-12-04 00:00:00	Stock received via invoice N/A	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-04 16:45:48.55284
f7c6a858-a7f7-4919-9560-de1ed2532198	68420f96-ec18-485b-8ca6-1a6c24b3abfe	inward	10	0	10	ef9ebfc3-a04c-49e9-9268-23bef2b325b4	\N	200.00		2025-12-13 00:00:00	Stock received via invoice N/A	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-13 09:01:59.27544
e6679fc2-c8aa-47b6-a462-9565c248cadf	5d8a76f1-033a-43d9-bd66-f4fcdeb4e0cb	inward	5	0	5	ef9ebfc3-a04c-49e9-9268-23bef2b325b4	\N	200.00		2025-12-13 00:00:00	Stock received via invoice N/A	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-13 09:01:59.313141
28dcb3d6-4173-40fb-8588-32da5ceb1509	89d7121c-aa7c-47d5-bad0-539bc6439f46	inward	10	0	10	ef9ebfc3-a04c-49e9-9268-23bef2b325b4	\N	200.00		2025-12-13 00:00:00	Stock received via invoice N/A	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-13 09:01:59.336391
9554f24d-270f-4677-a606-8e652b61e58e	d366173b-52e7-4146-aa43-ea2cad002c2c	inward	5	0	5	ef9ebfc3-a04c-49e9-9268-23bef2b325b4	\N	200.00		2025-12-13 00:00:00	Stock received via invoice N/A	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-13 09:01:59.358594
51e2b202-e99a-4277-a35f-fe83ac71a239	6bac9c1d-15f5-4171-93f6-3d39f4064f1f	inward	7	0	7	ef9ebfc3-a04c-49e9-9268-23bef2b325b4	\N	200.00		2025-12-13 00:00:00	Stock received via invoice N/A	e26816a9-1cf4-4247-ac3c-7c4acd0860c4	2025-12-13 09:01:59.384271
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (id, name, contact_person, email, phone, address, gst_number, status, created_at, updated_at) FROM stdin;
e580f37b-72d8-48c4-abfd-3deaf344ebf0	Test Supplier URiIcW		supplierURiIcW@test.com	+91 98765 12345		27AABCT1234F1ZP	active	2025-12-04 14:19:18.433724	2025-12-04 14:19:18.433724
6af13321-0035-41b3-b8a0-bf39b78ede16	Test Supplier	\N	test@test.com	+919876543210	\N	27AABCT1234F1ZP	active	2025-12-04 14:21:26.363849	2025-12-04 14:21:26.363849
f4fcf5ca-a1dc-4948-a099-7bf9bf377438	Test Supplier 123	\N	test123@test.com	+919876543210	\N	27AABCT1234F1ZP	active	2025-12-04 14:24:39.289142	2025-12-04 14:24:39.289142
3ab8b5c8-8433-432d-b409-0128a5cf62d6	Test Supplier Ty2CMf		supplier6NTg30@test.com	+91 98765 12345		27AABCT1234F1ZP	active	2025-12-04 14:26:12.491005	2025-12-04 14:26:12.491005
ef9ebfc3-a04c-49e9-9268-23bef2b325b4	Dhaaga Singh Inhouse	Rakesh			Road No. 1, Banjara Hills, Hyderabad		active	2025-12-13 08:59:29.088484	2025-12-13 08:59:29.088484
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, name, phone, role_id, status, is_super_admin, created_at, updated_at) FROM stdin;
e26816a9-1cf4-4247-ac3c-7c4acd0860c4	admin@dsscm.com	$2b$10$MTy2gU1D.F9bQfWouM.Am.JtyqMT8Hxur75Qm8y8YmUXxyFNUPtXe	Super Admin	+91 98765 00000	4154b2ac-d065-42f2-ac49-9d09568381bc	active	t	2025-12-04 13:48:06.664425	2025-12-04 13:48:06.664425
425b7bad-e0e7-46da-ad61-81259144d158	testuserslMgsn@test.com	$2b$10$D4vQFp7F54NpcQQcCS3a9eYNJi.GA9D8bwZ/1Y15EbIMrUpSbj3Xi	Test User slMgsn	+91 98765 12345	4154b2ac-d065-42f2-ac49-9d09568381bc	active	f	2025-12-04 14:04:41.596548	2025-12-04 14:04:41.596548
86a9c11a-be00-4ab8-b264-387e7d1fed8e	b2bsales@dsscm.com	$2b$10$WEAH/H8fRylNb65PqmnYoufHDbADX6JtIHyxBjlkWq3q7.nBLxUx6	B2B Sales Employee	+91 98765 11111	ea87ef23-62a2-4e1c-aa25-ad5a28c4514c	active	f	2025-12-18 12:27:19.55618	2025-12-18 12:27:19.55618
\.


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: b2b_clients b2b_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_clients
    ADD CONSTRAINT b2b_clients_pkey PRIMARY KEY (id);


--
-- Name: b2b_invoices b2b_invoices_invoice_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_invoices
    ADD CONSTRAINT b2b_invoices_invoice_number_unique UNIQUE (invoice_number);


--
-- Name: b2b_invoices b2b_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_invoices
    ADD CONSTRAINT b2b_invoices_pkey PRIMARY KEY (id);


--
-- Name: b2b_order_artwork b2b_order_artwork_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_order_artwork
    ADD CONSTRAINT b2b_order_artwork_pkey PRIMARY KEY (id);


--
-- Name: b2b_order_items b2b_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_order_items
    ADD CONSTRAINT b2b_order_items_pkey PRIMARY KEY (id);


--
-- Name: b2b_order_status_history b2b_order_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_order_status_history
    ADD CONSTRAINT b2b_order_status_history_pkey PRIMARY KEY (id);


--
-- Name: b2b_orders b2b_orders_order_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_orders
    ADD CONSTRAINT b2b_orders_order_number_unique UNIQUE (order_number);


--
-- Name: b2b_orders b2b_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_orders
    ADD CONSTRAINT b2b_orders_pkey PRIMARY KEY (id);


--
-- Name: b2b_payment_milestones b2b_payment_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_payment_milestones
    ADD CONSTRAINT b2b_payment_milestones_pkey PRIMARY KEY (id);


--
-- Name: b2b_payments b2b_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_payments
    ADD CONSTRAINT b2b_payments_pkey PRIMARY KEY (id);


--
-- Name: bulk_upload_jobs bulk_upload_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulk_upload_jobs
    ADD CONSTRAINT bulk_upload_jobs_pkey PRIMARY KEY (id);


--
-- Name: complaint_timeline complaint_timeline_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_timeline
    ADD CONSTRAINT complaint_timeline_pkey PRIMARY KEY (id);


--
-- Name: complaints complaints_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_pkey PRIMARY KEY (id);


--
-- Name: complaints complaints_ticket_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_ticket_number_unique UNIQUE (ticket_number);


--
-- Name: courier_partners courier_partners_code_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courier_partners
    ADD CONSTRAINT courier_partners_code_unique UNIQUE (code);


--
-- Name: courier_partners courier_partners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courier_partners
    ADD CONSTRAINT courier_partners_pkey PRIMARY KEY (id);


--
-- Name: delivery_events delivery_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_events
    ADD CONSTRAINT delivery_events_pkey PRIMARY KEY (id);


--
-- Name: internal_deliveries internal_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internal_deliveries
    ADD CONSTRAINT internal_deliveries_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_code_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_unique UNIQUE (code);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_sku_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_sku_unique UNIQUE (sku);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_unique UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: settings settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_key_unique UNIQUE (key);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: b2b_clients b2b_clients_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_clients
    ADD CONSTRAINT b2b_clients_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: b2b_invoices b2b_invoices_client_id_b2b_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_invoices
    ADD CONSTRAINT b2b_invoices_client_id_b2b_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.b2b_clients(id);


--
-- Name: b2b_invoices b2b_invoices_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_invoices
    ADD CONSTRAINT b2b_invoices_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: b2b_invoices b2b_invoices_order_id_b2b_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_invoices
    ADD CONSTRAINT b2b_invoices_order_id_b2b_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.b2b_orders(id);


--
-- Name: b2b_order_artwork b2b_order_artwork_order_id_b2b_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_order_artwork
    ADD CONSTRAINT b2b_order_artwork_order_id_b2b_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.b2b_orders(id) ON DELETE CASCADE;


--
-- Name: b2b_order_artwork b2b_order_artwork_order_item_id_b2b_order_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_order_artwork
    ADD CONSTRAINT b2b_order_artwork_order_item_id_b2b_order_items_id_fk FOREIGN KEY (order_item_id) REFERENCES public.b2b_order_items(id) ON DELETE CASCADE;


--
-- Name: b2b_order_artwork b2b_order_artwork_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_order_artwork
    ADD CONSTRAINT b2b_order_artwork_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: b2b_order_items b2b_order_items_order_id_b2b_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_order_items
    ADD CONSTRAINT b2b_order_items_order_id_b2b_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.b2b_orders(id) ON DELETE CASCADE;


--
-- Name: b2b_order_items b2b_order_items_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_order_items
    ADD CONSTRAINT b2b_order_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: b2b_order_status_history b2b_order_status_history_changed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_order_status_history
    ADD CONSTRAINT b2b_order_status_history_changed_by_users_id_fk FOREIGN KEY (changed_by) REFERENCES public.users(id);


--
-- Name: b2b_order_status_history b2b_order_status_history_order_id_b2b_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_order_status_history
    ADD CONSTRAINT b2b_order_status_history_order_id_b2b_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.b2b_orders(id) ON DELETE CASCADE;


--
-- Name: b2b_orders b2b_orders_client_id_b2b_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_orders
    ADD CONSTRAINT b2b_orders_client_id_b2b_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.b2b_clients(id);


--
-- Name: b2b_orders b2b_orders_courier_partner_id_courier_partners_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_orders
    ADD CONSTRAINT b2b_orders_courier_partner_id_courier_partners_id_fk FOREIGN KEY (courier_partner_id) REFERENCES public.courier_partners(id);


--
-- Name: b2b_orders b2b_orders_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_orders
    ADD CONSTRAINT b2b_orders_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: b2b_payment_milestones b2b_payment_milestones_order_id_b2b_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_payment_milestones
    ADD CONSTRAINT b2b_payment_milestones_order_id_b2b_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.b2b_orders(id) ON DELETE CASCADE;


--
-- Name: b2b_payments b2b_payments_invoice_id_b2b_invoices_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_payments
    ADD CONSTRAINT b2b_payments_invoice_id_b2b_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.b2b_invoices(id);


--
-- Name: b2b_payments b2b_payments_milestone_id_b2b_payment_milestones_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_payments
    ADD CONSTRAINT b2b_payments_milestone_id_b2b_payment_milestones_id_fk FOREIGN KEY (milestone_id) REFERENCES public.b2b_payment_milestones(id);


--
-- Name: b2b_payments b2b_payments_order_id_b2b_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_payments
    ADD CONSTRAINT b2b_payments_order_id_b2b_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.b2b_orders(id) ON DELETE CASCADE;


--
-- Name: b2b_payments b2b_payments_recorded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.b2b_payments
    ADD CONSTRAINT b2b_payments_recorded_by_users_id_fk FOREIGN KEY (recorded_by) REFERENCES public.users(id);


--
-- Name: bulk_upload_jobs bulk_upload_jobs_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulk_upload_jobs
    ADD CONSTRAINT bulk_upload_jobs_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: complaint_timeline complaint_timeline_complaint_id_complaints_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_timeline
    ADD CONSTRAINT complaint_timeline_complaint_id_complaints_id_fk FOREIGN KEY (complaint_id) REFERENCES public.complaints(id) ON DELETE CASCADE;


--
-- Name: complaint_timeline complaint_timeline_employee_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_timeline
    ADD CONSTRAINT complaint_timeline_employee_id_users_id_fk FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: complaints complaints_assigned_to_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_assigned_to_users_id_fk FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: complaints complaints_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: delivery_events delivery_events_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_events
    ADD CONSTRAINT delivery_events_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: delivery_events delivery_events_delivery_id_internal_deliveries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_events
    ADD CONSTRAINT delivery_events_delivery_id_internal_deliveries_id_fk FOREIGN KEY (delivery_id) REFERENCES public.internal_deliveries(id) ON DELETE CASCADE;


--
-- Name: internal_deliveries internal_deliveries_assigned_to_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internal_deliveries
    ADD CONSTRAINT internal_deliveries_assigned_to_users_id_fk FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: internal_deliveries internal_deliveries_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internal_deliveries
    ADD CONSTRAINT internal_deliveries_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: order_items order_items_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_variant_id_product_variants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_variant_id_product_variants_id_fk FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);


--
-- Name: order_status_history order_status_history_changed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_changed_by_users_id_fk FOREIGN KEY (changed_by) REFERENCES public.users(id);


--
-- Name: order_status_history order_status_history_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_assigned_to_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_assigned_to_users_id_fk FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: orders orders_courier_partner_id_courier_partners_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_courier_partner_id_courier_partners_id_fk FOREIGN KEY (courier_partner_id) REFERENCES public.courier_partners(id);


--
-- Name: product_variants product_variants_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_permissions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_permissions_id_fk FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: stock_movements stock_movements_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: stock_movements stock_movements_product_variant_id_product_variants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_product_variant_id_product_variants_id_fk FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_supplier_id_suppliers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: users users_role_id_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict yUiii3WaFSyCbyNj5apfLbKmpCStqciELe8MsIstO4ExUJaVbw38vup7ZGByyUS

