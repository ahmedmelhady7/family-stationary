# Tasks-003: Product Management Dashboard

> Task breakdown for [Plan-003](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/specs/plans/plan-003-dashboard.md) · [PRD-003](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/prds/PRD-003-product-management-dashboard.md)

---

## Phase 1: Admin Auth

### Task 3.1: Create admin login page

- **Files**: `src/pages/admin/login.html`, `src/scripts/pages/admin/login.js`, `src/styles/pages/admin/login.css`
- **Work**: Email input, magic link button, Islamic-themed login card, Supabase Auth integration, redirect to dashboard on auth
- **Depends on**: 6.5, 6.6 (button, form components)
- **Verify**: Enter email → receive magic link → click → authenticated → redirect to dashboard

### Task 3.2: Create auth guard and session management

- **Files**: `src/scripts/services/auth.js`, `src/scripts/utils/auth-guard.js`
- **Work**: `onAuthStateChange` listener, redirect unauthenticated users to login, sign-out function, session token in headers for API calls
- **Depends on**: 3.1
- **Verify**: Unauthenticated access → redirect to login, authenticated → dashboard loads

---

## Phase 2: Dashboard Home

### Task 3.3: Build dashboard summary page

- **Files**: `src/pages/admin/dashboard.html`, `src/scripts/pages/admin/dashboard.js`, `src/styles/pages/admin/dashboard.css`
- **Work**: Stat cards (total products, active, out of stock, recent orders). Supabase Realtime subscription for live updates. Quick-action links
- **Depends on**: 3.2, 1.1 (products table)
- **Verify**: Dashboard loads stats, stats update in realtime when product changes

---

## Phase 3: Product Management

### Task 3.4: Build product list view

- **Files**: `src/pages/admin/products.html`, `src/scripts/pages/admin/products.js`, `src/styles/pages/admin/products.css`
- **Work**: Table/card list (responsive), search bar (Arabic FTS), status filter, category filter, sort options. Pagination. Quick actions: toggle status, delete
- **Depends on**: 3.2, 1.1, 1.3 (FTS)
- **Verify**: Products list loads, search works, filters narrow results, quick actions update status

### Task 3.5: Build product add/edit form

- **Files**: `src/pages/admin/product-edit.html`, `src/scripts/pages/admin/product-edit.js`, `src/styles/pages/admin/product-edit.css`
- **Work**: Form with all fields (name_ar, price, description, category, stock, status, featured). Client-side validation. Image upload (multi-file, drag-and-drop). Create (POST) and update (PATCH) via Supabase
- **Depends on**: 3.2, 6.6, 1.11 (image optimization)
- **Verify**: Create product → appears in list. Edit product → changes saved. Images upload and display

### Task 3.6: Build category management page

- **Files**: `src/pages/admin/categories.html`, `src/scripts/pages/admin/categories.js`
- **Work**: Category list with inline edit. Add new category. Drag to reorder (sort_order). Delete (with confirmation if products exist)
- **Depends on**: 3.2, 1.1
- **Verify**: CRUD categories, reorder works, delete shows warning if products linked

---

## Phase 4: Admin UX Polish

### Task 3.7: Add mobile-optimized admin navigation

- **Files**: `src/scripts/components/admin-nav.js`, `src/styles/components/admin-nav.css`
- **Work**: Sidebar nav (desktop), bottom tab bar (mobile). Active state indicator. Large tap targets (44×44px)
- **Depends on**: 6.10
- **Verify**: Nav responsive: sidebar on desktop, tabs on mobile, large touch targets

### Task 3.8: Add toast notifications

- **Files**: `src/scripts/components/toast.js`, `src/styles/components/toast.css`
- **Work**: Success/error/info toasts with Arabic text. Auto-dismiss 5s. `aria-live="assertive"` for a11y
- **Depends on**: 6.8
- **Verify**: Toasts appear on actions (save, delete, error), auto-dismiss, screen reader announces

---

## Checkpoint: Dashboard Complete

- [ ] Admin login with magic link works
- [ ] Dashboard shows live stats
- [ ] Product CRUD works (list, add, edit, delete)
- [ ] Image upload with drag-and-drop
- [ ] Search and filters work with Arabic text
- [ ] Category CRUD with reorder
- [ ] Mobile-optimized (responsive, large touch targets)
- [ ] RTL layout correct throughout
