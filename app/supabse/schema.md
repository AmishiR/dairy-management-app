# Supabase Schema Reference

Snapshot of `public` schema table structure, pasted from the Supabase schema
view. **Context only — not runnable.** Table order and constraint completeness
are not guaranteed (the export omits `EXCLUDE USING gist` constraints, enum
definitions, indexes, views, functions, and triggers).

Companion files: [rls.md](rls.md) — full RLS policy dump; [migrations/dispatch.sql](migrations/dispatch.sql) — the `dispatch_allocations` table and `confirm_dispatch()` RPC added for the Dispatch feature (not reflected in the table dump below).

Still not captured anywhere in the repo:

- **Enum definitions** for every `USER-DEFINED` column: `user_role`,
  `customer_status`, `order_status`, `order_payment_status`, `payment_status`,
  `delivery_status`, and the `inventory_transactions` transaction-type /
  reference-type enums.
- **`EXCLUDE USING gist`** overlap constraints on `customer_prices` and
  `internal_costs` (referenced by `project_context.md`).
- **Views**: `customer_dues`, `production_requirements`.
- **Functions / triggers**: `create_production_batch`,
  `record_raw_material_receipt`, `get_customer_price`, `get_internal_cost`,
  `next_valid_delivery_date`, `fn_enforce_order_cutoff`, `fn_handle_new_user`,
  `is_staff_or_admin`, `is_admin`, `current_customer_id`,
  `trg_prevent_role_escalation`, and the payment/total rollup triggers.

---

```sql
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'customer'::user_role,
  full_name text,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active'::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.customers (
  customer_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  customer_code text NOT NULL UNIQUE,
  customer_type text NOT NULL DEFAULT 'retail'::text,
  organization_name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  status USER-DEFINED NOT NULL DEFAULT 'active'::customer_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  CONSTRAINT customers_pkey PRIMARY KEY (customer_id),
  CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT customers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.products (
  product_id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_code text NOT NULL UNIQUE,
  product_name text NOT NULL,
  category text NOT NULL,
  unit text NOT NULL,
  is_raw_material boolean NOT NULL DEFAULT false,
  is_finished_good boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (product_id)
);
CREATE TABLE public.customer_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  product_id uuid NOT NULL,
  selling_price numeric NOT NULL CHECK (selling_price >= 0::numeric),
  effective_from date NOT NULL,
  effective_to date,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT customer_prices_pkey PRIMARY KEY (id),
  CONSTRAINT customer_prices_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id),
  CONSTRAINT customer_prices_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT customer_prices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id)
);
CREATE TABLE public.internal_costs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  cost_price numeric NOT NULL CHECK (cost_price >= 0::numeric),
  effective_from date NOT NULL,
  effective_to date,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT internal_costs_pkey PRIMARY KEY (id),
  CONSTRAINT internal_costs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id),
  CONSTRAINT internal_costs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.orders (
  order_id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_no text UNIQUE,
  customer_id uuid NOT NULL,
  order_date timestamp with time zone NOT NULL DEFAULT now(),
  requested_delivery_date date,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::order_status,
  payment_status USER-DEFINED NOT NULL DEFAULT 'unpaid'::order_payment_status,
  total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0::numeric),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  payment_upfront boolean NOT NULL DEFAULT false,
  CONSTRAINT orders_pkey PRIMARY KEY (order_id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0::numeric),
  unit_price numeric NOT NULL CHECK (unit_price >= 0::numeric),
  total_amount numeric DEFAULT round((quantity * unit_price), 2),
  quantity_delivered numeric NOT NULL DEFAULT 0 CHECK (quantity_delivered >= 0::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id)
);
CREATE TABLE public.payments (
  payment_id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  customer_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  payment_mode text NOT NULL DEFAULT 'UPI'::text,
  transaction_reference text,
  screenshot_url text,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::payment_status,
  submitted_at timestamp with time zone,
  verified_by uuid,
  verified_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (payment_id),
  CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id),
  CONSTRAINT payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id),
  CONSTRAINT payments_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.payment_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['submitted'::text, 'verified'::text, 'rejected'::text, 'refunded'::text])),
  performed_by uuid,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payment_verifications_pkey PRIMARY KEY (id),
  CONSTRAINT payment_verifications_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(payment_id),
  CONSTRAINT payment_verifications_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.deliveries (
  delivery_id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  delivery_date date NOT NULL DEFAULT CURRENT_DATE,
  dm_number text UNIQUE,
  status USER-DEFINED NOT NULL DEFAULT 'completed'::delivery_status,
  delivered_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  delivered_at timestamp with time zone,
  CONSTRAINT deliveries_pkey PRIMARY KEY (delivery_id),
  CONSTRAINT deliveries_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id),
  CONSTRAINT deliveries_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id),
  CONSTRAINT deliveries_delivered_by_fkey FOREIGN KEY (delivered_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.delivery_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL,
  order_item_id uuid NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0::numeric),
  unit_price numeric NOT NULL CHECK (unit_price >= 0::numeric),
  total_amount numeric DEFAULT round((quantity * unit_price), 2),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT delivery_items_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_items_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.deliveries(delivery_id),
  CONSTRAINT delivery_items_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id)
);
CREATE TABLE public.raw_material_receipts (
  receipt_id uuid NOT NULL DEFAULT gen_random_uuid(),
  receipt_date date NOT NULL DEFAULT CURRENT_DATE,
  supplier text,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT raw_material_receipts_pkey PRIMARY KEY (receipt_id),
  CONSTRAINT raw_material_receipts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.raw_material_receipt_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  receipt_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0::numeric),
  cost_per_unit numeric NOT NULL CHECK (cost_per_unit >= 0::numeric),
  total_cost numeric DEFAULT round((quantity * cost_per_unit), 2),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT raw_material_receipt_items_pkey PRIMARY KEY (id),
  CONSTRAINT raw_material_receipt_items_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.raw_material_receipts(receipt_id),
  CONSTRAINT raw_material_receipt_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id)
);
CREATE TABLE public.production_batch_counters (
  production_date date NOT NULL,
  last_seq integer NOT NULL DEFAULT 0,
  CONSTRAINT production_batch_counters_pkey PRIMARY KEY (production_date)
);
CREATE TABLE public.production_batches (
  batch_id uuid NOT NULL DEFAULT gen_random_uuid(),
  batch_no text NOT NULL UNIQUE,
  product_id uuid NOT NULL,
  production_date date NOT NULL DEFAULT CURRENT_DATE,
  quantity_produced numeric NOT NULL CHECK (quantity_produced > 0::numeric),
  total_input_cost numeric NOT NULL DEFAULT 0 CHECK (total_input_cost >= 0::numeric),
  cost_per_unit numeric DEFAULT
CASE
    WHEN (quantity_produced > (0)::numeric) THEN round((total_input_cost / quantity_produced), 4)
    ELSE (0)::numeric
END,
  status text NOT NULL DEFAULT 'completed'::text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT production_batches_pkey PRIMARY KEY (batch_id),
  CONSTRAINT production_batches_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id),
  CONSTRAINT production_batches_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.production_inputs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL,
  raw_product_id uuid NOT NULL,
  quantity_used numeric NOT NULL CHECK (quantity_used > 0::numeric),
  cost_per_unit numeric NOT NULL CHECK (cost_per_unit >= 0::numeric),
  total_cost numeric DEFAULT round((quantity_used * cost_per_unit), 2),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT production_inputs_pkey PRIMARY KEY (id),
  CONSTRAINT production_inputs_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.production_batches(batch_id),
  CONSTRAINT production_inputs_raw_product_id_fkey FOREIGN KEY (raw_product_id) REFERENCES public.products(product_id)
);
CREATE TABLE public.production_recipes (
  recipe_id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT production_recipes_pkey PRIMARY KEY (recipe_id),
  CONSTRAINT production_recipes_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id)
);
CREATE TABLE public.production_recipe_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL,
  raw_product_id uuid NOT NULL,
  quantity_per_unit numeric NOT NULL CHECK (quantity_per_unit > 0::numeric),
  CONSTRAINT production_recipe_items_pkey PRIMARY KEY (id),
  CONSTRAINT production_recipe_items_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.production_recipes(recipe_id),
  CONSTRAINT production_recipe_items_raw_product_id_fkey FOREIGN KEY (raw_product_id) REFERENCES public.products(product_id)
);
CREATE TABLE public.inventory_transactions (
  transaction_id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  transaction_date timestamp with time zone NOT NULL DEFAULT now(),
  transaction_type USER-DEFINED NOT NULL,
  quantity numeric NOT NULL CHECK (quantity <> 0::numeric),
  reference_type USER-DEFINED NOT NULL,
  reference_id uuid,
  remarks text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT inventory_transactions_pkey PRIMARY KEY (transaction_id),
  CONSTRAINT inventory_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id),
  CONSTRAINT inventory_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.inventory_balances (
  product_id uuid NOT NULL,
  current_stock numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT inventory_balances_pkey PRIMARY KEY (product_id),
  CONSTRAINT inventory_balances_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id)
);
CREATE TABLE public.daily_counters (
  counter_name text NOT NULL,
  counter_date date NOT NULL,
  last_seq integer NOT NULL DEFAULT 0,
  CONSTRAINT daily_counters_pkey PRIMARY KEY (counter_name, counter_date)
);
CREATE TABLE public.audit_logs (
  audit_id bigint NOT NULL DEFAULT nextval('audit_logs_audit_id_seq'::regclass),
  user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (audit_id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```
