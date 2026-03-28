# StoryForge User Flows -- Screen-by-Screen UI Specification

This document specifies every user journey in StoryForge at the screen level. It serves as the definitive reference for frontend implementation. Each flow describes the layout, available actions, state transitions, data displayed, navigation connections, and handling of loading, empty, and error states.

Route references follow the Next.js App Router structure defined in the project.

---

## Table of Contents

1. [Onboarding and Setup](#1-onboarding-and-setup)
   - 1.1 Sign Up / Sign In
   - 1.2 Create First Story World
   - 1.3 Guided Tour / Feature Introduction
2. [Core Workflows](#2-core-workflows)
   - 2.1 Story World Dashboard
   - 2.2 Writing Surface
   - 2.3 Beat Sheet / Scene Board
   - 2.4 Treatment View
   - 2.5 Story Sidebar
3. [Ingestion](#3-ingestion)
   - 3.1 Source Material Upload
   - 3.2 Entity Review
   - 3.3 Source Material Viewer
4. [Visualization and Analysis](#4-visualization-and-analysis)
   - 4.1 Dual Timeline
   - 4.2 Character Relationship Map
   - 4.3 Arc Diagram
   - 4.4 Mind Map / World Map
   - 4.5 Pacing Heatmap
   - 4.6 Emotional Arc Chart
   - 4.7 Faction / Power Map
   - 4.8 Foreshadowing Web
   - 4.9 Causality Graph
   - 4.10 Audience Knowledge Map
5. [Advanced Features](#5-advanced-features)
   - 5.1 What-If Scenarios
   - 5.2 Canon Management
   - 5.3 Consistency Checker
   - 5.4 AI Assist Wand
   - 5.5 Multi-Framework Overlay
   - 5.6 Character Interview
   - 5.7 Wiki / Encyclopedia
   - 5.8 Magic/Tech System Designer
   - 5.9 Custom Calendar
6. [Collaboration](#6-collaboration)
   - 6.1 Writers Room
   - 6.2 Fog-of-War Access
   - 6.3 Comments and Mentions
7. [Export and Sharing](#7-export-and-sharing)
   - 7.1 Series Bible Export
   - 7.2 Screenplay Export
   - 7.3 Shareable Web Link

---

## 1. Onboarding and Setup

### 1.1 Sign Up / Sign In

**Route:** `/(auth)/signup` and `/(auth)/signin`

#### Screen Layout

- Centered card on a full-bleed background (subtle gradient or ambient illustration).
- Card contains the StoryForge logo at the top, a tab bar toggling between "Sign In" and "Sign Up", and the form fields below.
- No sidebar, no top navigation. The page is self-contained.

#### Sign Up Form Fields

- Display name (text input, required)
- Email address (text input, required, validated)
- Password (text input, required, minimum 8 characters, strength indicator bar beneath)
- "Create Account" primary button
- Divider with "or continue with"
- OAuth buttons: Google, GitHub (horizontal row, icon + label)
- Footer link: "Already have an account? Sign in"

#### Sign In Form Fields

- Email address (text input)
- Password (text input, show/hide toggle icon)
- "Forgot password?" link aligned right beneath password field
- "Sign In" primary button
- Same OAuth row and footer link ("Don't have an account? Sign up")

#### User Actions

| Action | Result |
|---|---|
| Submit sign-up form | Validate all fields client-side. On success, POST to `/api/auth/signup`. On 201, redirect to onboarding (1.2). On error, show inline error beneath the relevant field. |
| Submit sign-in form | POST to `/api/auth/signin`. On success, redirect to `/worlds` (or the last-visited world if one exists). On error, show "Invalid email or password" beneath the form. |
| Click OAuth button | Redirect to OAuth provider. On callback success, same redirect logic as sign-in. |
| Click "Forgot password?" | Navigate to `/(auth)/forgot-password`. Shows email input and "Send Reset Link" button. On submit, show confirmation message. |

#### State Transitions

- **Submitting**: Button shows spinner, inputs disabled.
- **Error**: Red border on the offending field, error message in red text directly below it. Form remains editable.
- **OAuth in progress**: Overlay with spinner and "Redirecting to [Provider]..." text.

#### Loading States

- Initial page load: skeleton card with pulsing placeholders for the form fields (resolves instantly for static page).

#### Error States

- Network failure: toast notification "Unable to reach StoryForge. Check your connection." with retry option.
- Rate limiting: "Too many attempts. Try again in X seconds." displayed beneath the submit button.
- OAuth failure: redirect back to sign-in with query param `?error=oauth_failed`, displayed as a dismissible banner above the form.

#### Navigation

- From: direct URL, marketing site, or any unauthenticated route redirect.
- To: `/worlds` (returning user) or Create First Story World flow (new user with zero worlds).

---

### 1.2 Create First Story World

**Route:** `/(dashboard)/worlds/new`

This flow is also reusable for creating additional worlds later; the first-time version includes a welcome header.

#### Screen Layout

- Dashboard shell is visible (top nav bar with StoryForge logo, user avatar menu on the right).
- Left sidebar is collapsed or hidden (no worlds exist yet to navigate).
- Main content area: a centered, single-column form card, max-width 640px.
- For first-time users: a welcome banner above the form reading "Welcome to StoryForge. Let's build your first story world."

#### Form Fields (stepped wizard, 3 steps)

**Step 1 -- Basics**

- World name (text input, required, max 100 characters, auto-focuses on mount)
- Logline (text input, optional, max 200 characters, helper text: "One sentence that captures your story")
- Genre selector (multi-select dropdown with predefined genres: Fantasy, Sci-Fi, Thriller, Romance, Horror, Literary Fiction, Historical, Mystery, Comedy, Drama, Western, Other; plus free-text custom entry)
- Media type (radio group: Novel, Screenplay -- Film, Screenplay -- TV, Game, Short Story, Other)
- "Next" button right-aligned. "Back" link is hidden on step 1.

**Step 2 -- Synopsis**

- Synopsis (textarea, optional but prominently recommended, max 2000 characters)
- Helper text beneath: "A synopsis unlocks AI-powered analysis and the Assist Wand. You can add this later from the Story Sidebar."
- Character count indicator in bottom-right corner of the textarea.
- "Back" and "Next" buttons.

**Step 3 -- Structure (optional)**

- Story mode toggle: Film (Act 1/2/3) or TV (Season/Episode/Act/Scene). Default: Film.
- Starting structure template (dropdown, optional): None, Hero's Journey, Save the Cat, Dan Harmon Story Circle, Freytag's Pyramid, Kishotenketsu, Seven-Point, Todorov, Dramatica, Propp. Default: None.
- Custom calendar toggle (off by default, with note: "Enable if your world uses a non-standard time system. Configure later in Settings.")
- "Back" and "Create World" primary button.

#### User Actions

| Action | Result |
|---|---|
| Fill step 1, click Next | Validate world name is non-empty. Advance progress indicator to step 2. Scroll to top. |
| Fill step 2, click Next | No validation required (synopsis is optional). Advance to step 3. |
| Click "Create World" | POST to `/api/worlds`. On 201, redirect to the new world's dashboard at `/world/[id]`. On error, show toast. |
| Click Back on any step | Return to previous step. Form data is preserved in local state. |
| Press Escape or click outside (if modal variant) | Prompt "Discard this world?" confirmation dialog. |

#### State Transitions

- Progress indicator (3 dots or step labels) at the top of the form shows current step.
- "Create World" button: on click, shows spinner and disables. On success, brief confetti/success animation before redirect.

#### Loading States

- Page load: instant (static form). No data to fetch.
- Submission: spinner on the button, form fields disabled.

#### Empty States

- Not applicable (this is a creation form).

#### Error States

- World name blank: red border, "Give your world a name" inline error on attempted Next.
- Network failure on submit: toast with "Failed to create world. Your data is saved locally -- try again." Retry button in toast.
- Duplicate world name (if enforced): inline error "You already have a world with this name."

#### Navigation

- From: `/worlds` page (explicit "New World" button), or automatic redirect for first-time users after sign-up.
- To: `/world/[id]` (the new world's dashboard).

---

### 1.3 Guided Tour / Feature Introduction

**Route:** Overlay on `/world/[id]` (first visit to a new world)

#### Screen Layout

- The world dashboard renders normally underneath.
- A semi-transparent overlay with a spotlight/highlight mechanism illuminates one UI element at a time.
- A tooltip-style card (max-width 320px) anchored to the highlighted element contains the tour step content.
- Progress indicator at the bottom of the tooltip: "Step 3 of 8" with dot indicators.
- "Skip Tour" link in the top-right corner of the tooltip.

#### Tour Steps

| Step | Highlighted Element | Tooltip Content |
|---|---|---|
| 1 | Story Sidebar toggle | "This is your Story Sidebar. It holds your synopsis, world summary, and character quick-list. Fill in a synopsis to unlock AI features." |
| 2 | Writing Surface nav item | "Write your manuscript or screenplay here. Switch between prose and screenplay modes." |
| 3 | Beat Sheet nav item | "Organize your story with beat cards. Drag and drop to reorder. Each beat syncs to your treatment and script." |
| 4 | Treatment nav item | "Your treatment auto-generates from your beats. Export it as PDF or DOCX anytime." |
| 5 | Sources nav item | "Upload source material -- text, audio, video, images. StoryForge extracts characters, locations, and events automatically." |
| 6 | Timeline nav item | "Visualize your story chronologically and in narrative order with the dual timeline." |
| 7 | Characters nav item | "Explore your character relationship map. See how connections evolve over time." |
| 8 | AI Wand icon (in sidebar or toolbar) | "The AI Assist Wand helps generate beat descriptions and draft script sections. It activates once you write a synopsis. You always review suggestions before accepting." |

#### User Actions

| Action | Result |
|---|---|
| Click "Next" on tooltip | Advance to next step. Spotlight animates to next element. |
| Click "Back" on tooltip | Return to previous step. |
| Click "Skip Tour" | Dismiss overlay. Set `tour_completed` flag in user preferences. |
| Click "Done" on final step | Dismiss overlay. Set flag. |
| Click anywhere outside tooltip | No action (prevent accidental dismissal). |
| Press Escape | Same as "Skip Tour". |

#### State Transitions

- Tour state is stored in user preferences (local + server). Once completed or skipped, it does not re-trigger.
- If the user navigates away mid-tour and returns, the tour resumes from where they left off (or does not show if they already completed/skipped).

#### Loading States

- Tour loads after the dashboard content has rendered. If the dashboard is still loading, the tour waits.

#### Error States

- None meaningful. If the tour state fails to save, it silently retries. Worst case, the user sees the tour again on next visit.

#### Navigation

- From: automatic on first visit to any new world.
- To: the user stays on the dashboard; the tour is an overlay.

---

## 2. Core Workflows

### 2.1 Story World Dashboard

**Route:** `/(dashboard)/world/[id]`

#### Screen Layout

- **Top Bar**: StoryForge logo (left), breadcrumb showing "Worlds > [World Name]", global search input (cmd+K shortcut), notification bell, user avatar menu (right).
- **Left Sidebar** (persistent, collapsible): World navigation tree.
  - World name and genre badge at the top.
  - Story Sidebar toggle button.
  - Navigation links grouped by category:
    - **Write**: Writing Surface, Beat Sheet, Treatment
    - **Analyze**: Timeline, Characters, Arcs, Pacing, Emotional Arcs
    - **Explore**: Mind Map, Factions, Causality, Foreshadowing, Knowledge
    - **Manage**: Sources, Wiki, Canon, Consistency, What-If, Systems, Settings
  - Each link shows an icon and label. Active link is highlighted.
  - Collapse button at bottom of sidebar (collapses to icon-only mode).
- **Main Content Area**: Dashboard overview with the following sections arranged in a responsive grid (2 columns on desktop, 1 on tablet).

#### Dashboard Sections

**World Overview Card (full width)**
- World name (h1), logline beneath, genre badges, media type badge, creation date.
- "Edit World" button (opens inline edit or modal).
- Synopsis preview (first 200 characters, "Read more" to expand, "Edit in Sidebar" link).

**Quick Stats Row (4 cards, equal width)**
- Characters: count, with "+N new this week" delta.
- Scenes/Beats: count of beats, count of scenes.
- Word Count: total words in writing surface, progress bar if target is set.
- Source Materials: count of ingested files.

**Recent Activity Feed (left column)**
- Chronological list of recent actions (last 20):
  - "[User] created character [Name]" with timestamp.
  - "[User] edited beat [Title]" with timestamp.
  - "[User] uploaded [filename]" with timestamp.
  - Each entry is clickable, navigating to the relevant entity.
- "View All Activity" link at bottom.

**Quick Actions Card (right column)**
- Prominent buttons:
  - "Start Writing" (goes to Writing Surface)
  - "Add Beat" (goes to Beat Sheet with new-beat modal open)
  - "Upload Source Material" (goes to Sources with upload modal open)
  - "View Character Map" (goes to Characters)
- If synopsis is empty: a yellow callout card reading "Add a synopsis to unlock AI features" with a "Open Sidebar" button.

**Consistency Alerts (conditional, full width)**
- If the consistency checker has found issues: an amber card listing the top 3 contradictions with severity badges. "View All" link to Consistency Checker.
- If no issues or checker has not run: this section is hidden.

**Structure Progress (conditional, full width)**
- If a structure template is applied: a horizontal progress bar showing how many structure beats have been mapped. Unmapped beats are listed. Link to Arc Diagram.
- If no template: a card suggesting "Apply a story structure template to track your progress" with a dropdown to select one.

#### User Actions

| Action | Result |
|---|---|
| Click any nav link in sidebar | Navigate to the corresponding world sub-page. Active link updates. |
| Click "Edit World" | Open modal with world name, logline, genre, media type fields. Save updates via PATCH to `/api/worlds/[id]`. |
| Click a recent activity item | Navigate to that entity's detail view (character page, beat sheet filtered to that beat, etc.). |
| Click a quick action button | Navigate to the target page, optionally with a query parameter to trigger a specific action (e.g., `?action=new-beat`). |
| Collapse/expand sidebar | Sidebar animates between full (240px) and icon-only (64px) modes. Preference is persisted. |
| Use global search (cmd+K) | Opens command palette overlay. See below. |

**Command Palette (Global Search)**
- Triggered by cmd+K (mac) or ctrl+K (windows) from any page within a world.
- Modal overlay with a text input at the top.
- As the user types, results appear grouped by type: Characters, Locations, Scenes, Beats, Source Materials, Wiki Entries.
- Each result shows icon, name, and type badge.
- Clicking a result navigates to that entity. Arrow keys for selection, Enter to navigate, Escape to close.
- If the world has embeddings, results also include semantic/creative-intent matches (marked with a sparkle icon).

#### Loading States

- Dashboard sections load independently. Each card shows a skeleton placeholder (pulsing gray rectangles matching the card layout) until its data resolves.
- Stats row: four skeleton rectangles with pulsing animation.
- Activity feed: 5 skeleton list items.

#### Empty States

- **Brand new world (nothing created yet)**: The dashboard shows a simplified layout:
  - Overview card with world name/logline.
  - A single large card in the center: "Your story world is empty. Here's how to get started:" followed by three illustrated action cards: "Write your first scene", "Create your first beat", "Upload source material". Each is a link to the respective page.
  - Stats row shows all zeros.
  - Activity feed shows "No activity yet."

#### Error States

- Failed to load world (404): Full-page error with "World not found" message and "Back to Worlds" button.
- Failed to load a dashboard section: That specific card shows "Failed to load. Retry?" with a retry button. Other cards remain functional.
- Network failure: Toast notification at the top.

#### Navigation

- From: `/worlds` list page (click a world), or direct URL.
- To: Any sub-page of the world via the sidebar nav.

---

### 2.2 Writing Surface

**Route:** `/(dashboard)/world/[id]/write`

#### Screen Layout

- **Top Bar**: Same global bar as dashboard, plus a mode toggle and toolbar specific to the writing surface.
- **Left Sidebar**: World navigation (same as dashboard). Can be collapsed for more writing space.
- **Story Sidebar** (right panel, togglable): See section 2.5 for full spec. Width ~320px, can be collapsed.
- **Toolbar** (horizontal, beneath top bar):
  - Mode toggle: "Prose" | "Screenplay" (pill-style toggle, currently active mode is filled).
  - Formatting tools (contextual based on mode):
    - Prose mode: Bold, Italic, Underline, Strikethrough, Heading levels (H1-H3), Blockquote, Ordered list, Unordered list, Link, Image.
    - Screenplay mode: Slugline, Action, Character (cue), Dialogue, Parenthetical, Transition. Each button applies formatting to the current line/selection.
  - AI Wand button (sparkle icon) -- grayed out and shows tooltip "Add a synopsis to enable" if no synopsis exists.
  - Split View toggle (icon: two columns).
  - Focus Mode toggle (icon: expand/maximize).
  - Word count display: "[current] / [target] words" (target editable on click, or just "[current] words" if no target set).
  - Chapter/Scene navigator dropdown (shows structural hierarchy of the document).
- **Main Editor Area**: TipTap editor occupying remaining space.
  - Prose mode: Standard rich-text editing with chapter and scene structural markers (rendered as distinct visual blocks with headers).
  - Screenplay mode: Lines auto-format based on element type. Sluglines are bold caps, character names centered and caps, dialogue centered with narrower width, parentheticals in parens below character name, transitions right-aligned caps.
  - Entity highlighting: Recognized character names, location names, and significant objects are underlined with a subtle colored underline (characters = blue, locations = green, objects = purple). Hovering shows a tooltip with entity summary. Clicking opens a popover with entity details and a "View Full Profile" link.
  - Cursor position indicator in bottom-right: "Chapter 3 > Scene 2 > Paragraph 14" breadcrumb.

#### Structural Hierarchy Panel (left edge of editor, collapsible)

- A narrow column (200px) showing the document outline:
  - Film mode: Act 1 / Act 2 / Act 3, with scenes nested beneath.
  - TV mode: Season > Episode > Act > Scene hierarchy.
  - Prose mode: Part > Chapter > Scene hierarchy.
- Each item is clickable (scrolls editor to that section).
- Drag-and-drop reordering of scenes within acts or chapters.
- Right-click context menu: Rename, Delete, Add Scene After, Move to Act...
- Active section is highlighted based on cursor position in editor.

#### Focus Mode

- Activated via toolbar toggle or keyboard shortcut (cmd+shift+F).
- Hides: top bar, left sidebar, story sidebar, toolbar (except word count), structural hierarchy.
- Shows: the editor full-screen with generous margins, a very faint "Exit Focus Mode" button in the top-right corner, and the word count at the bottom.
- Typing-focused: text fades except for the current paragraph and the paragraph above/below.
- Press Escape to exit.

#### Split View

- Activated via toolbar toggle.
- Editor occupies left 60% of the content area.
- Right 40% shows a panel with tabs:
  - "Source Material" (select a source to view side-by-side).
  - "Beat Sheet" (shows beats in a compact list, click to scroll editor to corresponding section).
  - "Notes" (free-text scratchpad per scene).
- Divider between panels is draggable to resize.

#### User Actions

| Action | Result |
|---|---|
| Type in editor | Text is saved continuously (debounced autosave every 2 seconds). Unsaved indicator appears in top bar during edits, disappears on save. |
| Toggle Prose/Screenplay mode | Editor reformats content. Structural markers are preserved. A confirmation dialog appears if switching would lose formatting: "Switching modes will reformat your text. Continue?" |
| Apply formatting (toolbar or shortcut) | Selected text or current line gains formatting. In screenplay mode, the current line's element type changes. |
| Click entity highlight | Popover with entity name, type, brief description, and "View Full Profile" link (navigates to Characters, Wiki, etc.). |
| Click chapter/scene in hierarchy panel | Editor scrolls to that section smoothly. |
| Drag scene in hierarchy panel | Scene reorders within the structural hierarchy. Confirmation if cross-act move. |
| Click AI Wand | If synopsis exists: opens AI Assist panel (see section 5.4). If no synopsis: tooltip "Add a synopsis in the Story Sidebar first." |
| Set word count target | Click the word count display, input field appears for target. Set via Enter. Progress bar appears beneath the count. |
| Use keyboard shortcuts | Standard: cmd+B (bold), cmd+I (italic), etc. Screenplay-specific: Tab cycles through element types (slugline > action > character > dialogue > parenthetical). |

#### Loading States

- Initial load: editor skeleton (pulsing lines simulating paragraphs of text) in the main area. Structural hierarchy shows skeleton items.
- Autosave: small "Saving..." text in the toolbar, replaced by "Saved" with a checkmark that fades after 2 seconds.

#### Empty States

- New world with no writing: Editor shows centered placeholder text: "Start writing your story here. Use the toolbar above to switch between prose and screenplay modes." Below: a "Create from Beat" button if beats exist ("Generate a draft from your beat descriptions") or "Create First Beat" link if no beats exist.

#### Error States

- Autosave failure: persistent amber banner at top of editor: "Unable to save. Your changes are stored locally. Retrying..." with manual "Retry Now" button.
- Failed to load document: error card in editor area with "Failed to load your manuscript. Retry?" button.
- Entity highlighting failure (AI service down): entity highlights simply do not appear; no error shown to user (graceful degradation).

#### Navigation

- From: Dashboard quick action "Start Writing", sidebar nav "Writing Surface", or beat card click in Beat Sheet.
- To: Any world sub-page via sidebar. Beat Sheet (via split view or direct nav). Source Material Viewer (via split view). Character/entity profiles (via entity highlight clicks).

---

### 2.3 Beat Sheet / Scene Board

**Route:** `/(dashboard)/world/[id]/beats`

#### Screen Layout

- **Top Bar**: Global bar with world breadcrumb.
- **Left Sidebar**: World navigation.
- **Toolbar** (horizontal, beneath top bar):
  - "Add Beat" button (primary, left-aligned).
  - View toggle: "Board" (kanban) | "List" (table) -- pill toggle.
  - Filter controls:
    - Star rating filter: 5 clickable stars (click a star to filter >= that rating, click again to clear).
    - Tag filter: multi-select dropdown of all tags used in this world.
    - Character filter: multi-select dropdown of all characters.
    - Structure beat filter (if a template is applied): dropdown of template beats.
    - "Reset Filters" button (appears only when any filter is active, right of filter row).
  - Sort dropdown: "Manual Order" (default, drag-and-drop), "By Star Rating", "By Date Created", "By Date Modified".
- **Main Content Area**: The beat board.
- **Mini-map Navigator** (bottom-left corner, 200x120px):
  - A zoomed-out thumbnail view of the entire board.
  - A highlighted rectangle shows the current viewport.
  - Drag the rectangle to pan the board.
  - Click anywhere on the mini-map to jump to that position.

#### Board View (Kanban)

- Columns represent structural divisions:
  - Film mode: "Act 1", "Act 2A", "Act 2B", "Act 3" columns.
  - TV mode: "Episode [N]" columns, with acts as horizontal swim lanes within each column.
  - If a structure template is applied: columns are named after template beats (e.g., Save the Cat: "Opening Image", "Theme Stated", "Set-Up", "Catalyst", ...).
  - If no structure: a single scrollable row of cards in manual order, with an "Add Column" button to create custom groupings.
- Each column has a header with: column name, beat count badge, collapse/expand toggle.
- Beat cards within columns are vertically stacked, scrollable within the column.

#### Beat Card Anatomy

Each card (width: fill column, min-height: 120px) contains:

- **Color bar** (4px, left edge): user-assigned color from a palette of 12 colors.
- **Star rating** (top-right corner): 1-5 filled/empty stars. Click to set.
- **Title** (bold, 1 line, truncated with ellipsis): editable inline on double-click.
- **Description** (2-3 lines, gray text, truncated): editable on card expand.
- **Character avatars** (bottom-left): small circular avatars of assigned characters (max 3 shown, "+N" overflow).
- **Tags** (bottom, wrapping): small colored badges.
- **AI Wand icon** (bottom-right): sparkle icon, gray if synopsis is empty, blue if available. Click triggers AI generation for this beat.
- **Notes indicator** (small icon if notes exist on this beat).
- **Link indicator** (small chain icon if this beat is linked to a script section).

#### Beat Card Expanded View (Modal/Drawer)

Clicking a beat card opens a detail drawer (slides in from the right, 480px wide) or a centered modal:

- **Title** (editable text input).
- **Description** (editable textarea, rich text via TipTap).
- **Star Rating** (clickable 1-5 stars, larger than on card).
- **Color** (palette selector, 12 colors).
- **Characters** (multi-select dropdown of world characters, with avatar previews).
- **Tags** (tag input with autocomplete from existing tags, ability to create new tags).
- **Notes** (textarea for private notes, markdown supported).
- **Structure Beat Mapping** (dropdown: which structure beat does this map to, e.g., "Catalyst" in Save the Cat).
- **Linked Script Section** (shows linked section name if any, with "Go to Script" button and "Unlink" option).
- **AI Wand Section** (at bottom):
  - "Generate Title Suggestion" button.
  - "Generate Description Suggestion" button.
  - Both disabled if no synopsis. Both show AI output in a suggestion card below with "Accept", "Edit", "Dismiss" buttons.
- **Timestamps**: "Created [date], Last modified [date]".
- **Delete Beat** button (bottom, red, with confirmation dialog).
- Close button (X) in top-right of drawer.

#### List View

- A table with columns: Drag handle | Color | Star Rating | Title | Description (truncated) | Characters | Tags | Structure Beat | Actions (edit, delete).
- Rows are draggable for reordering.
- Click a row to open the expanded view.
- Column headers are sortable (click to sort ascending/descending).

#### User Actions

| Action | Result |
|---|---|
| Click "Add Beat" | Opens expanded view drawer with all fields empty. Focus on Title input. Save creates the beat at the end of the current column/list. |
| Drag and drop a card | Card moves to new position. All beat order indices update. Treatment auto-regenerates (debounced). Toast: "Beat order updated. Treatment syncing..." |
| Click a beat card (board view) | Opens expanded view drawer. |
| Double-click card title | Inline edit mode on the title. Enter to save, Escape to cancel. |
| Click star rating on card | Toggles that star. Updates immediately (optimistic). |
| Click AI Wand on card | If synopsis exists: triggers AI generation for the beat (see section 5.4). If not: tooltip "Add a synopsis first." |
| Apply a filter | Board/list immediately filters to matching beats. Non-matching cards are hidden. Filter state is shown in a "Filtered by: [criteria]" pill bar above the board. |
| Click "Reset Filters" | All filters cleared. All beats visible. |
| Click card's link indicator | Navigates to Writing Surface, scrolled to the linked script section. |
| Click mini-map viewport | Board pans to that position. |
| Drag mini-map rectangle | Board pans in real time. |

#### Loading States

- Initial load: column headers render immediately. Cards show skeleton placeholders (pulsing rectangles with placeholder lines for title and description). Mini-map is empty until cards load.
- Moving a card: ghost card follows cursor. Original position shows a dotted outline placeholder.

#### Empty States

- **No beats created**: The board area shows a centered empty state illustration (a blank kanban board sketch). Headline: "No beats yet." Subtext: "Beats are the building blocks of your story. Each beat represents a key moment." CTA button: "Create Your First Beat." Secondary link: "Import beats from source material" (navigates to Sources).
- **All beats filtered out**: "No beats match your filters." with "Reset Filters" button.

#### Error States

- Failed to save beat reorder: toast "Failed to update beat order. Reverting." Board reverts to previous order.
- Failed to load beats: error card in main area with retry button.
- Failed to delete beat: toast "Failed to delete beat. Try again."

#### Navigation

- From: Dashboard, sidebar nav, Treatment View (click a treatment section to open corresponding beat).
- To: Writing Surface (via card link or "Go to Script" in expanded view). Character profiles (via character avatar click). AI Wand flow (via wand icon).

---

### 2.4 Treatment View

**Route:** `/(dashboard)/world/[id]/treatment`

#### Screen Layout

- **Top Bar**: Global bar.
- **Left Sidebar**: World navigation.
- **Toolbar** (horizontal):
  - "Export" dropdown button: PDF, DOCX, Plain Text.
  - "Refresh" button (force-regenerate treatment from current beat order).
  - "Show Beat Links" toggle (when on, each treatment section shows a small link icon that navigates to the corresponding beat card).
  - Print button.
  - Last synced timestamp: "Synced with beats: [timestamp]".
- **Main Content Area**: The treatment document, rendered as a single-column, print-ready document layout (white background, max-width 720px, centered, with generous margins).

#### Document Structure

The treatment is assembled from beats in their current order:

- **Title page section**: World name (h1), logline (subtitle), genre and media type, date generated.
- **Body**: Each beat becomes a section:
  - **Beat title** (h3, bold).
  - **Beat description** (paragraph text beneath).
  - If structure template is applied: structure beat name in parentheses after the beat title, e.g., "The Discovery (Catalyst)".
  - Character names mentioned in descriptions are rendered as subtle highlights (same entity highlighting as writing surface).
  - If "Show Beat Links" is on: a small link icon in the left margin of each section.

#### Manual Overrides

- Each treatment section is editable. Clicking a section enters inline edit mode (TipTap editor appears in place).
- Edited sections show a small "Modified" badge and a "Revert to Auto" button.
- When the corresponding beat changes, a notification appears: "Beat [Title] was updated. Your manual override for this section may be out of date." with "Update from Beat" and "Keep Override" options.

#### User Actions

| Action | Result |
|---|---|
| Read treatment | Scroll through the document. Content updates in real time as beats change. |
| Click a beat link icon | Navigates to Beat Sheet with that beat's expanded view open. |
| Click on a section to edit | Section becomes editable. "Modified" badge appears. Autosaves on blur or after 2 seconds of inactivity. |
| Click "Revert to Auto" on a section | Confirmation dialog: "Revert to auto-generated text? Your edits will be lost." On confirm, section regenerates from beat description. |
| Click Export > PDF | Generates a styled PDF. Download dialog or new-tab preview. |
| Click Export > DOCX | Generates a .docx file. Browser download. |
| Click Export > Plain Text | Generates a .txt file. Browser download. |
| Click "Refresh" | Regenerates all non-overridden sections from current beat state. Overridden sections are untouched. Toast: "Treatment synced with latest beats." |
| Click Print | Opens browser print dialog with print-optimized CSS. |

#### Loading States

- Initial load: document skeleton (pulsing rectangles for title, subtitle, and multiple paragraph blocks).
- Export generation: button shows spinner, disabled until complete. Toast: "Generating PDF..." then "Download ready."

#### Empty States

- **No beats exist**: Centered message: "Your treatment will appear here once you create beats. Each beat becomes a section in your treatment document." CTA: "Go to Beat Sheet" button.

#### Error States

- Export failure: toast "Failed to generate export. Try again."
- Failed to load treatment: error card with retry.
- Beat sync failure: amber banner "Treatment may be out of sync with your beats." with "Retry Sync" button.

#### Navigation

- From: Dashboard, sidebar nav, Beat Sheet (via "View Treatment" link if present).
- To: Beat Sheet (via beat link icons). Writing Surface (via entity clicks).

---

### 2.5 Story Sidebar

**Route:** Overlay panel on any world sub-page (not a separate route)

#### Screen Layout

The Story Sidebar is a persistent right-hand panel, togglable from any page within a world. Width: 320px. Slides in/out with animation.

- **Toggle button**: Located in the top bar, right side (icon: sidebar/panel icon). Keyboard shortcut: cmd+\.
- **Sidebar Header**: "Story Sidebar" title, close (X) button.
- **Sections** (vertically stacked, each collapsible):

**Section 1: Synopsis**
- Textarea (TipTap mini-editor, supports basic formatting).
- Character count: "[N] / 2000 characters".
- If empty: yellow background with prompt text "Write a synopsis to unlock AI features. Even a single sentence helps."
- If filled: normal background. A small sparkle icon next to the section header indicating "AI features enabled."
- "Expand" link opens a larger editing modal for the synopsis.

**Section 2: World Summary**
- Auto-generated stats:
  - Characters: [count]
  - Locations: [count]
  - Scenes: [count]
  - Beats: [count]
  - Word Count: [total]
  - Source Materials: [count]
  - Arcs: [count]
- Each stat is a clickable link navigating to the corresponding section.
- If a structure template is applied: "Structure: [Template Name]" with a progress fraction (e.g., "8/15 beats mapped").

**Section 3: Character Quick-List**
- Scrollable list of characters (max 20 shown, "View All" link).
- Each entry: avatar (or initials circle), name, brief role/description (1 line).
- Click a character to navigate to their profile.
- "Add Character" button at the bottom.

**Section 4: Recent Notes** (collapsible, collapsed by default)
- Last 5 notes from beat cards or scene notes.
- Each shows a truncated preview with a "View" link.

#### User Actions

| Action | Result |
|---|---|
| Toggle sidebar open/closed | Sidebar slides in (320px) or out. Content area adjusts width. Preference is persisted per user. |
| Edit synopsis | Text updates immediately. Autosaves on blur/debounce. If this is the first time a synopsis is added, a subtle animation plays on the AI Wand button across the app (indicating it is now enabled). |
| Click a stat link | Navigate to the corresponding page (e.g., Characters page). |
| Click a character | Navigate to that character's profile page. |
| Click "Add Character" | Opens the character creation flow (navigates to Characters page with creation modal open). |
| Collapse/expand a section | Section body animates open/closed. Section preference is persisted. |

#### Loading States

- Synopsis: loads with the page. If slow, shows skeleton text lines.
- World summary stats: each stat shows a pulsing placeholder number until loaded.
- Character list: skeleton avatar circles and text lines.

#### Empty States

- Synopsis empty: yellow background prompt as described above.
- No characters: "No characters yet. Create your first character or upload source material to auto-detect them." with links.

#### Error States

- Synopsis save failure: red border on textarea with "Failed to save. Retrying..." text.

#### Navigation

- The sidebar is accessible from every world sub-page. It is an overlay, not a route.

---

## 3. Ingestion

### 3.1 Source Material Upload

**Route:** `/(dashboard)/world/[id]/sources`

#### Screen Layout

- **Top Bar**: Global bar.
- **Left Sidebar**: World navigation.
- **Toolbar**:
  - "Upload" button (primary).
  - View toggle: "Grid" | "List".
  - Filter by type: All, Text, Audio, Video, Image (pill tabs).
  - Sort: "Date Uploaded" (default), "Name", "Size", "Status".
  - Search input: filter by filename.
- **Main Content Area**: Grid or list of uploaded source materials.

#### Upload Flow

Clicking "Upload" or dragging files onto the page triggers the upload flow:

**Step 1: File Selection**
- A drop zone appears as a large dashed-border area in the center of the page (if no files exist) or as a modal overlay.
- Text: "Drag files here or click to browse."
- Supported formats listed beneath: "Text: .txt, .md, .docx, .pdf, .fdx, .fountain, .epub | Audio: .mp3, .wav, .m4a, .ogg, .flac | Video: .mp4, .mkv, .mov, .webm, .avi | Images: .png, .jpg, .jpeg, .webp"
- Multi-file selection supported.
- Max file size displayed (configurable, e.g., "Max 500MB per file").

**Step 2: Upload Progress**
- Each file appears as a row in a progress list:
  - Filename, file size, file type icon.
  - Progress bar (0-100%).
  - Status: "Uploading..." > "Processing..." > "Extracting entities..." > "Complete" or "Failed".
  - Cancel button (X) while uploading.
- Multiple files upload in parallel (configurable concurrency).

**Step 3: Post-Upload**
- On completion, each file shows a "Review Entities" button (navigates to Entity Review for that file).
- A summary toast: "[N] files uploaded. [M] entities extracted." with "Review" link.

#### Source Material Grid

Each card shows:
- File type icon (large, centered).
- Filename (bold, beneath icon, truncated).
- File type badge (Text, Audio, Video, Image).
- Upload date.
- Entity count badge: "[N] entities extracted".
- Status badge: "Processing" (amber, animated pulse), "Ready" (green), "Failed" (red).
- Click card: navigates to Source Material Viewer for that file.

#### Source Material List

Table columns: Type Icon | Filename | Type | Size | Uploaded | Entities | Status | Actions (View, Delete).

#### User Actions

| Action | Result |
|---|---|
| Drag files onto page | Drop zone highlights. Files begin uploading on drop. |
| Click "Upload" | File browser dialog opens. Selected files begin uploading. |
| Click a source card/row | Navigate to Source Material Viewer (section 3.3). |
| Click "Review Entities" | Navigate to Entity Review (section 3.2) filtered to that source. |
| Click Delete on a source | Confirmation dialog: "Delete [filename]? Extracted entities will remain in your world but lose their source link." On confirm, DELETE request. Card/row removed. |
| Filter by type | Grid/list filters to show only matching types. |

#### Loading States

- Grid: skeleton cards (pulsing rectangles with icon placeholder, text lines).
- Upload progress: progress bars animate from 0 to actual percentage. Status labels transition through each stage.
- Processing stage (async job): card shows "Processing..." with an animated spinner icon. Polling every 5 seconds for status updates.

#### Empty States

- **No sources uploaded**: Full drop zone visible as the main content. "Upload your source material to get started. StoryForge will automatically extract characters, locations, events, and relationships." Illustrated with a stack-of-documents icon.

#### Error States

- Upload failure (per file): progress row shows red "Failed" status with error message and "Retry" button.
- Unsupported file type: rejected immediately with "Unsupported file type: [ext]" message in the progress list.
- File too large: rejected with "File exceeds maximum size of [N]MB."
- Processing failure (job failed): card shows red "Failed" badge. Click opens error detail: "Entity extraction failed for this file. [Error message]. Retry?" button.

#### Navigation

- From: Dashboard, sidebar nav.
- To: Source Material Viewer (per file), Entity Review (per file or globally).

---

### 3.2 Entity Review

**Route:** `/(dashboard)/world/[id]/sources/review` (or `/sources/[sourceId]/review` for per-file review)

#### Screen Layout

- **Top Bar**: Global bar with breadcrumb "Sources > Entity Review".
- **Left Sidebar**: World navigation.
- **Toolbar**:
  - Filter by entity type: All, Characters, Locations, Events, Relationships, Objects, Themes (pill tabs).
  - Filter by status: All, Proposed, Confirmed, Rejected (pill tabs).
  - Filter by source file: dropdown of all uploaded sources.
  - Bulk action buttons (appear when items are selected): "Confirm Selected", "Reject Selected".
  - "Confirm All Remaining" button (confirms all proposed entities at once, with confirmation dialog).
- **Main Content Area**: Entity review list.

#### Entity Review List

Each entity is a row/card showing:

- **Checkbox** (left edge, for bulk selection).
- **Entity type icon** (Character silhouette, Location pin, Event lightning bolt, etc.).
- **Entity name** (bold). If a potential duplicate is detected, an amber "Possible duplicate of [Name]" badge appears.
- **Entity type** badge (Character, Location, Event, Relationship, Object, Theme).
- **Confidence score** (percentage, color-coded: green > 80%, yellow 50-80%, red < 50%).
- **Source reference** (filename + location in text, e.g., "chapter-3.txt, paragraph 42"). Clickable, opens Source Material Viewer at that position.
- **Brief description** (1-2 lines, AI-generated summary of what was extracted).
- **Status** (Proposed / Confirmed / Rejected) with corresponding color.
- **Action buttons**:
  - "Confirm" (green check): accepts the entity into the world.
  - "Edit" (pencil): opens edit form to adjust name, type, description before confirming.
  - "Reject" (red X): marks as rejected (hidden from world, preserved in review history).
  - "Merge" (link icon, only shown when duplicates detected): opens merge dialog.

#### Edit Entity Form (Inline or Drawer)

When "Edit" is clicked, the row expands or a drawer opens:

- Name (text input, pre-filled).
- Type (dropdown, pre-filled but changeable: if AI classified a Location as a Character, the user can correct it).
- Aliases (comma-separated text input, for alternate names).
- Description (textarea, pre-filled with AI extraction).
- Relationships (list of detected relationships, each with type and target entity, each individually confirmable/editable/removable).
- "Save and Confirm" button. "Cancel" button.

#### Merge Dialog

When duplicates are detected:

- Side-by-side comparison of the two (or more) entity candidates.
- Fields shown: name, aliases, description, source references.
- User selects which version to keep as primary, or edits a merged version.
- "Merge" button combines them into one entity with all source references preserved.

#### User Actions

| Action | Result |
|---|---|
| Click Confirm on an entity | Entity status changes to Confirmed. It appears in the world's character/location/event lists. Row updates visually (green left border). |
| Click Reject | Entity status changes to Rejected. Row grays out or moves to a "Rejected" section at the bottom. |
| Click Edit | Row expands with edit form. User modifies and saves. Entity is confirmed with edits. |
| Click Merge | Merge dialog opens. User completes merge. Duplicate entities are consolidated. |
| Select multiple + Bulk Confirm | All selected entities confirmed simultaneously. Toast: "[N] entities confirmed." |
| Click "Confirm All Remaining" | Confirmation dialog: "Confirm [N] proposed entities?" On confirm, all are accepted. |
| Click source reference link | Navigate to Source Material Viewer, scrolled/highlighted to the relevant passage. |

#### Loading States

- Entity list: skeleton rows (icon placeholder, text lines, button placeholders).
- Confidence scores may load asynchronously if recalculated; show spinner in place of percentage.

#### Empty States

- **No entities extracted yet**: "No entities to review. Upload source material to begin entity extraction." with link to Sources.
- **All entities reviewed**: "All entities have been reviewed. [N] confirmed, [M] rejected." with "View Confirmed" and "View Rejected" filter shortcuts.

#### Error States

- Failed to confirm/reject: toast "Failed to update entity. Try again." Entity reverts to previous state.
- Merge failure: toast with error message. Entities remain separate.

#### Navigation

- From: Source Material Upload ("Review Entities" button), sidebar nav, dashboard consistency alerts.
- To: Source Material Viewer (via source reference links). Character/Location/Event profiles (via confirmed entity names). Source Upload (via breadcrumb).

---

### 3.3 Source Material Viewer

**Route:** `/(dashboard)/world/[id]/sources/[sourceId]`

#### Screen Layout

- **Top Bar**: Global bar with breadcrumb "Sources > [Filename]".
- **Left Sidebar**: World navigation.
- **Main Content Area**: Split-pane layout.

**Left Pane (60%): Original Source**
- Text files: full text rendered with paragraph numbers in the left margin.
- Audio files: audio player at the top (play/pause, scrubber, time display, speed control) with scrollable transcript beneath (time-coded, speaker-diarized if available).
- Video files: video player at the top (standard controls) with scrollable transcript beneath (time-coded).
- Images: image viewer with zoom/pan controls.
- All extracted entities are highlighted in the text using the standard entity color scheme (characters = blue underline, locations = green, events = orange, objects = purple, themes = pink).
- Hovering an entity highlight shows a tooltip with: entity name, type, confidence score, status (confirmed/proposed/rejected).
- Clicking an entity highlight opens a popover with entity details and actions: "View Profile", "Edit", "Reject".

**Right Pane (40%): Annotations Panel**
- Tabs at the top:
  - "Entities" (default): list of all entities found in this source, grouped by type, with confidence scores and confirm/reject buttons.
  - "Annotations": narrative code annotations (Barthes codes), value changes, emotional states applied to text segments. Each annotation links to the highlighted passage in the left pane.
  - "Notes": user's freeform notes on this source material.
- For audio/video: a "Timecodes" tab showing entities mapped to specific timestamps. Click a timestamp to seek the player.

#### User Actions

| Action | Result |
|---|---|
| Scroll through source text | Entity highlights are visible inline. |
| Hover entity highlight | Tooltip appears with entity summary. |
| Click entity highlight | Popover opens. "View Profile" navigates to entity's page. "Edit" opens inline edit. "Reject" marks as rejected (highlight removed). |
| Play audio/video | Player controls. Transcript auto-scrolls to match playback position. |
| Click a timestamp in Timecodes tab | Player seeks to that position. Text scrolls to corresponding section. |
| Click an entity in the right panel | Left pane scrolls to the first occurrence of that entity in the source. |
| Add a note | Type in the Notes tab. Autosaves. |
| Resize panes | Drag the divider between left and right panes. |

#### Loading States

- Source text: progressive loading for large files (first N paragraphs load immediately, rest loads on scroll).
- Entity highlights: may appear progressively as the entity extraction job completes. Initial view shows raw text; highlights fade in as entities are extracted.
- Audio/video transcription: if still processing, show "Transcription in progress..." with progress percentage. Player is available immediately (can listen/watch while transcript is being generated).

#### Empty States

- **Source has no extracted entities**: Left pane shows the raw source. Right panel "Entities" tab shows: "No entities extracted yet. Processing may still be in progress." with a status indicator.
- **Source is an image with no text**: Left pane shows the image. Right panel shows AI-generated description (if available) or "Processing image..." status.

#### Error States

- Failed to load source: error card with "Failed to load source material. File may have been deleted." and "Back to Sources" button.
- Transcript unavailable: "Transcription failed. [Error message]. Retry?" button in the transcript area. Audio/video player still works.

#### Navigation

- From: Source list (click a source card/row). Entity Review (click source reference link). Writing Surface split view.
- To: Entity profiles (via entity clicks). Entity Review (via "Edit" actions). Beat Sheet (if entities link to beats).

---

## 4. Visualization and Analysis

### 4.1 Dual Timeline

**Route:** `/(dashboard)/world/[id]/timeline`

#### Screen Layout

- **Top Bar**: Global bar.
- **Left Sidebar**: World navigation.
- **Toolbar**:
  - Timeline mode toggle: "Narrative Order" (sjuzhet only, default) | "Dual Timeline" (fabula + sjuzhet).
  - Zoom controls: zoom in (+), zoom out (-), fit-to-view button.
  - Zoom level indicator: "Series > Season > Episode > Scene > Beat" -- shows current zoom level as a breadcrumb.
  - Lane selector: multi-select dropdown to add/remove lanes (by character, arc, location).
  - Color-by selector: dropdown -- "By Arc", "By Character", "By Act", "By Tag".
  - Add Event button.
  - Custom Calendar toggle (if configured): "Standard Calendar" | "[Custom Calendar Name]".
- **Main Content Area**: The timeline visualization (full-width, scroll horizontally and vertically).

#### Narrative Order View (Default)

- A single horizontal timeline (vis-timeline component).
- Events are placed in narrative presentation order (sjuzhet).
- Multiple horizontal lanes (swim lanes) stacked vertically, one per selected character/arc/location.
- Each event is a colored block on the timeline, sized by duration (or fixed size for atomic events).
- Hovering an event shows a tooltip: event name, type, characters involved, scene it belongs to.
- Clicking an event opens a detail panel (right-side drawer): event name, description, type, characters, location, scene, beat, with links to each.

#### Dual Timeline View

- Two synchronized horizontal timelines stacked vertically:
  - **Top**: Fabula (chronological truth). Events ordered by in-world chronological time. Uses the world's calendar system.
  - **Bottom**: Sjuzhet (narrative order). Events ordered by when the reader/viewer encounters them.
- Connecting lines (curved, semi-transparent) link the same event across both timelines, visualizing reordering (flashbacks and flash-forwards are visible as crossing lines).
- Both timelines share the same lane structure (character/arc lanes are vertically aligned).
- Scrolling one timeline scrolls both (synchronized).

#### User Actions

| Action | Result |
|---|---|
| Scroll horizontally | Pan the timeline left/right through the narrative. |
| Scroll vertically | Pan through lanes (if more lanes than vertical space). |
| Pinch/zoom (or toolbar zoom) | Zoom in: see individual beats. Zoom out: see entire series. Zoom level breadcrumb updates. |
| Click an event block | Detail drawer opens on the right with full event information and links. |
| Drag an event (sjuzhet timeline only) | Reorder the event in narrative presentation order. Fabula position is unchanged. Connecting line updates. Confirmation dialog if the move affects other events. |
| Click "Add Event" | Opens event creation form (drawer): name, type (action/dialogue/discovery/transformation/revelation/decision), description, characters (multi-select), location, fabula time, sjuzhet position. Save creates the event on both timelines. |
| Add/remove lanes | Selected lanes appear/disappear with animation. |
| Change color-by setting | Event blocks recolor smoothly. Legend updates. |
| Toggle to Dual Timeline | Fabula timeline animates in above the sjuzhet timeline. Connecting lines fade in. |

#### Loading States

- Timeline skeleton: horizontal pulsing bar spanning the full width, with placeholder event blocks in a regular pattern.
- Events load progressively: the timeline framework renders immediately; events populate as data arrives, appearing with a fade-in.

#### Empty States

- **No events/scenes in world**: Timeline area shows centered message: "Your timeline will appear here as you create scenes and events. Start by adding beats or uploading source material." with CTA buttons.
- **Lanes selected but no events in that lane**: That lane shows as empty with a dotted line and "No events for [Character Name]" label.

#### Error States

- Failed to load timeline data: error card with retry button in the main content area.
- Failed to reorder event: toast "Failed to update event order. Reverting." Event snaps back.

#### Navigation

- From: Dashboard, sidebar nav, Arc Diagram (click an arc point to see it in timeline context).
- To: Event detail pages. Scene pages. Writing Surface (from event detail "Go to Script" link). Character profiles (from event detail character links).

---

### 4.2 Character Relationship Map

**Route:** `/(dashboard)/world/[id]/characters`

#### Screen Layout

- **Top Bar**: Global bar.
- **Left Sidebar**: World navigation.
- **Toolbar**:
  - "Add Character" button (primary).
  - Filter panel toggle button (opens/closes a filter sidebar on the right).
  - Layout selector: "Force-Directed" (default) | "Hierarchical" | "Circular".
  - Zoom controls: zoom in, zoom out, fit-to-view.
  - View toggle: "Map" (graph) | "List" (table) | "Profiles" (card grid).
  - Search input: filter characters by name.
- **Filter Panel** (right sidebar, 280px, toggleable):
  - Relationship type filter: checkboxes for each relationship type present in the world (Family, Romance, Rivalry, Alliance, Mentor, etc.).
  - Time period filter: dropdown or range slider (by act, episode, or scene range).
  - Story arc filter: dropdown of arcs.
  - Faction filter: dropdown of factions.
  - "Reset Filters" button.
- **Time Slider** (bottom bar, full width):
  - Horizontal slider spanning the narrative timeline (scene 1 to final scene).
  - Play/pause button to animate relationship evolution automatically.
  - Speed control (0.5x, 1x, 2x).
  - Current position label: "Scene [N] / [Total]" or "Episode [N]".
  - Dragging the slider updates the graph to show relationships as they exist at that point in the narrative.
- **Main Content Area**: The graph visualization (React Flow / D3 canvas).

#### Graph View

- **Nodes**: Each character is a circular node.
  - Size: proportional to importance or screen time (configurable).
  - Content: character avatar image (or initials circle if no avatar). Name label below the node.
  - Border color: indicates faction membership (color-coded).
  - Hover: node enlarges slightly, tooltip shows character name, role, faction.
  - Click: opens character detail panel (see below).
- **Edges**: Relationship lines connecting character nodes.
  - Line style: solid (confirmed), dashed (speculative/proposed).
  - Line color: by relationship type (configurable color mapping, legend shown).
  - Line thickness: by relationship weight/intensity.
  - Label on edge: relationship type name (shown on hover, optionally always visible).
  - Arrow direction: for directional relationships (e.g., "mentors" has a direction).
- **Clusters**: Characters in the same faction/family are visually grouped with a subtle background region.
- **Legend** (bottom-right corner): color key for relationship types and faction colors.

#### Character Detail Panel (Right Drawer, 400px)

Opens when a character node is clicked:

- **Header**: Avatar (large, editable), Name (h2, editable), Role/archetype badge.
- **Sections** (tabbed or collapsible):
  - **Overview**: Description, aliases, physical traits summary, psychological profile summary, age, gender, status (alive/dead/unknown).
  - **Relationships**: List of all relationships for this character. Each row: related character (avatar + name), relationship type, intensity (1-5 bar), valid time range (from scene X to scene Y or "ongoing"). Click a relationship to highlight it on the graph.
  - **Arcs**: List of arcs this character participates in. Each links to the Arc Diagram.
  - **Scenes**: List of scenes this character appears in. Clickable, links to Writing Surface or Timeline.
  - **Voice Profile** (if analyzed): vocabulary stats, average sentence length, speech tics, formality level.
  - **Emotional Arc**: mini sparkline chart of emotional trajectory.
  - **Narrative Roles**: list of roles this character serves (Vogler archetype, Greimas actant, Propp role) with the scene range for each.
- **Actions**: "Edit Character" (opens full edit form), "Add Relationship" (opens relationship creation), "Delete Character" (red, with confirmation).
- Close (X) button.

#### List View

- Table: Avatar | Name | Role | Faction | Relationships (count) | Scenes (count) | Status | Actions (View, Edit, Delete).
- Sortable columns. Clickable rows open the detail panel.

#### Profiles View (Card Grid)

- Character cards in a responsive grid (3-4 per row on desktop).
- Each card: avatar, name, role, faction badge, relationship count, scene count, brief description (2 lines).
- Click card to open detail panel.

#### User Actions

| Action | Result |
|---|---|
| Click "Add Character" | Opens character creation form (drawer). Fields: name, aliases, description, physical traits, psychological profile, faction, role. Save creates the character. Node appears on graph. |
| Click a character node | Detail panel opens. Node is highlighted with a glow effect. Connected edges are emphasized; unrelated edges fade. |
| Drag a character node | Node moves freely on the canvas. Force-directed layout adjusts other nodes if in that mode. |
| Drag the time slider | Graph animates to show relationships at that narrative point. Relationships that do not exist yet are hidden. New relationships that have formed are shown. |
| Click Play on time slider | Graph auto-animates through the narrative, showing relationships evolving. |
| Hover an edge | Edge thickens, label appears, connected nodes highlight. |
| Click an edge | Opens relationship edit form (inline or drawer): type, weight, direction, description, valid-from scene, valid-to scene. |
| Apply filters | Graph filters to show only matching characters/relationships. Hidden nodes fade out or disappear. |
| Zoom in/out | Canvas zooms. Fit-to-view frames all visible nodes. |

#### Loading States

- Graph: nodes appear as pulsing circles in approximate positions, then settle into layout. Edges draw in after nodes are positioned.
- Detail panel: skeleton text and avatar placeholder.
- List/Profiles: skeleton rows/cards.

#### Empty States

- **No characters**: Graph area shows centered message: "No characters in this world yet. Create your first character or upload source material to auto-detect them." Two CTA buttons.
- **No relationships**: Characters appear as unconnected nodes with a hint: "Add relationships between characters to see the connection map come alive."
- **Filters eliminate all nodes**: "No characters match your current filters." with "Reset Filters" button.

#### Error States

- Failed to load character data: error card in main area with retry.
- Failed to save character edit: toast "Failed to save. Try again." Form remains open with data preserved.
- Graph rendering failure (too many nodes): switches to simplified view with a message "Large world detected. Showing top [N] characters. Use filters to explore." with a filter prompt.

#### Navigation

- From: Dashboard, sidebar nav, any entity link pointing to a character.
- To: Writing Surface (from scene list in detail panel). Arc Diagram (from arcs in detail panel). Timeline (from scene links). Faction Map (from faction badges). Character Interview (from detail panel action).

---

### 4.3 Arc Diagram

**Route:** `/(dashboard)/world/[id]/arcs`

#### Screen Layout

- **Top Bar**: Global bar.
- **Left Sidebar**: World navigation.
- **Toolbar**:
  - "Add Arc" button.
  - Arc type filter: All, Character Arcs, Plot Arcs, Thematic Arcs, Relationship Arcs (pill tabs).
  - Structure template selector: dropdown listing all available templates (None, Hero's Journey, Save the Cat, etc.). Active template is shown. Selecting one overlays expected beat positions on the diagram.
  - Arc selector: multi-select dropdown to choose which specific arcs to display (e.g., "Protagonist Arc", "Main Plot", "Love Subplot").
  - View toggle: "Curve" (default) | "Table".
- **Main Content Area**: The arc visualization.

#### Curve View

- The horizontal axis represents narrative progression (scene/beat index or percentage of narrative completion, 0% to 100%).
- The vertical axis represents intensity/value (low to high, or negative to positive for value-change arcs).
- Each selected arc is rendered as a curve (spline/bezier) in a distinct color.
- **Plot points**: markers on the curve at significant moments (beat mappings, turning points). Each marker is a small circle. Hovering shows: beat name, scene, description. Clicking opens beat detail (drawer or inline).
- **Structure template overlay** (when a template is selected):
  - Vertical dashed lines at expected percentage positions for each template beat (e.g., Save the Cat "Catalyst" at 12%).
  - Each dashed line is labeled at the top with the template beat name.
  - If a story beat is mapped to a template beat, a connecting indicator shows the alignment or deviation.
  - **Pacing deviation indicators**: if a story beat falls significantly before or after the expected position, an amber/red indicator arrow shows the gap.
- Multi-arc comparison: when multiple arcs are selected, their curves overlay on the same chart. A legend in the corner identifies each by color.

#### Table View

- Rows: one per arc.
- Columns: Arc Name | Type | Phases (listed) | Beats Mapped | Completion | Actions.
- Expandable rows: clicking a row expands to show all beats/phases of that arc in sub-rows.

#### Arc Creation/Edit Form (Drawer)

- Arc name (text input).
- Arc type (dropdown: character, plot, thematic, relationship).
- Associated entity (e.g., which character for a character arc, which theme for a thematic arc).
- Phases (ordered list, add/remove/reorder): each phase has a name (e.g., "Setup", "Rising Action", "Climax", "Falling", "Resolution") and an intensity value (slider 0-100).
- Beat mappings: list of beats assigned to this arc, with drag-and-drop to reorder.

#### User Actions

| Action | Result |
|---|---|
| Click "Add Arc" | Opens arc creation drawer. Fill fields, save. New arc curve appears on the diagram. |
| Click a plot point marker | Opens beat detail drawer with full beat information. |
| Select a structure template | Template overlay appears: vertical beat-position lines with labels. Existing beat mappings are shown. |
| Hover over pacing deviation indicator | Tooltip: "This beat is [N]% ahead/behind the expected position for [Template Beat Name]." |
| Toggle arcs on/off in arc selector | Curves appear/disappear with animation. |
| Click on curve (not on a marker) | Shows the interpolated value/intensity at that narrative point. |

#### Loading States

- Axes render immediately. Curves draw in progressively (animated from left to right).
- Template overlay: dashed lines appear after template data loads (near-instant for built-in templates).

#### Empty States

- **No arcs defined**: "No arcs tracked yet. Arcs help you visualize the shape of your story. Create your first arc or apply a structure template to get started." CTA buttons for both.
- **Arc selected but no beats mapped**: Flat line at zero with message: "This arc has no beats mapped. Add beats in the Beat Sheet and map them to this arc."

#### Error States

- Failed to load arc data: error card with retry.
- Failed to save arc: toast with retry.

#### Navigation

- From: Dashboard, sidebar nav, Character detail panel (arc links).
- To: Beat Sheet (via plot point clicks). Writing Surface (via beat links). Characters (via character arc entity links). Structure template configuration.

---

### 4.4 Mind Map / World Map

**Route:** `/(dashboard)/world/[id]/mindmap`

#### Screen Layout

- **Top Bar**: Global bar.
- **Left Sidebar**: World navigation.
- **Toolbar**:
  - "Add Node" button.
  - Cluster-by selector: "None" (freeform) | "Theme" | "Location" | "Faction" | "Custom Group".
  - Node type filter: checkboxes for entity types to show (Characters, Locations, Objects, Themes, Factions, Events).
  - Map underlay toggle: "None" (default) | "Upload Map Image" (for geographic/fantasy maps).
  - Zoom and fit-to-view controls.
  - "Auto-Arrange" button (runs force-directed layout on current nodes).
  - "Lock Positions" toggle (prevents accidental dragging when exploring).
- **Main Content Area**: Freeform canvas (React Flow).

#### Canvas

- Nodes represent story world entities. Each node has:
  - An icon based on entity type.
  - The entity name.
  - A brief label (type or custom tag).
  - Expandable/collapsible: click the expand toggle on a node to reveal connected sub-nodes radiating outward.
  - Double-click: opens entity detail drawer.
- Edges connect related entities (from the Relationship table). Edge labels show relationship type.
- When "Cluster-by" is active, nodes are grouped into visually distinct regions (background color regions with labels).
- If a map image is uploaded as underlay, it appears beneath all nodes. Nodes can be positioned on geographic locations.

#### User Actions

| Action | Result |
|---|---|
| Drag a node | Node moves freely. Connected edges update. If "Lock Positions" is on, drag is prevented. |
| Click "Add Node" | Opens creation form: select entity type, choose existing entity or create new one. Node appears at center of viewport. |
| Expand a node | Connected entities appear as smaller nodes radiating outward, with connecting edges. Click again to collapse. |
| Double-click a node | Opens entity detail drawer (same format as the character detail panel, adapted for entity type). |
| Change cluster-by | Nodes animate into clusters based on selected grouping. |
| Upload map image | File picker for image. Image becomes the canvas background, pannable and zoomable with the canvas. |
| Click "Auto-Arrange" | Nodes rearrange using force-directed algorithm. Animation over 1-2 seconds. |

#### Loading States

- Canvas renders immediately (empty). Nodes populate with fade-in as data loads.
- Auto-arrange: nodes animate smoothly to new positions.

#### Empty States

- **No entities in world**: "Your mind map starts here. Create characters, locations, or other story elements, and they will appear as interconnected nodes." CTA buttons.

#### Error States

- Failed to save node positions: toast "Position changes not saved. Will retry." Positions are stored locally and synced when connection restores.

#### Navigation

- From: Dashboard, sidebar nav.
- To: Entity detail pages (via double-click). Any world sub-page via sidebar.

---

### 4.5 Pacing Heatmap

**Route:** `/(dashboard)/world/[id]/pacing`

#### Screen Layout

- **Top Bar**: Global bar.
- **Left Sidebar**: World navigation.
- **Toolbar**:
  - Metric selector: multi-select checkboxes for "Action Density", "Dialogue Ratio", "Description Density", "Tension Level", "Scene Length".
  - Granularity selector: "By Scene" | "By Chapter/Episode" | "By Act".
  - Structure template overlay toggle (if a template is applied, overlays expected pacing curve).
  - Color scale legend (gradient from cool/blue = low to hot/red = high).
- **Main Content Area**: The heatmap visualization.

#### Heatmap

- Horizontal axis: narrative progression (scenes/chapters/episodes in order).
- Vertical axis: selected metrics (one row per metric).
- Each cell is colored by the metric value using the gradient scale.
- Hovering a cell shows a tooltip: "Scene [N]: Action Density = [value]" with the actual numeric value.
- Clicking a cell navigates to or highlights the corresponding scene in the Writing Surface or Beat Sheet.
- If the structure template overlay is on, a curve line is drawn over the heatmap showing the expected tension/pacing curve. Deviations from the expected curve are visually apparent.

#### User Actions

| Action | Result |
|---|---|
| Select/deselect metrics | Rows appear/disappear in the heatmap. |
| Change granularity | Cells resize and aggregate (e.g., chapter-level averages scenes within). |
| Hover a cell | Tooltip with details. |
| Click a cell | Navigates to that scene in the Writing Surface or opens the beat in the Beat Sheet. |
| Toggle template overlay | Expected pacing curve appears/disappears. |

#### Loading States

- Heatmap grid renders as an empty grid of gray cells. Cells fill with color as metric data loads (progressive left-to-right fill).

#### Empty States

- **No scenes with pacing data**: "Pacing analysis requires scenes with content. Write or import your story, and pacing metrics will be computed automatically." CTA to Writing Surface.

#### Error States

- Failed to compute pacing metrics: error card with "Retry Analysis" button.
- Partial data: available cells are colored, unavailable cells show a "?" icon.

#### Navigation

- From: Dashboard, sidebar nav.
- To: Writing Surface (via cell clicks). Beat Sheet (via cell clicks).

---

### 4.6 Emotional Arc Chart

**Route:** `/(dashboard)/world/[id]/arcs/emotional` (sub-route of arcs, or standalone via sidebar)

#### Screen Layout

- **Top Bar**: Global bar.
- **Left Sidebar**: World navigation.
- **Toolbar**:
  - Character selector: multi-select dropdown of all characters. Select which characters' emotional arcs to display.
  - Emotion dimension selector: checkboxes for Joy, Grief, Anger, Fear, Hope, Surprise.
  - Granularity: "By Scene" | "By Chapter" | "By Act".
  - Highlight divergence toggle: when on, moments where selected characters' emotional arcs diverge sharply are marked with a vertical highlight band.
- **Main Content Area**: Line chart.

#### Chart

- Horizontal axis: narrative progression (scenes/chapters/acts).
- Vertical axis: emotional intensity (0-100 or -100 to +100 for valence-based).
- Each character+emotion combination is a line in a distinct color/style (solid, dashed, dotted for different characters; hue for different emotions).
- Legend at the top or right side: character name + emotion = line style/color.
- Hovering a point shows tooltip: "[Character] at Scene [N]: Joy = 72, Grief = 15, ..."
- Clicking a point opens a detail panel showing the scene, what happened, and the emotional assessment rationale.
- Divergence highlights (when enabled): vertical amber bands at narrative points where selected characters' arcs cross or diverge by more than a configurable threshold.

#### User Actions

| Action | Result |
|---|---|
| Add/remove characters | Lines appear/disappear with animation. |
| Toggle emotion dimensions | Lines for that dimension appear/disappear. |
| Hover a data point | Tooltip with emotional state details. |
| Click a data point | Opens scene detail panel. |
| Toggle divergence highlights | Amber bands appear/disappear. |

#### Loading States

- Chart axes render immediately. Lines draw in progressively (animated left to right).

#### Empty States

- **No emotional data**: "Emotional arc analysis requires scene content. Write or import your story and run analysis." CTA to run analysis.
- **No characters selected**: "Select characters from the toolbar to view their emotional arcs."

#### Error States

- Analysis not yet run: "Emotional analysis has not been performed for this world. Run Analysis?" button.
- Failed to load: error card with retry.

#### Navigation

- From: Dashboard, sidebar nav, Character detail panel (emotional arc sparkline click).
- To: Scenes in Writing Surface (via data point clicks). Character profiles.

---

### 4.7 Faction / Power Map

**Route:** `/(dashboard)/world/[id]/factions`

#### Screen Layout

- **Top Bar**: Global bar.
- **Left Sidebar**: World navigation.
- **Toolbar**:
  - "Add Faction" button.
  - Layout toggle: "Network" | "Hierarchy".
  - Filter: by faction type, by story act/episode.
  - Zoom and fit-to-view.
- **Time Slider** (bottom bar, same as Character Relationship Map): scrub through narrative to see alliance/power shifts.
- **Main Content Area**: Graph visualization.

#### Network View

- Nodes = factions. Node size proportional to power level. Node color distinguishes factions.
- Each node shows: faction name, member count, power level indicator (numeric or bar).
- Edges = alliances (solid green), conflicts (solid red), neutral/unknown (gray dashed).
- Edge thickness = intensity of alliance/conflict.
- Hovering a node highlights all its edges and connected factions.
- Clicking a node opens faction detail panel (drawer): name, description, members (character list with avatars), allegiances, hierarchy structure, power level history.
- Dragging the time slider recolors/resizes edges as allegiances shift.

#### Hierarchy View

- Same data, displayed as a tree/org-chart structure.
- Top-level factions at the root, sub-factions nested below.
- Members listed within their faction's node.

#### User Actions

| Action | Result |
|---|---|
| Click "Add Faction" | Opens faction creation form: name, description, type, initial power level, members (multi-select characters). |
| Click a faction node | Detail panel opens. |
| Drag time slider | Graph animates to reflect the state of alliances at that narrative point. |
| Add/edit alliance between factions | Click an edge or use "Add Alliance" in faction detail. Set type (alliance/conflict), intensity, valid time range. |

#### Loading States

- Graph nodes and edges animate in (same as character map).

#### Empty States

- **No factions**: "No factions or organizations defined. Create factions to visualize power dynamics." CTA button.

#### Error States

- Failed to load: error card with retry.

#### Navigation

- From: Dashboard, sidebar nav.
- To: Character profiles (from member lists). Timeline (from time-slider context).

---

### 4.8 Foreshadowing Web

**Route:** `/(dashboard)/world/[id]/foreshadowing`

#### Screen Layout

- **Top Bar**: Global bar.
- **Left Sidebar**: World navigation.
- **Toolbar**:
  - "Add Setup" button, "Add Payoff" button.
  - View toggle: "Web" (graph) | "Thread" (timeline-like thread view) | "List" (table).
  - Filter: "All" | "Connected" (has both setup and payoff) | "Orphan Setups" (amber) | "Deus Ex Machina" (red).
  - Zoom and fit-to-view.
- **Main Content Area**: Directed graph or thread view.

#### Web View (Graph)

- Nodes = events/scenes/beats that are setups or payoffs.
  - Setup nodes: diamond shape, outlined.
  - Payoff nodes: diamond shape, filled.
  - Color coding: connected pairs share a color. Orphan setups are amber. Payoffs without setups are red.
- Edges = directed arrows from setup to payoff.
  - Line style: solid for confirmed links, dashed for AI-suggested links.
  - Hovering shows: "[Setup Name] foreshadows [Payoff Name]".
- Clicking a node opens detail panel: event/beat name, description, source reference, linked partner (setup or payoff), and "Go to Script" link.

#### Thread View

- A vertical timeline showing foreshadowing threads.
- Each thread is a vertical line connecting a setup marker at the top to a payoff marker at the bottom, with the narrative distance between them visible.
- Threads are color-coded. Orphan setups show a thread that ends in a question mark. Deus ex machina payoffs show a thread that starts from nowhere.
- Horizontal position corresponds to narrative position (scenes left to right).

#### List View

- Table: Setup | Scene | Payoff | Scene | Status (Linked / Orphan / Deus Ex) | Actions.

#### User Actions

| Action | Result |
|---|---|
| Click "Add Setup" | Form: select scene/beat, description of what is set up, optional tag. Creates an unlinked setup node. |
| Click "Add Payoff" | Form: select scene/beat, description of what is paid off, link to setup (dropdown of existing setups). Creates a payoff node and links it. |
| Click a node | Detail panel opens with full information. |
| Click "Go to Script" in detail | Navigates to Writing Surface at the corresponding position. |
| Filter to "Orphan Setups" | Only setup nodes without payoffs are shown. Useful for identifying dangling plot threads. |
| Filter to "Deus Ex Machina" | Only payoff nodes without setups are shown. Useful for identifying unearned resolutions. |

#### Loading States

- Graph: nodes appear with fade-in, edges draw in after nodes settle.

#### Empty States

- **No foreshadowing data**: "No setup/payoff pairs tracked yet. Add setups and payoffs manually, or run AI analysis to detect them automatically." CTA buttons for both.

#### Error States

- Failed to load: error card with retry.
- AI detection failure: toast "Automatic foreshadowing detection failed. You can add links manually."

#### Navigation

- From: Dashboard, sidebar nav, Consistency Checker (links to orphan setups).
- To: Writing Surface (via "Go to Script" links). Beat Sheet (via beat links in detail panel).

---

### 4.9 Causality Graph

**Route:** `/(dashboard)/world/[id]/causality`

#### Screen Layout

- **Top Bar**: Global bar.
- **Left Sidebar**: World navigation.
- **Toolbar**:
  - "Add Causal Link" button.
  - Causality type filter: checkboxes for Physical, Motivational, Psychological, Enabling.
  - Direction toggle: "Forward" (show consequences) | "Backward" (show causes) | "Both".
  - Depth slider: how many levels of causality to display (1-5, default 2).
  - Zoom and fit-to-view.
- **Main Content Area**: Directed acyclic graph (DAG) visualization.

#### Graph

- Nodes = events (positioned left-to-right in causal order, not necessarily chronological).
- Node shape indicates event type (action = rectangle, decision = diamond, discovery = circle, etc.).
- Edges = causal links, directed (arrow from cause to effect).
  - Edge color by causality type: Physical = blue, Motivational = orange, Psychological = purple, Enabling = green.
  - Edge label: brief description of the causal link.
- Hovering a node highlights all incoming (causes) and outgoing (effects) edges.
- Clicking a node: detail panel with event info, all causes (incoming edges), all effects (outgoing edges), and links to related entities.

#### Trace Mode

- Click any event node, then click "Trace Backward" or "Trace Forward" in the detail panel.
- The graph highlights the causal chain: all ancestors (backward) or all descendants (forward) are highlighted, everything else fades.
- Breadcrumb-style path is shown at the top: "Event A caused Event B which caused Event C which caused ..."

#### User Actions

| Action | Result |
|---|---|
| Click "Add Causal Link" | Form: select cause event, select effect event, select causality type, add optional description. Save creates the edge. |
| Click a node | Detail panel opens. |
| Click "Trace Backward/Forward" | Graph enters trace mode, highlighting the causal chain. "Exit Trace" button appears. |
| Adjust depth slider | Graph expands or contracts the number of causal levels shown. |
| Filter by causality type | Edges of unselected types are hidden. |

#### Loading States

- DAG renders nodes first (positioned by a layout algorithm), then edges draw in.

#### Empty States

- **No causal links**: "No causal links defined. Add links between events to visualize cause and effect in your story." CTA button.

#### Error States

- Failed to load: error card with retry.
- Circular causality detected (should not happen in a DAG): warning banner "Circular causality detected between [events]. Review and correct." with links to the offending events.

#### Navigation

- From: Dashboard, sidebar nav.
- To: Event detail pages. Writing Surface. Timeline.

---

### 4.10 Audience Knowledge Map

**Route:** `/(dashboard)/world/[id]/knowledge`

#### Screen Layout

- **Top Bar**: Global bar.
- **Left Sidebar**: World navigation.
- **Toolbar**:
  - Character selector: multi-select dropdown to choose which characters' knowledge to compare against the audience.
  - Information type filter: All, Facts, Secrets, Identities, Locations, Motivations.
  - Dramatic irony toggle: "Highlight Dramatic Irony" (highlights moments where audience knows more than characters).
- **Timeline Scrubber** (bottom bar): horizontal slider from start to end of narrative. Drag to see knowledge state at any point.
- **Main Content Area**: Split-pane view.

#### Split View

**Left Pane: Audience Knowledge**
- A scrollable list of information items that the audience has received by the current scrubber position.
- Each item: info icon, brief description (e.g., "The butler is secretly the heir"), source scene, reveal type badge ("Explicit" = told directly, "Implicit" = deducible, "Dramatic Irony" = audience knows but characters do not).
- Items appear in the order they are revealed to the audience. New items at the scrubber position are highlighted with a glow.

**Right Pane: Character Knowledge**
- Shows what the selected character(s) know at the same scrubber position.
- Same list format as audience knowledge, but scoped to the character.
- Items the audience knows but the character does not are visually marked in the audience pane with a "Dramatic Irony" badge and do not appear in the character pane.
- Items the character knows but the audience does not are marked as "Hidden from Audience" in the character pane.

#### Dramatic Irony Markers

When "Highlight Dramatic Irony" is on:
- Items in the audience pane that are not in any selected character's knowledge are highlighted amber.
- A count badge at the top shows "Dramatic Irony: [N] active items."
- Mystery markers: items hidden from the audience are shown as redacted/blurred entries in the audience pane with "Revealed in Scene [N]" note.

#### User Actions

| Action | Result |
|---|---|
| Drag timeline scrubber | Both panes update to reflect knowledge state at that narrative position. |
| Click an information item | Opens detail drawer: full description, source scene, characters who know it, characters who do not, when it is revealed to the audience. |
| Add/remove characters in selector | Right pane updates to show selected characters' combined or individual knowledge. |
| Click "Highlight Dramatic Irony" | Audience pane highlights dramatic irony items. |

#### Loading States

- Split panes show skeleton list items. Scrubber is functional immediately.

#### Empty States

- **No knowledge data**: "Audience knowledge tracking requires analysis. Upload and analyze your story to populate this view." CTA button.

#### Error States

- Failed to load: error card with retry.

#### Navigation

- From: Dashboard, sidebar nav.
- To: Writing Surface (via scene links in detail drawer). Character profiles.

---

## 5. Advanced Features

### 5.1 What-If Scenarios

**Route:** `/(dashboard)/world/[id]/whatif`

#### Screen Layout

- **Top Bar**: Global bar.
- **Left Sidebar**: World navigation.
- **Toolbar**:
  - "Create Scenario" button (primary).
  - Existing scenarios: dropdown list of created scenarios, each with a name and date.
  - View toggle: "Impact View" (default) | "Side-by-Side".
- **Main Content Area**: The scenario workspace.

#### Scenario Creation Flow

1. Click "Create Scenario". A drawer opens:
   - Scenario name (text input, required).
   - Fork point: select an event/scene/beat from a searchable dropdown. This is the branching point.
   - Description of the change: textarea describing what happens differently at this point.
   - "Create Branch" button.
2. On creation, a new Branch entity is created in the data model. The system computes the cascading impact via the dependency graph.

#### Impact View

- A tree/graph rooted at the fork point event.
- Nodes = affected entities (events, characters, relationships, scenes).
- Color coding: Red = major impact (entity invalidated or fundamentally changed), Yellow = moderate impact (needs review), Green = minor impact (cosmetic).
- Each node shows: entity name, entity type, impact severity, brief description of the impact.
- Clicking a node opens a before/after comparison: "Canon" state vs. "What-If" state for that entity.
- Unaffected entities are not shown (only the affected cascade).

#### Side-by-Side View

- Two columns: "Canon" (left) and "What-If: [Scenario Name]" (right).
- Each column shows the same entity list (events in order, characters, etc.).
- Differences are highlighted: additions (green), removals (red), modifications (amber).
- Scrolling is synchronized between columns.

#### User Actions

| Action | Result |
|---|---|
| Create scenario | Branch is created. Impact computation runs (may take a few seconds for large worlds). Progress spinner shown. |
| Click an affected entity in Impact View | Before/after comparison panel opens. |
| Switch to Side-by-Side | Full comparative view loads. |
| Click "Merge to Canon" on a scenario | Confirmation dialog: "Merge this what-if scenario into your canonical world? This will apply all changes." On confirm, the branch is merged and becomes canon. |
| Click "Delete Scenario" | Confirmation, then branch is deleted. |
| Click "Edit Fork Point" | Reopens the scenario edit drawer. Changing the fork point recomputes the cascade. |

#### Loading States

- Impact computation: progress bar "Computing cascading impact..." with estimated time.
- Impact view: nodes appear progressively as computation completes.
- Side-by-side: skeleton columns that fill in as data loads.

#### Empty States

- **No scenarios created**: "What-if scenarios let you explore alternate timelines. Fork any event and see how the ripple effects change your story." CTA: "Create Your First Scenario."

#### Error States

- Impact computation failure: error card "Failed to compute impact. The dependency graph may be too large. Try a more specific fork point." Retry button.
- Merge failure: toast with error. Canon is unchanged.

#### Navigation

- From: Dashboard, sidebar nav, Timeline (right-click an event > "What if this changed?"), Consistency Checker (explore contradictions via what-if).
- To: Canon Management (after merge). Timeline (from affected events). Any entity detail page.

---

### 5.2 Canon Management

**Route:** `/(dashboard)/world/[id]/canon`

#### Screen Layout

- **Top Bar**: Global bar.
- **Left Sidebar**: World navigation.
- **Toolbar**:
  - "Create Snapshot" button (primary).
  - Snapshot list: dropdown of existing snapshots (name + date).
  - "Compare" button (enabled when 2 snapshots are selected).
  - View toggle: "Timeline" (snapshots on a timeline) | "List" (table).
- **Main Content Area**: Canon management workspace.

#### Snapshot Timeline View

- Horizontal timeline of canonical snapshots.
- Each snapshot is a node on the timeline with: name, date, description preview, entity counts.
- The current (HEAD) state is marked with a special indicator.
- Branches (what-if scenarios) are shown as forking lines from their snapshot origin.
- Click a snapshot to view its details.

#### Snapshot Detail Panel (Drawer)

- Snapshot name, date created, description.
- Entity counts: characters, locations, events, scenes, beats, arcs.
- "Restore to This Snapshot" button (destructive: confirmation required -- "This will revert your world to this state. Current changes since this snapshot will be lost. Create a snapshot of the current state first?").
- "Compare with Current" button.
- "Compare with..." button (opens snapshot selector to pick another snapshot).
- "Delete Snapshot" button (red, confirmation required).

#### Comparison View (Structural Diff)

When comparing two snapshots:
- Split view: Snapshot A (left) vs. Snapshot B (right).
- Sections: Characters, Locations, Events, Scenes, Beats, Arcs, Relationships.
- Each section shows:
  - Added items (green): entities present in B but not A.
  - Removed items (red): entities present in A but not B.
  - Modified items (amber): entities present in both but with different field values. Click to see field-level diff.
- Summary at top: "X added, Y removed, Z modified."

#### User Actions

| Action | Result |
|---|---|
| Click "Create Snapshot" | Modal: snapshot name, description (optional). Save triggers a full snapshot of the current world state. Progress bar for large worlds. |
| Click a snapshot node | Detail panel opens. |
| Click "Compare" with two selected | Comparison view loads. |
| Click "Restore to This Snapshot" | Confirmation flow (2-step: optional current snapshot creation, then restore). World state reverts. Redirect to dashboard. |
| Click "Compare with Current" | Comparison view: selected snapshot vs. current HEAD. |

#### Loading States

- Snapshot creation: progress bar "Creating snapshot..." (may take a few seconds for large worlds).
- Comparison: skeleton diff view while computing.

#### Empty States

- **No snapshots**: "No canonical snapshots exist. Create a snapshot to save a version of your world state that you can return to later." CTA button.

#### Error States

- Snapshot creation failure: toast "Failed to create snapshot. Try again."
- Restore failure: toast "Failed to restore. Your current state is preserved." No data loss.
- Comparison failure: error card with retry.

#### Navigation

- From: Dashboard, sidebar nav, What-If scenarios (after merge).
- To: Any entity detail page (via diff item clicks). What-If (via branch links on the snapshot timeline).

---

### 5.3 Consistency Checker

**Route:** `/(dashboard)/world/[id]/consistency`

#### Screen Layout

- **Top Bar**: Global bar.
- **Left Sidebar**: World navigation.
- **Toolbar**:
  - "Run Check" button (primary) -- triggers a full consistency check via the AI analysis pipeline.
  - Filter by severity: All, Critical (red), Warning (amber), Info (blue).
  - Filter by type: Timeline Paradoxes, Character Contradictions, Location Errors, Broken Promises (setup without payoff), Other.
  - Status filter: All, Unresolved, Resolved, Dismissed.
  - Sort: "By Severity" (default), "By Date Detected", "By Type".
- **Main Content Area**: Issue list.

#### Issue List

Each issue is a card/row showing:

- **Severity icon**: Red circle (critical), Amber triangle (warning), Blue info circle (info).
- **Type badge**: "Timeline", "Character", "Location", "Setup/Payoff", "Other".
- **Title**: brief description of the contradiction (e.g., "Character 'Marcus' appears in Scene 42 but was killed in Scene 28").
- **Confidence**: "High Confidence" (hard contradiction, factual) | "Suggestion" (soft contradiction, behavioral/thematic). The confidence level is prominently displayed to avoid presenting AI uncertainty as certainty.
- **Affected entities**: clickable links to the involved characters, scenes, events.
- **Source references**: links to the specific text/scene where the contradiction occurs.
- **Status actions**:
  - "Resolve" (opens resolution flow).
  - "Dismiss" (marks as intentional or not-a-problem, with optional note).
  - "What-If" (opens What-If Scenario to explore fixing it).

#### Resolution Flow (Drawer)

When "Resolve" is clicked:

- Shows the contradiction details in full.
- Shows the two (or more) conflicting data points side by side.
- Options:
  - "Edit [Entity A]" -- opens entity edit form.
  - "Edit [Entity B]" -- opens entity edit form.
  - "Add Exception Rule" -- creates a WorldRule that acknowledges this as intentional (e.g., "This character faked their death").
  - "Mark as Resolved" -- after edits, mark the issue as resolved. It moves to the "Resolved" section and is re-checked on next run.

#### User Actions

| Action | Result |
|---|---|
| Click "Run Check" | Triggers async consistency check job. Button shows spinner. Toast: "Consistency check started. Results will appear as they are found." Results populate the list progressively. |
| Click an issue card | Expands to show full details inline, or opens a drawer. |
| Click an affected entity link | Navigates to that entity's detail page. |
| Click "Resolve" | Resolution drawer opens. |
| Click "Dismiss" | Prompt for a note (optional): "Why is this not a problem?" Save dismisses the issue. It is hidden unless "Dismissed" filter is active. |
| Click "What-If" | Creates a What-If scenario pre-populated with this contradiction as the fork point. Navigates to What-If page. |
| Filter/sort | List updates to match criteria. |

#### Loading States

- Running check: each issue card appears one at a time as the checker finds issues (streaming results). A progress indicator shows: "Checking... [N] issues found so far."
- Initial page load: skeleton list.

#### Empty States

- **No issues found (check has run)**: Green banner: "No contradictions detected. Your story world is consistent." with a note "Soft contradictions are flagged as suggestions and may not catch all issues."
- **Check has never been run**: "The consistency checker has not been run yet. Run a check to detect contradictions, timeline paradoxes, and broken promises in your story." CTA: "Run First Check."

#### Error States

- Check failed: toast "Consistency check failed. [Error message]. Retry?" Check results from any partial run are still displayed.
- Resolution save failed: toast with retry.

#### Navigation

- From: Dashboard (consistency alert card), sidebar nav.
- To: Entity detail pages (via entity links). Writing Surface (via source references). What-If (via "What-If" action). Foreshadowing Web (via setup/payoff issues).

---

### 5.4 AI Assist Wand

**Route:** Not a standalone route. The AI Assist Wand is a contextual overlay/panel accessible from:
- Beat Sheet (wand icon on each card and in expanded view)
- Writing Surface (wand button in toolbar)
- Story Sidebar (wand icon next to synopsis, if synopsis needs expansion)

#### Prerequisite Gate

- If the world has no synopsis: the wand icon is grayed out everywhere. Clicking it shows a tooltip: "Write a synopsis in the Story Sidebar to enable AI Assist." with a "Open Sidebar" link.
- If the world has a synopsis: the wand icon is active (sparkle icon, blue tint).

#### Wand Panel (Drawer or Inline Panel)

When the wand is activated, a panel opens adjacent to the triggering context:

**Header**: "AI Assist" with a sparkle icon. Subtext: "Suggestions based on your synopsis and world context. You decide what to keep."

**Context Display** (collapsible, collapsed by default):
- Shows what the AI is using as context: synopsis text, surrounding beats (for beat wand), character profiles (for script wand), relevant world data.
- "Edit Context" link: allows user to adjust what is sent to the AI.

**Generation Area**:

Depending on the trigger:

*Beat Card Wand:*
- "Generate Title Suggestion" button.
- "Generate Description Suggestion" button.
- Each button, when clicked, shows a loading spinner then renders the AI suggestion in a styled card with a light background border.
- Below the suggestion: "Accept" (replaces current beat title/description), "Edit" (opens an editable version of the suggestion), "Dismiss" (hides the suggestion).
- "Regenerate" link to get a different suggestion.

*Script Wand (Writing Surface):*
- "Generate Draft from Beat" -- available if the cursor is in a section linked to a beat. Generates prose or screenplay text based on the beat description, character profiles, and world context.
- "Continue Writing" -- generates a continuation from the current cursor position.
- The generated text appears in a suggestion block (visually distinct: light blue background, dashed border) inserted at the cursor position.
- Below the block: "Accept" (converts to normal text), "Edit Before Accepting" (inline edit within the suggestion block), "Dismiss" (removes the block).

*Synopsis Expansion Wand:*
- "Expand Logline to Synopsis" -- takes the current logline and generates a full synopsis.
- Suggestion appears in the synopsis textarea (same accept/edit/dismiss pattern).

#### User Actions

| Action | Result |
|---|---|
| Click wand icon (no synopsis) | Tooltip with "Write a synopsis first" message and sidebar link. |
| Click wand icon (synopsis exists) | Wand panel opens. |
| Click a generation button | Spinner for 2-5 seconds. Suggestion appears. |
| Click "Accept" | Suggestion replaces/inserts into the target field. Wand panel closes or remains for further generations. |
| Click "Edit" | Suggestion becomes editable. "Save" button replaces "Accept". |
| Click "Dismiss" | Suggestion is removed. Panel remains open for retry. |
| Click "Regenerate" | Previous suggestion fades out. Spinner, new suggestion appears. |
| Click "Edit Context" | Expandable section shows context. User can add/remove items. Next generation uses the updated context. |

#### Loading States

- Generation: spinner in the suggestion area with "Generating suggestion..." text. The button that was clicked is disabled.
- "More existing content = better generation" -- a subtle message appears: "Tip: the more world content you add, the better the suggestions become."

#### Empty States

- Not applicable (the wand panel only opens when explicitly triggered).

#### Error States

- AI generation failure: suggestion area shows "Failed to generate. [Error message]. Try again?" with retry button.
- Rate limiting: "You have reached the generation limit. Try again in [N] seconds."
- Context too large: "Your world context exceeds the maximum. The AI will use a summarized version." (handled automatically, but informational.)

#### Navigation

- The wand panel is a contextual overlay. It does not navigate the user anywhere. "Accept" modifies the current view's data.

---

### 5.5 Multi-Framework Overlay

**Route:** Accessible from `/(dashboard)/world/[id]/arcs` via the structure template selector, and from the Beat Sheet via structure beat mapping.

#### Screen Layout

This is an enhancement to the Arc Diagram (section 4.3), not a standalone page. When the user selects a structure template, the overlay is applied.

#### Framework Selector (Enhanced)

When the user clicks the structure template selector in the Arc Diagram toolbar:

- A dropdown appears listing all available frameworks, grouped:
  - **Western Act-Based**: Freytag's Pyramid, Three-Act Structure
  - **Journey/Cyclical**: Hero's Journey, Writer's Journey (Vogler), Dan Harmon Story Circle
  - **Beat-Based**: Save the Cat, Seven-Point (Dan Wells)
  - **Equilibrium**: Todorov Equilibrium
  - **Non-Western**: Kishotenketsu
  - **Advanced**: Dramatica (4 throughlines), Propp Morphology
- Each framework shows: name, beat count, brief one-line description.
- Clicking a framework applies it as the active overlay.

#### Comparison Mode

- A "Compare Frameworks" toggle in the toolbar.
- When enabled: a second framework selector appears. The user can select two frameworks to overlay simultaneously.
- Each framework gets a distinct color family (e.g., Save the Cat in blues, Hero's Journey in greens).
- The diagram shows both sets of expected beat positions as vertical lines, distinctly colored.
- A combined legend at the bottom identifies both frameworks.

#### Beat Mapping Interface

When a template is active, the Arc Diagram shows unmapped template beats as dimmed markers. The user can:

- Click an unmapped template beat marker.
- A dropdown appears listing unassigned story beats/scenes.
- Select a story beat to map it to the template beat.
- The mapping is saved. The diagram updates to show the story beat's actual position vs. the expected position.

#### User Actions

| Action | Result |
|---|---|
| Select a framework | Overlay applies to the Arc Diagram. Template beat positions appear. |
| Enable comparison mode | Second framework selector appears. Two overlays are shown. |
| Click an unmapped template beat | Dropdown to assign a story beat. |
| Remove a mapping | Click a mapped beat, select "Unmap" from context menu. |

---

### 5.6 Character Interview

**Route:** `/(dashboard)/world/[id]/characters/[charId]/interview`

#### Screen Layout

- **Top Bar**: Global bar with breadcrumb "Characters > [Character Name] > Interview".
- **Left Sidebar**: World navigation.
- **Main Content Area**: Interview questionnaire, single-column layout, max-width 640px centered.

#### Interview Structure

The interview is a guided questionnaire (inspired by Bibisco) organized into sections:

1. **Basics**: Full name, nicknames, age, birthdate, birthplace, current residence, occupation.
2. **Appearance**: Height, build, hair, eyes, distinguishing features, typical clothing, how they carry themselves.
3. **Psychology**: Greatest fear, greatest desire, fatal flaw, core belief, how they handle stress, what they would never do, their secret.
4. **Background**: Family, upbringing, education, key life events, traumas, achievements, regrets.
5. **Relationships**: Who do they love? Who do they fear? Who do they resent? Who depends on them?
6. **Voice**: How do they speak? Formal or casual? Verbal tics? Vocabulary level? Silence patterns?
7. **Story Role**: What do they want in this story? What stands in their way? How will they change?

Each section is a collapsible panel. Questions are displayed one at a time or as a scrollable form within each section.

- Each question has a textarea answer field.
- Answers autosave.
- A progress bar at the top shows completion: "[N] of [Total] questions answered."
- "Skip" button on each question to move to the next without answering.
- Completed questions show a green checkmark.

#### User Actions

| Action | Result |
|---|---|
| Answer a question | Text autosaves. Progress updates. |
| Skip a question | Moves to next question. Skipped questions are accessible by scrolling back. |
| Collapse/expand a section | Section toggles. |
| Click "Finish Interview" (at the bottom) | Summary view: all answered questions compiled into a character profile document. "Apply to Character Profile" button pushes answers into the character's structured fields. |
| Click "Apply to Character Profile" | Character entity is updated with interview data. Toast: "Character profile updated with interview responses." |

#### Loading States

- Questions load instantly (static content). Existing answers populate from saved data.

#### Empty States

- **No answers yet**: All fields are empty. The progress bar shows "0 of [N] questions answered."

#### Error States

- Autosave failure: small amber "Not saved" indicator next to the question. Retries automatically.

#### Navigation

- From: Character detail panel "Start Interview" button. Character profiles page.
- To: Character profile (via "Apply to Character Profile" or navigation).

---

### 5.7 Wiki / Encyclopedia

**Route:** `/(dashboard)/world/[id]/wiki`

#### Screen Layout

- **Top Bar**: Global bar.
- **Left Sidebar**: World navigation.
- **Secondary Sidebar** (within wiki, left, 240px): Table of contents.
  - Organized by entity type: Characters, Locations, Objects, Factions, Themes, Motifs, Events, Custom Entries.
  - Each type is collapsible, showing entries alphabetically beneath.
  - Search input at the top of the sidebar.
  - "New Entry" button at the bottom.
- **Main Content Area**: Wiki entry viewer/editor.

#### Wiki Entry Page

- **Title** (h1, editable on click).
- **Type badge** (Character, Location, etc.).
- **Infobox** (right-aligned, 280px): key-value pairs of structured fields relevant to the entity type.
  - Character: aliases, age, faction, status.
  - Location: coordinates, climate, significance.
  - Object: owner, last seen, significance.
- **Body text** (TipTap editor): rich text description. This is auto-generated from extracted data but fully editable.
- **Auto-links**: mentions of other entities in the body text are automatically hyperlinked (blue underline). Clicking navigates to that entity's wiki page.
  - Auto-linking works on exact name matches and aliases.
  - False positives can be dismissed (right-click > "Don't link this mention").
- **Related Entries** (bottom section): grid of linked entities with thumbnails/icons. Clickable.
- **Source References** (bottom section): list of source materials where this entity appears, with links.
- **Edit History**: collapsible section showing past edits with timestamps. "View diff" for any past version.

#### User Actions

| Action | Result |
|---|---|
| Click an entry in the sidebar | Main area loads that entry. |
| Click an auto-linked entity name in body text | Navigate to that entity's wiki page. |
| Edit body text | TipTap editor activates. Autosaves. |
| Click "New Entry" | Form: title, type, description. Creates a new wiki entry. |
| Search in sidebar | Filters the sidebar entries to matching results. Also searches body text (entries containing the search term are shown). |
| Right-click an auto-link > "Don't link" | That specific mention is excluded from auto-linking (persisted). |

#### Loading States

- Sidebar: skeleton entries (text lines).
- Entry page: skeleton with pulsing title, infobox, and paragraph blocks.

#### Empty States

- **No wiki entries**: "Your world encyclopedia is empty. Entries are created automatically when you confirm extracted entities, or you can create them manually." CTA buttons.
- **Entry body empty**: "No description yet. Click to start writing." placeholder text in editor.

#### Error States

- Failed to load entry: error card in main area with retry.
- Auto-link computation failed: links simply do not appear (graceful degradation).

#### Navigation

- From: Dashboard, sidebar nav, any entity name click across the entire app (if the entity has a wiki page).
- To: Any other wiki page (via auto-links). Source Material Viewer (via source references). Character/Location/Event detail pages.

---

### 5.8 Magic/Tech System Designer

**Route:** `/(dashboard)/world/[id]/systems`

#### Screen Layout

- **Top Bar**: Global bar.
- **Left Sidebar**: World navigation.
- **Secondary Sidebar** (240px): list of defined systems (e.g., "Arcane Magic", "FTL Drive", "The Force"). "Add System" button at top.
- **Main Content Area**: System detail editor.

#### System Editor

Each system has:

- **Name** (h1, editable).
- **Type badge**: Magic, Technology, Political, Economic, Custom.
- **Description** (textarea, rich text).
- **Rules Section** (table or card list):
  - Each rule: name, description, category (cost, limitation, exception).
  - "Add Rule" button opens inline form.
  - Rules are draggable to reorder.
- **Practitioners Section**:
  - List of characters who can use/access this system.
  - Each entry: character name (linked), proficiency level (slider 1-10), notes.
  - "Add Practitioner" button (character multi-select).
- **Costs and Limitations Section**:
  - Structured fields for: what it costs to use the system, hard limits, side effects.
  - Each cost/limitation is an editable card.
- **Interactions Section**:
  - How this system interacts with other defined systems.
  - Each interaction: target system (linked), interaction type (synergy/conflict/neutral), description.
- **Consistency Rules**:
  - Rules derived from this system that the Consistency Checker should enforce.
  - E.g., "A character cannot use magic if their mana is below 10."
  - These feed directly into the WorldRule entity in the data model.

#### User Actions

| Action | Result |
|---|---|
| Click "Add System" | New system form: name, type, description. Creates and opens the system. |
| Add a rule | Inline form expands within the Rules section. Save appends the rule. |
| Add a practitioner | Character selector appears. Selected character is added with default proficiency. |
| Edit any field | Autosaves on blur. |
| Delete a system | Confirmation dialog. All rules and associations are removed. |

#### Loading States

- Sidebar: skeleton entries. Editor: skeleton fields.

#### Empty States

- **No systems defined**: "Define the rule-based systems of your world -- magic, technology, politics, or anything custom. The consistency checker will enforce these rules across your story." CTA: "Create Your First System."

#### Error States

- Failed to save: toast with retry.

#### Navigation

- From: Dashboard, sidebar nav.
- To: Character profiles (via practitioner links). Consistency Checker (via consistency rules).

---

### 5.9 Custom Calendar

**Route:** `/(dashboard)/world/[id]/settings/calendar`

#### Screen Layout

- **Top Bar**: Global bar with breadcrumb "Settings > Calendar".
- **Left Sidebar**: World navigation.
- **Main Content Area**: Calendar configuration form, single-column, max-width 640px.

#### Configuration Fields

- **Calendar name** (text input, e.g., "Elven Calendar", "Stardate System").
- **Time units** (repeating section, add/remove):
  - Unit name (e.g., "Cycle", "Moon", "Rotation").
  - Duration relative to parent unit (e.g., 1 Year = 13 Moons, 1 Moon = 28 Days).
  - Sub-units nested beneath.
- **Eras** (repeating section):
  - Era name (e.g., "First Age", "Post-Collapse").
  - Start event (select from world events or enter a year number).
  - End event (optional, or "ongoing").
- **Days of the week** (if applicable):
  - Custom day names (e.g., "Starday, Sunday, Moonday, ...").
  - Number of days per week.
- **Months/Periods** (if applicable):
  - Custom month names.
  - Days per month (can vary per month).
- **Preview**: a rendered calendar preview showing a sample month/period with the configured structure.

#### User Actions

| Action | Result |
|---|---|
| Fill configuration fields | Preview updates in real time. |
| Save | Calendar system is saved. It becomes available in the Timeline view's calendar toggle. POST/PATCH to `/api/worlds/[id]/calendar`. |
| Reset to Standard | Reverts to a standard Earth calendar. Confirmation dialog. |

#### Loading States

- Form loads with saved data or defaults. Preview renders after initial form load.

#### Empty States

- **No custom calendar configured**: Form shows default Earth calendar structure. "Customize for your world" call-to-action.

#### Error States

- Invalid configuration (e.g., 0 days in a month): inline validation error on the offending field.
- Save failure: toast with retry.

#### Navigation

- From: World Settings page, sidebar nav.
- To: Timeline (calendar is used there). World Settings.

---

## 6. Collaboration

### 6.1 Writers Room

**Route:** Real-time collaboration is layered on top of all world sub-pages. No separate route for the writers room itself. Collaborative features are visible when multiple users are in the same world.

#### Presence Indicators

- **Top bar**: Avatars of all users currently viewing this world, displayed as a row of small circles (max 5 shown, "+N" overflow). Each avatar has a colored ring indicating their current page (color-coded by route: Writing = blue, Beats = green, Timeline = purple, etc.).
- Hovering an avatar shows: user name, role, current page ("Viewing: Beat Sheet").
- Click an avatar to "follow" that user (your view navigates to their current page and tracks their position).

#### Real-Time Editing (Writing Surface)

- When multiple users are in the Writing Surface simultaneously:
  - Each user's cursor is visible as a colored caret with their name label above it.
  - Selections are shown as colored highlights matching the user's assigned color.
  - Changes appear in real time (via Yjs CRDT synchronization).
  - Conflicting edits at the same position are handled by CRDT merge rules (last-writer-wins at the character level, but practically seamless).

#### Real-Time Editing (Beat Sheet)

- Beat cards being edited by another user show a colored border and a small avatar indicator: "[User] is editing."
- Drag-and-drop by one user is visible to all others in real time.
- If two users attempt to drag the same card, the first drag takes priority; the second user sees a toast: "[User] is already moving this card."

#### Roles and Permissions

Configured in World Settings:

| Role | Permissions |
|---|---|
| **Owner** | Full control. Can delete the world. Can manage roles. |
| **Showrunner** | Full editing. Can manage canon, run consistency checks, merge what-if scenarios. Cannot delete the world. |
| **Writer** | Can edit writing surface, beats, characters, and all content. Cannot manage canon or merge. |
| **Researcher** | Can add source materials, create wiki entries, and add annotations. Cannot edit writing surface or beats. |
| **Viewer** | Read-only access to all permitted areas (subject to fog-of-war). |

#### User Actions

| Action | Result |
|---|---|
| Invite a user | World Settings > Collaborators > "Invite" button. Enter email. Select role. Send invitation. |
| Change a user's role | World Settings > Collaborators > role dropdown next to user name. |
| Remove a user | World Settings > Collaborators > "Remove" button (with confirmation). |
| Follow a user | Click their presence avatar. Your view follows theirs until you navigate manually or click "Stop Following". |

#### Loading States

- Presence indicators appear as users connect. There may be a 1-2 second delay.
- Real-time edits propagate with typical <500ms latency.

#### Error States

- WebSocket disconnection: amber banner "Connection lost. Reconnecting..." with retry indicator. Local edits are buffered and synced on reconnection. CRDT ensures consistency.
- Conflict notification: if an entity-level conflict is detected (e.g., two users edited the same character's description), a toast: "Conflict detected on [Entity Name]. Review?" opens a diff view.

#### Navigation

- Collaboration features are accessible from any world page. Management is in World Settings.

---

### 6.2 Fog-of-War Access

**Route:** `/(dashboard)/world/[id]/settings/access`

#### Screen Layout

- **Top Bar**: Global bar with breadcrumb "Settings > Access Control".
- **Left Sidebar**: World navigation.
- **Main Content Area**: Access control configuration.

#### Configuration Interface

- **User/Role list** (left column, 300px): list of all collaborators with their roles.
- **Permission Matrix** (right area): a grid/table.
  - Rows = entity types or specific entities (Characters, Locations, Factions, Arcs, Scenes, or specific named entities).
  - Columns = collaborators or roles.
  - Each cell = permission level: "Full" (green), "Redacted" (amber, entity exists but details hidden), "Hidden" (red, entity does not appear at all).
  - Click a cell to cycle through permission levels.

#### Presets

- "Full Access" -- all entities visible to all.
- "Per-Character" -- each writer only sees characters and scenes relevant to their assigned character.
- "Mystery Mode" -- certain plot reveals are hidden from specific collaborators (useful for writers rooms where different writers should not know each other's twists).
- "Custom" -- manual per-entity configuration.

#### User Actions

| Action | Result |
|---|---|
| Select a preset | Permission matrix updates to match the preset. Cells can still be individually adjusted. |
| Click a permission cell | Cycles: Full > Redacted > Hidden > Full. |
| Save | Permissions are applied immediately. Affected users' views update on their next page load or in real time. |

#### Loading States

- Permission matrix: skeleton grid.

#### Empty States

- **Solo user (no collaborators)**: "Fog-of-war access control is for collaborative worlds. Invite collaborators to configure who sees what." CTA: "Invite Collaborators."

#### Error States

- Save failure: toast with retry.

#### Navigation

- From: World Settings.
- To: Collaborator management (same settings area).

---

### 6.3 Comments and Mentions

**Route:** No dedicated route. Comments are accessible from any entity detail panel, beat card, scene, or wiki entry.

#### Comment Panel

A collapsible section at the bottom of any entity detail view or as a tab in detail drawers.

- **Comment list**: chronological list of comments.
  - Each comment: avatar, user name, timestamp, comment text, "Reply" link, "Edit" (own comments), "Delete" (own comments + owners/showrunners).
  - Threaded replies (1 level deep): replies are indented beneath the parent comment.
- **New comment input**: textarea at the bottom with "Post" button.
  - @mention support: typing "@" shows an autocomplete dropdown of collaborators. Selecting a user inserts `@Username` which is rendered as a highlighted link.
  - Entity mentions: typing "[[" shows an autocomplete dropdown of entity names. Selecting one inserts a linked mention.

#### @Mention Notifications

- When a user is @mentioned, they receive:
  - A notification in the notification bell (top bar).
  - An optional email notification (configurable in user settings).
- Clicking the notification navigates to the comment in context (the entity detail view, scrolled to the comment).

#### User Actions

| Action | Result |
|---|---|
| Post a comment | Comment appears in the list. Mentioned users are notified. |
| Reply to a comment | Reply textarea opens below the comment. Reply appears as a threaded reply. |
| Edit own comment | Comment text becomes editable. "Save" / "Cancel" buttons appear. |
| Delete own comment | Confirmation dialog. Comment is removed (or marked "[deleted]" if it has replies). |
| Click @mention in a comment | Navigates to that user's profile or shows a user popover. |
| Click entity mention in a comment | Navigates to that entity's detail page or wiki entry. |

#### Loading States

- Comment list: skeleton comments (avatar circle, text lines).

#### Empty States

- **No comments**: "No comments yet. Start a conversation about this [entity type]." with focus on the input textarea.

#### Error States

- Failed to post: toast "Failed to post comment. Try again." Comment text is preserved in the input.
- Failed to load comments: "Unable to load comments. Retry?" in the comments section.

---

## 7. Export and Sharing

### 7.1 Series Bible Export

**Route:** Modal triggered from `/(dashboard)/world/[id]/settings` or a top-bar "Export" menu.

#### Export Configuration Modal

- **Format selector**: PDF | Notion | DOCX.
- **Sections to include** (checklist, all checked by default):
  - Cover page (world name, logline, genre, date).
  - Synopsis.
  - Character profiles (all or selected characters, with configurable detail level: summary / full / interview responses).
  - Location descriptions.
  - Faction/organization profiles.
  - Timeline summary.
  - Arc summaries.
  - Beat sheet / treatment.
  - World rules / systems.
  - Relationship map (as static image).
  - Custom sections (user can add freeform sections).
- **Character detail level**: "Summary" (name, role, brief description) | "Standard" (all core fields) | "Full" (including interview, voice profile, emotional arc).
- **Style options** (PDF only):
  - Template: "Professional" | "Creative" | "Minimal".
  - Include cover image (file upload).
- **"Generate Export" button**.

#### User Actions

| Action | Result |
|---|---|
| Configure and click "Generate Export" | Export job starts. Progress bar in modal. On completion, download link appears. |
| Select Notion format | Additional field: "Notion API key" or "Connect Notion Account" (OAuth). Export pushes to Notion workspace. |

#### Loading States

- Generation: progress bar with estimated time. "Generating page [N] of [M]..."

#### Error States

- Generation failure: error message in modal with retry button.
- Notion connection failure: "Unable to connect to Notion. Check your API key." with edit field.

---

### 7.2 Screenplay Export

**Route:** Modal triggered from Writing Surface toolbar or top-bar "Export" menu.

#### Export Configuration Modal

- **Format selector**: .fountain | .fdx (Final Draft) | PDF.
- **Content scope**: "Entire Script" | "Selected Chapters/Episodes" (multi-select).
- **Include title page**: toggle (yes/no). Title page fields: title, author, contact, date, draft number.
- **Formatting options** (PDF only):
  - Page size: US Letter | A4.
  - Font: Courier Prime (default) | Courier New.
  - Include page numbers, scene numbers.
- **"Export" button**.

#### User Actions

| Action | Result |
|---|---|
| Configure and click "Export" | File is generated. Browser download dialog. |
| Select .fountain | Generates a plain-text .fountain file. Near-instant. |
| Select .fdx | Generates a Final Draft XML file. Near-instant. |
| Select PDF | Generates a properly formatted screenplay PDF. May take a few seconds for long scripts. Progress spinner on button. |

#### Loading States

- Export generation: spinner on button. "Generating..." text.

#### Error States

- Failed to generate: toast "Export failed. [Error message]." Retry button.
- No script content: "There is no script content to export. Write your script in the Writing Surface first." with link.

---

### 7.3 Shareable Web Link

**Route:** Modal triggered from `/(dashboard)/world/[id]/settings` or top-bar "Share" button.

#### Share Configuration Modal

- **Share toggle**: "Sharing is OFF" / "Sharing is ON". Toggle to enable.
- **Link** (when sharing is on): a read-only URL field with "Copy" button. Format: `https://storyforge.app/shared/[token]`.
- **Visibility**:
  - "Full World" -- the viewer sees everything (subject to fog-of-war if configured).
  - "Selected Views" -- checkboxes for which views are accessible: Dashboard, Characters, Timeline, Arcs, Beat Sheet, Wiki, Treatment.
- **Authentication**:
  - "Anyone with the link" (no auth required).
  - "Password protected" (enter a password that viewers must provide).
  - "Specific users" (enter email addresses; those users get access).
- **Expiration**: "Never" | "24 hours" | "7 days" | "30 days" | "Custom date".
- **"Update Sharing Settings" button**.

#### Shared View (Public Page)

The shared URL renders a read-only version of the world:

- StoryForge branding in the top bar, but no user account UI.
- Navigation limited to the views selected by the owner.
- All edit actions are removed. Viewers can read, scroll, zoom, and interact with visualizations (e.g., time slider, graph exploration) but cannot modify anything.
- If password protected: a password prompt page appears before the content.
- Footer: "Created with StoryForge" link.

#### User Actions

| Action | Result |
|---|---|
| Toggle sharing on | Link is generated. Copy button appears. |
| Toggle sharing off | Link is deactivated. Existing viewers see a "This link is no longer active" page. |
| Click "Copy" | Link copied to clipboard. Toast: "Link copied." |
| Change visibility/auth/expiration | Settings update immediately on save. Existing link remains the same. |

#### Loading States

- Link generation: brief spinner while token is created.

#### Empty States

- **Sharing not enabled**: Toggle is off. "Enable sharing to generate a link." text.

#### Error States

- Failed to generate link: toast "Failed to create sharing link. Try again."
- Failed to update settings: toast with retry.

#### Navigation

- From: World Settings, top-bar "Share" button.
- To: The shared link is external. No navigation back into the app from the shared view (except the "Created with StoryForge" link to the marketing site).

---

## Appendix: Global Navigation Map

```
/ (Landing/Marketing)
  -> /(auth)/signin
  -> /(auth)/signup

/(auth)/signin -> /(dashboard)/worlds
/(auth)/signup -> /(dashboard)/worlds/new

/(dashboard)/worlds
  -> /worlds/new (Create World)
  -> /world/[id] (Open World)

/(dashboard)/world/[id] (Dashboard)
  -> /world/[id]/write (Writing Surface)
  -> /world/[id]/beats (Beat Sheet)
  -> /world/[id]/treatment (Treatment View)
  -> /world/[id]/timeline (Dual Timeline)
  -> /world/[id]/characters (Character Map)
  -> /world/[id]/characters/[charId]/interview (Character Interview)
  -> /world/[id]/arcs (Arc Diagram)
  -> /world/[id]/arcs/emotional (Emotional Arc Chart)
  -> /world/[id]/mindmap (Mind Map)
  -> /world/[id]/sources (Source Materials)
  -> /world/[id]/sources/review (Entity Review)
  -> /world/[id]/sources/[sourceId] (Source Viewer)
  -> /world/[id]/factions (Faction Map)
  -> /world/[id]/pacing (Pacing Heatmap)
  -> /world/[id]/causality (Causality Graph)
  -> /world/[id]/foreshadowing (Foreshadowing Web)
  -> /world/[id]/knowledge (Audience Knowledge Map)
  -> /world/[id]/whatif (What-If Scenarios)
  -> /world/[id]/canon (Canon Management)
  -> /world/[id]/consistency (Consistency Checker)
  -> /world/[id]/wiki (Wiki / Encyclopedia)
  -> /world/[id]/systems (Magic/Tech Systems)
  -> /world/[id]/settings (World Settings)
  -> /world/[id]/settings/calendar (Custom Calendar)
  -> /world/[id]/settings/access (Fog-of-War Access)

Overlays (accessible from any world page):
  - Story Sidebar (right panel toggle)
  - AI Assist Wand (contextual panel)
  - Command Palette (cmd+K)
  - Comments (entity detail panels)
  - Guided Tour (first visit)
  - Presence Indicators (always visible with collaborators)
```
