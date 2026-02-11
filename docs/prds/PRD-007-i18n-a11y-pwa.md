# PRD-007: Internationalization, Accessibility & PWA

| Field            | Value                  |
| ---------------- | ---------------------- |
| **Author**       | Family Stationary Team |
| **Status**       | Draft                  |
| **Priority**     | P0                     |
| **Created**      | 2026-02-11             |
| **Last Updated** | 2026-02-11             |

---

## 1. Overview

This PRD covers three foundational cross-cutting concerns: **Internationalization (i18n)**, **Accessibility (a11y)**, and **Progressive Web App (PWA)** capabilities. While the platform launches Arabic-only, the i18n framework must be built from day one to avoid costly retrofitting.

### 1.1 Goals

- i18n framework ready for multiple languages, Arabic as default and only Phase 1 language
- WCAG 2.1 AA compliance across all pages
- Full PWA support: installable, offline browsing, push notifications

### 1.2 Non-Goals

- English content translation (Phase 2)
- Native mobile app
- WCAG AAA compliance

---

## 2. Internationalization (i18n)

### 2.1 Architecture

| Aspect              | Decision                                   |
| ------------------- | ------------------------------------------ |
| Framework           | `next-intl`, `react-intl`, or `i18next`    |
| Default locale      | `ar` (Arabic)                              |
| Direction           | `rtl` by default, `ltr` for future locales |
| URL strategy        | `/{locale}/path` (e.g., `/ar/products`)    |
| Translation files   | JSON per locale per namespace              |
| Number formatting   | `Intl.NumberFormat` with locale            |
| Date formatting     | `Intl.DateTimeFormat` with Arabic locale   |
| Currency formatting | `Intl.NumberFormat` with currency option   |

### 2.2 Requirements

| Req ID  | Requirement                                                   | Priority |
| ------- | ------------------------------------------------------------- | -------- |
| I18N-01 | All user-facing strings externalized to translation files     | P0       |
| I18N-02 | No hardcoded Arabic strings in components                     | P0       |
| I18N-03 | RTL/LTR direction switch based on locale                      | P0       |
| I18N-04 | Arabic plural rules handled correctly                         | P0       |
| I18N-05 | Date/time displayed in locale format (e.g., ١١ فبراير ٢٠٢٦)   | P1       |
| I18N-06 | Currency formatting per locale                                | P0       |
| I18N-07 | SEO: `<html lang="ar" dir="rtl">` and hreflang tags           | P0       |
| I18N-08 | Translation file structure: `locales/{lang}/{namespace}.json` | P0       |
| I18N-09 | Fallback chain: requested → default (ar)                      | P0       |

### 2.3 Translation Namespaces

| Namespace  | Content                                 |
| ---------- | --------------------------------------- |
| `common`   | Shared UI (buttons, labels, navigation) |
| `products` | Product catalog, search, filters        |
| `checkout` | Cart, delivery form, order confirmation |
| `errors`   | Error messages, validation              |
| `admin`    | Dashboard, product management           |

---

## 3. Accessibility (a11y)

### 3.1 Standards

- **Target**: WCAG 2.1 Level AA
- **Testing**: axe-core automated tests + manual screen reader testing

### 3.2 Requirements

| Req ID  | Requirement                                                        | Priority |
| ------- | ------------------------------------------------------------------ | -------- |
| A11Y-01 | All images have descriptive `alt` text in Arabic                   | P0       |
| A11Y-02 | Color contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text | P0       |
| A11Y-03 | All interactive elements keyboard-navigable                        | P0       |
| A11Y-04 | Focus indicators visible on all focusable elements                 | P0       |
| A11Y-05 | ARIA landmarks: `<main>`, `<nav>`, `<header>`, `<footer>`          | P0       |
| A11Y-06 | Form inputs have associated `<label>` elements                     | P0       |
| A11Y-07 | Error messages linked to form fields via `aria-describedby`        | P0       |
| A11Y-08 | Skip navigation link ("تخطي إلى المحتوى")                          | P0       |
| A11Y-09 | Screen reader announcements for dynamic content (`aria-live`)      | P0       |
| A11Y-10 | Touch targets minimum 44×44px                                      | P0       |
| A11Y-11 | No content conveyed by color alone                                 | P0       |
| A11Y-12 | Reduced motion support (`prefers-reduced-motion`)                  | P1       |
| A11Y-13 | Page titles descriptive and unique per page                        | P0       |
| A11Y-14 | Heading hierarchy (single `<h1>`, logical `<h2>`–`<h6>`)           | P0       |

### 3.3 Screen Reader Support

| Screen Reader | Platform | Priority |
| ------------- | -------- | -------- |
| TalkBack      | Android  | P0       |
| VoiceOver     | iOS      | P0       |
| NVDA          | Windows  | P1       |

### 3.4 Automated Testing

| Tool                   | Purpose                         |
| ---------------------- | ------------------------------- |
| axe-core               | Automated a11y audit in CI/CD   |
| Lighthouse             | Accessibility score target ≥ 90 |
| eslint-plugin-jsx-a11y | Lint-time a11y checks           |

---

## 4. Progressive Web App (PWA)

### 4.1 PWA Requirements

| Req ID | Requirement                                                | Priority |
| ------ | ---------------------------------------------------------- | -------- |
| PWA-01 | Valid `manifest.json` with Arabic app name and description | P0       |
| PWA-02 | Service worker for offline caching                         | P0       |
| PWA-03 | App installable on Android and iOS                         | P0       |
| PWA-04 | Splash screen with Islamic-themed branding                 | P0       |
| PWA-05 | App icons (192px, 512px) with brand identity               | P0       |
| PWA-06 | Offline product browsing (cached catalog)                  | P0       |
| PWA-07 | Offline cart management (add/remove while offline)         | P1       |
| PWA-08 | Background sync for orders placed while offline            | P1       |
| PWA-09 | Push notifications for order status updates                | P2       |
| PWA-10 | "Add to Home Screen" prompt with Arabic text               | P0       |

### 4.2 Caching Strategy

| Resource                  | Strategy                      | TTL                  |
| ------------------------- | ----------------------------- | -------------------- |
| App shell (HTML, CSS, JS) | Cache-first                   | Until new SW version |
| Product images            | Cache-first                   | 7 days               |
| Product data (API)        | Network-first, fallback cache | 1 hour               |
| Fonts                     | Cache-first                   | 30 days              |
| Static assets             | Cache-first                   | 30 days              |

### 4.3 Manifest Configuration

```json
{
  "name": "قرطاسية العائلة",
  "short_name": "قرطاسية",
  "description": "متجر القرطاسية الإلكتروني",
  "start_url": "/ar",
  "display": "standalone",
  "dir": "rtl",
  "lang": "ar",
  "theme_color": "#1B5E3A",
  "background_color": "#FBF7F0",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 4.4 Offline Experience

| State                   | Behavior                                             |
| ----------------------- | ---------------------------------------------------- |
| Offline — cached page   | Show cached content with "غير متصل" (Offline) banner |
| Offline — uncached page | Show branded offline page with Islamic design        |
| Offline — checkout      | Queue order, sync when online, show pending status   |
| Back online             | Sync queued actions, remove offline banner           |

---

## 5. Performance Targets

| Metric                   | Target |
| ------------------------ | ------ |
| Lighthouse Performance   | ≥ 90   |
| Lighthouse Accessibility | ≥ 90   |
| Lighthouse PWA           | ≥ 90   |
| First Contentful Paint   | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive      | < 3.5s |
| Cumulative Layout Shift  | < 0.1  |

---

## 6. Dependencies

| Dependency                       | PRD                       |
| -------------------------------- | ------------------------- |
| All text content for translation | PRD-001, PRD-003, PRD-005 |
| Design system (colors, contrast) | PRD-006                   |
| Product data for offline caching | PRD-001                   |

---

## 7. Success Metrics

| Metric                         | Target                |
| ------------------------------ | --------------------- |
| Lighthouse Accessibility score | ≥ 90                  |
| PWA install rate               | ≥ 10% of visitors     |
| Offline page views             | Tracked               |
| axe-core violations            | 0 critical, 0 serious |

---

## 8. Open Questions

1. Which i18n library to use? (next-intl, react-intl, i18next?)
2. Timeline for English language support?
3. Should push notifications be for order updates or also for promotions?
4. Do we need Arabic numeral variants (Eastern Arabic: ١٢٣ vs Western: 123)?
