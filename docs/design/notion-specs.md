# Notion Design System Specs

Reference document extracted from Notion's live interface. These values inform our dystopian adaptation.

---

## Typography

| Token | Font Family | Size | Weight | Letter-Spacing | Line-Height |
|-------|-------------|------|--------|---------------|-------------|
| Display | -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif | 40px | 700 | -0.022em | 1.2 |
| H1 (Page title) | Same stack | 30px | 700 | -0.018em | 1.25 |
| H2 | Same stack | 24px | 600 | -0.012em | 1.3 |
| H3 | Same stack | 18.5px | 600 | -0.008em | 1.35 |
| Body | Same stack | 15px | 400 | 0 | 1.6 |
| Small / UI | Same stack | 13px | 400 | 0 | 1.45 |
| Caption / Meta | Same stack | 11px | 500 | 0.02em | 1.3 |

### Key Observations
- Notion uses the system font stack with `-apple-system` primary
- Headings use negative letter-spacing for tightness (increases with size)
- Body text at 15px is slightly larger than typical 14px — optimized for long reading
- Line heights are generous (1.6 for body) — content breathes

---

## Color Palette (Light Mode — Notion's default)

### Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| Page background | `#ffffff` | Main content area |
| Sidebar background | `#fbfbfa` | Left sidebar |
| Surface / Card | `#ffffff` | Cards, dropdowns, popovers |
| Elevated surface | `#ffffff` | Modals, command palette |
| Hover row | `rgba(55, 53, 47, 0.03)` | List item hover |
| Active row | `rgba(55, 53, 47, 0.06)` | Selected sidebar item |
| Input background | `#ffffff` | Form inputs |
| Overlay | `rgba(15, 15, 15, 0.6)` | Modal backdrop |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| Primary text | `#37352f` | Headings, body text |
| Secondary text | `rgba(55, 53, 47, 0.65)` | Descriptions, placeholders |
| Tertiary / muted | `rgba(55, 53, 47, 0.45)` | Timestamps, meta |
| Disabled | `rgba(55, 53, 47, 0.25)` | Disabled controls |
| Link / accent | `#2383e2` | Inline links |

### Borders
| Token | Value | Usage |
|-------|-------|-------|
| Default border | `rgba(55, 53, 47, 0.09)` | Cards, dividers |
| Strong border | `rgba(55, 53, 47, 0.16)` | Input borders, table cells |
| Focus ring | `rgba(35, 131, 226, 0.28)` | Focus state (blue) |

### Accents
| Token | Value | Usage |
|-------|-------|-------|
| Blue | `#2383e2` | Primary actions, links |
| Red | `#eb5757` | Delete, destructive |
| Green | `#0f7b6c` | Success, published |
| Orange | `#d9730d` | Warnings |
| Purple | `#9065b0` | Tags, categories |
| Pink | `#ad1a72` | Tags |
| Yellow | `#dfab01` | Highlights, stars |
| Gray | `#787774` | Neutral tags |

---

## Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| 4xs | 2px | Tight icon gaps |
| 3xs | 4px | Icon-to-text gap |
| 2xs | 6px | Compact padding |
| xs | 8px | Small padding, badge padding |
| sm | 10px | Sidebar item padding-x |
| md | 12px | Card padding, input padding-x |
| lg | 14px | Section gaps |
| xl | 16px | Card gap, content padding |
| 2xl | 20px | Block gap |
| 3xl | 24px | Section padding |
| 4xl | 32px | Page margin-x |
| 5xl | 48px | Large section gap |
| 6xl | 64px | Page top padding |
| page-width | 900px | Content max-width |
| sidebar-width | 240px | Collapsed: 0, Default: 240px |
| peek-panel | 480px | Side peek panel width |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| none | 0 | Table cells |
| xs | 3px | Badges, small tags |
| sm | 4px | Buttons, inputs, menu items |
| md | 6px | Cards, dropdowns |
| lg | 8px | Modals, large cards |
| xl | 12px | Popovers, dialogs |
| full | 9999px | Avatars, pills |

---

## Shadows / Elevation

| Token | Value | Usage |
|-------|-------|-------|
| Level 0 | none | Default (flat) |
| Level 1 | `0 1px 2px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.04)` | Cards, hover lift |
| Level 2 | `0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)` | Dropdowns, popups |
| Level 3 | `0 12px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)` | Modals, command palette |
| Level 4 | `0 24px 64px rgba(0,0,0,0.16)` | Full-page overlay |

### Key: Notion uses extremely subtle shadows. Almost everything is flat with borders, not shadows.

---

## Component Patterns

### Buttons
- **Default**: bg transparent, text `#37352f`, border none, px 10px, py 4px, radius 4px, font-size 14px, weight 500
- **Primary (blue)**: bg `#2383e2`, text white, same padding, radius 4px
- **Hover**: bg `rgba(55, 53, 47, 0.06)` for default, darken 8% for primary
- **Disabled**: opacity 0.4, cursor not-allowed
- **Icon button**: 28px square, radius 4px, icon 16px centered

### Inputs
- Border: `rgba(55, 53, 47, 0.16)` (1px)
- Radius: 4px
- Padding: 8px 10px
- Focus: 2px blue ring (`rgba(35, 131, 226, 0.28)`)
- Placeholder: `rgba(55, 53, 47, 0.45)`

### Cards (Database cards)
- Border: `rgba(55, 53, 47, 0.09)` (1px)
- Radius: 6px
- Padding: 10px 12px
- Hover: border darken to 0.16 opacity + subtle lift shadow
- No background difference from page

### Badges / Tags
- Radius: 3px
- Padding: 2px 6px
- Font: 12px, weight 400
- Background: colored at 10% opacity (e.g., blue tag: `rgba(35, 131, 226, 0.1)`)
- Text: colored at full strength

### Dialog / Modal
- Overlay: `rgba(15, 15, 15, 0.6)` with blur(4px)
- Container: bg white, radius 12px, shadow level 3
- Max-width: 480px (small), 720px (medium), 90vw (large)
- Padding: 20px 24px
- Close button: top-right, 28px icon button

---

## Sidebar Specifications

| Property | Value |
|----------|-------|
| Width | 240px (resizable, min 200px, max 480px) |
| Background | `#fbfbfa` |
| Border-right | `rgba(55, 53, 47, 0.09)` (1px) |
| Item height | 28px |
| Item padding | 4px 10px |
| Item font-size | 14px |
| Item font-weight | 400 (500 for active) |
| Icon size | 18px (page emoji) or 14px (system icon) |
| Icon-text gap | 8px |
| Indent per level | 24px (12px + 12px toggle) |
| Hover bg | `rgba(55, 53, 47, 0.04)` |
| Active bg | `rgba(55, 53, 47, 0.08)` |
| Section header | 11px, weight 600, uppercase, letter-spacing 0.06em, text `rgba(55, 53, 47, 0.45)` |
| Section gap | 16px top margin |
| Drag handle | 6-dot grip, visible on hover, left of icon |
| Scrollbar | 4px width, transparent track, gray thumb on hover |

---

## Board / Kanban Specifications

| Property | Value |
|----------|-------|
| Column width | 260px |
| Column gap | 8px |
| Column header font | 14px, weight 500 |
| Column count badge | 12px, weight 400, muted color |
| Card border | `rgba(55, 53, 47, 0.09)` |
| Card radius | 6px |
| Card padding | 8px 10px |
| Card title font | 14px, weight 400 |
| Card property font | 12px |
| Card gap (between cards) | 6px |
| Card hover | border darken + subtle lift |
| Card drag state | opacity 0.5 on origin, elevated shadow on dragged |
| Column header padding | 8px 10px |
| Add card button | text style, "+" icon, full column width |
| Board horizontal scroll | true, scroll-snap-type: x proximity |
| Empty column | dashed border placeholder |
