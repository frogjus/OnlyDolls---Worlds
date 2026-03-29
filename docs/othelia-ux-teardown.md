# Othelia Storykeeper: Comprehensive UX Teardown
## StoryForge Competitive Intelligence Report — March 2026

---

## Executive Summary

Othelia Storykeeper is a narrative design and management platform founded in 2019 in Sydney, now headquartered in Los Angeles. They've raised $818K (led by ALIAVIA Ventures), have a team including Emmy-winning producer Scott Greenberg (Bento Box/Fox) as Executive Chairman, and launched their beta on October 28, 2025 at TechCrunch Disrupt.

**Key finding:** After 7 years of development and 5+ months of public beta, Othelia has **zero independent user reviews, zero community discussions, and no public demo videos**. All available information comes from press releases, trade journalism (Variety, Hollywood Reporter, TechCrunch), and their Zendesk help center. The product is essentially invisible to the broader writing community.

Their "non-generative AI" marketing claim is directly contradicted by their own help documentation, which describes generative wand features for beat titles, descriptions, and script text.

**For StoryForge, this means the market gap is wide open** — Othelia's closed, enterprise-first approach leaves enormous space for an open-source, community-driven, theory-rich alternative targeting solo authors and small teams.

---

## 1. Company & Team Profile

| Detail | Info |
|---|---|
| **Founded** | 2019, Sydney, Australia |
| **HQ** | Los Angeles (relocated mid-2025); Sydney office retained |
| **App URL** | `app.othelia.co` (login-protected) |
| **Help Center** | `othelia.zendesk.com` |
| **Total Raised** | $818K |
| **Lead Investor** | ALIAVIA Ventures (CA-based, female-founded startup focus) |
| **Self-description** | "The Cursor for storytelling" |

### Key People

| Person | Role | Background |
|---|---|---|
| **Kate Armstrong-Smith** | Co-Founder & Co-CEO | Creative producer, 15+ years in media; Master's in Screen Business (AFTRS); Churchill Fellow; previously ABC, Sydney Festival, TEDxSydney, Amazon Studios |
| **Joe Couch** | Co-Founder & CTO | Former global management consultant; VR and theatre direction background |
| **Scott Greenberg** | Executive Chairman (joined June 2025) | Emmy-winning producer; founded Bento Box Entertainment (Bob's Burgers), sold to Fox 2019; personal strategic investor |
| **Alexandra Hooven** | Co-CEO / CGO | Former director of product strategy for emerging technologies at Fox; runs LA HQ |

**Notable Creative Collaborator:** Nicholas Lathouris, co-writer of *Mad Max: Fury Road* and *Furiosa*, worked with Othelia to develop and refine its tools.

---

## 2. Product Timeline

| Date | Milestone |
|---|---|
| 2019 | Company founded |
| ~2023 | Released "Story Generator" app (ChatGPT-era experiment) |
| 2023-2024 | Alpha testing with "major studios and global streamers" (names under NDA) |
| June 2025 | US expansion; Greenberg and Hooven join |
| October 28, 2025 | Official beta launch at TechCrunch Disrupt 2025 (Thomas Middleditch made a surprise appearance) |
| Fall 2025 | Free beta program opened |
| March 2026 | Beta still active; no pricing announced |

---

## 3. Navigation & Information Architecture

### Primary Navigation
- **Top-center navigation bar** for switching between major views
- Confirmed views: **Beats**, **Script** (writing surface), **Treatment**
- Likely additional views: Story World overview, Characters, Settings

### Navigation Patterns
| Element | Location | Purpose |
|---|---|---|
| Top nav bar | Top center | Switch between major views (Beats, Script, Treatment, etc.) |
| + icon | Top right of view | Create new items (beats, scenes) |
| Filter icon | Top right, next to + | Filter current view |
| Expand icon | Top right of each card | Open card detail/expanded view |
| Mini-map | Bottom left | Spatial orientation within beat board |
| Double-click | On card | Alternate way to expand card detail |

### Structural Organization
- **Screenplay mode**: Beats organized by Act 1, Act 2, Act 3
- **TV mode**: Beats organized by Episode 1, Episode 2, etc.
- Format choice cascades through the entire structural hierarchy

**StoryForge Recommendation: IMPROVE**
> Othelia's top-center nav is clean but limited. We should adopt the clear view-switching pattern but add a persistent left sidebar (like VS Code / Cursor) for deeper navigation. Our 19+ views need a more scalable IA than a flat top nav bar. Consider a collapsible sidebar with grouped sections: Writing (Beats, Script, Treatment), Analysis (Timeline, Arcs, Pacing), World (Characters, Locations, Factions, Wiki), and Tools (Ingestion, Consistency, What-If).

---

## 4. Beat Sheet / Scene Board — DETAILED TEARDOWN

This is the core of Othelia's product and the most well-documented feature.

### Layout
- **Kanban-style board** of beat cards
- Cards organized into **sections by act (screenplay) or episode (TV)**
- Scrollable horizontally and vertically

### Beat Card Fields
| Field | Type | Notes |
|---|---|---|
| **Title** | Text input | AI wand icon adjacent |
| **Description** | Text area | AI wand icon adjacent |
| **Character Assignment** | Multi-select | Link characters to the beat |
| **Color Coding** | Color picker | Visual color tags for categorization |
| **Tags** | Tag input | Categorical tags |
| **Notes** | Freeform text | Additional notes field |
| **Star Ratings** | 1-5 stars | Used for filtering and prioritization |

### Card Interactions
1. **Creation**: Click + icon (top right) → "add story beat" → new beat appears at top of first section
2. **Expand**: Double-click card OR click expand icon (top right of card)
3. **Expanded view has tabs**:
   - **Overview tab**: title, description, character assignment, color, tags, notes
   - **Script tab**: write/navigate to corresponding script section
4. **Drag-and-drop reordering**: Click and drag cards to new positions
5. **Cascade on reorder**: When cards are rearranged, Story World, Treatment, and Script all update automatically

### Filtering System
- Filter icon in top right corner (next to + icon)
- Filter options: **star rating**, **tag**, **character**
- Filters can be **combined** (AND logic)
- **"Reset filter" button** at top right of filter popup

### Mini-Map Navigator
- Small rectangular window in the **bottom-left corner**
- Shows miniature overview of entire beat board
- Highlights current viewport position within overall board
- Becomes useful with many beat cards/scenes

**StoryForge Recommendations:**

**Card Design: ADOPT + IMPROVE**
> The field set is solid — adopt title, description, character assignment, color coding, tags, notes, and star ratings. Improve by adding:
> - **Structure beat mapping** (which Hero's Journey / Save the Cat beat does this map to?)
> - **Value change** (McKee: what value shifts in this beat?)
> - **Word count / duration** estimate
> - **Dependency links** (this beat depends on / enables other beats)
> - **Thumbnail/visual** attachment slot

**Expanded Card Tabs: ADOPT + IMPROVE**
> The Overview + Script tab pattern is good. Add:
> - **Analysis tab**: show pacing metrics, emotional arc position, narrative codes
> - **Connections tab**: show character relationships active in this beat, foreshadowing links
> - **History tab**: version history of this beat

**Drag-and-Drop with Cascade: ADOPT**
> This is table-stakes functionality. Auto-updating Treatment and Story World on reorder is essential. Implement this identically.

**Filtering: ADOPT + IMPROVE**
> Star/tag/character filtering is baseline. Add:
> - **Structure beat filter** (show only "Rising Action" beats, etc.)
> - **Emotional tone filter**
> - **Unassigned filter** (beats without characters, without structure mapping)
> - **Search within beats** (text search across titles/descriptions)

**Mini-Map: ADOPT**
> The mini-map navigator is a clever spatial orientation tool for large boards. Adopt directly. Consider making it toggleable (some users may find it distracting with few cards).

---

## 5. Story Sidebar — DETAILED TEARDOWN

### Core Element: Synopsis Field
The synopsis is the **most critical field in the entire platform** because it serves as:
1. **Context source** for all AI generation features
2. **Gating mechanism** — AI wand features are disabled until synopsis is filled
3. **World summary** anchor

### Gating Behavior
- If user clicks "generate" on any AI wand without a synopsis filled in:
  - UI shows **"Synopsis x"** (with x mark) **in red text**
  - Appears under a **"Requires"** label
  - This is a clear **validation error state** — not a soft warning

### Context Cascade
- Othelia explicitly states: "The more existing content you already have, the better result you will get from the generative features"
- Synopsis → feeds AI context for beat generation
- Synopsis + beats → feeds AI context for script generation
- Synopsis + beats + characters + world → feeds AI context for everything

### Additional Sidebar Content
- World summary information (specifics sparse in public docs)
- Quick stats (specifics sparse)
- Likely: character quick-list, recent activity

**StoryForge Recommendations:**

**Synopsis as AI Gate: ADOPT**
> This is a brilliant design pattern. It ensures the AI has meaningful context before generating, AND it requires the human to do creative work first (aligning with "analysis-first, generation-optional" philosophy). The user must articulate their story before AI assists. Copy this exactly.

**Validation Error State: ADOPT**
> The red "Synopsis x" under "Requires" is clear UX for communicating prerequisites. Adopt this pattern for all gated features.

**Sidebar Content: IMPROVE**
> Othelia's sidebar appears thin. Our Story Sidebar should be richer:
> - **Synopsis** (required, with character count and quality indicator)
> - **Logline** (one-sentence pitch)
> - **Genre / Structure Template** selector
> - **Word count / progress** tracking with targets
> - **Character count** with quick-access list
> - **World stats**: locations, events, arcs, unresolved threads
> - **Consistency alerts** badge (X contradictions detected)
> - **Recent activity** feed

**Progressive Disclosure: DIFFERENTIATE**
> Othelia's sidebar appears to be flat. We should use progressive disclosure — collapsed sections that expand, with the most critical info (synopsis, word count) always visible and secondary info (stats, alerts) expandable.

---

## 6. Writing Surface — DETAILED TEARDOWN

### Integration with Beats
- From an expanded beat card, the **Script tab** provides access to write script content for that beat
- Clicking a beat card navigates to the corresponding script section in the writing surface
- **Bidirectional navigation**: beat → script and script → beat

### Structural Modes
- **Screenplay format**: organized by Acts (Act 1, Act 2, Act 3)
- **TV format**: organized by Episodes (Episode 1, Episode 2, etc.)
- Format choice cascades through structural hierarchy

### AI in Writing Surface
- AI wand icon available in the Script tab of expanded beat cards
- Generates draft text based on beat context + synopsis + world context

### What's NOT Documented (Gaps)
- Specific screenplay formatting (sluglines, action blocks, dialogue, parentheticals) — not shown publicly
- Prose mode (novel/short story) — no evidence this exists
- Focus/distraction-free mode — not documented
- Word count targets — not documented
- Entity highlighting (inline character/location recognition) — not documented
- Split view — not documented

**StoryForge Recommendations:**

**Beat-to-Script Navigation: ADOPT**
> Bidirectional beat↔script navigation is essential. When a user clicks a beat card, it should jump to the corresponding script section. When editing in the script, the sidebar should highlight the current beat.

**Screenplay/TV Mode: ADOPT + IMPROVE**
> Adopt the structural mode switching. Improve by adding:
> - **Prose mode** (novel, short story) — Othelia appears to lack this entirely
> - **Fountain format** support (.fountain import/export)
> - **FDX format** support (Final Draft import/export)
> - Auto-formatting for all screenplay elements (slugline, action, dialogue, parenthetical, transition)

**Writing Surface Depth: DIFFERENTIATE**
> This is where we can significantly surpass Othelia. Their writing surface appears basic. We should build:
> - Full TipTap-based editor with rich formatting
> - **Entity highlighting** — recognized characters/locations highlighted inline with click-to-detail
> - **Focus mode** / distraction-free writing
> - **Word count targets** per scene/chapter with progress bars
> - **Split view**: script + source material side by side
> - **Character voice indicator** — flag when dialogue doesn't match character's established voice pattern

---

## 7. AI Wand Interaction Pattern — DETAILED TEARDOWN

This is where Othelia's marketing contradicts their actual product.

### Marketing Claim
- "AI, but not generative AI"
- "Does not generate content or automate creativity"
- Positions as purely analytical/structural

### Actual Implementation
The help documentation clearly describes generative features:

#### Wand Placement
| Location | Generates |
|---|---|
| Beat card → Overview → next to Title | Beat title text |
| Beat card → Overview → next to Description | Beat description text |
| Beat card → Script tab | Script/manuscript text |

#### Prerequisite System
1. User must fill in **Synopsis** in Story Sidebar first
2. If synopsis is empty and user clicks generate:
   - **"Requires"** label appears
   - **"Synopsis x"** displayed in **red** (x = failure indicator)
   - Generation is blocked
3. Once synopsis is filled, wand becomes active

#### Context Hierarchy
Generation quality improves with more existing content:
```
Synopsis alone → basic generation
Synopsis + beats → better generation
Synopsis + beats + characters → even better
Synopsis + beats + characters + world → best results
```

#### Interaction Flow (Inferred)
1. User clicks wand icon next to field
2. System checks prerequisites (synopsis exists?)
3. If prerequisites met → generates suggestion
4. Suggestion is presented for review (not auto-committed)
5. User accepts, edits, or dismisses

### The Marketing Contradiction
Othelia says "does not generate content" while literally having generate buttons on every beat card. This is a **significant trust vulnerability**.

**StoryForge Recommendations:**

**Prerequisite Gating: ADOPT**
> The synopsis-as-prerequisite pattern is excellent. It ensures meaningful context and requires human creative input first. Copy this.

**Wand Placement: ADOPT + IMPROVE**
> Wand icons on beat title, description, and script are good locations. Add wand options for:
> - **Scene outline** generation (from beat description)
> - **Character dialogue** generation (from character profiles + beat context)
> - **Synopsis expansion** (logline → full synopsis)
> - **Transition suggestions** (bridge between two beats)

**Transparency: DIFFERENTIATE**
> This is our biggest opportunity. Where Othelia hides their generative features behind "non-generative" marketing, we should be **radically transparent**:
> - Clearly label all AI generation with a visible "AI Generated" badge
> - Show the context the AI used to generate (what inputs influenced this output?)
> - Provide a confidence score
> - Never auto-commit — always review panel
> - Use honest language: "AI Suggestion" or "AI Draft" — not hidden behind vague wand icons
> - In marketing: "Analysis-first, generation-optional. When you choose to generate, you're always in control."

**Review/Accept Pattern: IMPROVE**
> Othelia's review flow is undocumented in detail. We should build a clear suggestion panel:
> - Generated text appears in a **diff-style preview** (not inline)
> - **Accept**, **Edit**, **Regenerate**, **Dismiss** buttons
> - **"Why this suggestion?"** link showing AI reasoning
> - History of past suggestions for this field

---

## 8. Treatment View — TEARDOWN

### Behavior
- Auto-generated outline/document assembled from beat cards in current order
- Updates **automatically** when beats are created, edited, or rearranged
- Stays synchronized with beat order
- Mentioned alongside Story World and Script as auto-updating when beats change

### What's NOT Documented
- Whether Treatment is a separate page or split panel
- Export options (PDF, DOCX, plain text)
- Whether user can manually override/edit treatment text
- Typography and formatting of the treatment document

**StoryForge Recommendations:**

**Auto-Generation from Beats: ADOPT**
> This is core functionality. Treatment must auto-generate from beat card content and order. When beats are reordered, treatment updates in real-time.

**Treatment as Living Document: IMPROVE**
> Go beyond Othelia's likely basic implementation:
> - **Editable overrides**: user can manually refine treatment text (overrides persist until the source beat changes)
> - **Export**: PDF, DOCX, Fountain, plain text, Google Docs
> - **Diff view**: show what changed in treatment when beats are reordered
> - **Structure annotations**: show which structure template beats this maps to
> - **Version history**: track treatment evolution over time

---

## 9. Ingestion & Analysis Features

### Confirmed Capabilities
- **Upload**: Can ingest a book and "within about five minutes, pull it up into your writing space"
- **Auto-extraction**: Identifies characters and their connections automatically
- **Post-ingestion workflow**: Writer shapes the story, turns it into a script, uses beat board
- **Living narrative relationship map**: Creates a map of character, arc, timeline, and theme interconnections from source material
- **Multi-format**: Film, TV, YouTube, TikTok, gaming, immersive experiences
- **Ingestion types**: Scripts, novels, articles, video (mentioned in marketing)

### Analysis Features (from marketing/PR)
| Feature | Description |
|---|---|
| **Revision Impact Analysis** | Change a character's backstory in episode 3 → flags every affected scene, dialogue reference, and plot point across entire series |
| **Creative Intent Search** | Search by emotion, action, or story beat; time-coded results across all materials |
| **Centralized Canon** | Single source of truth for story structure, relationships, and change impact |
| **What-If Simulation** | Explore new storylines without disrupting established world |
| **Contradiction Detection** | Tracks narrative connections and contradictions across evolving drafts |

### What's NOT Confirmed
- Whether these analysis features actually work in the beta (no user reviews to validate)
- Performance at scale (Game of Thrones-level complexity)
- Accuracy of entity extraction
- How proposed entities are reviewed/confirmed by users

**StoryForge Recommendations:**

**5-Minute Ingestion Promise: ADOPT as target**
> Fast ingestion is a compelling selling point. Target similar speed for text-based materials. Be transparent about processing time for larger works.

**Revision Impact Analysis: ADOPT + IMPROVE**
> This is one of Othelia's strongest claimed features. We should implement it with:
> - **Visual cascade diagram** (not just a list of affected entities)
> - **Severity indicators** (red/yellow/green for how badly affected)
> - **Before/after comparison** view
> - **Pre-commit preview**: show impact BEFORE the change is saved

**Creative Intent Search: ADOPT + IMPROVE**
> Semantic search by emotion/tone/beat is powerful. Improve with:
> - **Narrative theory filters**: search by Barthes codes, McKee values, Propp functions
> - **Cross-framework search**: "show me all 'Ordeal' beats across Hero's Journey mapping"
> - **Visual search results**: not just text matches but highlighted on timeline/graph

**Entity Extraction: IMPROVE**
> Always show:
> - **Confidence scores** for each extracted entity
> - **"Proposed" vs "Confirmed"** status (human-in-the-loop)
> - **Entity resolution** UI for merging duplicates (same character under different names)
> - **Extraction preview** before committing to knowledge graph

---

## 10. Visual Design & UI Patterns

### Color Scheme
- Not directly documented, but from website: clean, modern aesthetic
- Dark/light theme not confirmed
- Beat cards use **user-assigned color coding** (suggesting a neutral base palette with accent colors)

### Typography
- Not documented in public sources

### Iconography
- **Wand icon**: AI generation trigger (most distinctive icon)
- **+ icon**: creation action
- **Filter icon**: filtering
- **Expand icon**: card expansion
- **Star icons**: ratings (1-5)

### Layout Patterns
- **Kanban board**: primary beats view
- **Tabbed detail panels**: Overview + Script tabs in expanded cards
- **Persistent sidebar**: Story Sidebar with synopsis
- **Top navigation bar**: view switching
- **Mini-map overlay**: bottom-left spatial orientation

**StoryForge Recommendations:**

**Clean, Neutral Base: ADOPT**
> Don't over-design. A neutral base palette with user-assigned accent colors for categorization is the right approach. Let the content be the focus.

**Dark Mode: DIFFERENTIATE**
> Writers often work in low-light environments. Ship with dark mode from day one. Othelia doesn't appear to have confirmed dark mode support.

**Information Density: DIFFERENTIATE**
> Othelia appears to optimize for simplicity (enterprise clients who need quick onboarding). We should offer **adjustable information density**:
> - **Minimal**: Othelia-equivalent, just title + color
> - **Standard**: title + description + character + rating
> - **Detailed**: all fields visible on card face
> - Let users choose their density level

---

## 11. User Reviews & Community Presence

### The Stark Reality
| Platform | Othelia Presence |
|---|---|
| Reddit | **Zero** discussions (r/screenwriting, r/writing, r/worldbuilding) |
| ProductHunt | **Not listed** |
| Twitter/X | **No organic user discussion** |
| YouTube | **No public demo/walkthrough videos** |
| Blog reviews | **Zero** independent hands-on reviews |
| G2/Capterra | **Not listed** |

### All Coverage is PR-Sourced
Every article about Othelia (Variety, Hollywood Reporter, TechCrunch, etc.) reads as press-release journalism with quotes exclusively from founders and Lathouris.

### The One Creative Testimonial
Nicholas Lathouris: "If there was something of worth in all that mess and chaos then perhaps only Othelia stands a chance of finding it and, perhaps even organising it into something revelatory."

### Early Story Generator Feedback (~2023, pre-Storykeeper)
From Screen Forever conference discussions:
- **Copyright/data safety concerns**: "When language engines are used, the engine stores and repurposes your content"
- **Creative validity fears**: Tools might lack creative validity
- **Preference for enhancement**: Users preferred co-editing over autonomous generation
- **Positive signals**: Co-creation workflows appealed; "lean-back" tools that inform without demanding active engagement were valued

**StoryForge Recommendations:**

**Community-First Launch: DIFFERENTIATE**
> Othelia's biggest weakness is invisibility. We must do the opposite:
> - **Public demo** from day one (no closed beta gatekeeping)
> - **Open-source repo** that anyone can inspect, fork, contribute to
> - **Active Reddit/Discord/Twitter presence** sharing development progress
> - **YouTube walkthrough videos** showing actual product usage
> - **ProductHunt launch** with public comments enabled
> - **User testimonials** from real writers (not just celebrity collaborators)

**Address Copyright/Data Fears: DIFFERENTIATE**
> Early Othelia feedback showed data safety is a top concern for writers. We should:
> - **Self-hostable**: users can run their own instance
> - **Local-first option**: keep data on their machine
> - **Clear data policy**: "Your data never trains any model. Period."
> - **Open-source transparency**: users can verify our claims by reading the code

---

## 12. Pricing & Business Model

### Current State
- **No pricing announced** (beta is free)
- After 7+ years of development, no pricing signals

### Target Market
- Marketing mentions span from "individual content creators" to "studios managing complex IP assets"
- Actual focus appears to be **enterprise/studio** (alpha-tested with major studios under NDA, Hollywood team, Greenberg's production background)

### Likely Future Model (Inferred)
- Tiered: Individual → Team → Enterprise
- Enterprise likely requires sales call / custom pricing
- Given Hollywood focus, likely high price point ($50-200+/month or annual contracts)

**StoryForge Recommendations:**

**Transparent Pricing: DIFFERENTIATE**
> Launch with clear, public pricing:
> - **Free tier**: Solo author, 1 world, core features (beats, basic writing, limited AI)
> - **Pro tier** ($15-25/month): Unlimited worlds, full AI features, all visualizations, export
> - **Team tier** ($10-15/user/month): Collaboration, shared worlds, access control
> - **Self-hosted**: Free forever (open source)

**Individual Creator Focus: DIFFERENTIATE**
> While Othelia chases studios, we capture the 99% — solo novelists, indie screenwriters, small writing teams, worldbuilding hobbyists. These users are underserved and price-sensitive. Win them with free/affordable tiers and community.

---

## 13. Philosophical & Marketing Analysis

### Othelia's Core Messaging
1. **"AI, but not generative AI"** — contradicted by their own product
2. **"The Cursor for storytelling"** — aspirational but unearned (Cursor has millions of users)
3. **"Keeping humans in control of narrative"** — strong positioning in anti-AI-generation climate
4. **Carrier Bag Theory inspiration** — interesting Le Guin reference, story as container not linear hero's journey

### Key Quotes Worth Noting

**Kate Armstrong-Smith:** "Othelia bridges that gap. From a writer's first draft to a franchise's tenth season, we're giving every stakeholder a shared language to protect creative intent while accelerating production."

**Scott Greenberg:** "This is what I wish I could have had at Bento Box. Every department builds off the story. When continuity breaks or a note lands late, that downstream ripple hits schedules, budgets and ultimately creative quality."

**Alexandra Hooven:** "Speed without structure just creates more noise... What separates enduring stories isn't just craft — it's cohesion, intentionality and the ability to evolve without losing meaning."

### The Producers Guild Stat They Cite
71% of producers identify rewrites and script changes as leading production delays. Othelia addresses continuity bottlenecks and late-stage revision cascades.

**StoryForge Recommendations:**

**Honest AI Messaging: DIFFERENTIATE**
> Where Othelia says "not generative" while being generative, we say: "Analysis-first. Generation when you choose. Always transparent." Our honesty IS our marketing.

**Narrative Theory as Differentiator: DIFFERENTIATE**
> Othelia mentions NO formal narrative frameworks (Dramatica, Propp, Barthes, etc.) in any public material. They reference Le Guin's Carrier Bag Theory philosophically, but don't implement formal story structure engines. Our multi-framework overlay (Hero's Journey, Save the Cat, Dramatica, Kishotenketsu, etc.) is a genuine competitive advantage they cannot quickly replicate.

**"Open Source Othelia" Positioning: ADOPT the problem, DIFFERENTIATE the solution**
> Position StoryForge as: "Everything Othelia promises, but open source, transparent, and built for individual creators — not just Hollywood studios."

---

## 14. Summary: Pattern-by-Pattern Recommendations

### ADOPT (Copy directly — these patterns work)
| Pattern | Why |
|---|---|
| Kanban beat board with drag-and-drop | Industry-standard, proven UX |
| Beat card field set (title, desc, characters, color, tags, notes, stars) | Comprehensive and well-chosen |
| Synopsis as AI prerequisite / gate | Ensures context quality, requires human creative input first |
| Bidirectional beat↔script navigation | Essential for integrated workflow |
| Auto-updating treatment from beat order | Core value proposition |
| Mini-map navigator on beat board | Clever spatial orientation for large boards |
| Filter by star/tag/character with reset | Baseline filtering functionality |
| Expanded card with tabbed view | Clean pattern for progressive detail |
| Screenplay vs. TV structural modes | Must-have for cross-format support |
| "More content = better AI" context cascade | Good UX principle for AI features |

### IMPROVE (Good idea, we do it better)
| Pattern | Our Improvement |
|---|---|
| Beat card fields | Add structure beat mapping, value change, dependencies, thumbnail |
| Filtering | Add structure beat filter, emotional tone, unassigned filter, text search |
| Story Sidebar | Richer: logline, genre selector, word count targets, stats, consistency alerts |
| Writing surface | Full TipTap: entity highlighting, focus mode, word targets, split view |
| Treatment view | Editable overrides, diff view, multi-format export, version history |
| AI wand review flow | Diff-style preview, Accept/Edit/Regenerate/Dismiss, "Why this?" reasoning |
| Revision impact analysis | Visual cascade diagram with severity indicators and pre-commit preview |
| Creative intent search | Add narrative theory filters, cross-framework search, visual results |
| Entity extraction | Confidence scores, proposed/confirmed status, entity resolution UI |

### AVOID (Weaknesses we should not repeat)
| Pattern | Why It's Bad |
|---|---|
| Closed beta / invite-only access | Kills community building and word-of-mouth |
| No public demo or walkthrough | Product is invisible to potential users |
| Zero community presence | No Reddit, no ProductHunt, no organic discussion = no grassroots adoption |
| "Non-generative" while being generative | Dishonest marketing erodes trust when discovered |
| No pricing transparency | After 7 years, still no pricing = uncertainty |
| Enterprise-first targeting | Ignores the 99% of writers who aren't studio employees |
| PR-only coverage | No independent reviews means no credibility outside press releases |
| Thin help documentation | Zendesk articles are sparse; users need comprehensive guides |

### DIFFERENTIATE (Do something deliberately different)
| Pattern | Our Approach |
|---|---|
| Open source vs. closed | Full open source (MIT), self-hostable, community-driven |
| Transparent AI vs. hidden generation | Clearly label all AI generation; show context and confidence |
| Narrative theory engine | Multi-framework overlays (Dramatica, Propp, Barthes, etc.) — Othelia has none |
| Individual creators vs. enterprise | Target solo authors and small teams (2-5) first |
| Public pricing vs. TBD | Clear, affordable tiers from launch; generous free tier |
| Community-first vs. press-first | Reddit, Discord, YouTube, ProductHunt presence from day one |
| Dark mode | Writers work in low light; ship dark mode from v1 |
| Adjustable information density | Let users control card detail level (minimal/standard/detailed) |
| Progressive sidebar disclosure | Collapsible sections vs. flat sidebar |
| Prose mode + screenplay mode | Othelia appears screenplay-only; we support novels too |
| Data sovereignty | Self-hostable, local-first option, open-source verifiable |
| Cross-media worlds | One world spanning novel + screenplay + game + TV (Othelia claims this but unclear if implemented) |

---

## 15. Strategic Implications for StoryForge Sprint Planning

### Sprint 1 Priority Adjustments
Based on this teardown, Sprint 1 should ensure these Othelia-parity features are solid:
1. **Beat card data model** with all fields (title, desc, characters, color, tags, notes, stars) — CRITICAL
2. **Synopsis field** in Story Sidebar with AI gating mechanism — CRITICAL
3. **Basic beat board** with drag-and-drop — CRITICAL
4. **Treatment auto-generation** from beats — HIGH

### Sprint 2 Priority Adjustments
5. **Writing surface** with beat↔script navigation — CRITICAL
6. **Mini-map navigator** — MEDIUM (nice-to-have for MVP, required for parity)
7. **AI wand** with prerequisite checking and transparent review flow — HIGH

### Post-Sprint Differentiators (what gives us unfair advantage)
8. **Multi-framework structure overlay** — Othelia has NOTHING like this
9. **Prose mode** for the writing surface — Othelia appears screenplay-only
10. **Open community and documentation** — wins organic adoption Othelia can't get
11. **Dark mode** — writers want this
12. **Self-hosting** — addresses data sovereignty concerns raised by early Othelia testers

---

## Appendix: Sources

### Primary Sources
- [Othelia Homepage](https://othelia.com/)
- [Othelia Beta Signup](https://othelia.com/beta)
- [Othelia Help Center — Story Beats](https://othelia.zendesk.com/hc/en-us/articles/8208980536335-Story-Beats)
- [App URL: app.othelia.co](https://app.othelia.co) (login-required)

### Trade Press
- [Variety — Othelia Launches as AI Storytelling Platform](https://variety.com/2025/tv/news/othelia-launches-ai-storytelling-platform-1236562404/)
- [Hollywood Reporter — Othelia Expands to U.S.](https://www.hollywoodreporter.com/business/business-news/othelia-expands-hire-bento-box-ceo-scott-greenberg-1236262508/)
- [TechCrunch — Othelia Technologies Profile](https://techcrunch.com/startup-battlefield/company/othelia-technologies/)
- [Deadline — Scott Greenberg Joins Othelia](https://deadline.com/2025/06/former-bento-box-boss-scott-greenberg-othelia-technologies-1236430914/)
- [Business News Australia — Othelia Expands to US](https://www.businessnewsaustralia.com/articles/-chasing-faster-creative-output---othelia-expands-to-us-with-ai-narrative-tool-storykeeper.html)

### PR / Wire
- [PR Newswire — Othelia Unveils Next-Gen AI System (Oct 2025)](https://www.prnewswire.com/news-releases/othelia-unveils-a-next-gen-ai-system-designed-to-power-the-architecture-of-modern-storytelling-302596114.html)
- [PR Newswire — Othelia US Expansion (June 2025)](https://www.prnewswire.com/news-releases/australia-founded-othelia-technologies-expands-to-us-and-names-scott-greenberg-executive-chairman-302479311.html)

### Industry / Community
- [IF Magazine — Holding onto the Magic of Human Storytelling](https://if.com.au/sponsored_content/holding-onto-the-magic-of-human-storytelling-in-the-ai-era/)
- [ScreenHub — ChatGPT and AI Screenwriting Tools at Screen Forever](https://www.screenhub.com.au/news/opinions-analysis/chatgpt-and-new-ai-screenwriting-tools-insights-from-screen-forever-2614437/)
- [SPROCKIT — Othelia Startup Profile](https://www.sprockit.com/our-startups/project-one-6fffc-c2e5r-ahddb-224rc-n4wj4)
- [UNE SMART Region Incubator — Othelia](https://www.unesri.com.au/othelia)

### Business / Funding
- [PitchBook — Othelia Company Profile](https://pitchbook.com/profiles/company/507000-16)
- [Crunchbase — Othelia Technologies](https://www.crunchbase.com/organization/othelia-technologies)
- [ALIAVIA Ventures](https://www.aliaviaventures.com/)

---

*Report compiled March 29, 2026 by StoryForge UX Research*
*Based on publicly available sources — no proprietary/NDA information used*
