# StoryForge Frontend Architecture

This document defines the frontend architecture for StoryForge, covering technology choices, application structure, component design, state management, visualization strategy, real-time collaboration, performance, and testing.

---

## 1. Technology Stack Details

### Next.js 14+ App Router Architecture

StoryForge uses the Next.js App Router (introduced in Next.js 13, stable in 14+) as the foundation. The App Router provides:

- **React Server Components (RSC) by default** -- pages and layouts render on the server unless explicitly marked with `"use client"`. This reduces client-side JavaScript for data-heavy views like the worlds list, canon snapshots, and wiki pages.
- **Nested layouts** -- each route segment can define its own `layout.tsx` that persists across child navigations. The dashboard shell, world workspace sidebar, and visualization toolbars all use nested layouts so that chrome does not remount when switching between sub-views.
- **Route groups** -- parenthesized directories like `(auth)` and `(dashboard)` organize routes without affecting the URL path. Auth pages share a minimal layout; dashboard pages share the full app shell.
- **Streaming and Suspense** -- heavy data loads (entity lists, graph data, timeline events) use React Suspense boundaries with `loading.tsx` files so the shell renders immediately while data streams in.
- **Server Actions** -- mutations (create world, update beat, confirm entity) can use Server Actions to avoid writing standalone API routes for simple form submissions. Complex mutations (ingestion, AI analysis) still use dedicated API routes with the BullMQ job queue.

Directory conventions follow the App Router pattern:

```
src/app/
  layout.tsx          # Root layout: html, body, providers, fonts
  page.tsx            # Landing / marketing page (or redirect to /worlds)
  (auth)/
    layout.tsx        # Minimal centered layout, no sidebar
    login/page.tsx
    register/page.tsx
    forgot-password/page.tsx
  (dashboard)/
    layout.tsx        # Full app shell: sidebar, topbar, theme provider
    worlds/page.tsx
    world/[id]/
      layout.tsx      # World workspace: sub-nav tabs, world context provider
      write/page.tsx
      beats/page.tsx
      ...
  api/
    worlds/route.ts
    characters/route.ts
    ...
```

### TypeScript Strict Mode Configuration

The project uses TypeScript with `strict: true` in `tsconfig.json`. Key compiler options:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "allowJs": false,
    "noEmit": true,
    "incremental": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

Strict mode enforces `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, and `strictPropertyInitialization`. All shared types live in `src/types/` and are organized by domain:

```
src/types/
  world.ts            # StoryWorld, WorldSettings, CalendarSystem
  character.ts        # Character, NarrativeRole, VoiceProfile
  narrative.ts        # Event, Scene, Beat, Sequence, Act
  structure.ts        # StructureTemplate, StructureBeat, StructureMapping
  arc.ts              # Arc, ArcPhase, ValueChange
  relationship.ts     # Relationship (temporal, typed, weighted)
  analysis.ts         # NarrativeCode, PacingMetric, EmotionalState, CausalRelation
  timeline.ts         # FabulaTimeline, SjuzhetTimeline
  ingestion.ts        # SourceMaterial, IngestionJob, IngestionStatus
  collaboration.ts    # Presence, CursorPosition, ConflictResolution
  api.ts              # ApiResponse<T>, ApiError, PaginatedResponse<T>
```

### React 18+ Server Components vs Client Components Strategy

The boundary between server and client components follows a clear rule: **server by default, client only when the component needs browser APIs, event handlers, hooks with state, or third-party client libraries**.

| Component category | Server or Client | Rationale |
|---|---|---|
| Page shells (worlds list, wiki, canon) | Server | Data fetching, no interactivity beyond links |
| Layouts (dashboard shell, world workspace) | Server | Static chrome, delegates interactive parts to client children |
| Sidebar navigation | Client | Collapsible state, active route highlighting, keyboard shortcuts |
| Visualization components (D3, React Flow, Vis.js) | Client | All require DOM access and browser APIs |
| TipTap editor | Client | Contenteditable, cursor, selection, real-time collaboration |
| Beat sheet / kanban board | Client | Drag-and-drop, filter state, optimistic updates |
| Data tables and entity lists | Client | Sorting, filtering, virtual scrolling |
| Story Sidebar | Client | Form inputs (synopsis), collapsible sections, live stats |
| Modal dialogs and popovers | Client | Focus management, portal rendering |
| Forms (create world, edit character) | Client | Controlled inputs, validation, submission |
| Static content (about, docs, marketing) | Server | No interactivity |

The pattern for mixing server and client is composition via children:

```tsx
// src/app/(dashboard)/world/[id]/characters/page.tsx (Server Component)
import { getCharacters } from "@/lib/db/characters";
import { CharacterGraph } from "@/components/visualizations/CharacterGraph";

export default async function CharactersPage({
  params,
}: {
  params: { id: string };
}) {
  const characters = await getCharacters(params.id);
  const relationships = await getRelationships(params.id);

  // Server fetches data, client component handles visualization
  return (
    <CharacterGraph
      initialCharacters={characters}
      initialRelationships={relationships}
      worldId={params.id}
    />
  );
}
```

```tsx
// src/components/visualizations/CharacterGraph.tsx
"use client";

import { useCallback, useRef } from "react";
import { ReactFlow, type Node, type Edge } from "@xyflow/react";
// ... client-side visualization logic
```

### Tailwind CSS + shadcn/ui Component Library

**Tailwind CSS** provides the utility-first styling foundation. Configuration extends the default theme with StoryForge design tokens:

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic colors via CSS variables (set by shadcn/ui theme)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        // StoryForge-specific palette for visualization color coding
        arc: {
          character: "hsl(var(--arc-character))",
          plot: "hsl(var(--arc-plot))",
          theme: "hsl(var(--arc-theme))",
          relationship: "hsl(var(--arc-relationship))",
        },
        entity: {
          character: "hsl(var(--entity-character))",
          location: "hsl(var(--entity-location))",
          object: "hsl(var(--entity-object))",
          event: "hsl(var(--entity-event))",
          faction: "hsl(var(--entity-faction))",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
        screenplay: ["Courier Prime", "Courier New", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

**shadcn/ui** is not installed as a package dependency -- its components are copied into `src/components/ui/` and customized in place. This gives full control over styling and behavior. The base shell is forked from `next-shadcn-dashboard-starter`, providing:

- `Button`, `Input`, `Label`, `Textarea` -- form primitives
- `Dialog`, `AlertDialog`, `Sheet`, `Popover`, `DropdownMenu`, `ContextMenu` -- overlays
- `Tabs`, `Accordion`, `Collapsible` -- disclosure
- `Table`, `DataTable` -- tabular data
- `Card`, `Badge`, `Avatar`, `Separator` -- display
- `Command` (cmdk) -- command palette for quick navigation
- `Tooltip`, `Toast` (sonner) -- feedback
- `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Slider` -- controls
- `ScrollArea` -- custom scrollbar for panels
- `Skeleton` -- loading placeholders
- `Sidebar` -- collapsible app sidebar from dashboard starter
- `Breadcrumb` -- navigation breadcrumbs within world workspace

---

## 2. Application Shell and Layout

### Dashboard Layout Structure

The application shell is forked from `next-shadcn-dashboard-starter` and provides the persistent chrome for the entire dashboard experience. The layout hierarchy is:

```
RootLayout (src/app/layout.tsx)
  -- Fonts (Geist Sans + Geist Mono)
  -- ThemeProvider (next-themes)
  -- Toaster (sonner)
  -- QueryClientProvider (for client-side data fetching)
  |
  +-- AuthLayout (src/app/(auth)/layout.tsx)
  |     Minimal centered card layout, no sidebar, no topbar.
  |     Used for: login, register, forgot-password.
  |
  +-- DashboardLayout (src/app/(dashboard)/layout.tsx)
        Full app shell with:
        |
        +-- AppSidebar (collapsible, left side)
        |     - Logo + app name
        |     - Navigation links: Worlds, Settings, Help
        |     - User avatar + account menu (bottom)
        |     - Collapse toggle (hamburger or chevron)
        |
        +-- Main content area
              +-- TopBar
              |     - Breadcrumbs (dynamic per route)
              |     - Command palette trigger (Cmd+K)
              |     - Theme toggle (light/dark)
              |     - Notifications bell
              |     - User quick menu
              |
              +-- Page content (children)
```

### World Workspace Layout

When the user enters a specific world (`/world/[id]/`), the workspace layout adds a secondary navigation layer:

```
DashboardLayout
  +-- AppSidebar (global nav, collapses to icons)
  +-- WorldWorkspaceLayout (src/app/(dashboard)/world/[id]/layout.tsx)
        |
        +-- WorldContextProvider (Zustand hydration with world data)
        |
        +-- WorldSubNav (horizontal tab bar or secondary sidebar)
        |     Tabs organized by function:
        |     [Write] [Beats] [Treatment] [Timeline] [Characters] [Arcs]
        |     [Sources] [Wiki] [Factions] [Pacing] [Causality]
        |     [Foreshadowing] [Knowledge] [Mind Map]
        |     [What-If] [Canon] [Consistency] [Systems] [Settings]
        |
        |     Tab grouping (collapsible sections in secondary sidebar mode):
        |       Create:    Write, Beats, Treatment
        |       Visualize: Timeline, Characters, Arcs, Mind Map, Factions
        |       Analyze:   Pacing, Causality, Foreshadowing, Knowledge, Consistency
        |       Manage:    Sources, Wiki, What-If, Canon, Systems, Settings
        |
        +-- Page content (active sub-route)
```

The world workspace layout fetches the world's metadata (name, mode, synopsis status) server-side and passes it to a `WorldContextProvider` that hydrates a Zustand store on the client.

### Responsive Design Strategy

StoryForge targets desktop-first (1280px+) since the visualization-heavy workflow demands screen real estate. Responsive behavior:

| Breakpoint | Behavior |
|---|---|
| `>= 1536px` (2xl) | Full layout: expanded sidebar + expanded world sub-nav + full visualization |
| `>= 1280px` (xl) | Default layout: collapsible sidebar, horizontal tab sub-nav |
| `>= 1024px` (lg) | Sidebar collapses to icon-only by default, sub-nav stays horizontal |
| `>= 768px` (md) | Sidebar becomes sheet (slide-over), sub-nav moves to dropdown menu |
| `< 768px` (sm) | Limited support: read-only views work, editing and visualization discouraged with a banner suggesting desktop |

Visualization components use `ResizeObserver` (via a `useContainerSize` hook) to adapt their rendering to the available container dimensions rather than relying on media queries.

### Theme System

Light and dark mode are handled by `next-themes` with the `class` strategy (Tailwind's `darkMode: "class"`):

```tsx
// src/app/layout.tsx
import { ThemeProvider } from "next-themes";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

All colors use CSS variables defined in `globals.css` with separate `:root` (light) and `.dark` (dark) blocks. Visualization components also read these variables so that graph node colors, timeline lanes, and heatmaps adapt to the active theme.

---

## 3. Routing Architecture

### Complete Route Map

```
/                                          # Landing page (marketing or redirect)
/login                                     # (auth) Login
/register                                  # (auth) Registration
/forgot-password                           # (auth) Password recovery

/worlds                                    # (dashboard) World list + creation
/world/[id]/write                          # Writing surface (prose/screenplay)
/world/[id]/beats                          # Beat sheet / scene board
/world/[id]/treatment                      # Auto-generated treatment view
/world/[id]/timeline                       # Dual timeline (fabula + sjuzhet)
/world/[id]/characters                     # Character relationship map + profiles
/world/[id]/characters/[characterId]       # Individual character detail/interview
/world/[id]/arcs                           # Arc diagram with structure overlays
/world/[id]/mindmap                        # Mind map / world map
/world/[id]/sources                        # Source material manager
/world/[id]/sources/[sourceId]             # Individual source viewer with annotations
/world/[id]/whatif                         # What-if scenario explorer
/world/[id]/whatif/[branchId]              # Individual branch comparison
/world/[id]/canon                          # Canon management + versioning
/world/[id]/factions                       # Faction / power dynamics map
/world/[id]/pacing                         # Pacing & rhythm analysis
/world/[id]/causality                      # Causality chain viewer
/world/[id]/foreshadowing                  # Setup/payoff tracker
/world/[id]/knowledge                      # Audience knowledge tracker
/world/[id]/wiki                           # Auto-linking encyclopedia
/world/[id]/wiki/[entityType]/[entityId]   # Individual wiki article
/world/[id]/consistency                    # Contradiction checker dashboard
/world/[id]/systems                        # Magic/tech system designer
/world/[id]/settings                       # World settings & calendar config
```

### Route Groups and Layouts

```
src/app/
  layout.tsx                  # Root: fonts, ThemeProvider, Toaster, QueryClient
  page.tsx                    # Landing

  (auth)/
    layout.tsx                # Centered card, no app shell
    login/page.tsx
    register/page.tsx
    forgot-password/page.tsx

  (dashboard)/
    layout.tsx                # Full shell: AppSidebar + TopBar + main
    worlds/page.tsx           # Grid/list of story worlds

    world/[id]/
      layout.tsx              # WorldContextProvider + WorldSubNav + world chrome
      write/page.tsx
      beats/page.tsx
      treatment/page.tsx
      timeline/page.tsx
      characters/
        page.tsx              # Relationship map (default view)
        [characterId]/page.tsx  # Character detail / interview
      arcs/page.tsx
      mindmap/page.tsx
      sources/
        page.tsx              # Source list + upload
        [sourceId]/page.tsx   # Source viewer with annotations
      whatif/
        page.tsx              # Branch list + creation
        [branchId]/page.tsx   # Side-by-side comparison
      canon/page.tsx
      factions/page.tsx
      pacing/page.tsx
      causality/page.tsx
      foreshadowing/page.tsx
      knowledge/page.tsx
      wiki/
        page.tsx              # Encyclopedia index
        [entityType]/
          [entityId]/page.tsx # Individual article
      consistency/page.tsx
      systems/page.tsx
      settings/page.tsx
```

### Loading and Error Boundaries

Every route segment that performs data fetching should have corresponding `loading.tsx` and `error.tsx` files:

```
world/[id]/
  loading.tsx            # Skeleton for world workspace (sub-nav + placeholder)
  error.tsx              # World not found / access denied
  characters/
    loading.tsx          # Skeleton for graph (shimmer nodes + edges)
    error.tsx            # Character data fetch failure
  timeline/
    loading.tsx          # Skeleton for timeline lanes
    error.tsx
```

**loading.tsx** pattern -- uses shadcn/ui `Skeleton` components to match the actual layout shape:

```tsx
// src/app/(dashboard)/world/[id]/characters/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function CharactersLoading() {
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <Skeleton className="flex-1 rounded-lg" />
    </div>
  );
}
```

**error.tsx** pattern -- client component that receives the error and a reset function:

```tsx
// src/app/(dashboard)/world/[id]/characters/error.tsx
"use client";

import { Button } from "@/components/ui/button";

export default function CharactersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <h2 className="text-lg font-semibold">Failed to load characters</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

**not-found.tsx** is used at the `world/[id]` level to handle invalid world IDs, and at `characters/[characterId]` for invalid character IDs.

---

## 4. Component Architecture

### Component Hierarchy

```
RootLayout
  ThemeProvider
  QueryClientProvider
    AuthLayout | DashboardLayout
      DashboardLayout
        AppSidebar
          SidebarHeader (logo)
          SidebarNav (world links, global links)
          SidebarFooter (user menu)
        TopBar
          Breadcrumbs
          CommandPalette (Cmd+K)
          ThemeToggle
          NotificationBell
          UserMenu
        WorldWorkspaceLayout
          WorldContextProvider
          WorldSubNav
            SubNavItem (x20 sub-routes)
          [Page Content]
            -- WorldsPage: WorldCard grid
            -- WritePage: StorySidebar + TipTapEditor
            -- BeatsPage: BeatSheet (kanban) + MiniMap + FilterPanel
            -- TreatmentPage: TreatmentDocument + ExportToolbar
            -- TimelinePage: DualTimeline + TimelineControls
            -- CharactersPage: CharacterGraph + CharacterDetailPanel
            -- ArcsPage: ArcDiagram + StructureOverlaySelector
            -- MindMapPage: MindMap + ClusterControls
            -- SourcesPage: SourceList + SourceViewer
            -- FactionPage: FactionMap + TimeSlider
            -- PacingPage: PacingHeatmap + MetricSelector
            -- CausalityPage: CausalityGraph + FilterPanel
            -- ForeshadowingPage: ForeshadowingWeb + OrphanPanel
            -- KnowledgePage: AudienceKnowledge + TimelineScrubber
            -- WikiPage: WikiIndex + WikiArticle + AutoLinkHighlighter
            -- ConsistencyPage: ContradictionList + SeverityFilters
            -- SystemsPage: MagicSystemDesigner + RuleEditor
            -- SettingsPage: WorldSettings + CalendarConfig
```

### shadcn/ui Base Components Used

These are the components copied from shadcn/ui into `src/components/ui/`:

**Layout and Navigation:** Sidebar, Breadcrumb, Tabs, NavigationMenu, Separator, ScrollArea, Resizable (for split panes)

**Data Display:** Card, Badge, Avatar, Table, DataTable (with TanStack Table), Skeleton, HoverCard

**Forms and Inputs:** Button, Input, Label, Textarea, Select, Checkbox, RadioGroup, Switch, Slider, Form (react-hook-form integration), Calendar, DatePicker

**Feedback:** Toast (via sonner), Alert, AlertDialog, Progress

**Overlays:** Dialog, Sheet (slide-over panel), Popover, DropdownMenu, ContextMenu, Tooltip, Command (cmdk)

**Utilities:** Collapsible, Accordion, Toggle, ToggleGroup

### Custom Component Categories

#### Visualization Components (`src/components/visualizations/`)

Each visualization component is self-contained with its own data-fetching hooks, filter controls, and export capability. All are client components.

| Component | Library | Purpose |
|---|---|---|
| `DualTimeline.tsx` | Vis.js Timeline | Synchronized fabula/sjuzhet timelines with connecting lines |
| `CharacterGraph.tsx` | React Flow | Force-directed character relationship map with time slider |
| `ArcDiagram.tsx` | D3.js | Story arc curves with structure template overlay |
| `MindMap.tsx` | React Flow | Freeform spatial layout of story elements |
| `ImpactAnalysis.tsx` | React Flow | Dependency tree for revision cascade visualization |
| `PacingHeatmap.tsx` | D3.js | Color-coded density map of pacing metrics |
| `EmotionalArc.tsx` | D3.js | Per-character emotional trajectory line chart |
| `FactionMap.tsx` | React Flow | Hierarchical + network faction power graph |
| `BeatSheet.tsx` | Custom (dnd-kit) | Kanban board with beat cards, mini-map, filters |
| `ForeshadowingWeb.tsx` | React Flow | Directed graph linking setups to payoffs |
| `CausalityGraph.tsx` | React Flow | Directed acyclic graph of causal event chains |
| `AudienceKnowledge.tsx` | D3.js + Custom | Split-view knowledge state with timeline scrubber |

Shared sub-components used across visualizations:

```
src/components/visualizations/shared/
  TimeSlider.tsx          # Scrubber for animating state across narrative time
  FilterPanel.tsx         # Reusable filter sidebar (checkboxes, selects, search)
  ZoomControls.tsx        # Zoom in/out/fit buttons
  ExportButton.tsx        # Export current view as PNG/SVG
  VisualizationToolbar.tsx  # Combines zoom, export, fullscreen toggle
  LegendPanel.tsx         # Color/shape legend for current visualization
  NodeTooltip.tsx         # Hover tooltip for graph nodes
  ResizableContainer.tsx  # Wrapper with ResizeObserver for responsive viz
```

#### Editor Components (`src/components/editors/`)

Built on TipTap (which wraps ProseMirror). The editor supports two modes -- prose and screenplay -- sharing the same underlying document model but with different node types, formatting rules, and toolbar actions.

```
src/components/editors/
  WritingEditor.tsx           # Main editor wrapper (mode switching, toolbar, AI wand)
  prose/
    ProseEditor.tsx           # TipTap instance configured for prose
    ProseToolbar.tsx          # Bold, italic, headings, lists, etc.
    ChapterNode.tsx           # Custom TipTap node for chapter breaks
    SceneBreakNode.tsx        # Custom TipTap node for scene separators
    WordCountBar.tsx          # Progress bar toward word count target
  screenplay/
    ScreenplayEditor.tsx      # TipTap instance configured for screenplay formatting
    ScreenplayToolbar.tsx     # Element type selector (slugline, action, dialogue, etc.)
    SluglineNode.tsx          # Custom node: INT./EXT. LOCATION - TIME
    ActionNode.tsx            # Custom node: action/description lines
    DialogueNode.tsx          # Custom node: CHARACTER NAME + dialogue
    ParentheticalNode.tsx     # Custom node: (parenthetical)
    TransitionNode.tsx        # Custom node: CUT TO, FADE OUT, etc.
  shared/
    EntityHighlighter.tsx     # Mark extension highlighting recognized entities inline
    AiWandButton.tsx          # Floating wand button for AI generation assist
    AiSuggestionPanel.tsx     # Review panel for AI-generated suggestions
    FocusMode.tsx             # Distraction-free overlay (hides all chrome)
    CollaborationCursors.tsx  # Remote cursor/selection indicators (Yjs)
```

#### Story Sidebar Components (`src/components/story-sidebar/`)

The persistent left panel within the writing workspace:

```
src/components/story-sidebar/
  StorySidebar.tsx            # Container with collapsible sections
  SynopsisField.tsx           # Textarea for story synopsis (gates AI features)
  WorldSummary.tsx            # Quick stats: character count, scene count, word count
  CharacterQuickList.tsx      # Scrollable list of characters with avatars
  LocationQuickList.tsx       # Scrollable list of locations
  RecentActivity.tsx          # Last-edited beats/scenes/characters
  SidebarToggle.tsx           # Show/hide the sidebar
```

#### Treatment Components (`src/components/treatment/`)

```
src/components/treatment/
  TreatmentDocument.tsx       # Rendered treatment assembled from beat order
  TreatmentBlock.tsx          # Single beat rendered as treatment paragraph
  TreatmentOverride.tsx       # Inline editing for manual refinement
  ExportToolbar.tsx           # Export as PDF, DOCX, plain text
```

#### Ingestion Components (`src/components/ingestion/`)

```
src/components/ingestion/
  UploadDropzone.tsx          # Drag-and-drop file upload area
  IngestionProgress.tsx       # Job progress bar with stage indicators
  EntityReviewPanel.tsx       # Proposed entities for user confirmation/rejection
  SourcePreview.tsx           # Preview of parsed source with highlighted entities
  TranscriptViewer.tsx        # Time-coded transcript for audio/video sources
```

#### Wiki Components (`src/components/wiki/`)

```
src/components/wiki/
  WikiIndex.tsx               # Searchable, filterable encyclopedia index
  WikiArticle.tsx             # Individual entity article with auto-linked references
  AutoLinkHighlighter.tsx     # Text processor that detects and links entity mentions
  WikiSearch.tsx              # Full-text + semantic search input
  CrossReferenceList.tsx      # "Referenced by" and "References" lists
```

#### Layout Components (`src/components/layout/`)

```
src/components/layout/
  AppSidebar.tsx              # Global sidebar (forked from dashboard starter)
  TopBar.tsx                  # Top navigation bar
  WorldSubNav.tsx             # Secondary navigation for world workspace
  CommandPalette.tsx          # Cmd+K quick navigation (cmdk)
  Breadcrumbs.tsx             # Dynamic breadcrumb trail
  SplitPane.tsx               # Resizable two-panel layout (editor + sidebar, etc.)
```

### Component Naming and File Conventions

- **File names**: kebab-case (`character-graph.tsx`, `ai-wand-button.tsx`)
- **Component names**: PascalCase (`CharacterGraph`, `AiWandButton`)
- **Utility functions**: camelCase in kebab-case files (`use-container-size.ts` exports `useContainerSize`)
- **shadcn/ui components**: live in `src/components/ui/` with their original names (`button.tsx`, `dialog.tsx`)
- **Custom components**: organized by domain in subdirectories under `src/components/`

### Props Patterns and Composition

**Data-passing pattern**: Server components fetch data and pass it as props to client components. Client components own their interactivity state.

```tsx
// Server component fetches, client component renders
interface CharacterGraphProps {
  initialCharacters: Character[];
  initialRelationships: Relationship[];
  worldId: string;
}
```

**Compound component pattern**: Used for complex UI like the beat sheet where sub-components share context.

```tsx
<BeatSheet worldId={worldId}>
  <BeatSheet.Toolbar>
    <BeatSheet.FilterControls />
    <BeatSheet.ViewToggle />
  </BeatSheet.Toolbar>
  <BeatSheet.Board />
  <BeatSheet.MiniMap />
</BeatSheet>
```

**Render props / slot pattern**: Used when parent needs to control layout but child owns content.

```tsx
<VisualizationContainer
  toolbar={<VisualizationToolbar onExport={handleExport} />}
  legend={<LegendPanel items={legendItems} />}
>
  <CharacterGraph {...graphProps} />
</VisualizationContainer>
```

---

## 5. State Management

### Zustand Store Architecture

Zustand is chosen for its minimal API surface, good TypeScript support, and ability to handle complex nested state without boilerplate. Each domain gets its own store, created with `create` from zustand and enhanced with middleware as needed.

All stores live in `src/stores/`:

#### worldStore (`src/stores/world-store.ts`)

The central store for the active story world's data.

```ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { StoryWorld, Character, Location, Faction } from "@/types";

interface WorldState {
  // Data
  world: StoryWorld | null;
  characters: Character[];
  locations: Location[];
  factions: Faction[];
  isLoading: boolean;

  // Selection
  selectedEntityId: string | null;
  selectedEntityType: "character" | "location" | "faction" | "event" | null;

  // Actions
  setWorld: (world: StoryWorld) => void;
  setCharacters: (characters: Character[]) => void;
  selectEntity: (id: string, type: string) => void;
  clearSelection: () => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
}

export const useWorldStore = create<WorldState>()(
  devtools(
    (set) => ({
      world: null,
      characters: [],
      locations: [],
      factions: [],
      isLoading: true,
      selectedEntityId: null,
      selectedEntityType: null,

      setWorld: (world) => set({ world, isLoading: false }),
      setCharacters: (characters) => set({ characters }),
      selectEntity: (id, type) =>
        set({ selectedEntityId: id, selectedEntityType: type as WorldState["selectedEntityType"] }),
      clearSelection: () =>
        set({ selectedEntityId: null, selectedEntityType: null }),
      updateCharacter: (id, updates) =>
        set((state) => ({
          characters: state.characters.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
    }),
    { name: "world-store" }
  )
);
```

#### editorStore (`src/stores/editor-store.ts`)

Manages the writing surface state.

```ts
interface EditorState {
  // Mode
  mode: "prose" | "screenplay";
  setMode: (mode: "prose" | "screenplay") => void;

  // Focus
  isFocusMode: boolean;
  toggleFocusMode: () => void;

  // Targets
  wordCountTarget: number | null;
  currentWordCount: number;
  setWordCountTarget: (target: number | null) => void;
  setCurrentWordCount: (count: number) => void;

  // AI Wand
  isWandActive: boolean;
  wandSuggestion: string | null;
  setWandSuggestion: (suggestion: string | null) => void;
  acceptSuggestion: () => void;
  dismissSuggestion: () => void;

  // Active document
  activeDocumentId: string | null;
  setActiveDocument: (id: string) => void;
}
```

#### beatStore (`src/stores/beat-store.ts`)

Manages the beat sheet / scene board state.

```ts
interface BeatState {
  // Data
  beats: Beat[];
  columns: BeatColumn[]; // Kanban columns (acts, sequences, or custom)

  // Filters
  activeFilters: {
    starRating: number | null;
    tags: string[];
    characters: string[];
    structureBeat: string | null;
  };
  setFilter: (key: string, value: unknown) => void;
  resetFilters: () => void;

  // Drag state
  draggedBeatId: string | null;
  setDraggedBeat: (id: string | null) => void;

  // CRUD
  addBeat: (beat: Omit<Beat, "id">) => void;
  updateBeat: (id: string, updates: Partial<Beat>) => void;
  removeBeat: (id: string) => void;
  reorderBeats: (sourceIndex: number, destinationIndex: number, columnId: string) => void;
  moveBeatToColumn: (beatId: string, targetColumnId: string, index: number) => void;
}
```

#### timelineStore (`src/stores/timeline-store.ts`)

```ts
interface TimelineState {
  // View
  activeView: "sjuzhet" | "fabula" | "dual";
  zoomLevel: "series" | "season" | "episode" | "scene" | "beat";
  setActiveView: (view: "sjuzhet" | "fabula" | "dual") => void;
  setZoomLevel: (level: TimelineState["zoomLevel"]) => void;

  // Filters
  visibleLanes: string[]; // character IDs, arc IDs, or location IDs
  toggleLane: (laneId: string) => void;

  // Time range
  visibleRange: { start: Date; end: Date };
  setVisibleRange: (range: { start: Date; end: Date }) => void;

  // Selection
  selectedEventId: string | null;
  selectEvent: (id: string | null) => void;
}
```

#### visualizationStore (`src/stores/visualization-store.ts`)

Shared state for visualization components that need cross-view coordination.

```ts
interface VisualizationState {
  // Time slider (shared across character map, faction map, knowledge tracker)
  currentNarrativePosition: number; // 0-100 percentage through story
  setNarrativePosition: (position: number) => void;

  // Selected nodes (for cross-view highlighting)
  highlightedEntityIds: Set<string>;
  addHighlight: (id: string) => void;
  removeHighlight: (id: string) => void;
  clearHighlights: () => void;

  // Active structure template
  activeStructureTemplate: string | null; // template ID
  setActiveStructureTemplate: (id: string | null) => void;
}
```

#### collaborationStore (`src/stores/collaboration-store.ts`)

```ts
interface CollaborationState {
  // Connection
  isConnected: boolean;
  setConnected: (connected: boolean) => void;

  // Presence
  activeUsers: CollaboratorPresence[];
  setActiveUsers: (users: CollaboratorPresence[]) => void;

  // Cursors
  remoteCursors: Map<string, CursorPosition>;
  updateRemoteCursor: (userId: string, position: CursorPosition) => void;
  removeRemoteCursor: (userId: string) => void;
}
```

#### uiStore (`src/stores/ui-store.ts`)

```ts
interface UiState {
  // Sidebar
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Story Sidebar (within writing view)
  isStorySidebarOpen: boolean;
  toggleStorySidebar: () => void;

  // Modal stack
  modals: ModalEntry[];
  openModal: (modal: ModalEntry) => void;
  closeModal: () => void;
  closeAllModals: () => void;

  // Command palette
  isCommandPaletteOpen: boolean;
  toggleCommandPalette: () => void;
}
```

### Server State vs Client State Separation

The application separates **server state** (data from the database) from **client state** (UI state, selections, filters):

- **Server state** is fetched by React Server Components and passed as props, or fetched client-side via React Query / SWR for cases requiring real-time updates or mutations.
- **Client state** lives in Zustand stores and is never persisted to the server unless explicitly triggered by a user action (save, create, update).

Pattern for client-side data fetching with mutations:

```tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

function useUpdateBeat() {
  const queryClient = useQueryClient();
  const updateBeatInStore = useBeatStore((s) => s.updateBeat);

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Beat> }) => {
      const res = await fetch(`/api/beats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update beat");
      return res.json();
    },
    // Optimistic update
    onMutate: async ({ id, updates }) => {
      updateBeatInStore(id, updates);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["beats"] });
    },
  });
}
```

### Data Fetching Strategy

| Scenario | Method |
|---|---|
| Initial page load (list of worlds, character data for graph) | React Server Component with `async` function calling Prisma directly |
| Sub-resource loaded after interaction (character detail on node click) | Client-side fetch via React Query `useQuery` |
| Mutations (create beat, update character, reorder beats) | React Query `useMutation` with optimistic updates to Zustand store |
| Real-time updates (collaboration cursors, entity changes by other users) | WebSocket via Socket.io, updating Zustand store on message |
| Search (full-text, semantic) | Client-side fetch via React Query with debounced input |

### Optimistic Updates Pattern

For operations where latency matters (beat reordering, entity quick-edits):

1. Immediately update the Zustand store with the expected result.
2. Fire the mutation to the server.
3. On success, optionally refresh from server to ensure consistency.
4. On error, roll back the Zustand store to previous state and show a toast.

```ts
// Inside a mutation's onMutate:
onMutate: async (variables) => {
  // Snapshot previous state for rollback
  const previousBeats = useBeatStore.getState().beats;

  // Optimistically update
  useBeatStore.getState().reorderBeats(variables.from, variables.to, variables.columnId);

  return { previousBeats };
},
onError: (_err, _variables, context) => {
  // Rollback
  if (context?.previousBeats) {
    useBeatStore.setState({ beats: context.previousBeats });
  }
  toast.error("Failed to reorder beats");
},
```

---

## 6. Visualization Architecture

### D3.js Integration Pattern

D3 is used for visualizations that require custom SVG rendering: arc diagrams, pacing heatmaps, emotional arc charts, and parts of the audience knowledge map. D3 does not manage React's virtual DOM -- it operates on a real DOM ref.

The integration pattern uses `useRef` + `useEffect` with cleanup:

```tsx
"use client";

import { useRef, useEffect } from "react";
import * as d3 from "d3";
import { useContainerSize } from "@/hooks/use-container-size";

interface ArcDiagramProps {
  arcs: ArcData[];
  structureBeats: StructureBeatData[];
  activeTemplateId: string | null;
}

export function ArcDiagram({ arcs, structureBeats, activeTemplateId }: ArcDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { width, height } = useContainerSize(containerRef);

  useEffect(() => {
    if (!svgRef.current || width === 0 || height === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X scale: narrative position (0-100%)
    const xScale = d3.scaleLinear().domain([0, 100]).range([0, innerWidth]);

    // Y scale: arc intensity
    const yScale = d3.scaleLinear().domain([0, 10]).range([innerHeight, 0]);

    // Draw arc curves
    const lineGenerator = d3.line<ArcPoint>()
      .x((d) => xScale(d.position))
      .y((d) => yScale(d.intensity))
      .curve(d3.curveCatmullRom.alpha(0.5));

    arcs.forEach((arc) => {
      g.append("path")
        .datum(arc.points)
        .attr("d", lineGenerator)
        .attr("fill", "none")
        .attr("stroke", arc.color)
        .attr("stroke-width", 2);
    });

    // Draw structure beat markers if template is active
    if (activeTemplateId) {
      const relevantBeats = structureBeats.filter(
        (b) => b.templateId === activeTemplateId
      );
      g.selectAll(".beat-marker")
        .data(relevantBeats)
        .enter()
        .append("line")
        .attr("class", "beat-marker")
        .attr("x1", (d) => xScale(d.expectedPosition))
        .attr("x2", (d) => xScale(d.expectedPosition))
        .attr("y1", 0)
        .attr("y2", innerHeight)
        .attr("stroke", "hsl(var(--muted-foreground))")
        .attr("stroke-dasharray", "4,4")
        .attr("stroke-width", 1);
    }

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat((d) => `${d}%`));

    g.append("g").call(d3.axisLeft(yScale));
  }, [arcs, structureBeats, activeTemplateId, width, height]);

  return (
    <div ref={containerRef} className="h-full w-full">
      <svg ref={svgRef} />
    </div>
  );
}
```

Key rules for D3 in React:
- Never let D3 manage component lifecycle -- React owns mounting/unmounting.
- Always clear previous render (`svg.selectAll("*").remove()`) in the effect.
- Use `useContainerSize` hook (wrapping `ResizeObserver`) for responsive sizing instead of hardcoded dimensions.
- Read theme CSS variables for colors so visualizations adapt to light/dark mode.
- Return a cleanup function from `useEffect` if attaching event listeners.

### React Flow Setup for Node-Based Graphs

React Flow (from xyflow) is used for all interactive node-based visualizations: character relationship map, causality graph, foreshadowing web, faction map, mind map, and impact analysis.

```tsx
"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { CharacterNode } from "./nodes/CharacterNode";
import { RelationshipEdge } from "./edges/RelationshipEdge";

// Custom node types registered once
const nodeTypes: NodeTypes = {
  character: CharacterNode,
};

const edgeTypes = {
  relationship: RelationshipEdge,
};

interface CharacterGraphProps {
  initialCharacters: Character[];
  initialRelationships: Relationship[];
  worldId: string;
}

export function CharacterGraph({
  initialCharacters,
  initialRelationships,
  worldId,
}: CharacterGraphProps) {
  const initialNodes: Node[] = useMemo(
    () =>
      initialCharacters.map((char) => ({
        id: char.id,
        type: "character",
        position: char.graphPosition ?? { x: Math.random() * 800, y: Math.random() * 600 },
        data: { character: char },
      })),
    [initialCharacters]
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      initialRelationships.map((rel) => ({
        id: rel.id,
        type: "relationship",
        source: rel.sourceCharacterId,
        target: rel.targetCharacterId,
        data: { relationship: rel },
      })),
    [initialRelationships]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

Custom nodes are React components that receive `data` as a prop:

```tsx
// src/components/visualizations/nodes/CharacterNode.tsx
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function CharacterNode({ data }: NodeProps) {
  const { character } = data;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{character.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{character.name}</span>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
```

### Vis.js Timeline Integration

Vis.js Timeline is used specifically for the dual timeline (fabula/sjuzhet) view. Since Vis.js manipulates the DOM directly, it is wrapped similarly to D3:

```tsx
"use client";

import { useRef, useEffect } from "react";
import { Timeline, DataSet } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";

interface DualTimelineProps {
  fabulaEvents: TimelineEvent[];
  sjuzhetEvents: TimelineEvent[];
  onEventSelect: (eventId: string) => void;
}

export function DualTimeline({ fabulaEvents, sjuzhetEvents, onEventSelect }: DualTimelineProps) {
  const fabulaRef = useRef<HTMLDivElement>(null);
  const sjuzhetRef = useRef<HTMLDivElement>(null);
  const fabulaTimeline = useRef<Timeline | null>(null);
  const sjuzhetTimeline = useRef<Timeline | null>(null);

  useEffect(() => {
    if (!fabulaRef.current || !sjuzhetRef.current) return;

    const fabulaItems = new DataSet(
      fabulaEvents.map((e) => ({
        id: e.id,
        content: e.title,
        start: e.fabulaStart,
        end: e.fabulaEnd,
        group: e.laneId,
        className: `event-${e.type}`,
      }))
    );

    const sjuzhetItems = new DataSet(
      sjuzhetEvents.map((e) => ({
        id: e.id,
        content: e.title,
        start: e.sjuzhetPosition,
        end: e.sjuzhetEnd,
        group: e.laneId,
        className: `event-${e.type}`,
      }))
    );

    const options = {
      stack: true,
      showCurrentTime: false,
      zoomMin: 1000 * 60 * 60, // 1 hour minimum zoom
      editable: { updateTime: false, updateGroup: false },
    };

    fabulaTimeline.current = new Timeline(fabulaRef.current, fabulaItems, options);
    sjuzhetTimeline.current = new Timeline(sjuzhetRef.current, sjuzhetItems, options);

    // Synchronize range changes between timelines
    fabulaTimeline.current.on("rangechanged", (props) => {
      sjuzhetTimeline.current?.setWindow(props.start, props.end, { animation: false });
    });

    sjuzhetTimeline.current.on("rangechanged", (props) => {
      fabulaTimeline.current?.setWindow(props.start, props.end, { animation: false });
    });

    // Selection handler
    const handleSelect = (properties: { items: string[] }) => {
      if (properties.items.length > 0) {
        onEventSelect(properties.items[0]);
      }
    };
    fabulaTimeline.current.on("select", handleSelect);
    sjuzhetTimeline.current.on("select", handleSelect);

    return () => {
      fabulaTimeline.current?.destroy();
      sjuzhetTimeline.current?.destroy();
    };
  }, [fabulaEvents, sjuzhetEvents, onEventSelect]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h3 className="mb-1 text-sm font-medium text-muted-foreground">
          Fabula (Chronological Truth)
        </h3>
        <div ref={fabulaRef} className="h-[45%] border rounded-lg" />
      </div>
      <div>
        <h3 className="mb-1 text-sm font-medium text-muted-foreground">
          Sjuzhet (Narrative Order)
        </h3>
        <div ref={sjuzhetRef} className="h-[45%] border rounded-lg" />
      </div>
    </div>
  );
}
```

### Cosmos (WebGL) for Large Graph Fallback

When a story world exceeds a configurable threshold (default: 500+ nodes), the character relationship map and other node graphs switch from React Flow to `@cosmograph/cosmos` for GPU-accelerated WebGL rendering:

```tsx
"use client";

import { useRef, useEffect } from "react";
import { Graph } from "@cosmograph/cosmos";

interface LargeGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function LargeGraph({ nodes, edges }: LargeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef<Graph | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    graphRef.current = new Graph(canvasRef.current, {
      nodeSize: (node) => node.importance * 4 + 2,
      nodeColor: (node) => node.color,
      linkColor: (link) => link.color,
      linkWidth: (link) => link.weight,
      simulation: {
        repulsion: 0.5,
        gravity: 0.1,
        linkDistance: 100,
      },
    });

    graphRef.current.setData(nodes, edges);

    return () => {
      graphRef.current?.destroy();
    };
  }, [nodes, edges]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
```

The threshold-based switching logic:

```tsx
function GraphView({ characters, relationships, worldId }: GraphViewProps) {
  const LARGE_GRAPH_THRESHOLD = 500;
  const nodeCount = characters.length;

  if (nodeCount > LARGE_GRAPH_THRESHOLD) {
    return (
      <LargeGraph
        nodes={mapToGraphNodes(characters)}
        edges={mapToGraphEdges(relationships)}
      />
    );
  }

  return (
    <CharacterGraph
      initialCharacters={characters}
      initialRelationships={relationships}
      worldId={worldId}
    />
  );
}
```

### Shared Visualization Patterns

**Time slider component** -- reused by character relationship map, faction map, and audience knowledge tracker:

```tsx
"use client";

import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { useVisualizationStore } from "@/stores/visualization-store";

export function TimeSlider() {
  const position = useVisualizationStore((s) => s.currentNarrativePosition);
  const setPosition = useVisualizationStore((s) => s.setNarrativePosition);
  // Play/pause animation state is local
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPosition(Math.min(position + 0.5, 100));
      if (position >= 100) setIsPlaying(false);
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, position, setPosition]);

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <Button variant="ghost" size="icon" onClick={() => setPosition(0)}>
        <SkipBack className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <Slider
        value={[position]}
        onValueChange={([val]) => setPosition(val)}
        min={0}
        max={100}
        step={0.1}
        className="flex-1"
      />
      <span className="text-sm text-muted-foreground w-12 text-right">
        {position.toFixed(0)}%
      </span>
    </div>
  );
}
```

**Filter panel component** -- reusable across all visualization views:

```tsx
interface FilterPanelProps {
  filters: FilterDefinition[];
  activeFilters: Record<string, unknown>;
  onFilterChange: (key: string, value: unknown) => void;
  onReset: () => void;
}

export function FilterPanel({ filters, activeFilters, onFilterChange, onReset }: FilterPanelProps) {
  // Renders checkboxes, selects, sliders based on FilterDefinition type
  // Each visualization defines its own filter definitions
}
```

**Export to image** -- all visualizations support PNG/SVG export:

```tsx
function useExportVisualization(containerRef: RefObject<HTMLElement>) {
  const exportAsPng = useCallback(async () => {
    if (!containerRef.current) return;
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(containerRef.current);
    const link = document.createElement("a");
    link.download = "storyforge-export.png";
    link.href = dataUrl;
    link.click();
  }, [containerRef]);

  const exportAsSvg = useCallback(async () => {
    if (!containerRef.current) return;
    const { toSvg } = await import("html-to-image");
    const dataUrl = await toSvg(containerRef.current);
    const link = document.createElement("a");
    link.download = "storyforge-export.svg";
    link.href = dataUrl;
    link.click();
  }, [containerRef]);

  return { exportAsPng, exportAsSvg };
}
```

---

## 7. Real-Time Collaboration

### Yjs CRDT Integration with TipTap

TipTap has first-class support for Yjs via the `@tiptap/extension-collaboration` and `@tiptap/extension-collaboration-cursor` extensions. Each document (scene, chapter, or wiki article) gets its own Yjs document.

```tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { useEffect, useMemo } from "react";

interface CollaborativeEditorProps {
  documentId: string;
  userName: string;
  userColor: string;
}

export function CollaborativeEditor({
  documentId,
  userName,
  userColor,
}: CollaborativeEditorProps) {
  const ydoc = useMemo(() => new Y.Doc(), []);

  const provider = useMemo(
    () =>
      new WebsocketProvider(
        process.env.NEXT_PUBLIC_WS_URL!,
        `document-${documentId}`,
        ydoc
      ),
    [documentId, ydoc]
  );

  useEffect(() => {
    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [provider, ydoc]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }), // Yjs handles undo/redo
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({
        provider,
        user: { name: userName, color: userColor },
      }),
    ],
  });

  return <EditorContent editor={editor} className="prose dark:prose-invert max-w-none" />;
}
```

### WebSocket Connection Management

A single WebSocket connection (Socket.io) is established per world workspace session. It multiplexes multiple concerns:

```
src/lib/collaboration/
  socket-client.ts        # Singleton Socket.io client with auto-reconnect
  presence-manager.ts     # Tracks who is online and in which view
  entity-sync.ts          # Broadcasts entity CRUD events to other clients
```

```ts
// src/lib/collaboration/socket-client.ts
import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(worldId: string): Socket {
  if (socket?.connected) return socket;

  socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
    query: { worldId },
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
```

### Presence Indicators

Each user's active view and cursor position are broadcast via the WebSocket. The UI shows:

- **Avatar stack** in the top bar showing who is in the current world.
- **Colored dot** on the sub-nav tab showing which view each collaborator is in.
- **Cursor indicators** in the TipTap editor (via Yjs collaboration cursor extension).
- **Selection highlights** on beat cards and graph nodes currently selected by another user.

### Conflict Resolution Strategy

| Conflict type | Resolution |
|---|---|
| Text editing (same document) | CRDT (Yjs) -- automatically merged, no conflicts |
| Entity field edits (same field, different users) | Last-write-wins with notification: "Alex updated this character's age to 35" |
| Structural changes (beat reordering) | Optimistic locking: server rejects if version mismatch, client re-fetches and re-applies |
| Semantic conflicts (kill vs. save character) | Surfaced as "story conflicts" in a dedicated resolution panel for human decision |

### Offline Support Approach

Yjs documents persist to IndexedDB via `y-indexeddb`, allowing offline editing of text documents. When the connection is restored, Yjs syncs automatically via its CRDT merge. Non-text mutations (entity CRUD, beat reorder) are queued in a local mutation queue and replayed on reconnect:

```ts
// src/lib/collaboration/offline-queue.ts
interface QueuedMutation {
  id: string;
  type: "create" | "update" | "delete";
  entity: string;
  payload: unknown;
  timestamp: number;
}

// Stored in IndexedDB, replayed in order on reconnect
```

---

## 8. Performance Strategy

### Code Splitting per Route

Next.js App Router automatically code-splits at the route segment level. Each page loads only the JavaScript needed for that view. Visualization libraries (D3, React Flow, Vis.js) are only included in the bundles for pages that use them.

### Lazy Loading for Heavy Visualization Components

Visualization components are dynamically imported with `next/dynamic` to avoid loading them until the user navigates to the relevant view:

```tsx
import dynamic from "next/dynamic";

const CharacterGraph = dynamic(
  () => import("@/components/visualizations/CharacterGraph").then((m) => m.CharacterGraph),
  {
    loading: () => <Skeleton className="h-full w-full" />,
    ssr: false, // Visualization requires browser APIs
  }
);
```

The `ssr: false` flag is critical for all visualization components since D3, React Flow, Vis.js, and Cosmos all require `window`, `document`, and `canvas`.

### Virtual Scrolling for Large Lists

Beat boards, entity lists, wiki indexes, and other potentially large collections use virtual scrolling via `@tanstack/react-virtual`:

```tsx
"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

function EntityList({ entities }: { entities: Entity[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: entities.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Estimated row height in px
    overscan: 10,
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <EntityRow entity={entities[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Image Optimization

All images (character portraits, concept art, storyboard frames) use `next/image` for automatic:
- Format conversion (WebP/AVIF)
- Responsive sizing
- Lazy loading
- Blur placeholder (for uploaded images, generated during ingestion)

### Bundle Size Management

- **Tree shaking**: Import specific D3 modules (`d3-scale`, `d3-shape`, `d3-axis`) instead of the full `d3` bundle.
- **Dynamic imports**: Visualization libraries and heavy components loaded only when needed.
- **Analyze**: `@next/bundle-analyzer` configured in `next.config.ts` to track bundle size regressions.
- **Font optimization**: `next/font` for Geist Sans and Geist Mono to avoid layout shift and reduce external requests.
- **Icon imports**: Import individual icons from `lucide-react` rather than the full set.

```ts
// Good: tree-shakeable
import { scaleLinear } from "d3-scale";
import { line, curveCatmullRom } from "d3-shape";

// Avoid: imports everything
import * as d3 from "d3";
```

### Memoization Patterns for Expensive Graph Computations

Graph layout computations, filter operations, and entity resolution are memoized:

```tsx
// useMemo for derived data
const filteredEdges = useMemo(
  () =>
    edges.filter((edge) => {
      if (filterType && edge.data.type !== filterType) return false;
      if (filterTimePeriod) {
        const inRange =
          edge.data.validFrom <= filterTimePeriod.end &&
          (edge.data.validTo === null || edge.data.validTo >= filterTimePeriod.start);
        if (!inRange) return false;
      }
      return true;
    }),
  [edges, filterType, filterTimePeriod]
);

// useCallback for stable references passed to visualization libraries
const handleNodeClick = useCallback(
  (nodeId: string) => {
    selectEntity(nodeId, "character");
  },
  [selectEntity]
);
```

For heavy computations (force-directed layout, impact analysis traversal), offload to a Web Worker:

```ts
// src/lib/graph/layout-worker.ts
// Runs in a Web Worker to avoid blocking the main thread
self.onmessage = (event) => {
  const { nodes, edges, algorithm } = event.data;
  const result = computeLayout(nodes, edges, algorithm);
  self.postMessage(result);
};
```

---

## 9. Testing Strategy

### Vitest for Unit Tests

Unit tests cover stores, utility functions, and custom hooks. Located in `tests/unit/`:

```
tests/unit/
  stores/
    world-store.test.ts
    beat-store.test.ts
    editor-store.test.ts
    timeline-store.test.ts
  lib/
    structures/
      template-matcher.test.ts
      save-the-cat.test.ts
    graph/
      impact-analysis.test.ts
      causality-traversal.test.ts
    pacing/
      metrics-calculator.test.ts
    calendar/
      custom-calendar.test.ts
  hooks/
    use-container-size.test.ts
    use-debounce.test.ts
```

Example Zustand store test:

```ts
// tests/unit/stores/beat-store.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useBeatStore } from "@/stores/beat-store";

describe("beatStore", () => {
  beforeEach(() => {
    useBeatStore.setState({
      beats: [],
      activeFilters: { starRating: null, tags: [], characters: [], structureBeat: null },
    });
  });

  it("adds a beat", () => {
    useBeatStore.getState().addBeat({
      title: "Inciting Incident",
      description: "Hero receives the call",
      starRating: 4,
      tags: ["act-1"],
      characters: ["hero-id"],
      color: "#3B82F6",
    });

    expect(useBeatStore.getState().beats).toHaveLength(1);
    expect(useBeatStore.getState().beats[0].title).toBe("Inciting Incident");
  });

  it("filters beats by star rating", () => {
    const store = useBeatStore.getState();
    store.addBeat({ title: "Beat A", starRating: 3 } as any);
    store.addBeat({ title: "Beat B", starRating: 5 } as any);

    store.setFilter("starRating", 5);
    const { beats, activeFilters } = useBeatStore.getState();
    const filtered = beats.filter((b) =>
      activeFilters.starRating ? b.starRating >= activeFilters.starRating : true
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe("Beat B");
  });

  it("reorders beats within a column", () => {
    const store = useBeatStore.getState();
    store.addBeat({ title: "First", order: 0 } as any);
    store.addBeat({ title: "Second", order: 1 } as any);
    store.addBeat({ title: "Third", order: 2 } as any);

    store.reorderBeats(2, 0, "default-column");
    const titles = useBeatStore.getState().beats.map((b) => b.title);
    expect(titles).toEqual(["Third", "First", "Second"]);
  });
});
```

### React Testing Library for Component Tests

Component tests verify rendering, user interactions, and accessibility. Located alongside unit tests or in a `tests/components/` directory:

```ts
// tests/components/beat-card.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BeatCard } from "@/components/visualizations/BeatCard";

describe("BeatCard", () => {
  const mockBeat = {
    id: "beat-1",
    title: "Opening Image",
    description: "Establish the world before the journey",
    starRating: 4,
    tags: ["act-1", "setup"],
    characters: [],
    color: "#3B82F6",
  };

  it("renders beat title and description", () => {
    render(<BeatCard beat={mockBeat} onEdit={vi.fn()} />);
    expect(screen.getByText("Opening Image")).toBeInTheDocument();
    expect(screen.getByText("Establish the world before the journey")).toBeInTheDocument();
  });

  it("displays correct star rating", () => {
    render(<BeatCard beat={mockBeat} onEdit={vi.fn()} />);
    const stars = screen.getAllByTestId("star-filled");
    expect(stars).toHaveLength(4);
  });

  it("calls onEdit when edit button is clicked", () => {
    const onEdit = vi.fn();
    render(<BeatCard beat={mockBeat} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith("beat-1");
  });
});
```

### Playwright for E2E Tests

End-to-end tests cover critical user journeys. Located in `tests/e2e/`:

```
tests/e2e/
  auth.spec.ts              # Login, register, logout flows
  world-creation.spec.ts    # Create a new story world
  beat-board.spec.ts        # Add beats, reorder, filter, navigate to script
  writing-surface.spec.ts   # Type in prose/screenplay mode, entity highlighting
  character-map.spec.ts     # View graph, click node, open detail
  timeline.spec.ts          # Navigate dual timeline, select events
  ingestion.spec.ts         # Upload file, review entities, confirm
  treatment.spec.ts         # Verify treatment updates when beats change
```

Example:

```ts
// tests/e2e/beat-board.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Beat Board", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/world/test-world-id/beats");
  });

  test("creates a new beat card", async ({ page }) => {
    await page.click('[data-testid="add-beat-button"]');
    await page.fill('[data-testid="beat-title-input"]', "Catalyst");
    await page.fill('[data-testid="beat-description-input"]', "Something happens that changes everything");
    await page.click('[data-testid="save-beat-button"]');

    await expect(page.locator('[data-testid="beat-card"]')).toContainText("Catalyst");
  });

  test("drags beat to reorder", async ({ page }) => {
    const firstBeat = page.locator('[data-testid="beat-card"]').first();
    const secondBeat = page.locator('[data-testid="beat-card"]').nth(1);

    await firstBeat.dragTo(secondBeat);
    // Verify new order
  });

  test("filters by star rating", async ({ page }) => {
    await page.click('[data-testid="filter-star-5"]');
    const beatCards = page.locator('[data-testid="beat-card"]');
    // All visible cards should have 5 stars
    for (const card of await beatCards.all()) {
      await expect(card.locator('[data-testid="star-filled"]')).toHaveCount(5);
    }
  });
});
```

### Visual Regression Testing for Visualizations

Playwright's screenshot comparison is used for visualization components to catch unintended visual changes:

```ts
test("character graph renders correctly", async ({ page }) => {
  await page.goto("/world/test-world-id/characters");
  await page.waitForSelector('[data-testid="character-graph"]');
  // Wait for graph layout to stabilize
  await page.waitForTimeout(2000);
  await expect(page.locator('[data-testid="character-graph"]')).toHaveScreenshot(
    "character-graph.png",
    { maxDiffPixelRatio: 0.01 }
  );
});
```

---

## 10. Key Technical Decisions

### Why TipTap over ProseMirror / Slate / Draft.js

| Factor | TipTap | ProseMirror | Slate | Draft.js |
|---|---|---|---|---|
| React integration | First-class hooks API | Low-level, no React bindings | React-native but unstable API churn | React but Facebook-abandoned |
| Yjs collaboration | Official extension (`@tiptap/extension-collaboration`) | Manual integration via `y-prosemirror` | Community plugin, less tested | No official support |
| Custom node types | Simple `Node.create()` API | Powerful but verbose schema definition | Complex nested value model | Entity system is rigid |
| Screenplay formatting | Custom nodes per element type (slugline, dialogue, etc.) map naturally | Same capability but more boilerplate | Possible but more effort | Poor fit for structured documents |
| Extension ecosystem | 50+ official extensions, active community | Core extensions only, DIY for most features | Smaller ecosystem | Stagnant |
| AI wand integration | Mark/decoration system for inline suggestions | Same underlying system (TipTap wraps ProseMirror) | Different decoration model | No clean pattern |
| Learning curve | Moderate -- abstracts ProseMirror complexity | Steep -- must understand ProseMirror's model deeply | Moderate but frequent breaking changes | Low but limited |
| Open-source foundation | `Novel` editor (16K stars) provides TipTap + AI assist patterns we can fork | No comparable starter | No comparable starter | No comparable starter |

**Decision**: TipTap provides the best balance of developer ergonomics, collaboration support, and extensibility. Since it wraps ProseMirror, we retain access to ProseMirror's power when needed. The `Novel` editor gives us a production-quality starting point with AI assist patterns already implemented.

### Why Zustand over Redux / Jotai / Recoil

| Factor | Zustand | Redux Toolkit | Jotai | Recoil |
|---|---|---|---|---|
| Boilerplate | Minimal -- single `create()` call per store | Reduced from classic Redux but still slices + reducers + selectors | Minimal -- atom-based | Moderate -- atoms + selectors + effects |
| TypeScript | Excellent inference | Good but more verbose | Excellent | Good |
| Bundle size | ~1KB | ~10KB (with toolkit) | ~3KB | ~14KB |
| Devtools | Redux DevTools via middleware | Native | Redux DevTools adapter | RecoilRoot devtools |
| Server components | Works -- stores created outside React tree | Works but heavier | Atoms need Provider | Requires RecoilRoot Provider |
| Complex nested state | Immer middleware optional, direct mutation in set() | Immer built in | Derived atoms for nested reads | Selectors for derived state |
| Multiple stores | Natural -- one store per domain | Single store with slices | Natural -- one atom per value | Natural but coupled to RecoilRoot |
| React 18+ compatibility | Full | Full | Full | Partial (maintenance mode) |

**Decision**: Zustand's minimal API is ideal for StoryForge's multiple domain stores (world, editor, beats, timeline, visualization, collaboration, UI). Each store is independent, easy to test in isolation, and adds negligible bundle weight. The lack of Provider wrapping simplifies server component composition.

### Why React Flow over Cytoscape / vis-network

| Factor | React Flow | Cytoscape.js | vis-network |
|---|---|---|---|
| React integration | Native React components -- nodes ARE React components | Wrapper only -- render to canvas, no React nodes | Wrapper only -- render to canvas |
| Custom node rendering | Full React component per node (avatars, badges, tooltips, etc.) | Limited to CSS classes on canvas-rendered elements | Limited to HTML labels |
| Interactivity | React event system (onClick, onDrag, etc.) | Custom event system | Custom event system |
| shadcn/ui integration | Nodes can use any shadcn component directly | Cannot embed React components | Cannot embed React components |
| Mini-map | Built-in `<MiniMap />` component | Plugin required | Not available |
| Performance (< 500 nodes) | Excellent -- DOM-based with efficient updates | Good -- canvas-based | Good -- canvas-based |
| Performance (500+ nodes) | Degrades -- switch to Cosmos for WebGL | Better for large graphs | Better for large graphs |
| Community and maintenance | 35.9K GitHub stars, actively maintained by xyflow team | 10K stars, mature but slower development | Part of vis.js, less active |
| TypeScript | Full TypeScript rewrite (v12+) | DefinitelyTyped definitions | DefinitelyTyped definitions |
| Edge customization | Custom React components for edges | Style properties only | Style properties only |

**Decision**: React Flow is the clear winner for StoryForge because our graph nodes are rich, interactive UI elements (character cards with avatars, beat cards with star ratings, faction nodes with power indicators). Having full React component rendering in each node means we can reuse our shadcn/ui components directly. For the rare case of very large worlds (500+ nodes), we fall back to `@cosmograph/cosmos` for WebGL rendering where visual richness is traded for performance.

### Why shadcn/ui over Radix / Chakra / MUI

| Factor | shadcn/ui | Radix Primitives | Chakra UI | Material UI (MUI) |
|---|---|---|---|---|
| Ownership model | Components copied into your codebase -- you own them | Library dependency | Library dependency | Library dependency |
| Customization | Full control -- edit the files directly | Headless -- full control but you build everything | Theme tokens, less flexibility for one-off changes | Theme system, overrides can be verbose |
| Styling approach | Tailwind CSS utilities | Unstyled -- bring your own | Emotion/styled-system | Emotion/styled-components |
| Bundle size | Zero runtime -- just your code | Small (each primitive is standalone) | 30KB+ gzipped | 80KB+ gzipped |
| Design consistency | Consistent out of the box (default theme) | You define all visual design | Opinionated (Chakra look) | Strongly opinionated (Material Design) |
| Dark mode | Tailwind `dark:` + CSS variables | You implement | Built-in toggle | Built-in toggle |
| Accessibility | Built on Radix Primitives (best-in-class a11y) | Best-in-class a11y | Good | Good |
| Dashboard starter | `next-shadcn-dashboard-starter` provides full app shell | No equivalent | No equivalent | MUI templates exist but are Material-styled |

**Decision**: shadcn/ui gives us the accessibility quality of Radix Primitives (shadcn/ui is built on Radix under the hood) with the DX of copy-paste ownership. Since we fork the `next-shadcn-dashboard-starter` for our app shell, using shadcn/ui for all base components means visual consistency with zero additional dependencies. The Tailwind-native approach aligns with our styling strategy, and full ownership means we can customize any component for StoryForge-specific needs (e.g., the beat card, the screenplay toolbar) without fighting a library's abstraction.
