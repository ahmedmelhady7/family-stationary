# PRD-003: Product Management Dashboard

| Field            | Value                  |
| ---------------- | ---------------------- |
| **Author**       | Family Stationary Team |
| **Status**       | Draft                  |
| **Priority**     | P0                     |
| **Created**      | 2026-02-11             |
| **Last Updated** | 2026-02-11             |

---

## 1. Overview

The Product Management Dashboard is an internal admin interface that allows founders and authorized team members to manage the product catalog with ease. It provides quick actions for updating products, changing their status (active / inactive / out of stock), editing details, and monitoring the catalog health.

### 1.1 Goals

- Provide a simple, mobile-friendly dashboard for non-technical founders
- Enable one-tap status changes (activate, deactivate, mark out of stock)
- Allow editing of product details that were auto-parsed from links (PRD-002)
- Give a clear overview of the entire product catalog at a glance

### 1.2 Non-Goals

- Advanced analytics or sales reporting (Phase 2)
- Role-based access control (Phase 1 — all authenticated users are admins)
- Bulk operations beyond simple status toggles (Phase 2)

---

## 2. User Stories

| ID    | As a…   | I want to…                                                | So that…                                     |
| ----- | ------- | --------------------------------------------------------- | -------------------------------------------- |
| US-01 | Founder | See all products in a list with their current status      | I have a clear overview of my catalog        |
| US-02 | Founder | Toggle a product between active and inactive with one tap | I can quickly control what customers see     |
| US-03 | Founder | Mark a product as "out of stock"                          | Customers know it's temporarily unavailable  |
| US-04 | Founder | Edit product name, description, price, and images         | I can fix auto-parsed data or update details |
| US-05 | Founder | Add a new product manually (without WhatsApp)             | I have a fallback when link parsing fails    |
| US-06 | Founder | Search and filter products by status and category         | I can find specific products quickly         |
| US-07 | Founder | Access the dashboard from my phone                        | I can manage products on the go              |
| US-08 | Founder | See which products were recently added via WhatsApp       | I can review auto-parsed entries             |

---

## 3. Functional Requirements

### 3.1 Authentication

| Req ID | Requirement                                                    | Priority |
| ------ | -------------------------------------------------------------- | -------- |
| FR-01  | Simple authentication (PIN, magic link, or WhatsApp-based OTP) | P0       |
| FR-02  | Session persistence for 30 days on trusted devices             | P1       |
| FR-03  | All dashboard UI in Arabic                                     | P0       |

### 3.2 Product List View

| Req ID | Requirement                                                            | Priority |
| ------ | ---------------------------------------------------------------------- | -------- |
| FR-04  | Display products in a responsive table/card layout                     | P0       |
| FR-05  | Columns/fields: thumbnail, name, price, category, status, last updated | P0       |
| FR-06  | Status filter tabs: All, Active, Inactive, Out of Stock                | P0       |
| FR-07  | Text search across product names (Arabic)                              | P0       |
| FR-08  | Category filter dropdown                                               | P1       |
| FR-09  | Pagination or infinite scroll                                          | P1       |
| FR-10  | Sort by: newest, price, name, last updated                             | P1       |

### 3.3 Quick Actions

| Req ID | Requirement                                                          | Priority |
| ------ | -------------------------------------------------------------------- | -------- |
| FR-11  | Toggle switch or button to change product status (Active ↔ Inactive) | P0       |
| FR-12  | One-tap "Mark as Out of Stock" action                                | P0       |
| FR-13  | One-tap "Restock" action (Out of Stock → Active)                     | P0       |
| FR-14  | Batch select + status change for multiple products                   | P2       |
| FR-15  | Confirmation dialog for destructive actions (deactivate)             | P0       |

### 3.4 Product Edit Form

| Req ID | Requirement                                                           | Priority |
| ------ | --------------------------------------------------------------------- | -------- |
| FR-16  | Editable fields: name (ar), description (ar), price, category, images | P0       |
| FR-17  | Image upload with drag-and-drop and mobile camera capture             | P0       |
| FR-18  | Image reordering (drag to set primary image)                          | P1       |
| FR-19  | Auto-save or explicit save with success feedback                      | P1       |
| FR-20  | Show original source URL for WhatsApp-ingested products               | P0       |
| FR-21  | Preview how the product will look on the storefront                   | P2       |

### 3.5 Manual Product Addition

| Req ID | Requirement                                                    | Priority |
| ------ | -------------------------------------------------------------- | -------- |
| FR-22  | Form to add a new product with all required fields             | P0       |
| FR-23  | Category selection with option to create a new category inline | P1       |
| FR-24  | Set initial status (default: Active)                           | P0       |

### 3.6 Category Management

| Req ID | Requirement                                  | Priority |
| ------ | -------------------------------------------- | -------- |
| FR-25  | List, create, rename, and reorder categories | P1       |
| FR-26  | Assign or change category icons              | P2       |
| FR-27  | View product count per category              | P1       |

---

## 4. Dashboard Summary (Home)

| Req ID | Requirement                                                                        | Priority |
| ------ | ---------------------------------------------------------------------------------- | -------- |
| FR-28  | Total products count                                                               | P0       |
| FR-29  | Breakdown by status (Active / Inactive / Out of Stock)                             | P0       |
| FR-30  | Recently added products (last 7 days)                                              | P1       |
| FR-31  | Products added via WhatsApp needing review (flagged if parsing confidence was low) | P1       |

---

## 5. API Endpoints

| Endpoint                           | Method | Description                                      |
| ---------------------------------- | ------ | ------------------------------------------------ |
| `/api/admin/products`              | GET    | List products (with filters, search, pagination) |
| `/api/admin/products/:id`          | GET    | Get product details                              |
| `/api/admin/products`              | POST   | Create a new product                             |
| `/api/admin/products/:id`          | PUT    | Update product                                   |
| `/api/admin/products/:id/status`   | PATCH  | Change product status                            |
| `/api/admin/products/batch-status` | PATCH  | Batch status change                              |
| `/api/admin/categories`            | GET    | List categories                                  |
| `/api/admin/categories`            | POST   | Create category                                  |
| `/api/admin/categories/:id`        | PUT    | Update category                                  |
| `/api/admin/upload`                | POST   | Upload product images                            |

---

## 6. Non-Functional Requirements

| Req ID | Requirement                           | Target            |
| ------ | ------------------------------------- | ----------------- |
| NFR-01 | Dashboard loads in                    | < 3 seconds on 4G |
| NFR-02 | Fully functional on mobile browsers   | Required          |
| NFR-03 | All UI text in Arabic with RTL layout | Required          |
| NFR-04 | Status updates reflect on storefront  | < 5 seconds       |
| NFR-05 | Support image uploads up to 5MB each  | Required          |

---

## 7. UX Considerations

- Dashboard should feel like a mobile app. Use large tap targets and clear Arabic labels
- Status toggles should use traffic-light colors: 🟢 Active, 🟡 Out of Stock, 🔴 Inactive
- Swipe gestures on mobile for quick actions (swipe left to deactivate, swipe right to restock)
- Toast notifications in Arabic for all actions ("✅ تم تحديث المنتج")

---

## 8. Dependencies

| Dependency                       | PRD     |
| -------------------------------- | ------- |
| Product data model               | PRD-001 |
| Products auto-added via WhatsApp | PRD-002 |
| Design system                    | PRD-006 |

---

## 9. Success Metrics

| Metric                                            | Target               |
| ------------------------------------------------- | -------------------- |
| Time to change product status                     | < 5 seconds (2 taps) |
| Founder adoption of dashboard vs. asking for help | 100% self-service    |
| Products with corrected auto-parsed data          | Tracked monthly      |

---

## 10. Open Questions

1. Should we implement a mobile app or is a responsive web dashboard sufficient?
2. Do we need audit logs for product changes (who changed what, when)?
3. Should the dashboard be accessible from the same domain or a separate admin subdomain?
