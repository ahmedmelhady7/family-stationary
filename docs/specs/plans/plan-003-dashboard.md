# Plan-003: Product Management Dashboard

> Technical implementation plan for [PRD-003](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/prds/PRD-003-product-management-dashboard.md)

---

## Architecture

### Page Structure

```
src/pages/admin/
├── login.html              # Admin authentication
├── dashboard.html          # Summary stats + quick actions
├── products.html           # Product list (search, filter, sort)
├── product-edit.html       # Product add/edit form
└── categories.html         # Category management
```

### Authentication

**Phase 1**: Supabase Auth with magic link (email) or WhatsApp OTP.

```javascript
// services/auth.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function signInWithMagicLink(email) {
  return supabase.auth.signInWithOtp({ email });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
```

**RLS Policy** — Admin-only access:

```sql
create policy "Admin access only" on products
  for all using (auth.role() = 'authenticated');
```

---

## Product List View

### Features

- **Virtual scrolling** for large catalogs (if > 100 products)
- **Search**: Supabase full-text search (Arabic)
- **Filters**: Status (draft/active/archived), category, stock
- **Sort**: Name, price, date, stock
- **Quick actions**: Toggle status, delete, edit (inline)

### Table Layout (Mobile-First)

| Viewport           | Layout                                 |
| ------------------ | -------------------------------------- |
| Mobile (< 768px)   | Card list (stacked), swipe for actions |
| Tablet (≥ 768px)   | Compact table with action buttons      |
| Desktop (≥ 1024px) | Full table with inline editing         |

---

## Product Edit Form

### Fields

| Field            | Type        | Validation                      | Required |
| ---------------- | ----------- | ------------------------------- | -------- |
| `name_ar`        | Text        | Min 2 chars                     | ✅       |
| `price`          | Number      | > 0, max 2 decimals             | ✅       |
| `description_ar` | Textarea    | Max 2000 chars                  | ❌       |
| `category_id`    | Select      | Valid category                  | ✅       |
| `images`         | File upload | Max 5, ≤ 5MB each, JPG/PNG/WebP | ❌       |
| `stock_quantity` | Number      | ≥ 0, integer                    | ✅       |
| `status`         | Select      | draft/active/archived           | ✅       |
| `is_featured`    | Toggle      | Boolean                         | ❌       |

### Image Upload Flow

```
User selects file → Client-side resize (max 800px) → Upload to Supabase Storage
                                                    → Update product.images array
```

```javascript
// services/image-upload.js
export async function uploadImage(file, productId) {
  const resized = await resizeImage(file, 800, 800);
  const path = `product-images/${productId}/${Date.now()}.webp`;
  const { error } = await supabase.storage
    .from("products")
    .upload(path, resized);
  if (error) throw error;
  return supabase.storage.from("products").getPublicUrl(path).data.publicUrl;
}
```

---

## Dashboard Summary

| Widget                | Data Source                                 | Update   |
| --------------------- | ------------------------------------------- | -------- |
| Total products        | `products.count()`                          | Realtime |
| Active products       | `products.count().eq('status', 'active')`   | Realtime |
| Out of stock          | `products.count().eq('stock_quantity', 0)`  | Realtime |
| Recent orders (count) | `orders.count().gte('created_at', last24h)` | Realtime |

### Supabase Realtime

```javascript
supabase
  .channel("product-changes")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "products" },
    (payload) => updateDashboardStats(),
  )
  .subscribe();
```

---

## API Endpoints (Admin)

| Method | Path                             | Description     | Auth  |
| ------ | -------------------------------- | --------------- | ----- |
| POST   | `/rest/v1/products`              | Create product  | Admin |
| PATCH  | `/rest/v1/products?id=eq.{id}`   | Update product  | Admin |
| DELETE | `/rest/v1/products?id=eq.{id}`   | Delete product  | Admin |
| POST   | `/rest/v1/categories`            | Create category | Admin |
| PATCH  | `/rest/v1/categories?id=eq.{id}` | Update category | Admin |
| DELETE | `/rest/v1/categories?id=eq.{id}` | Delete category | Admin |
| POST   | `/storage/v1/object/products`    | Upload image    | Admin |

---

## Dependencies

| Dependency             | Source PRD |
| ---------------------- | ---------- |
| Product DB schema      | PRD-001    |
| Design system          | PRD-006    |
| i18n (admin namespace) | PRD-007    |
