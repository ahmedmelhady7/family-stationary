# Tasks-006: Islamic Theme & Arabic-First Design System

> Task breakdown for [Plan-006](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/specs/plans/plan-006-design-system.md) · [PRD-006](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/prds/PRD-006-islamic-theme-arabic-design.md)

---

## Phase 1: Design Tokens & Base Styles

### Task 6.1: Create design token file

- **Files**: `src/styles/tokens.css`
- **Work**: Define all CSS custom properties (colors, typography, spacing, shadows, z-index, transitions, direction)
- **Depends on**: None (foundation)
- **Verify**: Tokens load correctly, `:root` direction is `rtl`

### Task 6.2: Create CSS reset & base styles

- **Files**: `src/styles/base.css`
- **Work**: Modern CSS reset, set `html` to `lang="ar" dir="rtl"`, body defaults (font-body, line-height, color, background), box-sizing, smooth scrolling
- **Depends on**: 6.1
- **Verify**: Clean baseline in Chrome and Safari, RTL direction active

### Task 6.3: Create utility classes

- **Files**: `src/styles/utilities.css`
- **Work**: Spacing utilities (margin/padding inline/block), text alignment, visibility helpers, sr-only, reduced-motion media query
- **Depends on**: 6.1
- **Verify**: Utilities apply correctly in RTL context

---

## Phase 2: Font Loading

### Task 6.4: Set up font loading

- **Files**: `src/assets/fonts/`, `src/pages/*.html` (head section)
- **Work**: Download and self-host Cairo (regular, 600, 700) and Amiri (regular, 700) as WOFF2. Add preload hints. Lazy-load Noto Naskh Arabic via Google Fonts with `font-display: swap`
- **Depends on**: 6.1
- **Verify**: Fonts render correctly, no FOIT, fallback works

---

## Phase 3: Core Components

### Task 6.5: Build button component [P]

- **Files**: `src/styles/components/button.css`
- **Work**: Primary, secondary, gold, danger variants. Hover/focus/active states. Disabled state. Min 44×44px touch target
- **Depends on**: 6.1, 6.2
- **Verify**: All variants render correctly, focus ring visible, a11y compliant

### Task 6.6: Build form component [P]

- **Files**: `src/styles/components/form.css`
- **Work**: RTL labels, right-aligned placeholders, emerald focus borders, error states (terracotta), `aria-describedby` error linking
- **Depends on**: 6.1, 6.2
- **Verify**: Form inputs render RTL, focus ring visible, error styling works

### Task 6.7: Build card component [P]

- **Files**: `src/styles/components/card.css`
- **Work**: Base card (ivory background, shadow, radius), product card variant with arch-shaped image container, gold price, emerald CTA
- **Depends on**: 6.1, 6.2
- **Verify**: Cards render with arch shape, responsive

### Task 6.8: Build badge component [P]

- **Files**: `src/styles/components/badge.css`
- **Work**: Status badges (in-stock/sage, sale/terracotta, featured/gold), small text, rounded
- **Depends on**: 6.1, 6.2
- **Verify**: Badges render correctly, contrast meets WCAG AA

### Task 6.9: Build modal component [P]

- **Files**: `src/styles/components/modal.css`
- **Work**: Centered overlay, navy backdrop, ivory content, close button, responsive (full-screen on mobile)
- **Depends on**: 6.1, 6.2
- **Verify**: Modal centers, scrollable content, responsive

---

## Phase 4: Layout Components

### Task 6.10: Build navbar component

- **Files**: `src/styles/components/navbar.css`
- **Work**: Logo right (RTL), cart icon left, Islamic geometric top border (CSS), sticky on scroll, mobile hamburger menu
- **Depends on**: 6.1, 6.2, 6.5
- **Verify**: RTL layout correct, sticky works, hamburger toggles

### Task 6.11: Build footer component

- **Files**: `src/styles/components/footer.css`
- **Work**: Navy background, geometric pattern overlay (CSS), bismillah centered, links, responsive grid
- **Depends on**: 6.1, 6.2
- **Verify**: Pattern overlay renders, bismillah readable, responsive

### Task 6.12: Build responsive grid system

- **Files**: `src/styles/components/grid.css`
- **Work**: 12-column fluid grid, max-width 1200px, product grid (`auto-fill, minmax(260px, 1fr)`), breakpoints (320, 768, 1024, 1200)
- **Depends on**: 6.1
- **Verify**: Grid responsive at all breakpoints

---

## Phase 5: Islamic Art Assets

### Task 6.13: Create CSS geometric patterns

- **Files**: `src/styles/components/islamic-patterns.css`, `src/assets/patterns/`
- **Work**: CSS-only geometric border (repeating linear-gradient), arabesque tile pattern (SVG, low opacity overlay), arch shape (border-radius)
- **Depends on**: 6.1
- **Verify**: Patterns render cleanly, no layout impact, performant

### Task 6.14: Create empty state illustration

- **Files**: `src/assets/icons/lantern.svg`
- **Work**: Simple lantern/fanous SVG for empty states and celebration moments
- **Depends on**: None
- **Verify**: SVG renders at 120px and 200px, accessible with `alt` text

---

## Checkpoint: Design System Complete

- [ ] All tokens defined and documented
- [ ] All components render correctly in RTL
- [ ] Touch targets ≥ 44×44px
- [ ] Color contrast meets WCAG AA (≥ 4.5:1 body, ≥ 3:1 large)
- [ ] Responsive at 320px, 768px, 1024px, 1200px
- [ ] No `letter-spacing` on Arabic text
- [ ] Logical properties used throughout (no physical LTR properties)
