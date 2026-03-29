# Linear UX Patterns Research

> Research conducted 2026-03-29 for StoryForge UX reference.
> Linear is a $400M+ project management tool used by 10,000+ teams including OpenAI, Ramp, and CashApp. It is widely regarded as the gold standard for making complex tools feel simple, fast, and delightful.

---

## Table of Contents

1. [Navigation Structure](#1-navigation-structure)
2. [Information Hierarchy](#2-information-hierarchy)
3. [Onboarding Flow](#3-onboarding-flow)
4. [Key UX Patterns That Make It Feel Good](#4-key-ux-patterns-that-make-it-feel-good)
5. [What Users Praise](#5-what-users-praise)
6. [What Users Criticize](#6-what-users-criticize)
7. [Patterns StoryForge Should Adopt](#7-patterns-storyforge-should-adopt)

---

## 1. Navigation Structure

### 1.1 Sidebar

Linear uses a **persistent left sidebar** as the primary navigation spine. The sidebar is designed with deliberate visual restraint:

- **Dimmed brightness** relative to the main content area, so navigation recedes and content takes precedence. The principle is "Don't compete for attention you haven't earned."
- **Smaller icons** with removed colored backgrounds, and increased vertical padding for breathing room.
- **Condensed visible views**: Team sections show only Issues, Projects, and (when enabled) Cycles and Triage. Sub-views (backlog, upcoming cycle) are revealed on hover.
- **Favorites and folders**: Users can pin frequently-accessed views to the sidebar for quick access.
- **Collapsible**: The sidebar can be collapsed to maximize content area.
- **Personalized**: As of late 2024, the sidebar became personalizable so users can configure which items appear.

The sidebar follows an "inverted L-shape" global chrome pattern: sidebar on the left, header bar across the top, content filling the remainder.

### 1.2 Command Palette (Cmd+K)

The command palette is Linear's **defining UX pattern** and the primary way power users interact with the app:

- **Cmd+K** opens a global command menu from anywhere in the app.
- It provides **fuzzy search** across all commands, navigation destinations, issues, projects, and settings.
- It **shortcircuits the information architecture** -- users skip the linear navigation hierarchy and jump directly to any destination or action.
- The palette shows **keyboard shortcuts inline** next to each command, teaching shortcuts as a side effect of usage.
- **Contextual positioning**: While the palette originally appeared center-screen, Linear evolved it to appear closer to the UI element that invoked it, behaving almost like a searchable dropdown while retaining keyboard controllability.
- The palette supports **chained actions**: you can search for an issue, then immediately change its status, assignee, or labels without leaving the palette flow.

**Why it works**: The command palette solves the tension between feature-rich applications and clean interfaces. Instead of cluttering screens with buttons and menus, it consolidates all functionality into a searchable, keyboard-driven interface that appears on demand.

### 1.3 Keyboard Shortcuts

Linear has **99 catalogued keyboard shortcuts** organized into systematic, memorable patterns:

#### G-prefix Navigation Pattern
All navigation uses the `G` prefix followed by a mnemonic letter:
- `G I` -- Go to Inbox
- `G M` -- Go to My Issues
- `G T` -- Go to Triage
- `G A` -- Go to Active Issues
- `G B` -- Go to Backlog
- `G C` -- Go to Cycles
- `G P` -- Go to Projects
- `G S` -- Go to Settings
- `G V` -- Go to Active Cycle
- `G W` -- Go to Upcoming Cycle
- `G X` -- Go to Archived Issues
- `G E` -- Go to All Issues
- `G D` -- Go to Board

#### O-prefix Quick Open Pattern
- `O F` -- Open a Favorite
- `O P` -- Open a Project
- `O C` -- Open a Cycle
- `O U` -- Open a User
- `O M` -- Open My Profile
- `O T` -- Open a Team

#### Single-Key Issue Actions
- `C` -- Create new issue
- `S` -- Change status
- `P` -- Change priority
- `A` -- Assign to user
- `I` -- Assign to me
- `L` -- Add label
- `E` -- Edit issue
- `R` -- Rename
- `X` -- Select in list
- `F` -- Open filter menu
- `#` -- Archive/restore
- `?` -- Open keyboard shortcuts help

#### Multi-Key Actions
- `Shift+C` -- Add to cycle
- `Shift+P` -- Add to project
- `Shift+E` -- Change estimate
- `Shift+L` -- Remove label
- `Shift+S` -- Subscribe to issue
- `Shift+F` -- Clear last filter
- `M B` -- Mark as blocked
- `M X` -- Mark as blocking
- `M R` -- Reference related issue

#### System Shortcuts
- `Cmd+K` -- Command menu
- `Cmd+Z` -- Undo (works for individual and batch operations)
- `Shift+Cmd+Z` -- Redo
- `Cmd+A` -- Select all issues in view
- `Cmd+B` -- Toggle list/board view
- `Cmd+I` -- Open details sidebar
- `Cmd+D` -- Set due date
- `Cmd+.` -- Copy issue ID
- `Cmd+Shift+.` -- Copy git branch name
- `Cmd+Shift+,` -- Copy issue URL
- `Cmd+Shift+O` -- Create sub-issue
- `Cmd+Shift+M` -- Move to another team
- `Cmd+Enter` -- Save or submit
- `Esc` -- Go back / clear selection
- `/` -- Open search
- `Space` -- Peek into issue (hover and hold)
- `Enter` or `O` -- Open focused item
- `J/K` -- Move down/up (Vim-style)
- Arrow keys -- Navigate between columns and positions

**Key design principle**: Shortcuts follow learnable patterns (G-prefix for navigation, O-prefix for opening, single-key for common actions, Shift-modified for related actions). This means learning a few patterns gives you most of the keyboard.

### 1.4 Contextual Menus

- **Right-click** anywhere on an issue (in lists, boards, or projects) to get a full contextual menu of all available actions.
- Contextual menus **show keyboard shortcuts inline**, serving as both a quick action tool and a learning mechanism.
- Linear solved the **sub-menu safe area problem**: when hovering to a sub-menu, a triangular safe zone is dynamically calculated between the cursor and the sub-menu, preventing accidental dismissal. This uses Euclidean geometry (diagonal paths are shorter than Manhattan grid paths) implemented in ~40 lines of React code.
- Multi-select contextual menus include **checkboxes that toggle entries without closing the menu**.

### 1.5 Views and Display Options

- **List view**: Default tabular view of issues.
- **Board view**: Kanban-style columns by status. Toggle with `Cmd+B`.
- **Timeline view**: For projects and initiatives.
- **Split view**: Supported on tablet-sized screens.
- **Fullscreen view**: For focused work.

Display options let you **group and order** issues by Status, Assignee, Project, Priority, Cycle, or Focus, and choose which information columns are displayed.

---

## 2. Information Hierarchy

### 2.1 Conceptual Model

Linear's hierarchy is deliberately simple with clear, everyday terminology (no invented jargon):

```
Workspace (top-level company container)
  |
  +-- Initiatives (strategic groupings of projects)
  |     |
  |     +-- Projects (time-bound deliverables, can span multiple teams)
  |           |
  |           +-- Milestones (meaningful completion stages within a project)
  |           |
  |           +-- Issues (the atomic work unit)
  |                 |
  |                 +-- Sub-issues (smaller work items within an issue)
  |
  +-- Teams (organizational units, can have sub-teams)
  |     |
  |     +-- Issues (with team-specific workflows/statuses)
  |     +-- Projects
  |     +-- Cycles (time-boxed sprints, auto-recurring)
  |     +-- Triage (optional intake queue)
  |
  +-- Views (dynamic, filter-based perspectives across any level)
```

### 2.2 Core Design Decision: Issues at the Center

As Linear states: "Most other concepts in Linear are either associated with issues, or function to group issues together." This makes Issues the conceptual center, with everything else existing to organize, filter, or contextualize them.

### 2.3 Entity Definitions

| Entity | Purpose | Key Trait |
|--------|---------|-----------|
| **Workspace** | Company-level container | Unique URL, all teams and data live here |
| **Teams** | Groups of people or product areas | Contain issues, have customizable workflows, statuses, cycles |
| **Sub-teams** | Nested specializations | Inherit workflows, cycles, and labels from parent team |
| **Issues** | Atomic unit of work | Must have title + status; optional: priority, estimate, labels, due dates, assignees |
| **Sub-issues** | Breakdown of larger issues | When too big for one issue but too small for a project |
| **Projects** | Time-bound deliverables | Can span multiple teams; have milestones, progress tracking |
| **Milestones** | Stages within a project | Meaningful completion markers |
| **Cycles** | Time-boxed sprints | Auto-recurring; incomplete issues roll over automatically |
| **Initiatives** | Strategic-level groupings | Curated collections of projects |
| **Views** | Dynamic filter-based perspectives | Saved filters; auto-update as issues match/unmatch criteria |

### 2.4 Workflow Statuses

Linear uses **ordered status sequences per team** with special categories:
- **Triage** (optional): Intake review before acceptance
- **Backlog**: Unprioritized work
- **Todo / In Progress / Done**: Standard workflow states
- Custom states can be configured per team

### 2.5 Views System

Views are one of Linear's most powerful organizational tools:

- **Standard views** come built-in: Backlog, Active, All Issues, etc.
- **Custom views** are saved filter combinations that can be personal, team-scoped, or workspace-wide.
- Views are **dynamic**: issues appear/disappear as their properties match/unmatch the filter criteria.
- Views can be **favorited** to appear in the sidebar.
- Views support **notifications**: get alerted when an issue enters a view or is completed.
- **Project-level custom views** appear as tabs within a project page.
- The **right-hand sidebar** in views shows filterable metadata: assignees, labels, projects.

### 2.6 Triage System

Triage is an optional but important workflow pattern:
- Issues from integrations (Slack, Sentry) or external team members land in Triage first.
- A designated team member reviews, prioritizes, and routes issues.
- **Triage responsibility** can rotate automatically via PagerDuty integration.
- **Triage rules** (Business/Enterprise) auto-route based on issue properties.
- **Triage Intelligence** (AI-powered) suggests assignees, labels, and surfaces likely duplicates.

### 2.7 Inbox (Personal Notification Center)

- **G I** to access from anywhere.
- Aggregates all notifications for subscribed issues.
- Auto-subscribes you to issues you create, are assigned to, or are mentioned in.
- Supports snoozing, deleting, and filtering notifications.
- **Backspace** deletes notifications; **Shift+Backspace** deletes all.
- Maximum 500 notifications at a time.

---

## 3. Onboarding Flow

### 3.1 Structure

Linear's onboarding has 2 sections:
1. **Must-do steps**: Sign-up (Google OAuth), email verification, workspace creation.
2. **Core onboarding**: Split into beginner and advanced paths. 10+ steps total, but designed to feel like far fewer.

### 3.2 Step-by-Step Flow

1. **Authentication**: Sign in via Google OAuth, create workspace. Domain auto-join enables potential team adoption during signup.

2. **Theme Selection** (immediate personalization): Light or dark mode is asked right after workspace creation. This is cosmetic, but it is the first moment the product is configured *for* the user rather than the other way around. It signals that the product cares about personal preference.

3. **Command Menu Introduction** (Cmd+K): The command palette is introduced *before* the user has created any content. This is the sharpest differentiator -- most tools introduce keyboard shortcuts as optional tips, but Linear makes it the foundational interaction model from the first minute.

4. **Optional GitHub Integration**: Skippable. Appears early enough to feel purposeful but doesn't block access to core features.

5. **Optional Teammate Invites**: Similarly skippable. Plants the idea of collaboration without creating a gate.

6. **Task-Driven Checklist** ("Get Familiar with Linear"): This is where the magic happens. Instead of explanatory tooltips or product tours, Linear teaches through *action*:
   - Create an issue
   - Use the command menu
   - Set a priority
   - Assign an issue
   - Complete each task to surface a feature (left panel, labels, status fields) *in context*
   - By the time the checklist is done, the user has touched the core workflow without having it explained.

7. **Activation Event**: Completing and resolving the first issue (not just creating one). This closes the loop from problem to outcome and demonstrates the full workflow.

### 3.3 Key Onboarding Design Principles

- **One input per step**: The flow never overwhelms with multiple form fields at once.
- **Learn by doing, not reading**: The task checklist teaches through action, not explanation.
- **Cmd+K as foundational, not optional**: Introduced as THE way to use the product, not a power-user tip.
- **Skip-friendly optional steps**: GitHub and teammate invites can be deferred without penalty.
- **Early personalization**: Theme choice creates a sense of ownership before any work content exists.
- **Activation = resolution, not creation**: The "aha" moment is completing a full workflow cycle.

### 3.4 Ongoing Learning Resources

- Live onboarding sessions for workflows
- Learning Library with onboarding videos
- Slack community with the Linear team active
- `?` shortcut opens searchable keyboard shortcuts help

---

## 4. Key UX Patterns That Make It Feel Good

### 4.1 Local-First Sync Engine (The Technical Foundation of "Fast")

This is the single most important technical decision behind Linear's UX. Linear built a custom sync engine that makes the app feel instant:

**Architecture:**
- On first load, a `/sync/bootstrap?type=full` endpoint delivers all data (40+ model types) in a lightweight plain-text format.
- All data is stored in **IndexedDB** in the browser, creating a full local database.
- A deferred `/sync/bootstrap?type=partial` loads less-critical data (comments, history) without blocking initial render.
- **Every UI interaction reads from and writes to the local database first.** No network round-trip for display or mutation.

**Real-time Sync:**
- WebSocket connection pushes `SyncAction` objects (Insert, Update, Delete, Archive) with complete model snapshots.
- A `lastSyncId` version number tracks the delta between client and server.
- If a client falls behind, `/sync/delta` replays all intermediate actions.
- State management via MobX integrates with the sync layer.

**Optimistic Updates:**
- Every mutation is implemented twice: once for the authoritative server change, once for an optimistic local update.
- The `save` method on any object triggers the entire sync cycle.
- The frontend never manually makes network requests -- the sync layer handles timing, error recovery, and cache updates.
- If you go offline, the app continues functioning with local data.

**Result:** Searching issues is 0ms latency (just filtering a JavaScript array in memory). Status changes, assignments, and all other mutations feel instant because they happen locally before server confirmation.

### 4.2 Optimistic UI Everywhere

- **Status changes**: Click and it changes immediately. Server confirms in background.
- **Issue creation**: The issue appears in the list before the server has created it.
- **Drag-and-drop**: Reordering is instant; sync happens async.
- **Undo system**: `Cmd+Z` undoes any operation (individual or batch) because the local state tracks all changes. You can undo hundreds of issue modifications at once.
- **Redo**: `Shift+Cmd+Z` redoes previously undone operations.

### 4.3 Speed as Core Product Identity

Speed is not a feature in Linear -- it is the product. Key aspects:

- **Sub-100ms interactions**: Every click, keystroke, and navigation feels instant.
- **No loading spinners**: Users report "no loading spinners, no waiting for pages to render."
- **Keyboard-first eliminates mouse overhead**: Moving a mouse to a button takes 200-500ms; pressing a key takes <100ms.
- **Minimal UI reduces rendering**: Fewer DOM elements = faster paint times.
- **Aggressive data prefetching**: The bootstrap loads all relevant data upfront rather than fetching on demand.

### 4.4 Opinionated Defaults

This is perhaps Linear's most important design philosophy. Instead of offering maximum configurability:

- **One good way of doing things**: "We design it so that there's one really good way of doing things. Flexible software lets everyone invent their own workflows, which eventually creates chaos as teams scale." -- Jori Lallo, co-founder.
- **Strong defaults, limited options**: The product gently nudges users toward a particular workflow rather than asking them to configure one.
- **Straightforward terminology**: Projects, Teams, Issues, Cycles -- no invented jargon, no handbook needed.
- **Reduced decision fatigue**: Fewer choices = faster onboarding and less team debate about process.
- **Accepts exclusion**: Linear deliberately does not try to serve every workflow, accepting that some users will not be the right fit.

### 4.5 Visual Design Principles

**Color System:**
- Built on the **LCH color space** (not HSL) for perceptually uniform colors across themes.
- Only 3 variables needed per theme: base color, accent color, contrast level.
- Support for automatic high-contrast accessibility themes.
- 2026 refresh moved from cool blue-tinted grays to warmer, less saturated neutrals.
- Text/icon contrast improved: darker in light mode, lighter in dark mode.

**Typography:**
- **Inter Display** for headings (more expressive).
- **Inter** for body text (readable, neutral).

**Layout:**
- "Structure should be felt, not seen" -- borders and separators are softened with rounded edges and reduced contrast.
- Navigation elements are visually dimmed to let content stand out.
- Meticulous alignment of labels, icons, and buttons both vertically and horizontally.
- The feeling of polish emerges "after a few minutes of using the app" -- not from flashy first impressions but from consistent micro-details.

**Icon System:**
- Reduced icon usage across views.
- Smaller icon sizes.
- Removed unnecessary visual treatments (no colored team backgrounds).
- All icons redrawn and resized in the 2026 refresh.

### 4.6 Micro-interactions and Invisible Details

- **Sub-menu safe triangles**: Dynamically calculated triangular safe zones for contextual menu navigation.
- **Smooth 60fps animations**: Required to eliminate perception of stuttering, especially for user-triggered animations.
- **Toast notifications**: Brief, non-blocking feedback for actions (e.g., "Issue moved to backlog") with undo buttons.
- **Peek on hover**: Hold `Space` while hovering to preview an issue without leaving the current view.
- **Contextual command menu positioning**: The command palette appears near the element that triggered it, not always center-screen.
- **Post-creation toasts**: After creating an issue, a toast shows a link and option to copy the branch name.
- **Smooth transitions**: 200ms duration for optimal perceived responsiveness; 300-500ms for navigation transitions.

### 4.7 Undo/Redo System

- **Universal undo** (`Cmd+Z`): Works for individual and batch operations.
- **Scope**: Issue assignments, status changes, label modifications, deletions, notification management -- almost every operation.
- **Navigation-aware**: Undo takes you back to the page where the operation was created and selects all associated items.
- **Batch undo**: Can reverse modifications to hundreds of issues at once.
- **Redo** (`Shift+Cmd+Z`): Restores previously undone operations.

### 4.8 Filtering System

- **`F` key** opens the filter menu from any view.
- Type to search and select filter types.
- **Any/All logic**: Toggle between "match any filter" and "match all filters."
- **Advanced filters**: Nested AND/OR groups for complex conditions.
- **Quick filter**: Just type a name directly after pressing `F`.
- **Clear filters**: `Shift+F` clears last filter; `Alt+Shift+F` clears all.
- **Save as view**: `Alt+V` saves any filtered state as a reusable custom view.

### 4.9 Accessibility

- Adopted **Radix Primitives** for their design system (Orbiter), significantly improving accessibility compliance.
- High-contrast theme support built into the color system.
- `prefers-reduced-motion` media query support.
- Keyboard navigation for every interactive element.
- Focus indicators visible without CSS overrides.
- Searchable keyboard shortcuts help screen (`?`).

---

## 5. What Users Praise

Based on G2 reviews (4.5+ stars), Product Hunt, TrustRadius, and user blog posts:

### Speed & Performance
- "It's fast and frictionless -- everything happens instantly, which makes teams more likely to actually keep work updated."
- "No loading spinners, no waiting for pages to render."
- "The real game-changer is the speed: updating tasks, switching views, or collaborating with teammates -- everything feels instant."

### Clean, Intuitive UI
- "From the moment you log in, the clean, intuitive design shows that it's built to make work flow seamlessly."
- "Every feature feels like it has a purpose, with no unnecessary extras bogging down the process."
- Users switching from Jira/Asana consistently cite UI superiority.

### Keyboard-First Workflow
- "The keyboard-first design makes moving through issues feel natural and efficient."
- "Cmd+K for the command palette. You can literally navigate the entire app without touching your mouse. As someone who lives in VS Code, this feels natural."
- Developers praise the Vim-style J/K navigation.

### Developer Integrations
- GitHub integration auto-updates issues on PR actions (open, assign, merge, close).
- Auto-generated issue IDs (`ENG-123`) simplify PR references.
- GraphQL API is well-structured. Webhook payloads are well-structured for automation.
- Integrations with Figma, Sentry, Slack, PagerDuty.

### Simplicity & Ease of Use
- "It doesn't require a lot of configuration and set-up."
- "Linear is extremely easy to use. The UI is simple and straightforward."
- Teams report faster onboarding compared to Jira.

### Cycle Management
- Auto-rolling incomplete issues eliminates sprint reset overhead.
- Simple cycle setup with configurable length and start day.

### Emotional Response
- "Everything that I ever dreamed a development tracking tool could be and MORE."
- "Compared to Jira, Linear is fun."
- Users don't just adopt the tool; they identify with its values (craft, taste, design quality).

### Most Frequently Mentioned Positives (G2 Tags)
| Theme | Frequency |
|-------|-----------|
| Ease of Use | 33 mentions |
| User Interface | 21 mentions |
| Simple | 18 mentions |
| Intuitive | 16 mentions |
| Integrations | 14 mentions |

---

## 6. What Users Criticize

### Limited Customization
- "The limited customization options may not meet the needs of larger teams or complex workflows."
- No project-level cycle settings.
- No Gantt charts.
- Cannot remap keyboard shortcuts.

### Confusing Navigation Quirks
- Two competing views: "active sprint" (Cycle) vs "active tasks" (Active) causes confusion.
- "The number of times people on the team are confused as to why they can't see tickets and where they've gone due to some quirk of the UI is frustrating."
- Default view opens "Active" not the current cycle, leading to accidental out-of-sprint work.

### Missing Board/Kanban Features
- No swim lanes (present in Jira, Kanbanize).
- Single hierarchy -- tickets belong to projects only, no multi-dimensional grouping.
- Must build custom filters to approximate board views found in competitors.

### Not Ideal for Non-Engineering Teams
- Optimized for software development workflows.
- Marketing, HR, and client-facing project management feel underserved.
- "Less suited for client-facing project management."

### Scalability Concerns
- "Best for small teams and can become cluttered" at scale.
- "Running larger multi-team projects would be more challenging."
- Speed architecture can slow down for workspaces that scale faster than expected.

### Missing Features
- No adjacent documentation tool (like Confluence).
- Limited analytics/reporting depth.
- Cycle time configuration has unintuitive workarounds.
- Some users wanted a mobile app (though this has since been addressed).

### Sidebar Navigation
- "Too many tabs together, making it annoying to navigate."
- Text size and icon/letter combinations in tabs criticized.

### Most Frequently Mentioned Negatives (G2 Tags)
| Theme | Frequency |
|-------|-----------|
| Limited Features | 6 mentions |
| Missing Features | 5 mentions |
| Limited Customization | 5 mentions |
| Lack of Tools | 5 mentions |
| Intuitiveness (paradoxically) | 4 mentions |

---

## 7. Patterns StoryForge Should Adopt

### 7.1 Local-First Architecture with Optimistic Updates

**Why**: StoryForge will manipulate large, interconnected story world data (characters, beats, relationships, timelines). Network latency would make the experience feel sluggish, especially for drag-and-drop beat reordering, character graph manipulation, and timeline editing.

**What to adopt**:
- Store the active story world's data in IndexedDB on the client.
- Implement optimistic updates for all mutations (beat moves, character edits, relationship changes).
- Use a delta sync mechanism so the UI never blocks on network.
- Target 0ms perceived latency for all interactions within a loaded world.

### 7.2 Command Palette (Cmd+K) as Primary Navigation

**Why**: StoryForge has 19+ views (beats, timeline, characters, arcs, foreshadowing, causality, etc.). Traditional sidebar-only navigation will not scale. Writers need to jump between views fluidly.

**What to adopt**:
- Global `Cmd+K` palette searchable across: views, characters, beats, locations, projects, settings, commands.
- Fuzzy search with instant results.
- Show keyboard shortcuts inline in palette results.
- Introduce the palette during onboarding as the primary interaction model.
- Support chained actions (e.g., search for character, then jump to their arc view).

### 7.3 Keyboard-First with Learnable Patterns

**Why**: Writers and story architects are keyboard-centric professionals. Writing tools (Scrivener, VS Code, Final Draft) all have deep keyboard support.

**What to adopt**:
- **G-prefix navigation**: `G B` for beats, `G T` for timeline, `G C` for characters, `G A` for arcs, `G W` for wiki, `G S` for sources, etc.
- **Single-key actions on beat cards**: `S` for status, `P` for priority/act, `A` for assign character, `L` for label/tag, `C` for create, `E` for edit.
- **F for filter** in any view.
- **Cmd+Z/Shift+Cmd+Z** for universal undo/redo.
- **`?`** for searchable shortcuts help.
- **Vim-style J/K** navigation in lists.

### 7.4 Opinionated Defaults Over Infinite Configuration

**Why**: StoryForge has enormous feature scope (30+ planned features). Without strong opinions, the UI becomes a confusing Swiss Army knife.

**What to adopt**:
- **One good default workflow**: New story worlds start with a sensible default structure (Act 1/2/3, basic beat template). Users can switch to other frameworks later.
- **Straightforward terminology**: Use everyday words. "Beat" not "Narrative Micro-Unit." "Character" not "Dramatis Persona Entity."
- **Progressive disclosure**: Start with Tier 1 features visible. Tier 2/3 features reveal as users engage deeper. Don't show the Dramatica storyform overlay to a first-time user.
- **Strong defaults for views**: Default beat board grouping, default timeline settings, default character map layout -- users can customize, but the defaults should work out of the box.
- **Accept exclusion**: Not every narrative framework needs equal prominence. Prioritize the most common (Save the Cat, Hero's Journey, 3-Act) and let others be discoverable.

### 7.5 Visual Hierarchy: Content Over Chrome

**Why**: StoryForge is a content-heavy application. Story content (beats, manuscript text, character details) must always dominate the visual field.

**What to adopt**:
- **Dim the navigation**: Sidebar and toolbars should be visually quieter than the content area.
- **"Structure should be felt, not seen"**: Use subtle borders, rounded edges, and reduced contrast for structural elements.
- **LCH color space** for theme generation (perceptually uniform across light/dark modes).
- **Warm, neutral grays** for backgrounds (the 2026 trend away from cool blues).
- **Inter / Inter Display** typography pairing.
- **3-variable theme system**: Base color, accent color, contrast level.

### 7.6 Onboarding Through Action, Not Explanation

**Why**: StoryForge is complex (narrative theory, multiple views, AI analysis). Explaining everything upfront would overwhelm. Learning by doing is more effective.

**What to adopt**:
- **Theme selection first**: Light/dark mode immediately after account creation (personalization signal).
- **Introduce Cmd+K before content creation**: Teach the command palette as the foundational interaction.
- **Task-driven checklist**: "Create your first story world" -> "Add a character" -> "Create a beat" -> "Try the beat board" -> "Open the timeline." Each task surfaces a feature in context.
- **One input per step**: Never overwhelm with multiple form fields.
- **Activation event = completing a full cycle**: Not just creating a world, but creating a beat, assigning a character, and seeing it on the timeline.
- **Skip-friendly optionals**: AI features, integrations, and advanced frameworks should be skippable during onboarding.

### 7.7 Contextual Menus with Shortcut Discovery

**Why**: Right-click menus serve dual purposes: quick action for mouse users and shortcut learning for keyboard-curious users.

**What to adopt**:
- Right-click on any beat card, character, timeline event, or list item to show all available actions.
- Show keyboard shortcut hints next to every contextual menu item.
- Implement safe-area triangles for sub-menus.
- Support multi-select with checkboxes that don't close the menu.

### 7.8 Dynamic, Filter-Based Views

**Why**: StoryForge data is multi-dimensional (beats filtered by character, act, tag, rating, timeline position, etc.). Static views won't serve the diverse ways writers need to slice their world.

**What to adopt**:
- Every list/board/timeline supports filtering by any entity property.
- `F` key opens filter with fuzzy search for filter types.
- Any/All filter logic with advanced nested AND/OR groups.
- **Save any filtered state as a custom view** (`Alt+V`).
- Custom views appear as sidebar favorites or project-level tabs.
- Views auto-update as data changes (dynamic, not snapshots).

### 7.9 Universal Undo/Redo

**Why**: Writers experiment constantly. Beat reordering, character reassignment, status changes -- all need to be safely reversible.

**What to adopt**:
- `Cmd+Z` undoes any operation, including batch operations.
- Undo navigates back to the page where the action occurred.
- Redo with `Shift+Cmd+Z`.
- Toast notifications for destructive actions with inline "Undo" button.
- Track change history for all entities (not just git-like snapshots, but operation-level history).

### 7.10 The "Inverted L" Layout Pattern

**Why**: It's the most natural layout for complex tools with persistent navigation. Linear, VS Code, Figma, and Notion all use it.

**What to adopt**:
```
+--+------------------------------------------+
|  |  Header (view title, filters, actions)    |
|S |------------------------------------------+
|I |                                          |
|D |          Main Content Area               |
|E |        (beats, editor, timeline,         |
|B |         character graph, etc.)            |
|A |                                          |
|R |                                          |
|  +------------------------------------------+
|  |  Optional: Detail Panel (right sidebar)   |
+--+------------------------------------------+
```

- Left sidebar: persistent navigation (collapsible).
- Top header: contextual to current view (view title, filters, display options, actions).
- Main content: the active workspace.
- Optional right panel: detail/properties sidebar for selected item (toggle with `Cmd+I`).

### 7.11 Speed Perception Techniques

**Why**: Even when actual performance is good, perceived speed matters more for user satisfaction.

**What to adopt**:
- **60fps animations** for all user-triggered transitions.
- **200ms transition duration** for state changes (optimal perceived responsiveness).
- **300-500ms for navigation transitions** (enough to register change without feeling slow).
- **Skeleton screens** for initial data loading (not spinners).
- **Instant keyboard response**: Key press -> immediate visual feedback, even if the operation is still processing.
- **Prefetch adjacent data**: When viewing beats, preload timeline data in background for instant view switching.
- **`prefers-reduced-motion`** media query support for accessibility.

### 7.12 Triage / Inbox Pattern for AI Suggestions

**Why**: StoryForge's AI analysis will generate proposed entities, contradictions, and suggestions. These need a structured review flow, not just notifications.

**What to adopt**:
- An "AI Suggestions" triage inbox where extracted entities, contradiction flags, and analysis results land.
- Structured review flow: Accept / Edit / Dismiss for each suggestion.
- Batch actions for accepting multiple suggestions at once.
- Clear confidence indicators (high/medium/low) for AI suggestions.
- Keyboard shortcuts for rapid triage (`A` accept, `D` dismiss, `E` edit).

---

## Sources

### Linear Official
- [Linear Conceptual Model](https://linear.app/docs/conceptual-model)
- [How We Redesigned the Linear UI (Part II)](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Behind the Latest Design Refresh](https://linear.app/now/behind-the-latest-design-refresh)
- [UI Refresh Changelog (2026-03-12)](https://linear.app/changelog/2026-03-12-ui-refresh)
- [Invisible Details - Building Contextual Menus](https://linear.app/now/invisible-details)
- [Design Is More Than Code](https://linear.app/now/design-is-more-than-code)
- [Custom Views Documentation](https://linear.app/docs/custom-views)
- [Filters Documentation](https://linear.app/docs/filters)
- [Triage Documentation](https://linear.app/docs/triage)
- [Inbox Documentation](https://linear.app/docs/inbox)
- [Projects Documentation](https://linear.app/docs/projects)
- [Display Options Documentation](https://linear.app/docs/display-options)
- [Start Guide](https://linear.app/docs/start-guide)
- [Undo Actions Changelog](https://linear.app/changelog/undo-actions)
- [Personalized Sidebar Changelog](https://linear.app/changelog/2024-12-18-personalized-sidebar)

### Case Studies & Analysis
- [Linear App Case Study: How to Build a $400M Issue Tracker - Eleken](https://www.eleken.co/blog-posts/linear-app-case-study)
- [The Linear Method: Opinionated Software - Figma Blog](https://www.figma.com/blog/the-linear-method-opinionated-software/)
- [Linear: When Opinionated Products Win - Aryan Varma](https://medium.com/@aryan1999varma/linear-when-opinionated-products-win-e47e01c80756)
- [Linear Deep Dive: How They Built a $1.25B Unicorn - Aakash Gupta](https://www.news.aakashg.com/p/how-linear-grows)
- [I Finally Tried Linear and Now I Get the Hype](https://medium.com/@ananyavhegde2001/i-finally-tried-linear-and-now-i-get-the-hype-c5d488840278)

### Technical Architecture
- [Reverse Engineering Linear's Sync Magic](https://marknotfound.com/posts/reverse-engineering-linears-sync-magic/)
- [Linear's Sync Engine Architecture - Fujimon](https://www.fujimon.com/blog/linear-sync-engine)
- [Linear Sent Me Down a Local-First Rabbit Hole - Bytemash](https://bytemash.net/posts/i-went-down-the-linear-rabbit-hole/)

### Onboarding
- [Linear Onboarding Flow - Supademo](https://supademo.com/user-flow-examples/linear)
- [Linear Onboarding Flow - Page Flows](https://pageflows.com/post/desktop-web/onboarding/linear/)
- [Hands-on Learning: Linear's Thoughtful Onboarding - Lulu Wang](https://medium.com/design-bootcamp/hands-on-learning-cinematic-transition-linears-thoughtful-onboarding-aa4f16c33d90)
- [How Linear Welcomes New Users - fmerian](https://fmerian.medium.com/delightful-onboarding-experience-the-linear-ftux-cf56f3bc318c)

### UX Patterns
- [Command Palette UX Patterns - Alicja Suska](https://medium.com/design-bootcamp/command-palette-ux-patterns-1-d6b6e68f30c1)
- [Command K Bars - Maggie Appleton](https://maggieappleton.com/command-bar)
- [How to Build a Remarkable Command Palette - Superhuman](https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/)
- [Command Palette UI Design - Mobbin](https://mobbin.com/glossary/command-palette)
- [Linear Design: The SaaS Trend - LogRocket](https://blog.logrocket.com/ux-design/linear-design/)

### Keyboard Shortcuts
- [Linear Keyboard Shortcuts - KeyCombiner](https://keycombiner.com/collections/linear/)
- [Linear Shortcuts - Shortcuts.design](https://shortcuts.design/tools/toolspage-linear/)
- [Invisible Details (Medium) - Andreas Eldh](https://medium.com/linear-app/invisible-details-2ca718b41a44)

### Reviews
- [Linear Reviews 2026 - G2](https://www.g2.com/products/linear/reviews)
- [Linear Pros and Cons - G2](https://www.g2.com/products/linear/reviews?qs=pros-and-cons)
- [Linear Reviews 2026 - Product Hunt](https://www.producthunt.com/products/linear/reviews)
- [Linear Review 2026 - Efficient App](https://efficient.app/apps/linear)
- [Linear App Review 2026 - Siit.io](https://www.siit.io/tools/trending/linear-app-review)
- [Linear Review - The Digital Project Manager](https://thedigitalprojectmanager.com/tools/linear-review/)
- [Linear Reviews 2026 - TrustRadius](https://www.trustradius.com/products/linear/reviews)
- [Linear Guide: Setup & Best Practices - Morgen](https://www.morgen.so/blog-posts/linear-project-management)

### Radix & Component Architecture
- [Linear Case Study - Radix Primitives](https://www.radix-ui.com/primitives/case-studies/linear)
