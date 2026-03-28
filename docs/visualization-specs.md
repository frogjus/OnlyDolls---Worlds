# StoryForge Visualization System — Technical Specifications

> Version 1.0 | 2026-03-28

This document specifies the 15 visualization components in StoryForge, plus shared infrastructure (toolbar, theming, export, loading/empty states).

---

## Table of Contents

1. [Shared Infrastructure](#shared-infrastructure)
2. [1 — Dual Timeline](#1--dual-timeline)
3. [2 — Character Relationship Map](#2--character-relationship-map)
4. [3 — Arc Diagram](#3--arc-diagram)
5. [4 — Mind Map / World Map](#4--mind-map--world-map)
6. [5 — Impact Analysis View](#5--impact-analysis-view)
7. [6 — Source Material Viewer](#6--source-material-viewer)
8. [7 — Pacing Heatmap](#7--pacing-heatmap)
9. [8 — Emotional Arc Chart](#8--emotional-arc-chart)
10. [9 — Faction / Power Map](#9--faction--power-map)
11. [10 — Beat Sheet / Scene Board](#10--beat-sheet--scene-board)
12. [11 — Foreshadowing Web](#11--foreshadowing-web)
13. [12 — Causality Graph](#12--causality-graph)
14. [13 — Audience Knowledge Map](#13--audience-knowledge-map)
15. [14 — Writing Surface](#14--writing-surface)
16. [15 — Treatment View](#15--treatment-view)

---

## Shared Infrastructure

### Visualization Toolbar

Every visualization renders inside a `<VisualizationShell>` wrapper that provides a consistent toolbar.

```tsx
interface VisualizationToolbarProps {
  /** Current zoom level (0.1–5.0) */
  zoom: number;
  onZoomChange: (zoom: number) => void;
  /** Toggle filter side-panel */
  onToggleFilters: () => void;
  filtersActive: boolean;
  /** Number of active filter criteria — shown as badge */
  activeFilterCount: number;
  /** Export the visualization canvas */
  onExport: (format: 'svg' | 'png' | 'pdf') => void;
  /** Toggle fullscreen mode */
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  /** Optional extras rendered right-aligned (e.g. time slider) */
  extraControls?: React.ReactNode;
}
```

**Toolbar layout (left to right):**

| Zone | Controls |
|------|----------|
| Left | Zoom in (+) / Zoom out (−) / Zoom-to-fit / Zoom percentage dropdown |
| Center | Filter toggle button with active-count badge |
| Right | Export dropdown (SVG / PNG / PDF) · Fullscreen toggle · `extraControls` slot |

**Keyboard shortcuts** (when visualization is focused):

| Key | Action |
|-----|--------|
| `Ctrl/Cmd + =` | Zoom in |
| `Ctrl/Cmd + -` | Zoom out |
| `Ctrl/Cmd + 0` | Zoom to fit |
| `F` | Toggle fullscreen |
| `Ctrl/Cmd + Shift + E` | Export menu |
| `Escape` | Exit fullscreen / close filter panel |

### Filter Panel

Slides in from the right. Contents are visualization-specific, but the shell provides:

```tsx
interface FilterPanelProps {
  /** Schema of available filter dimensions */
  dimensions: FilterDimension[];
  /** Current active filters */
  activeFilters: Record<string, FilterValue>;
  onChange: (filters: Record<string, FilterValue>) => void;
  onReset: () => void;
}

interface FilterDimension {
  key: string;
  label: string;
  type: 'multi-select' | 'range' | 'date-range' | 'toggle' | 'search';
  options?: { value: string; label: string; count?: number }[];
  min?: number;
  max?: number;
}
```

### Theming

All visualizations respect the app-wide `light` / `dark` mode via CSS custom properties.

```css
/* Palette consumed by all visualizations */
--viz-bg: var(--color-surface-primary);
--viz-fg: var(--color-text-primary);
--viz-fg-muted: var(--color-text-secondary);
--viz-grid: var(--color-border-subtle);
--viz-accent: var(--color-accent-primary);
--viz-danger: var(--color-status-error);
--viz-warning: var(--color-status-warning);
--viz-success: var(--color-status-success);

/* Categorical palette — 12 distinguishable colors in both modes */
--viz-cat-1 through --viz-cat-12
```

**Rules:**
- SVG fills/strokes read from CSS custom properties, never hardcoded hex.
- Canvas-based renderers (cosmograph) pull palette from a `useVizTheme()` hook that returns resolved RGB values.
- Transitions between light/dark re-render without layout recalculation — only color values change.
- All text in visualizations meets WCAG AA contrast (4.5:1 for normal text, 3:1 for large text) in both modes.

### Print / Export

| Format | Method | Notes |
|--------|--------|-------|
| **SVG** | Serialize the `<svg>` DOM node via `XMLSerializer`, inject inline styles from CSS custom properties. | Lossless, editable in Illustrator/Figma. |
| **PNG** | Render SVG to `<canvas>` via `canvg` or `OffscreenCanvas`, then `canvas.toBlob()`. | Resolution: 2x device pixel ratio, min 2048px wide. |
| **PDF** | Client-side via `jsPDF` + SVG embed, or server-side via Puppeteer for complex layouts. | Used for multi-page exports (Treatment View, Beat Sheet). |

For React Flow-based visualizations, use `@reactflow/node-resizer` viewport capture + `html-to-image` for PNG.

For canvas-based renderers (cosmograph), read pixels directly from the WebGL context.

### Loading States

Each visualization has a type-specific skeleton:

| Visualization Type | Skeleton Pattern |
|--------------------|-----------------|
| Graph/network (2, 4, 9, 11, 12) | 8–12 pulsing circles at random positions + 10–15 faint connecting lines |
| Timeline (1) | Two horizontal bands with 6–8 pulsing rectangles each |
| Chart (3, 7, 8) | Pulsing axes + 3–5 placeholder series shapes |
| Board (10) | 4 column headers + 3 pulsing cards per column |
| Editor (6, 14, 15) | 12–15 pulsing horizontal bars of varying width (text lines) |
| Diff/split (5, 13) | Two side-by-side panels with pulsing bars |

Implementation: `<VizSkeleton variant="graph" | "timeline" | "chart" | "board" | "editor" | "diff" />`

All skeletons use CSS `@keyframes pulse` animation on `--viz-grid` color, no JS.

### Empty States

```tsx
interface VizEmptyStateProps {
  /** Illustration key — maps to a small SVG illustration */
  illustration: 'timeline' | 'graph' | 'chart' | 'board' | 'editor' | 'diff';
  /** Primary message */
  title: string;
  /** Secondary explanatory text */
  description: string;
  /** CTA button */
  action?: { label: string; onClick: () => void };
}
```

Empty state messages per visualization:

| # | Visualization | Title | Description | Action |
|---|--------------|-------|-------------|--------|
| 1 | Dual Timeline | "No events yet" | "Add events to your story to see them on the timeline." | "Create Event" |
| 2 | Character Relationship Map | "No characters yet" | "Create characters and define their relationships." | "Add Character" |
| 3 | Arc Diagram | "No arcs defined" | "Define story arcs to visualize narrative structure." | "Create Arc" |
| 4 | Mind Map / World Map | "Empty world" | "Start building your story world by adding elements." | "Add Element" |
| 5 | Impact Analysis | "Nothing to analyze" | "Make a change to see its impact on connected elements." | — |
| 6 | Source Material Viewer | "No sources attached" | "Import text, video, or audio source material." | "Import Source" |
| 7 | Pacing Heatmap | "No pacing data" | "Add scenes with pacing metrics to generate the heatmap." | "Go to Scenes" |
| 8 | Emotional Arc Chart | "No emotional data" | "Tag character emotions across scenes to see their arcs." | "Tag Emotions" |
| 9 | Faction / Power Map | "No factions defined" | "Create factions and assign characters to them." | "Create Faction" |
| 10 | Beat Sheet / Scene Board | "No beats yet" | "Add story beats to start organizing your narrative." | "Add Beat" |
| 11 | Foreshadowing Web | "No setups or payoffs" | "Tag foreshadowing setups and their payoffs." | "Add Setup" |
| 12 | Causality Graph | "No causal links" | "Connect events with causal relationships." | "Link Events" |
| 13 | Audience Knowledge Map | "No knowledge tracked" | "Define what the audience and characters know at each point." | "Add Knowledge" |
| 14 | Writing Surface | "Start writing" | "Begin your story in prose or screenplay format." | "New Document" |
| 15 | Treatment View | "No beats to summarize" | "Add beats to auto-generate a treatment document." | "Go to Beat Sheet" |

---

## 1 — Dual Timeline

### Library Choice

**vis-timeline** (v7+) — purpose-built for horizontal timelines with groups, nesting, zooming, and sub-item rendering. Two independent `Timeline` instances share a single `DataSet` and are synced programmatically. vis-timeline handles time-axis rendering, zoom/pan, and group lanes natively — building this from scratch in D3 would be substantial effort for marginal gain.

### Data Requirements

**Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/stories/{storyId}/events` | GET | All events with fabula/sjuzhet timestamps |
| `GET /api/stories/{storyId}/timelines/config` | GET | Calendar system, zoom presets, lane definitions |
| `GET /api/stories/{storyId}/events/{eventId}/connections` | GET | Cross-timeline links for a specific event |

**Data shape:**

```ts
interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  /** When it happens in story-world time */
  fabulaStart: StoryTimestamp;
  fabulaEnd: StoryTimestamp;
  /** When it is presented to the audience */
  sjuzhetStart: NarrativePosition;
  sjuzhetEnd: NarrativePosition;
  /** Hierarchical level for zoom filtering */
  level: 'series' | 'season' | 'episode' | 'scene' | 'beat';
  /** Lane assignment within a timeline */
  laneId: string;
  /** Character IDs involved */
  characterIds: string[];
  /** Visual category for color coding */
  category: string;
  tags: string[];
}

interface StoryTimestamp {
  /** Supports custom calendar systems */
  calendarId: string;
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
}

interface NarrativePosition {
  /** Hierarchical position: S01E03 scene 5, beat 2 */
  series?: number;
  season?: number;
  episode?: number;
  scene?: number;
  beat?: number;
  /** Absolute linear position for rendering (computed server-side) */
  linearPosition: number;
}

interface TimelineLane {
  id: string;
  label: string;
  color: string;
  /** Which timeline this lane belongs to */
  timeline: 'fabula' | 'sjuzhet';
  order: number;
}

interface CrossTimelineLink {
  eventId: string;
  fabulaItemId: string;
  sjuzhetItemId: string;
}
```

### Component API

```tsx
interface DualTimelineProps {
  storyId: string;
  /** Initial zoom level */
  initialZoom?: 'series' | 'season' | 'episode' | 'scene' | 'beat';
  /** Pre-selected event to center on */
  focusEventId?: string;
  /** Filter to specific characters */
  characterFilter?: string[];
  /** Filter to specific categories */
  categoryFilter?: string[];
  /** Custom calendar configuration override */
  calendarConfig?: CalendarConfig;
  /** Callback when user selects an event */
  onEventSelect?: (eventId: string) => void;
  /** Callback when user double-clicks to create */
  onEventCreate?: (position: { timeline: 'fabula' | 'sjuzhet'; start: StoryTimestamp | NarrativePosition }) => void;
  /** Callback when user drags an event to a new position */
  onEventMove?: (eventId: string, newPosition: Partial<TimelineEvent>) => void;
  /** Read-only mode disables drag/create */
  readOnly?: boolean;
}
```

### Interactions

| Interaction | Behavior |
|-------------|----------|
| **Scroll wheel** | Zoom in/out on the timeline axis. Both timelines zoom together (synced). |
| **Click + drag (background)** | Pan along the time axis. Both timelines pan proportionally. |
| **Click event** | Select event, highlight it on both timelines, draw connecting lines in the gutter between timelines. Show detail popover. |
| **Double-click (background)** | Open event creation dialog at that time position. |
| **Drag event** | Move event along the time axis (within its timeline). Fires `onEventMove`. |
| **Drag event edge** | Resize event duration. |
| **Hover event** | Tooltip with title, time range, characters. Faint highlight of same event on other timeline. |
| **Zoom level selector** | Toolbar dropdown: series > season > episode > scene > beat. Filters visible events by `level`. |
| **Lane collapse/expand** | Click lane header to collapse all events in that lane. |
| **Connecting lines** | SVG overlay in the gutter between the two timelines. Lines connect the same event across fabula/sjuzhet, drawn with Bezier curves. Color matches event category. |

**Sync mechanism:** Both `Timeline` instances share a `DataSet`. A `rangechange` listener on each instance proportionally updates the other's visible window. A `syncInProgress` flag prevents infinite loops.

### Performance Strategy

- **Zoom-level filtering:** At coarse zoom (series/season), only show aggregated events. `vis-timeline` hides items outside the visible range natively.
- **Clustering:** vis-timeline `cluster` option groups overlapping items at coarse zoom levels, expanding on zoom-in.
- **Virtual rendering:** vis-timeline only renders items within the visible viewport (built-in).
- **Connecting lines:** Only draw SVG lines for events visible in BOTH timelines simultaneously. Use `requestAnimationFrame` throttle during pan/zoom.
- **Lazy lane loading:** Collapsed lanes don't render their event items.
- **Target:** Smooth 60fps pan/zoom with up to 5,000 events, 50 lanes.

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| **Desktop (≥1024px)** | Stacked: fabula timeline top, SVG gutter (80px), sjuzhet timeline bottom. Each timeline ~45% viewport height. |
| **Tablet (768–1023px)** | Same stacked layout, gutter reduced to 40px. Lane labels truncated. Toolbar collapses to icon-only. |
| **Mobile (<768px)** | Single timeline toggle (fabula OR sjuzhet, switch via tab). No gutter. Connecting lines shown as inline badges on events instead. Swipe to pan. Pinch to zoom. |

---

## 2 — Character Relationship Map

### Library Choice

**Hybrid approach:**
- **<100 nodes:** React Flow — interactive, customizable node components, built-in minimap, handles moderate graphs well. Allows rich HTML nodes (character avatars, tooltips).
- **100+ nodes:** `@cosmograph/cosmos` — WebGL-based force simulation, handles 10k+ nodes at 60fps. Trade-off: nodes are circles only (no rich HTML), interactions are simpler.

A runtime check on node count triggers the switch. Both renderers consume the same data shape and expose the same callback API via a `<RelationshipMapRenderer>` adapter.

### Data Requirements

**Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/stories/{storyId}/characters` | GET | All characters with metadata |
| `GET /api/stories/{storyId}/relationships` | GET | All relationships between characters |
| `GET /api/stories/{storyId}/relationships?at={timestamp}` | GET | Relationships at a specific story time (for time slider) |
| `GET /api/stories/{storyId}/factions` | GET | Faction definitions for clustering |

**Data shape:**

```ts
interface CharacterNode {
  id: string;
  name: string;
  avatarUrl?: string;
  importance: number; // 0–1, maps to node radius
  factionId?: string;
  traits: string[];
  status: 'alive' | 'dead' | 'unknown';
  /** Position override for pinned nodes */
  pinnedPosition?: { x: number; y: number };
}

interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'family' | 'romantic' | 'friendship' | 'rivalry' | 'professional' | 'mentor' | 'custom';
  customLabel?: string;
  weight: number; // 0–1, maps to edge thickness
  sentiment: number; // -1 to 1, maps to color (red → green)
  /** For time slider: when this relationship starts/ends */
  validFrom?: StoryTimestamp;
  validTo?: StoryTimestamp;
  bidirectional: boolean;
}

interface Faction {
  id: string;
  name: string;
  color: string;
}
```

### Component API

```tsx
interface CharacterRelationshipMapProps {
  storyId: string;
  /** Pin the time slider to a specific moment */
  timePosition?: StoryTimestamp;
  /** Show the time slider control */
  showTimeSlider?: boolean;
  /** Pre-selected character */
  focusCharacterId?: string;
  /** Filter to specific factions */
  factionFilter?: string[];
  /** Filter to specific relationship types */
  relationshipTypeFilter?: Relationship['type'][];
  /** Cluster nodes by faction */
  clusterByFaction?: boolean;
  /** Layout algorithm */
  layout?: 'force' | 'radial' | 'hierarchical';
  /** Callback when character is selected */
  onCharacterSelect?: (characterId: string) => void;
  /** Callback when relationship is selected */
  onRelationshipSelect?: (relationshipId: string) => void;
  /** Callback when character node is dragged to new position */
  onCharacterPin?: (characterId: string, position: { x: number; y: number }) => void;
  readOnly?: boolean;
}
```

### Interactions

| Interaction | Behavior |
|-------------|----------|
| **Scroll wheel** | Zoom in/out. |
| **Click + drag (background)** | Pan the viewport. |
| **Click node** | Select character. Highlight all connected edges. Dim unconnected nodes. Show detail panel. |
| **Double-click node** | Navigate to character detail page. |
| **Drag node** | Reposition node (pin it). Fires `onCharacterPin`. |
| **Hover node** | Tooltip: name, faction, importance. Highlight direct connections (1-hop). |
| **Hover edge** | Tooltip: relationship type, weight, sentiment. Highlight the two connected nodes. |
| **Click edge** | Select relationship. Show detail panel with full relationship history. |
| **Time slider** | Drag or play. Animates: nodes fade in/out as characters are introduced/die. Edges appear/disappear based on `validFrom`/`validTo`. Smooth transitions via `d3-transition` (React Flow) or cosmograph animation API. |
| **Faction cluster toggle** | Groups nodes by faction with force-directed clusters. Faction label appears as a convex hull outline around the cluster. |
| **Right-click node** | Context menu: "View character", "Edit", "Hide from map", "Set as root". |

### Performance Strategy

- **Renderer switch:** Automatic at 100-node threshold. React Flow below, cosmograph above.
- **React Flow (<100 nodes):** `d3-force` simulation with `forceLink`, `forceManyBody`, `forceCenter`. Simulation stops after convergence (`alpha < 0.001`). Only re-simulate on data change, not on viewport changes.
- **Cosmograph (100+ nodes):** GPU-accelerated force simulation. Nodes rendered as WebGL points. Edges as WebGL lines. Interaction via raycasting.
- **Time slider optimization:** Pre-compute relationship snapshots at regular intervals server-side. Client interpolates between snapshots. Debounce slider changes (16ms = one frame).
- **Viewport culling:** React Flow's built-in viewport culling hides nodes outside the visible area.
- **Edge bundling:** For dense graphs (>500 edges), use Holten's hierarchical edge bundling to reduce visual clutter.
- **Target:** Smooth interaction with up to 500 nodes (React Flow) / 10,000 nodes (cosmograph).

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| **Desktop (≥1024px)** | Full viewport graph. Detail panel slides in from right (400px). Time slider in toolbar. |
| **Tablet (768–1023px)** | Full viewport graph. Detail panel as bottom sheet (50% height). Time slider below graph. |
| **Mobile (<768px)** | Graph fills screen. Detail panel as full-screen overlay. Time slider as floating bottom control. Pinch-to-zoom, two-finger pan. Single tap = select, long press = context menu. |

---

## 3 — Arc Diagram

### Library Choice

**D3.js custom SVG** — No off-the-shelf library handles the specific combination of story arc curves, structure template overlays, and multi-arc comparison. D3 provides the primitives (`d3-shape` for curves, `d3-scale` for axes, `d3-transition` for animation) while giving full control over the visual encoding.

### Data Requirements

**Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/stories/{storyId}/arcs` | GET | All story arcs with beat positions |
| `GET /api/stories/{storyId}/arcs/{arcId}/beats` | GET | Beats within an arc, with tension values |
| `GET /api/templates/structures` | GET | Available structure templates (3-act, Hero's Journey, etc.) |
| `GET /api/templates/structures/{templateId}` | GET | Expected beat positions for a template |

**Data shape:**

```ts
interface StoryArc {
  id: string;
  name: string;
  color: string;
  beats: ArcBeat[];
  /** Assigned structure template */
  templateId?: string;
}

interface ArcBeat {
  id: string;
  label: string;
  /** Normalized position in the narrative (0–1) */
  position: number;
  /** Tension/intensity value (0–1) */
  tension: number;
  /** Expected position from template (if assigned) */
  expectedPosition?: number;
  /** Type from the template (e.g. "Inciting Incident", "Climax") */
  templateBeatType?: string;
}

interface StructureTemplate {
  id: string;
  name: string; // "Three-Act Structure", "Hero's Journey", "Save the Cat"
  beats: TemplateBeat[];
}

interface TemplateBeat {
  type: string;
  label: string;
  /** Expected normalized position (0–1) */
  expectedPosition: number;
  /** Acceptable range around expected position */
  tolerance: number;
}
```

### Component API

```tsx
interface ArcDiagramProps {
  storyId: string;
  /** Which arcs to display (all if omitted) */
  arcIds?: string[];
  /** Structure template to overlay */
  templateId?: string;
  /** Show template deviation indicators */
  showTemplateOverlay?: boolean;
  /** Enable multi-arc comparison mode */
  comparisonMode?: boolean;
  /** Callback when beat is selected */
  onBeatSelect?: (arcId: string, beatId: string) => void;
  /** Callback when beat is dragged to new position */
  onBeatMove?: (arcId: string, beatId: string, newPosition: number, newTension: number) => void;
  readOnly?: boolean;
}
```

### Interactions

| Interaction | Behavior |
|-------------|----------|
| **Scroll wheel** | Zoom into a section of the narrative axis. |
| **Click + drag (background)** | Pan along the narrative axis. |
| **Click beat point** | Select beat. Show detail popover with label, position, tension, template deviation. |
| **Drag beat point (x-axis)** | Move beat's narrative position. Fires `onBeatMove`. |
| **Drag beat point (y-axis)** | Adjust beat's tension value. Fires `onBeatMove`. |
| **Hover beat point** | Tooltip: label, position, tension. If template assigned, show deviation from expected. |
| **Hover arc curve** | Highlight entire arc. Dim others. |
| **Toggle template overlay** | Show/hide dashed vertical lines at expected beat positions. Shade zones green/yellow/red based on how close actual beats are to expected. |
| **Comparison mode** | Multiple arcs rendered on same axes. Legend with arc names. Click legend item to toggle visibility. |
| **Brush selection** | Click + drag on background creates a brush to select a narrative range. Zooms into that range. |

### Performance Strategy

- **SVG path optimization:** Arc curves rendered as single `<path>` elements using `d3.curveCatmullRom`. Beat points as `<circle>`. Even 50 arcs with 100 beats each = ~5,000 SVG elements, well within SVG performance limits.
- **Transition batching:** When toggling arcs, batch enter/exit transitions using `d3-transition` with staggered delays for visual polish.
- **No virtualization needed:** Maximum realistic dataset is ~50 arcs × ~50 beats = 2,500 data points. SVG handles this natively.
- **Target:** Smooth interaction with up to 50 arcs, 100 beats each.

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| **Desktop (≥1024px)** | Full-width chart. X-axis: narrative position. Y-axis: tension. Legend at top-right. Template overlay as vertical dashed lines. |
| **Tablet (768–1023px)** | Same layout. Legend collapses to a dropdown. Beat labels hidden (tooltip only). |
| **Mobile (<768px)** | Horizontal scroll for the chart (fixed height 300px). One arc at a time with swipe to switch arcs. Template overlay simplified to colored zones only. |

---

## 4 — Mind Map / World Map

### Library Choice

**React Flow** — Provides a canvas with draggable nodes, connecting edges, minimap, and viewport controls out of the box. Its custom node API supports rich content (images, text, expand/collapse). The optional geographic underlay is handled by layering a `react-simple-maps` or Leaflet tile layer behind the React Flow canvas (coordinates mapped to React Flow's coordinate space).

### Data Requirements

**Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/stories/{storyId}/world/elements` | GET | All world-building elements |
| `GET /api/stories/{storyId}/world/connections` | GET | Connections between elements |
| `GET /api/stories/{storyId}/world/layout` | GET | Saved positions for elements |
| `PUT /api/stories/{storyId}/world/layout` | PUT | Persist layout positions |
| `GET /api/stories/{storyId}/world/geography` | GET | Geographic map config (if enabled) |

**Data shape:**

```ts
interface WorldElement {
  id: string;
  name: string;
  type: 'location' | 'character' | 'faction' | 'artifact' | 'concept' | 'event' | 'custom';
  description: string;
  imageUrl?: string;
  /** Hierarchical parent for expand/collapse */
  parentId?: string;
  children?: WorldElement[];
  /** Clustering dimension */
  tags: string[];
  themeIds?: string[];
  locationId?: string;
  factionId?: string;
  /** Geographic coordinates (for map underlay mode) */
  geoCoordinates?: { lat: number; lng: number };
  /** Canvas position (for freeform mode) */
  position?: { x: number; y: number };
}

interface WorldConnection {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  type: 'contains' | 'related' | 'controls' | 'located_in' | 'custom';
}

interface GeographyConfig {
  enabled: boolean;
  /** URL to a custom map image or tileset */
  mapSource: string;
  mapType: 'image' | 'tiles';
  bounds: { north: number; south: number; east: number; west: number };
}
```

### Component API

```tsx
interface MindMapProps {
  storyId: string;
  /** Initial clustering dimension */
  clusterBy?: 'theme' | 'location' | 'faction' | 'type' | 'none';
  /** Show geographic map underlay */
  showGeography?: boolean;
  /** Pre-expand these element IDs */
  expandedIds?: string[];
  /** Focus on a specific element */
  focusElementId?: string;
  /** Filter by element type */
  typeFilter?: WorldElement['type'][];
  /** Callback when element is selected */
  onElementSelect?: (elementId: string) => void;
  /** Callback when element is created (double-click canvas) */
  onElementCreate?: (position: { x: number; y: number }, parentId?: string) => void;
  /** Callback when connection is created (drag from handle to handle) */
  onConnectionCreate?: (sourceId: string, targetId: string) => void;
  /** Callback when layout changes (node drag) */
  onLayoutChange?: (layout: Record<string, { x: number; y: number }>) => void;
  readOnly?: boolean;
}
```

### Interactions

| Interaction | Behavior |
|-------------|----------|
| **Scroll wheel** | Zoom in/out. |
| **Click + drag (background)** | Pan the canvas. |
| **Click node** | Select element. Show detail sidebar. |
| **Double-click node** | Expand/collapse children. |
| **Double-click background** | Create new element at that position. |
| **Drag node** | Reposition element. Auto-saves layout. |
| **Drag from handle** | Create a connection between two elements. |
| **Hover node** | Tooltip: name, type, description excerpt. Highlight direct connections. |
| **Cluster toggle** | Re-layout nodes grouped by the selected dimension. Uses `d3-force` with cluster forces. Animated transition. |
| **Geography toggle** | Fade in/out the map underlay. Nodes with `geoCoordinates` animate to/from their geographic positions. Nodes without coordinates float above the map. |
| **Minimap** | React Flow built-in minimap in bottom-right corner. Click to navigate. |
| **Search** | Toolbar search field. Matching nodes highlighted, viewport pans to first match. |

### Performance Strategy

- **React Flow viewport culling:** Built-in — only renders nodes in the visible viewport.
- **Lazy child loading:** Collapsed parent nodes don't mount their children. On expand, fetch children from the API if not already cached.
- **Layout caching:** Persist layout positions server-side. On load, skip force simulation if saved layout exists.
- **Cluster animation:** When switching cluster dimensions, use `d3-force` in a web worker to compute new positions, then animate React Flow nodes to computed targets using `setNodes` with transition.
- **Geographic underlay:** Rendered as a single raster layer below the React Flow canvas. No per-tile overhead since it's a custom map image in most cases.
- **Target:** Smooth interaction with up to 500 nodes, 2,000 connections.

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| **Desktop (≥1024px)** | Full canvas. Detail sidebar (350px) on right. Minimap visible. Geography underlay at full resolution. |
| **Tablet (768–1023px)** | Full canvas. Detail sidebar as bottom sheet. Minimap hidden (use zoom-to-fit instead). |
| **Mobile (<768px)** | Full canvas with simplified nodes (icon + name only, no description). Detail as full-screen overlay. Pinch-to-zoom, two-finger pan. Geography underlay at reduced resolution. |

---

## 5 — Impact Analysis View

### Library Choice

**Custom React + D3** — The diff-style layout (canonical vs. changed) is most naturally built as a React component tree. D3 provides the dependency tree layout (`d3-hierarchy` for tree, `d3-transition` for animations). No existing library combines a diff view with a dependency graph.

### Data Requirements

**Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/stories/{storyId}/impact/analyze` | POST | Submit a proposed change, receive impact analysis |
| `GET /api/stories/{storyId}/impact/{analysisId}` | GET | Retrieve a saved analysis |
| `GET /api/stories/{storyId}/elements/{elementId}/dependents` | GET | Direct dependents of an element |

**Request body for POST:**

```ts
interface ImpactAnalysisRequest {
  /** The element being changed */
  elementId: string;
  elementType: 'character' | 'event' | 'location' | 'relationship' | 'arc' | 'beat';
  /** Description of the proposed change */
  changeDescription: string;
  /** Structured field changes */
  fieldChanges: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}
```

**Response shape:**

```ts
interface ImpactAnalysis {
  id: string;
  rootChange: ImpactNode;
  summary: {
    totalAffected: number;
    bySeverity: { high: number; medium: number; low: number };
  };
}

interface ImpactNode {
  elementId: string;
  elementType: string;
  elementName: string;
  severity: 'high' | 'medium' | 'low';
  /** What specifically is affected */
  impactDescription: string;
  /** Diff of the specific fields affected */
  fieldImpacts: {
    field: string;
    currentValue: any;
    projectedValue: any;
    confidence: number; // 0–1
  }[];
  /** Downstream elements affected by THIS element's change */
  children: ImpactNode[];
}
```

### Component API

```tsx
interface ImpactAnalysisViewProps {
  storyId: string;
  /** Pre-existing analysis to display */
  analysisId?: string;
  /** Or provide a change to analyze on mount */
  pendingChange?: ImpactAnalysisRequest;
  /** Max depth to expand the dependency tree */
  maxDepth?: number;
  /** Filter by severity */
  severityFilter?: ('high' | 'medium' | 'low')[];
  /** Callback when user clicks an affected element */
  onElementNavigate?: (elementId: string, elementType: string) => void;
  /** Callback when user approves/dismisses the change */
  onResolve?: (action: 'approve' | 'dismiss') => void;
}
```

### Interactions

| Interaction | Behavior |
|-------------|----------|
| **Click tree node** | Expand/collapse children. Show diff detail for that node. |
| **Hover tree node** | Tooltip: element name, severity, impact description. |
| **Click severity badge** | Filter tree to only show that severity level and above. |
| **Expand all / Collapse all** | Toolbar buttons to expand or collapse the entire tree. |
| **Diff toggle** | Switch between "tree view" (dependency graph) and "list view" (flat sorted by severity). |
| **Click field diff** | Highlight the field change with canonical value (left, faded) vs. projected value (right, highlighted). |
| **Approve / Dismiss** | Action buttons at the top. Approve proceeds with the change; dismiss cancels. |
| **Severity legend** | Color legend: red = high (breaks continuity), yellow = medium (needs review), green = low (cosmetic). |

### Performance Strategy

- **Lazy tree expansion:** Only the root and first level are loaded initially. Deeper levels are fetched on expand via `GET /dependents`.
- **Server-side analysis:** The heavy computation (traversing the entire story graph for cascading impacts) happens server-side. The client only renders the result tree.
- **Virtual tree:** For very deep/wide trees (>200 visible nodes), use `react-window` to virtualize the tree list view.
- **Target:** Instant render for analyses with up to 500 affected elements.

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| **Desktop (≥1024px)** | Two-panel: dependency tree (left, 50%) + diff detail (right, 50%). Summary bar at top. |
| **Tablet (768–1023px)** | Single panel: tree view with expandable inline diffs. Summary bar at top. |
| **Mobile (<768px)** | Single panel: list view (flat, sorted by severity) with expandable inline diffs. Tree view unavailable. |

---

## 6 — Source Material Viewer

### Library Choice

**TipTap (read-only mode)** for text rendering with entity annotations (marks/decorations). TipTap's extension system allows custom inline marks for entity highlights, and its read-only mode prevents editing while keeping the rich rendering.

**Custom video/audio player** built on `<video>` / `<audio>` HTML5 elements + custom controls for time-coded marker display. Using a custom player rather than a library like Video.js to minimize bundle size and fully control the marker timeline UI.

### Data Requirements

**Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/stories/{storyId}/sources` | GET | List all source materials |
| `GET /api/stories/{storyId}/sources/{sourceId}` | GET | Source metadata + content |
| `GET /api/stories/{storyId}/sources/{sourceId}/annotations` | GET | Entity annotations for the source |
| `GET /api/stories/{storyId}/sources/{sourceId}/media-url` | GET | Signed URL for video/audio |
| `GET /api/stories/{storyId}/sources/{sourceId}/markers` | GET | Time-coded markers for media |

**Data shape:**

```ts
interface SourceMaterial {
  id: string;
  title: string;
  type: 'text' | 'transcript' | 'video' | 'audio';
  /** Rich text content (TipTap JSON) for text/transcript types */
  content?: TipTapDocument;
  /** For video/audio */
  mediaUrl?: string;
  mediaDuration?: number; // seconds
  /** Transcript aligned to media timestamps */
  transcript?: TranscriptSegment[];
}

interface EntityAnnotation {
  id: string;
  sourceId: string;
  /** Character offset range in the text content */
  startOffset: number;
  endOffset: number;
  /** For media: time range instead */
  startTime?: number;
  endTime?: number;
  /** The story entity this annotation links to */
  entityId: string;
  entityType: 'character' | 'location' | 'event' | 'artifact' | 'concept';
  entityName: string;
  /** Confidence of auto-detected annotations */
  confidence?: number;
  /** Whether the user has confirmed/rejected this annotation */
  status: 'confirmed' | 'suggested' | 'rejected';
}

interface TranscriptSegment {
  startTime: number;
  endTime: number;
  speaker?: string;
  text: string;
}

interface TimeCodedMarker {
  id: string;
  time: number;
  label: string;
  color: string;
  linkedEntityId?: string;
}
```

### Component API

```tsx
interface SourceMaterialViewerProps {
  storyId: string;
  sourceId: string;
  /** Filter annotations by entity type */
  entityTypeFilter?: EntityAnnotation['entityType'][];
  /** Filter annotations by status */
  annotationStatusFilter?: EntityAnnotation['status'][];
  /** Highlight a specific annotation */
  focusAnnotationId?: string;
  /** Start media at this time */
  initialMediaTime?: number;
  /** Callback when user clicks an entity annotation */
  onEntityNavigate?: (entityId: string, entityType: string) => void;
  /** Callback when user confirms/rejects a suggested annotation */
  onAnnotationResolve?: (annotationId: string, status: 'confirmed' | 'rejected') => void;
  /** Callback when user creates a new annotation (text selection) */
  onAnnotationCreate?: (annotation: { startOffset: number; endOffset: number; text: string }) => void;
}
```

### Interactions

| Interaction | Behavior |
|-------------|----------|
| **Click entity annotation (text)** | Highlight annotation. Show entity detail popover. If media source, jump to the corresponding timestamp. |
| **Hover entity annotation** | Tooltip: entity name, type, confidence score. |
| **Select text** | Show "Create Annotation" floating toolbar with entity search/create. |
| **Right-click annotation** | Context menu: "Confirm", "Reject", "Navigate to entity". |
| **Play/pause media** | Standard media controls. Transcript auto-scrolls to current segment. Current segment highlighted. |
| **Click transcript segment** | Seek media to that segment's start time. |
| **Click time-coded marker** | Seek to marker time. Show marker label popover. |
| **Drag marker** | Adjust marker time position (if not read-only). |
| **Annotation filter toggles** | Toggle entity types on/off. Toggle confirmed/suggested/rejected visibility. |
| **Split pane resize** | Drag the divider between text/transcript pane and media player. |

### Performance Strategy

- **TipTap decorations:** Entity annotations are rendered as TipTap `Decoration` plugins, not inline marks in the document structure. This avoids re-serializing the document when annotations change.
- **Annotation virtualization:** For very long documents (>10,000 words), only compute decorations for the visible viewport range. Use an `IntersectionObserver` on paragraph nodes.
- **Media streaming:** Video/audio loaded via signed URLs with range request support. No client-side buffering beyond the browser's native behavior.
- **Transcript sync:** Binary search on `TranscriptSegment.startTime` for O(log n) lookup during playback.
- **Target:** Smooth scrolling with up to 50,000 words and 5,000 annotations. Media playback with up to 1,000 markers.

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| **Desktop (≥1024px)** | Split pane: text/transcript (left, 60%) + media player (right, 40%). Annotation sidebar as overlay. |
| **Tablet (768–1023px)** | Stacked: media player (top, 30%) + text/transcript (bottom, 70%). |
| **Mobile (<768px)** | Tabbed: "Source" tab (text OR media, auto-selected by type) + "Annotations" tab (list view). Media player as floating mini-player when scrolling text. |

---

## 7 — Pacing Heatmap

### Library Choice

**D3.js heatmap** — D3's `d3-scale` (color scales), `d3-axis`, and `d3-selection` are the standard for custom heatmaps. The grid is rendered as SVG `<rect>` elements with color mapped via `d3-scale-chromatic` sequential/diverging palettes. No wrapper library needed — the heatmap is a straightforward rect grid.

### Data Requirements

**Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/stories/{storyId}/pacing` | GET | Pacing metrics for all scenes/chapters |
| `GET /api/stories/{storyId}/pacing/metrics` | GET | Available metric definitions |

**Data shape:**

```ts
interface PacingData {
  rows: PacingRow[];
  metrics: PacingMetric[];
}

interface PacingRow {
  /** Scene or chapter */
  id: string;
  label: string;
  /** Position in the narrative */
  position: number;
  /** One value per metric */
  values: Record<string, number>; // metricId → value (0–1 normalized)
}

interface PacingMetric {
  id: string;
  label: string;
  /** Color scale for this metric */
  colorScale: 'sequential' | 'diverging';
  /** Description shown in tooltip */
  description: string;
}
```

### Component API

```tsx
interface PacingHeatmapProps {
  storyId: string;
  /** Which metrics to display as columns */
  metricIds?: string[];
  /** Granularity of rows */
  granularity?: 'beat' | 'scene' | 'chapter' | 'episode';
  /** Sort rows by */
  sortBy?: 'position' | string; // 'position' or a metricId
  /** Callback when cell is clicked */
  onCellSelect?: (rowId: string, metricId: string) => void;
  /** Callback when row is clicked */
  onRowSelect?: (rowId: string) => void;
  readOnly?: boolean;
}
```

### Interactions

| Interaction | Behavior |
|-------------|----------|
| **Hover cell** | Tooltip: row label, metric label, raw value, percentile. Cell border highlights. |
| **Click cell** | Select cell. Show detail panel with the scene/chapter content excerpt + metric breakdown. |
| **Click row header** | Select entire row. Navigate to that scene/chapter. |
| **Click column header** | Sort rows by that metric value. Toggle ascending/descending. |
| **Scroll** | Vertical scroll for rows. Sticky column headers and row headers. |
| **Zoom** | Scroll wheel with Ctrl/Cmd: zoom cell size. Useful for long stories with many chapters. |
| **Brush selection** | Click + drag to select a rectangular region. Show aggregate stats for the selection in a floating panel. |
| **Color scale toggle** | Switch between sequential (0 → max) and diverging (below-average → above-average) color mapping per metric. |

### Performance Strategy

- **SVG rect grid:** Each cell is one `<rect>`. For a 200-chapter × 5-metric grid = 1,000 rects — trivial for SVG.
- **Canvas fallback:** For extreme cases (>1,000 rows × >20 metrics = 20,000+ cells), switch to `<canvas>` rendering with D3 scales computing pixel positions.
- **Sticky headers:** Implemented via CSS `position: sticky`, not duplicate DOM elements.
- **Target:** Smooth scroll/zoom with up to 1,000 rows × 20 metrics.

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| **Desktop (≥1024px)** | Full grid visible. Row labels (left, sticky, 200px). Column headers (top, sticky). Color legend at top-right. |
| **Tablet (768–1023px)** | Same grid. Row labels truncated to 120px. Column headers rotate 45°. |
| **Mobile (<768px)** | Transposed layout: metrics as rows, chapters as columns. Horizontal scroll. Or: single-metric view with chapter list, swipe between metrics. |

---

## 8 — Emotional Arc Chart

### Library Choice

**D3.js** — Multi-line chart with potentially complex interactions (character toggles, emotion dimension toggles, time scrubbing, annotations). D3 provides fine-grained control over axes, line rendering, hover behaviors, and brush selection. Recharts was considered but lacks the annotation layer and custom hover crosshair behavior needed here.

### Data Requirements

**Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/stories/{storyId}/emotions` | GET | Emotional data for all characters across scenes |
| `GET /api/stories/{storyId}/emotions/dimensions` | GET | Available emotion dimensions |

**Data shape:**

```ts
interface EmotionalData {
  characters: EmotionalCharacter[];
  dimensions: EmotionDimension[];
}

interface EmotionalCharacter {
  characterId: string;
  characterName: string;
  color: string;
  dataPoints: EmotionDataPoint[];
}

interface EmotionDataPoint {
  /** Narrative position (scene/beat) */
  position: number;
  positionLabel: string;
  /** One value per dimension */
  values: Record<string, number>; // dimensionId → value (-1 to 1)
}

interface EmotionDimension {
  id: string;
  label: string; // "Joy", "Fear", "Anger", "Sadness", "Tension", "Hope"
  /** For diverging display: label for positive and negative ends */
  positiveLabel?: string;
  negativeLabel?: string;
}
```

### Component API

```tsx
interface EmotionalArcChartProps {
  storyId: string;
  /** Which characters to show (all if omitted) */
  characterIds?: string[];
  /** Which emotion dimension to display */
  dimensionId?: string;
  /** Show all dimensions overlaid (small multiples) */
  multiDimensionMode?: boolean;
  /** Narrative range to display */
  positionRange?: [number, number];
  /** Callback when a data point is clicked */
  onDataPointSelect?: (characterId: string, position: number) => void;
  /** Callback when user brushes a range */
  onRangeSelect?: (range: [number, number]) => void;
  readOnly?: boolean;
}
```

### Interactions

| Interaction | Behavior |
|-------------|----------|
| **Hover** | Vertical crosshair at mouse X position. Tooltip shows all character values at that narrative position. Dots appear on each line at the intersection. |
| **Click data point** | Select. Show detail panel with scene context and emotional state description. |
| **Character legend toggle** | Click character name in legend to show/hide their line. |
| **Dimension dropdown** | Switch between emotion dimensions. Lines animate to new values via `d3-transition`. |
| **Multi-dimension mode** | Small multiples: one chart per dimension, stacked vertically, sharing the X axis. Crosshair syncs across all charts. |
| **Brush selection** | Click + drag on X axis to select a narrative range. Zoom into that range. Double-click to reset. |
| **Scroll wheel** | Zoom X axis (narrative position). |
| **Pan** | Click + drag on chart area to pan along X axis. |

### Performance Strategy

- **Line rendering:** Each character × dimension = one `<path>` element using `d3.line()` with `curveCatmullRom` interpolation. 20 characters × 6 dimensions = 120 paths max. SVG handles this easily.
- **Crosshair optimization:** Crosshair position updated via `requestAnimationFrame`, not on every `mousemove`. Intersection points computed via bisect on pre-sorted data.
- **Small multiples:** Each dimension chart is its own `<svg>`. Scroll container virtualizes charts outside viewport (only matters with 10+ dimensions).
- **Target:** Smooth interaction with up to 30 characters, 10 dimensions, 500 positions.

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| **Desktop (≥1024px)** | Single chart (500px height). Legend at top (horizontal, wrapping). Multi-dimension: stacked charts (200px each). |
| **Tablet (768–1023px)** | Same layout. Legend collapses to scrollable horizontal strip. |
| **Mobile (<768px)** | Single dimension, single chart (250px height). Character selector as pills above chart (scrollable). Swipe between dimensions. No multi-dimension mode. |

---

## 9 — Faction / Power Map

### Library Choice

**React Flow** — Combines network graph (factions as nodes, alliances as edges) with hierarchy (characters within factions as child nodes). React Flow's grouping/nesting feature maps naturally to factions containing members. The time slider for allegiance shifts reuses the same pattern as the Character Relationship Map.

### Data Requirements

**Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/stories/{storyId}/factions` | GET | All factions with members |
| `GET /api/stories/{storyId}/factions/alliances` | GET | Inter-faction relationships |
| `GET /api/stories/{storyId}/factions/alliances?at={timestamp}` | GET | Alliances at a specific time |
| `GET /api/stories/{storyId}/factions/power-history` | GET | Power level history for the time slider |

**Data shape:**

```ts
interface FactionNode {
  id: string;
  name: string;
  color: string;
  /** Power level (0–1), maps to node size */
  powerLevel: number;
  /** Leader character ID */
  leaderId?: string;
  members: FactionMember[];
  /** Hierarchical: sub-factions */
  childFactionIds: string[];
}

interface FactionMember {
  characterId: string;
  characterName: string;
  role: string;
  /** Rank within faction, maps to visual position */
  rank: number;
  joinedAt?: StoryTimestamp;
  leftAt?: StoryTimestamp;
}

interface FactionAlliance {
  id: string;
  factionAId: string;
  factionBId: string;
  type: 'alliance' | 'rivalry' | 'vassal' | 'neutral' | 'war';
  strength: number; // 0–1
  validFrom?: StoryTimestamp;
  validTo?: StoryTimestamp;
}

interface PowerHistoryEntry {
  factionId: string;
  timestamp: StoryTimestamp;
  powerLevel: number;
}
```

### Component API

```tsx
interface FactionPowerMapProps {
  storyId: string;
  /** Pin time slider to a specific moment */
  timePosition?: StoryTimestamp;
  /** Show time slider */
  showTimeSlider?: boolean;
  /** Show individual members within faction nodes */
  showMembers?: boolean;
  /** Filter to specific alliance types */
  allianceTypeFilter?: FactionAlliance['type'][];
  /** Layout mode */
  layout?: 'force' | 'hierarchical' | 'radial';
  /** Callback when faction is selected */
  onFactionSelect?: (factionId: string) => void;
  /** Callback when member is clicked */
  onMemberSelect?: (characterId: string) => void;
  readOnly?: boolean;
}
```

### Interactions

| Interaction | Behavior |
|-------------|----------|
| **Scroll wheel** | Zoom in/out. |
| **Click + drag (background)** | Pan. |
| **Click faction node** | Select faction. Expand to show members (if `showMembers` enabled). Show detail panel. |
| **Click member within faction** | Select character. Navigate to character detail. |
| **Hover faction node** | Tooltip: faction name, power level, member count, leader. |
| **Hover alliance edge** | Tooltip: alliance type, strength, duration. |
| **Time slider** | Drag or auto-play. Animates: faction power levels (node size), alliances (edge appear/disappear/change color), member movements (characters moving between factions). |
| **Power chart overlay** | Toggle a small area chart overlaid on each faction node showing power level over time. |
| **Layout toggle** | Switch between force-directed (organic), hierarchical (tree), and radial (center = most powerful). |
| **Right-click faction** | Context menu: "View faction", "Edit", "Show only this faction's network", "Compare power with...". |

### Performance Strategy

- **React Flow grouping:** Factions as parent nodes, members as child nodes. React Flow handles group collapse/expand natively.
- **Viewport culling:** Built-in React Flow behavior — collapsed factions outside viewport don't render members.
- **Time slider snapshots:** Same strategy as Character Relationship Map — pre-computed server-side snapshots, client interpolation.
- **Power chart sparklines:** Rendered as inline SVG within faction nodes, data pre-aggregated.
- **Target:** Smooth interaction with up to 50 factions, 500 members, 200 alliances.

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| **Desktop (≥1024px)** | Full canvas. Detail panel on right (400px). Time slider in toolbar. Power chart overlays enabled. |
| **Tablet (768–1023px)** | Full canvas. Detail as bottom sheet. Time slider below canvas. Power charts as tooltip only. |
| **Mobile (<768px)** | List view with faction cards (expandable to show members). Network graph as opt-in full-screen mode. Time slider as bottom bar. |

---

## 10 — Beat Sheet / Scene Board

### Library Choice

**@hello-pangea/dnd** (Atlassian's `react-beautiful-dnd` fork, actively maintained) — The Kanban board pattern with drag-and-drop between columns is this library's primary use case. It provides keyboard accessibility, screen reader announcements, and smooth drop animations out of the box. `dnd-kit` is the fallback if `@hello-pangea/dnd` introduces issues — it's more flexible but requires more setup for Kanban specifically.

### Data Requirements

**Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/stories/{storyId}/beats` | GET | All beats with full Othelia field data |
| `GET /api/stories/{storyId}/beats/board-config` | GET | Column definitions, card display settings |
| `PUT /api/stories/{storyId}/beats/order` | PUT | Persist new beat order after drag |
| `PATCH /api/stories/{storyId}/beats/{beatId}` | PATCH | Update a single beat |

**Data shape:**

```ts
interface Beat {
  id: string;
  title: string;
  description: string;
  /** Column assignment (e.g., act, status, custom grouping) */
  columnId: string;
  /** Order within column */
  order: number;
  /** Othelia fields */
  type: string; // "Inciting Incident", "Rising Action", "Climax", etc.
  characters: string[];
  location?: string;
  emotionalValence?: number;
  tension?: number;
  pov?: string;
  duration?: string;
  notes?: string;
  tags: string[];
  /** Color coding */
  color?: string;
  /** Status */
  status: 'draft' | 'outlined' | 'written' | 'revised';
}

interface BoardConfig {
  columns: BoardColumn[];
  groupBy: 'act' | 'status' | 'type' | 'custom';
  cardDisplayFields: string[]; // Which Beat fields to show on the card
}

interface BoardColumn {
  id: string;
  label: string;
  color?: string;
  /** Max cards in this column (WIP limit) */
  limit?: number;
}
```

### Component API

```tsx
interface BeatSheetProps {
  storyId: string;
  /** How to group beats into columns */
  groupBy?: 'act' | 'status' | 'type' | 'custom';
  /** Which fields to show on beat cards */
  cardDisplayFields?: string[];
  /** Filter beats */
  characterFilter?: string[];
  tagFilter?: string[];
  statusFilter?: Beat['status'][];
  /** Callback when beat order changes (drag-and-drop) */
  onOrderChange?: (beatId: string, newColumnId: string, newOrder: number) => void;
  /** Callback when beat is selected */
  onBeatSelect?: (beatId: string) => void;
  /** Callback when beat is created */
  onBeatCreate?: (columnId: string) => void;
  /** Callback when beat is edited inline */
  onBeatUpdate?: (beatId: string, updates: Partial<Beat>) => void;
  readOnly?: boolean;
}
```

### Interactions

| Interaction | Behavior |
|-------------|----------|
| **Drag card** | Move beat between columns and reorder within a column. Visual placeholder shows drop position. Fires `onOrderChange`. |
| **Click card** | Select beat. Open detail panel/modal with all Othelia fields. |
| **Double-click card title** | Inline edit beat title. |
| **Click "+" button** | Add new beat to that column. Opens creation dialog. |
| **Hover card** | Elevate card (shadow). Show character avatars and key field previews. |
| **Keyboard drag** | Space to lift, arrow keys to move, Space to drop. `@hello-pangea/dnd` provides this natively. |
| **Column header click** | Collapse/expand column. |
| **Column WIP limit** | If column has a `limit`, show count badge. Highlight column header red when at/over limit. |
| **Minimap** | Toggle a minimap strip at the bottom showing all cards as tiny colored rectangles. Click to scroll to that area. |
| **Card color coding** | Left border color matches `beat.color` or auto-derived from `beat.type`. |
| **Search/filter bar** | Toolbar search. Non-matching cards are dimmed (not hidden) to preserve spatial context. |

### Performance Strategy

- **Flat list rendering:** `@hello-pangea/dnd` uses a flat list per column. Each card is a React component with `React.memo` to prevent re-render on sibling drag.
- **Virtualized columns:** For columns with 50+ cards, use `react-window` within the droppable area. `@hello-pangea/dnd` supports virtual lists via the `react-virtual` integration.
- **Optimistic updates:** Drag-and-drop immediately updates local state. `PUT /beats/order` fires asynchronously. On failure, revert with animation.
- **Card field truncation:** Card body shows only configured `cardDisplayFields`, not all Othelia fields. Full data loads on card select.
- **Target:** Smooth drag-and-drop with up to 500 beats, 20 columns.

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| **Desktop (≥1024px)** | Horizontal Kanban board. All columns visible, horizontal scroll if needed. Cards show 3–4 fields. Minimap visible. |
| **Tablet (768–1023px)** | Horizontal scroll with snapping to columns. Cards show 2 fields. Minimap hidden. |
| **Mobile (<768px)** | Single column view. Swipe between columns (tab bar at top shows column names). Cards show title + status only. Drag-and-drop replaced with "Move to..." action menu. |

---

## 11 — Foreshadowing Web

### Library Choice

**React Flow** — Directed graph where setup nodes connect to payoff nodes. React Flow handles the directed edges, custom node rendering (with setup/payoff styling), and interactive features (click, hover, drag). The orphan/deus-ex-machina detection is data-driven (computed server-side or client-side from the graph structure).

### Data Requirements

**Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/stories/{storyId}/foreshadowing` | GET | All setups and payoffs |
| `GET /api/stories/{storyId}/foreshadowing/orphans` | GET | Setups without payoffs, payoffs without setups |

**Data shape:**

```ts
interface ForeshadowingNode {
  id: string;
  type: 'setup' | 'payoff';
  title: string;
  description: string;
  /** Narrative position */
  position: number;
  positionLabel: string;
  /** Scene/beat this belongs to */
  sceneId: string;
  /** Status for visual coding */
  status: 'connected' | 'orphan-setup' | 'deus-ex-machina';
  characterIds: string[];
  tags: string[];
}

interface ForeshadowingLink {
  id: string;
  setupId: string;
  payoffId: string;
  /** Strength/obviousness of the foreshadowing */
  subtlety: 'obvious' | 'moderate' | 'subtle';
  notes?: string;
}

interface OrphanReport {
  orphanSetups: ForeshadowingNode[]; // setups with no payoff
  deusExMachina: ForeshadowingNode[]; // payoffs with no setup
}
```

### Component API

```tsx
interface ForeshadowingWebProps {
  storyId: string;
  /** Highlight orphans/deus-ex-machina */
  showOrphans?: boolean;
  /** Filter by subtlety level */
  subtletyFilter?: ForeshadowingLink['subtlety'][];
  /** Filter by character */
  characterFilter?: string[];
  /** Layout direction */
  layoutDirection?: 'left-to-right' | 'top-to-bottom';
  /** Callback when node is selected */
  onNodeSelect?: (nodeId: string) => void;
  /** Callback when link is selected */
  onLinkSelect?: (linkId: string) => void;
  /** Callback to navigate to the scene */
  onSceneNavigate?: (sceneId: string) => void;
  /** Callback when user draws a new link (drag from setup to payoff) */
  onLinkCreate?: (setupId: string, payoffId: string) => void;
  readOnly?: boolean;
}
```

### Interactions

| Interaction | Behavior |
|-------------|----------|
| **Scroll wheel** | Zoom in/out. |
| **Click + drag (background)** | Pan. |
| **Click node** | Select. Highlight all links from/to this node. Show detail panel with description, scene link. |
| **Hover node** | Tooltip: title, type (setup/payoff), position, status. Highlight connected nodes. |
| **Hover link** | Tooltip: subtlety level, notes. Highlight both endpoints. |
| **Drag from setup handle to payoff** | Create a new foreshadowing link. Only allows setup → payoff direction. |
| **Click orphan node** | Special highlight (pulsing orange for orphan setups, pulsing red for deus-ex-machina). Suggest: "Create a payoff" / "Create a setup". |
| **Layout toggle** | Switch between left-to-right (narrative flow) and top-to-bottom. Setups always appear before/above payoffs. |
| **Subtlety filter** | Toggle obvious/moderate/subtle links. Edge thickness and dash pattern change by subtlety. |
| **Orphan toggle** | Show/hide orphan indicators (glowing borders, warning badges). |

**Node color coding:**

| Status | Node Style |
|--------|-----------|
| `connected` setup | Blue filled, solid border |
| `connected` payoff | Green filled, solid border |
| `orphan-setup` | Orange filled, dashed border, pulse animation |
| `deus-ex-machina` | Red filled, dashed border, pulse animation |

**Edge styling by subtlety:**

| Subtlety | Edge Style |
|----------|-----------|
| `obvious` | Thick solid line |
| `moderate` | Medium solid line |
| `subtle` | Thin dashed line |

### Performance Strategy

- **Dagre layout:** Positions nodes in a directed acyclic graph layout via `dagre` (same as Causality Graph). Layout computation runs once on data change, not on viewport changes.
- **React Flow viewport culling:** Nodes/edges outside viewport not rendered.
- **Orphan computation:** Simple graph analysis — O(n) scan for nodes with 0 incoming (setup without payoff) or 0 outgoing (payoff without setup) edges. Computed client-side on data load.
- **Target:** Smooth interaction with up to 300 nodes, 500 links.

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| **Desktop (≥1024px)** | Full canvas, left-to-right layout. Detail panel on right (350px). Orphan report panel toggleable. |
| **Tablet (768–1023px)** | Full canvas. Detail as bottom sheet. |
| **Mobile (<768px)** | List view: setups on top, payoffs on bottom, lines connecting them (simplified vertical layout). Orphan badges inline. Tap to expand detail. |

---

## 12 — Causality Graph

### Library Choice

**React Flow with dagre layout** — The causality graph is a DAG (directed acyclic graph). `dagre` computes optimal layered layout for DAGs. React Flow renders the interactive graph with custom nodes (event cards) and edges (typed causality arrows). This combination is the standard approach for interactive DAG visualization in React.

### Data Requirements

**Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/stories/{storyId}/causality` | GET | All causal links between events |
| `GET /api/stories/{storyId}/causality/trace/{eventId}` | GET | Forward and backward trace from a specific event |

**Data shape:**

```ts
interface CausalEvent {
  id: string;
  title: string;
  description: string;
  position: number;
  positionLabel: string;
  characterIds: string[];
  type: string; // "action", "decision", "consequence", "revelation", etc.
}

interface CausalLink {
  id: string;
  causeEventId: string;
  effectEventId: string;
  causalityType: 'direct' | 'indirect' | 'enabling' | 'preventing' | 'motivating';
  description?: string;
  strength: number; // 0–1
}

interface CausalTrace {
  /** The root event traced from */
  rootEventId: string;
  /** Events reachable going forward (effects) */
  forwardTrace: CausalEvent[];
  /** Events reachable going backward (causes) */
  backwardTrace: CausalEvent[];
  /** All links in the trace subgraph */
  links: CausalLink[];
}
```

### Component API

```tsx
interface CausalityGraphProps {
  storyId: string;
  /** Event to trace from (highlights forward/backward paths) */
  traceFromEventId?: string;
  /** Direction of trace highlighting */
  traceDirection?: 'forward' | 'backward' | 'both';
  /** Filter by causality type */
  causalityTypeFilter?: CausalLink['causalityType'][];
  /** Filter by character involvement */
  characterFilter?: string[];
  /** Layout direction */
  layoutDirection?: 'left-to-right' | 'top-to-bottom';
  /** Callback when event is selected */
  onEventSelect?: (eventId: string) => void;
  /** Callback when user draws a new causal link */
  onLinkCreate?: (causeId: string, effectId: string, type: CausalLink['causalityType']) => void;
  /** Callback when user clicks "trace from here" */
  onTraceRequest?: (eventId: string) => void;
  readOnly?: boolean;
}
```

### Interactions

| Interaction | Behavior |
|-------------|----------|
| **Scroll wheel** | Zoom in/out. |
| **Click + drag (background)** | Pan. |
| **Click event node** | Select event. Show detail panel. |
| **Right-click event node** | Context menu: "Trace forward", "Trace backward", "Trace both directions", "View event detail". |
| **Trace mode** | After selecting trace: root event highlighted in gold. Forward path highlighted in blue with animated flow dots along edges. Backward path highlighted in red. Unconnected nodes dimmed. |
| **Hover event node** | Tooltip: title, type, characters involved. Highlight immediate causes (1 step back) and effects (1 step forward). |
| **Hover causal link** | Tooltip: causality type, description, strength. |
| **Drag from handle** | Create new causal link. Direction enforced (can only drag from a cause to an effect — no cycles allowed). |
| **Cycle detection** | If user attempts to create a link that would form a cycle, show error toast: "This would create a circular dependency." Link creation rejected. |
| **Layout toggle** | Left-to-right (default, time flows left → right) or top-to-bottom. |
| **Causality type legend** | Color-coded edge types. Click legend item to filter. |

**Edge styling by causality type:**

| Type | Color | Style |
|------|-------|-------|
| `direct` | `--viz-cat-1` | Thick solid arrow |
| `indirect` | `--viz-cat-2` | Medium dashed arrow |
| `enabling` | `--viz-cat-3` | Medium solid arrow |
| `preventing` | `--viz-danger` | Medium solid arrow with ✕ marker |
| `motivating` | `--viz-cat-5` | Thin dotted arrow |

### Performance Strategy

- **Dagre layout:** Computed once per data change in a web worker. `dagre` handles graphs of 1,000+ nodes efficiently (O(V + E) algorithm).
- **React Flow viewport culling:** Nodes/edges outside viewport not rendered.
- **Trace subgraph:** When tracing, server returns only the relevant subgraph. Client dims (but doesn't remove) non-traced nodes for context.
- **Progressive disclosure:** Initially show only events with at least 2 causal links. "Show all" toggle reveals isolated events.
- **Animated trace:** Flow dots along edges rendered via CSS `@keyframes` on SVG `stroke-dashoffset`. No JavaScript animation loop.
- **Target:** Smooth interaction with up to 500 events, 2,000 causal links.

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| **Desktop (≥1024px)** | Full canvas, left-to-right dagre layout. Detail panel on right (400px). Trace controls in toolbar. |
| **Tablet (768–1023px)** | Full canvas. Detail as bottom sheet. Top-to-bottom layout default (better use of portrait orientation). |
| **Mobile (<768px)** | List view with indentation showing causal depth. Trace results as expandable tree. Tap event to see its causes/effects. Full graph available as opt-in fullscreen mode. |

---

## 13 — Audience Knowledge Map

### Library Choice

**Custom React + D3** — Split view comparing audience knowledge vs. character knowledge is a unique layout that no existing library provides. React manages the two-panel layout and knowledge item lists. D3 handles the Venn diagram / overlap visualization and the timeline scrubber's axis rendering.

### Data Requirements

**Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/stories/{storyId}/knowledge` | GET | All knowledge items |
| `GET /api/stories/{storyId}/knowledge?at={position}` | GET | Knowledge state at a specific narrative position |
| `GET /api/stories/{storyId}/knowledge/gaps` | GET | Dramatic irony instances (audience knows, character doesn't) |

**Data shape:**

```ts
interface KnowledgeItem {
  id: string;
  /** The fact/information */
  content: string;
  category: 'plot' | 'character' | 'world' | 'mystery' | 'relationship';
  /** When the audience learns this */
  audienceRevealed: number; // narrative position
  /** Per-character knowledge. Key = characterId */
  characterKnowledge: Record<string, {
    /** When/whether this character knows */
    knowsAt?: number; // narrative position, undefined = never knows
    /** How they learn it */
    learnedVia?: string;
  }>;
  /** Is this a key mystery/question? */
  isMystery?: boolean;
  /** Is this resolved by end of story? */
  isResolved?: boolean;
  tags: string[];
}

interface DramaticIronyInstance {
  knowledgeItemId: string;
  /** Audience knows but these characters don't */
  unawareCharacters: string[];
  /** Narrative range where the irony is active */
  startPosition: number;
  endPosition?: number; // undefined = ongoing
  /** Tension level this creates */
  tensionLevel: 'high' | 'medium' | 'low';
}
```

### Component API

```tsx
interface AudienceKnowledgeMapProps {
  storyId: string;
  /** Narrative position to view */
  position?: number;
  /** Show the timeline scrubber */
  showTimeline?: boolean;
  /** Character to compare knowledge against */
  compareCharacterId?: string;
  /** Highlight dramatic irony instances */
  showDramaticIrony?: boolean;
  /** Filter by knowledge category */
  categoryFilter?: KnowledgeItem['category'][];
  /** Callback when knowledge item is selected */
  onKnowledgeSelect?: (knowledgeId: string) => void;
  /** Callback when position changes */
  onPositionChange?: (position: number) => void;
  readOnly?: boolean;
}
```

### Interactions

| Interaction | Behavior |
|-------------|----------|
| **Timeline scrubber** | Drag along the narrative axis. Knowledge items fade in/out as they are revealed at each position. |
| **Play button** | Auto-advance through the narrative. Knowledge items animate in as they're revealed. |
| **Click knowledge item** | Select. Show detail: what it is, when audience learns it, which characters know, how they learned it. |
| **Hover knowledge item** | Highlight matching items in the other panel (audience ↔ character). |
| **Character selector** | Dropdown to pick which character's knowledge to compare with audience knowledge. |
| **Venn diagram toggle** | Switch from split-list view to Venn diagram view showing overlap between audience and character knowledge. |
| **Dramatic irony highlights** | Items the audience knows but the selected character doesn't are highlighted with a special badge and border. Tension level shown as color intensity. |
| **Mystery tracker** | Toggle to show only `isMystery` items. Resolved mysteries shown with strikethrough. |
| **Search** | Filter knowledge items by content text. |

### Performance Strategy

- **Filtered rendering:** At any narrative position, only render knowledge items where `audienceRevealed <= position` (for audience panel) and `characterKnowledge[charId].knowsAt <= position` (for character panel). Pre-sort items by reveal position for O(log n) binary search on scrub.
- **Transition animation:** Items fade in/out using CSS `transition: opacity 200ms`. No D3 transition overhead.
- **Venn diagram:** D3 `d3-force` positions items in a two-circle Venn layout. Only recompute on data change, not on scrub.
- **Target:** Smooth scrubbing with up to 1,000 knowledge items, 30 characters.

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| **Desktop (≥1024px)** | Side-by-side: audience knowledge (left) + character knowledge (right). Timeline scrubber at top. Venn diagram as modal overlay. |
| **Tablet (768–1023px)** | Same side-by-side layout. Panels narrower. |
| **Mobile (<768px)** | Tabbed: "Audience" tab + "Character" tab. Timeline scrubber as bottom bar. Venn diagram not available. Dramatic irony shown as badge count on each tab. |

---

## 14 — Writing Surface

### Library Choice

**TipTap** with custom extensions — TipTap (built on ProseMirror) is the standard for rich text editors in React. It supports:
- Multiple document modes via schema switching (prose vs. screenplay).
- Custom inline marks for entity highlighting.
- Extensions for custom toolbars, slash commands, and formatting.
- Collaborative editing via Y.js (for future multiplayer).

### Data Requirements

**Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/stories/{storyId}/documents/{docId}` | GET | Document content (TipTap JSON) |
| `PUT /api/stories/{storyId}/documents/{docId}` | PUT | Save document |
| `POST /api/stories/{storyId}/documents/{docId}/auto-save` | POST | Auto-save (debounced) |
| `GET /api/stories/{storyId}/entities/search?q={query}` | GET | Search entities for inline linking |

**Data shape:**

```ts
interface WritingDocument {
  id: string;
  title: string;
  mode: 'prose' | 'screenplay';
  content: TipTapDocument; // ProseMirror-compatible JSON
  /** Linked beat IDs (this document covers these beats) */
  beatIds: string[];
  wordCount: number;
  lastSavedAt: string;
  version: number;
}

/** Custom TipTap marks for entity references */
interface EntityMark {
  type: 'entityReference';
  attrs: {
    entityId: string;
    entityType: 'character' | 'location' | 'event' | 'artifact';
    entityName: string;
  };
}

/** Screenplay-specific node types */
interface ScreenplayNodes {
  sceneHeading: { attrs: { intExt: 'INT' | 'EXT'; location: string; time: string } };
  action: {};
  characterCue: { attrs: { characterName: string } };
  dialogue: {};
  parenthetical: {};
  transition: { attrs: { type: string } };
}
```

### Component API

```tsx
interface WritingSurfaceProps {
  storyId: string;
  documentId: string;
  /** Prose or screenplay mode */
  mode?: 'prose' | 'screenplay';
  /** Enable entity auto-detection and highlighting */
  entityHighlighting?: boolean;
  /** Auto-save interval in milliseconds (0 to disable) */
  autoSaveInterval?: number;
  /** Callback when content changes */
  onChange?: (content: TipTapDocument) => void;
  /** Callback when entity reference is clicked */
  onEntityNavigate?: (entityId: string, entityType: string) => void;
  /** Callback when mode changes */
  onModeChange?: (mode: 'prose' | 'screenplay') => void;
  readOnly?: boolean;
}
```

### Interactions

| Interaction | Behavior |
|-------------|----------|
| **Typing** | Standard rich text editing. Prose mode: paragraphs, headings, lists, bold/italic. Screenplay mode: enforces screenplay formatting (scene headings, action, dialogue, etc.). |
| **Entity highlight** | Recognized entity names inline-highlighted with a colored underline. Click to navigate to entity. Hover for tooltip. |
| **`@` mention** | Type `@` to open entity search dropdown. Select to insert entity reference mark. |
| **`/` slash command** | Slash commands: `/scene` (insert scene heading), `/character` (insert character cue), `/transition`, `/note`, `/beat` (link to beat). |
| **Mode toggle** | Switch between prose and screenplay. Content is reformatted (best-effort) to the target schema. Confirmation dialog warns about potential formatting loss. |
| **Toolbar** | Formatting toolbar: bold, italic, heading levels (prose) or scene heading, action, dialogue, parenthetical, transition (screenplay). |
| **Word count** | Live word count in the status bar. |
| **Auto-save** | Debounced auto-save (default 3 seconds after last keystroke). Status indicator: "Saved" / "Saving..." / "Unsaved changes". |
| **Ctrl/Cmd + S** | Manual save. |
| **Find and replace** | Ctrl/Cmd + F opens find bar. Ctrl/Cmd + H opens find and replace. |

### Performance Strategy

- **ProseMirror transaction batching:** TipTap/ProseMirror batches DOM updates within a single transaction. No custom optimization needed for normal editing.
- **Entity detection:** Runs as a TipTap plugin on document changes. Debounced to 500ms after last edit. Uses a pre-built trie of entity names for O(n) scanning (n = document length). Only scans the changed paragraph, not the entire document.
- **Large document support:** ProseMirror handles documents up to ~100,000 words without performance issues. Beyond that, consider document splitting.
- **Auto-save:** Sends only the delta (ProseMirror `Step` objects) rather than the full document, reducing payload size.
- **Target:** Smooth editing with documents up to 100,000 words, 500 entity references.

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| **Desktop (≥1024px)** | Centered content column (max 720px). Formatting toolbar at top (sticky). Word count + save status in bottom bar. Entity sidebar toggleable on right. |
| **Tablet (768–1023px)** | Same centered layout. Toolbar collapses to essential formatting. Entity sidebar as bottom sheet. |
| **Mobile (<768px)** | Full-width content. Toolbar as floating bottom bar (above keyboard). Entity highlighting visible but sidebar/navigation disabled. Focus on writing flow. |

---

## 15 — Treatment View

### Library Choice

**TipTap (read-only with override editing)** — The treatment is an auto-generated document from beat data, rendered as rich text. TipTap's read-only mode displays the generated content. Specific sections can be made editable (override mode) by toggling `editable` on individual nodes via a custom extension. This dual read-only/editable approach is a natural fit for TipTap's architecture.

### Data Requirements

**Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/stories/{storyId}/treatment` | GET | Auto-generated treatment document |
| `GET /api/stories/{storyId}/treatment/overrides` | GET | User overrides for specific sections |
| `PUT /api/stories/{storyId}/treatment/overrides/{sectionId}` | PUT | Save an override for a section |
| `DELETE /api/stories/{storyId}/treatment/overrides/{sectionId}` | DELETE | Remove override, revert to auto-generated |

**Data shape:**

```ts
interface Treatment {
  id: string;
  storyId: string;
  title: string;
  generatedAt: string;
  sections: TreatmentSection[];
}

interface TreatmentSection {
  id: string;
  beatId: string;
  beatTitle: string;
  /** Auto-generated prose summary of the beat */
  generatedContent: TipTapDocument;
  /** User's manual override (if any) */
  override?: TipTapDocument;
  /** Whether the override is active */
  isOverridden: boolean;
  order: number;
}
```

### Component API

```tsx
interface TreatmentViewProps {
  storyId: string;
  /** Callback when user edits an override */
  onOverrideSave?: (sectionId: string, content: TipTapDocument) => void;
  /** Callback when user reverts to auto-generated */
  onOverrideRevert?: (sectionId: string) => void;
  /** Callback when beat title is clicked */
  onBeatNavigate?: (beatId: string) => void;
  /** Callback to regenerate the full treatment */
  onRegenerate?: () => void;
  readOnly?: boolean;
}
```

### Interactions

| Interaction | Behavior |
|-------------|----------|
| **Scroll** | Standard document scrolling. Table of contents sidebar with active section highlighting. |
| **Click section** | Select section. Show action bar: "Edit override", "Revert to generated", "Go to beat". |
| **Edit override** | Click "Edit" on a section. That section becomes editable (TipTap switches to editable mode for that node). All other sections remain read-only. |
| **Save override** | Click "Save" or Ctrl/Cmd + S while editing. Override is persisted. Section shows a small "Overridden" badge. |
| **Revert override** | Click "Revert". Confirmation dialog. Section returns to auto-generated content. |
| **Regenerate** | "Regenerate Treatment" button. Regenerates all non-overridden sections from current beat data. Shows diff of changes before applying. |
| **Print** | Ctrl/Cmd + P or Export button. Generates a clean PDF via `jsPDF` with proper formatting (title page, page numbers, section headings). |
| **Table of contents** | Sidebar listing all sections. Click to scroll. Overridden sections marked with a badge. |
| **Drag to reorder** | Drag sections to change order (this is an override of the default beat order). |

### Performance Strategy

- **Section-level rendering:** Each section is an independent TipTap instance (read-only). Only the section being edited initializes the full editor. This avoids a single massive editor for the entire treatment.
- **Virtualized sections:** For treatments with 100+ sections, use `IntersectionObserver` to only mount TipTap instances for visible sections.
- **Override diffing:** When regenerating, compute diffs server-side using `diff-match-patch`. Show diffs as TipTap decorations (green for additions, red for removals).
- **PDF generation:** Use `jsPDF` with HTML rendering plugin. For treatments >50 pages, generate server-side via Puppeteer to avoid client memory issues.
- **Target:** Smooth scrolling and editing with up to 200 sections.

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| **Desktop (≥1024px)** | Centered content (max 720px). Table of contents sidebar (left, 250px, sticky). Override action bar as floating toolbar on selected section. |
| **Tablet (768–1023px)** | Centered content. Table of contents as collapsible hamburger. |
| **Mobile (<768px)** | Full-width content. Table of contents as top dropdown. Override editing in full-screen mode. Print generates PDF server-side and downloads. |

---

## Appendix A: Dependency Summary

| Library | Version | Used By | Bundle Size (gzip) |
|---------|---------|---------|-------------------|
| `vis-timeline` | ^7.7 | Dual Timeline | ~120 KB |
| `@xyflow/react` (React Flow) | ^12 | Relationship Map, Mind Map, Faction Map, Foreshadowing Web, Causality Graph | ~45 KB |
| `@cosmograph/cosmos` | ^2 | Relationship Map (100+ nodes) | ~80 KB |
| `d3` (modular imports) | ^7 | Arc Diagram, Impact Analysis, Pacing Heatmap, Emotional Arc Chart, Audience Knowledge Map | ~30 KB (tree-shaken) |
| `@tiptap/react` + extensions | ^2 | Source Material Viewer, Writing Surface, Treatment View | ~60 KB |
| `@hello-pangea/dnd` | ^16 | Beat Sheet / Scene Board | ~30 KB |
| `dagre` | ^0.8 | Causality Graph, Foreshadowing Web | ~10 KB |
| `html-to-image` | ^1 | Export (PNG) for React Flow visualizations | ~5 KB |
| `jspdf` | ^2 | PDF export | ~90 KB (lazy-loaded) |
| `canvg` | ^4 | SVG → PNG conversion | ~50 KB (lazy-loaded) |

**Total visualization bundle (eager):** ~295 KB gzip (React Flow, D3, TipTap, hello-pangea).
**Lazy-loaded on demand:** ~220 KB gzip (vis-timeline, cosmograph, jsPDF, canvg).

Each visualization component is code-split via dynamic `import()` and loaded only when the user navigates to that view.

## Appendix B: Shared Types

```ts
/** Reused across multiple visualizations */
interface StoryTimestamp {
  calendarId: string;
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
}

type TipTapDocument = Record<string, any>; // ProseMirror JSON schema

interface FilterValue {
  type: 'multi-select';
  values: string[];
} | {
  type: 'range';
  min: number;
  max: number;
} | {
  type: 'date-range';
  start: StoryTimestamp;
  end: StoryTimestamp;
} | {
  type: 'toggle';
  enabled: boolean;
} | {
  type: 'search';
  query: string;
}
```

## Appendix C: Accessibility

All visualizations comply with WCAG 2.1 AA:

- **Keyboard navigation:** Every interactive element is reachable via Tab. Graph nodes navigable via arrow keys when focused.
- **Screen reader:** All visualizations provide an `aria-label` on the container and `aria-roledescription="visualization"`. Data tables as alternative representation available via "View as table" toggle.
- **Color:** No information is encoded by color alone — always paired with shape, pattern, or label. Categorical palette tested with Coblis color blindness simulator.
- **Motion:** `prefers-reduced-motion` media query disables all animations (transitions, time slider auto-play, trace flow dots).
- **Focus indicators:** Visible focus ring (2px solid `--viz-accent`) on all interactive elements.
