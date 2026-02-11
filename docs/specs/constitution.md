# Family Stationary — Project Constitution

> Governing principles, tech stack, commands, code style, git workflow, and boundaries for all development work.

---

## 1. Project Identity

| Attribute         | Value                                                         |
| ----------------- | ------------------------------------------------------------- |
| **Name**          | قرطاسية العائلة (Family Stationary)                           |
| **Mission**       | Arabic-first Islamic e-commerce for stationary products       |
| **Target Market** | Egypt (EGP)                                                   |
| **Primary Users** | Egyptian families shopping for stationary and school supplies |
| **Admin Users**   | Founders (product management via WhatsApp + dashboard)        |
| **Design DNA**    | Islamic art, Arabic-first, RTL-default, warm earth tones      |

---

## 2. Tech Stack

### Frontend

| Layer     | Choice                                         | Rationale                                  |
| --------- | ---------------------------------------------- | ------------------------------------------ |
| **Core**  | Vanilla HTML, CSS, JavaScript                  | Maximum control, minimal bundle size       |
| **i18n**  | Package TBD (`i18next` recommended)            | Complex plural rules, namespace management |
| **a11y**  | `axe-core` (testing), manual ARIA              | WCAG 2.1 AA compliance                     |
| **PWA**   | Workbox (service worker toolkit)               | Offline caching, background sync           |
| **Fonts** | Google Fonts (Amiri, Noto Naskh Arabic, Cairo) | Arabic-optimized typography                |
| **Build** | Vite (dev server + bundler only)               | Fast HMR, minimal config                   |

### Backend

| Layer            | Choice                         | Rationale                            |
| ---------------- | ------------------------------ | ------------------------------------ |
| **Database**     | Supabase (self-hosted, Docker) | Postgres + Auth + Storage + Realtime |
| **API**          | Supabase Edge Functions / REST | Serverless, colocated with DB        |
| **WhatsApp**     | Meta Cloud API (direct)        | $0/mo Phase 1, no BSP middleman      |
| **File Storage** | Supabase Storage               | Product images, attachments          |
| **Auth**         | Supabase Auth                  | Admin dashboard authentication       |

### Infrastructure

| Environment    | Choice                              | Rationale                             |
| -------------- | ----------------------------------- | ------------------------------------- |
| **Alpha/Beta** | Netlify                             | Free tier, easy preview deploys       |
| **Production** | Hetzner bare metal + Docker Compose | Full control, cost-effective at scale |
| **Containers** | Docker Compose                      | All services containerized            |
| **CI/CD**      | GitHub Actions                      | Standard, free for public repos       |

---

## 3. Commands

```bash
# Development
npm run dev             # Start Vite dev server (port 3000)
npm run dev:supabase    # Start self-hosted Supabase (Docker)
npm run dev:all         # Start everything

# Build & Deploy
npm run build           # Production build
npm run preview         # Preview production build locally
npm run deploy:staging  # Deploy to Netlify (staging)
npm run deploy:prod     # Deploy to Hetzner (production)

# Testing
npm run test            # Run unit tests
npm run test:e2e        # Run end-to-end tests
npm run test:a11y       # Run axe-core accessibility audit
npm run lint            # ESLint + Stylelint
npm run lint:fix        # Auto-fix lint issues

# Database
npm run db:migrate      # Run Supabase migrations
npm run db:seed         # Seed sample data
npm run db:reset        # Reset database (dev only)

# Docker
docker compose up -d           # Start all services
docker compose down            # Stop all services
docker compose logs -f         # Follow logs
```

---

## 4. Project Structure

```
family-stationary/
├── docs/
│   ├── prds/                    # Product requirements (Phase 1: Specify)
│   ├── specs/                   # Technical specs (Phases 2-3)
│   │   ├── constitution.md      # This file
│   │   ├── plans/               # Technical implementation plans
│   │   └── tasks/               # Task breakdowns
│   └── research/                # Research documents
├── src/
│   ├── pages/                   # HTML pages
│   ├── components/              # Reusable UI components
│   ├── styles/                  # CSS (design system + page styles)
│   │   ├── tokens.css           # Design tokens (colors, spacing, fonts)
│   │   ├── base.css             # Reset + base styles
│   │   ├── components/          # Component-specific styles
│   │   └── pages/               # Page-specific styles
│   ├── scripts/                 # JavaScript modules
│   │   ├── utils/               # Shared utilities
│   │   ├── services/            # API service modules
│   │   └── components/          # Component JS logic
│   ├── locales/                 # Translation files
│   │   └── ar/                  # Arabic translations
│   │       ├── common.json
│   │       ├── products.json
│   │       ├── checkout.json
│   │       └── errors.json
│   ├── assets/                  # Static assets
│   │   ├── icons/               # App + UI icons
│   │   ├── patterns/            # Islamic geometric patterns
│   │   └── fonts/               # Self-hosted fonts (fallback)
│   └── workers/                 # Service worker (PWA)
├── supabase/
│   ├── migrations/              # Database migrations
│   ├── functions/               # Edge Functions (API)
│   ├── seed.sql                 # Sample data
│   └── config.toml              # Supabase config
├── docker/
│   ├── docker-compose.yml       # Full stack compose
│   ├── docker-compose.dev.yml   # Dev overrides
│   └── nginx/                   # Reverse proxy config
├── tests/
│   ├── unit/                    # Unit tests
│   ├── e2e/                     # End-to-end tests
│   └── a11y/                    # Accessibility tests
├── .github/
│   └── workflows/               # CI/CD pipelines
├── package.json
├── vite.config.js
└── README.md
```

---

## 5. Code Style

### General

- **Language**: ES2022+ (modern JavaScript, no TypeScript in Phase 1)
- **Modules**: ES Modules (`import`/`export`)
- **Formatting**: Prettier (2-space indent, single quotes, trailing commas)
- **Linting**: ESLint (flat config)

### Naming Conventions

| Entity           | Convention         | Example                    |
| ---------------- | ------------------ | -------------------------- |
| Files            | `kebab-case`       | `product-card.js`          |
| CSS classes      | `kebab-case`       | `.product-card__title`     |
| CSS tokens       | `--prefix-name`    | `--color-primary`          |
| JS variables     | `camelCase`        | `productList`              |
| JS constants     | `UPPER_SNAKE_CASE` | `MAX_CART_ITEMS`           |
| JS functions     | `camelCase`        | `fetchProducts()`          |
| DB tables        | `snake_case`       | `order_items`              |
| DB columns       | `snake_case`       | `created_at`               |
| API endpoints    | `kebab-case`       | `/api/order-items`         |
| Translation keys | `dot.separated`    | `checkout.form.name_label` |

### Arabic String Rules

- **Never** hardcode Arabic strings in JS/HTML — always use translation keys
- **Never** add `letter-spacing` to Arabic text (breaks ligatures)
- **Always** use `text-align: right` as default (RTL)
- **Always** use CSS logical properties (`margin-inline-start`, `padding-inline-end`)
- **Always** use Western Arabic numerals for prices (123 not ١٢٣)
- **Always** set `line-height: 1.5–1.7` for Arabic body text

### Component Pattern

```html
<!-- component: product-card -->
<article class="product-card" data-component="product-card">
  <div class="product-card__image">...</div>
  <div class="product-card__body">
    <h3 class="product-card__title" data-i18n="products.item_name">...</h3>
    <span class="product-card__price">...</span>
  </div>
</article>
```

```css
/* styles/components/product-card.css */
.product-card {
  /* block */
}
.product-card__image {
  /* element */
}
.product-card__title {
  /* element */
}
.product-card--featured {
  /* modifier */
}
```

```javascript
// scripts/components/product-card.js
export function initProductCard(element) {
  /* ... */
}
```

---

## 6. Git Workflow

### Branch Naming

```
main                    # Production-ready code
develop                 # Integration branch
feature/PRD-XXX-name    # Feature branches (e.g., feature/PRD-001-catalog)
fix/issue-description   # Bug fixes
docs/description        # Documentation only
```

### Commit Format

```
type(scope): description

# Types: feat, fix, docs, style, refactor, test, chore
# Scope: prd-001, prd-002, ..., infra, deps, ci

# Examples:
feat(prd-001): add product listing page with grid layout
fix(prd-005): validate WhatsApp number before form submit
docs(specs): add technical plan for checkout flow
chore(deps): update supabase client to v2.x
```

### PR Requirements

- [ ] Descriptive title matching commit format
- [ ] Description references PRD requirement IDs
- [ ] All tests pass
- [ ] Lint clean (0 errors, 0 warnings)
- [ ] a11y audit clean (0 critical, 0 serious)
- [ ] Arabic strings use translation keys (no hardcoded text)
- [ ] RTL layout verified
- [ ] Responsive at all breakpoints (320px, 768px, 1024px)

---

## 7. Three-Tier Boundaries

### ✅ Always

- Use translation keys for ALL user-facing strings
- Use CSS logical properties for directional styles
- Include `alt` text (Arabic) for all images
- Use semantic HTML (`<main>`, `<nav>`, `<article>`, etc.)
- Validate all user input server-side (Supabase Edge Functions)
- Use HTTPS everywhere
- Set `lang="ar"` and `dir="rtl"` on `<html>`
- Run a11y audit before merging
- Write migrations for all database changes
- Use environment variables for secrets and config
- Use Supabase RLS (Row Level Security) policies
- Containerize every service with Docker
- Test on both mobile and desktop viewports

### ⚠️ Ask First

- Adding new npm dependencies (justify need vs vanilla alternative)
- Changing database schema (migration required)
- Adding new API endpoints (check PRD coverage)
- Modifying design tokens (consult design system PRD-006)
- Adding new WhatsApp message templates (require Meta approval)
- Changing deployment configuration
- Adding third-party analytics or tracking scripts
- Deviating from the Arabic-first approach

### 🚫 Never

- Commit secrets, API keys, or credentials to git
- Use inline styles (except dynamic computed values)
- Hardcode Arabic strings in source code
- Skip a11y requirements (WCAG 2.1 AA is mandatory)
- Add `letter-spacing` to Arabic text
- Use `float` for layout (use Flexbox/Grid)
- Deploy directly to production without staging verification
- Store sensitive user data without encryption
- Use `eval()` or dynamic code execution
- Disable Supabase RLS policies

---

## 8. Testing Strategy

| Level  | Tool           | When           | Target               |
| ------ | -------------- | -------------- | -------------------- |
| Unit   | Vitest         | On commit (CI) | ≥ 80% coverage       |
| E2E    | Playwright     | On PR (CI)     | Critical flows       |
| a11y   | axe-core       | On PR (CI)     | 0 violations         |
| Visual | Lighthouse     | On deploy (CI) | ≥ 90 all scores      |
| Manual | Screen readers | Before release | TalkBack + VoiceOver |

---

## 9. Security Principles

- **Authentication**: Supabase Auth with RLS (Row Level Security)
- **Authorization**: RLS policies enforce data access at the database level
- **Secrets**: Environment variables only, never committed
- **CORS**: Restrict to known origins
- **Input validation**: Server-side validation on all Edge Functions
- **XSS prevention**: Sanitize all user input, use Content Security Policy
- **HTTPS**: Enforced everywhere, HSTS headers
- **Dependencies**: Regular `npm audit`, automated Dependabot alerts
