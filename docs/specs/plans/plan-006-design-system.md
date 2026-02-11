# Plan-006: Islamic Theme & Arabic-First Design System

> Technical implementation plan for [PRD-006](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/prds/PRD-006-islamic-theme-arabic-design.md)

---

## Architecture

### Design Token System (CSS Custom Properties)

```
styles/
├── tokens.css              # All design tokens (colors, spacing, fonts, shadows)
├── base.css                # CSS reset + RTL defaults + body styles
├── utilities.css           # Utility classes (spacing, text, visibility)
└── components/
    ├── navbar.css
    ├── product-card.css
    ├── button.css
    ├── form.css
    ├── footer.css
    ├── badge.css
    ├── modal.css
    └── islamic-patterns.css  # Geometric pattern overlays & borders
```

### Token Architecture

```css
/* tokens.css — Single source of truth */
:root {
  /* Colors - Primary */
  --color-primary: #1b5e3a;
  --color-primary-light: #2d7a4f;
  --color-primary-dark: #134428;
  --color-gold: #c9a84c;
  --color-gold-light: #d4b96a;
  --color-ivory: #fbf7f0;
  --color-navy: #1a2744;

  /* Colors - Secondary */
  --color-terracotta: #c75b39;
  --color-sage: #8fae8b;
  --color-sand: #e8dcc8;
  --color-purple: #6b5b8a;

  /* Colors - Semantic */
  --color-success: var(--color-sage);
  --color-error: var(--color-terracotta);
  --color-warning: var(--color-gold);
  --color-info: var(--color-primary);

  /* Typography */
  --font-heading: "Amiri", "Noto Naskh Arabic", serif;
  --font-body: "Noto Naskh Arabic", Tahoma, sans-serif;
  --font-ui: "Cairo", "Noto Sans Arabic", sans-serif;
  --line-height-ar: 1.6;
  --line-height-tight: 1.3;

  /* Font Sizes (fluid, rem-based) */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 2rem;
  --text-4xl: 2.5rem;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  --space-3xl: 4rem;

  /* Borders & Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-full: 9999px;
  --border-width: 1px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(26, 39, 68, 0.08);
  --shadow-md: 0 4px 12px rgba(26, 39, 68, 0.12);
  --shadow-lg: 0 8px 24px rgba(26, 39, 68, 0.16);
  --shadow-gold: 0 4px 12px rgba(201, 168, 76, 0.2);

  /* Layout */
  --max-width: 1200px;
  --grid-columns: 12;
  --grid-gap: var(--space-md);

  /* Z-index scale */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal-backdrop: 300;
  --z-modal: 400;
  --z-toast: 500;

  /* Transitions */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --easing-default: cubic-bezier(0.4, 0, 0.2, 1);

  /* Direction */
  direction: rtl;
}
```

---

## Font Loading Strategy

```html
<!-- Preload critical fonts -->
<link
  rel="preload"
  href="/fonts/cairo-regular.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
<link
  rel="preload"
  href="/fonts/amiri-regular.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>

<!-- Google Fonts fallback (non-blocking) -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap"
  media="print"
  onload="this.media='all'"
/>
```

**Strategy**: Self-host critical fonts (Cairo for UI, Amiri for headings), lazy-load Noto Naskh Arabic via Google Fonts with `font-display: swap`.

---

## Key Component Specs

### Islamic Pattern System

```css
/* islamic-patterns.css */
.islamic-border-top {
  background-image: url("/assets/patterns/geometric-border.svg");
  background-repeat: repeat-x;
  background-size: auto 8px;
  height: 8px;
}

.islamic-arch {
  border-radius: 50% 50% var(--radius-md) var(--radius-md);
  overflow: hidden;
}

.islamic-bg-overlay {
  background-image: url("/assets/patterns/arabesque-tile.svg");
  background-repeat: repeat;
  background-size: 120px;
  opacity: 0.04;
  pointer-events: none;
}
```

### Responsive Grid

```css
.grid {
  display: grid;
  gap: var(--grid-gap);
  max-width: var(--max-width);
  margin-inline: auto;
  padding-inline: var(--space-md);
}

/* Mobile: 1-2 cols | Tablet: 3 cols | Desktop: 4 cols */
.grid--products {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
```

### Button System

| Variant   | Background           | Text              | Border            | Use Case       |
| --------- | -------------------- | ----------------- | ----------------- | -------------- |
| Primary   | `--color-primary`    | White             | None              | CTAs, submit   |
| Secondary | Transparent          | `--color-primary` | `--color-primary` | Cancel, back   |
| Gold      | `--color-gold`       | `--color-navy`    | None              | Add to cart    |
| Danger    | `--color-terracotta` | White             | None              | Delete, remove |

---

## Islamic Art Asset Pipeline

| Asset Type            | Source               | Format | Sizes          |
| --------------------- | -------------------- | ------ | -------------- |
| Geometric borders     | SVG (inline or file) | SVG    | Scalable       |
| Arabesque tiles       | SVG pattern          | SVG    | 120×120px tile |
| Arch frame            | CSS `border-radius`  | —      | —              |
| Lantern (empty state) | SVG illustration     | SVG    | 200px, 120px   |
| App icons             | PNG                  | PNG    | 192px, 512px   |

> **Phase 1**: Use CSS-only geometric patterns and arches. Custom Islamic art in Phase 2.

---

## RTL Considerations

| CSS Property to Avoid | RTL Equivalent (Logical) |
| --------------------- | ------------------------ |
| `margin-left`         | `margin-inline-start`    |
| `margin-right`        | `margin-inline-end`      |
| `padding-left`        | `padding-inline-start`   |
| `padding-right`       | `padding-inline-end`     |
| `text-align: left`    | `text-align: start`      |
| `float: left`         | Don't use float          |
| `left: 0`             | `inset-inline-start: 0`  |
| `border-left`         | `border-inline-start`    |

Directional icons (arrows, chevrons) must be mirrored with `transform: scaleX(-1)` or use RTL-aware icon variants.

---

## Dependencies

| Dependency        | Source PRD |
| ----------------- | ---------- |
| None (foundation) | —          |

**Consumed by**: PRD-001, PRD-003, PRD-005, PRD-007
