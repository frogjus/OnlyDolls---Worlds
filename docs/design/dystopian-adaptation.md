# Dystopian Sci-Fi Adaptation Guide

Notion's design language inverted into a dark, atmospheric, dystopian sci-fi aesthetic.
Every Notion value maps to our system — same proportions, inverted palette, added atmosphere.

---

## Design Philosophy

**Notion's Principles → Our Adaptations:**
- Clean → Clean (we keep the clarity, not the light)
- White space → Dark space (same breathing room, different color)
- Subtle borders → Subtle glow borders (same subtlety, different medium)
- Flat → Flat with atmospheric depth (glow instead of shadow)
- Content-first → Content-first (text readability is sacred)

**What we ADD that Notion doesn't have:**
- Teal/cyan/violet accent system (triadic color hierarchy)
- Atmospheric glow effects on interactive elements
- Negative letter-spacing on headings for compressed sci-fi feel
- Blue-undertone blacks (not pure black — `#0a0a0f` has subtle blue)
- Gradient borders on hero elements (teal → violet)

**What we DON'T do:**
- No neon. No cyberpunk excess. No text glow. No scanlines.
- No dark-for-dark's-sake. Every dark value serves readability.
- No color overload. Teal is primary, cyan and violet are supporting.

---

## Typography Mapping

| Notion Token | Notion Value | Our Token | Our Value | Delta |
|---|---|---|---|---|
| Display | 40px / 700 / -0.022em | `--text-display` | 48px / 700 / -0.03em | Larger, tighter |
| H1 | 30px / 700 / -0.018em | `--text-h1` | 36px / 700 / -0.02em | Larger, tighter |
| H2 | 24px / 600 / -0.012em | `--text-h2` | 24px / 600 / -0.015em | Same size, tighter |
| H3 | 18.5px / 600 / -0.008em | `--text-h3` | 18px / 600 / -0.01em | Same ballpark, tighter |
| Body | 15px / 400 / 0 | `--text-body` | 15px / 400 / 0 | Identical — readability first |
| Small | 13px / 400 / 0 | `--text-small` | 13px / 400 / 0 | Identical |
| Caption | 11px / 500 / 0.02em | `--text-caption` | 11px / 500 / 0.05em / uppercase | Wider tracking, uppercase |

### Font Families
- **Body**: `Inter` (replaces system font stack — we want consistent rendering)
- **Headings**: `Space Grotesk` (geometric, slightly techy, gorgeous negative tracking)
- Both loaded via `next/font/google` for zero FOUT

---

## Color Mapping

### Backgrounds

| Notion Token | Notion Value | Our Token | Our Value | Notes |
|---|---|---|---|---|
| Page bg | `#ffffff` | `--background` | `#0a0a0f` | Near-black with blue undertone |
| Sidebar bg | `#fbfbfa` | `--sidebar` | `#08080d` | Darker than page (inverted Notion pattern) |
| Surface / Card | `#ffffff` | `--card` | `#111118` | Slight elevation via lightness |
| Elevated | `#ffffff` | `--elevated` | `#1a1a24` | Modals, popovers |
| Hover row | `rgba(55,53,47,0.03)` | Hover | `rgba(255,255,255,0.03)` | Same opacity, inverted |
| Active row | `rgba(55,53,47,0.06)` | Active | `rgba(20,184,166,0.08)` | Tinted teal (brand touch) |
| Input bg | `#ffffff` | Input bg | `#0d0d14` | Between bg and card |
| Overlay | `rgba(15,15,15,0.6)` | Overlay | `rgba(0,0,0,0.7)` + `backdrop-blur(12px)` | Blur added |

### Text

| Notion Token | Notion Value | Our Token | Our Value |
|---|---|---|---|
| Primary | `#37352f` | `--foreground` | `#e2e8f0` (slate-200) |
| Secondary | `rgba(55,53,47,0.65)` | `--muted-foreground` | `#94a3b8` (slate-400) |
| Tertiary | `rgba(55,53,47,0.45)` | `--muted` text | `#64748b` (slate-500) |
| Disabled | `rgba(55,53,47,0.25)` | Disabled | `#475569` (slate-600) |
| Link | `#2383e2` | Accent link | `#14b8a6` (teal-500) |

### Borders

| Notion Token | Notion Value | Our Token | Our Value |
|---|---|---|---|
| Default border | `rgba(55,53,47,0.09)` | `--border` | `rgba(255,255,255,0.06)` |
| Strong border | `rgba(55,53,47,0.16)` | Strong border | `rgba(255,255,255,0.1)` |
| Focus ring | `rgba(35,131,226,0.28)` | Focus ring | `rgba(20,184,166,0.4)` (teal) |

### Accent System (NEW — Notion has one blue, we have three)

| Role | Token | Value | Usage |
|---|---|---|---|
| **Primary** | `--primary` | `#14b8a6` (teal-500) | Active states, links, primary buttons, focus rings |
| Primary hover | `--primary-hover` | `#0d9488` (teal-600) | Button hover |
| Primary subtle | `--primary-subtle` | `rgba(20,184,166,0.1)` | Tag backgrounds, hover tints |
| **Secondary** | `--secondary` | `#06b6d4` (cyan-500) | Info states, secondary highlights |
| Secondary subtle | | `rgba(6,182,212,0.1)` | Secondary tag bg |
| **Accent** | `--accent` | `#7c3aed` (violet-600) | Decorative accents, gradient endpoints |
| Accent subtle | | `rgba(124,58,237,0.1)` | Accent tag bg |
| **Destructive** | `--destructive` | `#ef4444` (red-500) | Delete, errors |
| **Warning** | `--warning` | `#f59e0b` (amber-500) | Warnings |
| **Success** | `--success` | `#10b981` (emerald-500) | Confirmation |

---

## Spacing Mapping

Identical to Notion. Same proportions, same breathing room. The dark theme doesn't change spacing.

| Notion | Ours | Value |
|--------|------|-------|
| Same | Same | 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 48, 64 |
| page-width | page-width | 900px |
| sidebar-width | sidebar-width | 240px (same) |
| peek-panel | inspector-panel | 480px (same) |

---

## Border Radius Mapping

| Notion | Value | Ours | Value | Delta |
|--------|-------|------|-------|-------|
| xs | 3px | xs | 4px | Slightly rounder |
| sm | 4px | sm | 6px | Rounder |
| md | 6px | md | 8px | Rounder |
| lg | 8px | lg | 12px | Rounder |
| xl | 12px | xl | 16px | Rounder |
| full | 9999px | full | 9999px | Same (pills, avatars) |

**Buttons**: `border-radius: 9999px` (full pill shape — our signature divergence from Notion's 4px)

---

## Shadow → Glow Mapping

Notion uses shadows for elevation. We use GLOW for atmosphere.

| Notion Level | Notion Shadow | Our Level | Our Glow |
|---|---|---|---|
| 0 (flat) | none | 0 | none |
| 1 (card hover) | `0 1px 2px rgba(0,0,0,0.04)...` | 1 | `0 0 0 1px rgba(255,255,255,0.06)` (border only) |
| 2 (dropdown) | `0 4px 12px rgba(0,0,0,0.08)...` | 2 | `0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.08)` |
| 3 (modal) | `0 12px 32px rgba(0,0,0,0.12)...` | 3 | `0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(20,184,166,0.05)` |
| 4 (overlay) | `0 24px 64px rgba(0,0,0,0.16)` | 4 | `0 16px 48px rgba(0,0,0,0.6)` |

### Atmospheric Glow (our addition)
- **Teal glow (interactive)**: `0 0 15px rgba(20,184,166,0.15), 0 0 30px rgba(20,184,166,0.05)`
- **Teal glow hover**: `0 0 20px rgba(20,184,166,0.25), 0 0 40px rgba(20,184,166,0.1)`
- **Gradient border**: `linear-gradient(135deg, rgba(20,184,166,0.3), rgba(124,58,237,0.3))`
- Used SPARINGLY — only on hero cards, active states, and primary CTAs

---

## Component Adaptations

### Buttons
| Notion | Ours |
|--------|------|
| bg transparent, radius 4px | bg transparent, radius `9999px` (pill) |
| Primary: bg blue | Primary: bg `#14b8a6` (teal), text `#0a0a0f` |
| Hover: darken 8% | Hover: `#0d9488`, teal glow |
| Ghost: bg on hover | Ghost: `rgba(255,255,255,0.05)` on hover |
| Outline: border only | Outline: `rgba(255,255,255,0.1)` border, teal on hover |

### Inputs
| Notion | Ours |
|--------|------|
| bg white, border gray | bg `#0d0d14`, border `rgba(255,255,255,0.08)` |
| Focus: blue ring | Focus: teal ring `rgba(20,184,166,0.4)` + subtle teal glow |
| Radius: 4px | Radius: 8px (rounded-lg) |

### Cards
| Notion | Ours |
|--------|------|
| bg white, border gray, radius 6px | bg `#111118`, border `rgba(255,255,255,0.06)`, radius 12px |
| Hover: border darken | Hover: border brighten + faint teal glow |
| Shadow on hover | Glow on hover (not shadow) |

### Badges
| Notion | Ours |
|--------|------|
| Colored bg 10%, radius 3px | Same colored bg 10%, radius `9999px` (pill) |
| Per-color variants | teal, cyan, violet primary variants + semantic colors |

### Dialog / Modal
| Notion | Ours |
|--------|------|
| Overlay `rgba(15,15,15,0.6)` | Overlay `rgba(0,0,0,0.7)` + `backdrop-blur(12px)` |
| bg white, radius 12px | bg `#111118`, radius 16px, `0 0 0 1px rgba(255,255,255,0.08)` border |
| Shadow level 3 | Glow level 3 + faint teal top accent |

### Tabs
| Notion | Ours |
|--------|------|
| Not prominent in Notion | Underline style: 2px bottom border teal on active |
| | Inactive: muted text, no border |
| | Hover: text brightens |

---

## Sidebar Adaptation

| Notion Property | Notion Value | Our Value |
|---|---|---|
| Width | 240px | 240px |
| Background | `#fbfbfa` | `#08080d` |
| Border-right | gray 1px | `rgba(255,255,255,0.06)` 1px |
| Item height | 28px | 32px (slightly taller for dark readability) |
| Item padding | 4px 10px | 6px 12px |
| Item font | 14px / 400 | 14px / 400, Inter |
| Icon size | 14-18px | 16px |
| Hover bg | `rgba(55,53,47,0.04)` | `rgba(255,255,255,0.04)` |
| Active bg | `rgba(55,53,47,0.08)` | `rgba(20,184,166,0.1)` (teal tint) |
| Active text | same color, 500 weight | `#14b8a6` (teal), 500 weight |
| Active indicator | none (just bg) | 2px left border teal (our addition) |
| Section header | 11px caps gray | 11px caps `#64748b`, 0.05em tracking |
| Scrollbar | 4px gray | 4px `rgba(255,255,255,0.1)` on hover |

---

## Board / Kanban Adaptation

| Notion Property | Notion Value | Our Value |
|---|---|---|
| Column width | 260px | 280px |
| Column gap | 8px | 12px |
| Column header | 14px/500 | 13px/600, `#94a3b8`, uppercase, 0.05em tracking |
| Count badge | 12px muted | 11px `#64748b` |
| Card bg | white | `#111118` |
| Card border | `rgba(55,53,47,0.09)` | `rgba(255,255,255,0.06)` |
| Card radius | 6px | 12px |
| Card padding | 8px 10px | 12px 14px |
| Card hover | border darken | border brighten + faint teal glow |
| Card drag | opacity 0.5 / shadow | opacity 0.6 + teal glow outline on drop target |
| Add button | text "+" | text "+" with teal color on hover |
| Board bg | white | `#0a0a0f` (page bg) |
| Empty column | dashed border | dashed `rgba(255,255,255,0.08)` border |

---

## Animation & Transition Specs

| Pattern | Notion | Ours |
|---------|--------|------|
| Hover transition | 100ms ease | 150ms `cubic-bezier(0, 0, 0.2, 1)` |
| Page transition | instant | 200ms fade-up (framer-motion, y: 8px → 0, opacity 0 → 1) |
| Modal enter | 100ms scale(0.98→1) | 200ms scale(0.96→1) + opacity, with blur backdrop fade |
| Dropdown | 100ms | 150ms, origin top |
| Sidebar collapse | 200ms width | 200ms width + opacity for content |
| Card lift | subtle translateY | `translateY(-2px)` + glow intensify |
| Skeleton shimmer | gray pulse | Teal gradient sweep (1.8s ease-in-out infinite) |
| Active pulse | none | `pulse-ring` 2s (teal ring expand + fade) — used sparingly |

---

## Implementation Notes

1. **Dark-only**: Remove ALL `:root` (light) variables. Only `.dark` exists. Apply `class="dark"` to `<html>`.
2. **CSS Variables**: All colors as CSS custom properties in `globals.css`, consumed via Tailwind config.
3. **Font loading**: `Inter` (body) + `Space Grotesk` (headings) via `next/font/google` in layout.tsx.
4. **Tailwind theme**: Extend with our tokens. shadcn components consume via `bg-card`, `text-foreground`, etc.
5. **Glow utilities**: Custom CSS classes (`.glow-teal`, `.glow-teal-hover`, `.border-gradient`) — already exist in current globals.css, refine them.
6. **Reduced motion**: All glow animations, shimmer, and transitions respect `prefers-reduced-motion`.
