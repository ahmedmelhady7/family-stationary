# Plan-001: Product Catalog & Storefront

> Technical implementation plan for [PRD-001](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/prds/PRD-001-product-catalog-storefront.md)

---

## Architecture

### Page Structure

```
src/pages/
├── index.html              # Homepage (hero + featured + categories)
├── products.html           # Product listing (grid, filters, search)
└── product.html            # Product detail page (PDP)
```

### Component Tree

```
Homepage
├── Navbar
├── HeroBanner (Islamic-themed, rotating featured products)
├── CategoryGrid (card grid linking to filtered listing)
├── FeaturedProducts (product card carousel)
├── Footer (bismillah, links, contact)

Product Listing
├── Navbar
├── Breadcrumb
├── FilterSidebar (categories, price range)
├── SearchBar (Arabic-aware search)
├── ProductGrid (responsive card grid)
├── Pagination
└── Footer

Product Detail
├── Navbar
├── Breadcrumb
├── ProductGallery (arch-framed images, swipe)
├── ProductInfo (name, price, description, stock)
├── AddToCartButton
├── RelatedProducts
└── Footer
```

---

## Data Layer

### Supabase Tables

```sql
-- products table
create table products (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  slug text unique not null,
  description_ar text,
  price decimal(10,2) not null,
  currency text default 'EGP',
  images text[] default '{}',
  category_id uuid references categories(id),
  status text default 'draft' check (status in ('draft', 'active', 'archived')),
  stock_quantity integer default 0,
  is_featured boolean default false,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- categories table
create table categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  slug text unique not null,
  icon text,
  sort_order integer default 0,
  created_at timestamptz default now()
);
```

### API Endpoints

| Method | Path                                    | Description            | RLS         |
| ------ | --------------------------------------- | ---------------------- | ----------- |
| GET    | `/rest/v1/products?status=eq.active`    | List active products   | Public read |
| GET    | `/rest/v1/products?slug=eq.{slug}`      | Single product by slug | Public read |
| GET    | `/rest/v1/products?is_featured=eq.true` | Featured products      | Public read |
| GET    | `/rest/v1/categories?order=sort_order`  | All categories         | Public read |
| GET    | `/rest/v1/products?category_id=eq.{id}` | Products by category   | Public read |

> All product reads are public (anon key + RLS policy). Writes are admin-only (PRD-003).

---

## Search Implementation

**Phase 1**: Supabase full-text search with Arabic configuration.

```sql
-- Enable Arabic text search
alter table products add column fts tsvector
  generated always as (
    to_tsvector('arabic', coalesce(name_ar, '') || ' ' || coalesce(description_ar, ''))
  ) stored;

create index products_fts_idx on products using gin(fts);
```

**Query**: `products?fts=fts.@.{query}` via Supabase client.

---

## Cart State Management

- **Storage**: `localStorage` (JSON array of `{productId, quantity}`)
- **Sync**: Cart badge count updates reactively
- **Max items**: 50 (configurable via `MAX_CART_ITEMS`)
- **Persistence**: Survives page refresh, no login required (guest checkout)

```javascript
// services/cart.js
const CART_KEY = "family-stationary-cart";

export function getCart() {
  /* ... */
}
export function addToCart(productId, quantity = 1) {
  /* ... */
}
export function removeFromCart(productId) {
  /* ... */
}
export function updateQuantity(productId, quantity) {
  /* ... */
}
export function getCartCount() {
  /* ... */
}
export function clearCart() {
  /* ... */
}
```

---

## Image Optimization

| Source                                     | Processing             | Output                            | Storage                             |
| ------------------------------------------ | ---------------------- | --------------------------------- | ----------------------------------- |
| Product images (WhatsApp/Dashboard upload) | Resize, compress, WebP | 400×400 (thumb), 800×800 (detail) | Supabase Storage `/product-images/` |

Use Supabase image transformation (built-in) or a simple Edge Function for resize on upload.

---

## Dependencies

| Dependency                           | Source PRD |
| ------------------------------------ | ---------- |
| Design tokens, components            | PRD-006    |
| i18n strings, a11y, PWA offline      | PRD-007    |
| Product data (ingested via WhatsApp) | PRD-002    |
