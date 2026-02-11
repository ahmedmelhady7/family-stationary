# PRD-006: Islamic Theme & Arabic-First Design System

| Field            | Value                  |
| ---------------- | ---------------------- |
| **Author**       | Family Stationary Team |
| **Status**       | Draft                  |
| **Priority**     | P0                     |
| **Created**      | 2026-02-11             |
| **Last Updated** | 2026-02-11             |

---

## 1. Overview

Defines the visual identity, design system, and component library, rooted in **Islamic art principles** and built **Arabic-first** with full RTL support as default.

### 1.1 Goals

- Cohesive Islamic visual identity reflecting brand values
- Reusable RTL-first component library
- Typography, spacing, and layout optimized for Arabic text

### 1.2 Non-Goals

- Generic e-commerce theme
- Multi-theme / dark mode (Phase 2)

---

## 2. Islamic Design Principles

| Principle              | Application                                 |
| ---------------------- | ------------------------------------------- |
| **Geometric Patterns** | Backgrounds, dividers, section decoration   |
| **Arabesque Motifs**   | Accents, borders, card decoration           |
| **Calligraphy**        | Headings, brand name, bismillah             |
| **Symmetry**           | Balanced layouts reflecting Islamic harmony |
| **Natural Palette**    | Earth tones, gold accents, jewel tones      |

### Visual Identity Elements

- **Bismillah** (بسم الله الرحمن الرحيم) in header/footer
- Islamic geometric borders as section dividers
- Islamic arch shapes for card frames and image containers
- Lantern/Fanous for empty states and celebrations

---

## 3. Color Palette

### Primary Colors

| Color        | Hex       | Usage                        |
| ------------ | --------- | ---------------------------- |
| Deep Emerald | `#1B5E3A` | Primary brand, headers, CTAs |
| Warm Gold    | `#C9A84C` | Accents, prices, badges      |
| Ivory Cream  | `#FBF7F0` | Background, cards            |
| Rich Navy    | `#1A2744` | Text, footer                 |

### Secondary & Semantic

| Color        | Hex       | Usage               |
| ------------ | --------- | ------------------- |
| Terracotta   | `#C75B39` | Sale badges, errors |
| Sage Green   | `#8FAE8B` | In-stock, success   |
| Desert Sand  | `#E8DCC8` | Subtle backgrounds  |
| Muted Purple | `#6B5B8A` | Category accents    |

---

## 4. Typography

| Usage     | Font              | Fallback                 |
| --------- | ----------------- | ------------------------ |
| Headings  | Amiri             | Noto Naskh Arabic, serif |
| Body      | Noto Naskh Arabic | Tahoma, Arial            |
| UI Labels | Cairo             | Noto Sans Arabic         |

**Arabic Rules**: Line height 1.5–1.7×, never add letter-spacing (breaks ligatures), `text-align: right` default, Western Arabic numerals for prices.

---

## 5. Layout & Spacing

- **Direction**: `rtl` by default
- **Grid**: 12-column fluid, max 1200px
- Use CSS logical properties (`margin-inline-start`, `padding-inline-end`)
- Mirror directional icons (arrows, chevrons)

| Token       | Value |
| ----------- | ----- |
| `space-xs`  | 4px   |
| `space-sm`  | 8px   |
| `space-md`  | 16px  |
| `space-lg`  | 24px  |
| `space-xl`  | 32px  |
| `space-2xl` | 48px  |

---

## 6. Key Components

- **Navbar**: Logo right (RTL), cart left, Islamic geometric top border
- **Product Card**: Arch-shaped image, gold price, emerald CTA
- **Buttons**: Primary (Emerald), Secondary (outlined), Gold accent, Danger (Terracotta)
- **Forms**: RTL labels, right-aligned placeholders, emerald focus borders
- **Footer**: Navy background with geometric pattern overlay, bismillah centered

---

## 7. Breakpoints

| Breakpoint | Width     | Grid Columns |
| ---------- | --------- | ------------ |
| Mobile     | 320–479px | 1–2          |
| Tablet     | 768px     | 3            |
| Desktop    | 1024px    | 4            |
| Desktop L  | 1200px    | Max width    |

---

## 8. Design Tokens (CSS)

```css
:root {
  --color-primary: #1b5e3a;
  --color-gold: #c9a84c;
  --color-ivory: #fbf7f0;
  --color-navy: #1a2744;
  --font-heading: "Amiri", "Noto Naskh Arabic", serif;
  --font-body: "Noto Naskh Arabic", Tahoma, sans-serif;
  --font-ui: "Cairo", "Noto Sans Arabic", sans-serif;
  --radius-md: 8px;
  --shadow-md: 0 4px 12px rgba(26, 39, 68, 0.12);
  direction: rtl;
}
```

---

## 9. Open Questions

1. Commission custom Islamic patterns or use open-source library?
2. Brand name in Arabic calligraphy?
3. Bismillah always visible or only on certain pages?
4. Preferred Islamic art style (Moroccan, Ottoman, Andalusian)?
