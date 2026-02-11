# Plan-005: Cash on Delivery Checkout Flow

> Technical implementation plan for [PRD-005](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/prds/PRD-005-cash-on-delivery-checkout.md)

---

## Architecture

### Page Structure

```
src/pages/
├── cart.html                # Cart review page
├── checkout.html            # Multi-step checkout form
└── order-confirmation.html  # Post-order success page
```

### Checkout Steps

```
Step 1: Cart Review      → Validate cart items, show totals
Step 2: Customer Info    → Name, phone (WhatsApp validated), address, city
Step 3: Order Summary    → Review all details, confirm
Step 4: Confirmation     → Success page with order number
```

---

## Cart Review (Step 1)

### Cart Service → UI

```javascript
// scripts/pages/cart.js
import { getCart, updateQuantity, removeFromCart } from "../services/cart.js";
import { formatPrice } from "../utils/format.js";

function renderCart() {
  const items = getCart();
  // Fetch current product data for each item (price, stock, name)
  // Display: name, image, quantity selector, unit price, subtotal
  // Show total at bottom
  // "Proceed to Checkout" button (disabled if cart empty)
}
```

### Validations

- Product still exists and is `active`
- Requested quantity ≤ available stock
- Cart is not empty

---

## Customer Info Form (Step 2)

### Form Fields

| Field              | Type     | Validation                                   | WhatsApp Validated |
| ------------------ | -------- | -------------------------------------------- | ------------------ |
| `customer_name`    | Text     | Required, 2-50 chars                         | ❌                 |
| `customer_phone`   | Tel      | Required, Egyptian format, starts with `+20` | ✅                 |
| `customer_address` | Textarea | Required, 10-200 chars                       | ❌                 |
| `city`             | Select   | Required, predefined list                    | ❌                 |
| `notes`            | Textarea | Optional, max 500 chars                      | ❌                 |

### WhatsApp Number Validation

```javascript
// services/whatsapp-validate.js
let validateTimeout;

export async function validateWhatsAppNumber(phone) {
  // Debounce 800ms
  clearTimeout(validateTimeout);
  return new Promise((resolve) => {
    validateTimeout = setTimeout(async () => {
      const response = await fetch("/functions/v1/validate-whatsapp", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      const { valid } = await response.json();
      resolve(valid);
    }, 800);
  });
}
```

### Edge Function: WhatsApp Validation

```typescript
// supabase/functions/validate-whatsapp/index.ts
Deno.serve(async (req) => {
  const { phone } = await req.json();

  // Call Meta Cloud API contacts endpoint
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${WA_PHONE_ID}/contacts`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WA_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        blocking: "wait",
        contacts: [phone],
      }),
    },
  );

  const data = await response.json();
  const contact = data.contacts?.[0];

  return Response.json({
    valid: contact?.status === "valid",
    wa_id: contact?.wa_id || null,
  });
});
```

### UX Feedback

```
Phone input → Typing → Debounce 800ms → API call → ✅ or ❌ inline icon
                                                   → Block submit if ❌
```

---

## Order Creation (Step 3 → Step 4)

### API Call

```javascript
// services/order.js
export async function createOrder(customerData, cartItems) {
  const { data: order, error } = await supabase.rpc("create_order", {
    p_customer_name: customerData.name,
    p_customer_phone: customerData.phone,
    p_customer_address: customerData.address,
    p_city: customerData.city,
    p_notes: customerData.notes,
    p_items: cartItems.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
    })),
  });

  if (error) throw error;
  return order;
}
```

### Server-Side Order Creation (RPC)

```sql
create or replace function create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_city text,
  p_notes text default null,
  p_items jsonb default '[]'
) returns jsonb as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_total decimal := 0;
  v_item record;
begin
  -- Validate stock and calculate totals
  for v_item in select * from jsonb_to_recordset(p_items) as x(product_id uuid, quantity int)
  loop
    -- Check stock, get price, compute subtotal
    -- Deduct stock
  end loop;

  -- Insert order
  insert into orders (customer_name, customer_phone, customer_address, city, notes, total)
  values (p_customer_name, p_customer_phone, p_customer_address, p_city, p_notes, v_total)
  returning id, order_number into v_order_id, v_order_number;

  -- Insert order items (with price snapshot)
  -- ...

  return jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number, 'total', v_total);
end;
$$ language plpgsql security definer;
```

### Post-Order

1. Clear cart (`localStorage`)
2. Redirect to confirmation page with order number
3. Auto-confirmation WhatsApp message triggered by DB trigger (PRD-004)

---

## Confirmation Page (Step 4)

Displays:

- ✅ Success icon (Islamic lantern)
- Order number (e.g., `FS-0001`)
- "سيتواصل معك فريقنا قريباً" message
- Link back to homepage
- Option to continue shopping

---

## Edge Cases

| Scenario                              | Handling                                    |
| ------------------------------------- | ------------------------------------------- |
| Product sold out during checkout      | Show error, update cart, let user adjust    |
| Invalid WhatsApp number               | Block checkout, show inline ❌ beside phone |
| Network failure during order creation | Show retry button, preserve form state      |
| Duplicate order submission            | Idempotency key in `create_order` RPC       |
| Cart empty on checkout page           | Redirect to catalog                         |

---

## Dependencies

| Dependency                          | Source PRD                    |
| ----------------------------------- | ----------------------------- |
| Product data, cart                  | PRD-001                       |
| Order schema, WhatsApp confirmation | PRD-004                       |
| Design system                       | PRD-006                       |
| WhatsApp validation API             | Constitution (Meta Cloud API) |
