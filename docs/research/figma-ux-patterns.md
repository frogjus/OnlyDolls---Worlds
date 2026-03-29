# Figma UX Patterns: Comprehensive Research for StoryForge

> Research conducted 2026-03-29. Covers Figma's navigation structure, information hierarchy, onboarding, collaboration UX, component systems, and lessons applicable to StoryForge.

---

## 1. Navigation Structure

### 1.1 File Browser (Home/Dashboard Level)

Figma's organizational hierarchy follows a strict top-down model:

**Organization > Teams > Projects > Files > Pages**

- **Organization/Workspace**: Top-level container. Usually one per company. Enterprise plans support multiple workspaces.
- **Teams**: Groupings that house projects and files. Can be structured by department, platform, line of business, or specific effort. Three permission levels: **open** (anyone can join), **closed** (requires request), **secret** (invisible to non-members).
- **Projects**: Collections of files within a team (similar to folders). **No subfolder nesting** -- flat structure within projects, forcing intentional organization.
- **Files**: Individual design documents. Each can contain multiple pages.
- **Pages**: Tabs within a file, acting as separate canvases (e.g., "Wireframes," "Components," "Hi-Fi Designs").
- **Drafts**: Personal sandbox space for experimentation before sharing. Private to the user; only explicitly invited people can see them.

**Key patterns:**
- The file browser is the "home base" where users manage their account, browse teams/projects/files, and discover community resources.
- Cover pages (thumbnails) are encouraged as the first page of every file for at-a-glance identification.
- Link-based sharing means any file can be shared via URL with granular permission control (view-only or edit).

### 1.2 Canvas Navigation (Editor Level)

The Figma editor workspace has three primary zones:

1. **Left Sidebar**: Contains the **Layers panel** (hierarchical object tree) and **Assets panel** (component library browser). Tabs switch between them. The Layers panel supports expand/collapse of groups, visibility toggles (eye icon), and lock toggles (padlock icon).

2. **Right Sidebar (Properties Panel)**: Contextual and dynamic -- content changes based on selection. Contains:
   - **Design tab**: Layout, color, typography, effects, component properties, styles, variables.
   - **Prototype tab**: Interaction flows, transitions, triggers.
   - When nothing is selected, shows file-level styles and variables.
   - When a component instance is selected, shows a **component playground** for experimenting with properties.

3. **Toolbar**: Sits at the **bottom of the canvas** (post-UI3 redesign). Houses the selection tool, frame tool, shape tools, pen tool, text tool, and other essential creation tools. The Figma logo/menu dropdown is at the top-left.

4. **Canvas**: Infinite 2D workspace. Pan with spacebar+drag or the Hand tool (H). Zoom via scroll wheel (Cmd/Ctrl + scroll), pinch gestures, or keyboard shortcuts.

**Zoom system:**
- `Shift+1`: Zoom to fit (see everything on the page)
- `Shift+2`: Zoom to selection (center on selected element)
- `Shift+Plus/Minus`: Incremental zoom in/out
- Pixel grid appears at 400%+ zoom for pixel-perfect work
- Current zoom percentage displayed in top-right corner; custom values can be entered directly
- Default zoom on file open: "Zoom to fit"

**No native minimap.** Navigation relies on zoom shortcuts, the Hand tool, the Layers panel, and frame selection. This is notable -- Figma chose simplicity over overview navigation.

### 1.3 View Modes

- **Design Mode**: Default editing canvas.
- **Prototype Mode**: Shows interaction flows, hotspots, and connections between frames.
- **Dev Mode** (Shift+D): Developer-focused view with inspect capabilities, code snippets, design token information, and "Ready for dev" status indicators.
- **Presentation Mode**: Full-screen prototype playback with hotspot hints, device framing, and scaling options. Supports keyboard navigation.
- **Inline Preview**: Play prototypes directly on the canvas alongside design files, with synchronized selection.
- **Minimize UI** (Cmd/Ctrl + .): Hides all panels for a clean canvas view.

---

## 2. Information Hierarchy

### 2.1 Progressive Disclosure

Figma is a masterclass in progressive disclosure for complex creative tools:

- **Beginner surface**: Clean canvas, minimal toolbar at bottom, properties panel that contextually shows only relevant options. New users see only what they need.
- **Advanced features revealed on demand**: Auto Layout, component variants, variables, design tokens, and branching are available but not prominent until needed.
- **Property labels**: Can be toggled on in settings to add text labels to properties panel controls -- helpful for learning, turned off by power users.
- **Command Palette** (Cmd/Ctrl + / or Cmd/Ctrl + P): The ultimate progressive disclosure mechanism. Every command in the application is searchable. This both helps beginners discover features and lets power users access anything in 2-3 keystrokes. Shows keyboard shortcuts alongside commands to teach habits.

### 2.2 Contextual Properties Panel

The right sidebar is perhaps Figma's most important information hierarchy decision:

- **Nothing selected**: Shows file-level styles, variables, and page settings.
- **Single element selected**: Shows all properties for that specific element type (frame, text, shape, etc.).
- **Component instance selected**: Shows component properties, variant selectors, and a component playground.
- **Multiple elements selected**: Shows shared/mixed properties with clear indicators.
- **View-only access**: Shows inspect-focused properties with code output.

This contextual approach means the panel never shows irrelevant information, reducing cognitive load substantially.

### 2.3 Layers Panel Hierarchy

- Hierarchical tree structure with parent-child relationships.
- Groups and frames act as containers.
- Descriptive naming convention encouraged ("header-navigation" not "Group 1").
- Visual indicators for component instances, locked layers, hidden layers.
- Search/filter capability within the layers panel.

### 2.4 Component Organization

- Components use a **slash-naming convention** for hierarchy: `Button/Primary/Large` creates a nested path in the assets panel.
- Variant properties (size, state, mode) are exposed as dropdowns when selecting instances.
- Component sets group related variants into a single visual container.
- Design system libraries can be published and shared across teams/projects.

---

## 3. Onboarding Flow

### 3.1 First-Time Experience

Figma's onboarding follows a guided tour pattern:

1. **Welcome modal**: Invites users to opt into a walkthrough. Emphasizes features that differentiate Figma from competitors (strategic -- not just teaching, but selling).
2. **Animated tooltips**: Each step combines concise copy with an animation showing the feature in action. This dual-modality approach (text + visual) accommodates different learning styles.
3. **Progressive feature introduction**: The tour covers import (from Sketch), core design tools, and collaboration (inviting team members) -- in that order. Import first reduces switching cost anxiety.
4. **Skip option**: Available but not prominent. Users can opt out at any point.
5. **Resource links**: Complex features include links to deeper documentation, avoiding tooltip bloat.

### 3.2 Key Onboarding Principles

- **Brevity per step, depth available on demand**: Each tooltip is short (1-2 sentences). Longer explanations are linked, not inlined.
- **Competitive differentiation in onboarding**: The welcome modal specifically highlights what makes Figma unique, motivating users to take the tour.
- **Animation as teaching**: Every tooltip has an accompanying animation demonstrating the feature. Shows, doesn't just tell.
- **Early collaboration prompt**: Inviting team members is part of the initial onboarding, not a separate discovery -- embedding the collaborative value proposition from minute one.
- **Templates as training wheels**: A rich library of community templates provides immediate starting points, reducing blank-canvas paralysis.
- **Consistent, familiar paradigms**: Interface uses patterns familiar from other creative tools (toolbar, layers panel, properties) to reduce learning curve.

### 3.3 Ongoing Education

- **Command Palette as learning tool**: Shows keyboard shortcuts next to every action, passively teaching power-user habits.
- **Keyboard shortcut overlay** (Ctrl+Shift+?): Full reference panel.
- **Community resources**: Tutorials, templates, and examples available within the app.
- **Property labels toggle**: Optional verbose labels on interface controls for learners.

---

## 4. Key UX Patterns

### 4.1 Multiplayer Cursors & Presence

This is Figma's signature UX innovation and the pattern most relevant to StoryForge:

**How it works:**
- Every active user in a file gets a **color-coded cursor** with their **name label**.
- Cursors show real-time position on the canvas, reflecting where each person is working.
- Each user's **current selection** is also visible (highlighted with their color).
- User avatars appear in the **top-right toolbar** showing who's currently in the file.

**Communication layer:**
- Pressing **/** (forward slash) attaches a **text chat field** to the cursor, enabling inline canvas chat.
- Cursors convey **intention** -- seeing a colleague's cursor near a component communicates what they're focused on without any explicit communication.
- Waving a cursor gets attention; placing it near an object points at it -- cursor-as-gesture.

**Technical implementation:**
- WebSocket connections for persistent bidirectional communication.
- Cursor updates throttled to max ~20/second.
- Binary protocols (not JSON) for high-frequency cursor updates.
- Cursor positions buffered and rendered via requestAnimationFrame for smoothness.
- Custom sync system (not OT, not pure CRDT) -- server-centric with CRDT-like properties for conflict resolution.

**UX impact:**
- Reduced overall complexity by eliminating "workaround workflows" (file emailing, version syncing, export-import cycles).
- Created a feeling of **presence** vital for remote teams.
- Enabled informal communication patterns (pointing, gesturing with cursor) that were previously impossible in digital tools.

### 4.2 Observation Mode & Spotlight

**Observation Mode:**
- Click any user's avatar to mirror their view -- see exactly what they see, including all movements and edits.
- Use cases: design critiques, client walkthroughs, user testing, education.
- Works even for view-only users.
- No notification sent when someone starts observing (low friction).

**Spotlight Mode:**
- Enhanced version: presenter explicitly "spotlights" themselves, automatically pulling all viewers to their viewport.
- Viewers get a notification with a few seconds to decline ("Not now") before auto-following.
- Shows follower count. Can be stopped at any time.
- Others can "request spotlight" from someone.
- Works in presentation view, FigJam, and regular design files.
- Eliminates "next slide please" problem entirely.

### 4.3 Component System & Variants

**Components:**
- Reusable design elements (master + instances).
- Changes to the master propagate to all instances.
- Instances can have **overrides** (changed text, swapped icons, different states).
- Slash-naming (`Button/Primary/Large`) creates organizational hierarchy.

**Variants:**
- Group similar components (e.g., button sizes, states, modes) into a single component set.
- Variant properties exposed as dropdowns/toggles in the properties panel.
- Boolean variants (true/false) for on/off states.
- Reduces library bloat -- one entry point, many configurations.
- Naming convention: forward-slash groups become property values.

**Key lesson:** Components + Variants create a "single source of truth" pattern that scales. Complex objects (e.g., a button with 100+ combinations of size/state/mode/theme) are manageable through structured property exposure.

### 4.4 Auto Layout

- Behaves like CSS Flexbox: direction, padding, spacing, alignment, and wrap.
- Frames automatically resize based on content (hug contents, fill container, or fixed).
- Supports min/max width and height constraints.
- Nested Auto Layout creates complex responsive structures.
- **Love/hate relationship**: Powerful for consistency and responsiveness, but feels restrictive for quick, freeform design. Learning curve is significant.

### 4.5 Command Palette

- Accessed via `Cmd/Ctrl + /` or `Cmd/Ctrl + P`.
- Fuzzy search across all available commands, tools, and actions.
- Shows keyboard shortcuts alongside each command (educational).
- Considered "slept on" by many users -- a high-ceiling feature for power users.
- Acts as a universal access point that reduces menu diving.
- Pattern increasingly popular across creative/productivity tools (VS Code, Slack, Notion, Linear).

### 4.6 Comments & Annotations

- **Pin comments** directly to specific elements on the canvas.
- **@mention** collaborators for notifications.
- **Threaded replies** for in-depth discussions without cluttering the workspace.
- **Resolution marking**: Comments can be marked as resolved to maintain organization.
- **Annotations**: More structured than comments -- for design specifications, decision documentation, and prototyping notes.
- Comments visible in a sidebar panel and as on-canvas markers.

### 4.7 Branching & Version Control

Figma's branching system (Organization/Enterprise only) mirrors git concepts:

- **Branches**: Exploratory copies of a file for safe experimentation.
- **Merge**: Bring branch changes back into the main file.
- **Review requests**: Request approval before merging.
- **Conflict resolution**: When two branches modify the same element, users must choose "Keep main" or "Keep branch" per conflict. **No granular merge** -- entire elements are accepted/rejected, not individual properties.
- **Version history**: Timestamped checkpoints with named versions for milestones. Merges create automatic checkpoints.
- **Undo merges**: Restore previous versions from history.

**Key limitation:** Conflict resolution is coarse-grained. Two designers cannot work on different properties of the same component in separate branches and merge both changes. This is a significant pain point for teams.

### 4.8 Dev Mode

- Toggle via Shift+D or a button in the toolbar.
- Shows **inspect panel** with measurements, colors, typography, spacing.
- Generates **code snippets** (CSS, iOS, Android).
- Supports **design tokens** for systematic design-to-code consistency.
- **"Ready for dev" status** on components signals handoff readiness.
- Status change notifications alert developers when designs are ready.
- Integrates with Jira and other development tools.
- Role-specific view: developers see what they need without design tool complexity.

### 4.9 Notification System

- **Multiple channels**: In-app bell, email, Slack integration, Microsoft Teams, desktop app system tray, and mobile.
- **Notification types**: Comments, mentions, file invitations, branch merges, "Ready for dev" status changes.
- **Smart grouping**: Multiple status changes within an hour are batched into single notifications.
- **Frequency controls**: Real-time, hourly, or daily digest options for Slack/Teams.
- **Expanded recipients**: Originally only file owners got comment notifications; Figma expanded to include all editors after research showed most collaborators were missing updates.

---

## 5. What Users Praise

### 5.1 Collaboration (Universally #1)
- "Google Docs for design" -- the multiplayer editing model is Figma's defining advantage.
- Eliminates version conflicts, export/import cycles, and file-emailing workflows.
- Distributed teams can work simultaneously without coordination overhead.
- Stakeholders, developers, and designers share one source of truth.

### 5.2 Zero-Friction Access
- Browser-based: no installation, no downloads, no OS restrictions.
- Link-based sharing: anyone with a URL can view/comment/edit (based on permissions).
- WebAssembly provides near-native performance in a browser.
- Free tier is genuinely usable (3 files, unlimited drafts).

### 5.3 Intuitive Interface
- Clean layout with logically organized tools.
- Minimal learning curve for basic tasks.
- "You can go from idea to high-fidelity designs quickly without wrestling with the tool."
- Familiar paradigms for anyone who's used creative software before.

### 5.4 Design Systems & Components
- Component libraries with variants create scalable, consistent design systems.
- Cross-file library sharing keeps entire organizations aligned.
- Auto Layout brings CSS-like responsive behavior to design.

### 5.5 Design-to-Developer Handoff
- Dev Mode provides developers with exact specifications, code snippets, and design tokens.
- Before Figma, handoff meant "throwing a PDF" and having developers guess dimensions.
- Same link for designers and developers -- no export step.

### 5.6 Plugin Ecosystem
- 1,500+ community-built plugins extending functionality.
- Drives ~50% of user engagement.
- Architecture makes plugin creation accessible: "If you can code a webpage, you can build a Figma plugin."
- Community templates and resources create network effects.

### 5.7 All-in-One Ecosystem
- Design (Figma Design), brainstorming (FigJam), presentations (Figma Slides), and development handoff (Dev Mode) in one platform.
- Prototyping built into the design tool -- no third-party needed.
- Reduces tool sprawl and context switching.

---

## 6. What Users Criticize

### 6.1 Performance with Large Files
- Complex files with many components cause significant slowdowns.
- Browser-based rendering hits memory limits faster than native apps.
- Some users report files becoming "excruciatingly slow" or completely unresponsive.
- Lower-end devices are disproportionately affected.

### 6.2 Internet Dependency
- Core functionality requires an internet connection.
- Limited offline capabilities -- disruptive when connectivity is unstable.
- Cloud-based architecture makes this a fundamental constraint.

### 6.3 UI3 Redesign Backlash
- Floating panels initially cramped canvas space, especially on laptops.
- Relocated features were hard to find for long-time users.
- Common actions required more clicks post-redesign.
- Accessibility concerns: floating panel gaps triggered issues for neurodivergent users.
- **Figma reversed the decision**: panels were re-docked after overwhelming negative feedback. The bottom toolbar remains floating.
- Key lesson: "Redesigning for designers means setting a destination, but making sure everyone is along for the journey."

### 6.4 Auto Layout Learning Curve
- Powerful but complex -- designers describe a "love/hate relationship."
- Feels restrictive for quick, freeform layouts.
- Instance behavior sometimes differs from master component behavior.
- Mastering it takes significant time investment.

### 6.5 Pricing
- Per-seat model gets expensive as teams grow.
- Freelancers need separate seats for each client, multiplying costs.
- Advanced features (branching, Dev Mode) locked behind higher tiers.
- Billing transparency issues reported by some users.
- Free plan limitations push individual designers to paid tiers quickly.

### 6.6 Bugs & Stability
- Crashes and data loss reported, especially with large files.
- Font handling described as "terrible" by some users.
- Plugin errors can produce "truly impenetrable" error messages.

### 6.7 Branching Limitations
- No granular merge -- entire elements must be accepted/rejected.
- Two designers changing different properties of the same component creates irreconcilable conflicts.
- Requires heavy coordination to avoid merge issues.
- Only available on Organization/Enterprise plans.

### 6.8 Focus Drift
- Some designers feel Figma is shifting focus toward product managers, developers, and enterprise features at the expense of core design tool refinement.
- AI features met with skepticism by designers worried about "AI writing their designs."

---

## 7. Patterns StoryForge Should Adopt

### 7.1 Multiplayer Presence (Critical for Collaborative Writing)

StoryForge is building for writers rooms and small teams (2-5 people). Figma's presence system is directly applicable:

- **Color-coded cursors with name labels** in the beat sheet, writing surface, and visualization views.
- **Avatar bar** showing who's active in the current story world.
- **Observation mode**: Click a collaborator's avatar to follow their view -- invaluable for writing room walkthroughs, story reviews, and showrunner oversight.
- **Spotlight mode**: Presenter can guide all viewers through a beat sheet or treatment review.
- **Cursor-as-communication**: In the beat sheet view, seeing where a collaborator's cursor is hovering communicates focus without interruption.

**Technical approach**: WebSocket connections for real-time sync. Throttle cursor updates (~20/sec). Use binary encoding for high-frequency position data. Buffer and render via requestAnimationFrame.

### 7.2 Command Palette (Essential for Complex Feature Set)

StoryForge has 30+ features across multiple views. A command palette is essential:

- `Cmd+K` or `Cmd+/` to open.
- Fuzzy search across all commands: "Switch to timeline view," "Create new beat," "Open character graph," "Jump to act 2," "Toggle fabula timeline."
- Show keyboard shortcuts alongside commands.
- Include navigation: "Go to [world name]," "Open [character name]."
- Include entity search: "Find character [name]," "Find scene with [keyword]."
- This single pattern can replace complex menu hierarchies and make 30+ features accessible without overwhelming the UI.

### 7.3 Contextual Properties Panel

Figma's right sidebar pattern maps perfectly to StoryForge:

- **Nothing selected (Beat Sheet view)**: Show world-level stats, synopsis, overall progress.
- **Beat card selected**: Show beat properties (title, description, characters, tags, star rating, notes, treatment override).
- **Character selected (Relationship Map)**: Show character profile, attributes, active relationships.
- **Scene selected (Timeline)**: Show scene properties, value changes, pacing metrics.
- **Event selected (Causality Graph)**: Show event details, causal relationships, affected entities.

The panel should be **contextual and dynamic** -- never show irrelevant properties.

### 7.4 Progressive Disclosure for Feature Tiers

StoryForge has three feature tiers. Figma's progressive disclosure approach applies directly:

- **Default surface (Tier 1)**: Beat sheet, writing surface, character profiles, basic timeline. Clean, minimal, focused.
- **Revealed on demand (Tier 2)**: Canon management, consistency checking, story versioning, auto-linking wiki. Available in navigation but not prominent.
- **Power user features (Tier 3)**: Multi-framework overlays, what-if scenarios, narrative code annotations, causality chains. Accessible via command palette and settings, not cluttering the default interface.
- **Property labels toggle**: Like Figma's, offer optional verbose labels for narrative theory concepts (e.g., "Fabula Timeline (chronological truth)" vs. just "Fabula").

### 7.5 Organizational Hierarchy

Map Figma's hierarchy to StoryForge:

| Figma | StoryForge Equivalent |
|-------|----------------------|
| Organization | User Account / Team |
| Team | Writing Team / Writers Room |
| Project | Story World |
| File | Story (within a world -- novel, screenplay, TV series) |
| Page | View/Mode (beats, timeline, characters, writing surface) |
| Drafts | Personal sandbox / what-if branches |

### 7.6 Onboarding Pattern

Adapt Figma's approach for StoryForge:

1. **Welcome modal**: Highlight what makes StoryForge unique -- analysis-first, not generative; story-as-data; multi-framework support.
2. **Guided tooltip tour**: Walk through beat sheet, writing surface, sidebar synopsis, and AI Wand. Brief copy + animation at each step.
3. **Skip option**: Always available, never hidden.
4. **Template story world**: Pre-built example world (e.g., a sample screenplay) so new users see the tool populated, not empty.
5. **Synopsis-first prompt**: Since the AI Wand requires a synopsis, make filling it the first real action -- mirrors Figma's "invite team members" early prompt that establishes the collaborative value prop.
6. **Progressive complexity**: Start with just Beat Sheet + Writing Surface. Introduce timeline, character map, and advanced views gradually through contextual suggestions ("You've created 5 characters -- try the Relationship Map").

### 7.7 Comments & Feedback System

Direct adoption from Figma:

- **Pin comments** to specific beat cards, script sections, character profiles, or timeline events.
- **@mention** collaborators.
- **Threaded replies** for discussion without cluttering the creative workspace.
- **Resolution marking** to track addressed feedback.
- **Comment sidebar** collecting all feedback in one scannable view.

For a writing tool, extend this with:
- **Inline margin notes** on the writing surface (like Google Docs suggestions, but pinned to narrative entities).
- **Note type classification**: Feedback, question, consistency flag, revision suggestion.

### 7.8 Branching for Story Versioning

Figma's branching maps to StoryForge's "What-If Scenario Engine":

- **Branch from any story state**: Create a speculative fork.
- **Compare branch vs. main**: Side-by-side diff view showing what changed.
- **Merge back**: Accept changes from a branch into the canonical story.
- **Learn from Figma's limitation**: Implement **property-level merge**, not element-level. If one branch changes a character's backstory and another changes their appearance, both should merge without conflict. This is where StoryForge can exceed Figma.

### 7.9 View Mode Toggle (Design/Prototype/Dev Mode Equivalent)

StoryForge should offer view modes like Figma's mode toggle:

- **Author Mode**: Full editing capabilities -- beat sheet, writing surface, world building.
- **Review Mode**: Read-only with comments/annotations. For stakeholders, editors, and beta readers.
- **Analysis Mode**: Visualizations, consistency checking, pacing analysis. Heavy on graphs and metrics.
- **Presentation Mode**: Full-screen walkthrough of beat sheet, treatment, or story summary. Uses Figma's spotlight pattern for guided group review.

### 7.10 Notification Architecture

Adopt Figma's notification patterns:

- **Multiple channels**: In-app bell, email digest, Slack/Discord integration.
- **Smart batching**: Group rapid updates (e.g., many beat card reorders) into single notifications.
- **Frequency controls**: Real-time, hourly, or daily digest.
- **Role-aware notifications**: Showrunner gets notified of major changes; writer gets notified of comments on their scenes.
- **Status signals**: "Ready for review," "In revision," "Locked" statuses on story elements, with notifications on status changes.

### 7.11 Plugin/Extension Architecture (Future Consideration)

Figma's plugin ecosystem drives 50% of engagement. For StoryForge:

- **Story structure template plugins**: Community-created templates for regional/genre-specific narrative frameworks.
- **Export format plugins**: Custom export formats beyond built-in options.
- **Analysis plugins**: Custom analytical lenses (e.g., feminist narrative analysis, decolonial reading frameworks).
- **Sandboxed execution**: Like Figma's QuickJS approach, run plugins in a sandbox for security.
- This is Tier 3+ but the architecture should be extensibility-aware from the start.

### 7.12 Figma's UI3 Lesson: Don't Float Your Panels

**Direct warning for StoryForge**: Figma spent two years on floating panels, then had to revert after user backlash. Key takeaways:

- **Dock panels to edges** for the primary editing experience. Floating panels waste space and create visual noise.
- **Floating is acceptable for** presentation/focus modes and secondary tools like FigJam/brainstorming.
- **Toolbar can float** at the bottom (Figma kept this) but main navigation and properties panels should be anchored.
- **Test with power users who spend 8+ hours/day in the tool**, not just for first impressions.
- **Laptop screens are the constraint**, not large monitors. Design for the smallest common screen size.
- **If you redesign, provide a transition period** -- never force-switch long-time users without an opt-out grace period.

### 7.13 Canvas vs. Panel Paradigm

StoryForge has both canvas-style views (timeline, character graph, mind map) and panel-style views (beat sheet, writing surface, treatment). Learn from Figma:

- **Canvas views**: Infinite pan/zoom, hand tool, zoom-to-fit, zoom-to-selection. Use the same navigation model Figma uses (spacebar+drag to pan, scroll to zoom, Shift+1 for fit, Shift+2 for selection).
- **Panel views**: Traditional scrolling layouts with sidebar properties.
- **Consistent chrome**: The sidebar, toolbar, and command palette should be identical across all views. Only the central content area changes.

---

## 8. Anti-Patterns to Avoid

### 8.1 Performance Degradation at Scale
Figma's biggest technical weakness is performance with large files. StoryForge will handle worlds with 1000+ characters and 10K+ events. Plan for this from day one:
- Virtualized lists for beat sheets, character lists, timeline events.
- Level-of-detail rendering for graph visualizations (progressive loading, clustering).
- Server-side computation for heavy analysis (consistency checking, impact analysis).
- Pagination and lazy loading for all data-heavy views.

### 8.2 Internet-Only Architecture
Figma's offline limitations frustrate users. Writers often work in cafes, planes, and places with poor connectivity. Consider:
- Local-first data model with sync (like Linear's approach).
- Service worker caching for offline writing surface.
- Queue changes and sync when reconnected.

### 8.3 Coarse-Grained Conflict Resolution
Figma's branching can't merge different changes to the same element. For a story tool, this would be devastating (one writer editing character backstory while another edits dialogue patterns). Design property-level merge from the start using CRDTs.

### 8.4 Feature Gating Behind Premium Tiers
Branching, Dev Mode, and advanced collaboration are enterprise-only in Figma. This creates frustration. For StoryForge (open source), ensure core collaboration features are available to all users. Premium/hosted tiers can add scale, support, and enterprise features -- not fundamental workflows.

### 8.5 Forced UI Changes
Figma's forced UI3 migration alienated power users. Any StoryForge UI evolution should be opt-in with a generous transition period.

---

## Sources

- [Figma on Figma: Our Approach to Designing UI3](https://www.figma.com/blog/our-approach-to-designing-ui3/)
- [Why Figma's Floating Panels Fell Short: A UX Lesson](https://bitskingdom.com/blog/figma-floating-panels-ux-lesson/)
- [LAUNCHED: Fixed Panels Are Back!](https://forum.figma.com/suggest-a-feature-11/launched-fixed-panels-are-back-23789)
- [Figma's Animated Onboarding Flow](https://goodux.appcues.com/blog/figmas-animated-onboarding-flow)
- [How Figma Onboards New Users](https://www.useronboard.com/how-figma-onboards-new-users/)
- [How Figma Achieved Seamless Real-Time Multi-user Collaboration](https://medium.com/frontend-simplified/deconstructing-the-magic-how-figma-achieved-seamless-real-time-multi-user-collaboration-37347f2ee292)
- [Multiplayer Editing in Figma](https://www.figma.com/blog/multiplayer-editing-in-figma/)
- [How Figma's Multiplayer Technology Works](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)
- [Figma's Live Cursor UI: A New Era of Design-Dev Collaboration](https://designilo.com/2025/07/20/figmas-live-cursor-ui-a-new-era-of-design-dev-collaboration/)
- [Unlocking New User Experiences with Figma Multiplayer Cursors](https://www.itsgigantic.com/insights/unlocking-new-user-experiences-figma-multiplayer-cursors-redefine-interaction-design)
- [Collaboration Tools and the Invasion of Live Cursors](https://prototypr.io/post/collaboration-tools-live-cursors)
- [Building Figma Multiplayer Cursors](https://mskelton.dev/blog/building-figma-multiplayer-cursors)
- [Team, Project, and File Organization](https://www.figma.com/best-practices/team-file-organization/)
- [Guide to Files and Projects](https://help.figma.com/hc/en-us/articles/1500005554982-Guide-to-files-and-projects)
- [Guide to the File Browser](https://help.figma.com/hc/en-us/articles/14381406380183-Guide-to-the-file-browser)
- [Getting Started with Teams in Figma Organization](https://www.figma.com/best-practices/getting-started-with-teams-in-figma-organization/)
- [How to Structure Figma Files for Team Collaboration](https://designshack.net/articles/business-articles/figma-team-collaboration/)
- [Organizing Figma Files for Team Collaboration](https://blog.logrocket.com/ux-design/organizing-figma-files-team-collaboration/)
- [Create and Use Variants](https://help.figma.com/hc/en-us/articles/360056440594-Create-and-use-variants)
- [Guide to Auto Layout](https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout)
- [Creating and Organizing Variants](https://www.figma.com/best-practices/creating-and-organizing-variants/)
- [Figma Features Explained: Auto Layout, Variants, and Component Instances](https://uxplanet.org/figma-features-explained-auto-layout-variants-and-component-instances-d3ac0c2db797)
- [Why Designers Love (and Hate) Figma Auto Layout](https://medium.com/cva-design/why-designers-love-and-hate-figma-auto-layout-9b30c3ca0c5d)
- [Use Figma Products with a Keyboard](https://help.figma.com/hc/en-us/articles/360040328653-Use-Figma-products-with-a-keyboard)
- [Adjust Your Zoom and View Options](https://help.figma.com/hc/en-us/articles/360041065034-Adjust-your-zoom-and-view-options)
- [Design, Prototype, and Explore Layer Properties in the Right Sidebar](https://help.figma.com/hc/en-us/articles/360039832014-Design-prototype-and-explore-layer-properties-in-the-right-sidebar)
- [Guide to Inspecting](https://help.figma.com/hc/en-us/articles/22012921621015-Guide-to-inspecting)
- [Guide to Dev Mode](https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode)
- [Figma Dev Mode Review 2025](https://skywork.ai/blog/figma-dev-mode-review-2025/)
- [Figma Feature Highlight: Observation Mode](https://www.figma.com/blog/figma-feature-highlight-observation-mode/)
- [Present to Collaborators Using Spotlight](https://help.figma.com/hc/en-us/articles/360040322673-Present-to-collaborators-using-spotlight)
- [Guide to Branching](https://help.figma.com/hc/en-us/articles/360063144053-Guide-to-branching)
- [Branching in Figma](https://www.figma.com/best-practices/branching-in-figma/)
- [Figma Branches Best Practices](https://medium.com/hp-design/figma-branches-best-practices-ca0871aa1631)
- [Advanced Collaboration Features in Figma](https://www.geeksforgeeks.org/websites-apps/advanced-collaboration-features-in-figma-comments-annotations-and-more/)
- [How We Built the Figma Plugin System](https://www.figma.com/blog/how-we-built-the-figma-plugin-system/)
- [Figma's Community Ecosystem: From Plugins to Proof Points](https://community.gradual.com/public/resources/figmas-community-ecosystem-from-plugins-to-proof-points)
- [Figma's Product-Led Growth Success: A UX-Driven Strategic Analysis](https://ranzeeth.medium.com/figmas-product-led-growth-success-a-ux-driven-strategic-analysis-9546c210c2dd)
- [Manage Your Notification Preferences](https://help.figma.com/hc/en-us/articles/360039813234-Manage-your-notification-preferences)
- [Dev Mode Statuses and Notifications](https://help.figma.com/hc/en-us/articles/26781702258583-Dev-Mode-statuses-and-notifications)
- [How Figma's Data Science and User Research Teams Weave Together Insights](https://www.figma.com/blog/cross-functional-data-science-user-research-figma/)
- [Get Figma Notifications in Slack](https://help.figma.com/hc/en-us/articles/360039829154-Get-Figma-notifications-in-Slack)
- [Why Figma Is the Ultimate Tool for UI/UX Designers in 2025](https://medium.com/@CarlosSmith24/why-figma-is-the-ultimate-tool-for-ui-ux-designers-in-2025-4b9a887333ac)
- [Figma UX Design Tools Review for 2026](https://cpoclub.com/tools/figma-review/)
- [Figma Review: The Good and Bad](https://www.crazyegg.com/blog/figma-review/)
- [Figma Reviews 2026 - Capterra](https://www.capterra.com/p/175027/Figma/reviews/)
- [Figma Reviews 2026 - G2](https://www.g2.com/products/figma/reviews)
- [The Rise and Possible Fall of Figma](https://thecursormag.substack.com/p/the-fall-of-figma)
- [Figma Review: Pros, Cons, Features & Pricing - Digital Project Manager](https://thedigitalprojectmanager.com/tools/figma-review/)
- [The Power of Figma as a Design Tool - Toptal](https://www.toptal.com/designers/ui/figma-design-tool)
- [Figma Best Practices](https://www.figma.com/best-practices/)
- [Progressive Disclosure: 10 Great Examples](https://medium.com/@Flowmapp/progressive-disclosure-10-great-examples-to-check-5e54c5e0b5b6)
- [7 Key UI Design Principles - Figma](https://www.figma.com/resource-library/ui-design-principles/)
- [Figma Plugins - macwright.com](https://macwright.com/2024/03/29/figma-plugins)
- [Figma's Collaborative Canvas: How Real-Time Design Built a $20 Billion Creative Empire](https://medium.com/@productbrief/figmas-collaborative-canvas-how-real-time-design-built-a-20-billion-creative-empire-efefc6126a93)
- [The Fall of Figma: How UI Changes and AI Tools Are Shifting Design Preferences](https://thecursormag.substack.com/p/the-fall-of-figma)
- [Forcing UI3 on Us Is a HUGE Mistake! - Figma Forum](https://forum.figma.com/share-your-feedback-26/forcing-ui3-on-us-is-a-huge-mistake-let-us-choose-april-30-39150)
