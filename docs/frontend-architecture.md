# StoryForge Frontend Architecture

> Next.js 14+ App Router | TypeScript | shadcn/ui | Tailwind CSS | Zustand | TanStack Query | TipTap | React Flow

---

## 1. Component Tree

```
RootLayout (Server)
├── AuthProvider (Client) ─── session, tokens, guards
├── ThemeProvider (Client) ─── dark/light/system via next-themes
├── QueryProvider (Client) ─── TanStack Query client
├── WorldProvider (Client) ─── active world context
├── ToastProvider (Client) ─── sonner notifications
│
├── (auth) ─── group: unauthenticated routes
│   ├── LoginPage (Server)
│   │   └── LoginForm (Client)
│   ├── RegisterPage (Server)
│   │   └── RegisterForm (Client)
│   └── ForgotPasswordPage (Server)
│       └── ForgotPasswordForm (Client)
│
├── (app) ─── group: authenticated routes
│   ├── AppLayout (Server)
│   │   ├── Sidebar (Client)
│   │   │   ├── WorldSwitcher (Client) ─── dropdown, search, create
│   │   │   ├── ViewNav (Client) ─── beat sheet, writing, visualizations, etc.
│   │   │   ├── EntityQuickSearch (Client) ─── cmd+k style entity search
│   │   │   └── UserMenu (Client) ─── avatar, settings, logout
│   │   │
│   │   ├── StorySidebar (Client) ─── right sidebar, collapsible, layout-level
│   │   │   ├── SynopsisPanel (Client) ─── editable synopsis
│   │   │   ├── StoryStatsPanel (Client) ─── word count, beat progress, char count
│   │   │   ├── RecentActivityFeed (Client) ─── changes, AI actions
│   │   │   └── StorySidebarToggle (Client) ─── collapse/expand button
│   │   │
│   │   └── MainContent (Server) ─── renders active route via children
│   │
│   ├── /worlds
│   │   ├── WorldListPage (Server) ─── all worlds dashboard
│   │   │   ├── WorldGrid (Client) ─── grid of world cards
│   │   │   │   └── WorldCard (Client) ─── thumbnail, title, stats
│   │   │   └── CreateWorldDialog (Client)
│   │   │
│   │   └── /worlds/[worldId]
│   │       ├── WorldLayout (Server) ─── loads world data, sets context
│   │       │
│   │       ├── /beat-sheet ─── Beat Sheet View
│   │       │   ├── BeatSheetPage (Server) ─── initial beat data fetch
│   │       │   └── BeatSheetView (Client)
│   │       │       ├── BeatToolbar (Client)
│   │       │       │   ├── BeatFilters (Client) ─── by act, character, tag, status
│   │       │       │   ├── BeatSortControls (Client) ─── order, grouping
│   │       │       │   ├── BeatViewToggle (Client) ─── kanban / list / timeline
│   │       │       │   └── AddBeatButton (Client)
│   │       │       ├── BeatBoard (Client) ─── kanban columns (act-based)
│   │       │       │   ├── BeatColumn (Client) ─── droppable column per act/section
│   │       │       │   │   └── BeatCard (Client) ─── draggable card
│   │       │       │   │       ├── BeatCardHeader ─── title, color dot, star toggle
│   │       │       │   │       ├── BeatCardBody ─── truncated description
│   │       │       │   │       ├── BeatCardCharacters ─── avatar stack
│   │       │       │   │       ├── BeatCardTags ─── tag pills
│   │       │       │   │       ├── BeatCardNotes ─── note indicator icon
│   │       │       │   │       └── BeatCardWand ─── AI action trigger
│   │       │       │   └── AddBeatInline (Client) ─── quick-add within column
│   │       │       ├── BeatCardDetail (Client) ─── expanded side panel / sheet
│   │       │       │   ├── BeatDetailHeader (Client) ─── title edit, status, star
│   │       │       │   ├── BeatDetailDescription (Client) ─── rich text description
│   │       │       │   ├── BeatDetailCharacters (Client) ─── character picker
│   │       │       │   ├── BeatDetailTags (Client) ─── tag editor
│   │       │       │   ├── BeatDetailNotes (Client) ─── notes list with editor
│   │       │       │   ├── BeatDetailLinkedScenes (Client) ─── links to writing surface
│   │       │       │   └── BeatDetailAIPanel (Client) ─── AI suggestions, expand, etc.
│   │       │       ├── MiniMap (Client) ─── overview navigator for large beat sheets
│   │       │       └── BeatListView (Client) ─── alternate table/list layout
│   │       │
│   │       ├── /writing ─── Writing Surface View
│   │       │   ├── WritingPage (Server) ─── initial document fetch
│   │       │   └── WritingSurfaceView (Client)
│   │       │       ├── WritingToolbar (Client)
│   │       │       │   ├── FormatControls (Client) ─── bold, italic, etc.
│   │       │       │   ├── ModeToggle (Client) ─── prose / screenplay switch
│   │       │       │   ├── SectionNav (Client) ─── jump between sections/beats
│   │       │       │   └── WritingStats (Client) ─── word count, session count
│   │       │       ├── TipTapEditor (Client) ─── core editor wrapper
│   │       │       │   ├── ProseMode (Client) ─── novel/prose node views
│   │       │       │   │   ├── ChapterNode (Client)
│   │       │       │   │   ├── SceneBreakNode (Client)
│   │       │       │   │   └── ParagraphNode (Client)
│   │       │       │   ├── ScreenplayMode (Client) ─── screenplay format nodes
│   │       │       │   │   ├── SluglineNode (Client)
│   │       │       │   │   ├── ActionNode (Client)
│   │       │       │   │   ├── DialogueNode (Client)
│   │       │       │   │   ├── ParentheticalNode (Client)
│   │       │       │   │   └── TransitionNode (Client)
│   │       │       │   ├── EntityHighlighter (Client) ─── inline entity marks
│   │       │       │   │   └── EntityTooltip (Client) ─── hover card with entity info
│   │       │       │   ├── BeatMarker (Client) ─── inline beat boundaries
│   │       │       │   └── CommentThread (Client) ─── inline comments
│   │       │       ├── AIWandPanel (Client) ─── slide-over panel
│   │       │       │   ├── AIWandInput (Client) ─── prompt input
│   │       │       │   ├── AISuggestionList (Client) ─── generated suggestions
│   │       │       │   ├── AIDiffView (Client) ─── before/after comparison
│   │       │       │   └── AIApplyControls (Client) ─── accept, reject, modify
│   │       │       └── SectionOutline (Client) ─── left gutter section tree
│   │       │
│   │       ├── /entities ─── Entity Management
│   │       │   ├── EntitiesPage (Server)
│   │       │   └── EntitiesView (Client)
│   │       │       ├── EntityTabs (Client) ─── characters, locations, items, factions
│   │       │       ├── EntityList (Client)
│   │       │       │   └── EntityListItem (Client) ─── name, type, avatar, linked beats
│   │       │       ├── EntityDetail (Client) ─── side panel or page
│   │       │       │   ├── EntityHeader (Client) ─── name, avatar, type badge
│   │       │       │   ├── EntityAttributes (Client) ─── key-value attribute editor
│   │       │       │   ├── EntityRelationships (Client) ─── linked entities graph
│   │       │       │   ├── EntityTimeline (Client) ─── entity appearances over beats
│   │       │       │   ├── EntityNotes (Client)
│   │       │       │   └── EntityAIPanel (Client) ─── AI-generated bios, consistency checks
│   │       │       └── CreateEntityDialog (Client)
│   │       │
│   │       ├── /visualizations ─── Story Visualization Views
│   │       │   ├── VisualizationsPage (Server)
│   │       │   └── VisualizationsView (Client)
│   │       │       ├── VisualizationToolbar (Client)
│   │       │       │   ├── ViewSelector (Client) ─── timeline, graph, map, arc tracker
│   │       │       │   ├── TimeSlider (Client) ─── scrub through story time
│   │       │       │   └── VisualizationFilters (Client) ─── entity, arc, tag filters
│   │       │       ├── TimelineView (Client)
│   │       │       │   ├── TimelineLane (Client) ─── per-character or per-arc lane
│   │       │       │   ├── TimelineEvent (Client) ─── event node on lane
│   │       │       │   └── TimelineTooltip (Client) ─── hover detail
│   │       │       ├── RelationshipGraphView (Client) ─── React Flow canvas
│   │       │       │   ├── EntityNode (Client) ─── custom React Flow node
│   │       │       │   ├── RelationshipEdge (Client) ─── custom React Flow edge
│   │       │       │   └── GraphControls (Client) ─── zoom, layout, export
│   │       │       ├── StoryMapView (Client) ─── spatial/geographic layout
│   │       │       │   ├── LocationPin (Client)
│   │       │       │   └── PathTrace (Client) ─── character movement paths
│   │       │       └── ArcTrackerView (Client) ─── story arc progress
│   │       │           ├── ArcCard (Client) ─── arc definition with beats
│   │       │           └── ArcProgressBar (Client) ─── visual progress
│   │       │
│   │       ├── /ingestion ─── Content Ingestion
│   │       │   ├── IngestionPage (Server)
│   │       │   └── IngestionView (Client)
│   │       │       ├── IngestionDropzone (Client) ─── file upload area
│   │       │       ├── IngestionSourceList (Client) ─── pasted text, URLs, files
│   │       │       ├── IngestionProgress (Client) ─── real-time progress via WebSocket
│   │       │       │   ├── IngestionStepIndicator (Client) ─── parse → extract → link
│   │       │       │   └── IngestionLog (Client) ─── streaming log output
│   │       │       └── IngestionReview (Client) ─── review extracted entities/beats
│   │       │           ├── IngestionEntityReview (Client) ─── confirm/edit entities
│   │       │           └── IngestionBeatReview (Client) ─── confirm/edit beats
│   │       │
│   │       ├── /settings ─── World Settings
│   │       │   ├── WorldSettingsPage (Server)
│   │       │   └── WorldSettingsView (Client)
│   │       │       ├── WorldGeneralSettings (Client) ─── name, description, genre
│   │       │       ├── WorldCollaborators (Client) ─── invite, role management
│   │       │       ├── WorldExport (Client) ─── export formats
│   │       │       └── WorldDangerZone (Client) ─── archive, delete
│   │       │
│   │       └── /collaboration ─── Real-time Collaboration
│   │           └── CollaborationOverlay (Client) ─── rendered at layout level
│   │               ├── CursorPresence (Client) ─── other users' cursors
│   │               ├── SelectionHighlight (Client) ─── other users' selections
│   │               └── UserPresenceBar (Client) ─── who's online
│   │
│   └── /account ─── User Account
│       ├── AccountPage (Server)
│       └── AccountSettingsView (Client)
│           ├── ProfileSettings (Client)
│           ├── NotificationSettings (Client)
│           └── BillingSettings (Client)
│
└── SharedComponents ─── reusable across all views
    ├── CommandPalette (Client) ─── cmd+k global search/actions
    ├── AIWandButton (Client) ─── reusable AI trigger button
    ├── EntityMention (Client) ─── inline entity reference chip
    ├── ConfirmDialog (Client) ─── destructive action confirmation
    ├── EmptyState (Server) ─── placeholder for empty lists
    ├── LoadingSkeleton (Server) ─── loading placeholders
    ├── ErrorBoundaryFallback (Client) ─── error UI
    └── InfiniteScrollContainer (Client) ─── virtualized list wrapper
```

---

## 2. Server vs. Client Component Decisions

### Server Components (default — no directive needed)

| Component | Rationale |
|---|---|
| `RootLayout` | Static shell, renders providers as children |
| `AppLayout` | Layout wrapper, no interactivity |
| `MainContent` | Passes `children` through |
| `WorldLayout` | Fetches world data server-side, passes to context |
| `BeatSheetPage` | Fetches initial beat data via RSC async/await |
| `WritingPage` | Fetches initial document data via RSC async/await |
| `EntitiesPage` | Fetches initial entity list via RSC async/await |
| `VisualizationsPage` | Fetches initial visualization data via RSC async/await |
| `IngestionPage` | Fetches ingestion history via RSC async/await |
| `WorldSettingsPage` | Fetches world config via RSC async/await |
| `WorldListPage` | Fetches all user worlds via RSC async/await |
| `AccountPage` | Fetches user profile via RSC async/await |
| `LoginPage`, `RegisterPage`, `ForgotPasswordPage` | Static form shells |
| `EmptyState` | Pure presentational, no JS needed |
| `LoadingSkeleton` | Pure presentational, no JS needed |

### Client Components ('use client') — Reasons

| Component | Why Client |
|---|---|
| **Providers** (`AuthProvider`, `ThemeProvider`, `QueryProvider`, `WorldProvider`, `ToastProvider`) | React context requires client-side rendering |
| **Sidebar**, `WorldSwitcher`, `ViewNav`, `UserMenu` | Interactive navigation, dropdowns, hover states, active route tracking |
| **StorySidebar** and children | Collapsible panel, live stats updates, editable fields |
| **BeatSheetView** and all children | Drag-and-drop (dnd-kit), kanban state, filtering, card interactions |
| **BeatCardDetail** | Sheet/panel open/close, inline editing, form state |
| **WritingSurfaceView** and all children | TipTap editor requires DOM access, keyboard events, selection state |
| **EntityHighlighter** | Decorates editor DOM with entity marks, uses TipTap plugin API |
| **AIWandPanel** and children | Streaming AI responses, form input, diff display |
| **EntitiesView** and children | List filtering, tab switching, inline editing |
| **VisualizationsView** and all children | React Flow canvas, D3/canvas rendering, time slider, zoom/pan |
| **RelationshipGraphView** | React Flow manages its own viewport, node positions, edge routing |
| **TimelineView** | Canvas/SVG rendering, zoom/scroll, hover interactions |
| **IngestionView** and children | File upload (browser File API), WebSocket progress, drag-and-drop |
| **CollaborationOverlay** | WebSocket connection, real-time cursor tracking |
| **CommandPalette** | Keyboard shortcut listener, focus management, search state |
| **Forms** (`LoginForm`, `RegisterForm`, etc.) | Form state, validation, submission |
| **ErrorBoundaryFallback** | React error boundary requires `componentDidCatch` (client) |
| **InfiniteScrollContainer** | IntersectionObserver API, scroll position tracking |

---

## 3. State Management (Zustand)

### 3.1 `useWorldStore`

```typescript
interface WorldEntity {
  id: string;
  name: string;
  type: 'character' | 'location' | 'item' | 'faction' | 'event' | 'concept';
  attributes: Record<string, unknown>;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface World {
  id: string;
  name: string;
  description: string;
  genre: string;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface WorldState {
  // State
  activeWorld: World | null;
  entities: WorldEntity[];
  entityMap: Map<string, WorldEntity>;   // fast lookup by ID
  isDirty: boolean;
  isLoading: boolean;

  // Actions
  setActiveWorld: (world: World) => void;
  clearActiveWorld: () => void;
  setEntities: (entities: WorldEntity[]) => void;
  addEntity: (entity: WorldEntity) => void;
  updateEntity: (id: string, patch: Partial<WorldEntity>) => void;
  removeEntity: (id: string) => void;
  markDirty: () => void;
  markClean: () => void;
}

// Selectors
const selectEntitiesByType = (type: WorldEntity['type']) =>
  (state: WorldState) => state.entities.filter(e => e.type === type);

const selectEntityById = (id: string) =>
  (state: WorldState) => state.entityMap.get(id);
```

### 3.2 `useBeatStore`

```typescript
interface Beat {
  id: string;
  title: string;
  description: string;
  act: number;                          // 1, 2, 3 — drives kanban column
  order: number;                        // position within act
  status: 'draft' | 'outlined' | 'written' | 'revised' | 'final';
  color: string;                        // hex color for card dot
  starred: boolean;
  characterIds: string[];
  tags: string[];
  notes: BeatNote[];
  linkedSceneIds: string[];             // links to writing surface sections
  createdAt: string;
  updatedAt: string;
}

interface BeatNote {
  id: string;
  content: string;
  createdAt: string;
}

interface BeatFilters {
  acts: number[];
  characterIds: string[];
  tags: string[];
  statuses: Beat['status'][];
  search: string;
  starred: boolean | null;
}

interface BeatState {
  // State
  beats: Beat[];
  beatMap: Map<string, Beat>;
  activeBeatId: string | null;
  filters: BeatFilters;
  viewMode: 'kanban' | 'list' | 'timeline';
  dragState: { beatId: string; fromAct: number } | null;

  // Actions
  setBeats: (beats: Beat[]) => void;
  addBeat: (beat: Beat) => void;
  updateBeat: (id: string, patch: Partial<Beat>) => void;
  removeBeat: (id: string) => void;
  reorderBeat: (beatId: string, targetAct: number, targetOrder: number) => void;
  setActiveBeat: (id: string | null) => void;
  setFilters: (filters: Partial<BeatFilters>) => void;
  resetFilters: () => void;
  setViewMode: (mode: BeatState['viewMode']) => void;
  setDragState: (state: BeatState['dragState']) => void;
  toggleStar: (id: string) => void;

  // Selectors (as getters on the store)
  filteredBeats: () => Beat[];
  beatsByAct: () => Record<number, Beat[]>;
}

// External selectors
const selectBeatsByAct = (act: number) =>
  (state: BeatState) => state.beats
    .filter(b => b.act === act)
    .sort((a, b) => a.order - b.order);

const selectActiveBeat = (state: BeatState) =>
  state.activeBeatId ? state.beatMap.get(state.activeBeatId) : null;
```

### 3.3 `useEditorStore`

```typescript
interface EditorSection {
  id: string;
  type: 'chapter' | 'scene' | 'beat-boundary';
  title: string;
  beatId?: string;                      // linked beat
  startPos: number;                     // TipTap document position
  endPos: number;
  wordCount: number;
}

interface EditorState {
  // State
  mode: 'prose' | 'screenplay';
  documentId: string | null;
  sections: EditorSection[];
  activeSectionId: string | null;
  cursorPosition: number;
  selectionRange: { from: number; to: number } | null;
  wordCount: number;
  sessionWordCount: number;             // words written this session
  isAIWandOpen: boolean;
  aiWandSelection: { from: number; to: number; text: string } | null;
  isDirty: boolean;
  lastSavedAt: string | null;

  // Actions
  setMode: (mode: EditorState['mode']) => void;
  setDocumentId: (id: string | null) => void;
  setSections: (sections: EditorSection[]) => void;
  setActiveSectionId: (id: string | null) => void;
  setCursorPosition: (pos: number) => void;
  setSelectionRange: (range: EditorState['selectionRange']) => void;
  updateWordCount: (count: number) => void;
  incrementSessionWordCount: (delta: number) => void;
  openAIWand: (selection?: EditorState['aiWandSelection']) => void;
  closeAIWand: () => void;
  markDirty: () => void;
  markSaved: () => void;
  navigateToSection: (sectionId: string) => void;
  navigateToBeat: (beatId: string) => void;   // finds section linked to beat
}

// Selectors
const selectActiveSection = (state: EditorState) =>
  state.sections.find(s => s.id === state.activeSectionId);

const selectSectionByBeatId = (beatId: string) =>
  (state: EditorState) => state.sections.find(s => s.beatId === beatId);
```

### 3.4 `useVisualizationStore`

```typescript
type VisualizationType = 'timeline' | 'relationship-graph' | 'story-map' | 'arc-tracker';

interface VisualizationFilters {
  entityIds: string[];
  entityTypes: WorldEntity['type'][];
  arcIds: string[];
  tags: string[];
  timeRange: { start: number; end: number } | null;   // beat order range
}

interface VisualizationState {
  // State
  activeView: VisualizationType;
  filters: VisualizationFilters;
  timeSliderPosition: number;            // 0–100 normalized
  timeSliderPlaying: boolean;
  playbackSpeed: number;                 // beats per second
  graphViewport: { x: number; y: number; zoom: number };
  selectedNodeId: string | null;
  isFullscreen: boolean;

  // Actions
  setActiveView: (view: VisualizationType) => void;
  setFilters: (filters: Partial<VisualizationFilters>) => void;
  resetFilters: () => void;
  setTimeSliderPosition: (pos: number) => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setGraphViewport: (viewport: VisualizationState['graphViewport']) => void;
  setSelectedNode: (id: string | null) => void;
  toggleFullscreen: () => void;
}
```

### 3.5 `useCollaborationStore`

```typescript
interface CollaboratorPresence {
  userId: string;
  displayName: string;
  avatarUrl: string;
  color: string;                         // assigned cursor color
  cursorPosition?: number;               // TipTap doc position
  activeView: string;                    // which route they're on
  activeBeatId?: string;
  lastSeen: string;
}

interface EntityLock {
  entityId: string;
  entityType: 'beat' | 'entity' | 'document-section';
  lockedBy: string;                      // userId
  lockedAt: string;
  expiresAt: string;
}

interface CollaborationState {
  // State
  isConnected: boolean;
  collaborators: CollaboratorPresence[];
  locks: EntityLock[];
  pendingOperations: number;             // unacknowledged ops count

  // Actions
  setConnected: (connected: boolean) => void;
  setCollaborators: (collaborators: CollaboratorPresence[]) => void;
  updateCollaborator: (userId: string, patch: Partial<CollaboratorPresence>) => void;
  removeCollaborator: (userId: string) => void;
  setLocks: (locks: EntityLock[]) => void;
  acquireLock: (entityId: string, entityType: EntityLock['entityType']) => Promise<boolean>;
  releaseLock: (entityId: string) => void;
  incrementPending: () => void;
  decrementPending: () => void;
}

// Selectors
const selectCollaboratorsInView = (view: string) =>
  (state: CollaborationState) =>
    state.collaborators.filter(c => c.activeView === view);

const selectLockHolder = (entityId: string) =>
  (state: CollaborationState) =>
    state.locks.find(l => l.entityId === entityId);

const selectIsLockedByOther = (entityId: string, currentUserId: string) =>
  (state: CollaborationState) => {
    const lock = state.locks.find(l => l.entityId === entityId);
    return lock ? lock.lockedBy !== currentUserId : false;
  };
```

### 3.6 `useUIStore` (global UI state)

```typescript
interface UIState {
  // State
  sidebarCollapsed: boolean;
  storySidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  activeModal: string | null;
  activeSheet: string | null;

  // Actions
  toggleSidebar: () => void;
  toggleStorySidebar: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setActiveModal: (modal: string | null) => void;
  setActiveSheet: (sheet: string | null) => void;
}
```

---

## 4. Data Fetching Strategy

### 4.1 Server Component Fetches (RSC async/await)

Data fetched at the page/layout level before hydration, passed as props to client trees.

| Route | Fetch | Data |
|---|---|---|
| `WorldLayout` | `getWorld(worldId)` | World metadata, collaborators |
| `BeatSheetPage` | `getBeats(worldId)` | All beats for the world |
| `WritingPage` | `getDocument(worldId, docId?)` | Document content, sections |
| `EntitiesPage` | `getEntities(worldId)` | All entities (paginated if >500) |
| `VisualizationsPage` | `getVisualizationData(worldId)` | Pre-computed graph/timeline data |
| `IngestionPage` | `getIngestionHistory(worldId)` | Past ingestion jobs |
| `WorldListPage` | `getUserWorlds()` | All worlds for current user |
| `AccountPage` | `getUserProfile()` | User profile, preferences |

All server-fetched data is passed as `initialData` to TanStack Query's `HydrationBoundary` so the client cache is pre-populated.

```typescript
// Example: BeatSheetPage (Server Component)
export default async function BeatSheetPage({ params }: { params: { worldId: string } }) {
  const beats = await getBeats(params.worldId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BeatSheetView initialBeats={beats} worldId={params.worldId} />
    </HydrationBoundary>
  );
}
```

### 4.2 Client Component Fetches (TanStack Query)

Client components use TanStack Query for all data operations after initial load.

#### Query Keys

```typescript
export const queryKeys = {
  worlds: {
    all:    ['worlds'] as const,
    detail: (id: string) => ['worlds', id] as const,
  },
  beats: {
    all:    (worldId: string) => ['worlds', worldId, 'beats'] as const,
    detail: (worldId: string, beatId: string) => ['worlds', worldId, 'beats', beatId] as const,
  },
  entities: {
    all:    (worldId: string) => ['worlds', worldId, 'entities'] as const,
    byType: (worldId: string, type: string) => ['worlds', worldId, 'entities', { type }] as const,
    detail: (worldId: string, entityId: string) => ['worlds', worldId, 'entities', entityId] as const,
  },
  documents: {
    detail: (worldId: string, docId: string) => ['worlds', worldId, 'documents', docId] as const,
  },
  visualizations: {
    graph:    (worldId: string) => ['worlds', worldId, 'viz', 'graph'] as const,
    timeline: (worldId: string) => ['worlds', worldId, 'viz', 'timeline'] as const,
    map:      (worldId: string) => ['worlds', worldId, 'viz', 'map'] as const,
  },
  ingestion: {
    jobs: (worldId: string) => ['worlds', worldId, 'ingestion'] as const,
    job:  (worldId: string, jobId: string) => ['worlds', worldId, 'ingestion', jobId] as const,
  },
  ai: {
    suggestions: (worldId: string, context: string) => ['worlds', worldId, 'ai', context] as const,
  },
} as const;
```

#### Mutations with Optimistic Updates

```typescript
// Example: Beat reorder mutation
const useReorderBeat = (worldId: string) => {
  const queryClient = useQueryClient();
  const beatStore = useBeatStore();

  return useMutation({
    mutationFn: (params: { beatId: string; targetAct: number; targetOrder: number }) =>
      api.beats.reorder(worldId, params),

    onMutate: async (params) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.beats.all(worldId) });

      // Snapshot previous value
      const previous = queryClient.getQueryData(queryKeys.beats.all(worldId));

      // Optimistically update Zustand store (drives UI immediately)
      beatStore.reorderBeat(params.beatId, params.targetAct, params.targetOrder);

      return { previous };
    },

    onError: (_err, _params, context) => {
      // Roll back on error
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.beats.all(worldId), context.previous);
        beatStore.setBeats(context.previous as Beat[]);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.beats.all(worldId) });
    },
  });
};
```

#### Stale Times & Refetch Policies

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,              // 30s — data considered fresh
      gcTime: 5 * 60_000,             // 5m — garbage collection
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
});

// Override per-query where needed:
// Beats: staleTime 10s (frequently edited by collaborators)
// Entities: staleTime 60s (less volatile)
// Visualizations: staleTime 120s (computed, expensive to recalculate)
// AI suggestions: gcTime 0 (never cache, always fresh)
```

### 4.3 Real-Time: WebSocket Subscriptions

```typescript
// lib/ws.ts — singleton WebSocket manager
class WSManager {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  connect(worldId: string, token: string): void;
  disconnect(): void;
  subscribe(channel: string, handler: (data: unknown) => void): () => void;
  send(event: string, payload: unknown): void;
}

// Channels:
// world:{worldId}:beats        — beat CRUD events from other users
// world:{worldId}:entities     — entity changes
// world:{worldId}:presence     — user cursor/view updates
// world:{worldId}:document     — collaborative editing ops (Yjs or custom CRDT)
// world:{worldId}:ingestion    — ingestion job progress updates
// world:{worldId}:ai           — AI generation streaming events
```

#### Integration with Zustand and TanStack Query

```typescript
// hooks/useWorldSync.ts — mounted once in WorldLayout
function useWorldSync(worldId: string) {
  const queryClient = useQueryClient();
  const collaborationStore = useCollaborationStore();

  useEffect(() => {
    const unsubs = [
      wsManager.subscribe(`world:${worldId}:beats`, (data) => {
        // Invalidate TanStack Query cache → triggers refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.beats.all(worldId) });
      }),

      wsManager.subscribe(`world:${worldId}:presence`, (data) => {
        // Update Zustand directly — no server round-trip needed
        collaborationStore.updateCollaborator(data.userId, data);
      }),

      wsManager.subscribe(`world:${worldId}:ingestion`, (data) => {
        // Update specific ingestion job query
        queryClient.setQueryData(
          queryKeys.ingestion.job(worldId, data.jobId),
          (old: any) => ({ ...old, ...data })
        );
      }),
    ];

    return () => unsubs.forEach(fn => fn());
  }, [worldId]);
}
```

### 4.4 Data Fetching Summary Table

| Data | Where Fetched | Cache Strategy | Real-time |
|---|---|---|---|
| World metadata | RSC → hydrate | TQ, 60s stale | WS invalidation |
| Beat list | RSC → hydrate | TQ, 10s stale, optimistic mutations | WS invalidation |
| Beat detail | Client (on click) | TQ, 10s stale | WS invalidation |
| Document content | RSC → hydrate | TQ, 30s stale | WS CRDT ops |
| Entity list | RSC → hydrate | TQ, 60s stale | WS invalidation |
| Entity detail | Client (on click) | TQ, 60s stale | WS invalidation |
| Visualization data | RSC → hydrate | TQ, 120s stale | WS invalidation |
| Ingestion progress | Client (polling + WS) | TQ, no cache | WS push updates |
| AI suggestions | Client (on demand) | No cache | SSE streaming |
| Collaborator presence | Client (WS only) | Zustand only | WS push |
| User profile | RSC → hydrate | TQ, 300s stale | — |

---

## 5. Routing — Next.js App Router Structure

```
app/
├── layout.tsx                          ── RootLayout (Server)
├── loading.tsx                         ── Global loading spinner
├── error.tsx                           ── Global error boundary (Client)
├── not-found.tsx                       ── 404 page
│
├── (auth)/
│   ├── layout.tsx                      ── AuthLayout (Server) — centered card layout
│   ├── login/
│   │   └── page.tsx                    ── LoginPage
│   ├── register/
│   │   └── page.tsx                    ── RegisterPage
│   └── forgot-password/
│       └── page.tsx                    ── ForgotPasswordPage
│
├── (app)/
│   ├── layout.tsx                      ── AppLayout (Server) — sidebar + main + story sidebar
│   ├── loading.tsx                     ── App-level loading skeleton
│   │
│   ├── worlds/
│   │   ├── page.tsx                    ── WorldListPage
│   │   ├── loading.tsx                 ── World list skeleton
│   │   │
│   │   └── [worldId]/
│   │       ├── layout.tsx              ── WorldLayout (Server) — fetches world, provides context
│   │       ├── loading.tsx             ── World loading skeleton
│   │       ├── error.tsx               ── World error boundary
│   │       ├── not-found.tsx           ── World not found
│   │       │
│   │       ├── beat-sheet/
│   │       │   ├── page.tsx            ── BeatSheetPage
│   │       │   ├── loading.tsx         ── Beat sheet skeleton (kanban placeholder)
│   │       │   └── @detail/
│   │       │       ├── default.tsx     ── null (no detail open)
│   │       │       └── [beatId]/
│   │       │           └── page.tsx    ── BeatCardDetail (parallel route)
│   │       │
│   │       ├── writing/
│   │       │   ├── page.tsx            ── WritingPage (redirects to first doc or create)
│   │       │   ├── loading.tsx         ── Editor skeleton
│   │       │   └── [documentId]/
│   │       │       ├── page.tsx        ── WritingPage with specific document
│   │       │       └── loading.tsx     ── Document loading skeleton
│   │       │
│   │       ├── entities/
│   │       │   ├── page.tsx            ── EntitiesPage
│   │       │   ├── loading.tsx         ── Entity list skeleton
│   │       │   └── [entityId]/
│   │       │       └── page.tsx        ── EntityDetail page (or intercepting route)
│   │       │
│   │       ├── visualizations/
│   │       │   ├── page.tsx            ── VisualizationsPage
│   │       │   └── loading.tsx         ── Visualization skeleton
│   │       │
│   │       ├── ingestion/
│   │       │   ├── page.tsx            ── IngestionPage
│   │       │   └── loading.tsx         ── Ingestion skeleton
│   │       │
│   │       └── settings/
│   │           ├── page.tsx            ── WorldSettingsPage
│   │           └── loading.tsx         ── Settings skeleton
│   │
│   └── account/
│       ├── page.tsx                    ── AccountPage
│       └── loading.tsx                 ── Account skeleton
│
├── api/                                ── Route handlers (if needed beyond external API)
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts                ── NextAuth.js route handler
│   ├── ws/
│   │   └── route.ts                    ── WebSocket upgrade endpoint (or external service)
│   └── ai/
│       └── stream/
│           └── route.ts                ── AI streaming proxy (SSE)
│
└── globals.css                         ── Tailwind base + custom styles
```

### Parallel Routes

**Beat detail panel** (`@detail`): The beat card detail panel renders alongside the beat board without replacing it. When a beat card is clicked, the URL updates to `/worlds/[worldId]/beat-sheet?beat=[beatId]` (or via the parallel route slot), and the detail panel slides in from the right.

```
app/worlds/[worldId]/beat-sheet/
├── layout.tsx          ── renders {children} and {detail} side by side
├── page.tsx            ── BeatSheetPage (the board)
└── @detail/
    ├── default.tsx     ── returns null (no panel)
    └── [beatId]/
        └── page.tsx    ── BeatCardDetail panel
```

### Intercepting Routes

**Entity quick-view**: When an entity is clicked from within another view (e.g., from a beat card), an intercepting route shows a modal with entity detail instead of navigating away.

```
app/worlds/[worldId]/
├── (.)entities/[entityId]/
│   └── page.tsx        ── EntityDetail as modal (intercepted)
└── entities/[entityId]/
    └── page.tsx        ── EntityDetail as full page (direct navigation)
```

---

## 6. Key Technical Decisions

### 6.1 TipTap + shadcn Integration

Use `minimal-tiptap` as the base component, extended with custom node views:

```
TipTapEditor (Client)
├── Uses: @tiptap/react, @tiptap/starter-kit, @tiptap/extension-*
├── Base: minimal-tiptap adapted for shadcn styling
├── Extensions:
│   ├── EntityMark ─── custom mark for entity highlights (click → tooltip)
│   ├── BeatBoundary ─── custom node for beat section markers
│   ├── ScreenplayNodes ─── custom nodes: slugline, action, dialogue, etc.
│   ├── CollaborationCursor ─── Yjs awareness cursors
│   ├── SlashCommand ─── / menu for inserting entities, beats, AI prompts
│   └── AIInlineCompletion ─── ghost text AI suggestions
├── Toolbar: shadcn Button, Toggle, DropdownMenu components
└── All dialogs/popovers: shadcn Dialog, Popover, Command
```

The editor instance is stored as a ref in `WritingSurfaceView`. The `useEditorStore` Zustand store mirrors key editor state (cursor position, word count, sections) but does **not** own the TipTap document — TipTap manages its own ProseMirror state. Zustand is updated via TipTap's `onUpdate` and `onSelectionUpdate` callbacks.

```typescript
const editor = useEditor({
  extensions: [...],
  onUpdate: ({ editor }) => {
    editorStore.updateWordCount(editor.storage.characterCount.words());
    editorStore.markDirty();
  },
  onSelectionUpdate: ({ editor }) => {
    editorStore.setCursorPosition(editor.state.selection.anchor);
  },
});
```

### 6.2 React Flow — Internal State vs. Zustand

React Flow manages its own viewport, node positions, and edge routing internally. We do **not** mirror these into Zustand. Instead:

- **React Flow owns**: viewport (pan, zoom), node XY positions, edge paths, selection state, drag state
- **Zustand (`useVisualizationStore`) owns**: which visualization is active, filters, time slider, selected node ID (for cross-component communication), fullscreen toggle
- **Bridge**: `onNodeClick` in React Flow dispatches `setSelectedNode` to Zustand. Filter changes in Zustand trigger a re-computation of the React Flow `nodes`/`edges` arrays (derived via `useMemo`).

```typescript
function RelationshipGraphView() {
  const { filters, selectedNodeId, setSelectedNode } = useVisualizationStore();
  const { data: graphData } = useQuery(queryKeys.visualizations.graph(worldId));

  const { nodes, edges } = useMemo(
    () => computeGraphLayout(graphData, filters),
    [graphData, filters]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodeClick={(_, node) => setSelectedNode(node.id)}
      fitView
    >
      <Controls />
      <Background />
    </ReactFlow>
  );
}
```

### 6.3 Beat-to-Script Navigation (Deep Linking)

Beats and writing surface sections are linked via `linkedSceneIds` on beats and `beatId` on editor sections.

**Beat Sheet → Writing Surface**:
1. User clicks "Go to scene" on a `BeatCard` or `BeatCardDetail`
2. Navigates to `/worlds/[worldId]/writing/[documentId]?beat=[beatId]`
3. `WritingSurfaceView` reads the `beat` query param on mount
4. Calls `editorStore.navigateToBeat(beatId)` which:
   - Finds the section with matching `beatId`
   - Scrolls TipTap editor to that section's `startPos`
   - Sets `activeSectionId`
   - Pulses the `BeatMarker` node view for visual feedback

**Writing Surface → Beat Sheet**:
1. User clicks a `BeatMarker` inline in the editor
2. Navigates to `/worlds/[worldId]/beat-sheet?beat=[beatId]`
3. `BeatSheetView` reads the `beat` query param, calls `setActiveBeat(beatId)`
4. Scrolls the kanban to the correct column and highlights the card

```typescript
// Shared navigation utility
export function buildBeatLink(worldId: string, beatId: string, target: 'beat-sheet' | 'writing') {
  if (target === 'writing') {
    const docId = getLinkedDocumentId(beatId); // from beat's linkedSceneIds
    return `/worlds/${worldId}/writing/${docId}?beat=${beatId}`;
  }
  return `/worlds/${worldId}/beat-sheet?beat=${beatId}`;
}
```

### 6.4 Story Sidebar Persistence

The `StorySidebar` is defined at the `AppLayout` level (inside `(app)/layout.tsx`), not within any specific view route. This means it persists across all view navigations within a world.

```typescript
// app/(app)/layout.tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />                          {/* Left nav */}
      <main className="flex-1 overflow-hidden">
        {children}                         {/* Route content */}
      </main>
      <StorySidebar />                     {/* Right panel — always mounted */}
    </div>
  );
}
```

- Collapse state is stored in `useUIStore.storySidebarCollapsed` and persisted to `localStorage`
- The sidebar re-fetches its stats via TanStack Query whenever the world changes (keyed on `worldId`)
- On mobile viewports (<1024px), the StorySidebar renders as a `Sheet` (shadcn) overlay instead of an inline panel

### 6.5 Visualization Performance — Large Datasets

**Virtualization**:
- `TimelineView`: Uses a custom virtualized renderer. Only timeline lanes and events visible in the current viewport are rendered. Scroll position drives which data slice is computed.
- `RelationshipGraphView`: React Flow handles viewport culling natively — nodes outside the visible area are not rendered to the DOM.
- `EntityList`, `BeatListView`: Use `@tanstack/react-virtual` for windowed rendering of long lists.

**Progressive Loading**:
- Visualization endpoints support `?depth=summary|full` parameter
  - `summary`: Node count, edge count, layout positions only (loaded in RSC)
  - `full`: All node metadata, relationship labels, entity attributes (loaded client-side on demand)
- Graph layouts are **pre-computed server-side** and cached. The client receives positioned nodes, avoiding expensive force-directed layout computation in the browser.

**Canvas Fallback**:
- For worlds with >500 entities or >2000 relationships, the `RelationshipGraphView` switches from React Flow (SVG/DOM) to a WebGL canvas renderer (e.g., `@react-sigma/core` or custom Canvas2D) to maintain 60fps panning/zooming.

**Debounced Filters**:
- `TimeSlider` and `VisualizationFilters` debounce their output (150ms) before triggering data re-computation, preventing layout thrash during scrubbing.

```typescript
// Example: progressive loading in visualization
function RelationshipGraphView({ worldId }: { worldId: string }) {
  // Summary loaded via RSC hydration — fast initial render
  const { data: summary } = useQuery({
    queryKey: [...queryKeys.visualizations.graph(worldId), 'summary'],
    staleTime: 120_000,
  });

  // Full data loaded lazily when user interacts
  const { data: full, isLoading } = useQuery({
    queryKey: [...queryKeys.visualizations.graph(worldId), 'full'],
    enabled: !!summary,       // only after summary is available
    staleTime: 120_000,
  });

  const graphData = full ?? summary;
  // ...render with graphData
}
```

---

## Appendix: Provider Hierarchy

The provider nesting order in `RootLayout` matters for context availability:

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system">
          <AuthProvider>
            <QueryProvider>
              <WorldProvider>
                <ToastProvider>
                  {children}
                </ToastProvider>
              </WorldProvider>
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Rationale for ordering**:
1. `ThemeProvider` — outermost, no dependencies, needed everywhere
2. `AuthProvider` — wraps everything that needs auth state
3. `QueryProvider` — wraps everything that fetches data (needs auth token from above)
4. `WorldProvider` — wraps everything that needs world context (needs query client from above)
5. `ToastProvider` — innermost, can reference any context above for toast content
