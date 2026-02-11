# Tasks-001: Product Catalog & Storefront

> Task breakdown for [Plan-001](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/specs/plans/plan-001-catalog.md) · [PRD-001](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/prds/PRD-001-product-catalog-storefront.md)

---

## Phase 1: Database & API

### Task 1.1: Create products and categories tables

- **Files**: `supabase/migrations/001_products.sql`
- **Work**: Create `products` table (name_ar, price, images, status, stock, slug, fts), `categories` table (name_ar, slug, sort_order), auto-updated `updated_at` trigger
- **Depends on**: None (database foundation)
- **Verify**: Tables created, insert sample product successfully

### Task 1.2: Set up RLS policies for public read access

- **Files**: `supabase/migrations/002_rls_products.sql`
- **Work**: Enable RLS on `products` and `categories`. Anon read for active products. Authenticated write for admin
- **Depends on**: 1.1
- **Verify**: Anon key can read active products, cannot insert/update/delete

### Task 1.3: Add full-text search index (Arabic)

- **Files**: `supabase/migrations/003_fts.sql`
- **Work**: Generated `fts` column with `to_tsvector('arabic', ...)`, GIN index
- **Depends on**: 1.1
- **Verify**: Search query returns correct products for Arabic terms

### Task 1.4: Seed sample data

- **Files**: `supabase/seed.sql`
- **Work**: 3 categories (أقلام, دفاتر, أدوات مدرسية), 10+ products with Arabic names, prices in EGP, sample images
- **Depends on**: 1.1
- **Verify**: Seed runs, products visible via Supabase client

---

## Phase 2: Storefront Pages

### Task 1.5: Build homepage

- **Files**: `src/pages/index.html`, `src/scripts/pages/home.js`, `src/styles/pages/home.css`
- **Work**: Hero banner (Islamic-themed), category grid, featured products section. Fetch data from Supabase
- **Depends on**: 1.4, 6.5–6.12 (design system components)
- **Verify**: Homepage loads, shows categories and featured products, RTL layout correct

### Task 1.6: Build product listing page

- **Files**: `src/pages/products.html`, `src/scripts/pages/products.js`, `src/styles/pages/products.css`
- **Work**: Product grid, category filter sidebar, search bar, pagination. URL params for filters (`?category=...&q=...&page=1`)
- **Depends on**: 1.3, 1.4, 6.7, 6.12
- **Verify**: Products display in grid, filters work, search returns results, pagination navigates

### Task 1.7: Build product detail page (PDP)

- **Files**: `src/pages/product.html`, `src/scripts/pages/product.js`, `src/styles/pages/product.css`
- **Work**: Image gallery (arch-framed, swipeable), product info (name, price, description, stock), add-to-cart button, related products
- **Depends on**: 1.4, 6.5, 6.7
- **Verify**: PDP loads with correct product, images swipe, add-to-cart works

---

## Phase 3: Cart

### Task 1.8: Implement cart service

- **Files**: `src/scripts/services/cart.js`
- **Work**: `getCart()`, `addToCart()`, `removeFromCart()`, `updateQuantity()`, `getCartCount()`, `clearCart()`. localStorage persistence. Custom event for cart changes
- **Depends on**: None (standalone module)
- **Verify**: Add/remove/update items, cart persists across refresh, count updates

### Task 1.9: Build cart badge component

- **Files**: `src/scripts/components/cart-badge.js`, `src/styles/components/cart-badge.css`
- **Work**: Gold badge on cart icon showing item count, `aria-live="polite"`, updates reactively via custom event
- **Depends on**: 1.8, 6.10 (navbar)
- **Verify**: Badge shows count, updates when cart changes, screen reader announces

### Task 1.10: Build cart review page

- **Files**: `src/pages/cart.html`, `src/scripts/pages/cart.js`, `src/styles/pages/cart.css`
- **Work**: List cart items with image, name, quantity selector, price, subtotal. Total. Empty cart state (lantern). "Proceed to Checkout" CTA
- **Depends on**: 1.8, 6.5, 6.7, 6.14
- **Verify**: Cart displays items, quantity editable, totals correct, empty state shows lantern

---

## Phase 4: Image Optimization

### Task 1.11: Create image optimization pipeline

- **Files**: `supabase/functions/optimize-image/index.ts`
- **Work**: On upload to `product-images/`, auto-resize to 400×400 (thumb) and 800×800 (detail), convert to WebP
- **Depends on**: 1.1
- **Verify**: Upload image → thumbnails generated in storage

---

## Checkpoint: Storefront Complete

- [ ] Homepage loads with categories and featured products
- [ ] Product listing shows grid, filters, search, pagination
- [ ] PDP shows full product details with image gallery
- [ ] Cart persists, badge updates, review page works
- [ ] Arabic text renders correctly (RTL, proper line height)
- [ ] Responsive at all breakpoints
- [ ] Lighthouse Performance ≥ 90
