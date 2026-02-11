# Tasks-005: Cash on Delivery Checkout Flow

> Task breakdown for [Plan-005](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/specs/plans/plan-005-checkout.md) · [PRD-005](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/prds/PRD-005-cash-on-delivery-checkout.md)

---

## Phase 1: WhatsApp Validation

### Task 5.1: Create WhatsApp validation Edge Function

- **Files**: `supabase/functions/validate-whatsapp/index.ts`
- **Work**: Accept phone number, call Meta Cloud API Contacts endpoint, return `{ valid, wa_id }`. Handle rate limiting and errors gracefully
- **Depends on**: 2.1 (Meta app setup)
- **Verify**: Valid WhatsApp number → `valid: true`, non-WhatsApp → `valid: false`

### Task 5.2: Create client-side validation with debounce

- **Files**: `src/scripts/services/whatsapp-validate.js`
- **Work**: Debounce 800ms, call Edge Function, show inline ✅/❌ icon, disable submit if invalid. Handle loading state
- **Depends on**: 5.1
- **Verify**: Type phone → 800ms pause → ✅ or ❌ appears inline

---

## Phase 2: Checkout Form

### Task 5.3: Build checkout page shell

- **Files**: `src/pages/checkout.html`, `src/scripts/pages/checkout.js`, `src/styles/pages/checkout.css`
- **Work**: Multi-step form with progress indicator (Step 1: Cart Review → Step 2: Info → Step 3: Confirm). Step navigation (next/back). Cart summary sidebar
- **Depends on**: 6.5, 6.6, 1.8 (cart service)
- **Verify**: Steps navigate, progress indicator updates, cart sidebar shows items

### Task 5.4: Build Step 1 — Cart review with validation

- **Files**: `src/scripts/pages/checkout.js` (extend)
- **Work**: Display cart items (from localStorage), validate: products still active, stock available. Show errors if products unavailable. Update totals
- **Depends on**: 5.3, 1.8
- **Verify**: Cart displays, out-of-stock shown, totals calculate correctly

### Task 5.5: Build Step 2 — Customer info form

- **Files**: `src/scripts/pages/checkout.js` (extend)
- **Work**: Name (required), phone (required, Egyptian format, WhatsApp validated), address (required), city (select dropdown), notes (optional). Arabic labels, RTL layout, inline validation
- **Depends on**: 5.2, 5.3, 6.6
- **Verify**: Form validates, WhatsApp check runs, city dropdown populated, RTL correct

### Task 5.6: Build Step 3 — Order summary and confirmation

- **Files**: `src/scripts/pages/checkout.js` (extend)
- **Work**: Review all details (customer info + cart items + total). "Confirm" button. Send order via `create_order` RPC. Handle errors (stock changes, network). Clear cart on success. Redirect to confirmation page
- **Depends on**: 5.4, 5.5
- **Verify**: Confirm → order created → cart cleared → redirect to confirmation

---

## Phase 3: Server-Side Order Creation

### Task 5.7: Create `create_order` database function

- **Files**: `supabase/migrations/007_create_order_rpc.sql`
- **Work**: RPC function that validates stock, calculates totals, deducts stock, inserts order + items, returns order_number and total. `SECURITY DEFINER` to bypass RLS. Idempotency key to prevent duplicates
- **Depends on**: 4.1 (orders table), 1.1 (products table)
- **Verify**: RPC call → order created with correct total, stock deducted, items linked

---

## Phase 4: Post-Order Experience

### Task 5.8: Build order confirmation page

- **Files**: `src/pages/order-confirmation.html`, `src/scripts/pages/order-confirmation.js`, `src/styles/pages/order-confirmation.css`
- **Work**: Success icon (lantern), order number (`FS-XXXX`), "سيتواصل معك فريقنا قريباً" message, "Continue Shopping" link. Read order number from URL params
- **Depends on**: 5.6, 6.14 (lantern SVG)
- **Verify**: Page shows with order number, links work, Islamic theme applied

---

## Checkpoint: Checkout Complete

- [ ] WhatsApp number validation works (debounced, inline feedback)
- [ ] Multi-step checkout navigates correctly
- [ ] Cart validation catches out-of-stock
- [ ] Form validation covers all required fields
- [ ] Order created server-side with stock deduction
- [ ] Idempotency prevents duplicate orders
- [ ] Confirmation page shows order number
- [ ] WhatsApp auto-confirmation triggered (via PRD-004 trigger)
- [ ] RTL layout correct throughout
