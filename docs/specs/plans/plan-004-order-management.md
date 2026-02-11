# Plan-004: Order Management via WhatsApp

> Technical implementation plan for [PRD-004](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/prds/PRD-004-order-management-whatsapp.md)

---

## Architecture

### Order Flow

```
Customer places order (PRD-005)
  │
  ├──→ 1. Auto-confirm to customer (WhatsApp utility template)
  ├──→ 2. Alert fullfillment group (WhatsApp group message)
  │
  ▼
Fulfillment team claims order
  │
  ├──→ 3. Reply "تواصل {id}" → receive wa.me link
  │
  ▼
Team contacts customer (prefilled message via wa.me)
  │
  ├──→ 4. Order status → "customer_contacted"
  │
  ▼
Delivery & completion
```

---

## Order State Machine

```
┌──────────┐    auto     ┌───────────┐    claim    ┌──────────┐
│  pending  │ ─────────→ │ confirmed │ ─────────→ │ claimed  │
└──────────┘             └───────────┘             └────┬─────┘
                                                        │ contact
                                                        ▼
                        ┌───────────┐             ┌─────────────────┐
                        │ delivered │ ←────────── │customer_contacted│
                        └─────┬─────┘  deliver    └─────────────────┘
                              │
                   ┌──────────┼──────────┐
                   ▼                     ▼
              ┌──────────┐         ┌───────────┐
              │completed │         │ cancelled │
              └──────────┘         └───────────┘
```

### Database Schema

```sql
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,  -- human-readable: FS-0001
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  city text not null,
  notes text,
  status text default 'pending'
    check (status in ('pending','confirmed','claimed','customer_contacted','delivered','completed','cancelled')),
  total decimal(10,2) not null,
  currency text default 'EGP',
  claimed_by text,                    -- fulfillment team member name
  claimed_at timestamptz,
  customer_contacted_at timestamptz,
  expected_delivery text,             -- set by fulfillment team
  delivered_at timestamptz,
  wa_confirmation_sent boolean default false,
  wa_group_alert_sent boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  product_name_ar text not null,      -- snapshot at time of order
  quantity integer not null check (quantity > 0),
  unit_price decimal(10,2) not null,
  subtotal decimal(10,2) not null,
  created_at timestamptz default now()
);

-- Auto-generate order number
create sequence order_number_seq;
create or replace function generate_order_number()
returns trigger as $$
begin
  new.order_number := 'FS-' || lpad(nextval('order_number_seq')::text, 4, '0');
  return new;
end;
$$ language plpgsql;

create trigger order_number_trigger
  before insert on orders
  for each row execute function generate_order_number();
```

---

## WhatsApp Message Templates

### 1. Auto Order Confirmation (→ Customer)

**Template name**: `order_confirmation_ar`
**Category**: Utility

```
✅ تم استلام طلبك!

رقم الطلب: {{order_number}}
الإجمالي: {{total}} ج.م

سيتواصل معك فريقنا قريباً لتأكيد موعد التوصيل.

شكراً لتسوقك من قرطاسية العائلة 🌙
```

### 2. Fulfillment Group Alert

**Sent as**: Free-form message to WhatsApp group (within service window or via template)

```
🆕 طلب جديد!

رقم: {{order_number}}
العميل: {{customer_name}}
المنطقة: {{city}}
الإجمالي: {{total}} ج.م

المنتجات:
{{items_list}}

للاستلام أرسل: استلام {{order_number}}
```

### 3. Prefilled Customer Contact (`wa.me` deep link)

**Generated URL format**:

```
https://wa.me/{{customer_phone}}?text={{encoded_message}}
```

**Prefilled message**:

```
مرحباً {{customer_name}} 👋

أنا من فريق قرطاسية العائلة بخصوص طلبك رقم {{order_number}}.

موعد التوصيل المتوقع: ___________

هل الموعد مناسب لك؟
```

---

## Edge Functions

```
supabase/functions/
├── order-confirm/           # Sends auto-confirmation to customer
│   └── index.ts
├── order-alert-group/       # Sends alert to fulfillment group
│   └── index.ts
├── order-claim/             # Processes "استلام FS-XXXX" from group
│   └── index.ts
├── order-contact/           # Returns wa.me link for customer contact
│   └── index.ts
└── order-status-update/     # Updates order status + timestamps
    └── index.ts
```

### Claim Flow

```typescript
// order-claim/index.ts
// Triggered when someone in the group sends: "استلام FS-0001"
const CLAIM_PATTERN = /^استلام\s+(FS-\d{4,})$/i;

function processClaim(message: string, senderName: string) {
  const match = message.match(CLAIM_PATTERN);
  if (!match) return null;

  const orderNumber = match[1];
  // Update order: status = 'claimed', claimed_by = senderName
  // Reply with wa.me link for customer contact
}
```

### Contact Flow

```typescript
// When fulfillment sends: "تواصل FS-0001"
const CONTACT_PATTERN = /^تواصل\s+(FS-\d{4,})$/i;

function processContact(message: string) {
  const orderNumber = message.match(CONTACT_PATTERN)?.[1];
  // Fetch order details
  // Generate wa.me deep link with prefilled message
  // Reply with the link
  // Update order status to 'customer_contacted'
}
```

---

## Database Trigger: Auto-Confirm

```sql
-- Trigger on new order insert → call Edge Function
create or replace function notify_order_created()
returns trigger as $$
begin
  perform net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/order-confirm',
    body := jsonb_build_object('order_id', new.id)
  );
  return new;
end;
$$ language plpgsql;

create trigger order_created_trigger
  after insert on orders
  for each row execute function notify_order_created();
```

---

## Dependencies

| Dependency                | Source PRD                    |
| ------------------------- | ----------------------------- |
| Order creation (checkout) | PRD-005                       |
| WhatsApp API              | Constitution (Meta Cloud API) |
| Product data              | PRD-001                       |
