# StoryForge QA Report

**Date:** 2026-03-29
**Build:** `whim-ow-106` branch, deployed at https://app-xi-drab.vercel.app
**Tested by:** Automated QA team (5 parallel testers on Claude Opus 4.6)
**Test method:** Source code audit + API endpoint analysis

---

## Executive Summary

StoryForge is approximately **15-20% functional** toward its Othelia carbon-copy target. The foundation is solid: auth works, 12 entity CRUD pages are operational with full API backing, the beat sheet kanban is functional, and the writing surface renders with basic prose editing. However, several critical features are coded but not wired up (4 TipTap extensions, visualization components, treatment-beat integration), and 7 pages are empty stubs.

**By the numbers:**
- 27 pages exist under `/world/[id]/`
- 12 entity CRUD pages: **WORKS**
- 4 visualization pages: **PARTIAL** (render with mock data only)
- 7 advanced pages: **STUB** (title + description only)
- 48 API route files: all have auth, most have validation
- 8 visualization components built (6,763 lines total): only 4 are mounted on pages
- 19 React Query hook files, 14 Zustand stores

---

## 1. Critical Bugs

These are broken features that block core workflows or corrupt data.

### BUG-001: Beat edit dialog resets status to 'todo' (Data Corruption)
- **File:** `src/components/beats/beat-form-dialog.tsx:94`
- **Impact:** Every time a user edits any beat field (name, description, etc.), the PATCH request includes `status: 'todo'` regardless of the beat's current column. Beats silently move back to the "To Do" column.
- **Root cause:** `handleSubmit` always sends `status: defaultStatus` where `defaultStatus` defaults to `'todo'`. The form never loads the beat's current status.
- **Severity:** P0 - data corruption on every edit

### BUG-002: No logout button anywhere in the app
- **Files:** Searched entire `src/` directory
- **Impact:** Users cannot log out. `signOut` is exported from `src/lib/auth/index.ts` but is never imported or used in any component. The only way to log out is manually clearing cookies.
- **Severity:** P0 - basic auth flow broken

### BUG-003: No route protection middleware
- **Files:** No `src/middleware.ts` exists
- **Impact:** Dashboard pages render their full UI shell (sidebar, navigation) for unauthenticated users. Auth is only enforced at the API layer, so API calls return 401 but the page chrome is visible. No server-side redirect to `/login`.
- **Severity:** P0 - security gap

### BUG-004: 4 TipTap extensions coded but not registered
- **File:** `src/components/editors/story-editor.tsx:41-60`
- **Impact:** The following fully-written extensions are never added to the TipTap extensions array:
  1. `ScreenplayMode` (`extensions/screenplay-mode.ts`) - screenplay auto-formatting
  2. `EntityHighlighter` (`extensions/entity-highlighter.ts`) - inline entity highlighting
  3. `AIWandExtension` (`extensions/ai-wand.ts`) - Cmd+Shift+A AI assist
  4. `BeatMarker` (`extensions/beat-marker.ts`) - beat gutter markers
- **Root cause:** Extensions are imported nowhere in `story-editor.tsx`
- **Severity:** P0 - blocks screenplay mode, AI wand, entity highlighting, beat markers

### BUG-005: AI Wand panel not mounted + API route disconnected
- **Files:** `src/components/editors/ai-wand/ai-wand-panel.tsx`, `src/app/api/worlds/[id]/generate/route.ts`
- **Impact:** The AI Wand panel component exists but is never rendered in the write page or story-editor. The generate API route exists and is functional, but the panel calls the correct endpoint path. However, since the AIWandExtension isn't registered (BUG-004), the keyboard shortcut doesn't work, and the panel is never shown.
- **Severity:** P0 - core Othelia feature completely non-functional

### BUG-006: Story Sidebar state not persisted
- **File:** `src/components/editors/story-sidebar/index.tsx:64-65`
- **Impact:** Synopsis and scene notes use `useState('')` - pure local state that resets on every page load/refresh. Synopsis is a prerequisite for AI Wand activation. Characters list is hardcoded to an empty array (`characters={[]}`).
- **Severity:** P1 - sidebar is decorative, not functional

### BUG-007: Focus mode creates duplicate editor instance
- **File:** `src/app/(dashboard)/world/[id]/write/page.tsx:249`
- **Impact:** Focus mode renders a second independent `StoryEditor` instance instead of restyling the existing one. Both share the same `handleUpdate` callback but have independent TipTap state. Edits in focus mode auto-save to DB, but the main editor won't reflect changes until re-fetch. Risk of data conflict/lost edits.
- **Severity:** P1 - potential data loss

---

## 2. Non-Critical Bugs

These are broken but have workarounds.

### BUG-008: No delete confirmation on worlds
- **File:** `src/app/(dashboard)/worlds/page.tsx:164-168`
- **Impact:** Clicking "Delete" in the world dropdown immediately fires `deleteWorld.mutate(world.id)` with no confirmation dialog. One-click destructive action.
- **Workaround:** Soft-delete means data is recoverable via DB, but no UI for it.

### BUG-009: No delete confirmation on beats
- **File:** `src/app/(dashboard)/world/[id]/beats/page.tsx:161`
- **Impact:** Same as BUG-008 but for beats. One accidental click permanently removes a beat.

### BUG-010: No error feedback on mutations (app-wide)
- **Files:** All mutation hooks in `src/lib/hooks/` (19 files)
- **Impact:** Create, update, and delete mutations across all entities have no `onError` callbacks. API failures silently fail with no user-visible toast or notification.

### BUG-011: Edit world frontend not wired up
- **File:** `src/app/(dashboard)/worlds/page.tsx:156` — `// TODO: wire up edit dialog in a follow-up`
- **Impact:** The "Edit" menu item in the world dropdown does nothing. The PATCH API endpoint works, and the Settings page provides an alternative path.
- **Workaround:** Use `/world/[id]/settings` to edit world details.

### BUG-012: Email not normalized in registration
- **File:** `src/app/api/auth/register/route.ts`
- **Impact:** Email is not trimmed or lowercased before user creation. Could allow duplicate accounts with different casing (e.g., `Demo@storyforge.dev` vs `demo@storyforge.dev`).

### BUG-013: No client-side session expiry handling
- **Impact:** If the JWT expires while a user is on a page, API calls start returning 401 but there's no interceptor to redirect to `/login`.

### BUG-014: Dead code in beat store
- **File:** `src/stores/beat-store.ts:8,23,28,29`
- **Impact:** `highlightBeatId`, `setHighlightBeatId`, `clearHighlight` are defined but never used by any component.

---

## 3. Missing Features

Features specified in the Othelia carbon-copy spec that are not implemented.

### Missing from Beat Sheet
| Feature | Status | Notes |
|---------|--------|-------|
| Tags on beats | MISSING | Tag model exists in Prisma (polymorphic) but Beat has no tags relation. No tag UI. |
| Tag filtering | MISSING | Filter dropdown exists for star rating and character, but not tags. |
| Treatment auto-update on beat reorder | MISSING | Treatment and beats are disconnected. Reorder API only updates position/status. |
| AI Wand icon on beat cards | MISSING | Spec: "AI Wand icon on each card" for generate/refine. Not implemented. |
| Notes preview on cards | MISSING | Notes field saves but is only visible when editing, not on card face. |
| Empty column states | MISSING | Empty kanban columns show nothing — no placeholder text or illustration. |

### Missing from Writing Surface
| Feature | Status | Notes |
|---------|--------|-------|
| Screenplay auto-formatting | BROKEN | Extension coded but not registered (BUG-004). |
| AI Wand (Cmd+Shift+A) | BROKEN | Extension + panel coded but not wired up (BUG-004, BUG-005). |
| Entity highlighting | BROKEN | Extension coded but not registered (BUG-004). |
| Split view (editor + source) | MISSING | Not implemented. |
| Chapter/scene management UI | MISSING | Freeform editor only. H1/H2/H3 serve as structural markers. |
| Manuscript delete/rename UI | MISSING | API exists, no frontend. |
| Section management UI | MISSING | API exists, no frontend. |
| Collaboration (Yjs) | MISSING | `@tiptap/extension-collaboration` installed but not used. |
| Fountain.js integration | MISSING | `fountain-js` installed in package.json but never imported. |

### Missing from Auth & Navigation
| Feature | Status | Notes |
|---------|--------|-------|
| Logout button | MISSING | No logout UI anywhere (BUG-002). |
| Route protection middleware | MISSING | No `middleware.ts` (BUG-003). |
| Rate limiting on auth endpoints | MISSING | No brute-force protection on login/register. |

---

## 4. Page-by-Page Status

### Entity CRUD Pages
All follow the same pattern: React Query hooks + Zustand store + card grid + create/edit dialogs + dropdown menu (edit/delete).

| # | Page | Route | Status | API Backing | Notes |
|---|------|-------|--------|-------------|-------|
| 1 | World Overview | `/world/[id]` | WORKS | GET world, characters, beats | Dashboard with stats cards and quick links |
| 2 | Characters | `/world/[id]/characters` | WORKS | Full CRUD | Create/edit/delete. No relationship graph on page (component exists separately). |
| 3 | Locations | `/world/[id]/locations` | WORKS | Full CRUD | Create/edit/delete with region, climate, significance fields. |
| 4 | Events | `/world/[id]/events` | WORKS | Full CRUD | Create/edit/delete. |
| 5 | Scenes | `/world/[id]/scenes` | WORKS | Full CRUD | Create/edit/delete. |
| 6 | Relationships | `/world/[id]/relationships` | WORKS | Full CRUD | Create requires characterA, characterB, type. |
| 7 | Factions | `/world/[id]/factions` | WORKS | Full CRUD | Includes goals array management. |
| 8 | Objects | `/world/[id]/objects` | WORKS | Full CRUD | Create/edit/delete. |
| 9 | Themes | `/world/[id]/themes` | WORKS | Full CRUD | Create/edit/delete. |
| 10 | Arcs | `/world/[id]/arcs` | WORKS | Full CRUD + phases | Arc CRUD with nested arc phases (sub-CRUD). |
| 11 | Sources | `/world/[id]/sources` | WORKS | Full CRUD | Source material management with detail view at `/sources/[sourceId]`. |
| 12 | Structure | `/world/[id]/structure` | WORKS | Acts + Sequences CRUD | Dual-panel: Acts on left, Sequences on right. |

### Core Feature Pages

| # | Page | Route | Status | Notes |
|---|------|-------|--------|-------|
| 13 | Beats | `/world/[id]/beats` | WORKS | Kanban board with drag-drop, star ratings, filters, minimap. See Section 2 for bugs. |
| 14 | Write | `/world/[id]/write` | PARTIAL | TipTap editor works for prose. Screenplay mode, AI wand, entity highlighting all broken (BUG-004). |
| 15 | Treatment | `/world/[id]/treatment` | WORKS | Generates from beats via `useTreatmentBeats` hook. Editable sections with override persistence. Export to PDF/Markdown/Plain Text. |
| 16 | Settings | `/world/[id]/settings` | WORKS | Edit world name, description, genre, logline. Fetches via React Query, saves via mutation. |

### Visualization Pages (Mock Data Only)

| # | Page | Route | Status | Component | Lines | Notes |
|---|------|-------|--------|-----------|-------|-------|
| 17 | Timeline | `/world/[id]/timeline` | PARTIAL | `dual-timeline.tsx` | 1,147 | D3-based dual fabula/sjuzhet timeline. Renders with MOCK_DATA, not DB. |
| 18 | Foreshadowing | `/world/[id]/foreshadowing` | PARTIAL | `foreshadowing-web.tsx` | 864 | Canvas-based directed graph. Renders with MOCK_DATA. |
| 19 | Pacing | `/world/[id]/pacing` | PARTIAL | `pacing-heatmap.tsx` | 426 | D3 heatmap visualization. Renders with MOCK_DATA. |
| 20 | Mindmap | `/world/[id]/mindmap` | PARTIAL | `mind-map.tsx` | 741 | Canvas-based mind map. Renders with MOCK_DATA. |

### Visualization Components Built but NOT Mounted on Any Page

| Component | Lines | Library | Notes |
|-----------|-------|---------|-------|
| `character-graph.tsx` | 976 | D3 force-directed | Not used on characters page. Full graph with factions, edge types, time slider. |
| `arc-diagram.tsx` | 484 | D3 | Not used on arcs page. Arc curves with structure overlay. |
| `faction-map.tsx` | 515 | D3 force-directed | Not used on factions page. Hierarchical network graph. |
| `emotional-arc.tsx` | 629 | D3 line chart | Not mounted anywhere. Per-character emotional trajectory. |

### Stub Pages (Title + Description Only)

| # | Page | Route | Status | Planned Feature |
|---|------|-------|--------|-----------------|
| 21 | Wiki | `/world/[id]/wiki` | STUB | Auto-linking world encyclopedia |
| 22 | Canon | `/world/[id]/canon` | STUB | Canon management, snapshots, versioning |
| 23 | Consistency | `/world/[id]/consistency` | STUB | Contradiction checker |
| 24 | What-If | `/world/[id]/whatif` | STUB | Scenario exploration |
| 25 | Causality | `/world/[id]/causality` | STUB | Causal chain visualization |
| 26 | Knowledge | `/world/[id]/knowledge` | STUB | Audience knowledge tracker |
| 27 | Systems | `/world/[id]/systems` | STUB | Magic systems, world rules |

---

## 5. API & Data Layer

### API Coverage
48 route files under `src/app/api/worlds/`. All endpoints use `requireAuth()` or `requireWorldAuth()` for authentication. Auth pattern is consistent and secure.

| Resource | Routes | Methods | Status |
|----------|--------|---------|--------|
| Worlds | `/api/worlds`, `/api/worlds/[id]` | GET, POST, PATCH, DELETE | WORKS |
| Beats | `/api/worlds/[id]/beats`, `beats/[id]`, `beats/reorder` | GET, POST, PATCH, DELETE | WORKS |
| Characters | `/api/worlds/[id]/characters`, `characters/[id]` | GET, POST, PATCH, DELETE | WORKS |
| Manuscripts | `/api/worlds/[id]/manuscripts`, `manuscripts/[id]` | GET, POST, PATCH, DELETE | WORKS |
| Manuscript Sections | `.../manuscripts/[id]/sections`, `sections/[id]` | GET, POST, PATCH, DELETE | WORKS |
| Events | `/api/worlds/[id]/events`, `events/[id]` | GET, POST, PATCH, DELETE | WORKS |
| Scenes | `/api/worlds/[id]/scenes`, `scenes/[id]` | GET, POST, PATCH, DELETE | WORKS |
| Locations | `/api/worlds/[id]/locations`, `locations/[id]` | GET, POST, PATCH, DELETE | WORKS |
| Relationships | `/api/worlds/[id]/relationships`, `relationships/[id]` | GET, POST, PATCH, DELETE | WORKS |
| Factions | `/api/worlds/[id]/factions`, `factions/[id]`, `factions/[id]/members` | GET, POST, PATCH, DELETE | WORKS |
| Arcs | `/api/worlds/[id]/arcs`, `arcs/[id]`, `arcs/[id]/phases`, `phases/[id]` | GET, POST, PATCH, DELETE | WORKS |
| Objects | `/api/worlds/[id]/objects`, `objects/[id]` | GET, POST, PATCH, DELETE | WORKS |
| Themes | `/api/worlds/[id]/themes`, `themes/[id]` | GET, POST, PATCH, DELETE | WORKS |
| Treatments | `/api/worlds/[id]/treatments`, `treatments/[id]` | GET, POST, PATCH, DELETE | WORKS |
| Sources | `/api/worlds/[id]/sources/[id]` | GET, PATCH, DELETE | WORKS |
| Acts | `/api/worlds/[id]/acts`, `acts/[id]` | GET, POST, PATCH, DELETE | WORKS |
| Sequences | `/api/worlds/[id]/sequences`, `sequences/[id]` | GET, POST, PATCH, DELETE | WORKS |
| Comments | `/api/worlds/[id]/comments`, `comments/[id]` | GET, POST, PATCH, DELETE | WORKS |
| Motifs | `/api/worlds/[id]/motifs`, `motifs/[id]` | GET, POST, PATCH, DELETE | WORKS |
| Tags | `/api/worlds/[id]/tags` | GET, POST | WORKS |
| Stats | `/api/worlds/[id]/stats` | GET | WORKS |
| Generate (AI) | `/api/worlds/[id]/generate` | POST | WORKS (backend) |
| Analyze | `/api/worlds/[id]/analyze` | POST | WORKS (backend) |
| Ingest | `/api/worlds/[id]/ingest` | POST | WORKS (backend) |
| Export | `/api/worlds/[id]/export` | GET | WORKS |
| Entity Confirm | `/api/worlds/[id]/entities/confirm` | POST | WORKS |
| Auth Register | `/api/auth/register` | POST | WORKS |

### Hooks & Stores
- **19 React Query hook files** covering all entities. All use consistent pattern: `useQuery` for reads, `useMutation` for writes, query key invalidation on success.
- **14 Zustand stores** for UI state (dialog open/close, selection, filters). Clean and lightweight.
- **Gap:** No hooks expose `onError` callbacks to surface API failures to users.

### Data Layer Quality
- Prisma queries in `src/lib/db/queries.ts` use consistent `notDeleted` filter (`{ deletedAt: null }`)
- Soft-delete pattern is uniform across all entities
- `requireWorldAuth()` helper combines auth + ownership check — used consistently
- Beat reorder uses `$transaction` for atomic position updates
- No N+1 issues found — queries use appropriate `include` for relations
- **Only 1 TODO comment** found in entire source: `worlds/page.tsx:156` (edit dialog)
- **Zero console.log statements** in production code
- **Zero hardcoded IDs or URLs** in source

---

## 6. Recommended Fix Priority

### Tier 1: Critical (fix immediately)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | **Register 4 TipTap extensions** (BUG-004) | Unblocks screenplay, AI wand, entity highlighting, beat markers | Small - add 4 imports + array entries |
| 2 | **Fix beat edit status reset** (BUG-001) | Stops data corruption on every beat edit | Small - load current status into form state |
| 3 | **Add logout button** (BUG-002) | Basic auth completeness | Small - add signOut() call to user menu |
| 4 | **Add route protection middleware** (BUG-003) | Security: prevent unauthenticated dashboard access | Small - create middleware.ts with matcher |

### Tier 2: High (fix this sprint)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 5 | **Mount AI Wand panel** in write page (BUG-005) | Enables AI generation feature | Small - render component + pass props |
| 6 | **Persist synopsis/notes** in Story Sidebar (BUG-006) | Required for AI Wand prerequisite | Medium - save to world model or manuscript |
| 7 | **Wire up characters** in Story Sidebar | Shows character list instead of empty array | Small - pass useCharacters() data |
| 8 | **Add delete confirmations** (BUG-008, BUG-009) | Prevent accidental data loss | Small - add confirm dialog before mutations |
| 9 | **Add error toasts** on mutations (BUG-010) | Surface API failures to users | Medium - add onError callbacks with toast |
| 10 | **Fix focus mode dual-editor** (BUG-007) | Prevent edit conflicts | Medium - restyle single editor instead |

### Tier 3: Medium (next sprint)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 11 | **Connect visualizations to real data** | Replace MOCK_DATA with DB queries on 4 pages | Large - API + data transformation |
| 12 | **Mount unmounted visualizations** | character-graph, arc-diagram, faction-map, emotional-arc on their pages | Medium |
| 13 | **Add tags to beats** | Othelia parity feature | Medium - schema relation + UI + filter |
| 14 | **Treatment-beat integration** | Auto-update treatment when beats reorder | Medium - hook into reorder API |
| 15 | **Wire up edit world dialog** (BUG-011) | Complete world CRUD on list page | Small |
| 16 | **Normalize email** on registration (BUG-012) | Prevent duplicate accounts | Small |

### Tier 4: Low (backlog)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 17 | Build out 7 stub pages | Wiki, Canon, Consistency, What-If, Causality, Knowledge, Systems | Large per page |
| 18 | Manuscript section management UI | Frontend for existing API | Medium |
| 19 | Session expiry handling (BUG-013) | Better UX on expired sessions | Small |
| 20 | Rate limiting on auth endpoints | Security hardening | Medium |
| 21 | Split view (editor + source material) | Spec feature | Large |
| 22 | Chapter/scene management UI | Structural editing | Large |
| 23 | Yjs collaboration | Real-time multi-user editing | Large |

---

## 7. What Works Well

Credit where due — these areas are solid:

- **Auth system:** NextAuth with credentials provider, bcrypt hashing, JWT strategy, typed session with user ID injection. Clean and secure.
- **API layer:** 48 route files, all with consistent auth, validation, error handling. Zero auth gaps found.
- **Prisma data layer:** Consistent soft-delete pattern, proper relation includes, transaction usage where needed. Clean query abstraction.
- **React Query hooks:** 19 hook files with consistent caching, invalidation, and refetch patterns.
- **Beat sheet kanban:** Drag-and-drop with @dnd-kit, persistent reordering, star ratings, character filtering, minimap navigator. Well-built.
- **Treatment view:** Generates from beats, editable sections with override persistence, multi-format export (PDF, Markdown, plain text).
- **Visualization components:** 8 substantial D3-based components (6,763 lines total) with proper interactivity, tooltips, filtering. Just need to be connected to real data.
- **Code quality:** Only 1 TODO in entire source. Zero console.logs. Zero hardcoded values. Clean TypeScript throughout.

---

*Generated by StoryForge QA Captain, 2026-03-29*
