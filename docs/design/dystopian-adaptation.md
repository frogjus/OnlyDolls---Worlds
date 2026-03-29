# OnlyDolls Dystopian Adaptation — Notion Design Mapping

> Every Notion design value mapped to our dark dystopian aesthetic.
> Principle: keep Notion's spatial DNA (spacing, sizing, layout) but invert
> the visual language to a dark, teal-accented, atmospheric UI.

---

## Color Mapping: NOTION → ONLYDOLLS

| Notion Value                    | Purpose            | OnlyDolls Value                  | Notes                                    |
|---------------------------------|--------------------|----------------------------------|------------------------------------------|
| `#ffffff`                       | Page background    | `#0a0a0f`                        | Near-black with blue undertone           |
| `#f7f6f3` / `rgb(247,246,243)` | Surface / sidebar  | `#111118`                        | Dark surface, slight blue shift          |
| `#ffffff`                       | Elevated / card bg | `#1a1a24`                        | Elevated surface for cards, popovers     |
| `rgba(55,53,47,0.09)`          | Border (light)     | `rgba(255,255,255,0.06)`         | Inverted opacity border                  |
| `rgba(55,53,47,0.16)`          | Border (medium)    | `rgba(255,255,255,0.12)`         | Stronger border for dividers             |
| `#37352f`                       | Text primary       | `#e2e8f0`                        | Slate-200, cool white                    |
| `rgba(55,53,47,0.6)`           | Text secondary     | `#94a3b8`                        | Slate-400                                |
| `rgba(55,53,47,0.4)`           | Text muted         | `#64748b`                        | Slate-500                                |
| `#9b9a97`                       | Icon / gray text   | `#475569`                        | Slate-600                                |
| `#2eaadc`                       | Accent / select    | `#14b8a6`                        | Teal-500, signature brand color          |
| `rgba(45,170,219,0.3)`         | Selection highlight| `rgba(20,184,166,0.2)`           | Teal selection                           |
| `#d9eff8`                       | Focus ring         | `rgba(20,184,166,0.5)`           | Teal focus glow                          |
| `rgba(0,0,0,0.03)`             | Hover bg           | `rgba(255,255,255,0.03)`         | Subtle light hover on dark               |
| `rgba(0,0,0,0.06)`             | Active bg          | `rgba(255,255,255,0.06)`         | Active press state                       |
| `rgba(135,131,120,0.15)`       | Card hover bg      | `rgba(255,255,255,0.05)`         | Card hover state                         |
| `#efefef`                       | UI hover bg        | `#1e1e2a`                        | Dark hover surface                       |
| —                               | Secondary accent   | `#06b6d4`                        | Cyan-500 for links, secondary actions    |
| —                               | AI / wand features | `#7c3aed`                        | Violet-600 for AI-powered elements       |
| —                               | Destructive        | `#ef4444`                        | Red-500 for delete, danger               |
| —                               | Success            | `#22c55e`                        | Green-500 for confirmations              |
| —                               | Warning            | `#f59e0b`                        | Amber-500 for caution                    |

### Semantic Colors (Tags / Status Pills)

| Notion Color | Notion Pill BG            | OnlyDolls Pill BG              | OnlyDolls Pill Text |
|-------------|---------------------------|--------------------------------|---------------------|
| Default     | `rgba(227,226,224,0.5)`   | `rgba(255,255,255,0.08)`       | `#94a3b8`           |
| Blue        | `rgb(211,229,239)`        | `rgba(6,182,212,0.15)`         | `#22d3ee`           |
| Green       | `rgb(219,237,219)`        | `rgba(34,197,94,0.15)`         | `#4ade80`           |
| Orange      | `rgb(250,222,201)`        | `rgba(245,158,11,0.15)`        | `#fbbf24`           |
| Red         | `rgb(255,226,221)`        | `rgba(239,68,68,0.15)`         | `#f87171`           |
| Yellow      | `rgb(253,236,200)`        | `rgba(234,179,8,0.15)`         | `#facc15`           |
| Pink        | `rgb(245,224,233)`        | `rgba(236,72,153,0.15)`        | `#f472b6`           |
| Purple      | `rgb(232,222,238)`        | `rgba(124,58,237,0.15)`        | `#a78bfa`           |
| Teal        | —                         | `rgba(20,184,166,0.15)`        | `#2dd4bf`           |

---

## Typography Adaptation

### What We Keep from Notion

All font sizes, weights, and line-heights are preserved exactly:

| Element      | Size   | Weight | Line-height | Same as Notion? |
|-------------|--------|--------|-------------|-----------------|
| Page title  | 40px   | 600    | 1.2         | Yes             |
| H1          | 30px   | 600    | 1.3         | Yes             |
| H2          | 24px   | 600    | 1.3         | Yes             |
| H3          | 20px   | 600    | 1.3         | Yes             |
| Body        | 16px   | 400    | 1.5         | Yes             |
| Small       | 14px   | 400    | 1.5         | Yes             |
| Card title  | 14px   | 500    | 1.2         | Yes             |
| Caption     | 12px   | 400    | 1.4         | Yes             |

### What We Change

| Property           | Notion                     | OnlyDolls                                   |
|--------------------|----------------------------|---------------------------------------------|
| Display/heading font | System sans-serif         | **Space Grotesk** (Google Fonts import)     |
| Body font          | System sans-serif           | **Inter** (explicit, not system fallback)    |
| Mono font          | iawriter-mono, Nitti, etc.  | **JetBrains Mono** (Google Fonts import)    |
| H1 letter-spacing  | normal                     | `-0.02em`                                    |
| H2 letter-spacing  | normal                     | `-0.015em`                                   |
| H3 letter-spacing  | normal                     | `-0.01em`                                    |
| Caption style      | normal case                | `text-transform: uppercase; letter-spacing: 0.05em` |
| Text rendering     | default                    | `antialiased` (`-webkit-font-smoothing`)     |

### Font Imports

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
```

### Font Stacks

```css
--od-font-display: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
--od-font-body: 'Inter', ui-sans-serif, system-ui, sans-serif;
--od-font-mono: 'JetBrains Mono', SFMono-Regular, Consolas, monospace;
```

---

## Spacing Adaptation

### What We Keep Exactly

All spatial values from Notion are preserved to maintain the same comfortable layout rhythm:

| Property                     | Notion Value          | OnlyDolls Value       |
|------------------------------|-----------------------|-----------------------|
| Max content width            | `720px`               | `720px`               |
| Full-width max               | `min(1920px, 98vw)`  | `min(1920px, 98vw)`  |
| Full-width horizontal pad    | `min(96px, 8vw)`     | `min(96px, 8vw)`     |
| Header height                | `45px`                | `45px`                |
| Indent per nesting level     | `27px`                | `27px`                |
| Grid base unit               | `8px`                 | `8px`                 |
| Block text padding           | `3px 2px`             | `3px 2px`             |
| Callout padding              | `16px 16px 16px 12px` | `16px 16px 16px 12px` |
| Code block padding           | `1em`                 | `1em`                 |
| Table cell padding           | `5px 8px 6px`         | `5px 8px 6px`         |
| Column spacer                | `min(32px, 4vw)`      | `min(32px, 4vw)`      |
| Page bottom padding          | `max(10vh, 120px)`    | `max(10vh, 120px)`    |

---

## Sidebar Adaptation

| Property              | Notion Value         | OnlyDolls Value              |
|-----------------------|----------------------|------------------------------|
| Width                 | `224px`              | `240px` (slightly wider for breathing room) |
| Background            | `#F7F6F3`            | `#0d0d14` (darker than main bg) |
| Page link item height | `30px`               | `30px`                       |
| Search bar height     | `30px`               | `30px`                       |
| Icon container        | `22px x 22px`        | `22px x 22px`                |
| Section gap           | `6px`                | `6px`                        |
| Corner radius         | `8px`                | `8px`                        |
| Active item bg        | `rgba(0,0,0,0.04)`  | `rgba(20,184,166,0.1)` (teal tint) |
| Hover item bg         | `rgba(0,0,0,0.03)`  | `rgba(255,255,255,0.03)`     |
| Border right          | none (Notion uses shadow) | `1px solid rgba(255,255,255,0.06)` |

---

## Border Radius Adaptation

All border-radius values kept from Notion:

| Element                  | Notion  | OnlyDolls | Notes                    |
|--------------------------|---------|-----------|--------------------------|
| Default                  | `8px`   | `8px`     | Same                     |
| Buttons, dropdowns       | `3px`   | `4px`     | Slightly softer          |
| Select/multi-select pills| `3px`   | `4px`     | Match buttons            |
| Cards                    | `8px`   | `8px`     | Same                     |
| Callout, code block      | `8px`   | `8px`     | Same                     |
| Status pills             | `20px`  | `20px`    | Full round, same         |
| Tooltip                  | `6px`   | `6px`     | Same                     |
| Link mention card        | `12px`  | `12px`    | Same                     |

---

## Cards (Board / Kanban) Adaptation

| Property              | Notion Value                                              | OnlyDolls Value                                        |
|-----------------------|-----------------------------------------------------------|--------------------------------------------------------|
| Column width (default)| `260px`                                                  | `260px`                                                |
| Column width (small)  | `180px`                                                  | `180px`                                                |
| Column width (large)  | `320px`                                                  | `320px`                                                |
| Card gap              | `8px`                                                    | `8px`                                                  |
| Card bg               | `#ffffff`                                                | `#1a1a24`                                              |
| Card border-radius    | `8px`                                                    | `8px`                                                  |
| Card shadow (default) | `rgba(15,15,15,0.1) 0 0 0 1px, rgba(15,15,15,0.1) 0 2px 4px` | `rgba(0,0,0,0.4) 0 0 0 1px, rgba(0,0,0,0.3) 0 2px 4px` |
| Card shadow (hover)   | same + stronger                                          | `0 0 20px rgba(20,184,166,0.15), rgba(0,0,0,0.5) 0 4px 8px` |
| Card body padding     | `4px 10px`                                               | `4px 10px`                                             |
| Card hover transform  | none                                                     | `translateY(-2px)`                                     |
| Card transition       | `background 100ms ease-out`                              | `all 200ms ease-out`                                   |
| Board header height   | `44px`                                                   | `44px`                                                 |
| Gallery grid gap      | `16px`                                                   | `16px`                                                 |

---

## Button Adaptation

| Property        | Notion Value                     | OnlyDolls Value                          |
|-----------------|----------------------------------|------------------------------------------|
| Padding         | `6px 12px`                       | `6px 12px`                               |
| Min-height      | `32px`                           | `32px`                                   |
| Font-size       | `14px`                           | `14px`                                   |
| Border-radius   | `3px`                            | `4px`                                    |
| Border          | `1px solid #9b9a97`             | `1px solid rgba(255,255,255,0.12)`       |
| Background      | `transparent`                    | `transparent`                            |
| Hover bg        | `rgba(0,0,0,0.03)`              | `rgba(255,255,255,0.06)`                 |
| Active bg       | `rgba(0,0,0,0.06)`              | `rgba(255,255,255,0.1)`                  |
| Focus           | `2px solid var(--fg-color)`      | `0 0 0 2px rgba(20,184,166,0.5)`        |
| Primary variant | — (Notion has no filled buttons) | `bg: #14b8a6; color: #0a0a0f`           |
| Hover (primary) | —                                | `bg: #0d9488` (teal-600)                |
| Transition      | `150ms ease`                     | `150ms ease`                             |

---

## Shadow Adaptation

| Element          | Notion Shadow                                              | OnlyDolls Shadow                                              |
|------------------|------------------------------------------------------------|---------------------------------------------------------------|
| Card (default)   | `rgba(15,15,15,0.1) 0 0 0 1px, rgba(15,15,15,0.1) 0 2px 4px` | `rgba(0,0,0,0.4) 0 0 0 1px, rgba(0,0,0,0.3) 0 2px 4px`     |
| Card (hover)     | same                                                       | `0 0 20px rgba(20,184,166,0.15), rgba(0,0,0,0.5) 0 4px 8px` |
| Dialog / Modal   | `...0.05...0.1...0.2` layers                              | `0 0 0 1px rgba(255,255,255,0.06), 0 12px 40px rgba(0,0,0,0.5)` |
| Modal backdrop   | `rgba(15,15,15,0.6)`                                      | `rgba(0,0,0,0.75)`                                            |
| Popover          | `0 4px 6px rgba(0,0,0,0.1)`                               | `0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)` |
| Dropdown         | `0 10px 38px rgba(22,23,24,0.35)`                         | `0 10px 38px rgba(0,0,0,0.5)`                                 |
| Teal glow        | — (none)                                                   | `0 0 20px rgba(20,184,166,0.15)`                              |
| Teal glow strong | — (none)                                                   | `0 0 30px rgba(20,184,166,0.25)`                              |

---

## Effects & Atmosphere

### What We Add (Notion has none of these)

| Effect                  | CSS Value                                                        | Usage                              |
|-------------------------|------------------------------------------------------------------|------------------------------------|
| Teal glow on hover      | `box-shadow: 0 0 20px rgba(20,184,166,0.15)`                   | Cards, interactive elements        |
| Teal glow strong        | `box-shadow: 0 0 30px rgba(20,184,166,0.25)`                   | Active/focused elements            |
| Teal focus ring         | `box-shadow: 0 0 0 2px rgba(20,184,166,0.5)`                   | All focusable elements             |
| Gradient border         | `border-image: linear-gradient(135deg, #14b8a6, #7c3aed) 1`    | Feature cards, premium elements    |
| Card lift on hover      | `transform: translateY(-2px)`                                    | Cards, list items                  |
| Shimmer loading         | `background: linear-gradient(90deg, transparent, rgba(20,184,166,0.05), transparent)` | Skeleton loaders     |
| Backdrop blur            | `backdrop-filter: blur(12px)`                                   | Modals, overlays, floating panels  |
| Glass morphism surface  | `background: rgba(17,17,24,0.8); backdrop-filter: blur(12px)`  | Command palette, floating menus    |
| Text gradient (accent)  | `background: linear-gradient(135deg, #14b8a6, #06b6d4); -webkit-background-clip: text` | Logo, feature headings |
| Subtle noise texture    | `background-image: url(noise.svg); opacity: 0.02`              | Page background, adds tactility    |

### Transition Adjustments

| Context              | Notion Duration | OnlyDolls Duration | OnlyDolls Easing                  |
|----------------------|-----------------|--------------------|------------------------------------|
| Link hover           | `100ms`         | `150ms`            | `ease-out`                         |
| Card hover           | `100ms`         | `200ms`            | `ease-out`                         |
| Button hover         | `150ms`         | `150ms`            | `ease`                             |
| Dropdown open        | `400ms`         | `300ms`            | `cubic-bezier(0.16, 1, 0.3, 1)`   |
| Page transition      | —               | `200ms`            | `ease-out`                         |
| Glow fade in         | —               | `300ms`            | `ease-out`                         |

---

## CSS Custom Properties

Paste into `globals.css` or your Tailwind theme config:

```css
:root {
  /* === Backgrounds === */
  --od-bg: #0a0a0f;
  --od-surface: #111118;
  --od-elevated: #1a1a24;
  --od-sidebar-bg: #0d0d14;
  --od-hover: #1e1e2a;

  /* === Borders === */
  --od-border: rgba(255, 255, 255, 0.06);
  --od-border-strong: rgba(255, 255, 255, 0.12);
  --od-border-interactive: rgba(255, 255, 255, 0.16);

  /* === Text === */
  --od-text: #e2e8f0;
  --od-text-secondary: #94a3b8;
  --od-text-muted: #64748b;
  --od-text-faint: #475569;

  /* === Brand Colors === */
  --od-teal: #14b8a6;
  --od-teal-hover: #0d9488;
  --od-teal-muted: rgba(20, 184, 166, 0.15);
  --od-cyan: #06b6d4;
  --od-violet: #7c3aed;
  --od-violet-muted: rgba(124, 58, 237, 0.15);

  /* === Semantic === */
  --od-destructive: #ef4444;
  --od-destructive-muted: rgba(239, 68, 68, 0.15);
  --od-success: #22c55e;
  --od-success-muted: rgba(34, 197, 94, 0.15);
  --od-warning: #f59e0b;
  --od-warning-muted: rgba(245, 158, 11, 0.15);

  /* === Shadows / Glows === */
  --od-shadow-card: rgba(0, 0, 0, 0.4) 0 0 0 1px, rgba(0, 0, 0, 0.3) 0 2px 4px;
  --od-shadow-card-hover: 0 0 20px rgba(20, 184, 166, 0.15), rgba(0, 0, 0, 0.5) 0 4px 8px;
  --od-shadow-dialog: 0 0 0 1px rgba(255, 255, 255, 0.06), 0 12px 40px rgba(0, 0, 0, 0.5);
  --od-shadow-popover: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06);
  --od-shadow-dropdown: 0 10px 38px rgba(0, 0, 0, 0.5);
  --od-glow-teal: 0 0 20px rgba(20, 184, 166, 0.15);
  --od-glow-teal-strong: 0 0 30px rgba(20, 184, 166, 0.25);
  --od-focus-ring: 0 0 0 2px rgba(20, 184, 166, 0.5);
  --od-backdrop: rgba(0, 0, 0, 0.75);

  /* === Layout (from Notion) === */
  --od-max-width: 720px;
  --od-full-width-max: min(1920px, 98vw);
  --od-full-width-pad: min(96px, 8vw);
  --od-header-height: 45px;
  --od-sidebar-width: 240px;
  --od-sidebar-item-h: 30px;
  --od-sidebar-icon: 22px;
  --od-grid-unit: 8px;
  --od-indent: 27px;
  --od-board-column-w: 260px;
  --od-card-gap: 8px;
  --od-gallery-gap: 16px;
  --od-corner-radius: 8px;

  /* === Typography === */
  --od-font-display: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
  --od-font-body: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --od-font-mono: 'JetBrains Mono', SFMono-Regular, Consolas, monospace;
}
```

---

## Tailwind Theme Extension

Map these custom properties into Tailwind's theme for utility class usage:

```js
// tailwind.config.ts (partial)
theme: {
  extend: {
    colors: {
      od: {
        bg: 'var(--od-bg)',
        surface: 'var(--od-surface)',
        elevated: 'var(--od-elevated)',
        hover: 'var(--od-hover)',
        border: 'var(--od-border)',
        'border-strong': 'var(--od-border-strong)',
        text: 'var(--od-text)',
        'text-secondary': 'var(--od-text-secondary)',
        'text-muted': 'var(--od-text-muted)',
        teal: 'var(--od-teal)',
        cyan: 'var(--od-cyan)',
        violet: 'var(--od-violet)',
        destructive: 'var(--od-destructive)',
        success: 'var(--od-success)',
        warning: 'var(--od-warning)',
      },
    },
    fontFamily: {
      display: ['var(--od-font-display)'],
      body: ['var(--od-font-body)'],
      mono: ['var(--od-font-mono)'],
    },
    boxShadow: {
      'od-card': 'var(--od-shadow-card)',
      'od-card-hover': 'var(--od-shadow-card-hover)',
      'od-dialog': 'var(--od-shadow-dialog)',
      'od-popover': 'var(--od-shadow-popover)',
      'od-glow': 'var(--od-glow-teal)',
      'od-glow-strong': 'var(--od-glow-teal-strong)',
      'od-focus': 'var(--od-focus-ring)',
    },
    borderRadius: {
      'od': 'var(--od-corner-radius)',
    },
    spacing: {
      'od-sidebar': 'var(--od-sidebar-width)',
      'od-header': 'var(--od-header-height)',
    },
  },
}
```

---

## Quick Reference: Design Decisions

| Decision | Rationale |
|----------|-----------|
| Keep all Notion spacing | Proven comfortable reading/interaction rhythm; no need to reinvent |
| Space Grotesk for headings | Geometric sans with sci-fi personality, pairs well with Inter body |
| JetBrains Mono for code | Superior ligatures and readability for code/data contexts |
| Teal (#14b8a6) as primary | Distinctive, high-contrast on dark, avoids cliche blue/purple |
| Violet (#7c3aed) for AI | Clear visual separation of AI-powered features from user actions |
| Cyan (#06b6d4) secondary | Complements teal, creates cohesive cool palette |
| Card lift + glow on hover | Adds tactile depth; the glow reinforces the dystopian atmosphere |
| Backdrop blur on overlays | Modern glass morphism feel; reinforces layered dark UI |
| Deeper shadows (0.3-0.5) | Dark UIs need stronger shadows for depth perception |
| Inverted opacity borders | `rgba(255,255,255,0.06)` is the dark-mode equivalent of Notion's `rgba(55,53,47,0.09)` |
| Sidebar slightly wider (240px) | Extra 16px accommodates longer navigation labels |
| Noise texture at 2% opacity | Adds subtle grain/texture that prevents flat-screen feel |
