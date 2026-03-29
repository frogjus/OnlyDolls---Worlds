# Notion Design System Specifications

> Reverse-engineered from Notion's production app and open-source renderers.
> Notion does not publish an official design token system; all values are extracted
> from the live app, react-notion-x (3,420-line stylesheet), and community analyses.

---

## Typography

### Font Families

**Default (Sans-serif):**
```css
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif,
  "Segoe UI Emoji", "Segoe UI Symbol";
```

**Serif option:**
```css
font-family: Lyon-Text, Georgia, YuMincho, "Yu Mincho",
  "Hiragino Mincho ProN", "Hiragino Mincho Pro", "Songti TC",
  "Songti SC", SimSun, "Nanum Myeongjo", NanumMyeongjo, Batang, serif;
```

**Mono option:**
```css
font-family: iawriter-mono, Nitti, Menlo, Courier, monospace;
```

**Code font:**
```css
font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace;
```

### Font Sizes

| Element        | Size      | Computed | Weight | Line-height |
|----------------|-----------|----------|--------|-------------|
| Page title     | `2.5em`   | 40px     | 600    | 1.2         |
| Heading 1      | `1.875em` | 30px     | 600    | 1.3         |
| Heading 2      | `1.5em`   | 24px     | 600    | 1.3         |
| Heading 3      | `1.25em`  | 20px     | 600    | 1.3         |
| Body text      | `16px`    | 16px     | 400    | 1.5         |
| Small body     | `14px`    | 14px     | 400    | 1.5         |
| Card title     | `14px`    | 14px     | 500    | 1.2         |
| Card property  | `12px`    | 12px     | 400    | 1.5         |
| Caption        | `14px`    | 14px     | 400    | 1.4         |
| Inline code    | `85%`     | ~13.6px  | 400    | 1.5         |
| Search input   | `18px`    | 18px     | 400    | 27px        |

### Font Weights

| Usage                              | Weight |
|------------------------------------|--------|
| Regular body text                  | 400    |
| Page links, card titles, nav items | 500    |
| Headings, page title, bold text    | 600    |

### Heading Margins

| Heading | margin-top     |
|---------|----------------|
| H1      | `1.08em` (~32px at 30px font) |
| H2      | `1.1em` (~26px at 24px font)  |
| H3      | `1em` (~20px at 20px font)    |

---

## Colors (Light Mode)

### Core UI

| Token / Usage          | Value                          | Hex       |
|------------------------|--------------------------------|-----------|
| Page background        | `#ffffff`                      | `#FFFFFF`  |
| Sidebar background     | `rgb(247, 246, 243)`           | `#F7F6F3`  |
| Hover background       | `rgba(135, 131, 120, 0.15)`   | —          |
| Secondary bg / surface | `rgb(247, 246, 243)`           | `#F7F6F3`  |
| Primary text           | `rgb(55, 53, 47)`              | `#37352F`  |
| Secondary text (60%)   | `rgba(55, 53, 47, 0.6)`       | —          |
| Muted text (40%)       | `rgba(55, 53, 47, 0.4)`       | —          |
| Icon/gray text         | `rgb(155, 154, 151)`           | `#9B9A97`  |
| Border (light)         | `rgba(55, 53, 47, 0.09)`      | ~`#EDEDEC` |
| Border (medium)        | `rgba(55, 53, 47, 0.16)`      | ~`#DFDEDA` |
| Accent / select        | `rgb(46, 170, 220)`            | `#2EAADC`  |
| Selection highlight    | `rgba(45, 170, 219, 0.3)`     | —          |
| Focus ring             | `#D9EFF8`                      | `#D9EFF8`  |
| Button hover           | `rgba(0, 0, 0, 0.03)`         | —          |
| Button active          | `rgba(0, 0, 0, 0.06)`         | —          |
| UI hover background    | `#EFEFEF`                      | `#EFEFEF`  |

### Semantic Colors (Text / Background / Icon)

| Color  | Text               | Background           | Icon      |
|--------|--------------------|----------------------|-----------|
| Red    | `rgb(224, 62, 62)` | `rgb(251, 228, 228)` | `#D44C47` |
| Pink   | `rgb(173, 26, 114)`| `rgb(244, 223, 235)` | `#C14C8A` |
| Blue   | `rgb(11, 110, 153)`| `rgb(221, 235, 241)` | `#337EA9` |
| Purple | `rgb(105, 64, 165)`| `rgb(234, 228, 242)` | `#9065B0` |
| Green  | `#448361`          | `#EDF3EC`            | `#448361` |
| Yellow | `rgb(223, 171, 1)` | `rgb(251, 243, 219)` | `#CB912F` |
| Orange | `rgb(217, 115, 13)`| `rgb(250, 235, 221)` | `#D87620` |
| Brown  | `rgb(100, 71, 58)` | `rgb(233, 229, 227)` | `#9F6B53` |
| Gray   | `#787774`          | `#F1F1EF`            | `#A6A299` |

### Tag/Select Pill Colors

| Color   | Background                  | Text               |
|---------|-----------------------------|---------------------|
| Default | `rgba(227, 226, 224, 0.5)`  | `rgb(50, 48, 44)`   |
| Blue    | `rgb(211, 229, 239)`        | `rgb(24, 51, 71)`   |
| Green   | `rgb(219, 237, 219)`        | `rgb(28, 56, 41)`   |
| Orange  | `rgb(250, 222, 201)`        | `rgb(73, 41, 14)`   |
| Red     | `rgb(255, 226, 221)`        | `rgb(93, 23, 21)`   |
| Yellow  | `rgb(253, 236, 200)`        | `rgb(64, 44, 27)`   |
| Pink    | `rgb(245, 224, 233)`        | `rgb(76, 35, 55)`   |
| Purple  | `rgb(232, 222, 238)`        | `rgb(65, 36, 84)`   |
| Brown   | `rgb(238, 224, 218)`        | `rgb(68, 42, 30)`   |
| Gray    | `rgb(227, 226, 224)`        | `rgb(50, 48, 44)`   |

---

## Spacing & Layout

### Global Layout

| Property                    | Value                    |
|-----------------------------|--------------------------|
| Max content width           | `720px`                  |
| Full-width max              | `min(1920px, 98vw)`     |
| Full-width horizontal pad   | `min(96px, 8vw)`        |
| Default page horizontal pad | `min(16px, 8vw)`        |
| Header height               | `45px`                  |
| Indent per nesting level    | `27px`                  |
| Grid system base unit       | `8px`                   |

### Block Spacing

| Element          | Padding / Margin            |
|------------------|-----------------------------|
| Text block       | `3px 2px`, margin `1px 0`   |
| Callout          | `16px 16px 16px 12px`, margin `4px 0` |
| Code block       | `1em` all sides, margin `4px 0` |
| Quote            | `0.2em 0.9em`, margin `6px 0` |
| List items       | `6px 0`                     |
| Nested children  | `padding-left: 1.5em`      |
| Column spacer    | `min(32px, 4vw)`           |
| Table cell       | `5px 8px 6px`              |
| Bookmark body    | `12px 14px 14px`           |

### Page Top Padding

| State                     | Padding-top |
|---------------------------|-------------|
| No cover (default)        | `96px` + margin-top `48px` |
| Has cover + image icon    | `96px`      |
| Has cover + text icon     | `64px`      |
| Has cover, no icon        | `48px`      |
| Page bottom               | `max(10vh, 120px)` |

---

## Sidebar

| Property              | Value    |
|-----------------------|----------|
| Width                 | `224px`  |
| Background            | `#F7F6F3` (light) / `#373C3F` (dark) |
| Section gap           | `6px`    |
| Page link item height | `30px`   |
| Search bar height     | `30px`   |
| Icon container        | `22px x 22px` |
| Corner radius         | `8px`    |
| Navigation section h  | `131px`  |
| Favorites section h   | `30px`   |
| Active item bg        | `rgba(0, 0, 0, 0.04)` |
| Hover item bg         | `rgba(0, 0, 0, 0.03)` |

Source: [UI Breakdown of Notion's Sidebar (Medium)](https://medium.com/@quickmasum/ui-breakdown-of-notions-sidebar-2121364ec78d)

---

## Border Radius

| Element                  | Radius   |
|--------------------------|----------|
| Default (`--notion-corner-radius`) | `8px` |
| Buttons, dropdowns, tabs | `3px`    |
| Select/multi-select pills | `3px`   |
| TOC sidebar              | `4px`    |
| Code copy button         | `6px`    |
| Callout, bookmark, code block | `8px` |
| Link mention card        | `12px`   |
| Status pills             | `20px` (full round) |
| User avatar              | `100%`   |

---

## Cards (Board / Gallery / Kanban)

### Board Layout

| Property                | Value    |
|-------------------------|----------|
| Column width (default)  | `260px`  |
| Column width (small)    | `180px`  |
| Column width (large)    | `320px`  |
| Column right padding    | `16px`   |
| Board header height     | `44px`   |
| Card gap (vertical)     | `8px`    |

### Card Styling

| Property                | Value                                                       |
|-------------------------|-------------------------------------------------------------|
| Background              | `#ffffff`                                                   |
| Border-radius           | `8px`                                                       |
| Shadow (default)        | `rgba(15,15,15,0.1) 0 0 0 1px, rgba(15,15,15,0.1) 0 2px 4px` |
| Body padding            | `4px 10px`                                                  |
| Hover transition        | `background 100ms ease-out 0s`                              |
| Cover height (board)    | `148px` (default), `100px` (small), `180px` (large)         |
| Cover height (gallery)  | `190px` (default), `124px` (small)                          |
| Cover border-bottom     | `1px solid rgba(55, 53, 47, 0.09)`                         |
| Title font-size         | `14px`, weight `500`                                        |
| Property font-size      | `12px`                                                      |
| Gallery grid gap        | `16px`                                                      |
| Gallery grid min column | `260px`                                                     |

### Board Column Header

| Property     | Value                        |
|-------------|------------------------------|
| Font size    | `14px`                       |
| Line-height  | `1.2`                        |
| Count color  | `rgba(55, 53, 47, 0.6)`     |
| Count padding| `0 8px`                      |

---

## Buttons

| Property       | Value                              |
|----------------|------------------------------------|
| Padding        | `6px 12px`                         |
| Min-height     | `32px`                             |
| Font-size      | `14px`                             |
| Font-weight    | `400`                              |
| Border         | `1px solid rgb(155, 154, 151)`     |
| Border-radius  | `3px`                              |
| Background     | `transparent`                      |
| Hover bg       | `rgba(0, 0, 0, 0.03)`             |
| Active bg      | `rgba(0, 0, 0, 0.06)`             |
| Focus outline  | `2px solid var(--fg-color)`, offset `2px` |
| Disabled opacity | `0.4`                           |
| Transition     | `background-color 150ms ease`      |
| Line-height    | `1.2`                              |

---

## Shadows

| Element          | Box-shadow                                                                 |
|------------------|---------------------------------------------------------------------------|
| Card (default)   | `rgba(15,15,15,0.1) 0 0 0 1px, rgba(15,15,15,0.1) 0 2px 4px`           |
| Dialog / Modal   | `rgba(15,15,15,0.05) 0 0 0 1px, rgba(15,15,15,0.1) 0 5px 10px, rgba(15,15,15,0.2) 0 15px 40px` |
| Modal backdrop   | `rgba(15, 15, 15, 0.6)`                                                  |
| Popover          | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)`      |
| Dropdown         | `0 10px 38px -10px rgba(22,23,24,0.35), 0 10px 20px -15px rgba(22,23,24,0.2)` |
| Code copy button | `0 1px 0 rgba(27,31,36,0.04), inset 0 1px 0 rgba(255,255,255,0.25)`     |

---

## Transitions & Animations

| Context              | Duration | Easing                            |
|----------------------|----------|-----------------------------------|
| Link hover           | `100ms`  | `ease-in`                         |
| Page link hover      | `120ms`  | `ease-in 0s`                      |
| Card hover           | `100ms`  | `ease-out 0s`                     |
| Dropdown hover       | `120ms`  | `ease-in 0s`                      |
| Button hover         | `150ms`  | `ease`                            |
| Dropdown animation   | `400ms`  | `cubic-bezier(0.16, 1, 0.3, 1)`  |
| Gallery transition   | `200ms`  | `ease-out`                        |
| Lazy image fade      | `400ms`  | `ease-in` / `ease-out`            |

---

## Search / Dialog / Modal

| Property            | Value           |
|---------------------|-----------------|
| Modal max-width     | `600px`         |
| Modal width         | `75%`           |
| Modal top offset    | `90px`          |
| Modal max-height    | `80vh`          |
| Modal border-radius | `3px`           |
| Search bar height   | `52px`          |
| Search bar padding  | `16px`          |
| Search bar font-size| `18px`          |
| Result item padding | `8px 14px`      |
| Footer min-height   | `28px`          |
| Footer padding      | `0 16px`        |

---

## Sources

1. **[react-notion-x/styles.css](https://github.com/NotionX/react-notion-x/blob/master/packages/react-notion-x/src/styles.css)** — Primary source, 3,420-line community-maintained stylesheet that closely mirrors Notion's production CSS
2. **[matthiasfrank.de — Notion Colors](https://matthiasfrank.de/en/notion-colors/)** — Comprehensive color extraction including text, background, and icon variants
3. **[docs.super.so — Notion Colors](https://docs.super.so/notion-colors)** — CSS variable names and semantic color mappings
4. **[notionavenue.co — Notion Color Code Hex Palette](https://www.notionavenue.co/post/notion-color-code-hex-palette)** — UI element colors for light/dark modes
5. **[UI Breakdown of Notion's Sidebar (Medium)](https://medium.com/@quickmasum/ui-breakdown-of-notions-sidebar-2121364ec78d)** — Pixel-level sidebar measurements
6. **[dragonwocky — Notion custom fonts CSS](https://gist.github.com/dragonwocky/bef8b9f5e116e5281588081c7a7ec9c4)** — Font stack documentation
7. **[Notion Blog — Updating the Design of Notion Pages](https://www.notion.com/blog/updating-the-design-of-notion-pages)** — Official typography decisions
8. **[Notionpresso CSS Structure Guide](https://notionpresso.com/en/docs/customization-guide/css-structure-and-styling)** — CSS architecture documentation
