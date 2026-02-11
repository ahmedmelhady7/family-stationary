# Tasks-004: Order Management via WhatsApp

> Task breakdown for [Plan-004](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/specs/plans/plan-004-order-management.md) · [PRD-004](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/prds/PRD-004-order-management-whatsapp.md)

---

## Phase 1: Database & State Machine

### Task 4.1: Create orders and order_items tables

- **Files**: `supabase/migrations/004_orders.sql`
- **Work**: Create `orders` table (order_number, customer info, status, total, claimed_by, timestamps), `order_items` table (product snapshot). Auto-generate `FS-XXXX` order number via sequence + trigger
- **Depends on**: 1.1 (products table)
- **Verify**: Insert order → `FS-0001` generated, items linked

### Task 4.2: Set up RLS policies for orders

- **Files**: `supabase/migrations/005_rls_orders.sql`
- **Work**: Anon can insert (public checkout). Admin can read/update all. No public read of other customers' orders
- **Depends on**: 4.1
- **Verify**: Anon can create order, admin can view/update, anon cannot read orders

---

## Phase 2: Auto-Confirmation

### Task 4.3: Create order confirmation template in Meta

- **Work**: Submit `order_confirmation_ar` utility template to Meta for approval. Arabic text with `{{order_number}}` and `{{total}}` variables
- **Depends on**: 2.1 (Meta app setup)
- **Verify**: Template approved by Meta, visible in Business Manager

### Task 4.4: Build order confirmation Edge Function

- **Files**: `supabase/functions/order-confirm/index.ts`
- **Work**: Receive order_id, fetch order + items, send approved template message to customer's WhatsApp, update `wa_confirmation_sent = true`
- **Depends on**: 4.1, 4.3, 2.3 (WhatsApp send helper)
- **Verify**: Create order → customer receives WhatsApp confirmation

### Task 4.5: Create DB trigger for auto-confirmation

- **Files**: `supabase/migrations/006_order_triggers.sql`
- **Work**: `AFTER INSERT ON orders` trigger calls `order-confirm` Edge Function via `net.http_post`
- **Depends on**: 4.1, 4.4
- **Verify**: Insert order → trigger fires → confirmation sent automatically

---

## Phase 3: Fulfillment Group Flow

### Task 4.6: Build group alert Edge Function

- **Files**: `supabase/functions/order-alert-group/index.ts`
- **Work**: Send order summary to fulfillment WhatsApp group (order number, customer name, city, total, items list, "للاستلام أرسل: استلام FS-XXXX")
- **Depends on**: 4.5, 2.3
- **Verify**: New order → group receives alert with order details

### Task 4.7: Implement claim command processor

- **Files**: `supabase/functions/whatsapp-webhook/index.ts` (extend)
- **Work**: Detect "استلام FS-XXXX" pattern in group messages. Update order: `status = 'claimed'`, `claimed_by = sender_name`. Reply with wa.me deep link for customer contact
- **Depends on**: 4.1, 2.2, 4.6
- **Verify**: Send "استلام FS-0001" → order claimed, receive wa.me link

### Task 4.8: Implement contact command processor

- **Files**: `supabase/functions/whatsapp-webhook/index.ts` (extend)
- **Work**: Detect "تواصل FS-XXXX" pattern. Generate `wa.me/{phone}?text={prefilled_message}` link. Update status to `customer_contacted`
- **Depends on**: 4.7
- **Verify**: Send "تواصل FS-0001" → receive wa.me link, order status updated

---

## Phase 4: Status Tracking

### Task 4.9: Build order status command processor

- **Files**: `supabase/functions/whatsapp-webhook/index.ts` (extend)
- **Work**: Detect "حالة FS-XXXX" pattern. Reply with current order status, customer info, claimed_by, timestamps
- **Depends on**: 4.1, 2.2
- **Verify**: Send "حالة FS-0001" → receive order status summary

### Task 4.10: Implement delivery confirmation command

- **Files**: `supabase/functions/whatsapp-webhook/index.ts` (extend)
- **Work**: Detect "تسليم FS-XXXX" pattern. Update status to `delivered`, set `delivered_at`. Reply with confirmation
- **Depends on**: 4.7, 4.8
- **Verify**: Send "تسليم FS-0001" → order delivered, confirmation sent

---

## Checkpoint: Order Management Complete

- [ ] Orders auto-generate `FS-XXXX` numbers
- [ ] Auto-confirmation WhatsApp sent to customer
- [ ] Fulfillment group alerted with order details
- [ ] Claim flow works ("استلام")
- [ ] Contact flow generates wa.me links ("تواصل")
- [ ] Status check works ("حالة")
- [ ] Delivery confirmation works ("تسليم")
- [ ] All Arabic messages grammatically correct
