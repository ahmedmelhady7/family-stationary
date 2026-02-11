# PRD-001: Product Catalog & Storefront

| Field            | Value                  |
| ---------------- | ---------------------- |
| **Author**       | Family Stationary Team |
| **Status**       | Draft                  |
| **Priority**     | P0                     |
| **Created**      | 2026-02-11             |
| **Last Updated** | 2026-02-11             |

---

## 1. Overview

The Product Catalog & Storefront is the customer-facing heart of the Family Stationary e-commerce platform. It displays all available products, allows customers to browse by category, search, and view detailed product pages — all rendered in Arabic with an Islamic-inspired visual design.

### 1.1 Goals

- Provide a fast, visually appealing storefront for browsing stationary products
- Support RTL layout natively as the default (Arabic-first)
- Deliver a responsive experience that works seamlessly on mobile and desktop
- Products added via the WhatsApp ingestion pipeline (PRD-002) appear automatically

### 1.2 Non-Goals

- User account management or login (Phase 1 — guest checkout only)
- Wishlist or saved items
- Product reviews or ratings
- Multi-currency support

---

## 2. User Stories

| ID    | As a…    | I want to…                                                        | So that…                                      |
| ----- | -------- | ----------------------------------------------------------------- | --------------------------------------------- |
| US-01 | Customer | Browse all available products on the homepage                     | I can discover what the stationary offers     |
| US-02 | Customer | Filter products by category (pens, notebooks, art supplies, etc.) | I can find specific types of products quickly |
| US-03 | Customer | Search for products by name or keyword (Arabic)                   | I can locate a specific item                  |
| US-04 | Customer | View a detailed product page with images, price, and description  | I can decide whether to purchase              |
| US-05 | Customer | See which products are in stock vs. out of stock                  | I don't attempt to order unavailable items    |
| US-06 | Customer | View the storefront beautifully on my phone                       | I can shop on the go                          |

---

## 3. Functional Requirements

### 3.1 Homepage

| Req ID | Requirement                                                               | Priority |
| ------ | ------------------------------------------------------------------------- | -------- |
| FR-01  | Display a hero banner with Islamic-themed branding and current promotions | P0       |
| FR-02  | Show a grid of featured / recently added products                         | P0       |
| FR-03  | Include category navigation (sidebar on desktop, collapsible on mobile)   | P0       |
| FR-04  | Support infinite scroll or paginated product listings                     | P1       |

### 3.2 Product Listing Page

| Req ID | Requirement                                                           | Priority |
| ------ | --------------------------------------------------------------------- | -------- |
| FR-05  | Display products in a responsive grid (cards with image, name, price) | P0       |
| FR-06  | Filter by category, price range, and availability                     | P0       |
| FR-07  | Sort by price (ascending/descending), newest, and name                | P1       |
| FR-08  | Show "out of stock" badge on unavailable products                     | P0       |
| FR-09  | Real-time search with Arabic text support and debounced input         | P0       |

### 3.3 Product Detail Page

| Req ID | Requirement                                                          | Priority |
| ------ | -------------------------------------------------------------------- | -------- |
| FR-10  | Display product name, description, price, and availability in Arabic | P0       |
| FR-11  | Image gallery with zoom capability                                   | P1       |
| FR-12  | "Add to Cart" button (disabled if out of stock)                      | P0       |
| FR-13  | Related products section                                             | P2       |
| FR-14  | Share product via WhatsApp link                                      | P1       |

### 3.4 Shopping Cart

| Req ID | Requirement                                                           | Priority |
| ------ | --------------------------------------------------------------------- | -------- |
| FR-15  | Persistent cart (localStorage for guests, synced if PWA is installed) | P0       |
| FR-16  | Adjust quantity, remove items                                         | P0       |
| FR-17  | Display subtotal and total in local currency                          | P0       |
| FR-18  | "Proceed to Checkout" button leading to the COD checkout (PRD-005)    | P0       |

---

## 4. Data Model

### 4.1 Product

| Field            | Type              | Description                                      |
| ---------------- | ----------------- | ------------------------------------------------ |
| `id`             | UUID              | Unique product identifier                        |
| `name_ar`        | String            | Product name in Arabic                           |
| `name_en`        | String (nullable) | Product name in English (future i18n)            |
| `description_ar` | Text              | Product description in Arabic                    |
| `description_en` | Text (nullable)   | Product description in English (future)          |
| `price`          | Decimal           | Product price                                    |
| `currency`       | String            | Currency code (default: SAR/EGP based on region) |
| `images`         | Array\<URL\>      | Product image URLs                               |
| `category_id`    | UUID (FK)         | Reference to category                            |
| `status`         | Enum              | `active`, `inactive`, `out_of_stock`             |
| `source_url`     | String (nullable) | Original URL the product was parsed from         |
| `created_at`     | Timestamp         | When the product was added                       |
| `updated_at`     | Timestamp         | Last modification time                           |

### 4.2 Category

| Field        | Type              | Description                       |
| ------------ | ----------------- | --------------------------------- |
| `id`         | UUID              | Unique category identifier        |
| `name_ar`    | String            | Category name in Arabic           |
| `name_en`    | String (nullable) | Category name in English (future) |
| `slug`       | String            | URL-friendly identifier           |
| `icon`       | String (nullable) | Icon identifier or URL            |
| `sort_order` | Integer           | Display order                     |

---

## 5. Non-Functional Requirements

| Req ID | Requirement                                   | Target              |
| ------ | --------------------------------------------- | ------------------- |
| NFR-01 | Page load time (LCP)                          | < 2.5 seconds on 3G |
| NFR-02 | Product images optimized (WebP, lazy-loaded)  | All images          |
| NFR-03 | SEO-friendly URLs with Arabic slugs           | All pages           |
| NFR-04 | PWA installable with offline product browsing | See PRD-007         |
| NFR-05 | WCAG 2.1 AA compliance                        | All pages           |

---

## 6. Dependencies

| Dependency                                | PRD     |
| ----------------------------------------- | ------- |
| Products populated via WhatsApp ingestion | PRD-002 |
| Product status management                 | PRD-003 |
| Checkout flow                             | PRD-005 |
| Islamic theme / Arabic design system      | PRD-006 |
| i18n framework, a11y, PWA                 | PRD-007 |

---

## 7. Success Metrics

| Metric                              | Target |
| ----------------------------------- | ------ |
| Product page views per session      | ≥ 3    |
| Cart abandonment rate               | < 60%  |
| Mobile usability score (Lighthouse) | ≥ 90   |
| Search-to-cart conversion           | ≥ 5%   |

---

## 8. Open Questions

1. What currency will be used — SAR, EGP, or configurable?
2. Should we support multiple images per product from day one?
3. What are the initial product categories?
