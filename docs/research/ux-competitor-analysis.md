# StoryForge UX Competitor Analysis Report

> **Date:** 2026-03-29
> **Scope:** 7 products researched -- Othelia Storykeeper, Notion, Figma, Linear, Arc Studio Pro, Scrivener, Plottr
> **Purpose:** Inform StoryForge's UX design decisions with battle-tested patterns from best-in-class tools

---

## Executive Summary

After deep research into 7 products across creative tools, productivity platforms, and writing software, clear patterns emerge for how StoryForge should approach its UX. The findings cluster into **5 strategic imperatives**:

1. **Command palette + keyboard-first is non-negotiable.** Linear, Figma, Notion, and Arc Studio all use `Cmd+K` as the primary power-user interface. With 19+ views and 30+ features, StoryForge cannot rely on sidebar navigation alone. The command palette must be introduced during onboarding as THE way to use the product.

2. **Progressive disclosure is the only way to ship 30+ features without overwhelming users.** Every successful complex tool (Notion, Figma, Linear) hides advanced features behind intentional discovery patterns. StoryForge must start with Beat Sheet + Writing Surface + Story Sidebar, revealing timeline, character graph, and analysis tools as users engage deeper.

3. **Bidirectional sync between views is the killer pattern for story tools.** Arc Studio's Script <> Plot Board <> Outline sync is their most-praised feature. Plottr's Timeline <> Outline sync is theirs. Othelia's Beat <> Treatment <> Script auto-sync is theirs. StoryForge must nail this: changes in the beat sheet must instantly update the treatment and writing surface, and vice versa.

4. **Speed is identity, not a feature.** Linear proves that perceived performance IS the product. Local-first data with optimistic updates, 0ms interaction latency, and 60fps animations create an emotional connection that no feature list can match. StoryForge should target sub-100ms for all interactions.

5. **Templates solve the blank page problem.** Plottr, Notion, and Arc Studio all use templates as both onboarding AND creative accelerators. StoryForge should ship with pre-built story structure templates (Hero's Journey, Save the Cat, Story Circle, etc.) that simultaneously teach the tool and the craft.

### The Competitive Landscape at a Glance

| Product | Primary Strength | Primary Weakness | What StoryForge Steals |
|---------|-----------------|------------------|----------------------|
| **Othelia** | Synopsis-gated AI, auto-sync trio | Opaque, no public demos, limited frameworks | AI gating pattern, beat-treatment-script sync |
| **Notion** | Flexible blocks, multiple DB views | Performance at scale, learning curve | Slash commands, side peek, backlinks, templates |
| **Figma** | Multiplayer presence, collaboration | Large file performance, internet-only | Cursors, observation mode, contextual properties |
| **Linear** | Speed, keyboard-first, command palette | Limited customization, engineering-focused | Local-first sync, Cmd+K, G-prefix shortcuts, opinionated defaults |
| **Arc Studio** | Script-Board-Outline bidirectional sync | Native app quality, WYSIWYG gaps | Three-view architecture, Stash, Branch Copy, Beat Inbox |
| **Scrivener** | Binder + Corkboard + Research folder | Learning curve, no collaboration, Compile | Split editor, snapshots, composition mode, metadata tiers |
| **Plottr** | Visual timeline grid, template ecosystem | No writing surface, performance issues | Grid model (plotlines x chapters), 3-layer color coding, filter-fade |

---

## 1. Othelia Storykeeper

### Company Context
- Founded 2019 (Sydney), expanded to LA mid-2025
- $818K raised; ~15 person team
- Beta launched October 28, 2025
- Alpha-tested with "major studios and global streamers"
- Positioning: "See Story Differently" -- analysis-first AI for story architecture

### Navigation Structure
- **Top-center navigation bar** with named sections (Beats, and likely Script/Treatment/Characters)
- **Story Sidebar** (persistent left panel): Synopsis field (required, gates AI), world summary, quick stats
- **Minimap navigator** (bottom-left of Beat sheet): zoomed-out view of entire board with viewport highlight
- **Mode-adaptive structure**: Film mode = Acts, TV mode = Episodes

### Information Hierarchy
- Story World (top-level) > Structural Sections (Acts/Episodes) > Beat Cards > Script/Treatment
- Beat cards have tabbed expansion: Overview tab (title, description, characters, color, tags, notes, stars) + Script tab
- Auto-sync trio: reorder beats -> World + Treatment + Script update automatically

### Key UX Patterns

**Synopsis-Gated AI Generation:** AI wand features are disabled until the user fills in a synopsis. Error state shows "Synopsis x" in red under "Requires." Forces creative intent before AI assists.

**Auto-Sync Trio:** Drag-and-drop beat reordering automatically updates Story World, Treatment document, and Script simultaneously. Treatment is derived data, not independently authored.

**Beat Card Fields:** Title (wand), Description (wand), Characters, Color, Tags, Notes, Star ratings (1-5), Script tab (wand). Field-level AI wands are less threatening than global "generate everything" buttons.

**Filter System:** Filter by star rating, tags, and/or characters. "Reset Filter" button. Simple, combinable filters matching how writers think.

**Deletion Safeguard:** Explicit confirmation dialog before deleting a beat card.

### What Users Praise
- Handles complexity at scale (Nicholas Lathouris: "no human being can contain it")
- Tool, not replacement ("I'm still tasked with making the decisions")
- Consolidates "three screens, multiple open windows and programs"
- ~5 minutes to ingest a book and map characters/connections
- Strong data ownership messaging

### What Users Criticize
- "Non-generative" messaging is misleading (clearly has generative wand features)
- No public demos, screenshots, or video walkthroughs -- remarkably opaque
- Enterprise-first positioning may mean UX optimized for studios, not solo writers
- Limited story structure framework support (no Save the Cat, Hero's Journey, etc.)
- No pricing transparency

### Patterns StoryForge Should Adopt
1. **Synopsis-gated AI** -- replicate exactly. Synopsis in Story Sidebar gates all AI Wand features
2. **Auto-sync trio** -- beat reorder cascades to treatment and script
3. **Beat card tabbed expansion** -- Overview tab + Script tab with per-field wands
4. **Minimap navigator** -- collapsible minimap for beat sheet spatial orientation
5. **Mode-adaptive structure** -- extend to novel/chapters, game/levels
6. **Filter system** -- extend with structure beat position, arc, location filters

### Where StoryForge Surpasses
- **Story frameworks**: Othelia has no documented template support; we have multi-framework overlay
- **Visualizations**: Othelia has undefined "relationship maps"; we have 13+ specific types
- **Transparency**: Open source vs. closed beta opacity
- **Beat-to-script bidirectionality**: Make navigation work both directions

---

## 2. Notion

### Navigation Structure
- **Persistent left sidebar** (224px): Workspace switcher > Search/AI/Home/Inbox > Favorites > Teamspaces > Private
- **Infinite page nesting** with collapsible toggle arrows and progressive indentation
- **Breadcrumbs** at top of every page showing nested path (clickable segments)
- **Command palette** (`Cmd+P` / `Cmd+K`): Universal search across pages, actions, and block types
- **Back/forward arrows** with `Cmd+[`/`Cmd+]` keyboard shortcuts

### Information Hierarchy
- **Block-based architecture**: Everything is a draggable, convertible, nestable block
- **Pages as dual entities**: Simultaneously a document (with blocks) and a database row (with properties)
- **Database views**: Table, Board, List, Calendar, Gallery, Timeline, Dashboard -- all from one source
- **Relations + Rollups**: Relational database power without SQL
- **Linked databases**: Same database embedded on multiple pages with independent filters
- **Page opening modes**: Side peek, center peek, or full page

### Onboarding Flow
- Email/Google signup (< 60 seconds)
- Use-case segmentation with dynamic UI preview
- "Getting Started" page that teaches through functional Notion content (interactive checkboxes, toggle blocks)
- 5 curated templates based on signup answers (not the full 30K+ library)
- **Benefit-before-ask pattern**: Shows value before requesting action

### Key UX Patterns

**Slash Commands (`/`):** Type `/` anywhere to open contextual block menu. Filterable by typing (e.g., `/image`, `/table`). Makes the full feature set discoverable without cluttering UI.

**Progressive Disclosure:** Block options appear only on hover. Database filters collapsed by default. Details hidden behind click-to-expand. Six-dot handle is the universal "this is movable" signal.

**Drag-and-Drop Everything:** Blocks, rows, cards, pages -- all draggable with consistent hover -> grab -> move -> drop microstate flow.

**Contextual Settings Placement:** App settings in sidebar, page settings in upper-right, block settings inline. No "giant settings page" anti-pattern.

**Inline Editing:** Everything editable in place. No separate "edit mode."

**Backlinks:** Automatic cross-references when pages are mentioned elsewhere.

### What Users Praise
1. All-in-one consolidation (notes + tasks + wikis + databases)
2. "You can build anything" flexibility
3. Clean, minimalist design despite enormous feature depth
4. 30,000+ template library
5. Multiple views of same data
6. Relations and rollups
7. Free tier generosity

### What Users Criticize
1. **Performance at scale** (#1 complaint) -- large workspaces with many databases become sluggish
2. **Steep learning curve** -- weeks to months to learn fully; "defeats the purpose of a productivity app"
3. **Blank page problem** -- unlimited possibilities = unlimited confusion
4. **Mobile app** -- functionality gap, slow startup, clumsy interactions
5. **Offline support** -- requires internet connectivity
6. **Deep hierarchy navigation** -- page names truncated, breadcrumb ellipsis confuses users
7. **AI pricing changes** -- bundled into Business tier, frustrating Plus users

### Patterns StoryForge Should Adopt
1. **Slash commands** in writing surface: `/character` to link, `/beat` to create, `/location` to tag
2. **Command palette (`Cmd+K`)** for global navigation across all entity types
3. **Sidebar with collapsible hierarchy** -- limit visual depth to 3-4 levels, use color-coding
4. **Multiple views of same data** -- beats as kanban, table, timeline, list
5. **Side peek for entity details** -- character/beat details slide open keeping context visible
6. **Progressive disclosure** at tier/entity/view/AI levels
7. **Templates for story structures** -- pre-populated beat cards for Hero's Journey, Save the Cat, etc.
8. **Drag-and-drop as core interaction** with treatment auto-update
9. **Backlinks and auto-linking** -- mention "Darcy" in a beat, auto-link to character page
10. **Inline editing everywhere** -- click any value to edit in place

### Anti-Patterns to Avoid
- Performance degradation at scale -- use virtualized rendering, lazy loading
- Deep sidebar indentation -- cap at 3-4 levels
- Blank page anxiety -- always provide structure
- Non-persistent panel state -- remember UI preferences
- Mobile as afterthought

---

## 3. Figma

### Navigation Structure
- **Five-level hierarchy**: Organization > Teams > Projects > Files > Pages
- **Three-zone editor**: Left sidebar (Layers/Assets), Right sidebar (contextual Properties), Bottom toolbar
- **Canvas**: Infinite 2D workspace with pan (spacebar+drag) and zoom (scroll, `Shift+1` fit, `Shift+2` selection)
- **View modes**: Design, Prototype, Dev Mode (`Shift+D`), Presentation, Inline Preview
- **No native minimap** -- navigation relies on zoom shortcuts and Layers panel

### Information Hierarchy
- **Contextual Properties Panel** (right sidebar): Content changes based on selection -- nothing selected shows file-level info, element selected shows element properties, component instance shows variants
- **Layers panel**: Hierarchical tree with expand/collapse, visibility/lock toggles
- **Slash-naming convention** for components: `Button/Primary/Large` creates nested hierarchy
- **Progressive disclosure**: Clean beginner surface, advanced features revealed on demand

### Onboarding Flow
- Welcome modal emphasizing competitive differentiation
- Animated tooltips combining text + visual demonstration
- Progressive feature introduction: Import first (reduces switching anxiety) > core tools > collaboration
- Templates as training wheels
- Early collaboration prompt (inviting team is part of initial onboarding)

### Key UX Patterns

**Multiplayer Cursors & Presence:** Color-coded cursors with name labels. Real-time position and selection visibility. Avatar bar showing active users. `/` attaches text chat to cursor. Cursors convey intention without explicit communication.

**Observation Mode & Spotlight:** Click avatar to mirror their view. Spotlight mode auto-pulls all viewers to presenter's viewport. Eliminates "next slide please" problem.

**Command Palette (`Cmd+/` or `Cmd+P`):** Fuzzy search across all commands. Shows keyboard shortcuts alongside (educational). Universal access point replacing menu hierarchies.

**Comments & Annotations:** Pin comments to canvas elements. @mentions, threaded replies, resolution marking. Comment sidebar for scanning all feedback.

**Branching & Version Control:** Git-like branches for safe experimentation. Review requests before merging. Limitation: coarse-grained conflict resolution (entire elements, not properties).

### What Users Praise
1. Collaboration (#1) -- "Google Docs for design"
2. Zero-friction browser access
3. Intuitive interface with logically organized tools
4. Design systems with components + variants
5. Dev Mode for developer handoff
6. Plugin ecosystem (1,500+ plugins, 50% of engagement)

### What Users Criticize
1. Performance with large files
2. Internet dependency
3. **UI3 floating panels backlash** (Figma reversed the decision -- key lesson)
4. Auto Layout learning curve
5. Per-seat pricing at scale
6. Coarse-grained branch merge (no property-level merge)

### Patterns StoryForge Should Adopt
1. **Multiplayer presence** -- color-coded cursors in beat sheet, writing surface, and visualizations
2. **Observation mode** -- click collaborator avatar to follow their view (writers room walkthroughs)
3. **Spotlight mode** -- presenter guides all viewers through beat sheet review
4. **Contextual properties panel** -- right sidebar content changes based on what's selected
5. **Comments system** -- pin comments to beat cards, script sections, character profiles
6. **Branching for story versioning** -- with property-level merge (exceeding Figma)
7. **View mode toggle** -- Author Mode, Review Mode, Analysis Mode, Presentation Mode
8. **Notification architecture** -- multi-channel, smart batching, role-aware

### Critical Lesson: Don't Float Your Panels
Figma spent two years on floating panels, then reverted after user backlash. **Dock panels to edges for primary editing.** Design for laptop screens (the constraint), not large monitors.

---

## 4. Linear

### Navigation Structure
- **Persistent left sidebar** with deliberate visual restraint -- dimmed, smaller icons, condensed views
- **Command palette (`Cmd+K`)**: Defining UX pattern. Fuzzy search across everything. Contextual positioning near trigger element. Supports chained actions.
- **99 keyboard shortcuts** in systematic patterns:
  - **G-prefix navigation**: `G B` = Beats, `G T` = Timeline, `G C` = Characters
  - **O-prefix quick open**: `O P` = Open project, `O C` = Open cycle
  - **Single-key actions**: `C` = Create, `S` = Status, `P` = Priority, `A` = Assign
- **Contextual menus** with safe-area triangles and inline keyboard shortcuts

### Information Hierarchy
- Simple, clear hierarchy: Workspace > Initiatives > Projects > Milestones > Issues > Sub-issues
- **Issues at the center** -- everything else organizes, filters, or contextualizes them
- **Views system**: Dynamic, filter-based perspectives that auto-update. Personal, team, or workspace-wide.
- **Triage**: Structured intake queue for review before acceptance
- **Inbox**: Personal notification center with keyboard-driven management

### Onboarding Flow
1. Google OAuth > workspace creation
2. **Theme selection** (immediate personalization signal)
3. **Command palette introduction** (before any content creation -- foundational, not optional)
4. Optional GitHub integration + teammate invites (skip-friendly)
5. **Task-driven checklist** -- learn by creating issues, setting priorities, assigning
6. **Activation event** = completing + resolving first issue (full workflow cycle)

### Key UX Patterns

**Local-First Sync Engine:** Full data bootstrap to IndexedDB. All UI reads/writes from local database. WebSocket delta sync. 0ms perceived latency for all interactions.

**Optimistic Updates Everywhere:** Every mutation appears instantly in UI before server confirmation. Universal undo (`Cmd+Z`) for any operation including batch. Toast notifications with inline "Undo" button.

**Opinionated Defaults:** "One good way of doing things." Strong defaults, limited options. Straightforward terminology. Reduced decision fatigue. Accepts exclusion.

**Visual Design:** LCH color space (perceptually uniform). 3-variable theme system (base, accent, contrast). "Structure should be felt, not seen." Navigation dimmed so content dominates.

**Micro-interactions:** Sub-menu safe triangles. 60fps animations. 200ms transitions for state changes. Peek on hover (`Space`). Post-creation toasts with branch name copy.

### What Users Praise
1. Speed -- "everything happens instantly"
2. Clean, intuitive UI -- "every feature has a purpose"
3. Keyboard-first workflow -- "navigate the entire app without touching your mouse"
4. Developer integrations (GitHub auto-updates)
5. Emotional response -- "compared to Jira, Linear is fun"

### What Users Criticize
1. Limited customization for larger teams
2. Confusing Active vs. Cycle views
3. No swim lanes / limited Kanban features
4. Not ideal for non-engineering teams
5. Missing adjacent documentation tool

### Patterns StoryForge Should Adopt
1. **Local-first architecture** -- IndexedDB + optimistic updates for 0ms latency
2. **Command palette as primary navigation** -- introduce during onboarding, not as a tip
3. **Keyboard-first with learnable G-prefix patterns** -- `G B` beats, `G T` timeline, `G C` characters
4. **Opinionated defaults** -- new worlds start with sensible structure, one good workflow
5. **Content-over-chrome visual hierarchy** -- dim navigation, let story content dominate
6. **Action-based onboarding** -- task checklist, not explanatory tooltips
7. **Dynamic filter-based views** -- `F` to filter, save any filter as custom view
8. **Universal undo/redo** -- `Cmd+Z` for everything including batch operations
9. **Inverted-L layout** -- sidebar left, header top, content fills the rest
10. **Speed perception techniques** -- 60fps, 200ms transitions, skeleton screens, prefetch
11. **AI suggestion triage inbox** -- structured review flow for extracted entities and contradictions

---

## 5. Arc Studio Pro

### Navigation Structure
- **Top bar**: Script title (center) + view switcher (Script / Plot Board / Outline) + breadcrumbs (left) + collaborator avatars (right)
- **Dual sidebars** (hover-to-reveal, pinnable via thumbtack):
  - Left: Drafts, Navigation/TOC, Comments, Beat Inbox
  - Right: Story Elements (Storylines, Characters, Locations), Stash (cut content)
- **Command palette** (`Cmd+K`): Universal search + AI research + progressive shortcut learning

### Information Hierarchy
- **Three-view architecture**: Script (lowest, actual text) <> Plot Board (mid, kanban beats) <> Outline (highest, linear prose)
- All three views reflect the same data with bidirectional sync
- **TV hierarchy**: Season Bible > Episode Scripts with cascading story elements
- **Story Elements**: Storylines (color bars), Characters (color circles), Locations -- all taggable via `#`

### Key UX Patterns

**Bidirectional Beat-to-Script Linking:** Every beat card has a "jump to script" icon. Beat markers in script margin open inline "Beat Box" with context. Drag beats on Plot Board and script sections reorder automatically. This is their most-praised feature.

**The Stash:** Cut/deleted text preserved in sidebar panel. Remains editable. Drag-and-drop back into script. Called "so vital that when I use software without it, I kludge my own version."

**Branch Copy:** Private or shared branches for risk-free experimentation. Visual diff merge flow (green additions, red deletions). Accept/discard per change or bulk. Single-level only.

**Beat Inbox:** Parking space for unplaced beats -- ideas without a structural home. Drag from Inbox to Board when ready. Solves the "where does this idea go?" problem.

**Focus Mode + Sprint Timer:** `Cmd+D` for distraction-free mode. Configurable sprints with break prompts. "Nag me when I don't write" notifications. Writing schedule with email reminders.

**Auto-Formatting:** Context-aware screenplay element prediction. `Tab` cycles elements. `Return` follows customizable flow. Autocompleters for characters and locations from Story Elements.

### What Users Praise
1. Clean, distraction-free interface (#1 cited strength)
2. Plot Board + Script bidirectional integration
3. Real-time collaboration ("Google Docs for screenwriting")
4. The Stash feature
5. Branch Copy for experimentation
6. Command palette as single onboarding shortcut

### What Users Criticize
1. Native apps feel like web wrappers (glitchy, slow)
2. Bugs and reliability issues (freezing, data loss)
3. Not fully WYSIWYG -- still needs Final Draft for polish
4. Beat board is kanban-only; no free-form spatial layout
5. AI features feel bolted-on and buggy
6. No multimedia import capability

### Patterns StoryForge Should Adopt
1. **Three-view architecture** -- Writing Surface <> Beat Board <> Treatment, bidirectionally synced
2. **Dual pinnable sidebars** -- hover-to-reveal maximizes writing space
3. **Beat-to-script bidirectional linking** -- jump both directions
4. **Story Elements as first-class citizens** -- typed, color-coded, taggable, autocompleted
5. **The Stash** -- preserved cut content, editable, drag-and-drop back
6. **Branch Copy** -- extend into What-If Scenario Engine
7. **Beat Inbox** -- parking space for unplaced ideas
8. **Focus Mode + Sprint Timer** -- distraction-free writing with productivity tracking
9. **Inline Beat Box** -- click beat marker in script to see context without switching views

### Where StoryForge Surpasses
- **Free-form beat layout** (not kanban-only) -- spatial canvas option
- **WYSIWYG fidelity** -- eliminate need for Final Draft
- **Native AI integration** -- not bolted-on; synopsis-gated, suggestion-first
- **Multimedia source material** -- text, audio, video, images
- **Richer Story Elements** -- Themes, Objects, Factions, Motifs, Relationships, World Rules

---

## 6. Scrivener

### Navigation Structure
- **Three-pane layout**: Binder (left sidebar tree) + Editor (center, 3 view modes) + Inspector (right, 5 tabs)
- **Editor view modes**: Scrivenings (continuous scroll), Corkboard (index cards), Outliner (spreadsheet)
- **Split Editor**: Horizontal or vertical split into two independent panes (research + writing)
- **Quick Reference Panels**: Floating windows for character sheets or reference documents
- **Collections**: Standard (curated lists) + Saved Search (dynamic smart folders)

### Information Hierarchy
- **Three permanent root folders**: Draft/Manuscript, Research, Trash
- **Template-provided folders**: Characters, Places, Front Matter, Notes
- **Flexible depth**: Minimal (1 file/chapter) to Deep (Parts > Chapters > Scenes)
- **Documents = Folders**: Functionally interchangeable -- a document can contain sub-documents, a folder can contain text

### Key UX Patterns

**The Binder:** Hierarchical tree as single source of truth. Drag-and-drop reordering. Changes propagate to Corkboard and Outliner. Most universally praised feature.

**The Corkboard:** Virtual index cards on cork background. Each card = document synopsis. Grid or freeform mode. Drag to reorder = rearrange manuscript.

**The Compile System:** Transforms manuscript to formatted output. Section Types (what it IS) -> Section Layouts (how it LOOKS) -> Mapping. Extremely powerful, universally hated by casual users.

**Snapshots:** Per-document versioning with named snapshots and colored diff (blue = added, red+strikethrough = deleted). Simple mental model.

**Composition Mode:** Fullscreen distraction-free writing with typewriter scrolling, focus dimming, and customizable background.

**Metadata Tiers:** Label (color everywhere) > Status (watermark stamps) > Keywords (colored chips) > Custom Metadata (structured data). Progressive visibility layering.

**Word Count Targets:** Project, session, and document-level goals. Auto-calculate from deadline. Color-coded progress (red -> blue -> green).

### What Writers Praise
1. Organization -- "all files in one, easily-accessible place"
2. Structural flexibility -- write non-linearly, rearrange instantly
3. Research folder -- PDFs, images, audio alongside manuscript
4. "Designed for writers, by writers"
5. One-time $49-60 pricing
6. Continuous autosave + snapshots

### What Writers Criticize
1. **Learning curve** (#1) -- "inscrutable and damn near unusable" initially; 905-page manual
2. **Compile complexity** (#2) -- "too complex for its own good"; editor ≠ output
3. **Dated/overwhelming interface** -- "crowded interface, visually confusing"
4. **No collaboration** -- project corruption if two people access simultaneously
5. **Cloud sync problems** -- Dropbox is only safe option; Google Drive actively damages projects
6. **No AI features** -- no grammar checking, no suggestions, no analysis
7. **Platform disparity** -- Mac version far ahead of Windows; no Android

### Patterns StoryForge Should Adopt
1. **Binder/tree navigation** -- hierarchical sidebar as single source of truth
2. **Multiple synchronized views** (Binder/Corkboard/Outliner pattern) -- card, table, document views in sync
3. **Split editor** -- write in one pane, view research/characters in another; lockable panes
4. **Per-entity snapshots with diff** -- named snapshots with colored visual comparison
5. **Composition/focus mode** -- fullscreen with typewriter scrolling and focus dimming
6. **Progressive word count targets** -- project, session, document levels with deadline auto-calc
7. **Tiered metadata** -- most important = most visible, detailed = available but not in-your-face
8. **Collections/smart filters** -- saved dynamic filters for characters, threads, status
9. **Research alongside writing** -- any entity pinnable beside writing surface

### Pitfalls to Avoid
1. **All features visible from day one** -- implement progressive disclosure
2. **Compile-style export complexity** -- one-click export default, advanced options hidden
3. **Text-heavy onboarding** -- guided interactive experience, not a wall of text
4. **No collaboration story** -- architect for CRDTs (Yjs) from day one
5. **Editor vs. output disconnect** -- WYSIWYG; what you see = what you export
6. **905-page manual syndrome** -- every feature discoverable through the interface itself

---

## 7. Plottr

### Navigation Structure
- **Horizontal tab bar** (top): Timeline, Outline, Characters, Places, Notes, Tags, Project
- **Per-tab toolbars**: Filter, Flip (horizontal/vertical), Attributes, Zoom (3 levels), Scroll (beginning/middle/end), Export, Structure
- **No persistent sidebar** -- tab bar is sole primary navigation; maximizes content width
- **Book selector**: Switch between books and Series View within a project

### Information Hierarchy
- **Three configurable structural levels**: Acts > Chapters > Scenes (names fully customizable)
- **The Grid Model**: X-axis = Chapters/beats (structural progression), Y-axis = Plotlines (narrative threads), Cells = Scene cards at intersections
- **Scene cards**: Title, description, color, linked characters, linked places, linked tags, custom attributes
- **Scene stacks**: Multiple cards in one grid cell, collapsible
- **Auto-generated outline**: Derived from timeline data, three sub-views (Legacy, Plan/kanban, Fulltext)

### Key UX Patterns

**Visual Timeline Grid:** 2D grid of plotlines x chapters. Makes it immediately visible which plotlines are active where, where gaps exist, and how threads weave. The defining UX innovation.

**Three-Layer Color Coding:** Plotline colors (row-level), Scene card colors (individual), Tag colors (categorical). Independent layers enabling multiple simultaneous organizational schemes.

**Progressive Disclosure via Hover/Click:** Title on card face, description on hover tooltip, full editor on click. Grid stays clean and scannable.

**Bidirectional Timeline-Outline Sync:** Any change in Timeline appears in Outline and vice versa. "Which view is the source of truth?" answered: both are.

**Filter-Fade (Not Filter-Hide):** Non-matching cards fade out rather than disappear. Preserves spatial context while focusing on filtered content.

**Template-as-Onboarding:** 30+ story structure templates. Selecting one pre-populates timeline with named positions and descriptive guidance. Users fill in their story gradually. Template IS the onboarding.

**Horizontal/Vertical Toggle:** Timeline flippable between orientations. Accommodates different screens and preferences.

**Series-Level Shared Entities:** Characters and Places shared across all books. Natural series bible building without duplication.

### What Users Praise
1. "Incredibly user-friendly with a sleek interface" -- corkboard metaphor clicks instantly
2. Template library -- "fantastic source of inspiration"
3. Short learning curve (vs. Scrivener)
4. Color coding for POV characters, status, mood, subplot threads
5. Drag-and-drop -- "like moving index cards"
6. Series management -- "all 3, 10, or 47 books in one place"
7. Dual view (timeline + outline) auto-sync -- "the coolest thing"
8. Lifetime deal at $199

### What Users Criticize
1. **No writing surface** (#1) -- planning-only; must export to Word/Scrivener to write
2. **Hidden information density** -- must click into every card for detail
3. **Performance/stability** -- "super buggy," crashes, lag
4. **Wasted screen real estate** -- "mandatory blank spaces"
5. **Search limitations** -- finds documents but doesn't highlight within
6. **No split-screen** -- can't view characters while editing timeline
7. **No AI** -- deliberately absent

### Patterns StoryForge Should Adopt
1. **Grid model (plotlines x chapters)** -- extend with structure template overlay markers
2. **Auto-generated outline from timeline** -- bidirectional sync
3. **Three-layer color coding** -- extend with framework overlay and consistency status colors
4. **Template-as-onboarding** -- pre-populated frameworks teaching both tool and craft
5. **Scene stacks** -- multiple cards per grid cell with collapse/expand
6. **Filter-fade** -- non-matching elements fade, preserving spatial context
7. **Fast navigation** -- zoom levels + beginning/middle/end scroll
8. **Series-level shared entities** -- characters, locations available across all stories

### Where StoryForge Surpasses
- **Integrated writing surface** (Plottr's #1 complaint)
- **Configurable card density** -- compact/standard/expanded views
- **Split-panel views** -- timeline + character profile side-by-side
- **Search with in-context highlighting** and semantic/creative intent search
- **AI integration** -- opt-in, synopsis-gated, suggestion-first
- **Structure framework overlay** -- multiple frameworks as lenses on same data

---

## Cross-Cutting Analysis: Universal Patterns

### Pattern 1: The Command Palette (`Cmd+K`)
**Used by:** Linear, Figma, Notion, Arc Studio Pro
**Why it works:** Consolidates all functionality into a searchable, keyboard-driven interface. Scales with feature count. Progressive shortcut learning (shows shortcuts alongside commands).
**StoryForge implementation:** Global `Cmd+K` searching across views, characters, beats, locations, commands. Introduce during onboarding as the primary interaction model.

### Pattern 2: Progressive Disclosure
**Used by:** Figma, Notion, Linear, Plottr
**Why it works:** Complex tools (30+ features) cannot show everything at once. Start simple, reveal on demand.
**StoryForge implementation:**
- **Surface**: Beat Sheet + Writing Surface + Story Sidebar
- **Discoverable**: Timeline, Character Map, Arc Diagram
- **Power**: Multi-framework overlay, What-If, Causality, Narrative Codes
- **AI**: Disabled until synopsis filled

### Pattern 3: Bidirectional View Sync
**Used by:** Arc Studio (Script/Board/Outline), Plottr (Timeline/Outline), Othelia (Beats/Treatment/Script), Scrivener (Binder/Corkboard/Outliner)
**Why it works:** Writers need multiple perspectives on the same data. Changes must propagate instantly or trust breaks down.
**StoryForge implementation:** Beat Sheet <> Writing Surface <> Treatment. All bidirectional. The beat sheet is the structural source of truth; treatment is derived; writing surface is linked.

### Pattern 4: Contextual Properties Panel
**Used by:** Figma, Linear, Scrivener (Inspector)
**Why it works:** Right sidebar that changes content based on selection. Never shows irrelevant information. Reduces cognitive load.
**StoryForge implementation:** Nothing selected = world stats. Beat selected = beat properties. Character selected = character profile. Scene in timeline = scene metadata.

### Pattern 5: Templates as Onboarding + Creative Accelerator
**Used by:** Plottr (30+ templates), Notion (30K+ templates), Arc Studio (Save the Cat, 3-Act)
**Why it works:** Solves blank page problem. Teaches both the tool and the craft simultaneously. Pre-populated data gives immediate "aha!" moments.
**StoryForge implementation:** Hero's Journey (12 beats), Save the Cat (15 beats with % positions), Story Circle (8 steps), Kishotenketsu (4 acts), TV Series (Season > Episode > Act). Live preview during selection.

### Pattern 6: The Stash / Cut Content Preservation
**Used by:** Arc Studio (Stash), Scrivener (Trash + Snapshots)
**Why it works:** Writers are terrified of losing good prose. A safety net for deleted content removes the barrier to bold restructuring.
**StoryForge implementation:** Dedicated Stash panel in right sidebar. Cut text remains editable. Drag-and-drop back into manuscript.

### Pattern 7: Keyboard-First with Learnable Patterns
**Used by:** Linear (G-prefix, O-prefix, single-key), Figma (shortcuts alongside commands), Scrivener (Cmd+1/2/3 for views)
**Why it works:** Professional writers spend hours daily in the tool. Every second saved compounds. Patterned shortcuts (G-prefix) reduce memorization.
**StoryForge implementation:** `G B` beats, `G T` timeline, `G C` characters, `G W` write, `G R` treatment. `S` status, `A` assign, `L` label on selected beat. Show shortcuts in all menus and command palette.

### Pattern 8: Local-First with Optimistic Updates
**Used by:** Linear (IndexedDB + delta sync)
**Why it works:** 0ms perceived latency. Works offline. Undo/redo for everything. Speed IS the product.
**StoryForge implementation:** Store active story world in IndexedDB. All UI reads/writes local first. WebSocket delta sync. Optimistic mutations with background server confirmation.

### Pattern 9: Multiplayer Presence for Collaboration
**Used by:** Figma (cursors + observation + spotlight), Arc Studio (colored cursors + live indicators)
**Why it works:** Remote teams need ambient awareness. Cursors convey intention without explicit communication. Observation mode enables guided reviews.
**StoryForge implementation:** Colored cursors in beat sheet and writing surface. Avatar bar. Observation mode for showrunner oversight. Spotlight mode for writers room walkthroughs.

### Pattern 10: Split View / Research Alongside Writing
**Used by:** Scrivener (split editor + research), Arc Studio (Script + Beat Box)
**Why it works:** Long-form writers constantly reference notes, character profiles, and source material. App-switching breaks flow.
**StoryForge implementation:** Horizontal/vertical split. Any entity (character, source, world rule) pinnable beside writing surface. Lockable panes.

---

## Recommended StoryForge UX Architecture

Based on all findings, here is the recommended UX architecture:

```
+--+---------------------------------------------------+--+
|  |  Header: View Switcher + Breadcrumbs + Filters    |  |
|S |  [Beats] [Write] [Treatment] [Timeline] [Chars]   |P |
|I |---------------------------------------------------+R |
|D |                                                   |O |
|E |           Main Content Area                       |P |
|B |         (changes per view)                        |E |
|A |                                                   |R |
|R |         - Beat Board (kanban/grid)                |T |
|  |         - Writing Surface (TipTap)                |I |
|N |         - Treatment (auto-generated)              |E |
|A |         - Timeline (D3/Vis.js)                    |S |
|V |         - Character Graph (React Flow)            |  |
|  |         - Visualizations                          |P |
|  |                                                   |A |
|  |                                                   |N |
|  |                                                   |E |
|  +---------------------------------------------------+L |
|  |  Minimap (beats) | Stash | AI Suggestions         |  |
+--+---------------------------------------------------+--+
```

### Left Sidebar (Persistent, Collapsible)
- Story World tree (Binder pattern)
- Favorites
- Navigation to all views
- Search

### Right Properties Panel (Contextual, Toggleable)
- Changes based on selection (Figma pattern)
- Story Sidebar (synopsis, stats) when nothing selected
- Entity details when item selected

### Bottom Bar (Contextual)
- Minimap (beat sheet view)
- Word count + targets (writing view)
- Zoom controls (visualization views)

### Global Overlays
- Command Palette (`Cmd+K`)
- Keyboard Shortcuts Help (`?`)
- Quick Capture (`Cmd+M`)

### Interaction Priorities
1. **Keyboard-first** with mouse-friendly fallback
2. **Local-first** with optimistic updates
3. **Progressive disclosure** across all feature tiers
4. **Bidirectional sync** between all views of the same data
5. **Templates** for every story framework
6. **Synopsis-gated AI** following Othelia's proven pattern

---

## Next Steps

1. **Design the information architecture** mapping our 56 Prisma models to the view hierarchy
2. **Prototype the command palette** -- this should be built early and used throughout development
3. **Build the beat sheet view first** -- it's the intersection point for all other views
4. **Create 5 story structure templates** for launch (Hero's Journey, Save the Cat, 3-Act, Story Circle, Blank)
5. **Implement the inverted-L layout shell** with collapsible sidebar and contextual properties panel
6. **Design the onboarding flow** -- theme selection > Cmd+K introduction > task-driven checklist > template selection
