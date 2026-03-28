# StoryForge User Flows & Screen Specifications

> Screen-by-screen specification of every view in the StoryForge story world architecture platform.

---

## Table of Contents

1. [Global Layout & Navigation](#global-layout--navigation)
2. [Keyboard Shortcuts](#keyboard-shortcuts)
3. [Mobile & Tablet Responsiveness](#mobile--tablet-responsiveness)
4. [Screens](#screens)
   - [Landing / Dashboard](#1-landing--dashboard)
   - [World Workspace Shell](#2-world-workspace-shell)
   - [Story Sidebar](#3-story-sidebar)
   - [Beat Sheet / Scene Board](#4-beat-sheet--scene-board)
   - [Writing Surface](#5-writing-surface)
   - [Treatment View](#6-treatment-view)
   - [Timeline View](#7-timeline-view)
   - [Character Map](#8-character-map)
   - [Character Detail Panel](#9-character-detail-panel)
   - [Arc Diagram](#10-arc-diagram)
   - [Mind Map / World Map](#11-mind-map--world-map)
   - [Source Material Manager + Viewer](#12-source-material-manager--viewer)
   - [Ingestion Progress + Entity Review](#13-ingestion-progress--entity-review)
   - [Consistency Dashboard](#14-consistency-dashboard)
   - [What-If Explorer](#15-what-if-explorer)
   - [Pacing Heatmap](#16-pacing-heatmap)
   - [Emotional Arc Chart](#17-emotional-arc-chart)
   - [Faction / Power Map](#18-faction--power-map)
   - [Foreshadowing Web](#19-foreshadowing-web)
   - [Causality Graph](#20-causality-graph)
   - [Audience Knowledge Map](#21-audience-knowledge-map)
   - [Wiki / Encyclopedia](#22-wiki--encyclopedia)
   - [Magic / Tech System Designer](#23-magic--tech-system-designer)
   - [World Settings](#24-world-settings)
   - [Export Panel](#25-export-panel)
5. [Core User Flows](#core-user-flows)
   - [Flow 1: New World from Scratch](#flow-1-new-world-from-scratch)
   - [Flow 2: Ingest Existing Work](#flow-2-ingest-existing-work)
   - [Flow 3: Daily Writing Session](#flow-3-daily-writing-session)
   - [Flow 4: Story Analysis](#flow-4-story-analysis)
   - [Flow 5: Revision Impact](#flow-5-revision-impact)
   - [Flow 6: Consistency Check](#flow-6-consistency-check)
   - [Flow 7: What-If Exploration](#flow-7-what-if-exploration)
   - [Flow 8: Treatment Export](#flow-8-treatment-export)

---

## Global Layout & Navigation

StoryForge uses a three-zone layout inside any world workspace:

```
+------------------+----------------------------------+-------------------+
|  Sidebar Nav     |  Main Canvas                     |  Detail Panel     |
|  (fixed, 240px)  |  (fluid, fills remaining width)  |  (collapsible,    |
|                  |                                  |   360px)          |
+------------------+----------------------------------+-------------------+
```

- **Sidebar Nav** — persistent left rail; contains world-level navigation links, the Story Sidebar toggle, and the AI Wand trigger.
- **Main Canvas** — the primary working area; changes per screen (beat sheet, writing surface, graph view, etc.).
- **Detail Panel** — slides in from the right when an entity is selected; can be pinned open or dismissed.

The **Story Sidebar** is a secondary collapsible panel that overlays the left side of the Main Canvas (does not replace the Sidebar Nav). It shows synopsis, word count stats, and quick-jump anchors.

### Top Bar (present on all screens inside a workspace)

| Element | Description |
|---------|-------------|
| Breadcrumb | `World Name > Current View` — each segment is clickable |
| Search / Omnibar | `Cmd+K` — searches entities, scenes, text across the world |
| Notifications bell | Consistency alerts, impact analysis results, ingestion completion |
| Undo / Redo | Global undo stack scoped to current session |
| User avatar + menu | Account settings, sign out, switch workspace |

---

## Keyboard Shortcuts

### Global (available on every screen)

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open Omnibar (search anything) |
| `Cmd+Z` / `Ctrl+Z` | Undo |
| `Cmd+Shift+Z` / `Ctrl+Shift+Z` | Redo |
| `Cmd+S` / `Ctrl+S` | Force save (auto-save is default) |
| `Cmd+\` / `Ctrl+\` | Toggle Story Sidebar |
| `Cmd+Shift+\` / `Ctrl+Shift+\` | Toggle Detail Panel |
| `Cmd+1` through `Cmd+9` | Jump to sidebar nav item 1–9 |
| `Cmd+N` / `Ctrl+N` | New entity (context-sensitive: new beat, new character, etc.) |
| `Esc` | Close topmost panel / modal / dismiss selection |
| `?` | Show keyboard shortcut overlay (when not in a text field) |

### Beat Sheet

| Shortcut | Action |
|----------|--------|
| `Arrow keys` | Navigate between beat cards |
| `Enter` | Open selected beat card for editing |
| `Space` | Toggle beat card expand/collapse |
| `D` | Duplicate selected beat card |
| `Backspace` / `Delete` | Delete selected beat card (with confirmation) |
| `Cmd+Shift+N` | New beat card after current selection |
| `Cmd+Up/Down` | Reorder beat card up/down |

### Writing Surface

| Shortcut | Action |
|----------|--------|
| `Cmd+B` / `Ctrl+B` | Bold |
| `Cmd+I` / `Ctrl+I` | Italic |
| `Cmd+Shift+S` | Toggle Screenplay / Prose mode |
| `Tab` (screenplay mode) | Cycle element type: action → character → dialogue → parenthetical |
| `Cmd+Enter` | AI Wand — generate suggestion at cursor |
| `Cmd+Shift+H` | Toggle entity highlighting |
| `Cmd+D` | Open detail panel for highlighted entity under cursor |
| `F11` | Distraction-free / zen mode (hides all chrome) |

### Graph Views (Character Map, Causality, Foreshadowing, etc.)

| Shortcut | Action |
|----------|--------|
| `+` / `-` | Zoom in / out |
| `0` | Fit graph to viewport |
| `Click + Drag` | Pan canvas |
| `Shift+Click` | Multi-select nodes |
| `F` | Focus/center on selected node |

---

## Mobile & Tablet Responsiveness

### Tablet (768px – 1024px)

- Sidebar Nav collapses to icon-only rail (48px); tap hamburger to expand as overlay.
- Detail Panel opens as a bottom sheet (half-height) instead of a right panel.
- Story Sidebar opens as a full-screen overlay with a close button.
- Beat Sheet switches from multi-column board to single-column scrollable list.
- Writing Surface is fully functional; toolbar moves to a floating bottom bar.
- Graph views are fully interactive with pinch-to-zoom and two-finger pan.
- Export Panel is fully functional.

### Mobile (< 768px)

- **Desktop-only screens**: Character Map, Arc Diagram, Mind Map, Foreshadowing Web, Causality Graph, Faction/Power Map, Audience Knowledge Map, Pacing Heatmap, Emotional Arc Chart, What-If Explorer (side-by-side compare), Magic/Tech System Designer.
- **Mobile-optimized screens**: Landing/Dashboard, Beat Sheet (list mode), Writing Surface (simplified toolbar), Wiki/Encyclopedia (read-only), Treatment View (read-only), Character Detail (full-screen card), Consistency Dashboard (list only), World Settings, Export Panel.
- Sidebar Nav becomes a bottom tab bar with 5 icons: Home, Beats, Write, Wiki, More.
- All modals become full-screen views.

---

## Screens

---

### 1. Landing / Dashboard

**Route:** `/dashboard`

**Layout:** Full-width, no sidebar. Top bar with logo, search, user menu. Main area is a responsive grid of world cards.

**Components:**

| Component | Details |
|-----------|---------|
| Top bar | StoryForge logo (left), Omnibar search (center), user avatar + dropdown (right) |
| "Create New World" button | Prominent CTA, top-right of content area, with `+` icon |
| World card grid | Responsive grid (3 columns desktop, 2 tablet, 1 mobile) |
| World card | Thumbnail image (auto-generated from genre or user-uploaded cover), world title, genre tag, last-edited timestamp, word count badge, progress bar (% of beat sheet completed) |
| Sort/Filter bar | Sort by: last edited, created date, alphabetical, word count. Filter by: genre tag, status (draft/in-progress/complete) |
| Empty state | Illustration + "Create your first world" CTA when no worlds exist |

**Data Displayed:**
- List of all worlds belonging to the user
- Per world: title, genre, cover image, last-edited date, total word count, beat completion percentage

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Create new world | Click "Create New World" button | Opens Create World modal |
| Open world | Click a world card | Navigates to `/worlds/:id/beats` (Beat Sheet) |
| Search worlds | Type in Omnibar | Filters world cards in real time |
| Sort worlds | Change sort dropdown | Re-orders grid |
| Filter worlds | Click genre/status filter chips | Filters grid |
| Delete world | Right-click card → "Delete" (or `...` menu) | Confirmation dialog → removes world |
| Duplicate world | `...` menu → "Duplicate" | Creates a copy with "(Copy)" suffix |
| Archive world | `...` menu → "Archive" | Moves to archived section (collapsed at bottom of grid) |

**State Transitions:**
- `Create New World` → opens modal (see [Flow 1](#flow-1-new-world-from-scratch))
- `Open World` → navigates to World Workspace Shell at `/worlds/:id/beats`
- `Delete World` → confirmation dialog → on confirm, card animates out, world deleted
- `Duplicate World` → new card appears at top of grid with loading shimmer → resolves to full card

---

### 2. World Workspace Shell

**Route:** `/worlds/:id` (redirects to `/worlds/:id/beats`)

**Layout:** Three-zone layout (Sidebar Nav + Main Canvas + Detail Panel). This is the persistent shell for all world-level screens.

**Components:**

| Component | Details |
|-----------|---------|
| Sidebar Nav | Fixed left rail. Sections: **Story** (Beat Sheet, Writing Surface, Treatment), **Analysis** (Timeline, Character Map, Arc Diagram, Pacing Heatmap, Emotional Arc), **World** (Mind Map, Wiki, Magic/Tech Systems, Faction Map, Foreshadowing Web, Causality Graph, Audience Knowledge Map), **Management** (Source Materials, Consistency Dashboard, What-If Explorer, World Settings, Export). Each item has an icon + label. Active item is highlighted. |
| Story Sidebar toggle | Button at top of sidebar nav, toggles the Story Sidebar overlay |
| AI Wand button | Floating action button at bottom of sidebar nav; sparkle icon |
| Notification badge | Red dot on sidebar nav items that have active alerts (e.g., consistency issues count) |
| Main Canvas | Content area that renders the active screen |
| Detail Panel | Right panel, hidden by default; opens when an entity is clicked |
| Top Bar | Breadcrumb, Omnibar, notification bell, undo/redo, user avatar |
| Branch indicator | If in a What-If branch: colored banner below top bar showing branch name + "Return to Canon" button |

**Data Displayed:**
- World title in breadcrumb
- Active view name in breadcrumb
- Notification counts on sidebar items
- Branch name if in a What-If branch

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Navigate to view | Click sidebar nav item | Main Canvas loads corresponding screen; URL updates |
| Toggle Story Sidebar | Click toggle or `Cmd+\` | Story Sidebar slides in/out over Main Canvas |
| Open AI Wand | Click FAB or `Cmd+Enter` | Context-sensitive AI panel opens (see individual screen specs for behavior) |
| Open Omnibar | Click search or `Cmd+K` | Modal search overlay; searches entities, scenes, text |
| View notifications | Click bell icon | Dropdown with notification list; click item to navigate to relevant screen |
| Return to Canon | Click "Return to Canon" on branch banner | Navigates back to canonical world, exits branch |
| Return to Dashboard | Click StoryForge logo in top bar | Navigates to `/dashboard` |

---

### 3. Story Sidebar

**Route:** N/A (overlay panel, available on all `/worlds/:id/*` routes)

**Layout:** Overlay panel, 320px wide, slides in from the left edge of the Main Canvas. Has its own vertical scroll. Semi-transparent scrim on the Main Canvas behind it.

**Components:**

| Component | Details |
|-----------|---------|
| Synopsis editor | Rich-text field (title: "Synopsis"). Collapsible. Auto-saved. Supports basic formatting (bold, italic, paragraph breaks). |
| Logline field | Single-line text input above synopsis: "Write your logline" |
| Genre / Tone tags | Editable tag chips below synopsis |
| Stats panel | Read-only section: Total word count, scene count, character count, location count, estimated page count, average scene length |
| Session tracker | Today's word count, words written this session, session timer (auto-started when writing surface is active) |
| Quick-jump list | Scrollable list of all beats/scenes in order; click to jump to that beat in Beat Sheet or that section in Writing Surface |
| Completion ring | Circular progress indicator showing beat sheet completion (filled beats / total structure slots) |

**Data Displayed:**
- World synopsis (editable)
- Logline (editable)
- Genre and tone tags
- Aggregate statistics computed from world data
- Session-specific writing stats
- Ordered list of beats/scenes

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Edit synopsis | Click into synopsis field, type | Text auto-saves after 1s debounce |
| Edit logline | Click into logline field, type | Auto-saves |
| Add/remove genre tag | Click `+` to add, click `x` on chip to remove | Tags update immediately |
| Jump to beat/scene | Click item in quick-jump list | Main Canvas navigates to that beat (Beat Sheet) or scrolls to that section (Writing Surface) |
| Collapse section | Click section header chevron | Section collapses; state persisted per user |
| Close sidebar | Click scrim, press `Esc`, or press `Cmd+\` | Sidebar slides out |

---

### 4. Beat Sheet / Scene Board

**Route:** `/worlds/:id/beats`

**Layout:** Main Canvas shows a Kanban-style board or vertical list (user-toggleable). Columns represent story structure acts or phases. Each card is a beat.

**Components:**

| Component | Details |
|-----------|---------|
| View toggle | Toolbar button group: "Board" (Kanban) / "List" (vertical) / "Outline" (indented text) |
| Structure template selector | Dropdown: "Save the Cat", "Three-Act", "Hero's Journey", "Five-Act", "Custom". Changing template re-maps existing beats to new structure slots. |
| Act columns (Board view) | Each column is a structural phase (e.g., "Act 1 — Setup", "Act 2A — Rising Action"). Column header shows act name + beat count. |
| Beat card | Card with: beat title (editable inline), beat type tag (e.g., "Catalyst", "Midpoint"), one-line summary, character avatars for participating characters, word count badge, status indicator (empty / drafted / revised / final), color stripe on left edge matching act color |
| "Add Beat" button | `+` button at bottom of each column (Board) or at cursor position (List) |
| Drag handles | On each beat card; enables drag-to-reorder within or across columns |
| AI Wand zone | Sparkle icon in empty beat slots; click to get AI-generated beat suggestion |
| Filter bar | Filter beats by: character, location, status, beat type |
| Bulk select toolbar | Appears when Shift+Click selects multiple beats: "Move", "Tag", "Delete", "Set Status" |

**Data Displayed:**
- All beats in the world, organized by structural act
- Per beat: title, type, summary, participating characters (avatar thumbnails), word count, status
- Act-level aggregates: beat count, total word count per act

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Add beat | Click `+` button | New empty beat card appears; title field is focused for inline editing |
| Edit beat title | Double-click or press Enter on selected card | Inline text edit on the card |
| Open beat detail | Single-click a beat card | Detail Panel opens on right with full beat editor (see below) |
| Start writing from beat | Click "Write" button on beat card or in Detail Panel | Navigates to Writing Surface (`/worlds/:id/write`) scrolled to that beat's section |
| Reorder beat | Drag card to new position | Beat order updates; structural mapping recalculates |
| Move beat to different act | Drag card to different column | Beat reassigned to new act |
| Change structure template | Select from dropdown | Confirmation dialog ("Remap beats to new structure?") → beats redistribute into new act columns |
| AI Wand suggest | Click sparkle icon on empty slot | Loading shimmer → AI-generated beat appears as a suggestion card (dashed border). User can "Accept", "Regenerate", or "Dismiss". |
| Filter beats | Select filter criteria | Non-matching cards dim (not hidden) so structural context is preserved |
| Switch view mode | Click Board / List / Outline toggle | Main Canvas re-renders in selected layout |
| Bulk select | Shift+Click multiple cards | Bulk toolbar appears above canvas |
| Delete beat | Select card → press Delete key → confirm | Card removed with undo toast ("Beat deleted. Undo?") |

**Beat Detail Panel (opens in right Detail Panel):**

| Field | Type |
|-------|------|
| Title | Text input |
| Beat type | Dropdown (Catalyst, Midpoint, Climax, etc. — depends on active structure template) |
| Summary | Multi-line text |
| Full description | Rich text editor |
| Characters involved | Entity multi-select (typeahead, shows character avatars) |
| Locations | Entity multi-select |
| Emotional valence | Slider: -5 (despair) to +5 (triumph) — feeds into Emotional Arc Chart |
| Pacing weight | Dropdown: Slow / Medium / Fast — feeds into Pacing Heatmap |
| Linked source materials | File links to uploaded documents |
| Notes | Free-form markdown field |
| Status | Dropdown: Empty → Drafted → Revised → Final |

**State Transitions:**
- Creating a beat → card appears in column with focus on title
- Clicking beat card → Detail Panel opens/updates with that beat's data
- Clicking "Write" → navigates to Writing Surface at `/worlds/:id/write?beat=:beatId`
- AI Wand suggest → suggestion card appears (dashed border) → Accept: converts to solid card; Dismiss: card removed; Regenerate: loading state → new suggestion
- Deleting beat → undo toast for 8 seconds → permanent after toast expires

---

### 5. Writing Surface

**Route:** `/worlds/:id/write`
**Query params:** `?beat=:beatId` (optional, scrolls to beat section), `?mode=prose|screenplay` (optional, sets mode)

**Layout:** Main Canvas is a full-width editor. Minimal chrome. Optional Detail Panel on right for entity information.

**Components:**

| Component | Details |
|-----------|---------|
| Mode toggle | Toolbar: "Prose" / "Screenplay". Switches formatting rules and element types. |
| Formatting toolbar | Contextual: **Prose mode** — bold, italic, heading levels, block quote, horizontal rule. **Screenplay mode** — scene heading, action, character, dialogue, parenthetical, transition. |
| Editor body | Long-form text editor. Divided into sections corresponding to beats (section dividers with beat titles visible as faint headers). Scrollable. |
| Beat section dividers | Faint horizontal rule + beat title label between sections. Clicking label scrolls Beat Sheet to that card. |
| Entity highlighting | Inline highlights on recognized entity names: characters (blue underline), locations (green underline), items/concepts (purple underline). Toggle-able via toolbar button or `Cmd+Shift+H`. |
| AI Wand inline | Sparkle icon appears in gutter when cursor is on an empty line or at a beat section boundary. Also triggered via `Cmd+Enter`. |
| Word count footer | Sticky bottom bar: current section word count, total document word count, page estimate, reading time |
| Focus mode toggle | Button to enter distraction-free mode (hides sidebar nav, toolbar, all chrome except the text) |
| Version history button | Clock icon in toolbar; opens version timeline drawer |

**Data Displayed:**
- Full manuscript text, segmented by beats
- Inline entity highlights (character names, locations, items)
- Word count and page statistics
- Current beat context (which beat section the cursor is in — shown in breadcrumb)

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Write text | Type in editor | Text appears. Auto-saved every 2 seconds. Entity recognition runs on pause (300ms debounce). |
| Switch mode | Click Prose/Screenplay toggle or `Cmd+Shift+S` | Editor reformats: Prose shows paragraphs; Screenplay shows formatted elements (scene heading, dialogue blocks, etc.) |
| Apply formatting | Toolbar button or keyboard shortcut | Selected text formatted. In screenplay mode, Tab cycles element type for current line. |
| Click highlighted entity | Click on a blue/green/purple-underlined name | Detail Panel opens with that entity's information (Character Detail, Location detail, etc.) |
| Hover highlighted entity | Hover over highlighted name | Tooltip: entity name, type, brief description, "Click for details" |
| AI Wand generate | Click gutter sparkle or `Cmd+Enter` | AI generates a continuation/suggestion based on current beat context + surrounding text. Appears as ghost text (grey, italicized). Press `Tab` to accept, `Esc` to dismiss. |
| Navigate to beat | Click beat section divider label | Scrolls to that section; breadcrumb updates |
| Jump to beat from URL | Arrive with `?beat=:beatId` | Editor scrolls to that beat's section on load |
| Enter focus mode | Click focus button or `F11` | All UI chrome fades out. Mouse movement to edges reveals toolbar/sidebar. `Esc` exits. |
| View version history | Click clock icon | Right drawer shows timeline of auto-saves + manual save points. Click any point to preview. "Restore" button reverts to that version. |
| Add inline comment | Select text → right-click → "Add Comment" | Yellow highlight appears; comment thread opens in Detail Panel |
| Split section | Right-click on beat divider → "Split Beat Here" | Current beat section splits into two beats; new beat card auto-created in Beat Sheet |
| Merge sections | Right-click on beat divider → "Merge with Previous" | Combines two beat sections; corresponding beat cards merge in Beat Sheet |

**State Transitions:**
- Typing → auto-save indicator pulses in footer ("Saving..." → "Saved")
- Entity recognition triggers → new highlights appear inline with subtle fade-in
- AI Wand → ghost text appears → Tab accepts (ghost text becomes real text), Esc dismisses
- Mode switch → editor content reflows with new formatting rules (no data lost; markup translates)
- Focus mode → chrome fades out with 300ms animation → editor expands to full viewport

---

### 6. Treatment View

**Route:** `/worlds/:id/treatment`

**Layout:** Main Canvas shows a document-style view. Clean, print-ready layout.

**Components:**

| Component | Details |
|-----------|---------|
| Title block | World title, author name, genre, logline — all editable inline |
| Treatment body | Auto-generated outline from beat sheet order. Each beat becomes a paragraph: beat title as bold lead, beat summary as body text. Section breaks between acts. |
| Editor toolbar | Minimal: bold, italic, heading. Edits here are treatment-only (do not modify beat data). |
| Act headers | Large heading for each act, with beat count and page estimate |
| Reorder handle | Drag handle on each paragraph to reorder treatment sections (reorders treatment only, not beat sheet) |
| "Sync from Beats" button | Re-generates treatment from current beat sheet data (overwrites manual edits with confirmation) |
| Export button | Opens Export Panel pre-configured for treatment export |
| Page break indicators | Faint dashed lines showing where page breaks fall at standard formatting |

**Data Displayed:**
- Treatment document: title, author, logline, act-structured paragraphs derived from beats
- Page count estimate
- Last-synced timestamp (when treatment was last regenerated from beats)

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Edit treatment text | Click and type in body | Treatment text updates (treatment-local edits, not synced back to beats) |
| Edit title block | Click and type in title/author/logline | Updates treatment header |
| Reorder paragraphs | Drag paragraph handle | Paragraph moves; treatment order may now differ from beat order |
| Sync from beats | Click "Sync from Beats" | Confirmation dialog ("This will overwrite manual edits. Continue?") → treatment regenerated from current beat data |
| Export treatment | Click "Export" button | Navigates to Export Panel with treatment pre-selected |
| Print preview | `Cmd+P` | System print dialog with treatment formatted for print |

---

### 7. Timeline View

**Route:** `/worlds/:id/timeline`

**Layout:** Main Canvas shows a horizontal scrollable timeline. Detail Panel available on right.

**Components:**

| Component | Details |
|-----------|---------|
| Timeline rail | Horizontal axis representing story time (can be configured in World Settings to use custom calendars). Zoomable. |
| Event nodes | Circles on the timeline for each beat/event. Color-coded by act. Size indicates pacing weight. Hover shows summary tooltip. |
| Character swim lanes | Optional horizontal bands below the timeline, one per character, showing which events they participate in. Toggle-able. |
| Location layer | Optional layer showing location bars (colored spans indicating where the story is set at each time period). Toggle-able. |
| Zoom controls | Slider + scroll wheel zoom. Range: overview (all events visible) to detail (individual scenes). |
| Time range selector | Draggable range handles on the timeline to focus on a sub-range |
| "Now" marker | Vertical line showing the current story-time position (based on last written beat) |
| Layer toggles | Checkbox group: Events, Characters, Locations, Arcs |

**Data Displayed:**
- All beats/events positioned along story time
- Character participation per event
- Location spans
- Arc phase overlays (if enabled)

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Click event node | Single click | Detail Panel shows beat information |
| Double-click event | Double click | Navigates to Writing Surface at that beat section |
| Zoom | Scroll wheel or slider | Timeline expands/contracts; more or fewer events visible |
| Pan | Click + drag on empty timeline area | Scrolls timeline left/right |
| Toggle swim lanes | Check/uncheck "Characters" in layer toggles | Character lanes show/hide |
| Toggle locations | Check/uncheck "Locations" | Location bars show/hide |
| Add event | Double-click empty space on timeline | Creates new beat at that story-time position; inline title editor appears |
| Drag event | Drag event node along timeline | Repositions event in story time (updates beat order if it crosses other events) |
| Select time range | Drag range handles | Filters all other views to show only data within this range |

---

### 8. Character Map

**Route:** `/worlds/:id/characters`

**Layout:** Main Canvas shows a force-directed graph. Detail Panel on right. Toolbar at top of canvas.

**Components:**

| Component | Details |
|-----------|---------|
| Graph canvas | Force-directed network graph. Nodes are characters; edges are relationships. |
| Character nodes | Circular nodes with character avatar (or initials). Size based on scene count (more scenes = larger node). Border color indicates faction/group. |
| Relationship edges | Lines between nodes. Thickness indicates relationship strength/frequency. Color indicates relationship type (green = allied, red = antagonistic, blue = romantic, grey = neutral). Label on hover shows relationship description. |
| Time slider | Horizontal slider below graph. Dragging changes the "story time" context — graph animates to show only relationships that exist at that point in the story. Relationships that haven't been established yet fade out. |
| Cluster toggle | Button to enable/disable force-clustering by faction |
| "Add Character" button | In toolbar, creates a new character node |
| Legend | Color key for relationship types and node sizing explanation |
| Filter panel | Collapsible: filter by faction, by relationship type, by scene count range |
| Minimap | Small inset showing full graph with viewport rectangle (for large graphs) |

**Data Displayed:**
- All characters as nodes
- All relationships as edges with type and strength
- Time-contextual relationship state (via slider)
- Faction groupings

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Click character node | Single click | Detail Panel opens with Character Detail (see next screen) |
| Double-click character | Double click | Navigates to Character Detail full view |
| Drag character node | Drag | Repositions node on canvas (pin position) |
| Hover relationship edge | Hover | Tooltip shows: relationship type, description, first/last scene together |
| Click relationship edge | Click | Detail Panel shows relationship detail: type, description, scene list, evolution notes |
| Slide time slider | Drag slider | Graph animates: nodes/edges fade in/out as relationships form/dissolve over story time |
| Add character | Click "Add Character" | New node appears at center; Detail Panel opens with empty character form |
| Draw relationship | Drag from one node to another (hold Shift) | Relationship creation modal: select type, add description |
| Filter | Adjust filter panel | Non-matching nodes/edges dim |
| Zoom | Scroll wheel or `+`/`-` keys | Canvas zooms |
| Fit to screen | Press `0` or click "Fit" button | Graph fits to viewport |
| Toggle clustering | Click cluster button | Nodes reorganize by faction groups |

**State Transitions:**
- Time slider change → graph animates over 500ms, fading edges in/out
- Adding character → node appears with spring animation, Detail Panel shows form
- Drawing relationship → modal appears → on save, edge animates into existence

---

### 9. Character Detail Panel

**Route:** N/A (opens as Detail Panel on right side of any screen)
**Full page route:** `/worlds/:id/characters/:characterId`

**Layout:** When opened as panel: 360px right panel with vertical scroll. When opened as full page: Main Canvas layout with two-column form.

**Components:**

| Component | Details |
|-----------|---------|
| Avatar / portrait | Upload zone or AI-generated placeholder (initials on colored circle) |
| Name field | Primary text input, large font |
| Aliases field | Tag input for alternative names / nicknames |
| Role tag | Dropdown: Protagonist, Antagonist, Supporting, Mentioned |
| Faction | Dropdown linked to world's faction list |
| Bio | Rich text editor: backstory, personality, motivations |
| Attributes table | Key-value pairs (customizable): Age, Gender, Physical Description, etc. "Add Attribute" button. |
| Relationships section | List of relationships this character has. Each row: avatar of other character, relationship type, description. Click to navigate to other character. |
| Scene appearances | Ordered list of all beats/scenes this character appears in. Click to navigate. Badge shows scene count. |
| Arc summary | Text area: character arc description (auto-suggested by AI if enough beats exist) |
| Emotional trajectory | Mini sparkline chart showing emotional valence across scenes (from beat emotional valence where character is present) |
| Connected entities | Tags: linked locations, items, events |
| Notes | Free-form markdown |
| "Impact Analysis" button | Shows what would be affected if this character is modified (see [Flow 5](#flow-5-revision-impact)) |
| Delete button | Red, bottom of panel. Confirmation required. |

**Data Displayed:**
- Character: name, aliases, role, faction, bio, custom attributes, relationships, scene list, arc, emotional trajectory, linked entities

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Edit any field | Click and type | Auto-saved. Changes may trigger impact analysis notification. |
| Upload avatar | Click avatar zone → file picker | Image uploaded, cropped to circle |
| Add relationship | Click "Add Relationship" in relationships section | Inline row appears: character selector + type dropdown + description field |
| Click related character | Click avatar/name in relationships list | Detail Panel navigates to that character |
| Click scene | Click scene in appearances list | Navigates to Writing Surface at that section |
| View impact analysis | Click "Impact Analysis" | Impact analysis runs (see [Flow 5](#flow-5-revision-impact)); results appear as notification → click to open Consistency Dashboard |
| Delete character | Click delete → confirm | Character removed from all beats; relationship edges removed from Character Map |
| Add attribute | Click "Add Attribute" | New key-value row appears |

---

### 10. Arc Diagram

**Route:** `/worlds/:id/arcs`

**Layout:** Main Canvas shows the arc visualization. Toolbar at top. Detail Panel on right.

**Components:**

| Component | Details |
|-----------|---------|
| Arc visualization | X-axis: story progression (beats in order). Y-axis: narrative intensity / emotional valence. Lines represent character arcs or structural arcs plotted across beats. |
| Structure overlay | Toggle to overlay a template arc (e.g., Save the Cat beat sheet as a dashed reference line). Dropdown to select template. |
| Character arc lines | Each selected character's emotional trajectory plotted as a colored line. Legend shows character-to-color mapping. |
| Deviation indicators | Where a character's arc significantly deviates from the template arc, a warning icon appears with a tooltip explaining the deviation. |
| Character selector | Multi-select dropdown to choose which character arcs to display |
| Template selector | Dropdown: "Save the Cat", "Hero's Journey", "Three-Act", "None" |
| Beat markers | Vertical dashed lines at key structural beats (Catalyst, Midpoint, Climax, etc.) with labels |
| Tooltip | On hover over any point: beat title, character, emotional valence, summary |

**Data Displayed:**
- Character emotional arcs across beats
- Structural template reference line
- Beat markers with structural labels
- Deviation indicators

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Select characters | Multi-select in character selector | Arc lines show/hide for selected characters |
| Select template overlay | Choose from template dropdown | Dashed reference line appears/changes |
| Hover arc point | Mouse over a data point | Tooltip with beat + character + valence |
| Click arc point | Click a data point | Detail Panel shows that beat's information |
| Click deviation indicator | Click warning icon | Detail Panel shows deviation analysis: expected arc position vs. actual, suggestion for adjustment |
| Zoom X-axis | Scroll horizontally | Zoom into a range of beats |
| Export chart | Click export icon in toolbar | Downloads PNG or SVG of the arc diagram |

---

### 11. Mind Map / World Map

**Route:** `/worlds/:id/map`

**Layout:** Main Canvas is an infinite zoomable canvas. Toolbar at top.

**Components:**

| Component | Details |
|-----------|---------|
| Canvas | Infinite pan-and-zoom canvas (similar to Miro/FigJam). White background with subtle dot grid. |
| Entity nodes | Draggable cards for any entity type: characters, locations, items, events, concepts. Each card shows: icon (type-specific), name, brief description. Color-coded border by entity type. |
| Connection lines | Lines between nodes with optional labels. Can be styled: solid, dashed, directional (arrow). |
| "Add Node" floating menu | Click empty canvas → radial menu: Character, Location, Item, Event, Concept, Free Note |
| Free note cards | Sticky-note-style cards for unstructured notes |
| Grouping regions | Colored background rectangles to group related nodes (drag to create) |
| Minimap | Inset navigation aid |
| Search within map | Toolbar search that highlights and zooms to matching nodes |
| Auto-layout button | Rearranges nodes using force-directed algorithm |
| Upload background | Upload an image (e.g., fantasy world map) as the canvas background |

**Data Displayed:**
- All world entities as nodes (user chooses which to place on map)
- Connections between entities
- Spatial arrangement (user-defined or auto-layout)
- Optional background image

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Add node | Double-click canvas or use radial menu | New node appears at click position; type selector → name field focused |
| Connect nodes | Drag from node's connection handle to another node | Line created; label editor appears |
| Move node | Drag node | Node repositions; connected lines follow |
| Edit node | Double-click node | Inline editor expands: name, description, links |
| Click node | Single click | Detail Panel opens with entity details |
| Create group | Shift+Drag on empty canvas | Creates rectangular region; drop nodes inside to group |
| Upload background | Toolbar → "Background Image" | File picker → image placed behind all nodes |
| Auto-layout | Click auto-layout button | Nodes animate to force-directed positions |
| Search | Type in map search | Matching nodes pulse; canvas pans to center on first result |
| Delete node/connection | Select → Delete key | Removed with undo toast |

---

### 12. Source Material Manager + Viewer

**Route:** `/worlds/:id/sources`

**Layout:** Main Canvas split: left half is the file list, right half is the document viewer/preview.

**Components:**

| Component | Details |
|-----------|---------|
| File list panel | Scrollable list of uploaded source materials. Each row: file icon (by type), filename, upload date, file size, tag chips, ingestion status badge (pending / processing / complete / failed). |
| Upload zone | Drag-and-drop zone at top of file list, or "Upload" button. Accepts: .docx, .fountain, .pdf, .txt, .rtf, .epub, .fdx (Final Draft) |
| Tag filter | Filter files by user-defined tags |
| Document viewer | Renders selected document in a readable format. For text documents: formatted text view. For PDFs: embedded PDF viewer. Supports text selection. |
| Highlight toolbar | When text is selected in the viewer: "Create Character", "Create Location", "Create Event", "Link to Existing Entity", "Add to Beat" |
| Annotations panel | Right margin of viewer showing annotations/highlights linked to entities |
| "Ingest" button | Per file or bulk: triggers the AI ingestion pipeline to extract entities |
| Search within file | Search bar for the currently viewed document |

**Data Displayed:**
- List of all uploaded source material files with metadata
- Rendered content of the selected file
- Annotations/highlights linked to world entities

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Upload file | Drag-and-drop or click "Upload" | File uploads with progress bar; added to file list |
| Select file | Click file in list | Document viewer loads that file |
| Ingest file | Click "Ingest" on a file row | Navigates to Ingestion Progress screen (see next) |
| Bulk ingest | Select multiple files → "Ingest Selected" | Ingestion queued for all selected files |
| Select text in viewer | Click-drag in document viewer | Highlight toolbar appears above selection |
| Create entity from selection | Select text → click "Create Character" / "Create Location" / etc. | Entity creation form opens in Detail Panel, pre-populated with selected text |
| Link to existing entity | Select text → click "Link to Existing" | Entity search modal → select entity → text is annotated with entity link |
| Add tag to file | Click `+` on file row → type tag | Tag added to file |
| Delete file | Right-click → "Delete" or select → Delete key | Confirmation → file removed (entities created from it are NOT deleted) |
| Search within file | Type in document search bar | Matches highlighted in viewer; navigation arrows to jump between matches |

---

### 13. Ingestion Progress + Entity Review

**Route:** `/worlds/:id/sources/:sourceId/ingest` (progress)
**Route:** `/worlds/:id/sources/:sourceId/review` (entity review)

**Layout:** Full Main Canvas. Two-phase screen: Progress → Review.

#### Phase 1: Ingestion Progress

**Components:**

| Component | Details |
|-----------|---------|
| Progress card | Central card showing: filename, progress bar (0–100%), current phase label ("Parsing text...", "Extracting characters...", "Mapping relationships...", "Building timeline..."), estimated time remaining |
| Phase checklist | Vertical stepper showing completed and pending phases: Parse → Extract Entities → Map Relationships → Identify Events → Build Timeline |
| Live extraction preview | Below progress card: scrolling list of entities being extracted in real time (name + type as they're identified) |
| Cancel button | Stops ingestion (entities extracted so far are preserved for review) |

#### Phase 2: Entity Review (Tinder-style)

**Components:**

| Component | Details |
|-----------|---------|
| Entity card stack | Central card showing one extracted entity at a time. Card displays: entity type icon, name, extracted description, source quote (the passage where the entity was found, highlighted), confidence score (AI's confidence that this is a distinct entity), suggested merge targets (if similar entities already exist in the world) |
| Action buttons | Three large buttons below card: **Confirm** (green check) — adds entity to world as-is. **Merge** (blue merge icon) — opens merge modal to combine with existing entity. **Dismiss** (red X) — discards entity. |
| Merge modal | When "Merge" is clicked: shows the extracted entity side-by-side with the existing entity it might match. User selects which fields to keep from each. "Merge" button combines them. |
| Progress indicator | "12 of 47 entities reviewed" with progress bar |
| Quick actions bar | "Confirm All Remaining" (bulk accept), "Undo Last" (revert last decision) |
| Entity type tabs | Tabs to filter review by type: All, Characters, Locations, Events, Items |
| Keyboard hint | "← Dismiss  ↑ Merge  → Confirm" shown below card |

**Data Displayed:**
- Extracted entities with their source context
- Confidence scores
- Suggested merge targets (existing entities with similar names/descriptions)

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Confirm entity | Click green button or press Right arrow or swipe right (tablet) | Entity added to world; next card appears with slide animation |
| Dismiss entity | Click red button or press Left arrow or swipe left (tablet) | Entity discarded; next card appears |
| Merge entity | Click blue button or press Up arrow | Merge modal opens |
| Execute merge | Select fields in merge modal → click "Merge" | Entities combined; next card appears |
| Undo last | Click "Undo Last" or `Cmd+Z` | Previous card returns; previous action reversed |
| Confirm all remaining | Click "Confirm All Remaining" | Confirmation dialog ("Add N entities to world?") → all remaining confirmed |
| Filter by type | Click entity type tab | Card stack filters to show only that type |
| Cancel review | Navigate away | Reviewed entities are saved; unreviewed ones remain in queue (can resume later) |

**State Transitions:**
- Ingestion starts → progress screen with animated progress bar
- Ingestion completes → automatic transition to Entity Review screen
- All entities reviewed → success screen with summary (N confirmed, N merged, N dismissed) + "Explore World" button → navigates to Character Map
- Cancel during ingestion → partial results available for review
- Resume review → returns to first unreviewed entity

---

### 14. Consistency Dashboard

**Route:** `/worlds/:id/consistency`

**Layout:** Main Canvas shows a sorted list of flagged contradictions. Detail Panel on right for resolution.

**Components:**

| Component | Details |
|-----------|---------|
| Contradiction list | Scrollable list of flagged issues. Each row: severity icon (red = critical, yellow = warning, green = minor), issue title, affected entities (avatar chips), brief description, status (open / resolved / dismissed), timestamp detected. |
| Sort controls | Sort by: severity (default), date detected, entity, status |
| Filter controls | Filter by: severity, entity, status, scene range |
| "Run Check" button | Manually triggers a new consistency analysis across the entire world |
| Summary bar | Top of list: "3 critical, 7 warnings, 2 minor — Last checked: 2 hours ago" |
| Auto-check toggle | Toggle for automatic consistency checking (runs after each edit session) |

**Contradiction Detail (in Detail Panel):**

| Component | Details |
|-----------|---------|
| Issue title | Bold heading describing the contradiction |
| Severity badge | Red / Yellow / Green |
| Description | AI-generated explanation of the contradiction |
| Reference A | Left panel: quote from the source text + beat name + line reference |
| Reference B | Right panel: conflicting quote + beat name + line reference |
| Affected entities | Entity chips showing which characters/locations/events are involved |
| Resolution actions | Three buttons: **"Fix in Source"** (navigates to Writing Surface at the relevant passage, with both references shown in Detail Panel for context), **"Mark as Intentional"** (adds a note that this is deliberate), **"Dismiss"** (removes from list) |
| Fix suggestions | AI-generated suggestion for resolving the contradiction |
| Notes field | Free text for user to add context |

**Data Displayed:**
- All detected contradictions with severity, description, references, affected entities
- Aggregate summary counts

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| View contradiction | Click row in list | Detail Panel opens with full contradiction detail |
| Fix in source | Click "Fix in Source" | Navigates to Writing Surface at the relevant passage; both conflicting references shown in Detail Panel for context |
| Mark as intentional | Click "Mark as Intentional" | Status changes to "Resolved (Intentional)"; row dims in list |
| Dismiss | Click "Dismiss" | Status changes to "Dismissed"; row dims in list |
| Run check | Click "Run Check" | Loading state → new contradictions added, resolved ones removed → summary bar updates |
| Sort | Change sort dropdown | List re-sorts |
| Filter | Adjust filter controls | List filters |
| Toggle auto-check | Toggle switch | Auto-checking enabled/disabled |
| Click entity chip | Click on an entity in the detail view | Detail Panel switches to that entity's detail |
| Navigate to reference | Click "Go to source" link on Reference A or B | Navigates to Writing Surface at that location |

---

### 15. What-If Explorer

**Route:** `/worlds/:id/what-if`
**Branch route:** `/worlds/:id/what-if/:branchId`

**Layout:** Main Canvas. Left side: branch list/manager. Right side: branch workspace or comparison view.

**Components:**

| Component | Details |
|-----------|---------|
| Branch list | Left panel (300px): list of all branches (forks) for this world. Each row: branch name, creation date, forked-from event, status (active / merged / archived). "New Branch" button at top. |
| Branch creation modal | When creating a new branch: timeline view of events with selectable fork point. Name field. "Create Branch" button. |
| Branch workspace | When a branch is selected: the full World Workspace (all screens) but in the context of the branch. A colored banner persists at top: branch name + "Compare to Canon" and "Merge into Canon" buttons. |
| Comparison view | Side-by-side diff of canonical world vs. branch. Split-screen: left = canon, right = branch. Highlights differences in entities, beats, text. Tabs: "Beat Comparison", "Entity Diff", "Text Diff". |
| Merge panel | When "Merge" is clicked: list of all changes in branch with checkboxes. User selects which changes to merge. "Merge Selected" button. Preview of post-merge state. |

**Data Displayed:**
- List of all branches with metadata
- Branch contents (full world fork)
- Diff between canonical and branch worlds

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Create branch | Click "New Branch" → select fork point → name → "Create" | New branch created; navigates to branch workspace |
| Open branch | Click branch in list | Branch workspace loads; colored banner appears |
| Compare to canon | Click "Compare to Canon" in branch banner | Comparison view opens as split-screen |
| Merge into canon | Click "Merge into Canon" | Merge panel opens with change list |
| Select merge changes | Check/uncheck items in merge panel | Selected changes marked for merge |
| Execute merge | Click "Merge Selected" | Confirmation dialog → changes merged into canonical world → branch marked as "Merged" |
| Discard branch | Right-click branch → "Delete" | Confirmation → branch archived (soft delete; can be restored) |
| Return to canon | Click "Return to Canon" in branch banner | Exits branch workspace; returns to canonical world |
| Edit within branch | Any edit action while in branch workspace | Changes are branch-local; do not affect canon |

**State Transitions:**
- Create branch → fork point selected on timeline → branch workspace opens with full copy of world state from that point
- Compare → split-screen loads with diff highlighting (green = additions in branch, red = removals, yellow = modifications)
- Merge → confirmation → canonical world updates → success toast with "Undo merge" option (30 second window)
- Discard → branch moves to "Archived" section at bottom of branch list

---

### 16. Pacing Heatmap

**Route:** `/worlds/:id/pacing`

**Layout:** Main Canvas shows a heatmap grid. Toolbar at top.

**Components:**

| Component | Details |
|-----------|---------|
| Heatmap grid | X-axis: beats/scenes in order. Y-axis: pacing dimensions (action intensity, dialogue density, emotional weight, description length, scene length). Each cell is color-coded: cool blue (slow) → hot red (fast/intense). |
| Summary row | Bottom row showing overall pacing per beat (aggregate of all dimensions) |
| Ideal pacing overlay | Toggle to show a semi-transparent overlay of "ideal" pacing for the selected structure template (e.g., Save the Cat recommends fast pacing at midpoint) |
| Beat labels | X-axis labels showing beat titles (rotated for readability) |
| Tooltip | Hover any cell: beat title, dimension name, value, comparison to ideal |
| Color scale legend | Shows the color-to-value mapping |
| Structure template selector | Same as Arc Diagram — select which template's ideal pacing to overlay |

**Data Displayed:**
- Pacing metrics per beat across multiple dimensions
- Ideal pacing reference from selected template
- Aggregate pacing summary

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Hover cell | Mouse over heatmap cell | Tooltip with details |
| Click cell | Click heatmap cell | Detail Panel opens with that beat's information, pacing fields highlighted |
| Toggle ideal overlay | Click overlay toggle | Semi-transparent ideal pacing line appears/disappears |
| Select template | Change template dropdown | Ideal overlay updates to match selected template |
| Click beat label | Click X-axis label | Navigates to that beat in Beat Sheet |
| Export | Click export icon | Downloads heatmap as PNG |

---

### 17. Emotional Arc Chart

**Route:** `/worlds/:id/emotional-arc`

**Layout:** Main Canvas shows a line chart. Toolbar at top. Very similar to Arc Diagram but focused specifically on emotional valence.

**Components:**

| Component | Details |
|-----------|---------|
| Line chart | X-axis: beats in story order. Y-axis: emotional valence (-5 to +5). Multiple lines for: overall story mood, individual character arcs (selectable). Area fill under the line shows emotional range. |
| Tone bands | Horizontal colored bands in background: red zone (negative/dark), neutral zone, green zone (positive/hopeful). |
| Character selector | Multi-select to show/hide character-specific emotional lines |
| Story mood line | Always visible by default: thick line showing the overall scene emotional tone |
| Beat markers | Vertical lines at key structural beats with labels |
| Annotation dots | Circles on the lines where the user or AI has added notes about emotional shifts |
| Tooltip | On hover: beat title, emotional valence, contributing factors (which events drive the emotion) |

**Data Displayed:**
- Emotional valence per beat (overall and per character)
- Structural beat markers
- Annotations explaining emotional shifts

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Hover point | Mouse over data point | Tooltip with beat + emotion details |
| Click point | Click data point | Detail Panel opens with beat detail, emotional valence field highlighted |
| Select characters | Multi-select dropdown | Character lines show/hide |
| Add annotation | Right-click data point → "Add Note" | Text input appears → annotation dot added |
| Zoom | Scroll wheel or range slider | X-axis zooms to beat range |
| Export | Click export icon | Downloads chart as PNG/SVG |

---

### 18. Faction / Power Map

**Route:** `/worlds/:id/factions`

**Layout:** Main Canvas shows a network/Venn diagram of factions and power relationships. Detail Panel on right.

**Components:**

| Component | Details |
|-----------|---------|
| Faction nodes | Large colored regions (ellipses or irregular shapes) representing each faction. Labeled with faction name. Can overlap for shared members. |
| Character dots | Small dots inside faction regions representing characters belonging to that faction. Labeled on hover. |
| Power flow arrows | Directed arrows between factions showing power dynamics. Arrow thickness = influence strength. Label on hover = relationship description (e.g., "controls", "rivals", "alliance"). |
| Time slider | Same pattern as Character Map — scrub to see faction relationships evolve over story time |
| "Add Faction" button | Toolbar button |
| Faction list sidebar | Optional collapsible list of all factions with member counts |
| Hierarchy toggle | Switch between "Network" (flat) and "Hierarchy" (tree) layout |

**Data Displayed:**
- All factions with members
- Inter-faction power relationships
- Evolution of factions over story time

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Click faction region | Click | Detail Panel shows faction detail: name, description, members, goals, resources |
| Click character dot | Click | Detail Panel shows Character Detail |
| Hover power arrow | Hover | Tooltip: relationship type, description |
| Click power arrow | Click | Detail Panel shows relationship detail with edit fields |
| Add faction | Click "Add Faction" | New region appears; name field focused |
| Add character to faction | Drag character dot into a faction region, or edit in faction detail | Character-faction association created |
| Draw power arrow | Shift+Drag from one faction to another | Relationship creation modal |
| Slide time slider | Drag | Factions animate: regions grow/shrink, arrows change, characters move between factions |
| Toggle hierarchy view | Click toggle | Layout switches between network and tree |
| Edit faction | Double-click faction region | Detail Panel with editable faction form |

---

### 19. Foreshadowing Web

**Route:** `/worlds/:id/foreshadowing`

**Layout:** Main Canvas shows a graph connecting foreshadowing elements (setups) to their payoffs. Detail Panel on right.

**Components:**

| Component | Details |
|-----------|---------|
| Setup nodes | Card-style nodes for each foreshadowing setup: labeled with name, the beat where it appears, visual indicator (open circle if unresolved, filled circle if paid off) |
| Payoff nodes | Card-style nodes for each payoff: labeled with name, the beat where it resolves |
| Connection arcs | Curved lines from setup to payoff. Color: green if resolved, orange if setup exists without payoff (dangling thread), grey for dismissed/intentional dead ends. |
| Dangling threads panel | Sidebar or top banner highlighting unresolved setups: "3 unresolved foreshadowing threads" with list |
| "Add Setup" button | Toolbar button |
| Beat reference | Each node shows which beat it belongs to; click to navigate |
| Story progression axis | Optional: horizontal layout where X-axis is story order, showing temporal distance between setup and payoff |

**Data Displayed:**
- All foreshadowing setups and their payoffs
- Resolution status (resolved, dangling, dismissed)
- Story-order positioning

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Add setup | Click "Add Setup" | New setup node with form: name, description, associated beat (dropdown), associated entity |
| Add payoff | Click "Add Payoff" on a setup node | Payoff node created and linked; form: description, resolving beat |
| Connect setup to payoff | Drag from setup node to payoff node | Connection arc created |
| Click node | Single click | Detail Panel shows node detail with editing |
| Click dangling thread | Click item in dangling threads panel | Canvas pans to that setup node; Detail Panel opens |
| Mark as intentional | Right-click dangling setup → "Intentional Dead End" | Arc color changes to grey; removed from dangling warnings |
| Navigate to beat | Click beat reference on a node | Navigates to Writing Surface at that beat |
| Toggle layout | Switch between "Web" (force-directed) and "Timeline" (horizontal progression) | Layout re-renders |

---

### 20. Causality Graph

**Route:** `/worlds/:id/causality`

**Layout:** Main Canvas shows a directed acyclic graph (DAG) of cause-and-effect chains. Detail Panel on right.

**Components:**

| Component | Details |
|-----------|---------|
| Event nodes | Rectangles representing events/beats. Labeled with event title. Color-coded by act. |
| Causal edges | Directed arrows from cause to effect. Label on hover: description of causal link. |
| Critical path highlight | Toggle to highlight the main causal chain (longest path through the graph) — emphasized with thicker, colored edges |
| Orphan events | Events with no incoming or outgoing causal links are visually distinct (dashed border) and listed in a "Disconnected Events" panel |
| Root causes | Events with no incoming edges highlighted as "Inciting Causes" |
| Terminal effects | Events with no outgoing edges highlighted as "Final Outcomes" |
| Depth layers | Graph laid out in layers by causal depth (root causes on left, terminal effects on right) |
| "Add Causal Link" mode | Toggle button: when active, click two nodes sequentially to create a causal link |

**Data Displayed:**
- All events as nodes in a causal DAG
- Causal relationships as directed edges
- Critical path identification
- Disconnected events

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Click node | Single click | Detail Panel shows event/beat detail |
| Click edge | Click arrow | Detail Panel shows causal link: description, confidence, edit fields |
| Add causal link | Toggle "Add Link" mode → click source → click target | Arrow created from source to target; description modal appears |
| Remove link | Select edge → Delete key | Link removed with undo toast |
| Highlight critical path | Toggle "Critical Path" | Main causal chain emphasized |
| Click orphan event | Click in "Disconnected Events" panel | Canvas pans to node; prompt to add causal links |
| Zoom / Pan | Scroll wheel, click+drag | Standard graph navigation |
| Auto-layout | Click auto-layout button | Nodes rearrange into clean layered DAG |
| Double-click node | Double-click | Navigates to Writing Surface at that event |

---

### 21. Audience Knowledge Map

**Route:** `/worlds/:id/audience-knowledge`

**Layout:** Main Canvas shows a matrix or graph tracking what the audience knows at each point in the story.

**Components:**

| Component | Details |
|-----------|---------|
| Knowledge matrix | X-axis: beats/scenes in order. Y-axis: secrets/facts/information pieces. Cells: green (audience knows), grey (audience doesn't know), yellow (audience suspects / partially revealed). |
| Dramatic irony indicators | Special icon on cells where a character doesn't know something the audience does (or vice versa) |
| Secret list | Left column listing all tracked secrets/facts. "Add Secret" button at bottom. |
| Reveal markers | X-axis markers showing where each secret is revealed |
| Character knowledge toggle | Toggle to show character-specific knowledge (what does Character X know at Beat Y?) in addition to audience knowledge |
| Tooltip | Hover any cell: secret description, status, relevant beat, dramatic irony notes |

**Data Displayed:**
- All secrets/facts tracked in the story
- Per-beat knowledge state for audience and optionally per character
- Dramatic irony situations

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Add secret | Click "Add Secret" | New row in matrix; form: secret name, description, initial state (hidden/known) |
| Set cell state | Click cell to cycle: grey → yellow → green → grey | Knowledge state updates |
| Hover cell | Mouse over | Tooltip with details |
| Click cell | Click | Detail Panel: edit knowledge state, add notes, mark dramatic irony |
| Toggle character knowledge | Click toggle + select character | Matrix adds rows for character-specific knowledge |
| Navigate to beat | Click beat label (X-axis) | Navigates to Writing Surface at that beat |
| Click reveal marker | Click | Detail Panel shows the reveal event details |

---

### 22. Wiki / Encyclopedia

**Route:** `/worlds/:id/wiki`

**Layout:** Main Canvas split: left sidebar with article list/tree, right area with article content. Similar to a wiki layout.

**Components:**

| Component | Details |
|-----------|---------|
| Article tree | Left panel (280px): hierarchical list of all wiki articles. Grouped by category: Characters, Locations, Items, Lore, Events, Custom. Collapsible groups. Search bar at top. |
| Article view | Right panel: rendered wiki article with rich text. Auto-generated from entity data + user-written content. |
| Article editor | Toggle "Edit" to switch article view to rich-text editor mode |
| Cross-links | Inline links to other wiki articles (highlighted text, click to navigate within wiki) |
| "Auto-Generate" button | Generates or regenerates the article from entity data using AI |
| Infobox | Right-aligned card within article showing structured entity data (like Wikipedia infoboxes): key stats, image, category, related articles |
| Table of contents | Auto-generated from article headings; sticky in article margin |
| Recent changes | Tab in left panel: chronological list of recently edited articles |
| "Create Article" button | Top of left panel |

**Data Displayed:**
- All world entities as wiki articles
- Article content: auto-generated + user-written
- Cross-links between articles
- Structured infobox data per entity

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Browse articles | Click items in article tree | Article loads in view panel |
| Search articles | Type in search bar | Tree filters to matching articles |
| Edit article | Click "Edit" toggle | Article switches to editor mode |
| Save article | Click "Save" or `Cmd+S` | Article saves; exits edit mode |
| Auto-generate article | Click "Auto-Generate" | AI generates article from entity data; confirmation if overwriting existing content |
| Click cross-link | Click inline link | Navigates to linked article (browser-back returns to previous) |
| Create article | Click "Create Article" | New article form: title, category, content editor |
| Delete article | `...` menu → "Delete" | Confirmation → article removed |
| View recent changes | Click "Recent Changes" tab | Chronological list of edits with diff links |

---

### 23. Magic / Tech System Designer

**Route:** `/worlds/:id/systems`

**Layout:** Main Canvas shows a structured form/canvas hybrid for designing rule systems.

**Components:**

| Component | Details |
|-----------|---------|
| System list | Left panel: list of all defined systems (e.g., "Magic System", "FTL Technology", "Political System"). "Add System" button. |
| System editor | Main area: structured form for the selected system. Sections: **Name**, **Overview** (rich text), **Rules** (numbered list of laws/principles — each is a text block), **Costs & Limitations** (structured entries: cost name, description, severity), **Practitioners** (linked characters), **Artifacts** (linked items), **Hierarchy / Tiers** (optional ranked list of power levels), **Exceptions & Edge Cases** (list), **Visual/Sensory Description** (rich text: what does it look, sound, feel like?) |
| Consistency check | Button to run rules against story text — flags scenes where the system's rules are violated |
| Rule dependency graph | Mini visualization showing which rules depend on or contradict each other |
| Cross-reference panel | Shows all scenes where this system is used/referenced |

**Data Displayed:**
- All defined world systems with full structured detail
- Rule sets per system
- Cross-references to characters, items, scenes

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Select system | Click in system list | System editor loads that system |
| Create system | Click "Add System" | New empty system form appears |
| Edit any field | Click and type | Auto-saved |
| Add rule | Click "Add Rule" in Rules section | New numbered rule entry appears |
| Reorder rules | Drag rule entries | Rules reorder |
| Link character | Click "Add Practitioner" | Entity search → select character |
| Link item | Click "Add Artifact" | Entity search → select item |
| Run consistency check | Click "Check Consistency" | Analysis runs → results appear in Detail Panel as a list of violations (similar to Consistency Dashboard) |
| Delete system | `...` menu → "Delete" | Confirmation → system removed |
| View cross-references | Click "See References" | List of all beats/scenes referencing this system |

---

### 24. World Settings

**Route:** `/worlds/:id/settings`

**Layout:** Main Canvas shows a tabbed settings form.

**Components:**

| Tab | Fields |
|-----|--------|
| **General** | World title, author name, genre (dropdown + custom), status (dropdown: Draft, In Progress, Complete, Archived), cover image upload, description/blurb |
| **Calendar & Time** | Calendar type (Gregorian, custom). If custom: define months, days per month, days per week, year zero, epoch name. Time format. |
| **Structure** | Default beat sheet template (Save the Cat, Three-Act, Hero's Journey, Five-Act, Custom). Custom template editor: define named phases/acts, expected beat types per act. |
| **Rules & Physics** | World rules text area (free-form): "In this world, magic exists", "Faster-than-light travel is possible." These rules inform AI suggestions and consistency checking. |
| **Metadata** | Custom key-value metadata fields for the world. "Add Field" button. |
| **Collaboration** | Share settings: invite collaborators by email, set permissions (viewer, editor, admin). Sharing link toggle. |
| **Danger Zone** | Delete world (red button, requires typing world name to confirm). Export full world data (JSON backup). |

**Data Displayed:**
- All world configuration fields with current values

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Edit any field | Click and type | Auto-saved with "Settings saved" toast |
| Upload cover image | Click image zone → file picker | Image uploaded, cropped, saved as world cover |
| Change calendar type | Select "Custom" → fill in fields | Custom calendar used throughout Timeline View and date fields |
| Change structure template | Select template | Confirmation dialog ("Remap beats to new structure?") → beats redistribute |
| Add metadata field | Click "Add Field" | New key-value row |
| Invite collaborator | Enter email + role → "Invite" | Invitation sent; collaborator appears in list |
| Remove collaborator | Click `x` next to collaborator | Confirmation → access revoked |
| Delete world | Click delete → type world name → confirm | Redirected to Dashboard; world deleted |
| Export world data | Click "Export JSON" | Downloads JSON file with all world data |

---

### 25. Export Panel

**Route:** `/worlds/:id/export`

**Layout:** Main Canvas shows export configuration form and preview.

**Components:**

| Component | Details |
|-----------|---------|
| Content selector | Checkboxes: what to include in export. Options: Manuscript (full text), Treatment, Beat Sheet, Character Profiles, Location Profiles, World Bible (all entities), Synopsis, Custom selection. |
| Format selector | Radio buttons: PDF, DOCX, Fountain (.fountain for screenplays), Plain Text, JSON (data export), Markdown, ePub |
| Template selector | For PDF/DOCX: formatting template. Options: Standard Manuscript (Courier 12pt, 1-inch margins), Modern (custom fonts), Screenplay (industry standard), Custom. |
| Formatting options | Page size (US Letter, A4), font, font size, line spacing, margins, header/footer content |
| Title page toggle | Include/exclude title page. Fields: title, author, contact info, WGA registration number |
| Preview pane | Right side: live preview of the first page of the export (rendered as it will appear in the output format) |
| "Export" button | Large primary button at bottom |
| Export history | Collapsible section showing previous exports with download links |

**Data Displayed:**
- Export configuration options
- Live preview of output
- Previous export history

**User Actions:**

| Action | Trigger | Result |
|--------|---------|--------|
| Select content | Check/uncheck content options | Preview updates to reflect included content |
| Select format | Click format radio button | Preview updates; some formatting options become available/unavailable based on format |
| Select template | Click template option | Preview reformats |
| Adjust formatting | Change font, size, spacing, margins | Preview updates live |
| Toggle title page | Check/uncheck | Preview shows/hides title page |
| Export | Click "Export" | Loading state → file generated → browser download initiated → toast: "Export complete" |
| Download previous export | Click download link in export history | File downloads |
| Delete previous export | Click `x` on export history item | Export file removed from history |

---

## Core User Flows

---

### Flow 1: New World from Scratch

**Goal:** User creates a new story world and begins outlining.

| Step | Screen | Action | Result |
|------|--------|--------|--------|
| 1 | Landing / Dashboard (`/dashboard`) | Click "Create New World" | Create World modal opens |
| 2 | Modal overlay | Fill in: Title, Genre (dropdown + custom), Brief description (optional), Structure template (Save the Cat default). Click "Create". | World created. Navigates to `/worlds/:id/beats`. |
| 3 | World Workspace Shell | Workspace loads with empty Beat Sheet. Story Sidebar auto-opens for new worlds. | User sees: empty beat sheet with template structure columns (e.g., "Opening Image", "Theme Stated", "Setup"...) + Story Sidebar with empty synopsis. |
| 4 | Story Sidebar | Write synopsis in the Synopsis field. Edit logline. Add genre/tone tags. | Synopsis auto-saves. Stats panel shows 0 words. |
| 5 | Beat Sheet (`/worlds/:id/beats`) | Click AI Wand sparkle icon on the first empty beat slot ("Opening Image") | Loading shimmer → AI generates a beat suggestion based on synopsis + genre + structure position. Suggestion card appears with dashed border. |
| 6 | Beat Sheet | Review suggestion. Click "Accept" to keep, "Regenerate" for a new suggestion, or "Dismiss" to write manually. | Accepted: card becomes a solid beat card. Regenerated: new suggestion loads. Dismissed: empty slot returns. |
| 7 | Beat Sheet | Click "Add Beat" or click subsequent AI Wand sparkles to continue building out beats. Edit beat titles and summaries inline. | Beat cards populate the board. |
| 8 | Beat Sheet | Click "Write" on a beat card | Navigates to Writing Surface (`/worlds/:id/write?beat=:beatId`) |
| 9 | Writing Surface | Begin writing prose or screenplay. Use `Cmd+Shift+S` to switch modes. | Text auto-saves. Entity highlighting begins detecting character names as they're used. |
| 10 | Writing Surface | Press `Cmd+Enter` at end of a paragraph | AI Wand suggests continuation text (ghost text). Tab to accept, Esc to dismiss. |

---

### Flow 2: Ingest Existing Work

**Goal:** User uploads an existing manuscript and populates a world from extracted entities.

| Step | Screen | Action | Result |
|------|--------|--------|--------|
| 1 | Landing / Dashboard | Click "Create New World" | Create World modal opens |
| 2 | Modal overlay | Fill in Title, Genre. Click "Create". | Navigates to `/worlds/:id/beats` |
| 3 | Sidebar Nav | Click "Source Materials" in sidebar | Navigates to `/worlds/:id/sources` |
| 4 | Source Material Manager | Drag-and-drop a .docx or .fountain file onto the upload zone | File uploads with progress bar. File appears in list with "Pending" badge. |
| 5 | Source Material Manager | Click "Ingest" on the uploaded file row | Navigates to `/worlds/:id/sources/:sourceId/ingest` |
| 6 | Ingestion Progress | Watch progress bar advance through phases: Parse → Extract Entities → Map Relationships → Identify Events → Build Timeline | Live extraction preview shows entities being discovered in real time |
| 7 | Ingestion Progress | Ingestion completes | Automatic transition to Entity Review at `/worlds/:id/sources/:sourceId/review` |
| 8 | Entity Review | First extracted entity card appears (e.g., a character: "SARAH CHEN — Protagonist, mid-30s detective"). Review the card. | Card shows: name, type, extracted description, source quote, confidence score |
| 9 | Entity Review | Press Right arrow (Confirm) to accept the character | Character added to world. Next card slides in. |
| 10 | Entity Review | A location card appears that matches an existing location. Press Up arrow (Merge). | Merge modal opens showing extracted entity vs. existing entity side by side. |
| 11 | Entity Review (Merge Modal) | Select which fields to keep from each source. Click "Merge". | Entities combined. Next card appears. |
| 12 | Entity Review | An entity card appears that's a false positive (e.g., "THE DOOR" detected as a character). Press Left arrow (Dismiss). | Entity discarded. Next card appears. |
| 13 | Entity Review | Continue reviewing all entities. After last card: | Success screen: "47 entities processed: 38 confirmed, 5 merged, 4 dismissed" |
| 14 | Entity Review (Success) | Click "Explore World" | Navigates to Character Map (`/worlds/:id/characters`). Graph shows all extracted characters with their detected relationships. |

---

### Flow 3: Daily Writing Session

**Goal:** Returning user opens their world and writes, using entity highlighting for context.

| Step | Screen | Action | Result |
|------|--------|--------|--------|
| 1 | Landing / Dashboard | Click world card | Navigates to `/worlds/:id/beats` |
| 2 | Beat Sheet | Scan beat board for the next beat to write (look for "Drafted" status vs. "Empty") | Beat cards show status indicators |
| 3 | Beat Sheet | Click on the target beat card | Detail Panel opens with beat details: title, summary, characters, locations |
| 4 | Beat Sheet | Click "Write" in the Detail Panel | Navigates to Writing Surface (`/worlds/:id/write?beat=:beatId`). Editor scrolls to that beat's section. |
| 5 | Writing Surface | Begin writing. Story Sidebar opens (`Cmd+\`) to reference synopsis and quick-jump list. | Session timer starts in Story Sidebar. Word count increments live. |
| 6 | Writing Surface | Type a character name (e.g., "Sarah"). After a 300ms pause, the name is recognized and highlighted with a blue underline. | Entity highlighting activates. "Sarah" is underlined in blue. |
| 7 | Writing Surface | Click on highlighted "Sarah" | Detail Panel opens on right with Sarah's Character Detail: bio, relationships, recent scenes, emotional trajectory |
| 8 | Writing Surface | Review Detail Panel to see Sarah's relationships and arc. Close panel (`Esc` or `Cmd+Shift+\`) and continue writing. | Panel closes. Writing continues. |
| 9 | Writing Surface | Mention a location: "the abandoned warehouse". It highlights in green. | Location entity recognized and highlighted. |
| 10 | Writing Surface | Click on "the abandoned warehouse" | Detail Panel shows location details: description, scenes set here, characters associated. |
| 11 | Writing Surface | Finish writing session. Check Story Sidebar. | Session stats: "1,247 words written this session (42 minutes)" |

---

### Flow 4: Story Analysis

**Goal:** User analyzes their story structure and character arcs.

| Step | Screen | Action | Result |
|------|--------|--------|--------|
| 1 | World Workspace | Click "Character Map" in sidebar nav | Navigates to `/worlds/:id/characters` |
| 2 | Character Map | View the relationship graph. Character nodes sized by scene count; edges colored by relationship type. | Graph displays all characters and relationships |
| 3 | Character Map | Drag the time slider from beginning to end of story | Graph animates: relationships form, strengthen, break over story time. Edges fade in/out. |
| 4 | Character Map | Click on protagonist node | Detail Panel shows: Character Detail with all scenes, arc summary, emotional trajectory sparkline, relationships list |
| 5 | Character Map | In Detail Panel, scroll to "Scene Appearances" — see chronological list of all scenes featuring this character | Each scene entry shows: beat title, emotional valence, co-characters |
| 6 | Sidebar Nav | Click "Arc Diagram" | Navigates to `/worlds/:id/arcs` |
| 7 | Arc Diagram | Select protagonist in character selector | Protagonist's emotional arc line appears on the chart |
| 8 | Arc Diagram | Select "Save the Cat" from template overlay dropdown | Dashed reference line appears showing expected emotional trajectory per Save the Cat |
| 9 | Arc Diagram | View where the protagonist's actual arc deviates from the template. Deviation indicator (warning icon) appears near the midpoint. | Warning icon visible at the Midpoint beat |
| 10 | Arc Diagram | Click deviation indicator | Detail Panel shows: "Expected: emotional low at Midpoint (-3). Actual: neutral (0). Consider adding a setback or crisis at this beat." |
| 11 | Arc Diagram | Click the data point at Midpoint | Detail Panel shows the Midpoint beat's full detail with link to edit in Writing Surface |

---

### Flow 5: Revision Impact

**Goal:** User edits a character's backstory and understands the cascade of affected scenes.

| Step | Screen | Action | Result |
|------|--------|--------|--------|
| 1 | Any screen | Open Character Detail (via Character Map click, entity highlight click, or Omnibar search) | Detail Panel shows character information |
| 2 | Character Detail Panel | Edit the character's Bio field — change their backstory (e.g., change "grew up in New York" to "grew up in London") | Auto-saved. Background process: Impact Analysis begins. |
| 3 | Any screen | Notification bell shows a badge. After 2–5 seconds, a toast notification slides in: "Impact Analysis complete: 12 scenes may be affected by changes to Sarah Chen." | Toast has "View Details" link. |
| 4 | Toast / Notification | Click "View Details" in the toast (or click notification bell → notification) | Navigates to Consistency Dashboard (`/worlds/:id/consistency`) with the impact analysis results pre-filtered. |
| 5 | Consistency Dashboard | View the list of affected scenes. Each row has a colored indicator: **Red** (direct contradiction — scene references "New York childhood"), **Yellow** (indirect impact — scene references a detail that may be tied to original backstory), **Green** (minor — scene mentions the character but change is likely irrelevant). | 3 red, 5 yellow, 4 green items |
| 6 | Consistency Dashboard | Click a red item: "Scene 'Homecoming' references Sarah's 'Queens apartment where she grew up'" | Detail Panel shows: the conflicting passage, the original backstory text, the new backstory text, and an AI suggestion for how to fix the scene |
| 7 | Consistency Dashboard | Click "Fix in Source" | Navigates to Writing Surface at the "Homecoming" scene. Detail Panel shows both the conflicting reference and the new backstory for reference while editing. |
| 8 | Writing Surface | Edit the scene to replace "Queens apartment where she grew up" with "London flat where she grew up" | Text saved. Consistency issue auto-resolves (detected on next consistency check). |
| 9 | Consistency Dashboard (return) | Click back to Consistency Dashboard. The fixed item now shows as "Resolved". Continue reviewing remaining items. | Work through yellow items (edit or dismiss), green items (dismiss or note). |

---

### Flow 6: Consistency Check

**Goal:** User reviews and resolves contradictions flagged by the system.

| Step | Screen | Action | Result |
|------|--------|--------|--------|
| 1 | World Workspace | Click "Consistency Dashboard" in sidebar nav (notification badge shows "3") | Navigates to `/worlds/:id/consistency` |
| 2 | Consistency Dashboard | Summary bar shows: "3 critical, 7 warnings, 2 minor — Last checked: 2 hours ago". Sorted by severity (critical first). | Contradiction list displayed |
| 3 | Consistency Dashboard | Click first critical item: "Character age contradiction: Sarah is 34 in Scene 5 but 31 in Scene 12 (set 1 year later)" | Detail Panel opens with full contradiction detail |
| 4 | Detail Panel | View Reference A (Scene 5 passage: "At thirty-four, Sarah...") and Reference B (Scene 12 passage: "She'd just turned thirty-one"). Both source passages are quoted with beat names and line numbers. | Both conflicting references visible side by side |
| 5 | Detail Panel | Review AI fix suggestion: "Change Scene 12 to 'thirty-five' to maintain consistency with Scene 5 and the one-year time gap." | Suggestion shown below references |
| 6 | Detail Panel | Click "Fix in Source" | Navigates to Writing Surface at Scene 12's passage. Detail Panel shows both references and the suggestion for context. |
| 7 | Writing Surface | Change "thirty-one" to "thirty-five" | Text saved. |
| 8 | Navigate back to Consistency Dashboard | Contradiction now marked as "Resolved" | List updates |
| 9 | Consistency Dashboard | Click a warning item: "Weapon continuity: Character picks up a sword in Scene 3 but is described as unarmed in Scene 4 with no disarm event." | Detail Panel shows references |
| 10 | Detail Panel | Click "Mark as Intentional" and add note: "Sword was left behind during the escape — will clarify in revision" | Status changes to "Resolved (Intentional)". Note saved. Item dims in list. |
| 11 | Consistency Dashboard | Click a minor item: "Location description variation: 'red brick building' vs. 'brown stone building' for the same location" | Detail Panel shows references |
| 12 | Detail Panel | Click "Dismiss" (user decides these are different buildings) | Item removed from active list |

---

### Flow 7: What-If Exploration

**Goal:** User explores an alternate story path and compares it with the canonical version.

| Step | Screen | Action | Result |
|------|--------|--------|--------|
| 1 | Sidebar Nav | Click "What-If Explorer" | Navigates to `/worlds/:id/what-if` |
| 2 | What-If Explorer | Branch list is empty (or shows existing branches). Click "New Branch". | Branch creation modal opens with a timeline view of all events |
| 3 | Branch creation modal | Click on the "Midpoint" event in the timeline as the fork point. Name the branch: "What if Sarah doesn't survive the midpoint?" Click "Create Branch". | Branch created. Navigates to `/worlds/:id/what-if/:branchId`. Colored banner appears: "Branch: What if Sarah doesn't survive — Return to Canon". |
| 4 | Branch workspace | Full workspace available. Navigate to Beat Sheet. | Beat Sheet shows all beats up to and including the fork point. Beats after the fork point are copies from canon that can now be freely modified. |
| 5 | Branch workspace | Edit the Midpoint beat: change outcome so Sarah doesn't survive. Edit subsequent beats to reflect this change. | Edits are branch-local. Canon is unaffected. |
| 6 | Branch workspace | Write new scenes in Writing Surface reflecting the alternate path. | Branch diverges further from canon. |
| 7 | Branch banner | Click "Compare to Canon" | Comparison view opens: split-screen. Left = canon, right = branch. |
| 8 | Comparison view | Click "Beat Comparison" tab | Side-by-side beat list. Identical beats are grey. Modified beats are highlighted yellow. Branch-only beats highlighted green. Canon-only beats highlighted red. |
| 9 | Comparison view | Click "Text Diff" tab | Side-by-side text view with inline diff highlighting (green additions, red deletions) |
| 10a (merge path) | Branch banner | Click "Merge into Canon" | Merge panel shows all branch changes with checkboxes |
| 10b (merge path) | Merge panel | Select specific changes to merge (e.g., keep some new scenes but not the character death). Click "Merge Selected". | Confirmation dialog → selected changes merged into canon → branch marked as "Merged" |
| 10c (discard path) | Branch list | Right-click branch → "Delete" | Confirmation: "Archive this branch? You can restore it later." → branch archived |

---

### Flow 8: Treatment Export

**Goal:** User generates a treatment document from their beat sheet and exports it.

| Step | Screen | Action | Result |
|------|--------|--------|--------|
| 1 | Sidebar Nav | Click "Treatment" in sidebar | Navigates to `/worlds/:id/treatment` |
| 2 | Treatment View | Auto-generated treatment appears: title block (world title, author, genre, logline) + act-structured paragraphs from beat sheet. | Treatment document renders in a clean, print-ready layout |
| 3 | Treatment View | Review the auto-generated text. Click into paragraphs to edit — refine wording, add transitions between beats, flesh out descriptions. | Edits are treatment-local (don't modify beat data). Auto-saved. |
| 4 | Treatment View | Drag paragraph handles to reorder sections if the treatment flow differs from beat order. | Paragraphs reorder smoothly |
| 5 | Treatment View | Click "Export" button | Navigates to Export Panel (`/worlds/:id/export`) with Treatment pre-selected in content selector |
| 6 | Export Panel | Select format: PDF. Select template: "Standard Manuscript". Toggle title page on. Fill in contact info. | Live preview updates to show formatted title page + treatment text |
| 7 | Export Panel | Adjust formatting: US Letter, Courier 12pt, double-spaced. | Preview updates |
| 8 | Export Panel | Click "Export" | Loading spinner → file generates → browser download starts → toast: "Treatment exported as PDF" |
