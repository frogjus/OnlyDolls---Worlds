# StoryForge UX Design Plan

> Comprehensive UX strategy to take StoryForge from 4.5/10 prototype to an intuitive, polished creative tool.
> Synthesized from competitive analysis (7 products), UX principles research (100+ sources), and a detailed Othelia teardown.

---

## Executive Summary

StoryForge has 25+ views, a beat sheet kanban, writing surface, character graph, timeline, treatment view, and more. The functionality is there; the experience is not. This plan addresses the core problem: **how do you make a 25-view creative platform feel simple enough for a solo novelist, yet powerful enough for a TV writers room?**

### The Five Strategic Imperatives

1. **Task-based workspaces, not flat navigation.** Group 25+ views into 5 workspaces (Write, Build World, Analyze, Plan, Ingest). Users switch entire interface configurations, not individual panels. This is the single highest-impact IA decision.

2. **Command palette (Cmd+K) is non-negotiable.** With 25+ views, sidebar alone cannot scale. The command palette becomes the power user's primary interface and the universal escape hatch from any navigation confusion.

3. **Progressive disclosure with max 2 levels.** Show the simplest version first, reveal complexity on demand. Never nest beyond 2 disclosure levels. If you need 3+, the design itself needs simplifying.

4. **Bidirectional sync between views is the killer feature.** Beat Sheet <> Writing Surface <> Treatment must stay in sync. This is what users praise most about Arc Studio Pro and Othelia.

5. **Ship a Demo Story World.** Pre-populated with characters, beats, timeline events, and relationships. Eliminates blank-canvas anxiety and is the highest-impact onboarding pattern for complex tools.

### Competitive Context

- **Othelia** (direct competitor): Has zero independent user reviews after 5+ months of beta. Closed, enterprise-first. Their "non-generative AI" claim is contradicted by their own help docs. The market is wide open.
- **Linear** teaches us: speed is identity. Target sub-100ms for all interactions.
- **Figma** teaches us: context-sensitive right inspector panel avoids page navigation.
- **Notion** teaches us: slash commands and templates as creative accelerators.
- **Arc Studio Pro** teaches us: bidirectional Script <> Board <> Outline sync is the most-praised pattern.
- **Scrivener** teaches us: writers need a binder/tree for structural navigation, and compilation/export flexibility.
- **Plottr** teaches us: templates solve the blank page problem (30+ structure templates).

---

## 1. Navigation Redesign

### Current Problem
The current horizontal tab bar with 25+ tabs creates a scrollable navigation nightmare. Users cannot find views, cannot remember what exists, and the flat hierarchy implies all views are equally important.

### Solution: Inverted-L Layout with Task-Based Workspaces

```
+---------------------------------------------------------------------+
| Top Bar: World Name | Workspace Switcher | Cmd+K Search | AI Status |
+------------+--------------------------------------------+-----------+
|            |                                            |           |
| Left       |                                            | Right     |
| Sidebar    |         Main Canvas / Editor               | Inspector |
| (nav)      |         (context-dependent)                | Panel     |
|            |                                            |           |
| - Search   |                                            | Selection |
| - Core     |                                            | context:  |
|   views    |                                            | - Props   |
| - Section  |                                            | - Meta    |
|   groups   |                                            | - Links   |
| - Content  |                                            | - Notes   |
|   tree     |                                            |           |
+------------+--------------------------------------------+-----------+
| Bottom Panel (optional, collapsible): Timeline | Treatment | AI Out  |
+---------------------------------------------------------------------+
```

### Left Sidebar (250-300px, collapsible to 64px icon rail)

```
[World Switcher]              <- dropdown to switch story worlds
[Search]                      <- Cmd+K trigger with hint text
---
Core Views (always visible):
  Beats Board
  Writing Surface
  Characters
  Timeline
  Treatment
---
World (collapsible):
  Locations
  Factions
  Wiki
  Systems
  Settings
---
Analysis (collapsible):
  Arcs
  Pacing
  Foreshadowing
  Causality
  Knowledge Map
  Consistency
---
Tools (collapsible):
  Sources / Ingestion
  What-If Scenarios
  Canon Management
  Export
---
[Content Tree]                <- expandable entity hierarchy
```

### Workspace Presets

Each workspace reconfigures the sidebar to highlight relevant views and adjusts the default panel layout:

| Workspace | Primary Views | Right Panel | Bottom Panel |
|---|---|---|---|
| **Write** | Beats, Writing Surface, Treatment | Beat/scene properties | Treatment preview |
| **Build World** | Characters, Locations, Wiki, Factions, Systems | Entity properties | Relationship list |
| **Analyze** | Timeline, Arcs, Pacing, Causality, Foreshadowing, Consistency | Event/arc properties | Timeline scrubber |
| **Plan** | What-If, Canon, Knowledge Tracker | Scenario comparison | Impact preview |
| **Ingest** | Sources, Source Viewer | Extraction preview | Processing queue |

Users can customize workspaces. Switching is one click or `Cmd+Shift+1-5`.

### Command Palette (Cmd+K)

Built on shadcn/ui `<Command>` component (cmdk). Capabilities:

- **Navigation:** "Go to timeline," "Open character map," "Show beat sheet"
- **Entity search:** "Find character Hamlet," "Show location Paris"
- **Actions:** "Create new beat," "Add character," "New scene"
- **Context-aware:** In character view -> "Edit relationships," "View scenes with this character"
- **AI Wand:** "Suggest beat description," "Expand synopsis"
- **Query prefixes:** `>` commands, `@` entities, `#` tags, `/` views
- **Recent items** shown on open before any search
- **Keyboard shortcut hints** displayed next to each result

### Keyboard Navigation

| Shortcut | Action |
|---|---|
| `Cmd+K` | Command palette |
| `Cmd+\` | Toggle sidebar |
| `Cmd+1` through `Cmd+5` | Jump to core views |
| `Cmd+Shift+1-5` | Switch workspace |
| `Cmd+[` / `Cmd+]` | Navigate back / forward |
| `Cmd+Shift+F` | Global search |
| `G B` | Go to Beats |
| `G W` | Go to Writing Surface |
| `G C` | Go to Characters |
| `G T` | Go to Timeline |
| `G R` | Go to Treatment |
| `F6` / `Shift+F6` | Cycle focus between panels |

### Breadcrumbs

Every view shows contextual breadcrumbs at the top of the main canvas:

```
Story World > Characters > John Smith > Relationships
```

- All segments are clickable links except the last
- Each segment has a dropdown for sibling navigation
- Truncate at 5+ levels with expandable "..."
- Root and current location always visible

---

## 2. Onboarding Flow

### Design Principles
- Three-step tours have 72% completion; tours with 5+ features see 67% abandonment
- Interactive onboarding achieves 50% higher activation than static tutorials
- Users completing onboarding are 80% more likely to become long-term users
- Core value must be experienced within 5-15 minutes

### Step 0: Signup Survey (2-3 questions)

```
Welcome to StoryForge!

1. How will you use StoryForge?
   [ ] Solo author    [ ] Small team (2-5)    [ ] Just exploring

2. What are you working on?
   [ ] Novel / Short story    [ ] Screenplay    [ ] TV Series
   [ ] Worldbuilding          [ ] Game narrative  [ ] Other

3. Have you used story planning tools before?
   [ ] Yes, several    [ ] One or two    [ ] This is my first
```

Responses determine: default workspace, visible views, template suggestions, tooltip verbosity.

### Step 1: Choose Your Path

```
+-------------------------------------------+
|  How would you like to start?             |
|                                           |
|  [Explore the Demo World]                 |
|  See StoryForge in action with a          |
|  pre-built story world                    |
|                                           |
|  [Create Your World]                      |
|  Start fresh with your own story          |
|                                           |
|  [Import Existing Work]                   |
|  Bring in a manuscript, screenplay,       |
|  or outline                               |
+-------------------------------------------+
```

### Step 2: Interactive Quickstart (for "Create Your World")

Three-step guided flow. Each step produces real output. Progress bar pre-filled at 25% ("Account created" already checked).

```
Step 1/3: Name Your World                    [====------] 40%
+-------------------------------------------+
|  What's your story called?                |
|  [____________________________]           |
|                                           |
|  Give it a one-line synopsis:             |
|  [____________________________]           |
|                                           |
|  Pick a structure (optional):             |
|  [Hero's Journey] [Save the Cat]          |
|  [Story Circle]   [3-Act]  [Skip]         |
|                                           |
|                          [Continue ->]    |
+-------------------------------------------+

Step 2/3: Add Your First Character           [=======---] 65%
+-------------------------------------------+
|  Who's your protagonist?                  |
|  Name: [____________________________]     |
|  Role: [Protagonist v]                    |
|  One-line description:                    |
|  [____________________________]           |
|                                           |
|                          [Continue ->]    |
+-------------------------------------------+

Step 3/3: Create Your First Beat             [==========] 95%
+-------------------------------------------+
|  What's the opening of your story?        |
|  Title: [____________________________]    |
|  Description:                             |
|  [____________________________]           |
|  [____________________________]           |
|                                           |
|  Assign character: [Protagonist v]        |
|                                           |
|                     [Start Building ->]   |
+-------------------------------------------+
```

### Step 3: Guided First Session

After quickstart, user lands in the **Write** workspace (Beats view) with:
- Their first beat card visible on the board
- A collapsible sidebar checklist (non-blocking):
  - [x] Create your world
  - [x] Add a character
  - [x] Create your first beat
  - [ ] Write your synopsis (unlocks AI Wand)
  - [ ] Add 3 more beats
- **One** contextual tooltip: "Drag beat cards to reorder your story. Changes auto-update your treatment."
- Story Sidebar open with synopsis field highlighted

### Demo Story World

Ship a pre-built story world (e.g., a fairy tale or public domain story like "The Odyssey" simplified) containing:
- 5-8 characters with relationships mapped
- 15-20 beats organized in a 3-act structure
- A filled synopsis and treatment
- Timeline events
- 2-3 source material entries
- Populated wiki entries

Purpose: users explore real data before creating their own. Every empty state includes a "See an example" link pointing to the corresponding Demo World view.

### Return User Experience

| User State | What They See |
|---|---|
| First-time | Signup survey -> quickstart flow |
| Returning (2-14 days) | Dashboard with recent world, resume where left off |
| Dormant (14+ days) | "Welcome back" banner, what's changed, one-click resume |

---

## 3. Core Workflow

### The Primary User Journey

```
Create World -> Write Synopsis -> Outline Beats -> Write Scenes -> Review & Analyze
     |                |                |                |               |
     v                v                v                v               v
  Name, genre,    Synopsis gates    Kanban board    TipTap editor    Timeline,
  structure       AI features       with cards      linked to        arcs, pacing,
  template                          drag-to-order   beat cards       consistency
                                         |                |
                                         v                v
                                    Treatment auto-generates
                                    and stays in sync
```

### Bidirectional Sync (The Killer Pattern)

The core trio must stay perfectly in sync:

```
Beat Sheet  <---->  Writing Surface  <---->  Treatment
    |                     |                      |
    | drag-reorder        | write content         | auto-generate
    | edit card           | link to beats          | reflect order
    | assign characters   | entity highlight       | export
    v                     v                        v
  Treatment updates    Beat cards update        Beat sheet reflects
  Writing Surface      Treatment reflects       Writing Surface
  reflects order       content changes          reflects
```

**What this means in practice:**
- Drag a beat card to a new position -> Treatment reorders -> Writing Surface sections reorder
- Write a scene in the editor -> Beat card description can reflect changes
- Click a beat card -> Writing Surface scrolls to that section
- Click a section in Writing Surface -> Beat card highlights on board

### Secondary Workflows

| Workflow | Trigger | Views Involved |
|---|---|---|
| **Character development** | "I need to flesh out my characters" | Characters (graph + profiles), Wiki, Writing Surface |
| **Structure analysis** | "Does my story work?" | Arcs, Pacing, Foreshadowing, Consistency |
| **World building** | "I need to build the world" | Locations, Factions, Systems, Wiki, Timeline |
| **Research & ingestion** | "I have source material to bring in" | Sources, Source Viewer, AI extraction |
| **What-if exploration** | "What if I changed X?" | What-If, Canon, Impact Analysis |
| **Export & share** | "I need to share this" | Treatment, Export, Canon |

---

## 4. View Hierarchy

### Tier 1: Primary Views (always visible, core workflow)

These 5 views are the spine of StoryForge. New users should only see these initially.

| View | Purpose | Workspace |
|---|---|---|
| **Beat Sheet** | Story structure as draggable cards | Write |
| **Writing Surface** | Manuscript/script editor | Write |
| **Treatment** | Auto-generated outline from beats | Write |
| **Characters** | Character profiles and relationship graph | Build World |
| **Timeline** | Chronological event visualization | Analyze |

### Tier 2: Secondary Views (visible after engagement threshold)

Unlock after user has 5+ beats and 3+ characters. Frame as rewards: "You've built enough story to unlock the Arc Diagram!"

| View | Purpose | Unlock Trigger | Workspace |
|---|---|---|---|
| **Arcs** | Story arc visualization with structure overlay | 5+ beats | Analyze |
| **Locations** | Place management | 1+ location created | Build World |
| **Wiki** | Auto-linking encyclopedia | 5+ entities total | Build World |
| **Sources** | Source material management | First upload | Ingest |
| **Canon** | Version control for story state | 10+ beats | Plan |

### Tier 3: Advanced Views (opt-in, for power users)

Available in sidebar under collapsed sections. Never shown unprompted to new users.

| View | Purpose | Workspace |
|---|---|---|
| **Pacing** | Pacing/rhythm heatmap analysis | Analyze |
| **Foreshadowing** | Setup/payoff tracking graph | Analyze |
| **Causality** | Causal chain visualization | Analyze |
| **Knowledge Map** | Audience vs character knowledge | Analyze |
| **Consistency** | Contradiction checker | Analyze |
| **What-If** | Scenario forking and comparison | Plan |
| **Factions** | Power dynamics visualization | Build World |
| **Systems** | Magic/tech system designer | Build World |
| **Emotional Arcs** | Per-character emotional trajectory | Analyze |
| **Mind Map** | Freeform spatial layout | Build World |

### Progressive View Unlocking

```
Account created:     Beats, Writing Surface, Treatment, Characters, Timeline
5+ beats:            + Arcs, Wiki
3+ characters:       + Character Graph (relationship view)
First upload:        + Sources, Source Viewer
10+ beats:           + Canon, Pacing
Synopsis filled:     + AI Wand features across all views
Manual opt-in:       + All Tier 3 views (always accessible via sidebar/Cmd+K)
```

Users can always access any view via the command palette or sidebar settings ("Show all views"). Progressive unlocking is the default, not a wall.

---

## 5. Component Design Principles

### Beat Cards

```
+-----------------------------------------------+
| [Color tag]  [Drag handle]          [Star: ***] |
|                                                 |
| Beat Title                          [AI Wand]  |
|                                                 |
| Description text goes here,                     |
| truncated after 2 lines...                      |
|                                                 |
| [Character A] [Character B]                     |
| [tag1] [tag2]                                   |
|                                                 |
| [Structure beat: "Catalyst"]                    |
+-----------------------------------------------+
```

**Three density modes (Adobe model):**
- **Minimal:** Title + color + star rating only. Maximum cards visible.
- **Standard:** Title + description (2-line truncate) + characters + tags. Default.
- **Detailed:** All fields visible including notes preview, structure mapping, word count.

**Interactions:**
- Single click: Select card, open right inspector panel with full details
- Double click: Open expanded card overlay with all fields editable + Script tab
- Drag handle: Initiate drag-and-drop reorder
- Star click: Set rating inline
- AI Wand click: Trigger AI suggestion (requires synopsis)

### Right Inspector Panel (Figma Model)

Context-sensitive. Changes based on what is selected:

| Selection | Inspector Shows |
|---|---|
| Beat card | Title, description, characters, tags, notes, star rating, structure mapping, linked scenes |
| Character node | Name, role, traits, relationships, scenes appeared in, voice profile |
| Timeline event | Date, description, characters involved, causal links, fabula/sjuzhet position |
| No selection | World overview stats, recent activity, quick actions |

Sections are collapsible. Panel is resizable (280-500px) and fully closable.

### Empty States

Every view gets a purposeful empty state following this template:

```
+-----------------------------------------------+
|                                                 |
|        [Contextual illustration]                |
|                                                 |
|     Build Your Beat Sheet                       |
|                                                 |
|     Organize your story's structure with        |
|     draggable beat cards. Drag to reorder,      |
|     and your treatment updates automatically.   |
|                                                 |
|     [Create Your First Beat]                    |
|                                                 |
|     or  See an example ->                       |
|         (opens Demo World's beat sheet)         |
|                                                 |
+-----------------------------------------------+
```

Empty state checklist for every view:
- [ ] Beats Board
- [ ] Writing Surface
- [ ] Treatment
- [ ] Characters (graph + list)
- [ ] Timeline
- [ ] Arcs
- [ ] Locations
- [ ] Wiki
- [ ] Sources
- [ ] Pacing
- [ ] Foreshadowing
- [ ] Causality
- [ ] Knowledge Map
- [ ] Consistency
- [ ] What-If
- [ ] Factions
- [ ] Systems
- [ ] Mind Map
- [ ] Canon
- [ ] Emotional Arcs

### Toolbars

**Contextual toolbars** appear above the main canvas, changing per view:

- **Beat Sheet:** View density toggle | Sort | Filter | Group by | + New Beat
- **Writing Surface:** Format toolbar (bold, italic, heading, etc.) | Mode (prose/screenplay) | Word count | Focus mode
- **Characters:** View switch (Graph | List | Grid) | Filter | + New Character
- **Timeline:** Zoom | Lane selector | Date range | Fabula/Sjuzhet toggle

### Modals vs Panels Decision Matrix

| Action | Pattern | Why |
|---|---|---|
| Edit beat card details | Right inspector panel | Preserves board context |
| Delete a character | Confirmation modal | Destructive, needs explicit consent |
| Create new world | Multi-step modal wizard | Complex creation with required fields |
| View character profile | Right inspector or slide-over panel | Context preservation |
| AI Wand suggestion review | Floating overlay or inline panel | Must not interrupt writing flow |
| Export settings | Modal | Infrequent, complex options |
| Quick rename | Inline edit | Fastest path for simple change |

---

## 6. Interaction Patterns

### Drag-and-Drop (Full Lifecycle)

Every drag operation follows this sequence with distinct visual feedback:

| State | Visual | Duration |
|---|---|---|
| **Idle** | Drag handle visible (6-dot grip icon), cursor default | - |
| **Hover** | Handle highlighted, cursor `grab` | - |
| **Grabbed** | Card elevates (box-shadow increase), cursor `grabbing`, slight scale (1.02) | - |
| **In motion** | Ghost card at 80% opacity follows cursor, placeholder line shows target position, other cards animate apart (~100ms) | - |
| **Over drop zone** | Target zone highlights with blue border, receiving column/section pulses subtly | - |
| **Dropped** | Card snaps to final position (200ms ease-out), brief green flash, toast: "Beat moved to Act 2" | 200ms |
| **Cancelled** | Card returns to origin (200ms ease-out) | 200ms |

**Keyboard alternative:** Space to grab, arrow keys to move position, Space to drop. Menu option: "Move to..." with act/section destinations.

### Animation Timing Standards

| Animation | Duration | Easing |
|---|---|---|
| Hover states | 200ms | ease-out |
| Card transitions | 200-300ms | ease-out |
| Modal enter | 250-300ms | ease-out |
| Modal exit | 200-250ms | ease-in |
| Panel slide | 200ms | ease-out |
| Toast enter | 200ms | ease-out + slide up |
| Drag reorder | 100ms | ease-out |
| **Hard ceiling** | 400ms | Never exceed |

**Global rule:** Respect `prefers-reduced-motion`. When active, all animations become instant (0ms) or minimal (opacity fade only). Provide in-app toggle in Settings.

### Loading States

- **Skeleton screens** for all data-fetching views (30-50% perceived speed improvement over spinners)
- **Shimmer effect** (left-to-right wave) preferred over pulse (opacity fade)
- Use skeletons for: cards, lists, grids, panels, graphs
- Do NOT use skeletons for: buttons, small form fields, icons

### Toast Notifications (via Sonner + shadcn/ui)

| Type | Duration | Content Pattern |
|---|---|---|
| Success | 3-4s | "Beat moved to Act 2. **Undo**" |
| Info | 4-6s | "Treatment updated with new beat order" |
| Warning | Persistent | "3 consistency issues detected" |
| Error | Persistent | "Failed to save. Retrying... **Retry now**" |

Always include: specific action description (not generic "Success!"), undo for reversible actions, retry for failures.

### Hover States

All interactive elements need three states:
- **Default:** Base appearance
- **Hover:** Subtle background change (e.g., bg-muted), 200ms transition
- **Active/Pressed:** Slightly darker, brief scale (0.98)
- **Focus:** Visible focus ring (2px solid, offset 2px) for keyboard navigation

### Keyboard Shortcuts Display

Show shortcuts contextually:
- In command palette results: `Cmd+1` next to "Go to Beats"
- In tooltips: hover over sidebar item shows shortcut
- In menus: right-aligned shortcut text
- Discoverable: `Cmd+/` opens keyboard shortcut cheat sheet overlay

---

## 7. Information Architecture

### Data Model -> UI Mapping

| Data Entity | Primary View | Secondary Views | Inspector Panel |
|---|---|---|---|
| StoryWorld | Dashboard / World Switcher | All views | World settings |
| Beat | Beat Sheet (card) | Writing Surface (section marker) | Full beat properties |
| Character | Characters (node or list item) | Beat cards (assignment), Timeline (lane), Writing Surface (highlight) | Character profile |
| Scene | Writing Surface (section) | Beat Sheet (linked card) | Scene properties |
| Event | Timeline (marker) | Causality (node), Foreshadowing (node) | Event details |
| Location | Locations (list/map) | Timeline (lane), Wiki (entry) | Location properties |
| Relationship | Characters (edge) | Wiki (entry) | Relationship details |
| SourceMaterial | Sources (list) | Source Viewer (content) | Extraction results |
| Arc | Arcs (curve) | Beat Sheet (structure overlay) | Arc properties |

### Search Architecture

Three layers of search:

1. **Command Palette (Cmd+K):** Fuzzy search across views, entities, and commands. Ranked by frecency. Context-aware.
2. **Global Search (Cmd+Shift+F):** Full-text search across all text content in the story world. Returns results grouped by entity type with highlighted excerpts.
3. **View-level filtering:** Per-view filters (star rating, tags, characters, structure beats). Combinable. Persistent within session. Reset button always visible.

### Slash Commands (in Writing Surface)

The TipTap editor supports Notion-style slash commands:

| Command | Action |
|---|---|
| `/beat` | Insert beat marker / link to beat card |
| `/character` | Insert character mention (auto-linking) |
| `/location` | Insert location mention |
| `/scene` | Insert scene break |
| `/note` | Insert margin note |
| `/ai` | Trigger AI Wand suggestion |
| `/heading` | Insert heading (H1-H4) |
| `/divider` | Insert horizontal rule |

### Entity Cross-Referencing

Every entity mention across the platform is a link. Clicking opens the inspector panel with that entity's details. Implemented via:
- Auto-detection in Writing Surface (entity highlighting)
- @ mentions in notes and descriptions
- Auto-linking in Wiki entries
- Relationship edges in graph views

---

## 8. Specific Redesign Proposals

### 8.1 Beat Sheet (Kanban Board)

**Current state:** Functional kanban but lacks polish, feedback, and progressive complexity.

**Redesign:**

**Layout:** Kanban columns represent structural sections (Act 1, Act 2A, Act 2B, Act 3 for screenplay; Episode 1, Episode 2, etc. for TV). Column headers show beat count and optional structure template markers.

**Card design:** Three density modes (minimal/standard/detailed). Default to standard. Color coding via left border stripe (not full background). Star rating inline. AI Wand icon appears on hover only (reduces visual noise).

**Structure overlay:** When a structure template is active (e.g., Save the Cat), show expected beat positions as ghost cards in the appropriate columns. "Catalyst should go here" with dotted border. User drags real beats to match or ignores.

**Mini-map (bottom-left):** Miniature overview of entire board showing viewport rectangle. Click to jump. Toggleable via keyboard shortcut.

**Filtering toolbar:**
```
[Star: Any v] [Character: Any v] [Tag: Any v] [Structure Beat: Any v] [Search: ____] [Reset]
```

**New interactions:**
- Multi-select beats (Shift+click) for batch operations (move, tag, delete)
- Quick-add at bottom of each column (just title, expand for more)
- Collapse/expand columns
- Keyboard: arrow keys between cards, Enter to open inspector, Space to quick-edit title

### 8.2 Writing Surface (TipTap Editor)

**Current state:** Basic TipTap editor without story-specific features.

**Redesign:**

**Two modes:**
- **Prose mode:** Rich text with chapters, scenes, headings, formatting. Word count targets per chapter/scene.
- **Screenplay mode:** Auto-formatting for sluglines (INT./EXT.), action, dialogue, parentheticals, transitions. Tab to cycle between element types (Final Draft pattern).

**Story Sidebar (persistent left panel within Write workspace):**
```
+---------------------------+
| Synopsis                  |
| [__________________]      |
| [__________________]      |
|                           |
| Logline                   |
| [__________________]      |
|                           |
| Structure: Save the Cat   |
| Progress: 12/15 beats     |
| [==========----] 80%     |
|                           |
| Word Count                |
| Today: 1,247 / 2,000     |
| Total: 45,890 / 80,000   |
| [=========-----] 57%     |
|                           |
| Characters (5)            |
| > John Smith (protagonist)|
| > Mary Jones (antagonist) |
| > ...                     |
|                           |
| Consistency Alerts (2)    |
| ! Timeline conflict       |
| ! Character age mismatch  |
+---------------------------+
```

**Beat markers:** Visual markers in the manuscript showing where each beat card maps. Click marker to open beat card in inspector. Markers show beat title and color.

**Focus mode:** Cmd+Shift+Enter. Hides sidebar, inspector, toolbar. Just the text. Subtle gradient fade at edges. ESC to exit.

**Entity highlighting:** Recognized character names, locations, and objects highlighted with subtle underline. Click to open inspector panel. Toggle on/off.

**Split view:** Cmd+| to split editor. Left: manuscript. Right: source material, treatment, or beat details. Draggable divider.

### 8.3 Characters View

**Current state:** Basic character list or relationship graph.

**Redesign with view switcher:**

**Three sub-views (segmented control: Graph | List | Grid):**

- **Graph view:** Force-directed relationship graph (React Flow). Nodes sized by importance/word count. Edges colored and typed (ally, rival, family, romantic, etc.). Time slider to animate relationship evolution. Click node to open inspector with character details.

- **List view:** Sortable table with columns: Name, Role, Scenes, Relationships, Last Modified. Click row to open inspector.

- **Grid view:** Visual card grid with character portraits (or avatar placeholders), name, role, key trait. Good for visual overview.

**Character Inspector Panel (right side):**
```
Tabs: Overview | Backstory | Relationships | Voice | Scenes

Overview:
  Name, aliases, role, physical description,
  psychological profile, 100+ configurable attributes
  (show top 10, expand for all)

Relationships:
  List of connections with type, strength, evolution notes
  "Add relationship" button

Voice:
  Dialogue analysis (when available):
  - Avg sentence length, vocabulary level
  - Speech patterns, verbal tics
  - Formality score

Scenes:
  List of scenes featuring this character
  Click to jump to Writing Surface
```

### 8.4 Timeline View

**Current state:** Basic timeline visualization.

**Redesign:**

**Dual timeline (opt-in for advanced users):**
- **Default:** Single sjuzhet (narrative order) timeline
- **Advanced toggle:** Show fabula (chronological) above, sjuzhet below, with connecting lines showing reordering (flashbacks, flash-forwards)

**Multi-lane layout:**
- One lane per character, arc, or location (user's choice via lane selector)
- Color-coded by character or arc
- Zoom levels: Series > Season > Episode > Scene > Beat

**Event markers:** Circles on lanes with size indicating importance. Hover to preview. Click to open inspector. Drag to reorder (sjuzhet only; fabula is chronological truth).

**Custom calendar support:** For fantasy/sci-fi worlds with non-standard time systems. Set up in World Settings.

### 8.5 Treatment View

**Current state:** Auto-generated outline from beats.

**Redesign:**

**Live-updating document** assembled from beat cards in current order:

```
TREATMENT: [World Name]
Generated from 15 beats | Last updated: 2 minutes ago

ACT 1
------
1. THE OPENING IMAGE
   Description from beat card...
   Characters: John Smith, Mary Jones

2. THE CATALYST
   Description from beat card...
   Characters: John Smith

[... continues for all beats ...]
```

**Features:**
- **Editable overrides:** Click any section to edit treatment text directly. Override persists until the underlying beat changes, then shows a diff: "Beat updated. Keep your edit or use new text?"
- **Diff view:** Toggle to see what changed since last treatment snapshot
- **Multi-format export:** PDF, DOCX, plain text, Fountain
- **Print-friendly:** Cmd+P produces clean, formatted output
- **Version history:** See previous treatment versions

### 8.6 AI Wand Pattern

**Prerequisite system (adopted from Othelia):**
1. Synopsis must be filled in Story Sidebar before any wand activates
2. Without synopsis: wand icon is grayed out with tooltip "Fill in your synopsis to enable AI suggestions"
3. More existing content = better suggestions

**Wand placement:**
- Beat card: Next to title and description fields (on hover only to reduce noise)
- Writing Surface: Floating toolbar option and slash command `/ai`
- Synopsis: "Expand" option to grow a logline into full synopsis

**Interaction flow:**
```
Click wand -> Check prerequisites -> Show "Generating..." skeleton
-> Present suggestion in review panel:

+-----------------------------------------------+
| AI Suggestion                        [x close] |
|                                                 |
| "The protagonist discovers the hidden letter    |
| in the attic, revealing a family secret that    |
| challenges everything they believed..."         |
|                                                 |
| Context used: Synopsis + surrounding beats      |
|                                                 |
| [Accept]  [Edit & Accept]  [Regenerate]  [Dismiss] |
+-----------------------------------------------+
```

**Transparency (our differentiator vs Othelia):**
- Clear "AI Suggestion" badge on all generated content
- "Context used" shows what the AI drew from
- Never auto-commits; user must explicitly accept
- Accepted text marked with subtle AI indicator (removable)
- Honest language: "AI Draft" / "AI Suggestion" — never implies the AI is the author

---

## 9. Accessibility

### Priority Checklist (WCAG 2.1 AA)

**Critical (Sprint 1):**
- All interactions keyboard-operable (2.1.1)
- No keyboard traps in TipTap editor — Ctrl+M toggles Tab behavior (2.1.2)
- 4.5:1 text contrast, 3:1 for large text and UI components (1.4.3, 1.4.11)
- Visible focus rings on all interactive elements (2.4.7)
- Semantic HTML structure (1.3.1)
- ARIA labels for all custom widgets (4.1.2)

**High Priority (Sprint 2-3):**
- Keyboard alternatives for all drag-and-drop (2.5.7)
- Never rely on color alone — use text/icons/patterns too (1.4.1)
- Remappable keyboard shortcuts (2.1.4)
- F6 region cycling between panels (custom, following VS Code)
- Skip links: "Skip to beat sheet," "Skip to editor"

### Component-Specific Accessibility

| Component | Requirements |
|---|---|
| Beat Sheet (Kanban) | `role="listbox"` per column, Space grab/drop, ARIA live announces moves, "Move to..." menu alternative |
| Writing Surface (TipTap) | `role="textbox"`, Tab trap toggle (Ctrl+M), Alt+F10 for toolbar focus |
| Character Graph (React Flow) | `nodesFocusable={true}`, `edgesFocusable={true}`, custom ARIA labels, hidden data table for screen readers |
| Timeline (D3) | Arrow key navigation, `<title>`/`<desc>` in SVG, alternative data table, `role="img"` |
| Star Rating | `role="radiogroup"` with `role="radio"` per star, arrow keys, `aria-label="Rating: 3 of 5"` |
| Command Palette | Already accessible via cmdk/shadcn — ARIA combobox, arrow key navigation, live region for result count |

### Themes

Ship with three themes:
- **Light** (default for new users)
- **Dark** (writers work in low light — this will be popular)
- **High Contrast** (accessibility, meets AAA contrast ratios)

Separate color scales per theme using CSS custom properties / design tokens. Never rely on CSS `invert()`.

---

## 10. Implementation Roadmap

### Sprint 1 Foundation (Highest Impact)

| Item | Impact | Effort |
|---|---|---|
| Left sidebar with collapsible sections | Replaces broken 25-tab nav | Medium |
| Command palette (Cmd+K) via shadcn/ui Command | Unlocks navigation for power users | Medium |
| Beat card redesign (3 density modes) | Core product quality signal | Medium |
| Right inspector panel (context-sensitive) | Eliminates page-navigation for details | Medium |
| Empty states for Tier 1 views (5 views) | Onboarding improvement | Small |
| Skeleton loading states | 30-50% perceived speed boost | Small |
| Keyboard shortcuts (core set) | Power user productivity | Small |
| Dark mode | Writer satisfaction, accessibility | Small |

### Sprint 2 Onboarding & Polish

| Item | Impact | Effort |
|---|---|---|
| Demo Story World | Highest-impact onboarding pattern | Large |
| Signup survey + guided quickstart | First-time activation | Medium |
| Full drag-and-drop lifecycle with feedback | Core interaction quality | Medium |
| Toast notifications with undo (Sonner) | Reversible action confidence | Small |
| Contextual tooltips (first-encounter only) | Gentle guidance | Small |
| Story Sidebar redesign | Writing workflow quality | Medium |
| Breadcrumbs on all views | Orientation | Small |
| Animation timing standardization (200ms ease-out) | Perceived polish | Small |

### Sprint 3 Advanced UX

| Item | Impact | Effort |
|---|---|---|
| Workspace presets (Write/Build/Analyze/Plan/Ingest) | Full IA solution for 25+ views | Large |
| Progressive view unlocking | Reduces overwhelm for new users | Medium |
| Writing Surface redesign (prose + screenplay modes) | Core product expansion | Large |
| AI Wand interaction pattern with review panel | Differentiator feature | Medium |
| Slash commands in editor | Writing efficiency | Medium |
| Split view support | Context preservation | Medium |
| Accessibility audit (WCAG 2.1 AA) | Compliance + differentiation | Medium |

### Sprint 4 Differentiation

| Item | Impact | Effort |
|---|---|---|
| Structure template overlay on beat sheet | Theory engine differentiator | Large |
| Entity highlighting and auto-linking | Intelligence layer | Large |
| Character view redesign (graph/list/grid) | Visual richness | Medium |
| Timeline redesign (dual mode, multi-lane) | Analysis power | Large |
| Treatment redesign (editable overrides, export) | Professional output | Medium |
| Focus/distraction-free writing mode | Writer satisfaction | Small |
| Keyboard shortcut cheat sheet overlay | Discoverability | Small |

---

## Appendix A: Design Tokens

```css
/* Timing */
--transition-instant: 0ms;        /* reduced-motion fallback */
--transition-micro: 100ms;        /* checkbox, toggle */
--transition-fast: 200ms;         /* hover, press */
--transition-standard: 300ms;     /* cards, panels */
--transition-slow: 400ms;         /* modals (hard ceiling) */

/* Easing */
--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);   /* entrances */
--ease-in: cubic-bezier(0.4, 0.0, 1, 1);       /* exits */
--ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1); /* continuous */

/* Spacing (sidebar) */
--sidebar-width-collapsed: 64px;
--sidebar-width-default: 260px;
--sidebar-width-max: 400px;

/* Spacing (inspector) */
--inspector-width-min: 280px;
--inspector-width-default: 340px;
--inspector-width-max: 500px;

/* Z-index layers */
--z-sidebar: 40;
--z-inspector: 30;
--z-modal: 50;
--z-toast: 60;
--z-command-palette: 70;
--z-tooltip: 80;
```

## Appendix B: Competitive Quick Reference

| Product | Key Pattern to Steal | Why |
|---|---|---|
| **Linear** | Cmd+K command palette, 0ms optimistic updates, keyboard-first | Speed is identity |
| **Figma** | Context-sensitive right inspector, multiplayer presence | Panels over pages |
| **Notion** | Slash commands, templates, hierarchical sidebar | Simple-yet-powerful |
| **Arc Studio Pro** | Bidirectional Script <> Board <> Outline sync, Stash | Writing tool UX |
| **Scrivener** | Binder tree, corkboard, compilation flexibility | Writer mental model |
| **Plottr** | Grid model (plotlines x chapters), 30+ templates | Visual story planning |
| **Othelia** | Synopsis-gated AI, beat card field set, mini-map, auto-treatment | Direct competitor baseline |

## Appendix C: Othelia Gap Analysis

| Area | Othelia | StoryForge Advantage |
|---|---|---|
| Pricing | Unknown, likely enterprise | Free + affordable tiers + self-hosted |
| Community | Zero presence | Open source, community-first |
| AI Transparency | Hidden behind "non-generative" marketing | Honest labeling, context shown |
| Narrative Theory | None | Multi-framework overlays (Dramatica, Propp, Barthes, etc.) |
| Prose Support | Appears screenplay-only | Full prose mode + screenplay mode |
| Accessibility | No public commitment | WCAG 2.1 AA from Sprint 1 |
| Reviews | Zero independent reviews | Public demo, real user community |
| Visualizations | Basic beat board + timeline | 10+ visualization types |
| Data Sovereignty | Cloud-only, closed | Self-hostable, local-first option |
