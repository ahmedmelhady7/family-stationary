# Plan-007: Internationalization, Accessibility & PWA

> Technical implementation plan for [PRD-007](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/prds/PRD-007-i18n-a11y-pwa.md)

---

## i18n Architecture

### Library Choice: `i18next` + `i18next-http-backend`

**Rationale**: Framework-agnostic (works with vanilla JS), excellent Arabic plural rule support, namespace-based file splitting, well-maintained.

### Integration

```javascript
// scripts/i18n.js
import i18next from "i18next";
import HttpBackend from "i18next-http-backend";

await i18next.use(HttpBackend).init({
  lng: "ar",
  fallbackLng: "ar",
  ns: ["common", "products", "checkout", "errors", "admin"],
  defaultNS: "common",
  backend: {
    loadPath: "/locales/{{lng}}/{{ns}}.json",
  },
  interpolation: { escapeValue: false },
});

// Usage in components
document.querySelectorAll("[data-i18n]").forEach((el) => {
  el.textContent = i18next.t(el.dataset.i18n);
});
```

### Translation File Structure

```
src/locales/
└── ar/
    ├── common.json       # Shared UI (nav, buttons, labels)
    ├── products.json     # Catalog, search, filters
    ├── checkout.json     # Cart, form, confirmation
    ├── errors.json       # Validation, API errors
    └── admin.json        # Dashboard strings
```

### Number & Currency Formatting

```javascript
// utils/format.js
export function formatPrice(amount) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date) {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}
```

---

## Accessibility Implementation

### Automated Testing Pipeline

```bash
# CI: axe-core via Playwright
npx playwright test --project=a11y

# Local: Lighthouse CLI
npx lighthouse http://localhost:3000 --only-categories=accessibility
```

### Key ARIA Patterns

| Component    | ARIA Pattern                                         |
| ------------ | ---------------------------------------------------- |
| Product card | `role="article"`, `aria-label` with product name     |
| Cart badge   | `aria-live="polite"`, `aria-label="X items in cart"` |
| Search       | `role="search"`, `aria-expanded` for results         |
| Modal        | `role="dialog"`, `aria-modal="true"`, focus trap     |
| Toast        | `role="alert"`, `aria-live="assertive"`              |
| Navigation   | `role="navigation"`, `aria-label`                    |
| Skip link    | Visible on focus, links to `<main>`                  |

### Focus Management

```javascript
// utils/focus-trap.js
export function createFocusTrap(container) {
  /* ... */
}
export function releaseFocusTrap() {
  /* ... */
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## PWA Implementation

### Service Worker (Workbox)

```javascript
// workers/sw.js
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);

// Product images: cache-first, 7-day expiry
registerRoute(
  ({ url }) => url.pathname.startsWith("/storage/"),
  new CacheFirst({
    cacheName: "product-images",
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 7 * 24 * 60 * 60 })],
  }),
);

// API data: network-first, 1-hour cache fallback
registerRoute(
  ({ url }) => url.pathname.startsWith("/rest/"),
  new NetworkFirst({
    cacheName: "api-data",
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 60 * 60 })],
  }),
);

// Fonts: cache-first, 30-day expiry
registerRoute(
  ({ url }) => url.origin === "https://fonts.gstatic.com",
  new CacheFirst({
    cacheName: "google-fonts",
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 30 * 24 * 60 * 60 })],
  }),
);
```

### Offline Page

```html
<!-- pages/offline.html — Islamic-themed branded offline page -->
<main class="offline-page">
  <img src="/assets/icons/lantern.svg" alt="فانوس" class="offline-icon" />
  <h1 data-i18n="common.offline_title">أنت غير متصل بالإنترنت</h1>
  <p data-i18n="common.offline_message">سيتم إعادة الاتصال تلقائياً</p>
</main>
```

### Manifest

Already defined in PRD-007. Will live at `/manifest.json` with Arabic app name, RTL direction, emerald theme color, and ivory background.

### Install Prompt

```javascript
// scripts/pwa.js
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallBanner(); // Show Arabic "أضف إلى الشاشة الرئيسية" banner
});
```

---

## Dependencies

| Dependency                       | Source PRD                |
| -------------------------------- | ------------------------- |
| Design tokens (colors, fonts)    | PRD-006                   |
| All page content for translation | PRD-001, PRD-003, PRD-005 |
| Product data for offline caching | PRD-001                   |
