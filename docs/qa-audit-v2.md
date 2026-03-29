# QA Audit v2 - OnlyDolls World (StoryForge)

**Date**: 2026-03-29
**Branch**: `whim-ow-132`
**Auditors**: 4 parallel code-level testers (Opus 4.6)
**App**: https://app-xi-drab.vercel.app
**Method**: Static code analysis of every handler, API route, and state transition

---

## Executive Summary

| Area | Status | Critical | High | Medium | Low |
|------|--------|----------|------|--------|-----|
| Auth (Login/Register) | PARTIAL | 0 | 1 | 2 | 2 |
| Auth (Session/Sign-out) | BROKEN | 1 | 0 | 0 | 1 |
| Onboarding Survey | PARTIAL | 0 | 1 | 0 | 1 |
| Onboarding Wizard | PARTIAL | 0 | 0 | 3 | 1 |
| World Management | PARTIAL | 0 | 2 | 2 | 2 |
| Beat Sheet / Kanban | BROKEN | 0 | 3 | 1 | 1 |
| Treatment View | BROKEN | 0 | 2 | 0 | 0 |
| Writing Surface | BROKEN | 2 | 0 | 0 | 0 |
| Characters CRUD | PARTIAL | 0 | 0 | 1 | 1 |
| Locations CRUD | PARTIAL | 0 | 1 | 1 | 1 |
| Factions CRUD | PARTIAL | 0 | 0 | 1 | 2 |
| Objects CRUD | PARTIAL | 0 | 0 | 1 | 1 |
| Themes CRUD | PARTIAL | 0 | 0 | 1 | 1 |
| Events CRUD | PARTIAL | 0 | 0 | 2 | 1 |
| Scenes CRUD | PARTIAL | 0 | 0 | 2 | 1 |
| Relationships CRUD | BROKEN | 1 | 0 | 2 | 1 |
| Arcs CRUD | PARTIAL | 0 | 1 | 2 | 1 |
| Sidebar Navigation | PARTIAL | 0 | 1 | 1 | 2 |
| Command Palette | PARTIAL | 0 | 1 | 2 | 2 |
| Keyboard Shortcuts | PARTIAL | 0 | 0 | 3 | 2 |
| Sources / Ingestion | BROKEN | 2 | 2 | 2 | 1 |
| Ingestion API | BROKEN | 2 | 2 | 2 | 0 |
| **Cross-cutting (all entities)** | -- | 0 | 1 | 2 | 0 |
| **TOTALS** | | **8** | **18** | **33** | **23** |

**Overall verdict: ~35% functional.** Core features (writing, beats kanban, sources) are structurally broken. Auth and entity CRUD are partially working. Navigation and command palette are mostly functional.

---

## Critical Bugs (8) - Must Fix Before Any User Testing

### CRIT-1: Sign-out button is non-functional
- **File**: `src/components/layout/sidebar.tsx:68-82`
- **Impact**: Users cannot log out. The LogOut button renders but has NO `onClick` handler and NO call to `signOut()`. Purely decorative.

### CRIT-2: Writing surface content load is broken - schema mismatch
- **File**: `src/lib/hooks/use-manuscripts.ts:11-13`, `src/app/(dashboard)/world/[id]/write/page.tsx:210`
- **Impact**: `ManuscriptWithContent` expects `content: JSONContent | null` but `Manuscript` Prisma model has no `content` field. Content lives in `ManuscriptSection.content`. The editor always initializes with `undefined` content. The entire write page shows a blank editor.

### CRIT-3: Writing surface auto-save silently discards all content
- **File**: `src/lib/hooks/use-manuscripts.ts:79-96`, `src/types/index.ts:391-396`
- **Impact**: `useSaveContent` sends `{ content: JSONContent }` via PATCH, but `UpdateManuscriptPayload` has only `title`, `format`, `status`, `targetWordCount`. Prisma's `updateMany` silently ignores the unknown `content` field. Auto-save fires every 2 seconds, shows "Draft saved" toast, but **nothing is actually persisted**. All content is lost on page reload.

### CRIT-4: Sources list API endpoint does not exist
- **File**: Missing `src/app/api/worlds/[id]/sources/route.ts`
- **Impact**: `useSources` hook calls `GET /api/worlds/${worldId}/sources` which returns 404. The sources list page always shows error state. Manual source creation via `POST` also fails.

### CRIT-5: Source edit/delete API handlers do not exist
- **File**: `src/app/api/worlds/[id]/sources/[sourceId]/route.ts` only exports `GET`
- **Impact**: `PATCH` and `DELETE` return 405 Method Not Allowed. Edit and delete buttons on source cards are non-functional at the API level.

### CRIT-6: Ingestion does not persist SourceMaterial records
- **File**: `src/app/api/worlds/[id]/ingest/route.ts`
- **Impact**: The ingestion endpoint processes files and returns extracted entities but never creates a `SourceMaterial` database record. After the response, the parsed content is lost forever.

### CRIT-7: Relationships create form requires raw CUIDs
- **File**: `src/app/(dashboard)/world/[id]/relationships/page.tsx:86-101`
- **Impact**: "Source Character ID" and "Target Character ID" are plain text inputs requiring users to type raw CUID strings. The card display also shows raw IDs instead of character names (line 257). Effectively unusable.

### CRIT-8: Sign-out button is non-functional (duplicate from sidebar nav audit)
- Confirmed by two independent auditors. Same as CRIT-1.

> **Deduplicated critical count: 7 unique critical bugs.**

---

## High Severity Bugs (18)

### HIGH-1: No try/catch in any API route handler (cross-cutting)
- **Files**: All `src/app/api/worlds/[id]/*/route.ts`
- **Impact**: Unhandled Prisma errors produce raw 500 responses with no structured `{ error, code }` body. Breaks client-side `apiFetch` which expects JSON.

### HIGH-2: No try/catch in login/register form handlers
- **Files**: `src/app/(auth)/login/page.tsx:28-31`, `src/app/(auth)/register/page.tsx:41-52`
- **Impact**: Network failures or non-JSON responses cause unhandled exceptions. Loading spinner gets stuck.

### HIGH-3: Delete world has no confirmation dialog
- **File**: `src/app/(dashboard)/worlds/page.tsx:188-196`
- **Impact**: Single misclick permanently soft-deletes an entire story world.

### HIGH-4: No error display for world create/delete mutations
- **File**: `src/app/(dashboard)/worlds/page.tsx`
- **Impact**: `createWorld.error` and `deleteWorld.error` are never checked or displayed. Failed operations produce no user feedback.

### HIGH-5: Survey "Continue" silently accepts incomplete data
- **File**: `src/components/onboarding/signup-survey.tsx:106`
- **Impact**: Button enables with only one of two answers. Partial survey data stored as `projectType: ''`.

### HIGH-6: Beat update API route missing (404)
- **File**: Missing `src/app/api/worlds/[id]/beats/[beatId]/route.ts`
- **Impact**: `useUpdateBeat` calls `PATCH /api/worlds/${worldId}/beats/${id}` which returns 404. Editing beats fails.

### HIGH-7: Beat delete API route missing (404)
- **File**: Missing `src/app/api/worlds/[id]/beats/[beatId]/route.ts`
- **Impact**: `useDeleteBeat` calls `DELETE /api/worlds/${worldId}/beats/${id}` which returns 404.

### HIGH-8: Beat reorder API route missing (404)
- **File**: Missing `src/app/api/worlds/[id]/beats/reorder/route.ts`
- **Impact**: `useReorderBeats` calls `PATCH /api/worlds/${worldId}/beats/reorder` which returns 404. Drag-and-drop reorder is non-functional.

### HIGH-9: Treatment act grouping uses ghost fields
- **File**: `src/lib/hooks/use-treatments.ts:18-19, 64-78`
- **Impact**: `ApiBeat` interface declares `actId`/`actName` but Beat model has no such fields. Values are always `null`. Treatment degrades to flat list without act headers.

### HIGH-10: Treatment override save depends on missing beat PATCH route
- **File**: Uses `useUpdateBeat` which 404s (see HIGH-6)
- **Impact**: Cannot save treatment text overrides.

### HIGH-11: Location parentId requires raw CUID input
- **File**: `src/app/(dashboard)/world/[id]/locations/page.tsx:93-97`
- **Impact**: No dropdown/select for parent location. Users must type raw CUID strings.

### HIGH-12: Arc characterId requires raw CUID input
- **File**: `src/app/(dashboard)/world/[id]/arcs/page.tsx:91-97`
- **Impact**: No character dropdown. Users must type raw CUID strings.

### HIGH-13: No mobile responsiveness on sidebars
- **Files**: `src/components/layout/sidebar.tsx`, `src/components/layout/workspace-sidebar.tsx`
- **Impact**: No responsive breakpoints, no hamburger menu, no drawer pattern. On mobile, sidebars consume most of the viewport.

### HIGH-14: Command palette navigation definitions duplicated and drifting
- **File**: `src/components/command-palette/command-actions.ts:53-86` vs `src/lib/navigation-config.ts:47-106`
- **Impact**: `source-viewer` in command palette navigates to `/world/{id}/sources` instead of `/world/{id}/sources/viewer`.

### HIGH-15: Client/server file format mismatch for ingestion
- **File**: `src/components/ingestion/upload-dropzone.tsx:30` vs `src/app/api/worlds/[id]/ingest/route.ts:12`
- **Impact**: Dropzone accepts `.docx`, `.pdf`, `.fdx`, `.epub` but API only allows `.txt`, `.md`, `.markdown`, `.fountain`. Users see upload succeed client-side validation then fail on the server.

### HIGH-16: Entity detail panel links to wrong page
- **File**: `src/components/ingestion/entity-detail-panel.tsx:87-89`
- **Impact**: "View all locations" link routes to `/world/${worldId}/settings` instead of `/world/${worldId}/locations`.

### HIGH-17: Ingestion AI failure is silent
- **File**: `src/lib/ingestion/pipeline.ts:57, 70`
- **Impact**: If Claude API key is not set, `analyzeEntities` throws silently (caught), ingestion returns 0 entities with no indication that AI analysis was skipped.

### HIGH-18: Ingestion does not persist source records
- Overlaps with CRIT-6 but also affects the relationship between ingested files and extracted entities.

---

## Medium Severity Bugs (33)

### Entity CRUD (applies to 7 entities)

| # | Bug | Affected Entities | File Pattern |
|---|-----|-------------------|--------------|
| MED-1 | No delete confirmation dialog | Locations, Factions, Objects, Themes, Events, Scenes, Arcs | `*/page.tsx` delete handler |
| MED-2 | No toast feedback on delete | Locations, Factions, Objects, Themes, Events, Scenes, Arcs | `*/page.tsx` delete handler |

### Entity-Specific

| # | Bug | File | Details |
|---|-----|------|---------|
| MED-3 | Characters: `traits` cast as `string[]` but schema is `Json` | `characters/page.tsx:461` | Bad graph data if non-string values |
| MED-4 | Relationships: card shows raw character IDs | `relationships/page.tsx:257` | Should use `relationship.character1.name` |
| MED-5 | Relationships: intensity default produces NaN | `relationships/page.tsx:110` | `undefined * 10` is NaN, `??` doesn't catch NaN |
| MED-6 | Events: no location picker in form | `events/page.tsx` | `locationId` accepted by API but no UI |
| MED-7 | Scenes: edit form missing most schema fields | `scenes/page.tsx` | Missing `content`, `polarity`, `position`, FK assignments |
| MED-8 | Arcs: no phase management UI | `arcs/page.tsx` | API supports CRUD for phases but no UI |

### Auth & Onboarding

| # | Bug | File | Details |
|---|-----|------|---------|
| MED-9 | Middleware doesn't redirect unauthenticated users | `middleware.ts:1-5` | No `authorized` callback; 401 errors instead of redirect |
| MED-10 | No AUTH_SECRET in NextAuth config | `src/lib/auth/index.ts` | v5 uses `AUTH_SECRET` not `NEXTAUTH_SECRET` |
| MED-11 | Wizard has no "Back" button in steps 2-3 | `quickstart-wizard.tsx:220-327` | Can't fix typos after progressing |
| MED-12 | Wizard stale error display across steps | `quickstart-wizard.tsx:103-105` | React Query mutation errors persist |
| MED-13 | Wizard hooks initialized with empty worldId | `quickstart-wizard.tsx:49-50` | Fragile design, mutation URL is `/api/worlds//characters` |
| MED-14 | Edit world button is a no-op (TODO) | `worlds/page.tsx:179-185` | Only `e.preventDefault()` with TODO comment |
| MED-15 | World delete has no error handling or undo | `worlds/page.tsx:192` | No `onError` callback, no undo |
| MED-16 | Create world dialog shows no error on failure | `worlds/page.tsx:226-283` | No error display element |

### Beats & Treatment

| # | Bug | File | Details |
|---|-----|------|---------|
| MED-17 | Beat form edit resets status to 'todo' | `beat-form-dialog.tsx:89-97` | `status: defaultStatus` always sent, overwriting current |

### Navigation & Commands

| # | Bug | File | Details |
|---|-----|------|---------|
| MED-18 | Settings route ambiguity | `sidebar.tsx:15` vs `navigation-config.ts:103` | Top-level `/settings` vs world `/world/{id}/settings` |
| MED-19 | Command palette "Create Scene/Relationship/Event" navigates to 404 | `command-actions.ts:116-121` | These pages have no routes |
| MED-20 | Keyboard shortcuts help dialog not connected to actual bindings | `keyboard-shortcuts.ts:12-25` | Help dialog is just a reference card; actual bindings are scattered |
| MED-21 | `Esc` shortcut documented but no central handler | `keyboard-shortcuts.ts:17` | Each dialog handles its own Escape |
| MED-22 | Chord `g` key doesn't suppress in edge cases | `shortcut-provider.tsx:88-91` | No `preventDefault()` on chord start |

### Sources & Ingestion

| # | Bug | File | Details |
|---|-----|------|---------|
| MED-23 | Zero entities: no user feedback, silent reset | `ingestion-flow.tsx:48-49` | UI resets to upload state with no explanation |
| MED-24 | Entity detail panel missing links for events/items/factions | `entity-detail-panel.tsx:83-89` | Only character and location get "View all" |
| MED-25 | Fountain parser missing scene heading prefixes | `parsers.ts:148` | Missing `INT/EXT.` and `EST.` |
| MED-26 | Section headings discarded before AI analysis | `pipeline.ts:56` | Joins content without headers, reducing extraction quality |

### Cross-Cutting

| # | Bug | File | Details |
|---|-----|------|---------|
| MED-27 | No pagination on any entity list | All `*-queries.ts` | Returns ALL records with no `skip`/`take` |
| MED-28 | No search/filter on any entity page | All entity pages | No filtering, sorting, or search UI |

---

## Low Severity Bugs (23)

| # | Bug | File |
|---|-----|------|
| LOW-1 | `getSessionUser` uses non-null assertions on nullable fields | `auth/helpers.ts:17-18` |
| LOW-2 | Register doesn't trim name input | `register/page.tsx:45` |
| LOW-3 | No password strength indicator or maxlength | `register/page.tsx:99-107` |
| LOW-4 | Onboarding state is per-browser, not per-user | `onboarding-store.ts:17-32` |
| LOW-5 | Survey responses never sent to server | `signup-survey.tsx:33` |
| LOW-6 | World card dropdown can interfere with Link navigation | `worlds/page.tsx:155-199` |
| LOW-7 | `useDeleteWorld` type expects wrong response shape | `use-worlds.ts:42-45` |
| LOW-8 | World update accepts unsanitized body | `worlds/[id]/route.ts:34-36` |
| LOW-9 | Character `goals`/`traits` JSON fields have no UI | `characters/page.tsx` |
| LOW-10 | Location `coordinates`/`properties` JSON fields have no UI | `locations/page.tsx` |
| LOW-11 | Faction `resources` and member management have no UI | `factions/page.tsx` |
| LOW-12 | Object `properties` JSON field has no UI | `objects/page.tsx` |
| LOW-13 | Theme motif linking has no UI | `themes/page.tsx` |
| LOW-14 | Event participant management has no UI | `events/page.tsx` |
| LOW-15 | Scene polarity displayed but not editable | `scenes/page.tsx:289` |
| LOW-16 | Relationship temporal scoping fields have no UI | `relationships/page.tsx` |
| LOW-17 | Sidebar collapsed icon navigation always goes to first group view | `workspace-sidebar.tsx:65` |
| LOW-18 | Breadcrumb fails on unregistered deep paths | `world-nav.tsx:13-15` |
| LOW-19 | Command palette has no "recent items" feature | `command-palette.tsx` |
| LOW-20 | Command palette shortcut column always empty | `command-actions.ts:39` |
| LOW-21 | Keyboard shortcuts `Editor` category is empty/dead code | `keyboard-shortcuts.ts:38` |
| LOW-22 | Simulated progress bar on upload | `upload-dropzone.tsx:116-124` |
| LOW-23 | No inspector panel component rendered for any entity | All entity pages |

---

## Feature Status Matrix

### Core Features (Tier 1 MVP)

| Feature | Status | Notes |
|---------|--------|-------|
| Login | PARTIAL | Works but no try/catch on network errors |
| Register | PARTIAL | Works but missing input sanitization |
| Sign-out | BROKEN | Button has no handler (CRIT-1) |
| Onboarding Survey | PARTIAL | Accepts incomplete data |
| Onboarding Wizard | PARTIAL | No back button, stale errors |
| World Create | PARTIAL | No error display on failure |
| World List | WORKS | Loading, empty state, cards all correct |
| World Edit | BROKEN | Button is a TODO no-op |
| World Delete | PARTIAL | No confirmation dialog |
| Beat Board (view) | WORKS | Cards, kanban columns, star ratings, filtering |
| Beat Create | WORKS | Form and POST API work |
| Beat Edit | BROKEN | API route missing (404) |
| Beat Delete | BROKEN | API route missing (404) |
| Beat Drag-Drop Reorder | BROKEN | API route missing (404) |
| Treatment View | BROKEN | Act grouping uses ghost fields; override save 404s |
| Treatment Export | WORKS | PDF/text export functional |
| Writing Surface (editor UI) | WORKS | TipTap renders, modes work |
| Writing Surface (load content) | BROKEN | Schema mismatch (CRIT-2) |
| Writing Surface (save content) | BROKEN | Auto-save discards data (CRIT-3) |
| Sources List | BROKEN | API endpoint missing (CRIT-4) |
| Source Upload/Ingest | PARTIAL | Upload works but records not persisted |
| Source Edit/Delete | BROKEN | API handlers missing (CRIT-5) |

### Entity CRUD Pages

| Entity | Create | List | Edit | Delete |
|--------|--------|------|------|--------|
| Characters | WORKS | WORKS | WORKS | WORKS |
| Locations | PARTIAL (raw CUID parent) | WORKS | PARTIAL | NO CONFIRM |
| Factions | WORKS | WORKS | WORKS | NO CONFIRM |
| Objects | WORKS | WORKS | WORKS | NO CONFIRM |
| Themes | WORKS | WORKS | WORKS | NO CONFIRM |
| Events | PARTIAL (no location picker) | WORKS | PARTIAL | NO CONFIRM |
| Scenes | PARTIAL (missing fields) | WORKS | PARTIAL | NO CONFIRM |
| Relationships | BROKEN (raw CUIDs) | WORKS | PARTIAL | WORKS |
| Arcs | PARTIAL (raw CUID char) | WORKS | WORKS | NO CONFIRM |

### Navigation & UX

| Feature | Status | Notes |
|---------|--------|-------|
| Sidebar Navigation | PARTIAL | Works but no mobile responsiveness |
| Workspace Sidebar | WORKS | Collapse/expand, section toggles, persist |
| Command Palette (Cmd+K) | PARTIAL | Opens, searches, navigates; some 404 targets |
| Keyboard Shortcuts | PARTIAL | G+chord works; help dialog is reference-only |
| Breadcrumbs | WORKS | Correct for registered paths |

---

## Recommended Fix Priority

### P0 - Ship Blockers (fix before any demo)
1. **CRIT-1**: Add `signOut()` call to logout button
2. **CRIT-2 + CRIT-3**: Fix Manuscript content architecture (add `content` field or route through ManuscriptSection)
3. **HIGH-6/7/8**: Create beat CRUD and reorder API routes
4. **CRIT-4 + CRIT-5 + CRIT-6**: Create sources list/create API route, add PATCH/DELETE handlers, persist SourceMaterial on ingest

### P1 - Usability Blockers
5. **CRIT-7 + HIGH-11 + HIGH-12**: Replace raw CUID inputs with entity dropdowns (relationships, locations, arcs)
6. **HIGH-3 + MED-1**: Add delete confirmation dialogs across all entities
7. **HIGH-4 + MED-16**: Add error display for create/delete mutations
8. **HIGH-9**: Fix treatment act grouping (join through Scene or remove act headers)
9. **MED-17**: Fix beat form edit status reset

### P2 - Quality & Polish
10. **HIGH-1**: Add try/catch to all API route handlers
11. **HIGH-15**: Align client/server accepted file formats
12. **MED-9 + MED-10**: Fix auth middleware redirect and AUTH_SECRET
13. **MED-27 + MED-28**: Add pagination and basic search/filter to entity pages
14. **HIGH-13**: Add mobile responsive sidebar

---

## Test Coverage Notes

- **No automated tests exist** for any of the features audited
- All testing was static code analysis (reading handlers, tracing data flow, checking type alignment)
- Runtime testing recommended after P0 fixes are applied
- E2E test suite (Playwright) scaffolded but contains no test cases

---

*Generated by QA Audit v2 - 4 parallel Opus 4.6 testers, 2026-03-29*
