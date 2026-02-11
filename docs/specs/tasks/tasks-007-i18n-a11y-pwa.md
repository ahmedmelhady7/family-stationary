# Tasks-007: Internationalization, Accessibility & PWA

> Task breakdown for [Plan-007](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/specs/plans/plan-007-i18n-a11y-pwa.md) · [PRD-007](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/prds/PRD-007-i18n-a11y-pwa.md)

---

## Phase 1: i18n Foundation

### Task 7.1: Install and configure i18next

- **Files**: `package.json`, `src/scripts/i18n.js`
- **Work**: Install `i18next` + `i18next-http-backend`. Initialize with `lng: 'ar'`, namespace config, backend loadPath
- **Depends on**: None
- **Verify**: `i18next.t('common.test')` returns Arabic string

### Task 7.2: Create translation files (common namespace)

- **Files**: `src/locales/ar/common.json`
- **Work**: All shared UI strings — nav items, button labels, footer text, bismillah, pagination, loading, offline banner
- **Depends on**: 7.1
- **Verify**: All common UI elements render from translation keys

### Task 7.3: Create translation files (domain namespaces) [P]

- **Files**: `src/locales/ar/products.json`, `src/locales/ar/checkout.json`, `src/locales/ar/errors.json`, `src/locales/ar/admin.json`
- **Work**: All domain-specific strings per PRD requirements
- **Depends on**: 7.1
- **Verify**: Keys exist for all user-facing strings across all pages

### Task 7.4: Create i18n DOM binding utility

- **Files**: `src/scripts/i18n.js` (extend)
- **Work**: Auto-translate `data-i18n` attributes on page load. Support `data-i18n-placeholder`, `data-i18n-aria-label` for attribute translations
- **Depends on**: 7.1
- **Verify**: DOM elements with `data-i18n` attributes show Arabic text

### Task 7.5: Create number/currency/date formatters

- **Files**: `src/scripts/utils/format.js`
- **Work**: `formatPrice(amount)` → EGP, `formatDate(date)` → Arabic date, `formatNumber(n)` → Arabic locale
- **Depends on**: None
- **Verify**: Prices show "١٫٥٠ ج.م." format or "1.50 ج.م" (per decision on numeral variant)

---

## Phase 2: Accessibility

### Task 7.6: Add skip navigation link

- **Files**: All page templates
- **Work**: Hidden link "تخطي إلى المحتوى", visible on focus, links to `<main id="main-content">`
- **Depends on**: 6.10 (navbar)
- **Verify**: Tab to skip link, press Enter → focus moves to main

### Task 7.7: Add ARIA landmarks to all pages [P]

- **Files**: All page templates
- **Work**: `<header>`, `<nav aria-label>`, `<main>`, `<footer>`, `role="search"` on search form
- **Depends on**: 6.10, 6.11
- **Verify**: Screen reader can navigate by landmarks

### Task 7.8: Implement focus management utilities

- **Files**: `src/scripts/utils/focus-trap.js`, `src/scripts/utils/focus-ring.js`
- **Work**: Focus trap for modals/dialogs, visible focus indicators on all focusable elements, restore focus on modal close
- **Depends on**: 6.9 (modal)
- **Verify**: Tab trapped inside modal, focus ring visible, focus restored on close

### Task 7.9: Add `aria-live` regions for dynamic content [P]

- **Files**: All pages with dynamic content
- **Work**: Cart badge (`aria-live="polite"`), form errors (`aria-live="assertive"`), toast notifications (`role="alert"`)
- **Depends on**: 7.6, 7.7
- **Verify**: Screen reader announces cart count changes and form errors

### Task 7.10: Set up automated a11y testing

- **Files**: `tests/a11y/`, `playwright.config.js`
- **Work**: axe-core integration with Playwright, test all pages, configure CI to fail on critical/serious violations
- **Depends on**: 7.6, 7.7
- **Verify**: `npm run test:a11y` passes with 0 critical/serious violations

---

## Phase 3: PWA

### Task 7.11: Create manifest.json

- **Files**: `public/manifest.json`, app icons
- **Work**: Arabic app name, RTL direction, emerald theme, ivory background, icon sizes (192, 512)
- **Depends on**: 6.13 (Islamic patterns for splash)
- **Verify**: Lighthouse PWA audit passes installable check

### Task 7.12: Implement service worker with Workbox

- **Files**: `src/workers/sw.js`, `vite.config.js` (Workbox plugin)
- **Work**: Precache app shell, cache-first for images/fonts, network-first for API data, offline fallback page
- **Depends on**: 7.11
- **Verify**: App works offline (cached pages), shows offline page for uncached

### Task 7.13: Create offline page

- **Files**: `src/pages/offline.html`
- **Work**: Islamic-themed branded page with lantern illustration, "أنت غير متصل" message, auto-retry
- **Depends on**: 6.1, 6.14 (lantern SVG)
- **Verify**: Offline page shows when navigating to uncached URL while offline

### Task 7.14: Implement install prompt

- **Files**: `src/scripts/pwa.js`
- **Work**: Capture `beforeinstallprompt`, show Arabic install banner "أضف إلى الشاشة الرئيسية", track install events
- **Depends on**: 7.11, 7.12
- **Verify**: Install banner appears on eligible devices, app installs correctly

---

## Checkpoint: i18n + a11y + PWA Complete

- [ ] All user-facing strings from translation keys (no hardcoded Arabic)
- [ ] Lighthouse Accessibility score ≥ 90
- [ ] Lighthouse PWA score ≥ 90
- [ ] axe-core: 0 critical, 0 serious violations
- [ ] App installable on Android/iOS
- [ ] Offline browsing works for cached content
- [ ] Skip link functional
- [ ] All forms have associated labels
