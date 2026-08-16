# Dairy Management System — Project Context

**Purpose of this file:** Complete context for an AI assistant (or future me)
picking up this project cold. Covers the business, the database, the app
architecture, every decision made and why, and exactly what's built vs. what
isn't yet.

---

## 1. The Business

A dairy supplier selling 5 finished products (Milk, Ghee, Khowa, Paneer,
Dahi) made from raw materials (Cow Milk, Buffalo Milk, Dahi, Gas/Fuel).

### Core operating model — read this before touching anything
1. **Produce-to-order, no buffer stock.** Orders placed today are produced
   overnight and delivered the next day. Nothing is made speculatively.
2. **Orders are NEVER rejected for insufficient stock.** Placing an order is
   a record of demand, not a reservation. Staff produce whatever total
   quantity was ordered — no stock check exists anywhere in the order path.
3. **Order cutoff: 5:00 AM (Asia/Kolkata) on the requested delivery date.**
   Enforced by a DB trigger. Late orders are rejected outright, not
   auto-pushed to the next day. Staff/admin are exempt.
4. **No payment gateway.** Customers pay via a static UPI QR code, submit a
   screenshot + UTR as evidence, and staff manually verify against the real
   bank/UPI statement. A payment only affects order payment status once
   `status = 'verified'` — a mere submission proves nothing.
5. **Payment timing is decoupled from fulfillment.** An order can be fully
   delivered while still unpaid. `orders.payment_upfront` is a per-order flag
   for cases where payment must be verified before production.
6. **The Next.js web app is staff/admin only.** There is no customer-facing
   web UI. Customers will order via a separate mobile app (not yet built),
   connecting to the same Supabase project directly.
7. **Historical accuracy is non-negotiable.** Prices, costs, and production
   inputs are versioned and snapshotted — a price change tomorrow must never
   alter what an order from yesterday shows it paid.

---

## 2. Tech Stack

- **Database:** Supabase (PostgreSQL), accessed via SQL Editor migrations
- **Frontend:** Next.js (App Router), TypeScript
- **Auth:** Supabase Auth, via `@supabase/ssr`
- **Styling:** inline styles throughout (no CSS framework adopted yet)
- No ORM — direct Supabase client calls from Server Components/Actions

---

## 3. Database — Migration History

All files are additive SQL run in order in the Supabase SQL Editor. Full
table/column/policy reference lives in `schema_reference.md` (companion doc)
— this section is the *narrative* of what changed and why.

| File | What it did |
|---|---|
| `01_schema.sql` | Core schema: `customers`, `products`, `customer_prices`, `internal_costs`, `orders`, `order_items`, `payments`, `payment_verifications`, `deliveries`, `delivery_items`, `raw_material_receipts(+items)`, `production_batches`, `production_inputs`, `production_recipes(+items)`, `inventory_transactions`, `inventory_balances`. UUID PKs throughout. `EXCLUDE USING gist` constraints prevent overlapping price/cost periods. |
| `02_functions_triggers.sql` | `get_customer_price()`, `get_internal_cost()` (as-of-date lookups), `next_production_batch_no()` (race-safe daily counter), `create_production_batch()` (atomic: deducts raw stock, adds finished stock, computes cost, rolls back entirely on failure), `record_raw_material_receipt()` (atomic), inventory balance trigger (blocks negative stock via row lock), order total recalc trigger, delivery validation trigger, payment status rollup triggers. |
| `03_rls_policies.sql` | RLS enabled on every table. Helper functions `is_staff_or_admin()`, `current_customer_id()`. Customers see only their own data; staff/admin manage everything except each other's `auth` credentials. |
| `04_seed_data.sql` | Example products, 2 customers, sample prices/costs. |
| `05_examples_and_tests.sql` | Worked examples of the full order→payment→delivery flow, a production batch, and the 10 requested test queries. |
| `06_migration_updates.sql` | **Bug fix:** RLS helper functions weren't `SECURITY DEFINER`, causing potential policy recursion — fixed. Added `orders.payment_upfront`, made `payments.order_id` nullable (lump-sum payments), `customer_dues` view, `production_requirements` view, `audit_logs` table + triggers on payments/pricing tables, staff-can-submit-payment-on-customer's-behalf policy, partial indexes for dashboard queries. |
| `07_order_cutoff.sql` | 5 AM cutoff trigger on `orders` (`fn_enforce_order_cutoff`), `next_valid_delivery_date()` helper for the app's date picker. Staff/admin exempt from the cutoff. |
| `08_admin_staff_invite.sql` | **Real security fix:** `profiles_update_own` had no column restriction — a `staff` account could set its own `role = 'admin'` via a plain UPDATE, since the policy only checked row ownership. Added `is_admin()` (stricter than `is_staff_or_admin()`), a trigger blocking any `role` change unless the acting session user is already a true admin, and tightened `profiles_staff_manage` → `profiles_admin_manage` (staff can still read all profiles, but no longer write to arbitrary ones). Also updated `fn_handle_new_user()` to read `role` from invite metadata, so admin-invited staff are created with the correct role immediately instead of defaulting to `customer`. |

### Known bootstrapping gotcha
The very first admin account can't be created through the app (nothing can
authorize it — that's the point of the trigger from `08`). It must be set
directly in the SQL Editor, with the trigger briefly disabled:
```sql
alter table profiles disable trigger trg_prevent_role_escalation;
update profiles set role = 'admin' where id = (select id from auth.users where email = '...');
alter table profiles enable trigger trg_prevent_role_escalation;
```
This is safe — the SQL Editor is already a fully-trusted context (project
owner credentials), not a request going through the app's RLS-governed API.

---

## 4. Next.js App — Architecture Decisions

### Why no separate REST API layer
Supabase's PostgREST layer *is* the API, and RLS *is* the authorization
layer. Server Components read data directly (RLS filters automatically).
Server Actions write data directly (`supabase.from().insert()` or
`.rpc(...)`), with RLS and Postgres functions doing validation. Route
Handlers (`app/api/...`) are reserved for things outside a normal user
request — webhooks, service-role jobs.

### Why no client-side data-fetching hooks (React Query, SWR, etc.)
Server Components fetch during render, on the server — there's no client-side
loading state to manage for page data. Hooks/client state are reserved for
things that are genuinely browser-only and transient: a shopping cart before
checkout (not yet built, since ordering lives in a future mobile app, not
this app), the Set Password page's form state, live subscriptions (not yet
built).

### Three-role model
`profiles.role` ∈ `customer | staff | admin`, 1:1 with `auth.users`.
- **customer**: blocked entirely from this web app (signed out on detection)
- **staff**: confined to `/staff/**`
- **admin**: can reach both `/staff/**` and `/admin/**`; `/admin/**` has one
  extra feature (Add Staff) that staff never sees

### Route structure and the "protected route group" lesson learned
```
app/
├── login/                          staff/customer login (customer gets bounced)
├── admin/
│   ├── login/                      admin-only login, NOT wrapped by the admin layout
│   └── (protected)/                route group — auth-gated, invisible in the URL
│       ├── layout.tsx              admin-only check happens here
│       ├── dashboard/
│       └── staff/                  Add Staff form + invite action
├── staff/                          staff/admin dashboard (layout.tsx gates it)
├── set-password/                   where invited staff land from the email link
├── components/
│   ├── AppShell.tsx                shared header/nav, used by staff AND admin layouts
│   └── DashboardOverview.tsx       shared dashboard content, used by staff AND admin
└── lib/supabase/
    ├── client.ts                   browser client
    ├── server.ts                   server client (cookies-based)
    ├── middleware.ts               session refresh + 3-way role routing
    └── admin.ts                    SERVICE ROLE client — server-only, never client-imported
```
**Lesson learned the hard way:** initially `app/admin/layout.tsx` wrapped
*everything* under `/admin/`, including `/admin/login`. Logged-out visitors
hit the layout's `redirect('/admin/login')`, which re-triggered the same
layout, causing an infinite redirect loop (confirmed in server logs — hundreds
of repeated `GET /admin/login` requests, most of the latency being real
Supabase auth round-trips on each iteration). Fixed by moving all
*actually-protected* admin routes into `app/admin/(protected)/`, leaving
`app/admin/login/` as a sibling, outside the layout's reach.

### Middleware responsibilities (`app/lib/supabase/middleware.ts`)
Runs on every request. Refreshes the session, then:
- No session + not on a login page → redirect to `/login`
- `customer` role anywhere in this app → sign out, redirect to `/login` with
  an error
- `staff` hitting `/admin/**` → redirect to `/staff`
- `admin`/`staff` landing on a login page while already authenticated →
  redirect to their dashboard
- `/set-password` is exempt from role checks entirely (a freshly-invited user
  has a session but their role state at that exact moment isn't the point —
  only "do they have a session" matters)

### The invite flow, end to end
1. Admin fills the Add Staff form (`/admin/staff`) → `inviteStaff()` Server
   Action
2. Action **independently** re-verifies the caller is `role = 'admin'` by
   querying `profiles` itself — never trusts that "only admins can see this
   button" is sufficient (a staff member could theoretically call the action
   directly)
3. Validates email format + role value
4. Calls `supabase.auth.admin.inviteUserByEmail(email, { data: { role: 'staff' }, redirectTo: '.../set-password' })`
   using the **service-role client** (`admin.ts`) — this is the only place
   in the codebase that key is ever used
5. `fn_handle_new_user()` trigger (updated in migration `08`) reads
   `role: 'staff'` from the invite metadata when creating the `auth.users`
   row, so the `profiles` row is correct from the start — no follow-up
   promotion needed
6. Staff clicks the email link → lands on `/set-password` with a session
   Supabase's browser client auto-established from the URL token
7. Client-side form calls `supabase.auth.updateUser({ password })`
8. Redirects to `/staff` — role was already correct, no lookup needed here

### Reused vs. duplicated (per explicit requirement)
`AppShell` and `DashboardOverview` are shared components — the admin
dashboard is not a copy of the staff dashboard, it's the *same* component
rendered in a different layout, with one additional nav link
(`extraNavLinks` prop) for "Add Staff". Refactoring `app/staff/layout.tsx`
and `app/staff/page.tsx` to use these shared pieces was a deliberate,
behavior-preserving change — not a break from "don't touch existing
functionality," since output is identical.

---

## 5. Feature Status

### ✅ Built
- Supabase connection, environment setup
- Staff/admin login, logout, role-based route protection
- Staff dashboard (pending orders, payments awaiting verification, tonight's
  production requirements, top customer dues)
- Product management (create, activate/deactivate, list by category)
- Customer pricing — browse by customer, set/change price with automatic
  period-closing (no manual overlap handling needed), full history with
  which staff member set each price (`created_by` tracking)
- Internal cost management (same versioning pattern as customer pricing,
  `created_by` tracking not yet added — flagged as a known gap)
- Admin login (separate from staff, independently role-verified)
- Admin dashboard (reuses staff dashboard component)
- Add Staff — secure invite flow via Supabase Admin API, server-side
  authorization independent of the UI
- Set Password page for invited staff

### ❌ Not built yet
- **Customer management** (add/edit customer records) — blocks full use of
  the pricing screens, since there's nowhere yet to create a customer to
  price for
- **Payment verification queue** — the actual approve/reject UI for staff;
  the database logic (`payment_verifications`, status rollup triggers) is
  ready, just no page consumes it yet
- **Raw material receipt form** — UI wrapper around the already-built
  `record_raw_material_receipt()` function
- **Production batch form** — UI wrapper around the already-built
  `create_production_batch()` function
- **Delivery recording** — UI to mark orders delivered, insert
  `deliveries`/`delivery_items`
- **`internal-costs` `created_by` tracking** — same fix already applied to
  customer prices, not yet mirrored here
- **Customer-facing mobile app** — entirely separate project, not started;
  will connect to the same Supabase backend using the customer-side RLS
  policies that already exist in the schema

---

## 6. Known Gaps / Things to Watch

- **Email visibility for staff list**: `/admin/staff`'s existing-staff table
  currently shows `full_name`/`role`/`status` from `profiles` only — no
  email, since email lives in `auth.users` and isn't queryable from the
  normal client. Would need either the admin client's
  `auth.admin.listUsers()` or a dedicated view to add this.
- **`profiles.full_name` may be null** for accounts created via the
  Supabase Dashboard without setting metadata — shows as "Unknown staff" or
  "(not set yet)" in various UIs until manually set.
- **Site URL for invites** (`NEXT_PUBLIC_SITE_URL`) needs updating when
  deploying to production, plus the corresponding Redirect URL added in
  Supabase Dashboard → Authentication → URL Configuration.

---

## 7. Versioning

Git tags follow semantic-ish minor bumps per completed feature set:
- `v0.2.0` — Product and Pricing Management
- `v0.3.0` — Customer-scoped pricing with staff tracking
- `v0.4.0` — Admin/Staff Role System (invite flow, RLS hardening, route
  group fix for the login redirect loop)

---

## 8. If You're an AI Picking This Up

- Read `schema_reference.md` (companion file) for the exhaustive table/RLS
  reference — this file is the narrative, that one is the lookup table.
- Don't reintroduce a customer-facing flow into this Next.js app — that's
  explicitly out of scope here (separate mobile app, future work).
- Any new admin-only or staff-only page needs its own independent
  server-side role check inside the Server Action/page itself — never rely
  solely on middleware or a layout, per the security pattern established in
  `inviteStaff()`.
- Any new price/cost-like table needs the `EXCLUDE USING gist` overlap
  protection and an auto-close pattern in its Server Action, matching
  `customer_prices`/`internal_costs` — don't hand-roll overlap checking.
- When in doubt about a business rule (stock checks, cutoff times, payment
  gating), check Section 1 first — these were explicitly clarified and
  decided over the course of building this, not assumptions.