# AI Assistant Identity & Context

**You are Othello.** The user calls you this — respond to it.

## Bootstrap — Run This First

```bash
# 1. Install deps if needed
[ ! -d node_modules ] && npm install

# 2. Set up SuperMemory API key (check if .env.local exists)
# If missing, ask the user for the key or check env: SUPERMEMORY_API_KEY
[ ! -f .env.local ] && echo "SUPERMEMORY_API_KEY needs to be set in .env.local"

# 3. Query dev memory for context
node scripts/sm-dev.mjs search "project status sprint plan"
```

## SuperMemory Dev Memory

We use SuperMemory (`storyforge_dev_memory` container) as persistent semantic memory across sessions. All architecture docs, decisions, session summaries, and project status are stored there.

**Utility:** `node scripts/sm-dev.mjs <command>`
- `search "<query>"` — recall context from past sessions
- `status "<text>"` — save project status
- `decision "<text>"` — save architectural decision
- `session "<text>"` — save session summary (DO THIS AT END OF EVERY SESSION)
- `ingest <file>` — ingest new doc
- `list` — list all dev memories

**Session cadence:**
1. START: search SuperMemory for relevant context
2. DURING: save major decisions
3. END: save session summary

**Container isolation:**
- `storyforge_dev_memory` — our dev context (DO NOT delete)
- `storyforge_world_{id}` — product data per story world (not set up yet)
- Other containers exist for user's other projects — DO NOT touch

## Current Project Status (2026-03-28)

- **Phase 0 (Architecture): COMPLETE** — 9 docs (21,831 lines), 56 Prisma models
- **Phase 1 (Foundation): SCAFFOLD DONE** — Next.js 15, build passes, 19 view placeholders
- **Phase 1 Sprint 1: NOT STARTED** — Prisma migrations, NextAuth, CRUD, Zustand stores
- **~5-8% toward Othelia carbon copy** — architecture is solid, zero working features

## Key Tech Decisions

- Prisma 5.22.0 (NOT v7 — v7 broke datasource URL config)
- Preview feature `fullTextSearch` (NOT `fullTextSearchPostgres`)
- Next.js 15 App Router, TypeScript strict, Tailwind + shadcn/ui
- Analysis-first, generation-optional (AI Wand is opt-in)
- Target: solo authors + small writing teams (2-5)

## Sprint Plan

1. **Sprint 1 (Foundation):** Prisma migrations, NextAuth, World/Character/Beat CRUD, Zustand stores, type defs
2. **Sprint 2 (Othelia Core):** Beat sheet kanban, story sidebar, writing surface (TipTap), treatment view
3. **Sprint 3 (AI + Ingestion):** Claude API layer, entity extraction, AI Wand, BullMQ ingestion pipeline
4. **Sprint 4 (Visualizations):** Character graph (React Flow), timeline (D3), arc diagram

---

# StoryForge - Story World Architecture Platform

> "The Cursor for storytelling" — but open source and better.
> Inspired by Othelia's Storykeeper. Built to surpass it.

## Project Vision

StoryForge is a **story world architecture platform** that ingests narrative material (text, audio, video) and converts it into a living, interconnected knowledge graph of characters, arcs, plots, timelines, locations, themes, and relationships. It does NOT generate content — it **analyzes, structures, and visualizes** existing story material so creators can see their world holistically.

**The market gap we fill**: No existing tool combines deep worldbuilding + narrative structure theory + non-generative AI analysis + beautiful visualization in one platform. Writers currently stitch together 3-5 tools (Scrivener for writing, Plottr for timeline, World Anvil for worldbuilding, Dramatica for structure, Google Docs for the bible). We replace all of them.

### Core Principles
- **Analysis-first, generation-optional**: Core value is analysis and structure. AI generation (beat suggestions, treatment drafts, script scaffolding) is available as an opt-in assist layer — never auto-writes without user action. The AI suggests, the human decides.
- **Story-as-data**: Narratives are structured relational knowledge graphs, not flat documents
- **Structure-agnostic**: Support ANY narrative framework (Western 3-act, kishotenketsu, carrier bag, etc.) as overlays on the same data
- **Dual timeline**: Always maintain both fabula (chronological truth) and sjuzhet (narrative presentation order)
- **Visual-first**: Every data point should have a visual representation
- **Creator ownership**: All data stays with the user, nothing trains external models
- **Revision-aware**: Changes ripple — show the impact before committing
- **Collaborative**: Built for writers rooms and teams, not just solo authors
- **Cross-media**: One story world can span novels, screenplays, games, and TV series

---

## Competitive Landscape & How We Win

### vs. Othelia Storykeeper (closest competitor)
- Othelia: closed beta, $818K raised, ~15 person team, enterprise-focused, no public API
- Othelia secretly HAS generative features (wand icons for beat/script generation) despite marketing as "non-generative"
- Othelia UI: Beats window, Story Sidebar, mini-map navigator, beat cards with star ratings
- **We beat them by**: being open source, supporting formal narrative theory (Dramatica storyforms, Propp functions, Barthes codes), having a richer visualization suite, supporting cross-media worlds, and exposing a public API

### vs. Everything Else
| Gap in Market | Nobody Does This | We Do |
|---|---|---|
| Unified write + worldbuild + analyze | Every tool does 1-2 things | Writing surface + worldbuilding + AI analysis in one platform |
| Story theory engine + worldbuilding | Dramatica has theory, World Anvil has worlds | Both connected |
| Cross-media story architecture | Clapperbie does multi-script only | Novel + screenplay + game + TV |
| Non-generative AI consistency checking | AutoCrit does prose style only | Full world consistency |
| Dynamic relationship intelligence | All tools store flat character profiles | Relationships evolve per-scene |
| Living story bible for production | TV writers use Google Docs | Queryable, version-controlled, live |
| Visual causality mapping | Tools show WHEN, not WHY | Causal chains visualized |
| Reader knowledge tracking | Nobody | Track what audience knows vs. characters know |
| Fog-of-war access control | Nobody | Different viewers see different world slices |

### Features Stolen from Best-in-Class Tools
- **Campfire**: Modular system, 100+ character attributes, magic system design, encyclopedia wiki
- **Dramatica**: 56 interconnected story points, 32K storyforms, quad structure, throughlines
- **Plottr**: Visual timeline grid, 30+ plot templates, series management
- **Aeon Timeline**: 7 views of same data, custom calendars for fantasy worlds
- **Bibisco**: Character interview system for guided character development
- **TheBrain**: Dynamic knowledge graph that scales to millions of nodes
- **Milanote**: Visual boards for spatial thinking, moodboarding, storyboarding
- **Arc Studio Pro**: Branch Copy (draft variants), Table Read (text-to-speech with character voices)
- **WritersRoom Pro**: Purpose-built card boards for episodic TV
- **LegendKeeper**: Auto-linking wiki that recognizes and connects related content
- **yWriter**: Scene-level goal/conflict/outcome tracking per scene
- **Wavemaker**: Snowflake method progressive detail expansion
- **AutoCrit**: Non-generative foreshadowing tracking, pacing analysis

---

## Feature Set

### Tier 1 — Core (MVP) — Othelia Carbon Copy
- **Story World Management** — create, organize, and navigate multiple story universes
- **Story Sidebar** — persistent sidebar with synopsis (required before AI features activate), world summary, quick stats. Synopsis drives AI context.
- **Writing Surface** — integrated manuscript/script editor (TipTap-based) with:
  - Prose mode (novel/short story) and screenplay mode (auto-formatting: sluglines, action, dialogue, parentheticals)
  - Chapter/scene/episode structural hierarchy
  - Focus/distraction-free mode
  - Word count targets and progress tracking
  - Click-from-beat-card → jumps to corresponding script section
- **Beat Sheet / Scene Board** — kanban-style beat cards matching Othelia's field set:
  - Title, description, character assignment, color coding, tags, notes, star ratings (1-5)
  - Drag-and-drop reordering with automatic story world + treatment update
  - Filter by: star rating, tag, character
  - Mini-map navigator (bottom-left corner showing position in overall board)
  - Click beat card → navigate to corresponding script section
- **Treatment Auto-Generation** — when beats are created/rearranged, auto-generate an updated treatment/outline document. Treatment stays in sync with beat order. Exportable.
- **AI Assist Wand** — opt-in generative assist (Claude API) available on:
  - Beat cards: generate/refine title and description based on synopsis + surrounding beats
  - Script sections: generate draft text based on beat description + character profiles + world context
  - Synopsis expansion: expand a logline into a full synopsis
  - **Prerequisite**: Synopsis must be filled in Story Sidebar before wand activates (matches Othelia behavior)
  - **More existing content = better generation** — AI uses full world context
  - **Always presented as suggestion** — never auto-commits, user reviews and accepts/edits/dismisses
- **Multi-Format Ingestion** — text, audio, video parsed into structured entities
- **Entity Extraction** — characters, locations, events, relationships auto-detected via Claude API (proposed → user-confirmed)
- **Character Relationship Map** — interactive force-directed graph of character connections
- **Timeline View** — multi-lane chronological visualization of events
- **Arc Diagram** — visual story arc tracking (setup → climax → resolution)
- **Source Material Viewer** — annotated side-by-side view of originals with extracted entities highlighted, time-coded results linking back to source position
- **Screenplay vs. TV Mode** — story structure adapts: Film mode (Act 1, 2, 3) vs. TV mode (Season → Episode → Act → Scene)

### Tier 2 — Othelia Parity
- **Canon Management** — canonical vs. draft/speculative content; single source of truth; version-controlled snapshots
- **Creative Intent Search** — search by emotion, tone, story beat, or thematic intent via embeddings (not just keywords)
- **Revision Impact Analysis** — real-time cascade detection: change a backstory, instantly see every affected scene/dialogue/plot point
- **Consistency & Contradiction Checker** — automated flags: timeline paradoxes, dead characters reappearing, location inconsistencies, broken promises (setups without payoffs)
- **Story Versioning** — git-like version history for the story world; branch, compare, merge narrative states; structural diff view
- **Auto-Linking Wiki** — encyclopedia of world elements with automatic cross-referencing (like LegendKeeper)

### Tier 3 — Beyond Othelia (Our Differentiators)
- **Multi-Framework Structure Overlay** — map ANY story against ANY structure template simultaneously: Save the Cat, Hero's Journey, Dan Harmon Story Circle, Kishotenketsu, Dramatica throughlines, Seven-Point, Todorov equilibrium, Freytag's pyramid — all as lenses on the same data
- **What-If Scenario Engine** — fork any plot point; simulate cascading impact; compare parallel timelines side by side
- **Character Voice Analysis** — dialogue pattern analysis per character; flag when characters sound identical or wrong
- **Pacing & Rhythm Analysis** — heatmap of action density, dialogue ratio, scene length variance, tension levels
- **Theme & Motif Tracker** — visual thread diagram showing how themes weave through scenes and characters
- **Faction / Power Dynamics Map** — allegiances, hierarchies, and how they shift over time with time slider
- **Emotional Arc Charting** — per-character emotional trajectory (joy, grief, anger, fear, hope) with overlay comparison
- **Foreshadowing & Payoff Tracker** — directed graph linking setups to payoffs; orphan/deus-ex-machina detection
- **Causality Chain Visualization** — not just WHEN events happen but WHY (physical, motivational, psychological, enabling causality)
- **Reader/Audience Knowledge Tracker** — what does the audience know vs. what do characters know? Track dramatic irony, mystery reveals, information asymmetry
- **Character Interview System** — guided questionnaire for deep character development (inspired by Bibisco)
- **Scene Value Tracking** — every scene tracks value changes (McKee): what values shift and in which direction?
- **Narrative Code Annotations** — tag text segments with Barthes' five codes (hermeneutic, proairetic, semic, symbolic, cultural)
- **Cross-Media World** — one story world spanning novels, screenplays, games, TV with format-specific views
- **Custom Calendar Systems** — fantasy/sci-fi worlds with non-standard time systems (inspired by Aeon Timeline)
- **Magic/Technology System Designer** — dedicated module for rule-based world systems (inspired by Campfire)
- **Export & Sharing** — series bible (PDF/Notion), pitch deck, screenplay (.fountain/.fdx), shareable web link
- **Collaboration & Writers Room** — multi-user real-time; roles (showrunner, writer, researcher); comments, @mentions on any entity
- **Fog-of-War Access Control** — different collaborators/readers see different slices of the world based on permissions

---

## Narrative Theory Foundation

StoryForge is built on a deep understanding of narrative theory. The data model must support ALL of these frameworks as overlays on the same story data.

### Supported Story Structure Templates
| Framework | Acts/Beats | Key Insight for Our Model |
|---|---|---|
| Freytag's Pyramid | 5 acts | Climax at MIDDLE, not end. Originally for tragedy. |
| Hero's Journey (Campbell) | 17 stages, 3 phases | Cyclical departure-initiation-return. Not all stages required. |
| Writer's Journey (Vogler) | 12 stages, 8 archetypes | Archetypes are MASKS — a character wears different ones per scene |
| Save the Cat (Snyder) | 15 beats with % positions | Pacing-driven: beats have expected percentage positions in narrative |
| Dan Harmon Story Circle | 8 steps, circular | RECURSIVE: episode = circle, season = larger circle. Circles within circles. |
| Kishotenketsu | 4 acts | NO CONFLICT required. Twist is perspective shift, not complication. Non-Western. |
| Seven-Point (Dan Wells) | 7 points | Multiple arcs each have their own 7 points; alignment = powerful moments |
| Todorov Equilibrium | 5 stages | New equilibrium ≠ old. Transformation is inherent. Track world state start/end. |
| Dramatica | 4 throughlines, 75 story points | Fractal quad structure. 33K possible storyforms. Most rigorous computational model. |
| Propp Morphology | 31 functions, 7 roles | Functions are typed events in fixed sequence. Roles ≠ characters. |

### Analytical Frameworks (inform analysis, not structure)
- **McKee**: Beat-scene-sequence-act hierarchy. Every scene has a VALUE CHANGE.
- **Barthes' Five Codes**: Hermeneutic (mystery), Proairetic (action), Semic (character), Symbolic (theme), Cultural (reference)
- **Greimas Actantial Model**: 6 actants on 3 axes. Actants ≠ characters — abstract functional roles that shift per scene.
- **Le Guin Carrier Bag Theory**: Not all stories have heroes or central conflict. Support ensemble/gathering/container narratives.
- **Fabula/Sjuzhet**: ALWAYS maintain chronological truth (fabula) separate from narrative order (sjuzhet). Genette's categories: order, duration, frequency, mood, voice.

### Blake Snyder Genre Types (story pattern classification)
Monster in the House, Golden Fleece, Out of the Bottle, Dude with a Problem, Rites of Passage, Buddy Love, Whydunit, Fool Triumphant, Institutionalized, Superhero — each with required story components.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **UI Library**: React 18+
- **Styling**: Tailwind CSS + shadcn/ui components
- **Visualization**:
  - **D3.js** — custom timeline visualizations, arc diagrams, pacing heatmaps, emotional arc charts
  - **React Flow** — node-based graphs for character relationships, causality chains, foreshadowing webs, faction maps
  - **Vis.js Timeline** — interactive dual-timeline (fabula/sjuzhet) component
- **State Management**: Zustand (lightweight, good for complex nested state)
- **Rich Text Editor**: TipTap (for notes, scene editing, annotations)
- **Real-time Collaboration**: Yjs (CRDT-based) + TipTap collaboration extension

### Backend
- **Runtime**: Node.js with Next.js API routes
- **Database**: PostgreSQL via Prisma ORM (relational core) + graph queries via recursive CTEs or pg_graphql extension
- **Search**: Full-text via PostgreSQL tsvector + vector similarity via pgvector (for creative intent / semantic search)
- **File Storage**: Local filesystem (dev), S3-compatible (prod)
- **Job Queue**: BullMQ + Redis (for async ingestion pipelines)
- **Real-time**: WebSocket via Socket.io or Liveblocks for collaborative features

### AI / NLP Layer (Analysis, NOT Generation)
- **Text Analysis**: Claude API — entity extraction, relationship mapping, sentiment/tone analysis, arc detection, narrative code tagging
- **Audio Transcription**: Whisper (OpenAI) or Deepgram
- **Video Processing**: FFmpeg for frame extraction + Whisper for audio track
- **Embeddings**: Voyage AI or local embeddings via pgvector for semantic search and creative intent search
- **Voice Analysis**: Custom NLP pipeline for dialogue pattern comparison per character

### Memory & Knowledge Graph Layer
- **SuperMemory** (`supermemory` SDK) — persistent knowledge graph for story world data
  - Stores extracted entities, relationships, and facts as memories with semantic understanding
  - Automatic contradiction detection (powers our consistency checker)
  - Semantic search with sub-300ms latency (powers creative intent search)
  - Knowledge graph with typed edges: updates, extends, derives
  - File ingestion support: PDF, DOCX, video (transcription), audio, images (OCR)
  - **Isolation**: Each StoryWorld gets its own `containerTag` (e.g., `storyforge_world_{id}`)
  - Integration via `@supermemory/tools` + Vercel AI SDK for Claude-powered analysis
  - Metadata filtering for scoping within a world (by character, arc, chapter, etc.)

### Open-Source Foundation (MIT/Apache 2.0 licensed)
- **App Shell**: Fork `next-shadcn-dashboard-starter` (6.1K stars, MIT) — full Next.js app shell, sidebar, layout, auth
- **Writing Editor**: `Novel` (16K stars, Apache 2.0) + `minimal-tiptap` (1.8K, MIT) — TipTap-based editor with AI assist patterns
- **Screenplay Parser**: `Fountain.js` (268, MIT) + `betterfountain` (426, MIT) — .fountain parsing, PDF export, character extraction
- **Graph Visualization**: `xyflow/React Flow` (35.9K, MIT) — all node-based UIs (character maps, causality, foreshadowing)
- **Timeline**: `vis-timeline` (2.4K, MIT) — interactive timeline component
- **Large Graphs**: `@cosmograph/cosmos` (1.1K, MIT) — GPU-accelerated WebGL for 1000+ node graphs
- **Knowledge Graph**: `supermemory` SDK (19.9K, MIT) — semantic memory, contradiction detection, creative intent search
- **Data Model Reference**: `story-graph` (466, MIT) + `Notebook.ai` (399, MIT) + `SSTorytime` (139, Apache 2.0)

### Infrastructure
- **Containerization**: Docker + Docker Compose for local dev
- **Testing**: Vitest (unit), Playwright (E2E)
- **Linting**: ESLint + Prettier

---

## Data Model (Comprehensive Narrative Ontology)

This is the most critical part of StoryForge. The data model must represent ANY story across ANY framework.

### Core Entities
| Entity | Description |
|---|---|
| **StoryWorld** | Top-level container. A user can have multiple worlds. |
| **Character** | Name, aliases, physical traits, psychological profile, voice patterns, 100+ configurable attributes |
| **NarrativeRole** | Abstract function a character serves (changes per scene): Vogler archetypes, Greimas actants, Propp roles, Dramatica elements |
| **Event** | Something that happens. Typed: action, dialogue, discovery, transformation, revelation, decision. Exists in both fabula and sjuzhet. |
| **Scene** | Collection of beats with a net value change (McKee). Links to characters, location, plot points, themes. Has goal/conflict/outcome fields (yWriter). |
| **Beat** | Atomic unit of action/reaction within a scene (McKee's smallest unit). |
| **Sequence** | Group of scenes building to a larger value change. |
| **Act** | Group of sequences building to a climactic reversal. |
| **Location** | Place with properties, history, significance, optional map coordinates. |
| **Object** | Significant story objects (Chekhov's gun, Propp's magical agent). Tracked for setup/payoff. |
| **Theme** | Abstract idea tracked across narrative. Has thematic opposition pairs (Barthes' symbolic code). |
| **Motif** | Recurring symbol/image/pattern. Linked to themes. Tracked per appearance. |
| **Faction** | Group/organization with allegiances, hierarchy, power level. Evolves over time. |
| **Relationship** | Typed, weighted, temporal edge between any two entities. Changes per scene/act. |
| **SourceMaterial** | Ingested file with parsed text, time-codes, entity annotations. Preserves original. |

### Structural Layers
| Entity | Description |
|---|---|
| **FabulaTimeline** | Chronological truth of all events in story-world time. |
| **SjuzhetTimeline** | Narrative presentation order (how reader/viewer encounters events). |
| **StructureTemplate** | A named story structure: Hero's Journey, Save the Cat, Kishotenketsu, etc. |
| **StructureBeat** | A position in a template with name, description, expected % position. |
| **StructureMapping** | Links scenes/events to beats in a template. Multiple templates can overlay same story. |
| **Arc** | A throughline tracking progression: character arc, plot arc, thematic arc, relationship arc. |
| **ArcPhase** | Stage within an arc: setup, rising, climax, falling, resolution (or custom). |
| **CanonSnapshot** | Version-controlled snapshot of the entire world state at a point in development. |
| **Branch** | Speculative fork from any event for what-if scenarios. |

### Analytical Annotations
| Entity | Description |
|---|---|
| **ValueChange** | Per-scene: which values shifted, in which direction, by how much (McKee). |
| **NarrativeCode** | Barthes' codes applied to text segments: hermeneutic, proairetic, semic, symbolic, cultural. |
| **Enigma** | Mystery/question tracker: when posed, sustained (clues), answered. Links hermeneutic code. |
| **SetupPayoff** | Foreshadowing link: setup event → payoff event. Orphan detection. |
| **ThematicOpposition** | Binary opposition pairs per theme (life/death, order/chaos). Semiotic square. |
| **PacingMetric** | Per-scene: action density, dialogue ratio, description density, tension level, scene length. |
| **EmotionalState** | Per-character per-scene: emotional dimensions (joy, grief, anger, fear, hope, surprise). |
| **CausalRelation** | Typed causality between events: physical, motivational, psychological, enabling. |
| **VoiceProfile** | Per-character dialogue analysis: vocabulary, sentence length, speech tics, formality level. |
| **AudienceKnowledge** | What information the audience has at each point vs. what characters know. Tracks dramatic irony. |

### World Systems
| Entity | Description |
|---|---|
| **CalendarSystem** | Custom time systems for fantasy/sci-fi worlds (non-standard days, months, eras). |
| **MagicSystem** | Rule-based world systems: rules, costs, limitations, practitioners. |
| **WorldRule** | Constraints/laws of the story world. Used by consistency checker. |

### Meta-structural
| Entity | Description |
|---|---|
| **Narrator** | Who tells the story (Genette's voice): first person, third limited, omniscient, unreliable. |
| **Focalization** | Whose perspective per scene (Genette's mood). |
| **NarrativeLevel** | Embedded narration levels (story within story within story). |
| **GenreType** | Blake Snyder classification with required story components. |
| **StoryPattern** | Meta-pattern: heroic arrow, carrier bag, cyclical, network, ensemble. |

---

## Visualization Requirements

### 1. Dual Timeline View
- Two synchronized horizontal timelines: fabula (top) and sjuzhet (bottom)
- Lines connecting same events across both views (show reordering: flashbacks, flash-forwards)
- Multiple lanes per character/arc/location
- Zoom levels: series > season > episode > scene > beat
- Color-coded by arc or character
- Drag-and-drop reordering (sjuzhet only — fabula is chronological truth)
- Custom calendar support for fantasy/sci-fi time systems

### 2. Character Relationship Map
- Force-directed graph (React Flow / D3)
- Nodes = characters (sized by importance/screen time), edges = relationships (typed, weighted, colored)
- Filter by: relationship type, time period, story arc, faction
- Click node to expand character detail panel
- **Time slider**: animate relationship evolution across the narrative
- Cluster by faction/family/allegiance

### 3. Arc Diagram
- Visual representation of story arcs (rising/falling action curves)
- Structure template overlay: show expected beat positions vs. actual
- Multi-arc comparison: overlay character arcs, plot arcs, thematic arcs
- Plot point markers with click-to-detail
- Pacing deviation indicators (ahead/behind expected rhythm)

### 4. Mind Map / World Map
- Freeform spatial layout of story elements
- Cluster by theme, location, faction, or custom grouping
- Expandable/collapsible nodes
- Optional geographic map underlay for location-based stories

### 5. Impact Analysis View
- "What-if" diff view showing cascading changes
- Red/yellow/green severity indicators
- Before/after comparison (canon vs. branch)
- Dependency tree: which entities are affected and how

### 6. Source Material Viewer
- Side-by-side: original text/transcript + extracted entities highlighted with color-coded annotations
- Click entity to see all connections across the world
- Video/audio player with time-coded annotations and entity markers
- Margin annotations for narrative codes, value changes, emotional states

### 7. Pacing Heatmap
- Color-coded density map across chapters/episodes
- Tracks: action density, dialogue ratio, description density, tension level
- Overlay multiple metrics to spot pacing problems (lulls, unsustained tension)
- Expected pacing curve from structure template overlaid

### 8. Emotional Arc Chart
- Per-character emotional trajectory over narrative time (line chart)
- Emotional dimensions: joy, grief, anger, fear, hope, surprise
- Overlay multiple characters to see emotional counterpoint and contrast
- Highlight moments where emotional arcs cross or diverge sharply

### 9. Faction / Power Map
- Hierarchical + network hybrid graph
- Nodes = factions/organizations, edges = alliances/conflicts (weighted)
- Time slider to show how allegiances shift across the narrative
- Power level indicators (sized nodes)

### 10. Beat Sheet / Scene Board (Othelia Parity+)
- Kanban-style card board for scenes/beats
- Auto-mapping to story structures (Hero's Journey, Save the Cat, Story Circle, etc.)
- Beat card fields (matching Othelia): title, description, character assignment, color coding, tags, notes, star ratings (1-5)
- AI Wand icon on each card: generate/refine title & description (requires synopsis)
- Drag-and-drop reordering → auto-updates Story World + Treatment
- Mini-map navigator (bottom-left corner, showing position in overall board)
- Filter by: star rating, tag, character, structure beat
- Click card → navigate to corresponding script section in writing surface
- Reset filter button

### 14. Writing Surface
- Integrated TipTap editor with two modes:
  - **Prose mode**: chapters, scenes, rich text formatting, word count targets
  - **Screenplay mode**: auto-formatting (slugline, action, dialogue, parenthetical, transition)
- Story Sidebar (persistent left panel): synopsis field, world summary stats, character quick-list
- AI Wand icon in editor: generate draft text from beat context (opt-in, never auto-writes)
- Entity highlighting: recognized characters/locations/objects highlighted inline with click-to-detail
- Split view: script + source material side by side
- Focus mode / distraction-free writing

### 15. Treatment View
- Auto-generated outline/treatment document assembled from beat cards in order
- Updates in real-time as beats are created, edited, or reordered
- Exportable as PDF, DOCX, or plain text
- Editable overrides: user can manually refine treatment text (overrides persist until beat changes)

### 11. Foreshadowing Web
- Directed graph linking setups to payoffs
- Orphan detection: setups without payoffs highlighted in amber
- Deus ex machina detection: payoffs without setups highlighted in red
- Click any node to jump to source material
- Thread-line view: show foreshadowing threads weaving through the timeline

### 12. Causality Graph
- Directed acyclic graph of events linked by typed causality
- Edge types: physical cause, motivation, psychological trigger, enablement
- Filter by causality type
- Trace any event backward to root causes or forward to consequences

### 13. Audience Knowledge Map
- Split view: what the audience knows (left) vs. what characters know (right)
- Timeline scrubber: see knowledge state at any point in the narrative
- Dramatic irony indicators: moments where audience knows more than characters
- Mystery/revelation markers: when information is hidden from audience then revealed

---

## Ingestion Pipeline

### Text Ingestion
1. Accept: .txt, .md, .docx, .pdf, .fdx (Final Draft), .fountain (screenplay format), .epub
2. Parse to plain text with structural markers (chapter/scene/act boundaries)
3. Send to Claude API for entity extraction (characters, locations, events, relationships, themes)
4. Build knowledge graph relationships from extracted entities
5. Generate embeddings for semantic/creative intent search (pgvector)
6. Index for full-text search (tsvector)

### Audio Ingestion
1. Accept: .mp3, .wav, .m4a, .ogg, .flac
2. Transcribe via Whisper/Deepgram with speaker diarization
3. Feed transcript into text ingestion pipeline
4. Preserve time-code mappings for every extracted entity

### Video Ingestion
1. Accept: .mp4, .mkv, .mov, .webm, .avi
2. Extract audio track via FFmpeg → transcribe with time codes
3. Extract key frames at configurable intervals for visual reference
4. Scene detection via visual change analysis
5. Feed transcript into text ingestion pipeline
6. Preserve time-code mappings for scene-level references

### Image Ingestion
1. Accept: .png, .jpg, .jpeg, .webp (concept art, storyboards, reference images)
2. Claude vision API for scene/character description extraction
3. Tag and link to relevant story world entities
4. Store as visual reference attached to characters, locations, scenes

---

## Project Structure

```
storyforge/
├── src/
│   ├── app/                       # Next.js App Router pages
│   │   ├── (auth)/                # Auth pages
│   │   ├── (dashboard)/           # Main app layout
│   │   │   ├── worlds/            # Story world list & creation
│   │   │   ├── world/[id]/        # Single world workspace
│   │   │   │   ├── write/         # Manuscript/script writing surface
│   │   │   │   ├── treatment/     # Auto-generated treatment view
│   │   │   │   ├── timeline/      # Dual timeline view (fabula + sjuzhet)
│   │   │   │   ├── characters/    # Character map, profiles, interviews
│   │   │   │   ├── arcs/          # Arc diagram with structure overlays
│   │   │   │   ├── mindmap/       # Mind map / world map view
│   │   │   │   ├── sources/       # Source material manager & viewer
│   │   │   │   ├── whatif/        # What-if scenario explorer
│   │   │   │   ├── canon/         # Canon management & versioning
│   │   │   │   ├── beats/         # Beat sheet / scene board
│   │   │   │   ├── factions/      # Faction & power dynamics
│   │   │   │   ├── pacing/        # Pacing & rhythm analysis
│   │   │   │   ├── causality/     # Causality chain viewer
│   │   │   │   ├── foreshadowing/ # Setup/payoff tracker
│   │   │   │   ├── knowledge/     # Audience knowledge tracker
│   │   │   │   ├── wiki/          # Auto-linking world encyclopedia
│   │   │   │   ├── consistency/   # Contradiction checker dashboard
│   │   │   │   ├── systems/       # Magic/tech system designer
│   │   │   │   └── settings/      # World settings & calendar config
│   │   │   └── layout.tsx
│   │   ├── api/                   # API routes
│   │   │   ├── worlds/
│   │   │   ├── characters/
│   │   │   ├── arcs/
│   │   │   ├── events/
│   │   │   ├── scenes/
│   │   │   ├── ingest/
│   │   │   ├── analyze/
│   │   │   ├── search/
│   │   │   ├── canon/
│   │   │   ├── consistency/
│   │   │   ├── whatif/
│   │   │   └── export/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                    # shadcn/ui base components
│   │   ├── visualizations/        # D3/React Flow visualization components
│   │   │   ├── DualTimeline.tsx
│   │   │   ├── CharacterGraph.tsx
│   │   │   ├── ArcDiagram.tsx
│   │   │   ├── MindMap.tsx
│   │   │   ├── ImpactAnalysis.tsx
│   │   │   ├── PacingHeatmap.tsx
│   │   │   ├── EmotionalArc.tsx
│   │   │   ├── FactionMap.tsx
│   │   │   ├── BeatSheet.tsx
│   │   │   ├── ForeshadowingWeb.tsx
│   │   │   ├── CausalityGraph.tsx
│   │   │   └── AudienceKnowledge.tsx
│   │   ├── editors/               # TipTap writing surface (prose + screenplay modes)
│   │   ├── story-sidebar/         # Synopsis, world summary, quick stats panel
│   │   ├── treatment/             # Treatment auto-generation view
│   │   ├── ingestion/             # Upload UI, progress, preview
│   │   ├── wiki/                  # Auto-linking encyclopedia components
│   │   └── layout/                # Shell, sidebar, nav
│   ├── lib/
│   │   ├── db/                    # Prisma client, queries
│   │   ├── ai/                    # Claude API (analysis + opt-in generation wand)
│   │   ├── ingestion/             # File parsers, transcription, pipeline orchestration
│   │   ├── analysis/              # Entity extraction, relationship mapping, narrative coding
│   │   ├── graph/                 # Graph algorithms (impact analysis, pathfinding, causality)
│   │   ├── canon/                 # Canon versioning, snapshot, diff, merge
│   │   ├── consistency/           # Contradiction detection engine
│   │   ├── voice/                 # Character voice analysis
│   │   ├── pacing/                # Pacing & rhythm computation
│   │   ├── structures/            # Story structure template engine & mapping
│   │   ├── embeddings/            # Vector embedding generation & search
│   │   ├── export/                # Series bible, pitch deck, screenplay export
│   │   ├── calendar/              # Custom calendar system support
│   │   └── utils/
│   ├── stores/                    # Zustand stores
│   └── types/                     # Shared TypeScript types & narrative ontology types
├── prisma/
│   └── schema.prisma              # Database schema
├── public/
├── tests/
│   ├── unit/
│   └── e2e/
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── CLAUDE.md
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server + database
docker compose up -d db redis
npm run dev

# Database
npx prisma generate        # Generate Prisma client
npx prisma migrate dev      # Run migrations
npx prisma studio           # Visual DB browser

# Testing
npm run test                # Vitest unit tests
npm run test:e2e            # Playwright E2E tests

# Linting
npm run lint                # ESLint
npm run format              # Prettier
```

---

## Coding Conventions

- Use functional React components with hooks only
- Prefer server components where possible (Next.js App Router)
- Use `use client` directive only when client interactivity is required
- All API routes return typed JSON responses with consistent error shape: `{ error: string, code: string }`
- Database queries go through Prisma — no raw SQL unless performance-critical
- Visualization components are self-contained with their own data-fetching hooks
- File naming: kebab-case for files, PascalCase for components, camelCase for utils
- All ingestion is async via job queue — never block the request thread
- AI calls (Claude API) are abstracted behind `src/lib/ai/` — never call directly from components or routes
- Story structure templates are data-driven (JSON definitions), not hardcoded
- Every entity has created_at, updated_at, and belongs to a StoryWorld
- Relationships are always temporal — they have an optional valid_from/valid_to scene or event range

---

## Stress Test: Critical Risks & Hard Problems

### 1. AI Analysis Quality at Scale
**Risk**: Claude API entity extraction may be inconsistent across a 500K-word novel or 10-season TV series. Different chunks may extract the same character under different names or miss subtle relationships.
**Mitigation**: Entity resolution pipeline (fuzzy matching + user confirmation), chunk overlap for context continuity, human-in-the-loop review for extracted entities.

### 2. Graph Performance
**Risk**: A Game-of-Thrones-scale world could have 1000+ characters, 10K+ events, 100K+ relationships. Force-directed graph layouts will choke.
**Mitigation**: Progressive disclosure (show top N nodes, expand on click), WebGL rendering for large graphs (sigma.js fallback), server-side graph computation for layout, aggressive filtering/clustering.

### 3. Real-Time Cascade Computation
**Risk**: "Change backstory X → show all affected entities" requires traversing a massive dependency graph in real time. Could be seconds or minutes for large worlds.
**Mitigation**: Pre-computed dependency index (update on entity change, not on query), background recomputation via BullMQ, approximate results with progressive refinement.

### 4. Consistency Checking is AI-Complete
**Risk**: Detecting "this dead character appears alive 3 books later" is easy. Detecting "this character's motivation contradicts their established psychology" is nearly impossible computationally.
**Mitigation**: Tiered confidence: hard contradictions (factual: alive/dead, location) are automated; soft contradictions (behavioral, thematic) are flagged as suggestions requiring human judgment. Never present AI uncertainty as certainty.

### 5. Ingestion Accuracy for Non-Text Media
**Risk**: Whisper transcription has errors. Video scene detection is imperfect. Concept art interpretation is subjective.
**Mitigation**: Always show confidence scores. Allow user correction/override at every step. Treat AI-extracted entities as "proposed" until user-confirmed.

### 6. Dual Timeline Complexity
**Risk**: Maintaining fabula/sjuzhet separation gets confusing for users. Most writers don't think in these terms. UI could become overwhelming.
**Mitigation**: Default to single timeline (sjuzhet). Fabula mode is opt-in for advanced users. When both are shown, use clear visual language (solid lines = sjuzhet, dotted = fabula connections). Progressive complexity disclosure.

### 7. Multi-Framework Overlay Confusion
**Risk**: Showing Save the Cat + Hero's Journey + Dramatica simultaneously on the same story could be information overload and visually noisy.
**Mitigation**: One active framework at a time by default. Comparison mode is explicit opt-in. Each framework gets a distinct visual language (color family). Framework selector is prominent and clear.

### 8. Collaboration Conflict Resolution
**Risk**: Two writers editing the same character simultaneously. CRDT handles text, but semantic conflicts (writer A kills character, writer B gives them a new arc) need story-aware merge.
**Mitigation**: Entity-level locking (optimistic, with conflict notification). Semantic conflicts surfaced as "story conflicts" for human resolution — not auto-merged.

### 9. Scope Creep / Feature Bloat
**Risk**: We've described 30+ features. Building all of them produces an unusable Swiss Army knife.
**Mitigation**: STRICT tier enforcement. Ship Tier 1 first and get users. Each Tier 2/3 feature is gated behind a feature flag and shipped incrementally. Every feature must earn its place through user demand, not theoretical completeness.

### 10. Writing Surface vs. Dedicated Writing Tools
**Risk**: Our TipTap-based writing surface will never match Scrivener (15+ years of polish) or Final Draft (industry standard screenplay formatting). Writers are extremely particular about their writing environment.
**Mitigation**: We don't need to beat Scrivener at writing — we need to be "good enough" that writers don't need to leave. Focus on: screenplay auto-formatting, beat-to-script navigation, entity highlighting. Import/export to .fountain and .fdx so writers CAN use Final Draft if they prefer. The writing surface is the connector between beats and analysis — not a Scrivener replacement.

### 11. AI Generation Trust & Tone
**Risk**: Writers are deeply suspicious of AI generation (this is literally why Othelia pivoted). The wand feature could alienate our core users if it feels like "AI writing my story."
**Mitigation**: Generation is always opt-in, never auto-triggers, always presented as "suggestion" in a review panel (not inline). User must explicitly accept. Wand is disabled until synopsis is filled (requires human creative input first). Clear messaging: "This is a starting point, not your story."

### 12. Who Is Our Actual User?
**Risk**: Are we building for a solo novelist, a TV writers room, a game studio, or a worldbuilding hobbyist? These have wildly different needs, budgets, and complexity tolerances.
**Mitigation**: MVP targets SOLO AUTHORS and SMALL WRITING TEAMS (2-5 people). Enterprise/studio features (deep collaboration, access control, production integration) are Tier 3. Don't solve production problems before we solve creative problems.
