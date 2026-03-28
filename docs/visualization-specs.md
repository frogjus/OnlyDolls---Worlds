# StoryForge Visualization Specifications

> Comprehensive build spec for all 15 visualization components.
> This document is the single source of truth for the frontend team.

---

## Table of Contents

1. [Shared Infrastructure](#shared-infrastructure)
2. [Color System and Theming](#color-system-and-theming)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Visualization 1: Dual Timeline View](#1-dual-timeline-view)
5. [Visualization 2: Character Relationship Map](#2-character-relationship-map)
6. [Visualization 3: Arc Diagram](#3-arc-diagram)
7. [Visualization 4: Mind Map / World Map](#4-mind-map--world-map)
8. [Visualization 5: Impact Analysis View](#5-impact-analysis-view)
9. [Visualization 6: Source Material Viewer](#6-source-material-viewer)
10. [Visualization 7: Pacing Heatmap](#7-pacing-heatmap)
11. [Visualization 8: Emotional Arc Chart](#8-emotional-arc-chart)
12. [Visualization 9: Faction / Power Map](#9-faction--power-map)
13. [Visualization 10: Beat Sheet / Scene Board](#10-beat-sheet--scene-board)
14. [Visualization 11: Foreshadowing Web](#11-foreshadowing-web)
15. [Visualization 12: Causality Graph](#12-causality-graph)
16. [Visualization 13: Audience Knowledge Map](#13-audience-knowledge-map)
17. [Visualization 14: Writing Surface](#14-writing-surface)
18. [Visualization 15: Treatment View](#15-treatment-view)
19. [WebGL Fallback Strategy](#webgl-fallback-strategy)
20. [Animation and Transition Patterns](#animation-and-transition-patterns)
21. [Responsive Behavior](#responsive-behavior)

---

## Shared Infrastructure

### Common Wrapper Component

Every visualization is wrapped in `<VisualizationShell>`, which provides:

```
src/components/visualizations/shared/VisualizationShell.tsx
```

**Responsibilities:**
- Renders the standard toolbar area (top bar) and optional sidebar filter panel (right side).
- Manages loading, empty, and error states via a `status` prop.
- Provides the container `<div>` that visualization libraries render into, with `ref` forwarding.
- Handles full-screen toggle (Escape to exit).
- Exposes an `onExportImage` callback that captures the visualization container to PNG/SVG via `html-to-image`.

**Props interface (TypeScript):**

```ts
interface VisualizationShellProps {
  title: string;
  status: 'loading' | 'empty' | 'error' | 'ready';
  errorMessage?: string;
  emptyMessage?: string;
  toolbar?: React.ReactNode;       // slot for viz-specific toolbar buttons
  filterPanel?: React.ReactNode;   // slot for right-side filter panel
  onExportImage?: () => void;
  children: React.ReactNode;       // the visualization canvas
}
```

### Shared Filter Panel

```
src/components/visualizations/shared/FilterPanel.tsx
```

A collapsible right-side panel (280px wide, slides in/out) used across multiple visualizations. Contains:

- **Character multi-select** -- dropdown populated from `GET /api/worlds/{worldId}/characters`. Chips display selected names. Supports type-ahead search.
- **Arc multi-select** -- dropdown from `GET /api/worlds/{worldId}/arcs`.
- **Time period range** -- two date/event pickers for `valid_from` / `valid_to`. Uses the world's CalendarSystem if configured, otherwise standard dates.
- **Tag filter** -- free-text tag chips with autocomplete from existing tags.
- **Star rating filter** -- clickable 1-5 star bar, filters to >= selected rating.
- **Structure beat filter** -- dropdown of beats from the active StructureTemplate.
- **Reset all filters** button (bottom of panel, destructive red outline).

Each visualization declares which filter fields it uses. The panel only renders those fields.

### Shared Time Slider

```
src/components/visualizations/shared/TimeSlider.tsx
```

A horizontal range slider used by Character Relationship Map, Faction/Power Map, and Audience Knowledge Map.

- Renders below the visualization canvas.
- Tick marks correspond to scenes, episodes, or chapters depending on zoom level.
- Play/pause button for auto-advance animation (configurable speed: 0.5x, 1x, 2x, 4x).
- Current position label shows the scene/event name and narrative time.
- Keyboard: Left/Right arrows step one unit. Shift+Left/Right jumps 10 units. Space toggles play/pause.
- Fires `onTimeChange(sceneIndex: number)` callback.

### Shared Zoom Controls

```
src/components/visualizations/shared/ZoomControls.tsx
```

Floating button group (bottom-right corner of canvas):

- Zoom in (+), Zoom out (-), Fit to view (expand icon), 100% reset.
- Displays current zoom percentage.
- Mouse wheel zoom is handled by the individual library (D3 zoom behavior, React Flow's built-in zoom, Vis.js zoom).
- Pinch-to-zoom on touch devices.

### Export-to-Image Utility

```
src/lib/utils/export-image.ts
```

- Uses `html-to-image` library to capture the visualization container DOM node.
- Supports PNG (default) and SVG output.
- Strips interactive controls (toolbars, filter panels) from the export.
- Adds a small "StoryForge" watermark in the bottom-right of exported images.
- Triggered via the download icon button in the VisualizationShell toolbar.

---

## Color System and Theming

### Base Palette

All visualization colors derive from CSS custom properties defined in the global theme. This ensures dark mode compatibility.

```css
/* Light mode defaults */
--viz-bg: #ffffff;
--viz-bg-secondary: #f8fafc;
--viz-border: #e2e8f0;
--viz-text-primary: #0f172a;
--viz-text-secondary: #64748b;
--viz-text-muted: #94a3b8;
--viz-grid-line: #f1f5f9;

/* Dark mode overrides applied via .dark class */
--viz-bg: #0f172a;
--viz-bg-secondary: #1e293b;
--viz-border: #334155;
--viz-text-primary: #f8fafc;
--viz-text-secondary: #94a3b8;
--viz-text-muted: #64748b;
--viz-grid-line: #1e293b;
```

### Categorical Color Scales

Used for arcs, characters, factions, and any multi-series data.

**Primary categorical palette (12 colors):**

| Index | Name | Hex | Usage |
|-------|------|-----|-------|
| 0 | Indigo | `#6366f1` | Primary arc / default |
| 1 | Rose | `#f43f5e` | Conflict / antagonist |
| 2 | Amber | `#f59e0b` | Warning / setup without payoff |
| 3 | Emerald | `#10b981` | Resolution / positive |
| 4 | Sky | `#0ea5e9` | Information / knowledge |
| 5 | Violet | `#8b5cf6` | Thematic / symbolic |
| 6 | Orange | `#f97316` | Energy / action |
| 7 | Teal | `#14b8a6` | Secondary positive |
| 8 | Pink | `#ec4899` | Emotional / relationship |
| 9 | Lime | `#84cc16` | Growth / transformation |
| 10 | Cyan | `#06b6d4` | Auxiliary |
| 11 | Fuchsia | `#d946ef` | Auxiliary |

When more than 12 categories exist, cycle the palette with reduced opacity (80%, 60%) for the second and third cycles.

### Sequential Color Scales

Used for heatmaps, intensity values, tension levels.

- **Cool-to-hot**: `#dbeafe` (low) -> `#3b82f6` (mid) -> `#dc2626` (high). 9-step gradient.
- **Neutral-to-intense**: `#f1f5f9` (zero) -> `#6366f1` (max). 7-step gradient.

### Severity Colors

Used for Impact Analysis, Consistency Checker, and contradiction flags.

| Severity | Color | Hex |
|----------|-------|-----|
| Critical / breaking | Red | `#dc2626` |
| Warning / potential issue | Amber | `#f59e0b` |
| Safe / no impact | Green | `#16a34a` |
| Info / neutral | Blue | `#3b82f6` |

### Relationship Edge Colors

| Type | Color | Hex | Dash pattern |
|------|-------|-----|-------------|
| Family | Rose | `#f43f5e` | Solid |
| Romantic | Pink | `#ec4899` | Solid |
| Alliance | Emerald | `#10b981` | Solid |
| Rivalry | Orange | `#f97316` | Dashed (6,4) |
| Mentor/Student | Indigo | `#6366f1` | Solid |
| Conflict | Red | `#dc2626` | Dashed (6,4) |
| Professional | Sky | `#0ea5e9` | Dotted (2,4) |
| Custom | User-defined | -- | Solid |

### Emotional Dimension Colors

| Emotion | Color | Hex |
|---------|-------|-----|
| Joy | Amber | `#f59e0b` |
| Grief | Indigo | `#6366f1` |
| Anger | Red | `#dc2626` |
| Fear | Violet | `#8b5cf6` |
| Hope | Emerald | `#10b981` |
| Surprise | Cyan | `#06b6d4` |

### Causality Edge Colors

| Type | Color | Hex |
|------|-------|-----|
| Physical | Sky | `#0ea5e9` |
| Motivational | Amber | `#f59e0b` |
| Psychological | Violet | `#8b5cf6` |
| Enabling | Emerald | `#10b981` |

### Typography in Visualizations

- **Node labels**: `Inter`, 12px, `--viz-text-primary`, truncated with ellipsis at 120px width. Full text on hover tooltip.
- **Edge labels**: `Inter`, 10px, `--viz-text-secondary`, placed at edge midpoint, rotated to follow edge angle.
- **Axis labels**: `Inter`, 11px, `--viz-text-secondary`.
- **Axis titles**: `Inter`, 13px, semi-bold, `--viz-text-primary`.
- **Tooltip titles**: `Inter`, 13px, semi-bold, `--viz-text-primary`.
- **Tooltip body**: `Inter`, 12px, `--viz-text-secondary`.
- **Chart titles**: Not rendered in the canvas -- the VisualizationShell title bar handles this.

---

## Data Flow Architecture

### Pattern: API -> Zustand Store -> Visualization Component

Every visualization follows the same data pipeline:

```
[API Route] --> [React Query / SWR fetch] --> [Zustand Store] --> [React Component] --> [Library Renderer]
```

**Step 1: API route** returns typed JSON from Prisma queries. All endpoints are scoped by `worldId`.

**Step 2: Data-fetching hook** (one per visualization, colocated in the component file or a sibling `use-*.ts` file) calls the API via `fetch` wrapped in React Query (`@tanstack/react-query`). Manages caching, refetching, and stale-while-revalidate.

**Step 3: Zustand store** holds the transformed/filtered visualization state. Each visualization gets its own store slice under `src/stores/`. The store performs:
- Data transformation from API shape to library-specific shape (e.g., converting Prisma `Character[]` to React Flow `Node[]`).
- Filter application (the store holds active filter state and derives the filtered dataset).
- Selection state (which node/edge/item is selected, hovered).

**Step 4: React component** reads from the store via `useStore()` selectors and passes data to the library renderer.

**Step 5: Library renderer** (D3 `useEffect` bindings, React Flow `<ReactFlow>`, Vis.js Timeline instance) renders the visual output.

### Store Structure

```
src/stores/
  timeline-store.ts         # Dual Timeline
  character-graph-store.ts  # Character Relationship Map
  arc-diagram-store.ts      # Arc Diagram
  mind-map-store.ts         # Mind Map
  impact-store.ts           # Impact Analysis
  source-viewer-store.ts    # Source Material Viewer
  pacing-store.ts           # Pacing Heatmap
  emotional-arc-store.ts    # Emotional Arc Chart
  faction-map-store.ts      # Faction/Power Map
  beat-sheet-store.ts       # Beat Sheet / Scene Board
  foreshadowing-store.ts    # Foreshadowing Web
  causality-store.ts        # Causality Graph
  knowledge-store.ts        # Audience Knowledge Map
  writing-surface-store.ts  # Writing Surface
  treatment-store.ts        # Treatment View
```

Each store exports:
- State interface (typed)
- Actions (setFilters, setSelection, setZoomLevel, etc.)
- Derived selectors (filteredNodes, filteredEdges, etc.)

### API Endpoints Referenced by Visualizations

| Endpoint | Used By | Returns |
|----------|---------|---------|
| `GET /api/worlds/{id}/events` | Dual Timeline, Causality Graph | Event[] with fabula_position, sjuzhet_position |
| `GET /api/worlds/{id}/characters` | Character Map, Filter Panel, Beat Sheet | Character[] with relationships[] |
| `GET /api/worlds/{id}/relationships?time={sceneId}` | Character Map, Faction Map | Relationship[] filtered by temporal scope |
| `GET /api/worlds/{id}/arcs` | Arc Diagram, Filter Panel | Arc[] with arc_phases[] |
| `GET /api/worlds/{id}/scenes` | Timeline, Beat Sheet, Pacing, Source Viewer | Scene[] with beats[], value_changes[] |
| `GET /api/worlds/{id}/beats` | Beat Sheet, Treatment View | Beat[] ordered by sjuzhet_position |
| `GET /api/worlds/{id}/structure-mappings?template={id}` | Arc Diagram, Beat Sheet | StructureMapping[] linking scenes to template beats |
| `GET /api/worlds/{id}/factions` | Faction Map | Faction[] with allegiances[] |
| `GET /api/worlds/{id}/pacing-metrics` | Pacing Heatmap | PacingMetric[] per scene |
| `GET /api/worlds/{id}/emotional-states` | Emotional Arc Chart | EmotionalState[] per character per scene |
| `GET /api/worlds/{id}/setup-payoffs` | Foreshadowing Web | SetupPayoff[] with event references |
| `GET /api/worlds/{id}/causal-relations` | Causality Graph | CausalRelation[] with typed edges |
| `GET /api/worlds/{id}/audience-knowledge` | Audience Knowledge Map | AudienceKnowledge[] per scene |
| `GET /api/worlds/{id}/source-materials/{id}` | Source Material Viewer | SourceMaterial with parsed_text, annotations[] |
| `GET /api/worlds/{id}/canon/branches` | Impact Analysis | Branch[] with diff data |
| `POST /api/worlds/{id}/whatif/simulate` | Impact Analysis | ImpactResult with affected entities |

---

## 1. Dual Timeline View

### Purpose

Solves the fundamental narratological problem of visualizing the difference between **fabula** (the chronological order in which events actually occur in the story world) and **sjuzhet** (the order in which the narrative presents events to the audience). This is essential for stories that use flashbacks, flash-forwards, in medias res, non-linear storytelling, or parallel timelines. Writers need to see both simultaneously to manage pacing, dramatic irony, and information reveal order.

### Library

**Vis.js Timeline** (`vis-timeline`) -- primary rendering engine. Vis.js is purpose-built for interactive timelines with items, groups (lanes), and range-based zoom. It handles the horizontal scrolling, item placement, and group management natively.

D3.js is used only for the **connecting lines** drawn on a `<svg>` overlay between the two Vis.js instances.

### Component

```
src/components/visualizations/DualTimeline.tsx
```

**Page route:** `src/app/(dashboard)/world/[id]/timeline/page.tsx`

### Data Requirements

**Primary endpoint:** `GET /api/worlds/{worldId}/events?include=characters,locations,arcs`

**Response shape:**
```ts
interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  fabula_position: number;       // chronological index (or CalendarSystem date)
  fabula_start: string;          // ISO datetime or custom calendar timestamp
  fabula_end?: string;
  sjuzhet_position: number;      // narrative order index
  sjuzhet_start?: string;
  sjuzhet_end?: string;
  event_type: 'action' | 'dialogue' | 'discovery' | 'transformation' | 'revelation' | 'decision';
  characters: { id: string; name: string }[];
  location?: { id: string; name: string };
  arc?: { id: string; name: string; color: string };
  scene_id?: string;
  act_label?: string;            // "Act 1", "Season 2 Episode 5", etc.
}
```

**Secondary endpoint:** `GET /api/worlds/{worldId}/calendar-system` -- returns CalendarSystem config if the world uses a custom calendar (fantasy/sci-fi).

**Store:** `src/stores/timeline-store.ts`

Store transforms API events into two separate `vis.DataSet` arrays (fabula items, sjuzhet items) and maintains:
- `activeLanes: 'character' | 'arc' | 'location'` -- determines grouping
- `zoomLevel: 'series' | 'season' | 'episode' | 'scene' | 'beat'`
- `selectedEventId: string | null`
- `filterState: { characters: string[]; arcs: string[]; timeRange: [start, end] }`
- `connectionLines: { eventId: string; fabulaX: number; fabulaY: number; sjuzhetX: number; sjuzhetY: number }[]` -- recalculated on scroll/zoom

### Visual Design

**Layout:**
- Full width of the visualization container.
- Two Vis.js Timeline instances stacked vertically with a 60px gap between them.
- Top timeline labeled "Fabula (Chronological Truth)" with a subtle header bar.
- Bottom timeline labeled "Sjuzhet (Narrative Order)" with a subtle header bar.
- The 60px gap contains SVG-rendered curved connecting lines (bezier curves) linking the same event across both timelines.

**Event items:**
- Rendered as rounded rectangles (border-radius 6px) within the timeline.
- Width proportional to event duration (or fixed 120px for point events).
- Background color from the event's `arc.color` (from the categorical palette).
- Left border (4px) colored by event_type:
  - action: `#f97316` (orange)
  - dialogue: `#0ea5e9` (sky)
  - discovery: `#f59e0b` (amber)
  - transformation: `#8b5cf6` (violet)
  - revelation: `#dc2626` (red)
  - decision: `#6366f1` (indigo)
- Text inside item: event title (12px, truncated). Character icons (16px avatar circles) stacked right.

**Lanes (groups):**
- When grouped by character: one horizontal lane per character, labeled with character name and small avatar on the left.
- When grouped by arc: one lane per story arc, labeled with arc name and color swatch.
- When grouped by location: one lane per location, labeled with location name.
- Lane height: min 40px, expands to fit stacked items.

**Connecting lines:**
- SVG bezier curves drawn on an absolutely positioned `<svg>` overlay spanning the gap between the two timelines.
- Line color matches the event's arc color at 60% opacity.
- Line width: 1.5px, increases to 2.5px when the connected event is hovered or selected.
- Dashed pattern for flashback connections (sjuzhet position earlier than fabula position). Solid for flash-forwards and in-order events.

**Zoom levels:**
- Series: shows seasons as items, years on axis.
- Season: shows episodes as items, months/episode numbers on axis.
- Episode: shows scenes as items, scene numbers on axis.
- Scene: shows beats as items within each scene group.
- Beat: shows individual beat details, zoomed to single scene width.

### Interactions

| Action | Behavior |
|--------|----------|
| Click event item | Selects event. Highlights in both timelines. Shows detail panel (right drawer) with full event data, linked characters, location, narrative codes. Connecting line becomes bold. |
| Double-click event item | Opens the event's associated scene in the Writing Surface (`/world/{id}/write?scene={sceneId}`). |
| Hover event item | Tooltip shows: title, characters, location, event_type badge. Connecting line highlights. |
| Drag event (sjuzhet only) | Reorders sjuzhet position. Fabula timeline is read-only (chronological truth). Drop triggers `PATCH /api/worlds/{id}/events/{eventId}` to update `sjuzhet_position`. Recalculates all connecting lines. |
| Mouse wheel | Zooms timeline (both in sync). Ctrl+wheel zooms only the hovered timeline independently. |
| Click+drag on empty area | Pans the timeline horizontally. Both timelines scroll in sync by default. Hold Alt to scroll independently. |
| Click lane label | Expands/collapses that lane. |
| Ctrl+click multiple events | Multi-select. Connecting lines highlight for all selected. |

### Controls

**Toolbar (top bar):**
- **Lane grouping toggle**: 3-button segmented control: "Characters" | "Arcs" | "Locations".
- **Zoom level selector**: dropdown with options: Series, Season, Episode, Scene, Beat.
- **Sync lock toggle**: lock/unlock icon. When locked (default), both timelines scroll and zoom together. When unlocked, they scroll independently.
- **Fit to view**: button that auto-zooms to show all events.
- **Export image**: download button.

**Filter panel (right side):**
- Character multi-select.
- Arc multi-select.
- Event type checkboxes (action, dialogue, discovery, transformation, revelation, decision).
- Time range picker.
- Reset filters button.

### States

| State | Display |
|-------|---------|
| Loading | VisualizationShell shows a skeleton: two horizontal bars with shimmer animation, 6 placeholder event rectangles each. |
| Empty | Centered illustration (empty timeline icon) with text: "No events in this story world yet. Add events from the Beat Sheet or import source material." CTA button: "Go to Beat Sheet". |
| Error | Red banner at top of shell: "Failed to load timeline data. {errorMessage}". Retry button. |
| Populated | Full dual timeline with events and connecting lines. |

### Performance

- **Virtualization**: Vis.js Timeline natively virtualizes off-screen items. Only items within the visible time range + 200px buffer are rendered to DOM.
- **Large worlds (1000+ events)**: Enable clustering. Events within a narrow time range at low zoom levels collapse into a cluster badge showing count. Click to expand.
- **Connecting lines**: Recalculated on `requestAnimationFrame` during scroll/zoom, not on every pixel. Debounce: 16ms.
- **Initial load**: Fetch only events within the default visible time range. Lazy-load more on scroll via `GET /api/worlds/{id}/events?from={}&to={}`.

### Accessibility

- All event items have `role="button"` and `aria-label="{event title}, {event_type}, characters: {names}"`.
- Lane groups have `role="group"` with `aria-label="{lane name} lane"`.
- Keyboard: Tab moves between events in sjuzhet order. Arrow keys move between lanes. Enter selects. Escape deselects.
- Connecting lines have `aria-hidden="true"` (decorative; the relationship is conveyed by the event appearing in both timelines).
- High contrast mode: connecting lines become 100% opacity, event borders become 6px.
- Screen reader: announces "Event {title} appears at chronological position {n} and narrative position {m}" when focused.

---

## 2. Character Relationship Map

### Purpose

Visualizes the network of character relationships as an interactive graph. Solves the problem of understanding complex character webs (who knows whom, alliances, rivalries, family trees) and critically, how those relationships **evolve over time**. A relationship between two characters in Act 1 may be fundamentally different from their relationship in Act 3. The time slider makes this evolution visible.

### Library

**React Flow** (`@xyflow/react`) -- primary rendering engine. React Flow provides a mature, performant node-graph UI with built-in pan/zoom, selection, minimap, and extensive customization via custom nodes and edges.

**Fallback for 500+ characters**: `@cosmograph/cosmos` (WebGL GPU-accelerated renderer). See [WebGL Fallback Strategy](#webgl-fallback-strategy).

### Component

```
src/components/visualizations/CharacterGraph.tsx
```

Supporting files:
```
src/components/visualizations/character-graph/CharacterNode.tsx    # Custom React Flow node
src/components/visualizations/character-graph/RelationshipEdge.tsx # Custom React Flow edge
src/components/visualizations/character-graph/CharacterDetail.tsx  # Right drawer detail panel
```

**Page route:** `src/app/(dashboard)/world/[id]/characters/page.tsx`

### Data Requirements

**Primary endpoint:** `GET /api/worlds/{worldId}/characters?include=relationships`

**Response shape:**
```ts
interface CharacterNode {
  id: string;
  name: string;
  aliases: string[];
  avatar_url?: string;
  importance: number;          // 1-10 scale, determines node size
  screen_time: number;         // total scenes appeared in
  faction_id?: string;
  faction_name?: string;
  status: 'alive' | 'dead' | 'unknown';
}

interface CharacterRelationship {
  id: string;
  source_character_id: string;
  target_character_id: string;
  type: 'family' | 'romantic' | 'alliance' | 'rivalry' | 'mentor_student' | 'conflict' | 'professional' | 'custom';
  custom_label?: string;
  weight: number;              // 1-10, determines edge thickness
  valid_from_scene_id?: string;
  valid_to_scene_id?: string;
  description?: string;
}
```

**Time-scoped endpoint:** `GET /api/worlds/{worldId}/relationships?at_scene={sceneId}` -- returns only relationships active at that scene.

**Store:** `src/stores/character-graph-store.ts`

Store transforms API data into React Flow `Node[]` and `Edge[]` arrays. Maintains:
- `timePosition: number` -- current scene index for time slider
- `clusterBy: 'faction' | 'family' | 'none'`
- `filterState: { types: string[]; factions: string[]; minImportance: number }`
- `selectedNodeId: string | null`
- `layoutAlgorithm: 'force' | 'hierarchical' | 'circular'`

### Visual Design

**Layout:**
- Full canvas area with React Flow's infinite pan/zoom canvas.
- Default layout: force-directed (D3 force simulation applied to initial positions, then React Flow renders with those coordinates). Recalculated when filters change.
- Alternative layouts selectable: hierarchical (top-down family tree style), circular (characters arranged in a circle).

**Character nodes (custom node component):**
- Circular node.
- Diameter: `32px + (importance * 8)px`. Range: 40px (importance 1) to 112px (importance 10).
- Avatar image clipped to circle if `avatar_url` exists. Otherwise, initials on a background colored from the categorical palette (deterministic by character name hash).
- Border: 3px solid, colored by faction. White border if no faction.
- Dead characters: desaturated (grayscale filter), dashed border.
- Name label below the node: 12px Inter, max 100px width, truncated with ellipsis.
- Faction cluster: when clustering is enabled, a translucent convex hull polygon (20% opacity of faction color) wraps all characters in the same faction. Polygon has rounded corners (border-radius on SVG path via `rx`).

**Relationship edges (custom edge component):**
- Line color and dash pattern from the Relationship Edge Colors table (see Color System).
- Line width: `1px + (weight * 0.5)px`. Range: 1.5px (weight 1) to 6px (weight 10).
- Label at midpoint: relationship type or `custom_label`, 10px Inter, on a semi-transparent background pill.
- Animated dash for active conflicts (CSS animation, `stroke-dashoffset` cycling).
- Bidirectional relationships: single line with arrowheads at both ends. Unidirectional: arrowhead at target.

**Time slider:**
- Rendered below the canvas using the shared TimeSlider component.
- As the slider moves, relationships fade in/out based on `valid_from` / `valid_to`. Transition: 300ms opacity ease.
- Characters with no relationships at the current time position become 30% opacity (still visible, but clearly inactive).

### Interactions

| Action | Behavior |
|--------|----------|
| Click node | Selects character. Opens CharacterDetail drawer on the right (480px wide) showing full character profile: name, aliases, faction, importance, all relationships (list), traits, voice profile summary. |
| Double-click node | Navigates to dedicated character profile page: `/world/{id}/characters/{characterId}`. |
| Hover node | Highlights all edges connected to that node. Other edges become 20% opacity. Tooltip: name, faction, importance, status. |
| Hover edge | Tooltip: "{source} -- {type} -- {target}: {description}". Edge line becomes bold (+2px). |
| Drag node | Repositions the node. Other nodes do not auto-adjust (free layout after initial force simulation). Position is saved to local store for session persistence. |
| Click+drag canvas | Pans the view. |
| Mouse wheel | Zooms in/out. |
| Ctrl+click nodes | Multi-select. Shows shared relationships highlighted. |
| Right-click node | Context menu: "View profile", "Filter to this character's network", "Hide character". |
| Time slider drag | Filters relationships to those active at the selected scene. Smooth crossfade transitions. |

### Controls

**Toolbar:**
- **Layout selector**: 3 icons: force-directed (default), hierarchical (tree), circular. Switching triggers a 500ms animated transition.
- **Cluster toggle**: "Group by faction" toggle switch.
- **Label toggle**: show/hide edge labels.
- **Minimap toggle**: show/hide React Flow minimap (bottom-left, 150x100px).
- **Export image**: download button.

**Filter panel:**
- Relationship type checkboxes (all types from the type enum).
- Faction multi-select.
- Minimum importance slider (1-10).
- Character search (text input, filters visible nodes to matches + their connections).
- Reset filters button.

### States

| State | Display |
|-------|---------|
| Loading | Canvas shows 8 placeholder circles (gray, pulsing shimmer) with 12 placeholder lines between them. |
| Empty | Centered: character silhouette icon + "No characters in this story world yet. Extract characters from source material or create them manually." CTA: "Import Source Material" and "Create Character". |
| Error | Red banner: "Failed to load character data. {errorMessage}". Retry button. |
| Populated | Full interactive graph. |
| Filtered to zero results | Canvas shows ghost outlines of all nodes at 10% opacity + banner: "No characters match current filters." Reset filters button. |

### Performance

- **Under 100 characters**: React Flow with force-directed layout. No special handling needed.
- **100-500 characters**: Disable edge labels by default (toggle to enable). Reduce edge rendering to straight lines (no bezier curves). Progressive disclosure: show top 50 characters by importance initially, "Show more" button loads rest.
- **500+ characters**: Switch to `@cosmograph/cosmos` WebGL renderer. Force simulation runs on GPU. Custom nodes replaced with circle primitives. Edge labels removed. Interaction limited to click-to-select and hover tooltip.
- **Force simulation**: Run D3 force simulation for initial layout (200 iterations, alpha decay 0.02), then freeze positions. React Flow renders static positions. User can drag to adjust. Recalculate only on filter changes.

### Accessibility

- Nodes have `role="button"` and `aria-label="{name}, importance {n}, faction {faction}, {relationship count} relationships"`.
- Edges have `role="img"` and `aria-label="{source} {type} {target}"`.
- Tab navigates between nodes in importance order (highest first). Arrow keys move between connected nodes.
- Enter opens CharacterDetail drawer. Escape closes it.
- Screen reader mode: on activation, a tabular summary of all characters and relationships is rendered off-screen for screen reader consumption (hidden from visual display).
- Focus indicator: 3px indigo ring around focused node.

---

## 3. Arc Diagram

### Purpose

Visualizes story arcs as curves that rise and fall over the course of the narrative, overlaid against formal story structure templates. Solves the problem of seeing whether a story's pacing and structure align with known frameworks (Save the Cat, Hero's Journey, etc.) and where arcs deviate from expected rhythm. Writers can overlay multiple arcs (character arcs, plot arcs, thematic arcs) to see how they interrelate and where they converge or diverge.

### Library

**D3.js** -- custom SVG rendering. D3 provides the scales, axes, curve generators (`d3.curveCatmullRom` for smooth arcs), and interaction handling. No off-the-shelf arc diagram library captures our specific requirements.

### Component

```
src/components/visualizations/ArcDiagram.tsx
```

**Page route:** `src/app/(dashboard)/world/[id]/arcs/page.tsx`

### Data Requirements

**Primary endpoint:** `GET /api/worlds/{worldId}/arcs?include=phases,mappings`

**Response shape:**
```ts
interface StoryArc {
  id: string;
  name: string;
  type: 'character' | 'plot' | 'thematic' | 'relationship';
  color: string;               // from categorical palette
  phases: ArcPhase[];
}

interface ArcPhase {
  id: string;
  arc_id: string;
  name: string;                // "Setup", "Rising Action", "Climax", etc.
  intensity: number;           // 0-100, Y-axis value
  scene_id: string;            // X-axis position
  scene_sjuzhet_position: number;
  description: string;
}
```

**Structure template endpoint:** `GET /api/worlds/{worldId}/structure-mappings?template={templateId}`

**Response shape:**
```ts
interface StructureBeatPosition {
  beat_name: string;           // "Catalyst", "Midpoint", "All Is Lost", etc.
  expected_percent: number;    // 0-100, where in the narrative this beat should fall
  actual_scene_id?: string;    // which scene the user mapped to this beat (null if unmapped)
  actual_percent?: number;     // actual position as percentage
  description: string;
}
```

**Store:** `src/stores/arc-diagram-store.ts`

### Visual Design

**Layout:**
- SVG chart filling the visualization container.
- X-axis: narrative progress (0% to 100% of the story, or scene index 1 to N). Labeled with scene/chapter/episode markers.
- Y-axis: intensity (0 to 100). Labeled "Low" at bottom, "High" at top. No numeric labels (intensity is relative, not absolute).
- Grid: light horizontal lines at 25% intensity intervals. Vertical lines at act boundaries.

**Arc curves:**
- Each arc rendered as a smooth curve (`d3.curveCatmullRom`) connecting its ArcPhase data points.
- Line width: 3px for primary (selected) arc, 2px for secondary arcs.
- Line color: from arc's `color` field.
- Unselected arcs: 40% opacity. Selected arc: 100% opacity, 1px shadow for depth.
- Area fill below each curve: 8% opacity of arc color (subtle gradient fill from curve to X-axis).

**Arc phase markers:**
- Circles (r=6px) at each ArcPhase data point on the curve.
- Fill: white. Stroke: arc color, 2px.
- On hover: radius grows to 8px, tooltip appears.

**Structure template overlay:**
- Vertical dashed lines at each `expected_percent` position, colored `--viz-text-muted`.
- Label above each line: beat name (e.g., "Catalyst", "Midpoint") in 10px Inter, rotated 45 degrees.
- If `actual_percent` exists and differs from `expected_percent`, a horizontal arrow connects expected to actual position, colored amber if deviation > 5%, red if > 15%.
- Deviation badge: small pill showing "+3%" or "-7%" at the arrow midpoint.

**Pacing deviation indicators:**
- Below the X-axis, a thin (8px tall) horizontal bar chart:
  - Green segments where actual pacing matches expected (within 5%).
  - Amber segments where deviation is 5-15%.
  - Red segments where deviation exceeds 15%.

### Interactions

| Action | Behavior |
|--------|----------|
| Click arc curve | Selects that arc. Brings to foreground (full opacity). Other arcs go to 40% opacity. Shows arc detail in right panel: name, type, phases list, associated characters. |
| Click arc phase marker | Shows phase detail tooltip: phase name, intensity value, scene name, description. |
| Double-click arc phase marker | Navigates to the scene in the Writing Surface. |
| Hover arc curve | Cursor becomes a crosshair. Vertical guide line follows mouse X-position, showing the intensity value of the hovered arc at that narrative position (dynamic readout in tooltip). |
| Hover structure beat line | Tooltip: beat name, expected %, actual %, deviation amount, description. |
| Click+drag on X-axis | Zooms into a time range (brush selection). Double-click to reset zoom. |
| Click legend item | Toggles arc visibility. |

### Controls

**Toolbar:**
- **Structure template selector**: dropdown listing all StructureTemplates in the world (Hero's Journey, Save the Cat, etc.). Selecting one overlays its beat markers. "None" option hides overlay.
- **Arc type filter**: checkboxes for Character, Plot, Thematic, Relationship. Toggles visibility of arc types.
- **Comparison mode toggle**: when enabled, up to 3 arcs display side by side with a shared axis.
- **Export image**: download button.

**Filter panel:**
- Arc multi-select (which specific arcs to display).
- Narrative range slider (show only a portion of the story).
- Reset filters button.

### States

| State | Display |
|-------|---------|
| Loading | SVG skeleton: gray X/Y axes with 3 wavy placeholder curves in shimmer animation. |
| Empty | Centered: rising-curve icon + "No arcs defined yet. Create character arcs, plot arcs, or thematic arcs to visualize them here." CTA: "Create Arc". |
| Error | Red banner with retry. |
| Populated | Full arc diagram with curves and optional structure overlay. |

### Performance

- Arc diagrams are lightweight (typically < 50 arcs, < 500 data points). No special performance handling required.
- Structure template overlay is computed once on template selection and cached in the store.
- Curve rendering uses D3's efficient path generation. No virtualization needed.

### Accessibility

- Each arc curve has `role="img"` and `aria-label="Arc: {name}, type: {type}, {phaseCount} phases, peak intensity at {peakScene}"`.
- Arc phase markers have `role="button"` and `aria-label="Phase: {name}, intensity {value}, at scene {sceneName}"`.
- Tab navigates between arc phase markers in narrative order. Enter activates tooltip. Escape dismisses.
- Structure beat lines have `aria-label="Expected beat: {name} at {percent}%, actual at {actual}%"`.
- Color-blind safe: each arc type also has a distinct line pattern (solid for plot, long-dash for character, dotted for thematic, dash-dot for relationship) in addition to color.

---

## 4. Mind Map / World Map

### Purpose

Provides a freeform spatial canvas for organizing story elements visually. Unlike the structured timeline or arc diagram, the mind map lets writers cluster ideas by theme, location, faction, or any custom grouping. It serves as a brainstorming and organizational tool -- the digital equivalent of index cards on a corkboard. The optional geographic map underlay supports location-based stories where physical geography matters.

### Library

**React Flow** (`@xyflow/react`) -- provides the infinite canvas, node drag-and-drop, edge connections, grouping (via parent nodes), and minimap.

### Component

```
src/components/visualizations/MindMap.tsx
```

Supporting files:
```
src/components/visualizations/mind-map/MindMapNode.tsx    # Custom node types
src/components/visualizations/mind-map/ClusterGroup.tsx   # Cluster container node
```

**Page route:** `src/app/(dashboard)/world/[id]/mindmap/page.tsx`

### Data Requirements

**Primary endpoint:** `GET /api/worlds/{worldId}/entities?types=character,location,event,object,theme,faction`

Returns a flat list of all entities. The mind map layout is stored client-side (positions are user-arranged, persisted to local storage and optionally to the server).

**Layout persistence endpoint:** `PUT /api/worlds/{worldId}/mindmap-layout` -- saves `{ nodeId: string; x: number; y: number; parentClusterId?: string }[]`.

**Store:** `src/stores/mind-map-store.ts`

### Visual Design

**Layout:**
- Infinite canvas (React Flow default). Light dot grid background (`--viz-grid-line` color, 20px spacing).
- Nodes are freely positionable by drag.
- When "auto-cluster" is activated, nodes animate into clusters using a D3 force simulation with cluster gravity (entities of the same type/faction/theme attract each other).

**Entity nodes:**
- Rounded rectangles (border-radius 8px, padding 12px).
- Width: 160px fixed. Height: auto (expands with content).
- Header: entity type icon (16px) + entity name (13px semi-bold Inter). Background color band at top (24px) using entity-type color:
  - Character: Indigo
  - Location: Emerald
  - Event: Orange
  - Object: Amber
  - Theme: Violet
  - Faction: Rose
- Body: 1-2 line description (11px Inter, `--viz-text-secondary`), truncated.
- Collapsed state: just the header bar (24px tall) with name.
- Expanded state: shows description, linked entities count badge, quick stats.

**Cluster groups:**
- React Flow group nodes: large rounded rectangles with dashed border (2px, cluster color).
- Label in top-left corner: cluster name (14px semi-bold Inter).
- Background: 5% opacity fill of cluster color.
- Nodes inside a cluster are constrained to the cluster bounds (React Flow parent node relationship).

**Edges:**
- Drawn between related entities (same relationship data as Character Map, but generalized to all entity types).
- Thin lines (1px), straight (no bezier), 40% opacity `--viz-text-muted`.
- On hover: line becomes 100% opacity and colored by relationship type.

**Geographic map underlay (optional):**
- When enabled, a Mapbox/OpenStreetMap tile layer renders behind the canvas.
- Location entities snap to their `map_coordinates` if set.
- Non-location entities float freely above the map.
- Map zoom and pan sync with canvas zoom and pan.

### Interactions

| Action | Behavior |
|--------|----------|
| Drag node | Repositions freely on canvas. If dropped inside a cluster group, becomes a child of that cluster. |
| Click node | Selects. Shows detail panel on right. |
| Double-click node | Expands/collapses node content. |
| Click+drag from node edge handle | Creates a new relationship edge to another node. Opens relationship type selector dialog. |
| Right-click canvas | Context menu: "Add Character", "Add Location", "Add Event", "Add Theme", "Create Cluster". |
| Right-click node | Context menu: "Expand", "Collapse", "Remove from map" (hides, does not delete), "Go to detail page". |
| Multi-select (Shift+click or lasso) | Selects multiple nodes. Can drag as group. Can right-click to "Create cluster from selection". |
| Mouse wheel | Zooms canvas. |

### Controls

**Toolbar:**
- **Auto-cluster**: dropdown with options: "By type", "By faction", "By theme", "By location proximity", "Manual". Triggers force simulation clustering.
- **Show relationships**: toggle to show/hide edges.
- **Map underlay**: toggle to show/hide geographic map layer.
- **Add entity**: "+" button with dropdown to create new entities directly on the map.
- **Minimap toggle**.
- **Export image**.

**Filter panel:**
- Entity type checkboxes (Character, Location, Event, Object, Theme, Faction).
- Faction multi-select.
- Theme multi-select.
- Search text input (filters visible nodes).
- Reset filters.

### States

| State | Display |
|-------|---------|
| Loading | Canvas with 6 placeholder rectangles in shimmer. |
| Empty | Centered: puzzle-piece icon + "Your world map is empty. Add entities to start building your world." CTA: "Import Source Material", "Create Entity". |
| Error | Red banner with retry. |
| Populated | Full interactive canvas with entity nodes. |

### Performance

- React Flow handles up to ~500 nodes smoothly with standard DOM rendering.
- For 500-2000 nodes: disable edge rendering by default, reduce node content to header-only.
- For 2000+ nodes: not expected for mind maps (this is a manual arrangement tool). If reached, show a warning and suggest using filters.
- Layout persistence: debounce position saves to 2 seconds after last drag event.

### Accessibility

- Nodes have `role="button"` and `aria-label="{type}: {name}, {connectionCount} connections"`.
- Clusters have `role="group"` and `aria-label="Cluster: {name}, {childCount} items"`.
- Tab navigates between nodes (sorted by cluster, then by position left-to-right, top-to-bottom). Enter expands/collapses. Escape deselects.
- Arrow keys move selected node by 10px increments (Shift+arrow for 50px).
- Screen reader: tabular summary of all entities and their cluster assignments available via an off-screen table.

---

## 5. Impact Analysis View

### Purpose

Answers the critical "what if I change this?" question. When a writer modifies a character's backstory, kills off a character, changes a location's properties, or alters any story element, this view shows the cascading impact across the entire story world. It visualizes which scenes, relationships, plot points, and arcs would be affected, with severity ratings. This enables writers to make informed decisions about revisions before committing them.

### Library

**React Flow** (`@xyflow/react`) -- renders the dependency tree as a directed acyclic graph (DAG). The tree layout (top-to-bottom or left-to-right) is computed using the `dagre` layout algorithm.

### Component

```
src/components/visualizations/ImpactAnalysis.tsx
```

Supporting files:
```
src/components/visualizations/impact-analysis/ImpactNode.tsx     # Custom node with severity
src/components/visualizations/impact-analysis/DiffPanel.tsx       # Before/after comparison drawer
```

**Page route:** `src/app/(dashboard)/world/[id]/whatif/page.tsx`

### Data Requirements

**Primary endpoint:** `POST /api/worlds/{worldId}/whatif/simulate`

**Request body:**
```ts
interface WhatIfRequest {
  entity_type: 'character' | 'event' | 'location' | 'relationship' | 'faction' | 'object';
  entity_id: string;
  change_type: 'modify' | 'delete' | 'add';
  change_description: string;     // natural language description of the change
  change_fields?: Record<string, { old: any; new: any }>;  // structured field changes
}
```

**Response shape:**
```ts
interface ImpactResult {
  root_entity: { id: string; name: string; type: string };
  affected_entities: AffectedEntity[];
  total_affected: number;
  severity_summary: { critical: number; warning: number; info: number };
}

interface AffectedEntity {
  id: string;
  name: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  reason: string;                 // natural language explanation
  affected_fields: string[];      // which fields are affected
  depth: number;                  // distance from root change (1 = directly affected, 2 = second-order, etc.)
  parent_id: string;              // which entity caused this one to be affected (for tree structure)
}
```

**Canon comparison endpoint:** `GET /api/worlds/{worldId}/canon/diff?branch={branchId}` -- for comparing a speculative branch against canon.

**Store:** `src/stores/impact-store.ts`

### Visual Design

**Layout:**
- Split layout: DAG tree on the left (70% width), detail panel on the right (30% width, collapsible).
- DAG rendered top-to-bottom: root change entity at top, cascading affected entities below.
- Dagre layout algorithm for automatic positioning with node separation 60px horizontal, 80px vertical.

**Root node:**
- Larger than others (200px wide, 80px tall).
- Bold border (3px) in indigo.
- Shows: entity type icon + name + change badge ("Modified", "Deleted", "Added").
- Pulsing animation ring (subtle, 2s cycle) to draw attention.

**Affected entity nodes:**
- 180px wide, 60px tall.
- Border color by severity:
  - Critical: `#dc2626` (red), 3px solid.
  - Warning: `#f59e0b` (amber), 2px solid.
  - Info: `#3b82f6` (blue), 1px solid.
- Background: severity color at 5% opacity.
- Content: entity type icon (16px) + name (12px semi-bold) + severity badge (pill, colored).
- Depth indicator: subtle indentation or smaller size for deeper-level impacts.

**Edges:**
- Directed arrows (top to bottom) from parent to affected entity.
- Color matches the child node's severity.
- Width: 2px for critical paths, 1px for others.
- Animated dash for critical edges (CSS animation).

**Severity summary bar:**
- Horizontal bar at the top of the DAG area: "Impact: {critical} critical, {warning} warnings, {info} info changes". Color-coded badges.

**Detail panel (right side):**
- When an affected node is selected, shows:
  - Entity name and type.
  - Severity badge with explanation.
  - "Reason" text: natural language explanation of why this entity is affected.
  - "Affected fields" list: specific fields that would change.
  - Before/after diff for structured fields (green/red highlighting, like a code diff).
  - "View in context" link to navigate to the entity in its primary view.

### Interactions

| Action | Behavior |
|--------|----------|
| Click affected node | Selects it. Shows detail in right panel. Highlights the path from root to this node. |
| Hover affected node | Tooltip: name, severity, reason (truncated). |
| Click "Expand" on node | If the node has second-order impacts not yet loaded, fetches and expands children. |
| Click "Collapse" on node | Hides children of that node (but shows a badge with hidden count). |
| Click severity badge in summary bar | Filters the tree to show only nodes of that severity level. |
| Double-click affected node | Navigates to that entity's primary detail page. |
| Click "Apply Changes" button (in toolbar) | Commits the what-if scenario, updating the actual story world data. Confirmation dialog first. |
| Click "Save as Branch" button (in toolbar) | Saves the scenario as a named Branch without modifying canon. |
| Click "Discard" button (in toolbar) | Clears the impact analysis and returns to the input state. |

### Controls

**Toolbar:**
- **Change input form**: entity selector + change type dropdown + description text area. "Simulate" button to trigger analysis.
- **Severity filter**: 3 toggle buttons (Critical, Warning, Info) to show/hide by severity.
- **Depth limit**: dropdown to limit tree depth (1, 2, 3, All).
- **Layout direction**: horizontal (left-to-right) or vertical (top-to-bottom).
- **Apply Changes**, **Save as Branch**, **Discard** action buttons.
- **Export image**.

### States

| State | Display |
|-------|---------|
| Input | No simulation run yet. Shows the change input form prominently in the center of the canvas. Instructional text: "Describe a change to see its cascading impact across your story world." |
| Simulating | Loading spinner in center + "Analyzing impact..." text. Progress bar if available from API. |
| Results | Full DAG tree with severity summary. |
| No impact | Checkmark icon + "This change has no detected impact on other story elements." |
| Error | Red banner: "Impact simulation failed. {errorMessage}". Retry button. |

### Performance

- Impact simulation runs server-side (potentially via BullMQ job for large worlds). API returns complete result set.
- DAG rendering: dagre layout is computed once on result load. For large impact sets (200+ nodes), enable collapse-by-default for depth > 2.
- Progressive loading: if `total_affected > 100`, show top 50 by severity, with "Load more" pagination.

### Accessibility

- Each node: `role="treeitem"` with `aria-level="{depth}"` and `aria-label="{name}, {type}, severity: {severity}, reason: {reason}"`.
- Tree container: `role="tree"`.
- Severity summary: `role="status"` with `aria-live="polite"`.
- Tab navigates depth-first through the tree. Arrow Up/Down moves between siblings. Arrow Right expands, Arrow Left collapses.
- High contrast: severity colors become black border with severity icon (X for critical, ! for warning, i for info).

---

## 6. Source Material Viewer

### Purpose

Provides a side-by-side reading experience showing the original ingested source material alongside the extracted entities and annotations. Writers can see exactly where StoryForge found each character, location, event, and relationship in their source text, and jump to the full entity detail. For audio/video sources, it provides a player with time-coded annotations. This is essential for trust -- writers need to verify AI extraction accuracy and correct mistakes.

### Library

**Custom React components** -- no graph/chart library needed. The viewer is primarily a rich text display with inline highlighting (similar to a code editor with annotations), built with standard React + CSS.

For the text highlighting engine: reuse TipTap in read-only mode with custom highlight marks, or a custom `<AnnotatedText>` component using `<mark>` elements with `data-entity-*` attributes.

For audio/video: HTML5 `<video>` / `<audio>` elements with a custom timeline scrubber component.

### Component

```
src/components/visualizations/SourceMaterialViewer.tsx
```

Supporting files:
```
src/components/visualizations/source-viewer/AnnotatedText.tsx     # Highlighted source text
src/components/visualizations/source-viewer/MediaPlayer.tsx       # Audio/video player
src/components/visualizations/source-viewer/EntityMargin.tsx      # Margin annotation column
src/components/visualizations/source-viewer/EntityPopover.tsx     # Click-to-detail popover
```

**Page route:** `src/app/(dashboard)/world/[id]/sources/[sourceId]/page.tsx`

### Data Requirements

**Primary endpoint:** `GET /api/worlds/{worldId}/source-materials/{sourceId}`

**Response shape:**
```ts
interface SourceMaterial {
  id: string;
  title: string;
  file_type: 'text' | 'audio' | 'video' | 'image';
  original_filename: string;
  file_url: string;              // for media playback
  parsed_text: string;           // full extracted/transcribed text
  structural_markers: StructuralMarker[];  // chapter/scene/act boundaries
  annotations: SourceAnnotation[];
}

interface SourceAnnotation {
  id: string;
  entity_id: string;
  entity_type: 'character' | 'location' | 'event' | 'relationship' | 'theme' | 'object';
  entity_name: string;
  start_offset: number;          // character offset in parsed_text
  end_offset: number;
  time_code_start?: number;      // seconds (for audio/video)
  time_code_end?: number;
  confidence: number;            // 0-1, AI confidence
  status: 'proposed' | 'confirmed' | 'rejected';
  narrative_codes?: string[];    // Barthes codes if annotated
  value_change?: string;         // McKee value change if annotated
  emotional_state?: string;      // Emotion annotation if present
}
```

**Store:** `src/stores/source-viewer-store.ts`

### Visual Design

**Layout:**
- Horizontal split layout (resizable via drag handle):
  - Left panel (60% default): source text or media player.
  - Right panel (40% default): entity connections and detail for selected annotation.
- Margin annotation column (40px wide) on the right edge of the left panel, showing color-coded markers.

**Source text (left panel, text sources):**
- Monospaced or serif font for the source text body (`Georgia`, 15px, line-height 1.8) -- optimized for reading.
- Structural markers (chapter breaks, scene breaks) rendered as horizontal rules with labels.
- Entity highlights: inline `<mark>` elements with background color from entity type color at 20% opacity, border-bottom 2px solid at full entity type color.
- Highlight colors by entity type:
  - Character: `#6366f1` (indigo)
  - Location: `#10b981` (emerald)
  - Event: `#f97316` (orange)
  - Object: `#f59e0b` (amber)
  - Theme: `#8b5cf6` (violet)
  - Relationship: `#ec4899` (pink)
- Proposed (unconfirmed) annotations: dashed underline instead of solid. Slight pulsing animation to draw attention.
- Confidence indicator: low confidence (< 0.7) annotations show a small "?" icon at the end of the highlight.

**Media player (left panel, audio/video sources):**
- Standard HTML5 player controls with custom skin matching the app theme.
- Waveform visualization (for audio) using `wavesurfer.js` with annotation markers as colored segments on the waveform.
- Video player with annotation overlay (semi-transparent colored regions at bottom showing entity names at time-coded positions).
- Scrollable transcript below the player, auto-scrolling to the current playback position. Highlights in transcript sync with playback time.

**Margin annotation column:**
- Narrow column (40px) on the right side of the text panel.
- Small colored circles (8px diameter) at the vertical position corresponding to each annotation.
- Color matches entity type.
- Clicking a margin marker scrolls to and highlights the annotation in the text.
- Dense regions show stacked circles; on hover, they fan out vertically.

**Right panel (entity detail):**
- When no annotation is selected: shows a summary. "Source: {title}" header, "{n} entities extracted", entity type breakdown (pie chart or simple bars), confidence distribution.
- When annotation is selected: shows full entity card. Name, type badge, description, all connections to other entities (links), "View in world" button, confirm/reject buttons for proposed annotations.
- Narrative code annotations (if present): colored badges for Barthes codes (H = hermeneutic, P = proairetic, S = semic, Sy = symbolic, C = cultural).
- Value change annotation: up/down arrow with value name.
- Emotional state annotation: emoji-like indicator + emotion name.

### Interactions

| Action | Behavior |
|--------|----------|
| Click highlighted text | Selects that annotation. Scrolls right panel to entity detail. Highlights all other occurrences of the same entity in the source text. |
| Hover highlighted text | Tooltip: entity name, type badge, confidence percentage. |
| Click margin marker | Scrolls source text to that annotation and selects it. |
| Click "Confirm" on proposed annotation | Updates annotation status to confirmed. `PATCH /api/worlds/{id}/source-materials/{sourceId}/annotations/{annotationId}`. Highlight changes from dashed to solid. |
| Click "Reject" on proposed annotation | Removes the highlight. Updates status to rejected. |
| Click "View in world" on entity detail | Navigates to the entity's primary page (e.g., `/world/{id}/characters/{charId}`). |
| Click time-coded marker (audio/video) | Seeks player to that time code. |
| Double-click on unmarked text | Opens "Create annotation" dialog: user selects the text range and chooses entity type + existing or new entity. |
| Ctrl+F | Opens find-in-source search bar (text search within the source content). |

### Controls

**Toolbar:**
- **Annotation type filter**: checkboxes for each entity type. Hides highlights of unchecked types.
- **Status filter**: "All" | "Proposed" | "Confirmed" | "Rejected" toggle.
- **Confidence threshold slider**: 0% to 100%. Hides annotations below threshold.
- **Bulk confirm**: "Confirm all proposed above {confidence}%" button.
- **Show narrative codes**: toggle to show/hide Barthes code badges in margins.
- **Export image** (captures text panel with annotations).

### States

| State | Display |
|-------|---------|
| Loading | Left panel: shimmer block (full text area). Right panel: shimmer lines. |
| Empty (no annotations) | Source text displays normally (no highlights). Right panel: "No entities extracted yet. Run analysis to extract entities from this source." CTA: "Run Entity Extraction" (triggers ingestion pipeline). |
| Error | Red banner with retry. |
| Populated | Full annotated source with entity highlights and margin markers. |

### Performance

- **Large documents (100K+ characters)**: Virtualize the text rendering. Only render visible paragraphs + 500-character buffer above/below. Use `react-virtualized` or Intersection Observer to swap in/out paragraph `<div>`s.
- **Dense annotations (1000+)**: Margin markers use clustering -- if more than 3 markers overlap vertically, show a count badge. Click to expand.
- **Media files**: Stream audio/video rather than full download. Waveform computed server-side and sent as pre-computed peaks array.

### Accessibility

- Source text is in a `role="document"` container with proper heading hierarchy from structural markers.
- Highlighted annotations have `role="mark"` (native `<mark>` element) with `aria-label="{entity name}, {entity type}, confidence {n}%"`.
- Tab navigates between annotations in document order. Enter opens entity detail. Escape returns focus to source text.
- Confirm/Reject buttons have clear `aria-label` including entity name.
- Media player: standard `<video>` / `<audio>` controls with `aria-label`. Time-coded markers announced as "Entity {name} at {time}".

---

## 7. Pacing Heatmap

### Purpose

Provides a bird's-eye view of story pacing across the entire narrative. By color-coding each scene/chapter/episode by multiple metrics (action density, dialogue ratio, description density, tension level), writers can instantly spot pacing problems: sections that are too slow, too dense, lacking variety, or where tension drops unexpectedly. The expected pacing curve from the active structure template can be overlaid to show where the actual pacing deviates from the structural ideal.

### Library

**D3.js** -- custom heatmap rendering using `<rect>` elements in SVG, with D3 scales for color mapping and axis generation.

### Component

```
src/components/visualizations/PacingHeatmap.tsx
```

**Page route:** `src/app/(dashboard)/world/[id]/pacing/page.tsx`

### Data Requirements

**Primary endpoint:** `GET /api/worlds/{worldId}/pacing-metrics`

**Response shape:**
```ts
interface PacingMetric {
  scene_id: string;
  scene_title: string;
  scene_sjuzhet_position: number;
  chapter_label?: string;
  episode_label?: string;
  action_density: number;        // 0-100
  dialogue_ratio: number;        // 0-100 (percentage of scene that is dialogue)
  description_density: number;   // 0-100
  tension_level: number;         // 0-100
  scene_length: number;          // word count
}
```

**Structure pacing overlay:** `GET /api/worlds/{worldId}/structure-mappings?template={id}` -- reuses the same endpoint as Arc Diagram to get expected beat positions and derive expected tension curves.

**Store:** `src/stores/pacing-store.ts`

### Visual Design

**Layout:**
- SVG heatmap filling the visualization container.
- X-axis: narrative progress. Each column is one scene (or chapter/episode at lower zoom). Labels: scene numbers or chapter/episode names. Rotated 45 degrees if needed to prevent overlap.
- Y-axis: pacing metrics. Four rows, one per metric: "Action Density", "Dialogue Ratio", "Description Density", "Tension Level". Labels on the left.
- Each cell: a rectangle colored by the sequential color scale (cool-to-hot: `#dbeafe` for 0 to `#dc2626` for 100).

**Cell dimensions:**
- Width: fills available horizontal space evenly across all scenes. Min 16px per cell (scrolls horizontally if needed).
- Height: 48px per metric row.
- Gap: 2px between cells.
- Border-radius: 2px on each cell.

**Scene length bar:**
- An additional bar chart row below the heatmap showing scene word counts as vertical bars.
- Bars colored in a neutral scale (`--viz-text-muted` to `--viz-text-primary`).
- Height proportional to word count relative to max scene length.

**Expected pacing curve overlay:**
- When a structure template is active, a smooth curve (D3 line) is drawn overlaid on the "Tension Level" row.
- Curve shows the expected tension trajectory (derived from structure beat positions and their implied tension values).
- Line style: 2px dashed, white with 80% opacity (visible against both low and high heat colors).
- Deviation coloring: cells in the tension row that deviate significantly (>15%) from expected are outlined with a 2px amber or red border.

**Chapter/episode boundaries:**
- Vertical lines (1px, `--viz-border`) drawn at chapter/episode boundaries.
- Chapter/episode labels above the X-axis in a separate label row.

### Interactions

| Action | Behavior |
|--------|----------|
| Hover cell | Tooltip: "Scene: {title}, {metric}: {value}/100". Cell border highlights (2px white). |
| Click cell | Selects that scene. All four metric cells for that scene column highlight. Detail panel (right) shows full scene pacing breakdown with exact numbers. |
| Double-click cell | Navigates to the scene in the Writing Surface. |
| Click+drag horizontally (brush) | Selects a range of scenes. Detail panel shows aggregate statistics for the range (averages, min/max). |
| Hover metric label (Y-axis) | Highlights that entire row. |
| Click metric label | Sorts scenes by that metric (highest to lowest). Click again to unsort (return to narrative order). |
| Mouse wheel (with cursor over heatmap) | Horizontal scroll (since vertical space is fixed at 4 rows). |

### Controls

**Toolbar:**
- **Metric visibility**: checkboxes for each of the 4 metrics. Hides/shows rows.
- **Granularity selector**: "Scene" | "Chapter" | "Episode" (aggregates cells at higher levels by averaging).
- **Structure overlay**: dropdown to select structure template for expected pacing curve. "None" to hide.
- **Color scale**: dropdown: "Cool to Hot" (default) | "Diverging (blue-white-red)" | "Viridis".
- **Export image**.

**Filter panel:**
- Arc multi-select (show only scenes belonging to certain arcs).
- Character multi-select (show only scenes featuring certain characters).
- Tension range slider (highlight only scenes within a tension range).
- Reset filters.

### States

| State | Display |
|-------|---------|
| Loading | Grid of gray rectangles in shimmer animation (4 rows x ~20 columns). |
| Empty | Centered: speedometer icon + "No pacing data available. Pacing metrics are calculated when scenes have content in the Writing Surface." CTA: "Go to Writing Surface". |
| Error | Red banner with retry. |
| Populated | Full heatmap with color-coded cells. |

### Performance

- Heatmaps are inherently lightweight (4 rows x N columns, where N = scene count). Even 1000 scenes = 4000 `<rect>` elements, well within SVG performance limits.
- For extremely long series (5000+ scenes): enable horizontal virtualization, rendering only the visible portion + buffer.
- Color scale computation: use D3 `scaleSequential` with pre-defined domain [0, 100]. No runtime calculation needed.

### Accessibility

- Heatmap container has `role="grid"` with `aria-label="Pacing heatmap: {metricCount} metrics across {sceneCount} scenes"`.
- Each row has `role="row"` with `aria-label="{metric name} row"`.
- Each cell has `role="gridcell"` with `aria-label="Scene {title}, {metric}: {value} out of 100"`.
- Tab navigates between cells left-to-right, then next row. Arrow keys for grid navigation.
- Color-blind support: each cell displays the numeric value on hover AND optionally always (toggled via toolbar). Patterns (hatching) overlay high-value cells for additional non-color differentiation.

---

## 8. Emotional Arc Chart

### Purpose

Tracks the emotional trajectory of each character across the narrative. By plotting multiple emotional dimensions (joy, grief, anger, fear, hope, surprise) as line charts over time, writers can see emotional pacing, identify where characters flatline (emotionally static sections), spot moments where character emotions converge or diverge, and ensure emotional variety. Comparing multiple characters on the same chart reveals emotional counterpoint -- where one character rises while another falls.

### Library

**D3.js** -- line chart with multiple series, using `d3.line()` curve generators, axes, and interactive tooltips.

### Component

```
src/components/visualizations/EmotionalArc.tsx
```

**Page route:** `src/app/(dashboard)/world/[id]/arcs/emotional/page.tsx` (sub-route of arcs, or could be a tab within the arcs page)

### Data Requirements

**Primary endpoint:** `GET /api/worlds/{worldId}/emotional-states?characters={id1,id2,...}`

**Response shape:**
```ts
interface EmotionalState {
  character_id: string;
  character_name: string;
  scene_id: string;
  scene_sjuzhet_position: number;
  scene_title: string;
  joy: number;          // 0-100
  grief: number;
  anger: number;
  fear: number;
  hope: number;
  surprise: number;
}
```

**Store:** `src/stores/emotional-arc-store.ts`

### Visual Design

**Layout:**
- SVG line chart filling the visualization container.
- X-axis: narrative position (scene index or scene title). Tick marks at scene boundaries.
- Y-axis: emotional intensity (0 to 100). Labeled: "Low" at 0, "High" at 100. Grid lines at 25, 50, 75.
- Legend: top-right corner, showing all visible series with color swatch + emotion name. Clickable to toggle.

**Lines:**
- One line per (character, emotion) pair.
- Line color from the Emotional Dimension Colors table.
- Line width: 2px for focused character, 1px for comparison characters.
- Curve: `d3.curveCatmullRom` for smooth interpolation between data points.
- Area fill: optional (toggled), 10% opacity below each line.
- Unfocused characters' lines: 30% opacity.

**Data points:**
- Small circles (r=3px) at each scene data point.
- Fill: white. Stroke: line color, 1.5px.
- On hover: radius increases to 5px.

**Crossing/divergence highlights:**
- When two characters' lines for the same emotion cross, a small diamond marker (8x8px) appears at the intersection point, colored amber.
- When two characters' emotional arcs diverge sharply (difference > 40 within a short span), a red zone highlight (semi-transparent red rectangle) appears behind that region.

**Character selector:**
- Top-left of the chart: character avatar chips (clickable). Primary character has a bold ring. Comparison characters have a thin ring. Click to toggle.

### Interactions

| Action | Behavior |
|--------|----------|
| Hover on chart area | Vertical guide line follows mouse X-position. Tooltip shows all emotional values for all visible characters at that scene position. Tooltip formatted as a mini-table: rows = emotions, columns = characters. |
| Click data point | Selects that scene. Shows detail below chart: scene title, full emotional breakdown for all characters, scene description. |
| Double-click data point | Navigates to the scene in Writing Surface. |
| Click legend item (emotion) | Toggles that emotion's visibility across all characters. |
| Click character chip | Toggles that character. Primary character (first selected) determines line width and opacity precedence. |
| Click+drag horizontally (brush) | Zooms into a narrative range. Double-click to reset. |
| Click crossing marker | Tooltip: "{char1} and {char2}'s {emotion} arcs cross at scene {title}: {char1} at {val1}, {char2} at {val2}." |

### Controls

**Toolbar:**
- **Character selector**: multi-select dropdown with avatar thumbnails. Up to 5 characters simultaneously.
- **Emotion visibility**: 6 toggle buttons with colored circles (joy, grief, anger, fear, hope, surprise).
- **Area fill toggle**: show/hide the filled area below lines.
- **Smoothing**: toggle between smooth curves (Catmull-Rom) and linear interpolation.
- **Highlight crossings**: toggle to show/hide crossing and divergence markers.
- **Export image**.

### States

| State | Display |
|-------|---------|
| Loading | Gray axis outlines + 3 wavy placeholder lines in shimmer. |
| Empty (no emotional data) | Chart axes render. Centered message: "No emotional analysis data. Run emotional analysis on your scenes to see character emotional arcs." CTA: "Run Analysis". |
| Empty (no characters selected) | Chart axes render. "Select characters above to view their emotional arcs." |
| Error | Red banner with retry. |
| Populated | Full multi-line chart with legends, data points, and optional crossing highlights. |

### Performance

- Lightweight chart. Even 5 characters x 6 emotions x 500 scenes = 15,000 data points, which D3 handles comfortably.
- For very long series (2000+ scenes): downsample by averaging emotions over groups of 5 scenes at low zoom, show full resolution at high zoom.
- Tooltip computation: O(N) scan per mouse move to find nearest scene. Cache scene X-positions in a Float64Array for binary search.

### Accessibility

- Chart container has `role="img"` with `aria-label="Emotional arc chart showing {emotionCount} emotions for {characterCount} characters across {sceneCount} scenes"`.
- A `<table>` equivalent is rendered off-screen (display:none, not aria-hidden) for screen reader access: rows = scenes, columns = (character, emotion) pairs.
- Tab moves between data points in narrative order. Arrow Up/Down switches between characters at the same scene position. Enter reads the full emotional state.
- Focus ring on data points: 2px solid indigo circle.
- Color-blind: each emotion has a distinct dash pattern in addition to color (joy: solid, grief: long dash, anger: short dash, fear: dotted, hope: dash-dot, surprise: dash-dot-dot).

---

## 9. Faction / Power Map

### Purpose

Visualizes the political and power landscape of the story world. Shows factions, organizations, and groups as nodes, with edges representing alliances, conflicts, and hierarchical relationships. The time slider reveals how allegiances shift over the course of the narrative -- a faction that starts as an ally may become an enemy by Act 3. Power level visualization (node size) shows which factions are dominant at any point.

### Library

**React Flow** (`@xyflow/react`) -- provides the node-graph canvas with custom nodes for factions and custom edges for alliance/conflict relationships.

### Component

```
src/components/visualizations/FactionMap.tsx
```

Supporting files:
```
src/components/visualizations/faction-map/FactionNode.tsx      # Custom node with power indicator
src/components/visualizations/faction-map/AllegianceEdge.tsx   # Custom edge with type styling
```

**Page route:** `src/app/(dashboard)/world/[id]/factions/page.tsx`

### Data Requirements

**Primary endpoint:** `GET /api/worlds/{worldId}/factions?include=allegiances,members`

**Response shape:**
```ts
interface Faction {
  id: string;
  name: string;
  color: string;
  power_level: number;           // 1-10 (determines node size)
  hierarchy_parent_id?: string;  // for hierarchical layout
  description: string;
  member_count: number;
  key_members: { id: string; name: string }[];
}

interface Allegiance {
  id: string;
  source_faction_id: string;
  target_faction_id: string;
  type: 'alliance' | 'conflict' | 'vassal' | 'neutral' | 'trade' | 'rivalry';
  strength: number;              // 1-10
  valid_from_scene_id?: string;
  valid_to_scene_id?: string;
  description?: string;
}
```

**Time-scoped endpoint:** `GET /api/worlds/{worldId}/factions?at_scene={sceneId}` -- returns factions with power levels and allegiances as of that scene.

**Store:** `src/stores/faction-map-store.ts`

### Visual Design

**Layout:**
- React Flow canvas with force-directed layout (default) or hierarchical layout (for vassal/parent relationships).
- Hierarchical layout places parent factions above child factions in a tree structure.

**Faction nodes:**
- Hexagonal shape (custom SVG in React Flow custom node) -- visually distinct from character circles.
- Size: `60px + (power_level * 12)px` across. Range: 72px to 180px.
- Fill: faction `color` at 20% opacity. Stroke: faction `color` at 100%, 3px.
- Inner content: faction name (12px semi-bold Inter, centered), power bar (horizontal bar below name, filled proportional to power_level, colored by faction color).
- Member count badge: small circle in top-right of hexagon, showing member count.
- Hierarchy indicator: if the faction has a parent, a small "chevron up" icon appears in the top-left.

**Allegiance edges:**
- Line color and style by type:
  - Alliance: `#10b981` (emerald), solid, bidirectional arrows.
  - Conflict: `#dc2626` (red), dashed (6,4), bidirectional arrows.
  - Vassal: `#6366f1` (indigo), solid, unidirectional arrow (vassal -> lord).
  - Neutral: `#94a3b8` (gray), dotted (2,4), no arrows.
  - Trade: `#f59e0b` (amber), solid, bidirectional arrows.
  - Rivalry: `#f97316` (orange), dashed (4,4), bidirectional arrows.
- Line width: `1px + (strength * 0.4)px`. Range: 1.4px to 5px.
- Label at midpoint: allegiance type (10px Inter) on a pill background.

**Time slider:**
- Shared TimeSlider component below the canvas.
- As time changes: nodes resize (power_level changes), edges appear/disappear/change type (allegiances evolve), smooth 300ms transitions.
- Factions that do not exist at the current time point: fully hidden (not just transparent).

### Interactions

| Action | Behavior |
|--------|----------|
| Click faction node | Selects. Right panel shows: name, description, power level, members list (with links to character profiles), all allegiances. |
| Double-click faction node | Navigates to faction detail page. |
| Hover faction node | All edges connected to this faction highlight. Other factions dim to 30% opacity. Tooltip: name, power level, member count. |
| Hover allegiance edge | Tooltip: "{source} -- {type} -- {target}, strength {n}/10, {description}". |
| Drag faction node | Repositions. |
| Time slider drag | Updates the graph to show relationships at that narrative point. Smooth animated transitions. |
| Time slider play | Auto-advances through scenes, animating power and allegiance changes. |
| Right-click faction | Context menu: "View members", "View detail", "Hide faction". |

### Controls

**Toolbar:**
- **Layout toggle**: force-directed | hierarchical.
- **Allegiance type filter**: checkboxes for each allegiance type.
- **Minimum power level slider** (1-10): hides factions below threshold.
- **Label toggle**: show/hide edge labels.
- **Minimap toggle**.
- **Export image**.

### States

| State | Display |
|-------|---------|
| Loading | 4 hexagonal placeholder nodes in shimmer with 5 placeholder edges. |
| Empty | Centered: shield icon + "No factions in this story world yet. Create factions to map power dynamics." CTA: "Create Faction". |
| Error | Red banner with retry. |
| Populated | Full faction graph with time slider. |

### Performance

- Faction maps are typically small (< 50 factions). No special performance handling needed.
- Time slider transitions: pre-compute allegiance state at each scene to avoid re-fetching. Cache in store as a Map<sceneId, { factions: Faction[], allegiances: Allegiance[] }>.

### Accessibility

- Faction nodes: `role="button"` with `aria-label="{name}, power level {n} out of 10, {memberCount} members, {allegianceCount} allegiances"`.
- Edges: `role="img"` with `aria-label="{source} {type} {target}, strength {n} out of 10"`.
- Time slider: `role="slider"` with `aria-label="Timeline position"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext="{scene title}"`.
- Tab navigates between faction nodes in power-level order (highest first). Arrow keys move between connected factions via edges. Enter opens detail.

---

## 10. Beat Sheet / Scene Board

### Purpose

The primary writing organization tool -- a kanban-style board for arranging story beats into scenes and acts. This is the StoryForge equivalent of index cards on a corkboard, matching and exceeding Othelia's beat card system. Beats can be filtered, sorted, color-coded, star-rated, and tagged. Drag-and-drop reordering automatically updates the treatment document and story world position data. The AI Wand icon on each card enables opt-in AI generation of beat titles and descriptions.

### Library

**Custom React** -- built with a custom drag-and-drop implementation using `@dnd-kit/core` and `@dnd-kit/sortable` (MIT, 14K stars). No visualization library needed -- this is a structured UI component, not a data visualization.

### Component

```
src/components/visualizations/BeatSheet.tsx
```

Supporting files:
```
src/components/visualizations/beat-sheet/BeatCard.tsx        # Individual beat card
src/components/visualizations/beat-sheet/BeatColumn.tsx      # Act/section column
src/components/visualizations/beat-sheet/BeatMinimap.tsx     # Mini-map navigator
src/components/visualizations/beat-sheet/BeatFilter.tsx      # Filter toolbar
src/components/visualizations/beat-sheet/AiWandButton.tsx    # AI generation trigger
src/components/visualizations/beat-sheet/StarRating.tsx      # 1-5 star input
```

**Page route:** `src/app/(dashboard)/world/[id]/beats/page.tsx`

### Data Requirements

**Primary endpoint:** `GET /api/worlds/{worldId}/beats?include=characters,tags,structureMappings`

**Response shape:**
```ts
interface Beat {
  id: string;
  title: string;
  description: string;
  sjuzhet_position: number;
  act_label: string;             // "Act 1", "Season 1 Episode 3", etc.
  characters: { id: string; name: string; avatar_url?: string }[];
  color: string;                 // user-assigned hex color
  tags: string[];
  notes: string;
  star_rating: number;           // 1-5 (0 = unrated)
  structure_beat?: {             // if mapped to a structure template
    template_name: string;
    beat_name: string;
    expected_percent: number;
  };
  linked_scene_id?: string;      // link to writing surface scene
}
```

**Mutation endpoints:**
- `PATCH /api/worlds/{worldId}/beats/{beatId}` -- update beat fields
- `PUT /api/worlds/{worldId}/beats/reorder` -- bulk reorder (send new position array)
- `POST /api/worlds/{worldId}/beats` -- create new beat
- `DELETE /api/worlds/{worldId}/beats/{beatId}` -- delete beat
- `POST /api/worlds/{worldId}/ai/generate-beat` -- AI Wand generation

**Store:** `src/stores/beat-sheet-store.ts`

### Visual Design

**Layout:**
- Horizontal scrolling kanban board.
- Columns: one per act/section (Act 1, Act 2a, Act 2b, Act 3 for film; Season/Episode/Act for TV).
- Column header: act label (16px semi-bold), beat count badge, "+" add beat button.
- Cards flow vertically within each column, top to bottom.
- Column width: 320px fixed. Column min-height: fills viewport. Scrolls vertically if cards exceed viewport.

**Beat cards:**
- Width: 296px (320px column - 24px padding).
- Background: white (light mode) / `#1e293b` (dark mode).
- Left border: 4px solid, colored by the card's `color` field (user-assigned).
- Border-radius: 8px.
- Shadow: `0 1px 3px rgba(0,0,0,0.1)`.
- Padding: 12px.
- Content layout (top to bottom):
  1. **Title**: 14px semi-bold, single line, truncated. If mapped to a structure beat, a small badge shows the template beat name (e.g., "Catalyst") in 10px text on a colored pill.
  2. **Description**: 12px, 3-line clamp with "more..." expand link. Full text in expanded state.
  3. **Character avatars**: row of 20px avatar circles (max 4 visible, +N badge for overflow). Tooltip shows names.
  4. **Tags**: row of small pills (10px, colored by tag). Max 3 visible, +N for overflow.
  5. **Bottom bar**: star rating (left, 5 small stars, filled gold for rated), AI Wand icon button (right, sparkle icon), notes icon (if notes exist, speech-bubble icon with dot indicator).
- Drag handle: entire card is draggable. Cursor changes to grab on hover, grabbing on drag.
- Hover state: shadow increases to `0 4px 12px rgba(0,0,0,0.15)`. Slight scale (1.01x).
- Selected state: 2px solid indigo border.

**AI Wand button:**
- Sparkle icon (16px), positioned in bottom-right of card.
- Disabled (gray, no click) if the Story Sidebar synopsis is empty. Tooltip: "Fill in your synopsis in the Story Sidebar to enable AI suggestions."
- Enabled (indigo): on click, opens a small floating panel below the card showing:
  - "Generate title suggestion" button.
  - "Generate description suggestion" button.
  - Loading state: sparkle icon pulses.
  - Result: suggested text in a bordered box with "Accept", "Edit", "Dismiss" buttons.
  - Accepted text replaces the card field. Dismissed text disappears.

**Mini-map navigator:**
- Fixed position: bottom-left corner of the viewport, 200px x 120px.
- Shows a miniature representation of the entire board: columns as thin vertical bars, cards as tiny colored rectangles.
- A viewport rectangle (semi-transparent blue border) shows the currently visible area.
- Click/drag on minimap to navigate the board.

**Structure mapping overlay:**
- When a structure template is active, expected beat positions are shown as ghost cards (dashed border, no background) in the appropriate column position. Label: template beat name.
- If a real beat card is mapped to a structure beat, the ghost card disappears and the real card shows the mapping badge.

### Interactions

| Action | Behavior |
|--------|----------|
| Drag card | Pick up card. Other cards animate out of the way (200ms ease). Drop in new position within same or different column. Triggers reorder API call and treatment regeneration. |
| Click card | Selects card. Shows detail panel on right: all fields editable. |
| Double-click card title | Inline edit mode for title. |
| Click star rating | Sets rating (1-5). Click same star again to clear. |
| Click AI Wand | Opens AI suggestion panel (see above). Requires synopsis. |
| Click "+" in column header | Creates a new blank beat at the end of that column. Opens inline edit. |
| Right-click card | Context menu: "Edit", "Duplicate", "Delete", "Go to Script Section", "Set Color", "Map to Structure Beat". |
| Click card when script exists | If `linked_scene_id` is set, navigates to `/world/{id}/write?scene={sceneId}`. |
| Ctrl+click multiple cards | Multi-select. Can drag multiple cards together. Can bulk-tag, bulk-color, bulk-delete. |
| Type in filter bar | Filters visible cards by text search across title, description, tags. |
| Click minimap | Scrolls the board to the clicked position. |

### Controls

**Toolbar:**
- **Structure template selector**: dropdown to overlay a template (same as Arc Diagram).
- **View mode**: "Board" (kanban) | "List" (table view with sortable columns).
- **New beat**: "+" button to create a beat.
- **Bulk actions** (visible when multi-select active): "Set color", "Add tag", "Delete selected".
- **Export**: export beat list as CSV or JSON.

**Filter bar (below toolbar):**
- Star rating filter: clickable stars (show beats >= selected rating).
- Tag filter: tag chips with autocomplete.
- Character filter: character dropdown.
- Structure beat filter: dropdown of beats from active template.
- Color filter: color swatches.
- **Reset all filters** button (appears when any filter is active).

### States

| State | Display |
|-------|---------|
| Loading | 3 columns with 3 placeholder card skeletons each (shimmer). |
| Empty | Single column with centered: cards icon + "No beats yet. Start building your story by adding beats." CTA: "Add First Beat". |
| Error | Red banner with retry. |
| Populated | Full kanban board with cards organized by act. |
| Filtered to zero | All columns visible but empty. Banner: "No beats match current filters." Reset button. |

### Performance

- Beat sheets are typically < 200 cards. `@dnd-kit` handles this without issues.
- For TV series with 500+ beats: virtualize cards within each column (only render visible cards + buffer).
- Minimap: rendered using `<canvas>` for performance (drawing 500 tiny rectangles on canvas is faster than 500 DOM elements).
- Reorder API call: debounce to 500ms after last drop to batch rapid reordering.

### Accessibility

- Board container: `role="region"` with `aria-label="Beat Sheet"`.
- Columns: `role="group"` with `aria-label="{act label}, {count} beats"`.
- Cards: `role="listitem"` with `aria-label="{title}, {star_rating} stars, characters: {names}, tags: {tags}"`. Also `aria-grabbed` during drag.
- Drag-and-drop: `aria-roledescription="sortable"`. Announcements: "Picked up {title}", "Moved to position {n} in {column}", "Dropped {title} at position {n}".
- Star rating: `role="radiogroup"` with `aria-label="Rating"`. Each star is `role="radio"`.
- AI Wand: `aria-label="AI suggestions"` with `aria-disabled` when synopsis is empty.
- Tab navigates between cards in column order. Arrow Up/Down within column. Arrow Left/Right between columns. Enter to select/expand. Space to pick up for drag.

---

## 11. Foreshadowing Web

### Purpose

Tracks setups and payoffs throughout the narrative as a directed graph. Every Chekhov's gun, planted clue, character promise, or thematic setup is a node; every payoff, reveal, or fulfillment connects back to its setup. The visualization highlights orphaned setups (unfulfilled promises -- amber) and deus ex machina moments (payoffs that came from nowhere -- red), helping writers ensure narrative satisfaction and avoid loose threads.

### Library

**React Flow** (`@xyflow/react`) -- directed graph with custom nodes for setup/payoff events and directed edges showing the foreshadowing thread.

### Component

```
src/components/visualizations/ForeshadowingWeb.tsx
```

Supporting files:
```
src/components/visualizations/foreshadowing/SetupNode.tsx    # Setup event node
src/components/visualizations/foreshadowing/PayoffNode.tsx   # Payoff event node
src/components/visualizations/foreshadowing/ThreadEdge.tsx   # Directed thread edge
```

**Page route:** `src/app/(dashboard)/world/[id]/foreshadowing/page.tsx`

### Data Requirements

**Primary endpoint:** `GET /api/worlds/{worldId}/setup-payoffs?include=events`

**Response shape:**
```ts
interface SetupPayoff {
  id: string;
  setup_event_id: string;
  setup_event: {
    id: string;
    title: string;
    scene_title: string;
    sjuzhet_position: number;
  };
  payoff_event_id?: string;      // null for orphaned setups
  payoff_event?: {
    id: string;
    title: string;
    scene_title: string;
    sjuzhet_position: number;
  };
  thread_name: string;           // name for this foreshadowing thread
  thread_color: string;
  description: string;
  is_orphan: boolean;            // setup with no payoff
  is_deus_ex: boolean;           // payoff with no setup
}
```

**Store:** `src/stores/foreshadowing-store.ts`

### Visual Design

**Layout:**
- React Flow canvas with a left-to-right layout (narrative time flows left to right).
- Nodes positioned by `sjuzhet_position` on the X-axis (earlier events left, later events right).
- Y-axis: grouped by thread (each foreshadowing thread gets its own horizontal lane).
- Dagre layout with `rankdir: 'LR'`.

**Setup nodes:**
- Rounded rectangle, 180px x 60px.
- Left border: 4px solid `#f59e0b` (amber, the "planting" color).
- Small seed icon (16px) in top-left corner.
- Content: thread name (11px, amber text), event title (12px semi-bold), scene title (10px, `--viz-text-muted`).
- Orphaned setup (no payoff): entire border becomes amber (4px solid all around), pulsing glow animation (subtle amber shadow that fades in/out, 3s cycle).

**Payoff nodes:**
- Rounded rectangle, 180px x 60px.
- Left border: 4px solid `#10b981` (emerald, the "harvest" color).
- Small checkmark icon (16px) in top-left corner.
- Content: thread name (11px, emerald text), event title (12px semi-bold), scene title (10px, `--viz-text-muted`).
- Deus ex machina (no setup): entire border becomes red (`#dc2626`, 4px solid all around), pulsing glow animation (red shadow, 3s cycle).

**Thread edges:**
- Directed arrows from setup to payoff.
- Color: `thread_color` from the setup-payoff data.
- Width: 2px.
- Style: solid with arrowhead at payoff end.
- If multiple setups feed into one payoff (converging threads), multiple edges converge.
- Animated dash motion (CSS stroke-dashoffset animation, 2s cycle) to show directionality.

**Thread-line timeline view (alternative layout):**
- Toggled via toolbar. Changes layout to horizontal timeline with threads as horizontal lines spanning from setup to payoff.
- X-axis: narrative position.
- Each thread is a horizontal colored line from setup position to payoff position.
- Orphans: line extends to the right edge with a "?" terminus.
- Deus ex: line extends to the left edge with a "!" origin.

**Summary badges (top of canvas):**
- "Total threads: {n}" | "Fulfilled: {n}" (green badge) | "Orphaned: {n}" (amber badge) | "Deus ex machina: {n}" (red badge).

### Interactions

| Action | Behavior |
|--------|----------|
| Click node | Selects. Right panel shows: event details, all connected setups/payoffs, thread description. |
| Double-click node | Navigates to scene in Writing Surface. |
| Hover node | Tooltip: event title, scene title, thread name. All edges for this thread highlight. |
| Hover edge | Tooltip: "{setup title} -> {payoff title}: {description}". |
| Click orphan badge (top) | Filters to show only orphaned setups. |
| Click deus ex badge (top) | Filters to show only deus ex machina payoffs. |
| Click "Create payoff" (on orphan node context menu) | Opens dialog to link this setup to an existing event or create a new payoff event. |
| Click "Create setup" (on deus ex node context menu) | Opens dialog to link this payoff to an existing event or create a new setup event. |

### Controls

**Toolbar:**
- **View toggle**: "Web" (graph) | "Timeline" (thread-line view).
- **Show only issues**: toggle to filter to orphans and deus ex machina only.
- **Thread filter**: multi-select dropdown of thread names.
- **Minimap toggle**.
- **Export image**.

### States

| State | Display |
|-------|---------|
| Loading | 4 placeholder nodes with 3 placeholder edges in shimmer. |
| Empty | Centered: chain-link icon + "No foreshadowing connections tracked yet. Create setup-payoff links to track your story's promises." CTA: "Create Foreshadowing Thread". |
| Error | Red banner with retry. |
| Populated | Full directed graph with summary badges. |

### Performance

- Foreshadowing webs are typically < 100 threads with < 300 nodes. No special performance handling.
- Thread-line view: pure SVG line rendering, very lightweight.

### Accessibility

- Setup nodes: `role="button"`, `aria-label="Setup: {event title} in scene {scene title}, thread: {thread name}"`. If orphan: append ", unfulfilled -- no payoff yet".
- Payoff nodes: `role="button"`, `aria-label="Payoff: {event title} in scene {scene title}, thread: {thread name}"`. If deus ex: append ", no preceding setup".
- Edges: `role="img"`, `aria-label="Foreshadowing thread: {thread name}, from {setup title} to {payoff title}"`.
- Summary badges: `role="status"`, `aria-live="polite"`.
- Tab navigates nodes left-to-right (by narrative position). Enter opens detail. Escape deselects.

---

## 12. Causality Graph

### Purpose

Visualizes not just WHEN events happen but WHY. Each event is connected to other events by typed causal relationships: physical causation (the explosion destroyed the bridge), motivation (she saved him because she loved him), psychological trigger (his father's death drove him to revenge), and enabling conditions (the open gate allowed the escape). Writers can trace any event backward to its root causes or forward to its consequences, revealing the deep causal structure of their narrative.

### Library

**React Flow** (`@xyflow/react`) -- directed acyclic graph (DAG) with dagre layout, custom nodes, and custom typed edges.

### Component

```
src/components/visualizations/CausalityGraph.tsx
```

Supporting files:
```
src/components/visualizations/causality/EventNode.tsx        # Event node
src/components/visualizations/causality/CausalEdge.tsx       # Typed causal edge
```

**Page route:** `src/app/(dashboard)/world/[id]/causality/page.tsx`

### Data Requirements

**Primary endpoint:** `GET /api/worlds/{worldId}/causal-relations?include=events`

**Response shape:**
```ts
interface CausalRelation {
  id: string;
  cause_event_id: string;
  effect_event_id: string;
  cause_event: { id: string; title: string; scene_title: string; sjuzhet_position: number };
  effect_event: { id: string; title: string; scene_title: string; sjuzhet_position: number };
  causality_type: 'physical' | 'motivational' | 'psychological' | 'enabling';
  description: string;
  strength: number;              // 1-10
}
```

**Trace endpoint:** `GET /api/worlds/{worldId}/causal-relations/trace?event={eventId}&direction=backward|forward&depth={n}` -- returns a subtree of causal relations starting from a specific event.

**Store:** `src/stores/causality-store.ts`

### Visual Design

**Layout:**
- React Flow canvas with left-to-right dagre layout (causes on left, effects on right, matching narrative flow).
- Node separation: 100px horizontal, 60px vertical.

**Event nodes:**
- Rounded rectangles, 200px x 70px.
- Border: 2px solid, colored by event_type (reusing event_type colors from Dual Timeline).
- Content: event title (13px semi-bold), scene title subtitle (11px `--viz-text-muted`), event_type badge (small colored pill).
- Background: white / dark mode surface.

**Causal edges:**
- Directed arrow from cause to effect.
- Color and style by causality type (from the Causality Edge Colors table):
  - Physical: Sky (#0ea5e9), solid, 2px.
  - Motivational: Amber (#f59e0b), dashed (6,3), 2px.
  - Psychological: Violet (#8b5cf6), dotted (3,3), 2px.
  - Enabling: Emerald (#10b981), dash-dot (8,3,2,3), 2px.
- Width varies by strength: `1px + (strength * 0.3)px`.
- Label at midpoint: causality type (10px Inter) on translucent background pill.
- Arrowhead: filled triangle matching edge color.

**Trace highlight:**
- When a user traces from a specific event, the traced path is highlighted (full opacity, glowing shadow), and all non-traced nodes/edges become 15% opacity.
- Traced path nodes get a 3px indigo ring.

### Interactions

| Action | Behavior |
|--------|----------|
| Click node | Selects event. Right panel shows: event details, all direct causes (with type), all direct effects (with type). |
| Double-click node | Navigates to scene in Writing Surface. |
| Right-click node | Context menu: "Trace backward" (show all causes recursively), "Trace forward" (show all effects recursively), "Reset trace". |
| Hover node | Highlights all directly connected edges. Tooltip: event title, scene, type. |
| Hover edge | Tooltip: "{cause title} -> {effect title}: {causality_type}, strength {n}/10, {description}". |
| Click "Trace backward" | Calls trace API with direction=backward. Highlights the resulting subtree. Non-traced content fades. |
| Click "Trace forward" | Same, with direction=forward. |
| Click "Reset trace" | Restores full graph visibility. |

### Controls

**Toolbar:**
- **Causality type filter**: 4 checkboxes with colored icons (Physical, Motivational, Psychological, Enabling).
- **Depth limit**: slider (1-10) limiting how many causal hops are shown from any root event.
- **Layout direction**: left-to-right (default) | top-to-bottom.
- **Label toggle**: show/hide edge labels.
- **Minimap toggle**.
- **Export image**.

**Filter panel:**
- Event search (find specific events to start tracing from).
- Minimum strength slider (1-10).
- Character filter (show only events involving certain characters).
- Reset filters.

### States

| State | Display |
|-------|---------|
| Loading | 5 placeholder rectangles with 6 placeholder directed edges in shimmer. |
| Empty | Centered: chain icon + "No causal relationships mapped yet. Add causality links between events to build your story's causal graph." CTA: "Add Causal Link". |
| Error | Red banner with retry. |
| Populated | Full DAG with typed, colored edges. |

### Performance

- Causality graphs can be large for complex narratives (500+ events, 2000+ relations).
- **Under 200 nodes**: standard React Flow rendering.
- **200-1000 nodes**: enable dagre layout caching (compute once, cache positions). Disable edge labels by default.
- **1000+ nodes**: show a warning. Suggest using the trace feature to view subtrees rather than the full graph. Alternatively, switch to Cosmos WebGL renderer.
- Trace API: server-side recursive CTE query with depth limit. Sub-200ms for depth <= 5 in a well-indexed graph.

### Accessibility

- Nodes: `role="treeitem"` with `aria-label="{event title}, in scene {scene title}, {causeCount} causes, {effectCount} effects"`.
- Edges: `role="img"` with `aria-label="{causality type} causation: {cause title} causes {effect title}, strength {n}"`.
- Tab navigates nodes left-to-right (causes before effects). Arrow keys follow causal edges (Right = follow effect, Left = follow cause, Up/Down = siblings).
- Trace mode: announces "Tracing backward from {event title}, {n} causes found" via `aria-live`.
- Color-blind: each causality type has a distinct dash pattern (described above) in addition to color.

---

## 13. Audience Knowledge Map

### Purpose

Tracks what information the audience possesses at each point in the narrative versus what individual characters know. This is the engine for managing dramatic irony (audience knows more than characters), suspense (audience knows less), and mystery reveals. Writers can scrub through the narrative timeline and see exactly what knowledge state the audience and each character are in, identify moments of dramatic irony, and ensure that mystery reveals land at the right time.

### Library

**Custom React + D3.js** -- a hybrid component. The layout is primarily custom React (split panels, lists, badges). D3 is used for a small timeline chart showing knowledge acquisition over time.

### Component

```
src/components/visualizations/AudienceKnowledge.tsx
```

Supporting files:
```
src/components/visualizations/audience-knowledge/KnowledgePanel.tsx    # Audience/character knowledge list
src/components/visualizations/audience-knowledge/IronyMarker.tsx       # Dramatic irony indicator
src/components/visualizations/audience-knowledge/RevealTimeline.tsx    # D3 reveal timeline chart
```

**Page route:** `src/app/(dashboard)/world/[id]/knowledge/page.tsx`

### Data Requirements

**Primary endpoint:** `GET /api/worlds/{worldId}/audience-knowledge?at_scene={sceneId}`

**Response shape:**
```ts
interface AudienceKnowledgeState {
  scene_id: string;
  scene_title: string;
  scene_sjuzhet_position: number;
  audience_knows: KnowledgeFact[];
  character_knowledge: {
    character_id: string;
    character_name: string;
    knows: KnowledgeFact[];
  }[];
  dramatic_irony_moments: IronyMoment[];
  reveals_in_scene: Reveal[];
}

interface KnowledgeFact {
  id: string;
  fact: string;                  // natural language description
  learned_at_scene_id: string;
  learned_at_scene_title: string;
  category: 'identity' | 'motive' | 'event' | 'relationship' | 'secret' | 'location' | 'ability';
  is_true: boolean;              // can track false beliefs / misinformation
}

interface IronyMoment {
  fact_id: string;
  fact: string;
  audience_knows: boolean;
  characters_who_dont_know: string[];  // character names
  irony_type: 'dramatic' | 'tragic' | 'comic';
}

interface Reveal {
  fact_id: string;
  fact: string;
  revealed_to: 'audience' | string;  // 'audience' or character name
  previously_hidden_since_scene: string;
}
```

**Store:** `src/stores/knowledge-store.ts`

### Visual Design

**Layout:**
- Split vertical layout, two panels side by side:
  - Left panel (50%): "Audience Knowledge" -- header bar with eye icon.
  - Right panel (50%): "Character Knowledge" -- header bar with person icon + character selector dropdown.
- Below both panels: a horizontal timeline scrubber (shared TimeSlider component) spanning the full width.
- Below the scrubber: a "Reveal Timeline" mini-chart (D3, 120px tall) showing when facts are revealed over the narrative.

**Audience Knowledge panel (left):**
- Scrollable list of KnowledgeFact items.
- Each fact: a card (full width, 48px tall, border-left 3px colored by category):
  - Category colors: identity=#6366f1, motive=#f59e0b, event=#f97316, relationship=#ec4899, secret=#dc2626, location=#10b981, ability=#8b5cf6.
  - Content: fact text (12px Inter), "learned in: {scene title}" subtitle (10px, `--viz-text-muted`).
  - False beliefs: fact text with strikethrough and a red "false" badge.
- Facts newly revealed in the current scene: highlighted with a subtle yellow background that fades after 2 seconds.
- Total count badge in panel header.

**Character Knowledge panel (right):**
- Character selector: dropdown at top of panel showing character name + avatar. Selecting a character loads their knowledge state.
- Same fact card format as audience panel.
- Facts that the audience knows but this character does not: shown as grayed-out ghost cards with a "dramatic irony" label (small theater-mask icon).

**Dramatic irony indicators:**
- When a fact exists in the audience panel but not in the selected character's panel, a connecting line (dashed, red, horizontal) visually links the fact card on the left to the ghost card position on the right.
- A badge at the top of the view: "Dramatic irony active: {n} facts" -- colored badge, theater-mask icon.

**Mystery/revelation markers:**
- In the Reveal Timeline mini-chart (below scrubber):
  - X-axis: narrative position. Y-axis: not applicable (markers only).
  - Each reveal is a vertical marker line at the scene position, colored by category.
  - Audience reveals: markers above the center line (pointing up).
  - Character reveals: markers below the center line (pointing down).
  - Hidden information zones: shaded regions from when a fact is hidden to when it's revealed.

### Interactions

| Action | Behavior |
|--------|----------|
| Drag time scrubber | Updates both panels to show knowledge state at that narrative position. Facts animate in/out as the scrubber moves. |
| Click fact card (audience panel) | Highlights this fact. Shows which characters know it (green check) and which do not (red X) in a popup. |
| Click ghost card (character panel) | Shows the dramatic irony detail: "The audience knows {fact} but {character} does not. This creates {irony_type} irony." |
| Click reveal marker (timeline) | Scrolls scrubber to that scene. Highlights the revealed fact in the appropriate panel. |
| Double-click fact card | Navigates to the scene where the fact was learned. |
| Character selector change | Switches the right panel to the new character's knowledge state. |
| Click "Compare characters" | Changes right panel to show 2-3 characters side by side (narrower columns) for comparing knowledge states. |

### Controls

**Toolbar:**
- **Character selector**: dropdown for right panel.
- **Compare mode**: toggle to show multiple characters.
- **Category filter**: checkboxes for fact categories.
- **Show only irony**: toggle to filter to only facts where audience/character knowledge diverges.
- **Show false beliefs**: toggle to include/exclude misinformation facts.
- **Export image**.

### States

| State | Display |
|-------|---------|
| Loading | Two panel skeletons with 5 shimmer list items each. |
| Empty | Split panels with: "No knowledge tracking data yet. Knowledge facts are created during entity extraction or can be added manually." CTA: "Add Knowledge Fact". |
| Error | Red banner with retry. |
| Populated | Full split view with facts, irony indicators, and reveal timeline. |

### Performance

- Knowledge state is computed per-scene server-side (cumulative query: all facts with `learned_at <= current_scene`). Cached per scene in the store.
- For scrubber drag: pre-fetch knowledge states for adjacent scenes (current +/- 5) to enable smooth scrubbing.
- Reveal timeline: lightweight D3 marker chart. Under 200 markers, no issues.

### Accessibility

- Panels: `role="region"` with `aria-label="Audience knowledge"` and `aria-label="{character name}'s knowledge"`.
- Fact cards: `role="listitem"` with `aria-label="{fact}, category: {category}, learned in scene: {scene title}"`. False beliefs: append ", believed but false".
- Ghost cards (irony): `aria-label="Dramatic irony: audience knows {fact} but {character} does not"`.
- Time scrubber: `role="slider"` with full aria attributes.
- Tab navigates between fact cards in each panel. Shift+Tab switches between panels.
- Screen reader: announces "At scene {title}: audience knows {n} facts, {character} knows {m} facts, {k} dramatic irony moments" when scrubber changes position.

---

## 14. Writing Surface

### Purpose

The integrated manuscript/screenplay editor where actual writing happens. This is not a data visualization in the traditional sense but a rich text editor deeply connected to the story world data. It supports two modes (prose and screenplay), entity highlighting, a persistent Story Sidebar for context, AI Wand integration for opt-in generation, and split-view with source material. The writing surface is the connective tissue between the analytical/structural tools and the actual creative output.

### Library

**TipTap** (`@tiptap/react`) -- the rich text editor framework. Extensions used:
- `@tiptap/starter-kit` -- basic formatting (bold, italic, headings, lists, blockquotes).
- `@tiptap/extension-placeholder` -- placeholder text.
- `@tiptap/extension-character-count` -- word/character counting.
- `@tiptap/extension-collaboration` -- Yjs CRDT integration for real-time collaboration.
- `@tiptap/extension-highlight` -- entity highlighting with custom colors.
- Custom extensions: screenplay formatting (slugline, action, dialogue, parenthetical, transition).
- `novel` (TipTap-based editor package) as a reference for slash-command menu and AI assist patterns.

### Component

```
src/components/editors/WritingSurface.tsx
```

Supporting files:
```
src/components/editors/ProseEditor.tsx              # Prose mode configuration
src/components/editors/ScreenplayEditor.tsx          # Screenplay mode configuration
src/components/editors/screenplay-extensions/        # Custom TipTap extensions for screenplay formatting
  Slugline.ts
  Action.ts
  Dialogue.ts
  Parenthetical.ts
  Transition.ts
src/components/editors/EntityHighlight.tsx            # Custom highlight mark for entities
src/components/editors/AiWandPanel.tsx               # AI suggestion review panel
src/components/editors/FocusMode.tsx                 # Distraction-free wrapper
src/components/story-sidebar/StorySidebar.tsx        # Persistent left sidebar
src/components/story-sidebar/SynopsisField.tsx       # Synopsis textarea
src/components/story-sidebar/WorldStats.tsx           # Quick stats display
src/components/story-sidebar/CharacterQuickList.tsx   # Character list with links
```

**Page route:** `src/app/(dashboard)/world/[id]/write/page.tsx`

### Data Requirements

**Primary endpoint:** `GET /api/worlds/{worldId}/scenes/{sceneId}/content` -- returns the scene's TipTap JSON document content.

**Save endpoint:** `PUT /api/worlds/{worldId}/scenes/{sceneId}/content` -- saves TipTap JSON document.

**Entity detection endpoint:** `POST /api/worlds/{worldId}/analyze/entities-in-text` -- sends text, returns entity positions for highlighting.

**AI Wand endpoint:** `POST /api/worlds/{worldId}/ai/generate-text` -- sends beat context + synopsis, returns generated text suggestion.

**Synopsis endpoint:** `GET /api/worlds/{worldId}/synopsis` and `PUT /api/worlds/{worldId}/synopsis`.

**Store:** `src/stores/writing-surface-store.ts`

### Visual Design

**Layout:**
- 3-column layout (adjustable):
  - Left: Story Sidebar (280px, collapsible).
  - Center: Editor canvas (fills remaining space, max-width 800px, centered).
  - Right: optional split view -- source material viewer or beat detail (400px, collapsible).

**Story Sidebar (left):**
- Fixed header: "Story" with collapse button.
- Synopsis field: multi-line textarea (160px tall), placeholder "Write your synopsis here... (required for AI features)". Character count below.
- Divider.
- World stats: "Characters: {n}", "Scenes: {n}", "Words: {totalWords}", "Beats: {n}" as a compact stat grid.
- Divider.
- Character quick-list: scrollable list of character names with small avatars. Click navigates to character profile. Drag onto editor text to insert character mention.
- Divider.
- Scene navigator: collapsible tree of chapters > scenes matching the current document's structure hierarchy.

**Editor canvas (center):**
- Clean writing area with generous margins (64px left/right, 48px top).
- Prose mode: standard rich text with heading levels, paragraphs, block quotes, lists.
- Screenplay mode: elements auto-format based on keyboard shortcuts and content patterns:
  - Slugline (scene heading): ALL CAPS, bold, preceded by "INT." or "EXT.". Styled with left-aligned uppercase, underlined bottom border.
  - Action: normal text, full width.
  - Character name (dialogue heading): centered, ALL CAPS.
  - Dialogue: centered, narrower width (60% of editor width).
  - Parenthetical: centered, in parentheses, italic.
  - Transition: right-aligned, ALL CAPS (e.g., "CUT TO:").
- Entity highlights: recognized character names, locations, and objects are underlined with entity-type color (dotted underline, 2px). Clicking opens a small popover with entity name, type badge, and "View detail" link.
- Cursor: standard text cursor. In screenplay mode, a small badge to the left of the current line shows the element type (slug, action, dialog, etc.).
- Word count: bottom-right corner of editor, "1,234 / 5,000 words" (if target set) or just "1,234 words" if no target. Progress bar if target set (green when on track, amber when behind).

**AI Wand Panel:**
- Triggered by clicking the Wand icon in the toolbar or by slash command `/ai`.
- Appears as a floating panel (360px wide, anchored below the toolbar or at cursor position).
- Contains: "What would you like help with?" prompt + preset buttons: "Draft this scene", "Expand this paragraph", "Suggest dialogue".
- Result area: generated text displayed in a bordered box with different styling (light purple background, `#f5f3ff`) to distinguish from user's writing.
- Action buttons: "Accept" (inserts into editor), "Edit" (copies to a new draft block), "Regenerate" (re-runs with different temperature), "Dismiss".
- Loading state: sparkle animation + "Generating suggestion..." text.

**Focus mode:**
- Activated via toolbar button or Ctrl+Shift+F.
- Fades out the Story Sidebar and right panel. Editor goes full-viewport with dark overlay (95% opacity `--viz-bg`).
- Only the current paragraph is at full brightness. Surrounding paragraphs are at 30% opacity.
- Minimal toolbar: only Escape (to exit focus mode) and word count visible.
- Click outside the editor or press Escape to exit.

### Interactions

| Action | Behavior |
|--------|----------|
| Type in editor | Standard text editing. In screenplay mode, Tab/Enter cycle through element types contextually (e.g., after character name, next Enter creates dialogue block). |
| Click entity highlight | Popover shows entity name, type, brief description, "View full profile" link. |
| Ctrl+click entity highlight | Navigates to entity's full profile page. |
| Click Wand icon | Opens AI Wand panel. Disabled (grayed, tooltip explains) if synopsis is empty. |
| Click "Accept" in Wand panel | Inserts generated text at cursor position. Marked with a subtle "AI-generated" indicator (faint sparkle icon in the gutter) that fades after the user edits the text. |
| Click scene in sidebar navigator | Scrolls editor to that scene. Loads scene content if different document. |
| Ctrl+S | Saves current content to API. Auto-save fires every 30 seconds of idle time after edits. |
| Click "Split view" toolbar button | Opens right panel with a selector: "Source Material" or "Beat Card". Shows the selected content alongside the editor. |
| Keyboard shortcut (screenplay mode) | Ctrl+1 = Slugline, Ctrl+2 = Action, Ctrl+3 = Character, Ctrl+4 = Dialogue, Ctrl+5 = Parenthetical, Ctrl+6 = Transition. |

### Controls

**Toolbar:**
- **Mode toggle**: "Prose" | "Screenplay" segmented control.
- **Formatting**: bold, italic, underline, heading levels (prose mode). Element type buttons (screenplay mode).
- **AI Wand**: sparkle icon button.
- **Entity detection**: "Detect entities" button (runs entity detection on current text and adds highlights).
- **Focus mode**: expand icon button.
- **Split view**: split-pane icon button.
- **Word count target**: click to set target, displays progress.
- **Export**: dropdown with "Export as .fountain", "Export as .fdx", "Export as .docx", "Export as .pdf".

### States

| State | Display |
|-------|---------|
| Loading | Editor skeleton with shimmer lines. Sidebar skeleton with shimmer blocks. |
| Empty (new scene) | Blank editor with placeholder text: "Start writing..." (prose) or "FADE IN:" placeholder (screenplay). |
| Error (save failed) | Small red toast notification: "Failed to save. Retrying..." with auto-retry. |
| Populated | Full editor with content, entity highlights, sidebar populated. |
| Disconnected (collaboration) | Yellow banner above editor: "Connection lost. Changes saved locally. Reconnecting..." |

### Performance

- TipTap handles documents up to 100K words without issues.
- Entity highlighting: batch-apply highlights after entity detection (not on every keystroke). Recalculate on explicit "Detect entities" action or on document save.
- Auto-save: debounced 30 seconds. Only sends diff (TipTap Yjs collab handles this natively).
- Collaboration: Yjs CRDT ensures conflict-free concurrent editing. WebSocket connection for real-time sync.

### Accessibility

- Editor: `role="textbox"` with `aria-multiline="true"` and `aria-label="Writing surface, {mode} mode"`.
- Screenplay elements: each element type has `aria-roledescription` (e.g., "scene heading", "dialogue").
- Entity highlights: `role="link"` with `aria-label="Entity: {name}, {type}. Click to view details."`.
- Toolbar buttons: all have `aria-label` and keyboard shortcuts.
- Focus mode: `aria-label="Focus mode active. Press Escape to exit."`.
- Sidebar navigation tree: standard `role="tree"` with `role="treeitem"` for each chapter/scene.
- AI Wand panel: `role="dialog"` with `aria-label="AI writing assistant"`.

---

## 15. Treatment View

### Purpose

Automatically generates a treatment (outline/summary) document from the beat cards in their current order. When writers rearrange beats, the treatment updates in real-time. This provides a professional document that can be exported for pitch meetings, writing room discussions, or studio submissions. Writers can also manually override specific sections of the treatment without losing the auto-generation capability.

### Library

**TipTap** (`@tiptap/react`) -- in read-only mode for the auto-generated sections, editable mode for user overrides. Reuses much of the Writing Surface's TipTap configuration.

### Component

```
src/components/treatment/TreatmentView.tsx
```

Supporting files:
```
src/components/treatment/TreatmentSection.tsx    # Individual beat-derived section
src/components/treatment/OverrideEditor.tsx       # Editable override block
src/components/treatment/ExportDialog.tsx         # Export format selector
```

**Page route:** `src/app/(dashboard)/world/[id]/treatment/page.tsx`

### Data Requirements

**Primary endpoint:** `GET /api/worlds/{worldId}/treatment`

**Response shape:**
```ts
interface Treatment {
  world_id: string;
  title: string;
  sections: TreatmentSection[];
  last_generated_at: string;
}

interface TreatmentSection {
  beat_id: string;
  beat_title: string;
  act_label: string;
  position: number;
  auto_text: string;             // auto-generated treatment text from beat description
  override_text?: string;        // user's manual override (null = use auto_text)
  has_override: boolean;
}
```

**Override save endpoint:** `PUT /api/worlds/{worldId}/treatment/sections/{beatId}/override` -- saves user override text.

**Regenerate endpoint:** `POST /api/worlds/{worldId}/treatment/regenerate` -- re-generates the full treatment from current beats.

**Store:** `src/stores/treatment-store.ts`

### Visual Design

**Layout:**
- Single-column document layout, centered, max-width 720px with generous margins (like a printed document).
- Page-like appearance: white background card with subtle shadow on a `--viz-bg-secondary` background.
- Padding: 64px horizontal, 48px top.

**Document structure:**
- **Title**: world title + "Treatment" subtitle. 28px semi-bold serif font (`Georgia`).
- **Metadata line**: "Generated on {date}" + "Last updated: {date}" in 11px `--viz-text-muted`.
- **Act headers**: act label as H2 (22px semi-bold Georgia). Horizontal rule above each act.
- **Beat sections**: one per beat, in order. Each section:
  - Beat title as H3 (18px semi-bold Georgia).
  - Treatment text as body paragraphs (15px Georgia, line-height 1.8, `--viz-text-primary`).
  - If `has_override`: a small "Manual override" badge (10px, amber pill) appears next to the title. The text shown is `override_text` instead of `auto_text`.
  - Divider (thin horizontal line, `--viz-border`) between sections.

**Override editing:**
- When the user clicks "Edit" on a section, the text becomes editable (TipTap switches from read-only to editable for that section only).
- The editable section gets a 2px left border in amber to indicate override mode.
- "Save override" and "Revert to auto" buttons appear below the section.
- "Revert to auto" clears the override and restores auto-generated text.

**Real-time sync indicator:**
- When beats change in the Beat Sheet (detected via WebSocket or polling), a banner appears at the top: "Beat order has changed. Treatment is updating..." with a refresh animation.
- Sections smoothly reorder (300ms animation) to match new beat order.
- New sections fade in (200ms). Deleted sections fade out (200ms).
- Sections with overrides are NOT regenerated (override persists). However, if the underlying beat's description changes significantly, a small "Beat changed" indicator appears on the section, suggesting the user review their override.

### Interactions

| Action | Behavior |
|--------|----------|
| Scroll | Standard document scrolling. |
| Click "Edit" on section | Enables inline editing for that section (override mode). |
| Click "Save override" | Saves the edited text as an override. `PUT` to API. Badge appears. |
| Click "Revert to auto" | Clears override. Restores auto-generated text. Confirmation dialog first. |
| Click "Regenerate all" (toolbar) | Re-runs treatment generation for all sections without overrides. Confirmation dialog warns that non-overridden sections will be refreshed. |
| Click beat title | Navigates to that beat in the Beat Sheet. |
| Click "Export" | Opens ExportDialog with format options. |
| Ctrl+P | Opens browser print dialog with print-optimized CSS (hides toolbar, maximizes content area). |

### Controls

**Toolbar:**
- **Regenerate all**: refresh icon button. Regenerates non-overridden sections.
- **Show/hide overrides**: toggle to visually distinguish overridden sections (amber border) vs. auto sections.
- **Export**: button with dropdown: "PDF", "DOCX", "Plain Text", "Markdown".
- **Print**: printer icon button.
- **Table of contents**: toggle to show/hide a floating TOC panel (left side, listing act headers and beat titles as anchor links).

### States

| State | Display |
|-------|---------|
| Loading | Document skeleton: title shimmer + 6 section shimmer blocks with lines. |
| Empty (no beats) | Document with title only + centered message: "No beats to generate a treatment from. Create beats in the Beat Sheet first." CTA: "Go to Beat Sheet". |
| Error | Red banner with retry. |
| Populated | Full treatment document with sections. |
| Regenerating | Semi-transparent overlay on non-overridden sections with spinner. Overridden sections remain fully visible. |

### Performance

- Treatment documents are text-only. Even a 200-beat treatment is well within TipTap's capabilities.
- Real-time sync: WebSocket listener for beat changes. Debounce treatment regeneration to 2 seconds after last beat change.
- Export: PDF generation runs server-side (Puppeteer or `@react-pdf/renderer`) to avoid blocking the browser.

### Accessibility

- Document: `role="document"` with proper heading hierarchy (H1 = title, H2 = act, H3 = beat).
- Override badge: `aria-label="This section has been manually overridden"`.
- Edit button: `aria-label="Edit this treatment section"`.
- Revert button: `aria-label="Revert to auto-generated text"`.
- Table of contents: `role="navigation"` with `aria-label="Treatment table of contents"`.
- Standard document navigation: Tab moves between interactive elements. HeadingNav (H key in screen readers) navigates between sections.

---

## WebGL Fallback Strategy

### When to Switch

The standard rendering stack (React Flow for graphs, D3 for charts, Vis.js for timelines) handles most story worlds well. The WebGL fallback using `@cosmograph/cosmos` activates when node counts exceed thresholds:

| Visualization | Standard renderer limit | WebGL threshold |
|--------------|------------------------|-----------------|
| Character Relationship Map | < 500 nodes | >= 500 nodes |
| Causality Graph | < 1000 nodes | >= 1000 nodes |
| Mind Map | < 500 nodes | >= 500 nodes |
| Foreshadowing Web | < 300 nodes | >= 300 nodes |
| Faction Map | Never (typically < 50) | N/A |

### Detection Logic

```
src/lib/utils/renderer-selection.ts
```

```ts
function selectRenderer(nodeCount: number, vizType: string): 'standard' | 'webgl' {
  const thresholds: Record<string, number> = {
    'character-graph': 500,
    'causality-graph': 1000,
    'mind-map': 500,
    'foreshadowing-web': 300,
  };
  return nodeCount >= (thresholds[vizType] ?? Infinity) ? 'webgl' : 'standard';
}
```

### Cosmos Integration

When WebGL mode activates:

1. React Flow is unmounted. The `@cosmograph/cosmos` `<Graph>` component is mounted in the same container.
2. Node data is converted to Cosmos format: `{ id, x?, y?, color, size }[]`.
3. Edge data converted to: `{ source, target, color, width }[]`.
4. Custom nodes are replaced with circle primitives (Cosmos limitation). Node labels are drawn as WebGL text sprites (limited to name only, no detail content).
5. Interactions are simplified:
   - Click: select node, show detail panel.
   - Hover: highlight connected edges.
   - Drag: pan canvas (individual node drag not supported in Cosmos).
   - Zoom: mouse wheel.
6. Filter panel still works (re-renders Cosmos with filtered data set).

### User notification

When WebGL mode activates, a small info banner appears above the canvas: "This graph has {n} nodes. Rendering with GPU acceleration for performance. Some interactive features are simplified." Dismissable.

### Fallback for no WebGL

If the user's browser does not support WebGL (detected via `document.createElement('canvas').getContext('webgl')`), the system stays on the standard renderer but:
- Enables aggressive node pagination (show 200 at a time with "Load more").
- Simplifies edge rendering (no labels, no animations, straight lines only).
- Shows a warning: "Your browser does not support GPU-accelerated rendering. Large graphs may be slow."

---

## Animation and Transition Patterns

### General Principles

- Animations serve comprehension, not decoration. Every animation must help the user track state changes.
- Duration: 200ms for micro-interactions (hover, select), 300ms for layout changes (filter, expand/collapse), 500ms for major transitions (layout algorithm switch, new data load).
- Easing: `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for repositioning.
- Respect `prefers-reduced-motion`: when the OS or browser signals reduced motion preference, all animations are disabled (instant state changes, no transitions).

### Specific Patterns

| Pattern | Duration | Easing | Usage |
|---------|----------|--------|-------|
| Node appear | 200ms | ease-out | New nodes fade in from 0 opacity and scale from 0.8 to 1.0. |
| Node disappear | 150ms | ease-in | Filtered-out nodes fade to 0 and scale to 0.8. |
| Node reposition | 300ms | ease-in-out | When layout changes, nodes animate from old to new position. |
| Edge appear | 200ms | ease-out | Edges draw from source to target (SVG `stroke-dasharray` animation). |
| Edge disappear | 150ms | ease-in | Edges fade to 0 opacity. |
| Hover highlight | 100ms | ease-out | Opacity/color change on hover. |
| Selection ring | 150ms | ease-out | Selection indicator (ring/border) appears with slight scale bounce (1.0 -> 1.05 -> 1.0). |
| Panel slide-in | 300ms | ease-out | Right/left panels slide in from off-screen. |
| Panel slide-out | 200ms | ease-in | Panels slide out. |
| Filter result update | 300ms | staggered ease-out | Items that match new filter appear with a 20ms stagger delay between each. |
| Time slider update | 200ms | ease-in-out | Graph elements (nodes, edges) crossfade between time states. |
| Drag preview | 0ms (instant) | -- | Dragged element follows cursor without delay. |
| Drop settle | 200ms | ease-out | After drop, element settles into final position. |
| Toast notification | 300ms in, 200ms out | ease-out, ease-in | Toast slides down from top-right. |
| Skeleton shimmer | 1500ms loop | linear | Gradient sweep left-to-right across placeholder elements. |

### D3 Transition API

For D3-based visualizations (Arc Diagram, Pacing Heatmap, Emotional Arc), use D3's `.transition()` API:

```ts
selection
  .transition()
  .duration(300)
  .ease(d3.easeCubicInOut)
  .attr('opacity', 1)
  .attr('transform', `translate(${x}, ${y})`);
```

### React Flow Transitions

React Flow supports animated node positions via the `animated` edge prop and manual node position interpolation. For layout transitions, compute new positions and animate using `setNodes()` with intermediate frames via `requestAnimationFrame`.

---

## Responsive Behavior

### Breakpoints

| Name | Min width | Layout behavior |
|------|-----------|----------------|
| Desktop XL | 1440px | Full layout: sidebar + canvas + filter panel + detail panel. |
| Desktop | 1024px | Sidebar collapses to icons. Filter panel overlays instead of pushing. |
| Tablet | 768px | Sidebar hidden (hamburger menu). Visualizations go full-width. Filter panel as modal overlay. Detail panel as full-screen modal. |
| Mobile | < 768px | Visualization canvas fills screen. Toolbar collapses to overflow menu. Beat Sheet switches to vertical list view. Writing Surface goes full-screen with simplified toolbar. Graph visualizations show "Best viewed on a larger screen" recommendation with basic list fallback. |

### Visualization-Specific Responsive Rules

- **Dual Timeline**: at tablet breakpoint, stack the two timelines vertically (fabula above sjuzhet, with connecting lines going straight down). At mobile, show single timeline (sjuzhet only) with option to switch to fabula.
- **Character Relationship Map**: at mobile, show a list view with expandable relationship details instead of the graph canvas.
- **Beat Sheet / Scene Board**: at mobile, switch from horizontal kanban columns to a single vertical list (acts as collapsible sections).
- **Writing Surface**: at mobile, hide Story Sidebar entirely. Toolbar becomes a floating minimal bar. Focus mode is the default experience.
- **Treatment View**: fully responsive as a document layout. Margins reduce at smaller breakpoints.
- **Heatmap**: at mobile, rotate to vertical orientation (scenes as rows, metrics as columns) for thumb-scrolling.
- **All graph visualizations**: at mobile, add a "View on desktop for full interactivity" banner. Provide a simplified tabular data view as fallback.

### Touch Interactions

- Pinch-to-zoom on all zoomable canvases (graph, timeline, heatmap).
- Long press = right-click (context menu).
- Swipe on Beat Sheet cards for quick actions (swipe right = star rating, swipe left = delete with confirmation).
- Drag-and-drop works with touch (using `@dnd-kit`'s touch sensors).
- Tooltips replaced with tap-to-show popovers (no hover on touch).

---

*End of visualization specifications. This document should be updated as implementation progresses and design decisions are refined through user testing.*
