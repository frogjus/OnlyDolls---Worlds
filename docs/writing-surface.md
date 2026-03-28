# Writing Surface Architecture

## 1. Overview

The Writing Surface is StoryForge's integrated manuscript and script editor. It serves as the central connective tissue between the beat sheet, story world entities, analysis tools, and export pipeline. Every other feature in StoryForge either feeds into or reads from the writing surface.

### Design Philosophy

The writing surface is not trying to replace Scrivener (15+ years of polish) or Final Draft (industry-standard screenplay formatting). Writers are extremely particular about their editing environment, and competing head-to-head with dedicated writing tools is a losing proposition. Instead, the writing surface needs to be "good enough" that writers do not need to leave StoryForge to do their work, while providing integration capabilities that no standalone editor can match:

- **Beat-to-script navigation**: click a beat card, land in the corresponding script section
- **Entity highlighting**: characters, locations, and objects recognized inline with click-to-detail
- **AI assist wand**: opt-in generation from beat context, presented as suggestions for review
- **Treatment sync**: beat reordering automatically updates the treatment document
- **World-aware editing**: the editor knows the story world and can surface relevant context

For writers who prefer Final Draft or other tools, import/export to `.fountain` and `.fdx` ensures StoryForge never becomes a lock-in.

### Open-Source Foundations

The editor builds on two proven TipTap-based open-source projects:

- **Novel** (16K stars, Apache 2.0) -- a Notion-style WYSIWYG editor built on TipTap with slash commands, bubble menus, and AI completion patterns. Provides the foundation for the prose editing experience and the AI suggestion UX.
- **minimal-tiptap** (1.8K stars, MIT) -- a minimal, well-structured TipTap wrapper with clean component architecture. Provides reference patterns for toolbar layout, extension configuration, and shadcn/ui integration.

For screenplay parsing and interchange:

- **Fountain.js** (268 stars, MIT) -- parses `.fountain` markup into structured tokens (scene headings, action, dialogue, parentheticals, transitions). Used for import and as the canonical screenplay interchange format.
- **betterfountain** (426 stars, MIT) -- extends Fountain with PDF export, character extraction, and richer scene metadata. Used for export and for extracting character lists from imported screenplays.

### File Locations

```
src/
  components/
    editors/                    # All writing surface components
      writing-surface.tsx       # Main editor wrapper (mode switching, layout)
      prose-editor.tsx          # Prose mode configuration
      screenplay-editor.tsx     # Screenplay mode configuration
      editor-toolbar.tsx        # Shared toolbar with mode-specific sections
      entity-highlight.tsx      # Inline entity highlighting popover
      focus-mode.tsx            # Distraction-free overlay
      split-view.tsx            # Resizable split panel container
      word-count-tracker.tsx    # Progress bar and target display
      ai-wand-panel.tsx         # AI suggestion review panel
    story-sidebar/              # Persistent sidebar alongside editor
      story-sidebar.tsx         # Sidebar container
      synopsis-field.tsx        # Synopsis input (gates AI features)
      world-summary.tsx         # Character/location/event counts
      character-quick-list.tsx  # Searchable character list
      scene-metadata.tsx        # Goal, conflict, outcome, value change
    treatment/                  # Treatment auto-generation
      treatment-view.tsx        # Read/edit treatment document
      treatment-export.tsx      # PDF, DOCX, plain text export
  lib/
    editor/                     # Editor business logic (not in components)
      extensions/               # Custom TipTap extensions
        screenplay-node.ts      # Scene heading, action, dialogue, etc.
        entity-mark.ts          # Entity highlighting marks
        beat-marker.ts          # Beat boundary decorations
        word-target.ts          # Per-section word count targets
      fountain-adapter.ts       # Fountain.js / betterfountain integration
      fdx-adapter.ts            # Final Draft XML import/export
      auto-save.ts              # Debounced persistence
      document-structure.ts     # Manuscript -> chapter -> scene hierarchy
      screenplay-cycling.ts     # Tab/Enter element type cycling logic
    ai/
      wand.ts                   # AI wand orchestration (synopsis check, context assembly, review flow)
  stores/
    editor-store.ts             # Zustand store for editor state
    treatment-store.ts          # Zustand store for treatment state
  types/
    editor.ts                   # TypeScript types for editor domain
```

---

## 2. Editor Architecture

### TipTap Setup

TipTap is a headless, framework-agnostic rich text editor built on ProseMirror. It provides the document model, transaction system, and extension API. StoryForge configures TipTap with a specific set of extensions for each editing mode.

#### Shared Extensions (Both Modes)

```typescript
// src/lib/editor/extensions/shared-extensions.ts
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { EntityMark } from './entity-mark';
import { BeatMarker } from './beat-marker';
import { WordTarget } from './word-target';

export function createSharedExtensions(options: {
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  user: CollaborationUser;
  wordLimit?: number;
}) {
  return [
    StarterKit.configure({
      history: false, // Disabled -- Yjs handles undo/redo via collaboration
    }),
    Collaboration.configure({
      document: options.ydoc,
    }),
    CollaborationCursor.configure({
      provider: options.provider,
      user: options.user,
    }),
    CharacterCount.configure({
      limit: options.wordLimit,
      mode: 'textSize',
    }),
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === 'heading') {
          return 'Chapter title...';
        }
        return 'Start writing, or press / for commands...';
      },
    }),
    Typography, // Smart quotes, em dashes, ellipsis
    Underline,
    Highlight.configure({ multicolor: true }),
    EntityMark,  // Custom: inline entity highlighting
    BeatMarker,  // Custom: beat boundary decorations
    WordTarget,  // Custom: per-section word count tracking
  ];
}
```

#### Prose Mode Extensions

```typescript
// src/lib/editor/extensions/prose-extensions.ts
import { createSharedExtensions } from './shared-extensions';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import TextAlign from '@tiptap/extension-text-align';
import { ChapterNode } from './chapter-node';
import { SceneNode } from './scene-node';

export function createProseExtensions(options: SharedExtensionOptions) {
  return [
    ...createSharedExtensions(options),
    Image,
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    TaskList,
    TaskItem.configure({ nested: true }),
    Superscript,
    Subscript,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    ChapterNode, // Custom: chapter container with title, word count target
    SceneNode,   // Custom: scene container with metadata (goal, conflict, outcome)
  ];
}
```

#### Screenplay Mode Extensions

```typescript
// src/lib/editor/extensions/screenplay-extensions.ts
import { createSharedExtensions } from './shared-extensions';
import {
  SceneHeading,
  Action,
  CharacterCue,
  Dialogue,
  Parenthetical,
  Transition,
  DualDialogue,
  TitlePage,
  SceneNumber,
} from './screenplay-node';
import { ScreenplayCycling } from './screenplay-cycling';
import { EpisodeNode } from './episode-node';
import { ActNode } from './act-node';

export function createScreenplayExtensions(options: SharedExtensionOptions) {
  return [
    ...createSharedExtensions(options),
    SceneHeading,     // INT./EXT. sluglines, uppercase, full-width
    Action,           // Action paragraphs, standard width
    CharacterCue,     // Character name, centered, uppercase
    Dialogue,         // Dialogue block, centered, indented
    Parenthetical,    // Parenthetical, centered, narrower
    Transition,       // FADE IN, CUT TO, etc., right-aligned, uppercase
    DualDialogue,     // Side-by-side dialogue columns
    TitlePage,        // Title page metadata block
    SceneNumber,      // Scene number annotations (for shooting scripts)
    ScreenplayCycling, // Custom: Tab/Enter element type cycling
    EpisodeNode,      // Custom: TV mode episode container
    ActNode,          // Custom: Act container (Film: 1/2/3, TV: nested in episode)
  ];
}
```

#### Schema Definition

The TipTap/ProseMirror schema defines two distinct document structures depending on the editing mode.

**Prose Mode Document Structure:**

```
doc
  chapter (attrs: title, wordTarget, collapsed)
    heading (level 1 -- chapter title)
    scene (attrs: goal, conflict, outcome, valueChange, beatId)
      heading (level 2 -- scene title)
      paragraph | blockquote | bulletList | orderedList | table | image | taskList
```

**Screenplay Mode Document Structure:**

```
doc
  titlePage (attrs: title, author, contact, draftDate, copyright)
  act (attrs: number, label)
    sceneHeading (attrs: intExt, location, timeOfDay, sceneNumber, beatId)
    action
    characterCue (attrs: characterId, extension)
    parenthetical
    dialogue
    dualDialogue
      dialogueColumn (left)
      dialogueColumn (right)
    transition
```

**TV Mode extends Screenplay Mode:**

```
doc
  titlePage
  season (attrs: number)
    episode (attrs: number, title, airDate)
      act (attrs: number, label)
        sceneHeading
        action | characterCue | dialogue | parenthetical | transition | dualDialogue
```

### Prose Mode

The prose editor provides a clean, distraction-minimal writing environment for novels, short stories, and longform narrative.

**Rich text editing**: headings (H1-H6), bold, italic, underline, strikethrough, blockquote, bullet lists, ordered lists, task lists, tables, images, superscript, subscript, text alignment. All formatting accessible via toolbar, keyboard shortcuts, and slash commands.

**Chapter/scene structural hierarchy**: the document is organized as a tree of chapters containing scenes. Each chapter node is collapsible in the sidebar navigation. Each scene node carries metadata fields (goal, conflict, outcome, value change) accessible via a popover when the scene heading is clicked. Chapters and scenes can be reordered via drag-and-drop in the navigation panel.

**Focus/distraction-free mode**: activated via toolbar button or keyboard shortcut, this mode hides all chrome (sidebar, toolbar, status bar, navigation) and centers the editor content in a narrow column with increased font size and line height. A subtle fade gradient at top and bottom. Mouse movement to screen edges reveals controls temporarily. Escape exits focus mode.

**Word count targets and progress tracking**: targets can be set at the document, chapter, or scene level. A progress bar in the status bar shows current count vs. target. Color coding: green (on track), yellow (80-100%), red (over target). Daily session word count tracked separately. The `WordTarget` extension decorates each section heading with a small progress indicator.

**Auto-save with debounce**: every edit triggers a 2-second debounce timer. When the timer fires, the current document state is persisted via API. A status indicator in the toolbar shows save state (saved, saving, unsaved changes, error). The Yjs collaboration layer handles real-time sync; auto-save persists the canonical server state.

**Version history (snapshots)**: manual snapshots via Cmd+Shift+S or toolbar button. Automatic snapshots taken every 30 minutes of active editing and before any AI wand operation. Snapshot list accessible via sidebar panel. Click any snapshot to view a diff against current state. Restore any snapshot (creates a new snapshot of current state first, so nothing is lost).

### Screenplay Mode

The screenplay editor auto-formats content according to industry-standard screenplay conventions. The goal is not to replicate Final Draft's 25 years of formatting polish, but to provide comfortable screenplay writing that stays connected to the story world.

**Auto-formatting for screenplay elements:**

| Element | Formatting | Width | Alignment |
|---|---|---|---|
| Scene Heading | UPPERCASE, bold | Full width (6") | Left |
| Action | Normal case | Full width (6") | Left |
| Character Cue | UPPERCASE | 3.5", offset 2.5" from left | Center-left |
| Dialogue | Normal case | 3.5", offset 1.5" from left | Left (within column) |
| Parenthetical | Normal case, wrapped in () | 2.5", offset 2" from left | Left (within column) |
| Transition | UPPERCASE | Full width | Right |
| Dual Dialogue | Two dialogue columns side by side | 2.75" each | Left (within columns) |

These formatting rules are applied via CSS classes on the TipTap node types, not by inserting whitespace characters. The underlying document is semantic (node types carry meaning), and formatting is purely visual. This ensures clean export to `.fountain` and `.fdx` formats.

**Tab/Enter element type cycling**: this is the core interaction pattern that makes screenplay writing feel natural, modeled on Final Draft's behavior.

```typescript
// src/lib/editor/extensions/screenplay-cycling.ts
//
// Element cycling rules:
//
// From Scene Heading:
//   Enter -> Action
//   Tab   -> (no cycle, stay on Scene Heading)
//
// From Action:
//   Enter -> Action (new paragraph)
//   Tab   -> Character Cue
//
// From Character Cue:
//   Enter -> Dialogue
//   Tab   -> Scene Heading
//
// From Dialogue:
//   Enter -> Character Cue
//   Tab   -> Parenthetical
//
// From Parenthetical:
//   Enter -> Dialogue (resume after parenthetical)
//   Tab   -> Action
//
// From Transition:
//   Enter -> Scene Heading
//   Tab   -> Action
//
// Special cases:
//   Enter on empty Action line -> Scene Heading
//   Enter on empty Dialogue line -> Action
//   Typing "INT." or "EXT." at start of Action -> auto-converts to Scene Heading
//   Typing "FADE IN:" or "CUT TO:" at start of Action -> auto-converts to Transition
//   All-caps text in Action -> prompt to convert to Character Cue

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

interface CycleRule {
  onEnter: string;       // Node type to create on Enter
  onTab: string;         // Node type to create on Tab
  onEnterEmpty?: string; // Node type when Enter is pressed on empty content
}

const CYCLE_RULES: Record<string, CycleRule> = {
  sceneHeading:   { onEnter: 'action',       onTab: 'sceneHeading' },
  action:         { onEnter: 'action',        onTab: 'characterCue', onEnterEmpty: 'sceneHeading' },
  characterCue:   { onEnter: 'dialogue',      onTab: 'sceneHeading' },
  dialogue:       { onEnter: 'characterCue',  onTab: 'parenthetical', onEnterEmpty: 'action' },
  parenthetical:  { onEnter: 'dialogue',      onTab: 'action' },
  transition:     { onEnter: 'sceneHeading',  onTab: 'action' },
};

export const ScreenplayCycling = Extension.create({
  name: 'screenplayCycling',

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { $from } = editor.state.selection;
        const currentNode = $from.parent;
        const rule = CYCLE_RULES[currentNode.type.name];
        if (!rule) return false;

        const isEmpty = currentNode.textContent.trim() === '';
        const targetType = isEmpty && rule.onEnterEmpty
          ? rule.onEnterEmpty
          : rule.onEnter;

        // Insert new node of target type after current node
        return editor.chain()
          .splitBlock()
          .setNode(targetType)
          .run();
      },

      Tab: ({ editor }) => {
        const { $from } = editor.state.selection;
        const currentNode = $from.parent;
        const rule = CYCLE_RULES[currentNode.type.name];
        if (!rule) return false;

        // Convert current node to target type
        return editor.chain()
          .setNode(rule.onTab)
          .run();
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('screenplayAutoDetect'),
        // Auto-detect scene headings and transitions from typed text
        // See implementation notes in section below
      }),
    ];
  },
});
```

**Auto-detection rules** (implemented in the ProseMirror plugin above):

- Text starting with `INT.` or `EXT.` or `INT./EXT.` in an Action node: prompt to convert to Scene Heading (small tooltip, not auto-convert, to avoid false positives).
- Text matching `FADE IN:`, `FADE OUT.`, `CUT TO:`, `SMASH CUT TO:`, `DISSOLVE TO:` in an Action node: auto-convert to Transition.
- All-caps text longer than 2 characters typed in an Action node on its own line: prompt to convert to Character Cue.

**Fountain format awareness**: the editor can parse `.fountain` files on import and render them as the appropriate node types. The Fountain markup rules (lines starting with `.` force scene headings, `@` forces character cues, `!` forces action, `~` for lyrics, etc.) are handled by the import adapter, not by the editor schema itself. The editor operates on semantic node types, not markup.

**Fountain.js and betterfountain integration:**

```typescript
// src/lib/editor/fountain-adapter.ts

import fountain from 'fountain-js';

export interface FountainImportResult {
  titlePage: TitlePageData | null;
  tokens: FountainToken[];
  characters: string[];  // Extracted character names
}

export function parseFountainToEditorNodes(
  fountainText: string
): FountainImportResult {
  const parsed = fountain.parse(fountainText);

  // Map fountain token types to TipTap node types:
  //   'scene_heading'  -> sceneHeading
  //   'action'         -> action
  //   'character'      -> characterCue
  //   'dialogue'       -> dialogue
  //   'parenthetical'  -> parenthetical
  //   'transition'     -> transition
  //   'dual_dialogue'  -> dualDialogue
  //   'title_page'     -> titlePage metadata

  const characters = extractCharacterNames(parsed.tokens);
  return {
    titlePage: parsed.title_page ? mapTitlePage(parsed.title_page) : null,
    tokens: parsed.tokens,
    characters,
  };
}

export function exportEditorToFountain(
  doc: ProseMirrorNode
): string {
  // Walk the ProseMirror document tree and emit Fountain markup.
  // Scene headings: uppercase, optionally prefixed with '.'
  // Characters: uppercase
  // Dialogue: indented under character
  // Parentheticals: wrapped in ()
  // Transitions: uppercase, ends with ':'
  // Title page: key: value pairs at top of document

  const lines: string[] = [];
  doc.descendants((node) => {
    switch (node.type.name) {
      case 'sceneHeading':
        lines.push('', node.textContent.toUpperCase(), '');
        break;
      case 'action':
        lines.push(node.textContent);
        break;
      case 'characterCue':
        lines.push('', node.textContent.toUpperCase());
        break;
      case 'dialogue':
        lines.push(node.textContent);
        break;
      case 'parenthetical':
        lines.push(`(${node.textContent})`);
        break;
      case 'transition':
        lines.push('', `> ${node.textContent.toUpperCase()}`, '');
        break;
    }
  });
  return lines.join('\n');
}
```

**Final Draft XML (.fdx) import/export**: Final Draft uses an XML-based format. The `fdx-adapter.ts` module parses `.fdx` files using a streaming XML parser and maps the `<Paragraph Type="...">` elements to TipTap node types. FDX paragraph types map as follows:

| FDX Paragraph Type | TipTap Node Type |
|---|---|
| `Scene Heading` | `sceneHeading` |
| `Action` | `action` |
| `Character` | `characterCue` |
| `Dialogue` | `dialogue` |
| `Parenthetical` | `parenthetical` |
| `Transition` | `transition` |
| `General` | `action` (fallback) |

Export reverses the mapping, wrapping content in FDX XML structure with appropriate `<Paragraph>`, `<Text>`, and `<Content>` elements.

### TV Mode vs Film Mode

The writing surface adapts its structural hierarchy based on the story world's mode setting, configured in world settings.

**Film mode**: the document hierarchy is `Document > Act (1, 2, 3) > Scenes`. Acts are top-level structural containers. The navigation sidebar shows acts as collapsible sections containing their scenes. Standard three-act structure by default, but users can add or remove acts.

**TV mode**: the document hierarchy is `Document > Season > Episode > Act > Scenes`. Seasons and episodes appear in the navigation sidebar as a nested tree. Each episode is essentially its own screenplay document within the larger series container. Episode metadata includes episode number, title, air date, and per-episode synopsis.

The mode selector lives in world settings (`src/app/(dashboard)/world/[id]/settings/`), not in the editor itself, because it affects the entire world's organizational structure. Changing modes triggers a migration dialog that helps the user reorganize existing content into the new hierarchy.

```typescript
// src/types/editor.ts

export type StoryMode = 'film' | 'tv';

export interface FilmStructure {
  mode: 'film';
  acts: Act[];
}

export interface TVStructure {
  mode: 'tv';
  seasons: Season[];
}

export interface Season {
  id: string;
  number: number;
  title?: string;
  episodes: Episode[];
}

export interface Episode {
  id: string;
  number: number;
  title: string;
  synopsis?: string;
  airDate?: string;
  acts: Act[];
}

export interface Act {
  id: string;
  number: number;
  label: string; // "Act 1", "Teaser", "Tag", etc.
  scenes: SceneRef[];
}

export interface SceneRef {
  id: string;
  sceneHeadingId: string; // Links to the sceneHeading node in the TipTap doc
  beatId?: string;        // Links to a beat card
}
```

---

## 3. Entity Highlighting

Entity highlighting is one of the writing surface's key differentiators. As the user writes, recognized story world entities (characters, locations, objects) are highlighted inline, connecting the prose to the structured knowledge graph.

### Entity Mark Extension

```typescript
// src/lib/editor/extensions/entity-mark.ts

import { Mark, mergeAttributes } from '@tiptap/core';

export interface EntityMarkAttrs {
  entityId: string;
  entityType: 'character' | 'location' | 'object' | 'faction' | 'event';
  displayName: string;
  confirmed: boolean; // true = user-confirmed, false = AI-proposed
}

export const EntityMark = Mark.create({
  name: 'entityMark',
  priority: 1000,
  inclusive: false, // Do not extend mark when typing at boundaries

  addAttributes() {
    return {
      entityId: { default: null },
      entityType: { default: 'character' },
      displayName: { default: '' },
      confirmed: { default: false },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-entity-id]',
        getAttrs: (el) => ({
          entityId: (el as HTMLElement).getAttribute('data-entity-id'),
          entityType: (el as HTMLElement).getAttribute('data-entity-type'),
          displayName: (el as HTMLElement).getAttribute('data-entity-name'),
          confirmed: (el as HTMLElement).getAttribute('data-entity-confirmed') === 'true',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-entity-id': HTMLAttributes.entityId,
        'data-entity-type': HTMLAttributes.entityType,
        'data-entity-name': HTMLAttributes.displayName,
        'data-entity-confirmed': String(HTMLAttributes.confirmed),
        class: `entity-highlight entity-${HTMLAttributes.entityType} ${
          HTMLAttributes.confirmed ? 'entity-confirmed' : 'entity-proposed'
        }`,
      }),
      0,
    ];
  },
});
```

### Visual Styling

Each entity type has a distinct visual treatment to be instantly recognizable without being distracting during writing:

```css
/* Entity highlight colors -- subtle underline + background on hover */
.entity-highlight {
  border-bottom: 1.5px solid transparent;
  cursor: pointer;
  transition: background-color 150ms ease;
}

.entity-highlight:hover {
  border-radius: 2px;
}

.entity-character {
  border-bottom-color: hsl(var(--blue-400));
}
.entity-character:hover {
  background-color: hsl(var(--blue-50));
}

.entity-location {
  border-bottom-color: hsl(var(--green-400));
}
.entity-location:hover {
  background-color: hsl(var(--green-50));
}

.entity-object {
  border-bottom-color: hsl(var(--amber-400));
}
.entity-object:hover {
  background-color: hsl(var(--amber-50));
}

.entity-faction {
  border-bottom-color: hsl(var(--purple-400));
}
.entity-faction:hover {
  background-color: hsl(var(--purple-50));
}

.entity-event {
  border-bottom-color: hsl(var(--red-400));
}
.entity-event:hover {
  background-color: hsl(var(--red-50));
}

/* AI-proposed (unconfirmed) entities: dashed underline */
.entity-proposed {
  border-bottom-style: dashed;
  opacity: 0.75;
}

.entity-confirmed {
  border-bottom-style: solid;
}
```

### Click Interaction

Clicking a highlighted entity opens a popover (using shadcn/ui `Popover` component) anchored to the highlighted text. The popover displays:

- Entity name and type icon
- Brief summary (first 2 lines of description)
- Key relationships (top 3 connections)
- "View full profile" link (navigates to entity detail page)
- "Unlink" button (removes the entity mark from this text span)
- For proposed (unconfirmed) entities: "Confirm" and "Dismiss" buttons

### Auto-Detection

Entity auto-detection runs as a debounced background process, not on every keystroke.

**Trigger**: after the user stops typing for 3 seconds, or on document save.

**Process**:
1. Collect all entity names and aliases from the current story world (cached in the Zustand store, refreshed on world load and entity changes).
2. Perform case-insensitive substring matching against the current paragraph's text content.
3. For matches against known entities, apply the `entityMark` with `confirmed: false` (proposed).
4. The user can confirm (click "Confirm" in popover) or dismiss (click "Dismiss").
5. Confirmed marks persist across edits. Proposed marks are re-evaluated on each detection pass.

**Performance guard**: detection runs only on the currently visible paragraphs (intersection observer), not the entire document. For large documents, this prevents lag.

### Manual Linking

The user can select any text span and manually link it to an entity:
1. Select text.
2. Click "Link Entity" in the bubble menu or press Cmd+Shift+E.
3. A search dialog opens, showing entities from the story world filtered by the selected text.
4. User selects an entity. The text is wrapped in an `entityMark` with `confirmed: true`.

---

## 4. Story Sidebar Integration

The Story Sidebar is a persistent panel on the left side of the writing surface. It provides world context and quick access to metadata without leaving the editor.

### Layout

```
+------------------+------------------------------------------+
|  Story Sidebar   |           Writing Surface                |
|  (280px fixed)   |           (flex-grow)                    |
|                  |                                          |
|  [Synopsis]      |                                          |
|  [World Stats]   |                                          |
|  [Characters]    |                                          |
|  [Scene Meta]    |                                          |
|  [Navigation]    |                                          |
|                  |                                          |
+------------------+------------------------------------------+
```

The sidebar is collapsible (Cmd+\) to give full width to the editor. Its collapsed state persists in the editor Zustand store.

### Sections

**Synopsis Field**: a multi-line text input at the top of the sidebar. This is the single most important field in StoryForge -- it gates all AI features. If the synopsis is empty, the AI Wand is disabled with a tooltip explaining "Add a synopsis to enable AI assist." The synopsis provides the core context that the Claude API uses for entity extraction, beat generation, and script drafting. Length guidance: 1-3 paragraphs (a long logline to a short treatment).

**World Summary**: read-only stats panel showing counts for the current world:
- Characters (with breakdown: main, supporting, minor)
- Locations
- Events
- Scenes written / total beats
- Word count (manuscript total)
- Last edited timestamp

**Character Quick-List**: a searchable, scrollable list of all characters in the world. Each entry shows the character name, a role badge (protagonist, antagonist, supporting), and a color dot matching their entity highlight color. Clicking a character scrolls the sidebar to show their brief profile and highlights all their appearances in the currently visible editor content.

**Scene Metadata**: when the cursor is inside a scene, this section shows the current scene's structured fields (inspired by yWriter):
- **Goal**: what the POV character wants in this scene
- **Conflict**: what opposes them
- **Outcome**: how the scene resolves (success, failure, complication)
- **Value Change**: which value shifted and in what direction (McKee)
- **Beat link**: which beat card this scene corresponds to (clickable)
- **Characters present**: auto-detected from entity marks in the scene

All metadata fields are editable inline in the sidebar. Changes persist immediately via the same auto-save mechanism as the editor.

**Navigation**: a tree view of the document structure (chapters/scenes for prose, acts/scenes for screenplay, seasons/episodes/acts/scenes for TV). Clicking any node scrolls the editor to that section. The current section is highlighted. Nodes are collapsible. Drag-and-drop reordering of scenes within the navigation tree reorders them in the document.

### TypeScript Interfaces

```typescript
// src/types/editor.ts

export interface StorySidebarState {
  isCollapsed: boolean;
  activeSection: 'synopsis' | 'stats' | 'characters' | 'scene' | 'navigation';
}

export interface Synopsis {
  worldId: string;
  content: string;
  updatedAt: Date;
  isAIReady: boolean; // true when content.length >= 50 characters
}

export interface WorldSummary {
  characterCount: number;
  mainCharacters: number;
  supportingCharacters: number;
  minorCharacters: number;
  locationCount: number;
  eventCount: number;
  scenesWritten: number;
  totalBeats: number;
  wordCount: number;
  lastEdited: Date;
}

export interface SceneMetadata {
  sceneId: string;
  goal: string;
  conflict: string;
  outcome: 'success' | 'failure' | 'complication' | '';
  valueChange: ValueChangeEntry | null;
  beatId: string | null;
  charactersPresent: string[]; // Entity IDs auto-detected from entity marks
}

export interface ValueChangeEntry {
  valueName: string;   // e.g., "trust", "power", "freedom"
  direction: 'positive' | 'negative';
  magnitude: 1 | 2 | 3; // subtle, moderate, dramatic
}
```

---

## 5. Beat-to-Script Navigation

Beats and script sections are bidirectionally linked. This connection is what makes StoryForge's writing surface more than just a text editor.

### Data Model

Each beat card in the beat sheet has an optional `scriptSectionId` that references a location in the manuscript. Each scene/sceneHeading node in the TipTap document has an optional `beatId` attribute that references a beat card.

```typescript
// src/types/editor.ts

export interface BeatScriptLink {
  beatId: string;
  scriptNodeId: string; // The TipTap node ID (scene or sceneHeading)
  worldId: string;
  createdAt: Date;
  autoLinked: boolean;  // true if linked by position/title matching, false if manual
}
```

### Beat-to-Script (Forward Navigation)

When the user clicks a beat card in the beat sheet view:
1. Look up the `BeatScriptLink` for that beat.
2. If a link exists, navigate to the writing surface and scroll to the linked node. Briefly flash-highlight the section.
3. If no link exists, offer to create a new scene at the appropriate position in the manuscript (after the previously linked beat's section, or at the end).

### Script-to-Beat (Reverse Navigation)

In the editor, beat boundaries are shown as subtle horizontal markers between sections (via the `BeatMarker` decoration). Each marker shows the beat title in a small label. Clicking the marker opens the corresponding beat card in a slide-over panel (not a full page navigation, to avoid losing editor context).

A gutter indicator (small colored dot) appears next to each scene heading to indicate its beat link status:
- Green dot: linked to a beat
- No dot: unlinked (no corresponding beat)
- Amber dot: linked but the beat has been moved/reordered since last sync

### Unmatched Section Highlighting

Sections of the manuscript that have no corresponding beat are given a subtle left-border indicator (2px gray dashed line in the gutter). This visual cue helps writers identify content that exists outside their structural plan -- either new material that needs a beat, or orphaned content from a restructuring.

### Auto-Linking

When beats are first created from an existing manuscript (via the "Generate Beats from Manuscript" action), the system auto-links beats to script sections by matching:
1. Scene heading text similarity (fuzzy match on scene heading vs. beat title)
2. Sequential position (beats in order map to scenes in order)
3. Character overlap (beats mentioning the same characters as the scene)

Auto-linked connections are flagged with `autoLinked: true` and shown with a slightly different visual (lighter green dot) until the user confirms them.

---

## 6. AI Assist Wand

The AI Wand is the opt-in generative assist layer. Its design must thread a careful needle: useful enough to justify its existence, restrained enough not to alienate writers who are suspicious of AI-generated content.

### Prerequisites

The wand is disabled (grayed out, with tooltip) until:
1. The story world has a synopsis of at least 50 characters in the Story Sidebar.
2. The user has confirmed at least one entity (character, location, or event) in the world.

These prerequisites ensure the AI has enough context to generate useful suggestions and that the user has invested creative effort before AI assists.

### Wand Locations

| Location | Action | Context Assembled |
|---|---|---|
| Beat card (in beat sheet) | Generate/refine beat title + description | Synopsis + all existing beats (ordered) + character list |
| Editor toolbar | Generate draft script text for current scene | Synopsis + current beat description + character profiles for characters in scene + preceding 2 scene summaries + following 1 beat description |
| Synopsis field | Expand logline into full synopsis | Current synopsis text (logline) + world title + genre |

### Generation Flow

```
User clicks wand icon
    |
    v
[Check prerequisites] -- fail --> Show tooltip: "Add a synopsis to enable AI assist"
    |
    | pass
    v
[Assemble context] -- gather synopsis, beats, characters, scene text
    |
    v
[Call Claude API via src/lib/ai/wand.ts] -- never call API from component directly
    |
    v
[Suggestion appears in Review Panel] -- slides in from right, NOT inline
    |
    v
User reviews suggestion:
    |--- [Accept] --> Insert suggestion into editor/beat (as new content, marked as AI-assisted)
    |--- [Edit]   --> User modifies suggestion in review panel, then accepts
    |--- [Dismiss] --> Discard suggestion, close panel
    |--- [Regenerate] --> Call API again with same context + "try a different approach"
```

### Review Panel

The review panel is a slide-over panel from the right side of the editor. It never appears inline in the document because inline AI suggestions blur the line between human and AI writing, which is exactly what writers fear.

The panel contains:
- The generated suggestion text (formatted, not raw)
- A diff view showing what would change if accepted (for refinement operations)
- "Accept" button (primary action)
- "Edit" toggle (switches suggestion text to editable mode)
- "Dismiss" button (secondary action)
- "Regenerate" button (tertiary action)
- A disclaimer at the bottom: "This is a starting point, not your story. Review and revise to make it yours."

### Context Assembly

```typescript
// src/lib/ai/wand.ts

export interface WandContext {
  worldId: string;
  synopsis: string;
  generationType: 'beat' | 'script' | 'synopsis-expansion';

  // For beat generation
  beat?: {
    currentBeat: Beat | null;    // null for new beat generation
    precedingBeats: Beat[];       // ordered, up to 5 previous beats
    followingBeats: Beat[];       // ordered, up to 3 following beats
  };

  // For script generation
  script?: {
    beatDescription: string;
    characterProfiles: CharacterProfile[];  // Characters assigned to this beat/scene
    precedingSceneSummaries: string[];      // Summaries of 2 previous scenes
    followingBeatDescription: string | null;
    sceneMetadata: SceneMetadata;           // Goal, conflict, outcome if filled in
  };

  // For synopsis expansion
  expansion?: {
    logline: string;
    worldTitle: string;
    genre: string;
  };
}

export interface WandResult {
  suggestion: string;
  confidence: number;        // 0-1, how confident the AI is in this suggestion
  contextUsed: string[];     // Which context pieces were most influential
  generationType: WandContext['generationType'];
}

export async function generateWandSuggestion(
  context: WandContext
): Promise<WandResult> {
  // 1. Validate prerequisites (synopsis exists, etc.)
  // 2. Build prompt from context (see prompt templates below)
  // 3. Call Claude API via src/lib/ai/ abstraction
  // 4. Parse and format response
  // 5. Return WandResult

  // All AI calls go through the abstraction layer in src/lib/ai/
  // Never import Anthropic SDK directly in this module
  throw new Error('Not implemented');
}
```

### Prompt Strategy

The wand uses different prompt templates depending on the generation type. All prompts follow a pattern:

1. **System prompt**: establishes the AI as a story development assistant (not a co-author), instructs it to match the tone and style of existing content, and warns it never to contradict established facts.
2. **Context block**: the assembled world context, clearly structured with labels.
3. **Task instruction**: the specific generation request.
4. **Constraints**: length limits, style guidance, what not to do.

The key principle: **more existing content = better generation**. A wand suggestion for a story with 50 beats, 20 character profiles, and 100 pages of manuscript will be dramatically better than one with just a synopsis. The context window is used to its fullest.

### AI-Assisted Content Tracking

When the user accepts a wand suggestion, the inserted content is tagged with metadata:

```typescript
export interface AIAssistedContent {
  contentId: string;
  worldId: string;
  generationType: 'beat' | 'script' | 'synopsis-expansion';
  generatedAt: Date;
  acceptedAt: Date;
  editedAfterAcceptance: boolean;
  originalSuggestion: string; // Preserved even if user edits
}
```

This tracking serves two purposes:
1. The user can always see which content was AI-assisted (optional toggle in editor settings).
2. Analytics can show the ratio of AI-assisted vs. human-written content (visible only to the user, never shared).

---

## 7. Treatment Auto-Generation

The treatment is an auto-assembled outline/summary document built from the beat cards in their current order. It bridges the gap between the structural beat sheet and the prose manuscript.

### How It Works

```
Beat Sheet (source of truth for structure)
    |
    |  beats ordered by position
    v
Treatment Generator
    |
    |  assembles beat descriptions into narrative outline
    v
Treatment Document (read/edit view)
    |
    |  user can override sections
    v
Export (PDF, DOCX, plain text)
```

### Generation Rules

1. Each beat card contributes one section to the treatment, in beat order.
2. The section content is the beat's description field, formatted as a paragraph.
3. Beat titles become section headings (e.g., "**Act 1 - The Ordinary World**").
4. If the beat has a star rating, it affects the treatment section's prominence (5-star beats get more detailed treatment sections).
5. Character assignments on beats are included as parenthetical references: "(SARAH, MARCUS)".
6. Empty beats (title only, no description) appear as placeholder lines: "[Beat: Opening Image - description pending]".

### Editable Overrides

The user can edit any section of the treatment directly. This creates an override:

```typescript
// src/types/editor.ts

export interface TreatmentSection {
  beatId: string;
  beatTitle: string;
  beatDescription: string;         // Original from beat card
  treatmentText: string;           // Displayed text (may be override)
  hasOverride: boolean;            // True if user has manually edited
  overrideText: string | null;     // User's manual text, null if no override
  overrideStale: boolean;          // True if beat changed since override was written
  characters: string[];            // Character IDs assigned to this beat
  starRating: number | null;       // 1-5 or null
}

export interface TreatmentDocument {
  worldId: string;
  sections: TreatmentSection[];
  generatedAt: Date;
  wordCount: number;
}
```

**Override lifecycle**:
1. User edits a treatment section -> `hasOverride = true`, `overrideText` set.
2. The corresponding beat card's description changes -> `overrideStale = true`. The treatment section shows a warning badge: "Beat updated since your edit. [View diff] [Keep your edit] [Use new beat text]".
3. User reorders beats -> the treatment reorders to match. Overrides move with their beats.
4. User deletes a beat -> the treatment section is removed (override discarded with confirmation).

### Real-Time Updates

The treatment view subscribes to the beat sheet Zustand store. Any change to beats (create, edit, reorder, delete) triggers an immediate re-render of the treatment. There is no delay or background job; the treatment is a computed view of the beat data, assembled client-side.

### Export

Treatment export is handled by `src/lib/export/treatment-export.ts`:

- **PDF**: uses a headless rendering approach (React component rendered to HTML, then converted via a PDF library such as `@react-pdf/renderer` or server-side Puppeteer). Formatted with standard treatment conventions: single-spaced, scene headings bolded, 12pt Courier or similar.
- **DOCX**: uses a library like `docx` (npm) to build a Word document programmatically. Preserves headings, bold, and paragraph structure.
- **Plain text**: simple concatenation with newlines and Markdown-style headings (`## Beat Title`).

---

## 8. Real-Time Collaboration

Real-time collaboration allows multiple writers to edit the same document simultaneously. This is essential for writers rooms (2-5 people) but must not compromise the single-user experience.

### Architecture

```
Writer A (Browser)                Writer B (Browser)
    |                                 |
    | Yjs updates                     | Yjs updates
    v                                 v
TipTap Editor                    TipTap Editor
    |                                 |
    | Yjs awareness                   | Yjs awareness
    v                                 v
+-------------------------------------------+
|        Yjs WebSocket Provider             |
|        (Hocuspocus server)                |
+-------------------------------------------+
    |
    | Periodic snapshots
    v
PostgreSQL (canonical document state)
```

**Yjs** is a CRDT (Conflict-free Replicated Data Type) library that handles concurrent text editing without conflicts. TipTap has a first-party Yjs integration via `@tiptap/extension-collaboration`.

**Hocuspocus** is the WebSocket server for Yjs. It manages document rooms, broadcasts updates between clients, and periodically persists the document state to the database.

### Collaboration Extension Configuration

```typescript
// src/lib/editor/collaboration-setup.ts

import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';

export function createCollaborationProvider(options: {
  documentId: string;
  userId: string;
  userName: string;
  userColor: string;
  token: string;
}) {
  const ydoc = new Y.Doc();

  const provider = new HocuspocusProvider({
    url: process.env.NEXT_PUBLIC_COLLABORATION_WS_URL!,
    name: `document-${options.documentId}`,
    document: ydoc,
    token: options.token,

    onAuthenticate: async () => {
      // Token validated server-side by Hocuspocus
    },

    onSynced: () => {
      // Document is fully synced from server
      // Safe to enable editing
    },

    onDisconnect: () => {
      // Show "Offline" indicator
      // Local edits continue (Yjs buffers)
      // Will sync automatically on reconnect
    },
  });

  return { ydoc, provider };
}

export interface CollaborationUser {
  name: string;
  color: string;  // Unique color for cursor/selection
  clientId: number;
}
```

### Awareness

The Yjs awareness protocol shows where each collaborator's cursor is and what they have selected. This is rendered via `@tiptap/extension-collaboration-cursor` as:
- Colored cursor lines at each user's position
- Colored selection highlights for each user's selected text
- Name labels on cursors (positioned above the cursor line)

### Entity-Level Locking

CRDTs handle text conflicts cleanly (concurrent edits to different parts of the document merge automatically; concurrent edits to the same word merge character-by-character). However, semantic conflicts require additional handling.

Example: Writer A changes a character's name in their profile while Writer B writes dialogue for that character. The text merge works fine, but the entity rename needs to propagate to all entity marks. This is handled by entity-level optimistic locking:

1. When a user begins editing an entity's core fields (name, description), a soft lock is acquired (stored in the collaboration awareness state).
2. Other users see a "Being edited by [name]" indicator on that entity.
3. If two users try to edit the same entity simultaneously, the second user sees a notification: "[Name] is editing this entity. Your changes may conflict."
4. Actual conflicts (two users saved different values for the same field) are surfaced as "story conflicts" in a conflict resolution panel -- not auto-merged.

### Offline Support

When the WebSocket connection drops:
1. The editor continues to function normally. All edits are buffered in the local Yjs document.
2. An "Offline" indicator appears in the status bar.
3. When the connection is restored, Yjs automatically syncs local changes with the server. CRDT guarantees convergence.
4. If the offline period was long and other users made significant changes, the user sees a summary of remote changes after sync.

---

## 9. Split View

Split view allows writers to reference other content alongside their manuscript without switching pages.

### Split Configurations

| Left Panel | Right Panel | Use Case |
|---|---|---|
| Script | Source Material | Writing from research/transcript |
| Script | Beat Sheet | Writing from structural outline |
| Script | Character Profile | Writing dialogue, checking voice |
| Script | Timeline | Checking chronological consistency |
| Script | Another Script Section | Comparing two scenes |

### Implementation

```typescript
// src/components/editors/split-view.tsx

export interface SplitViewConfig {
  leftPanel: SplitPanelType;
  rightPanel: SplitPanelType;
  splitRatio: number; // 0-1, default 0.5
  isActive: boolean;
}

export type SplitPanelType =
  | { type: 'script'; sectionId?: string }
  | { type: 'source-material'; sourceId: string }
  | { type: 'beat-sheet' }
  | { type: 'character'; characterId: string }
  | { type: 'timeline' }
  | { type: 'treatment' };
```

The split view uses a resizable divider (CSS `resize` or a drag handle with pointer events). The left panel is always the primary script editor. The right panel renders a read-only (or separately editable) view of the selected content type.

The split ratio and right panel selection persist in the editor Zustand store, so they survive page refreshes.

### Interaction Between Panels

- Clicking an entity highlight in the left (script) panel can open the entity's detail in the right panel.
- Clicking a beat in the right (beat sheet) panel scrolls the left panel to the corresponding script section.
- Clicking a timestamp in the right (source material) panel inserts a reference marker in the script at the cursor position.

---

## 10. Performance

The writing surface must handle manuscripts up to 500K+ words (approximately the length of a multi-volume fantasy series or a 10-season TV series bible). Standard TipTap/ProseMirror performance degrades significantly with documents of this size.

### Strategies

**Virtual rendering for long documents**: ProseMirror renders the entire document into the DOM by default. For documents exceeding approximately 50,000 words, this causes noticeable lag. The mitigation is to implement a virtual scrolling layer that only renders the visible portion of the document plus a buffer zone above and below the viewport.

Implementation approach:
1. The document is split into "chunks" at chapter/episode boundaries.
2. Only the active chunk and its immediate neighbors are fully rendered in the DOM.
3. Other chunks are replaced with placeholder elements of the correct height (measured during initial render and cached).
4. As the user scrolls, chunks are mounted/unmounted with a debounced intersection observer.
5. The TipTap editor instance operates on the full Yjs document for collaboration, but the ProseMirror view only renders visible chunks.

This is a non-trivial modification to TipTap's default behavior and will likely require a custom ProseMirror `NodeView` for the chapter/episode container nodes.

**Lazy loading of chapters/scenes**: when a document is first opened, only the metadata (chapter titles, scene headings, word counts) is loaded. The full text content of each chapter loads on demand when the user navigates to it. This reduces initial load time from seconds to under 500ms even for massive documents.

```typescript
// src/lib/editor/document-structure.ts

export interface DocumentChunk {
  id: string;
  type: 'chapter' | 'episode' | 'act';
  title: string;
  wordCount: number;
  sceneCount: number;
  loaded: boolean;         // Is full content in memory?
  estimatedHeight: number; // Pixels, for virtual scrolling placeholder
}

export interface LazyDocument {
  worldId: string;
  chunks: DocumentChunk[];
  activeChunkIds: Set<string>; // Currently loaded chunks
  totalWordCount: number;
}

export async function loadChunk(
  worldId: string,
  chunkId: string
): Promise<ProseMirrorNode> {
  // Fetch chunk content from API
  // Parse into ProseMirror nodes
  // Insert into the Yjs document at the correct position
  throw new Error('Not implemented');
}

export function unloadChunk(
  chunkId: string,
  ydoc: Y.Doc
): void {
  // Replace chunk content in Yjs doc with a placeholder marker
  // Preserve the chunk's measured height for the virtual scroll placeholder
  // Keep metadata (title, word count) in memory
}
```

**Efficient auto-save (debounced, diff-based)**: rather than sending the entire document to the server on every save, the auto-save system sends only the changes since the last save. Yjs provides this naturally via its update mechanism -- only the delta is transmitted.

Save triggers:
- 2-second debounce after last edit (primary mechanism)
- Immediate save on blur (user switches tabs)
- Immediate save before any navigation away from the editor
- Periodic full-state snapshot every 5 minutes (safety net)

**Memory management**: TipTap extensions are cleaned up when the editor unmounts. The Yjs document and WebSocket provider are destroyed on unmount. Large documents that exceed approximately 200MB in Yjs document size (extremely rare -- roughly 2M+ words) trigger a warning recommending the user split the document into multiple volumes.

### Performance Targets

| Metric | Target | Measurement |
|---|---|---|
| Initial load (50K word doc) | < 500ms | Time to interactive editor |
| Initial load (500K word doc) | < 2s | Time to interactive (with lazy loading) |
| Keystroke latency | < 16ms | Input to visual update |
| Auto-save round trip | < 200ms | Debounce fire to server ACK |
| Collaboration sync | < 100ms | Edit on client A visible on client B (same region) |
| Entity detection (per paragraph) | < 50ms | Detection pass on single paragraph |
| Chunk load (on scroll) | < 300ms | Placeholder to full content render |

---

## 11. Keyboard Shortcuts

Keyboard shortcuts are critical for writing flow. The writing surface supports three layers of shortcuts: standard text editing, screenplay-specific, and StoryForge navigation.

### Standard Text Editing

| Shortcut | Action |
|---|---|
| Cmd+B | Bold |
| Cmd+I | Italic |
| Cmd+U | Underline |
| Cmd+Shift+X | Strikethrough |
| Cmd+Z | Undo |
| Cmd+Shift+Z | Redo |
| Cmd+A | Select all |
| Cmd+C / Cmd+V / Cmd+X | Copy / Paste / Cut |
| Cmd+Shift+V | Paste without formatting |
| Tab | Indent (prose) / Cycle element type (screenplay) |
| Shift+Tab | Outdent (prose) / Reverse cycle element type (screenplay) |
| Cmd+Enter | Insert hard break |
| Cmd+Shift+7 | Ordered list |
| Cmd+Shift+8 | Bullet list |
| Cmd+Shift+9 | Blockquote |

### Screenplay-Specific

| Shortcut | Action |
|---|---|
| Tab | Cycle to next element type (see cycling rules) |
| Shift+Tab | Cycle to previous element type |
| Cmd+1 | Force Scene Heading |
| Cmd+2 | Force Action |
| Cmd+3 | Force Character |
| Cmd+4 | Force Dialogue |
| Cmd+5 | Force Parenthetical |
| Cmd+6 | Force Transition |
| Cmd+Shift+D | Toggle Dual Dialogue |
| Cmd+Shift+N | Insert Scene Number |

### StoryForge Navigation

| Shortcut | Action |
|---|---|
| Cmd+Shift+W | Open AI Wand |
| Cmd+\ | Toggle Story Sidebar |
| Cmd+Shift+F | Toggle Focus Mode |
| Cmd+Shift+E | Link selected text to entity |
| Cmd+Shift+B | Open beat sheet panel |
| Cmd+J | Jump to scene (opens quick-jump dialog) |
| Cmd+Shift+Down | Jump to next scene |
| Cmd+Shift+Up | Jump to previous scene |
| Cmd+Shift+S | Create snapshot (version) |
| Cmd+S | Force save (normally auto-saves) |
| Cmd+Shift+/ | Show keyboard shortcut reference |
| Escape | Exit focus mode / close panels / dismiss popover |

### Custom Shortcut Configuration

Users can customize shortcuts via a settings panel (`src/app/(dashboard)/world/[id]/settings/`). Custom bindings are stored per-user in the database and loaded into the editor Zustand store on initialization.

```typescript
// src/types/editor.ts

export interface KeyboardShortcut {
  id: string;
  label: string;
  description: string;
  defaultBinding: string;   // e.g., "Mod-Shift-w"
  customBinding?: string;   // User's override, if any
  category: 'text' | 'screenplay' | 'navigation' | 'storyforge';
  mode?: 'prose' | 'screenplay' | 'both'; // Which mode this applies to
}

export type ShortcutMap = Record<string, KeyboardShortcut>;
```

The shortcut reference (Cmd+Shift+/) opens a modal listing all available shortcuts in their categories, showing both default and custom bindings. Shortcuts are grouped by category and filtered by the current editing mode.

---

## 12. Export

The writing surface supports export to multiple formats, covering the needs of novelists (DOCX, PDF, EPUB, Markdown), screenwriters (Fountain, FDX, PDF), and general interchange.

### Export Formats

#### .fountain (Screenplay Interchange)

The primary screenplay interchange format. Fountain is a plain-text markup language for screenplays that any tool can parse.

Export process:
1. Walk the TipTap document tree.
2. Map each node type to Fountain markup (see `fountain-adapter.ts` in Section 2).
3. Emit title page metadata at the top.
4. Output as UTF-8 plain text with `.fountain` extension.

Import process:
1. Parse `.fountain` file via Fountain.js.
2. Map Fountain tokens to TipTap node types.
3. Extract character names for auto-linking to story world entities.
4. Insert into the TipTap document.

#### .fdx (Final Draft XML)

The industry standard for professional screenwriting. Final Draft XML is verbose but well-documented.

Export process:
1. Walk the TipTap document tree.
2. Build an XML DOM matching the FDX schema (version 5+).
3. Map node types to FDX paragraph types (see table in Section 2).
4. Include character metadata, scene numbers, and revision marks where available.
5. Serialize to XML with `.fdx` extension.

Import process:
1. Parse `.fdx` file via streaming XML parser (`fast-xml-parser` or `sax`).
2. Extract `<Paragraph>` elements and map types to TipTap nodes.
3. Extract character list from `<CastList>` if present.
4. Preserve revision colors/marks as TipTap mark attributes.

#### .docx (Word Document)

Used for manuscript submissions, writers room distribution, and general sharing.

Export process (using the `docx` npm package):
1. Walk the TipTap document tree.
2. Map to `docx` library objects: `Paragraph`, `TextRun`, `HeadingLevel`, etc.
3. Apply formatting: standard manuscript format (12pt Courier, double-spaced, 1" margins) or screenplay format (single-spaced, element-specific margins and indentation).
4. Generate `.docx` file as a binary blob.

#### .pdf (Formatted Output)

For final presentation, submission, and printing.

Export process:
1. Render the document to HTML using the TipTap document and a print stylesheet.
2. Apply format-specific CSS: manuscript format (prose) or screenplay format (screenplay).
3. Convert HTML to PDF via server-side Puppeteer or `@react-pdf/renderer`.
4. Include headers/footers: page numbers, title, author name.
5. For screenplays: scene continuation markers ("(CONTINUED)" / "CONTINUED:"), forced page breaks before scene headings.

#### .md (Markdown)

For developers, wikis, and general-purpose text interchange.

Export process:
1. Walk the TipTap document tree.
2. Map nodes to Markdown syntax: `#` headings, `**bold**`, `*italic*`, `> blockquote`, etc.
3. For screenplay mode: use Fountain-style markup (which is Markdown-compatible for basic elements).
4. Output as UTF-8 plain text with `.md` extension.

#### .epub (eBook)

For novelists who want to preview or distribute their work as ebooks.

Export process (using `epub-gen-memory` or similar library):
1. Walk the TipTap document tree.
2. Split into EPUB chapters at chapter/act boundaries.
3. Generate XHTML content for each chapter.
4. Build the EPUB container with metadata (title, author, cover image if set).
5. Include a table of contents generated from the chapter/scene hierarchy.
6. Package as `.epub` file.

### Export Configuration

```typescript
// src/types/editor.ts

export interface ExportOptions {
  format: 'fountain' | 'fdx' | 'docx' | 'pdf' | 'md' | 'epub';
  scope: 'full' | 'selection' | 'chapter' | 'episode';

  // PDF/DOCX specific
  manuscriptFormat?: 'standard' | 'screenplay';
  fontSize?: number;       // Default: 12
  fontFamily?: string;     // Default: 'Courier Prime' (screenplay), 'Times New Roman' (prose)
  lineSpacing?: 'single' | 'double';
  includePageNumbers?: boolean;
  includeHeader?: boolean;
  headerText?: string;     // Default: title + author

  // EPUB specific
  coverImage?: string;     // URL or base64
  language?: string;       // Default: 'en'

  // Fountain/FDX specific
  includeSceneNumbers?: boolean;
  includeTitlePage?: boolean;

  // Treatment export (separate from manuscript)
  treatmentExport?: boolean;
}

export interface ExportResult {
  blob: Blob;
  filename: string;
  mimeType: string;
}
```

### Export Pipeline

All exports go through a unified pipeline:

```
User clicks Export
    |
    v
[Select format + options]
    |
    v
[Scope resolution] -- determine which content to export
    |
    v
[Document tree walk] -- extract content from TipTap doc
    |
    v
[Format-specific adapter] -- fountain-adapter, fdx-adapter, etc.
    |
    v
[Post-processing] -- pagination, headers, TOC generation
    |
    v
[Blob generation]
    |
    v
[Download trigger or save to file storage]
```

Exports of large documents (100K+ words) happen server-side via an API route to avoid blocking the browser. The user sees a progress indicator and receives a download link when complete.

---

## Appendix A: Zustand Store Schema

```typescript
// src/stores/editor-store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EditorState {
  // Document state
  worldId: string | null;
  documentId: string | null;
  mode: 'prose' | 'screenplay';
  storyMode: 'film' | 'tv';
  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  hasUnsavedChanges: boolean;

  // UI state
  sidebarCollapsed: boolean;
  focusModeActive: boolean;
  splitViewActive: boolean;
  splitViewConfig: SplitViewConfig | null;
  activeChapterId: string | null;
  activeSceneId: string | null;

  // Entity highlighting
  entityHighlightingEnabled: boolean;
  proposedEntities: EntityMarkAttrs[];   // Unconfirmed AI-detected entities
  entityColorMap: Record<string, string>; // entityId -> color override

  // Beat linking
  beatScriptLinks: BeatScriptLink[];
  showBeatMarkers: boolean;
  showUnmatchedIndicators: boolean;

  // Word count
  wordCountTargets: Record<string, number>; // sectionId -> target
  sessionWordCount: number;
  sessionStartWordCount: number;

  // Collaboration
  isCollaborating: boolean;
  collaborators: CollaborationUser[];

  // Shortcuts
  customShortcuts: ShortcutMap;

  // Actions
  setMode: (mode: 'prose' | 'screenplay') => void;
  toggleSidebar: () => void;
  toggleFocusMode: () => void;
  toggleSplitView: (config?: SplitViewConfig) => void;
  setSaving: (isSaving: boolean) => void;
  setLastSaved: (date: Date) => void;
  updateSessionWordCount: (count: number) => void;
  setActiveSection: (chapterId: string | null, sceneId: string | null) => void;
  addBeatScriptLink: (link: BeatScriptLink) => void;
  removeBeatScriptLink: (beatId: string) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      // ... initial state and action implementations
    }),
    {
      name: 'storyforge-editor',
      partialize: (state) => ({
        // Only persist UI preferences, not document state
        sidebarCollapsed: state.sidebarCollapsed,
        entityHighlightingEnabled: state.entityHighlightingEnabled,
        showBeatMarkers: state.showBeatMarkers,
        showUnmatchedIndicators: state.showUnmatchedIndicators,
        customShortcuts: state.customShortcuts,
        splitViewConfig: state.splitViewConfig,
      }),
    }
  )
);
```

## Appendix B: Treatment Zustand Store

```typescript
// src/stores/treatment-store.ts

import { create } from 'zustand';

export interface TreatmentState {
  worldId: string | null;
  sections: TreatmentSection[];
  isGenerating: boolean;
  lastGeneratedAt: Date | null;

  // Actions
  regenerate: (worldId: string, beats: Beat[]) => void;
  updateOverride: (beatId: string, overrideText: string) => void;
  clearOverride: (beatId: string) => void;
  markOverrideStale: (beatId: string) => void;
  reorderSections: (beatIds: string[]) => void; // Match new beat order
  removeSection: (beatId: string) => void;
}

export const useTreatmentStore = create<TreatmentState>()((set, get) => ({
  worldId: null,
  sections: [],
  isGenerating: false,
  lastGeneratedAt: null,

  regenerate: (worldId, beats) => {
    set({ isGenerating: true });

    const sections: TreatmentSection[] = beats.map((beat) => {
      const existing = get().sections.find((s) => s.beatId === beat.id);
      return {
        beatId: beat.id,
        beatTitle: beat.title,
        beatDescription: beat.description,
        treatmentText: existing?.hasOverride && !existing.overrideStale
          ? existing.overrideText!
          : beat.description,
        hasOverride: existing?.hasOverride ?? false,
        overrideText: existing?.overrideText ?? null,
        overrideStale: existing?.hasOverride
          ? beat.description !== existing.beatDescription
          : false,
        characters: beat.characterIds,
        starRating: beat.starRating,
      };
    });

    set({
      worldId,
      sections,
      isGenerating: false,
      lastGeneratedAt: new Date(),
    });
  },

  updateOverride: (beatId, overrideText) => {
    set((state) => ({
      sections: state.sections.map((s) =>
        s.beatId === beatId
          ? { ...s, hasOverride: true, overrideText, treatmentText: overrideText, overrideStale: false }
          : s
      ),
    }));
  },

  clearOverride: (beatId) => {
    set((state) => ({
      sections: state.sections.map((s) =>
        s.beatId === beatId
          ? { ...s, hasOverride: false, overrideText: null, treatmentText: s.beatDescription, overrideStale: false }
          : s
      ),
    }));
  },

  markOverrideStale: (beatId) => {
    set((state) => ({
      sections: state.sections.map((s) =>
        s.beatId === beatId
          ? { ...s, overrideStale: true }
          : s
      ),
    }));
  },

  reorderSections: (beatIds) => {
    set((state) => {
      const sectionMap = new Map(state.sections.map((s) => [s.beatId, s]));
      const reordered = beatIds
        .map((id) => sectionMap.get(id))
        .filter((s): s is TreatmentSection => s !== undefined);
      return { sections: reordered };
    });
  },

  removeSection: (beatId) => {
    set((state) => ({
      sections: state.sections.filter((s) => s.beatId !== beatId),
    }));
  },
}));
```

## Appendix C: Screenplay Node Extension Example

```typescript
// src/lib/editor/extensions/screenplay-node.ts

import { Node, mergeAttributes } from '@tiptap/core';

export const SceneHeading = Node.create({
  name: 'sceneHeading',
  group: 'block',
  content: 'text*',
  defining: true,

  addAttributes() {
    return {
      intExt: {
        default: 'INT.',
        parseHTML: (el) => el.getAttribute('data-int-ext') || 'INT.',
      },
      location: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-location') || '',
      },
      timeOfDay: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-time') || '',
      },
      sceneNumber: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-scene-number') || null,
      },
      beatId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-beat-id') || null,
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="scene-heading"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'scene-heading',
        class: 'screenplay-scene-heading',
      }),
      0,
    ];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-1': () => this.editor.commands.setNode(this.name),
    };
  },
});

export const Action = Node.create({
  name: 'action',
  group: 'block',
  content: 'text*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="action"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'action',
        class: 'screenplay-action',
      }),
      0,
    ];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-2': () => this.editor.commands.setNode(this.name),
    };
  },
});

export const CharacterCue = Node.create({
  name: 'characterCue',
  group: 'block',
  content: 'text*',
  defining: true,

  addAttributes() {
    return {
      characterId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-character-id') || null,
      },
      extension: {
        default: null, // (V.O.), (O.S.), (O.C.), (CONT'D)
        parseHTML: (el) => el.getAttribute('data-extension') || null,
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="character-cue"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'character-cue',
        class: 'screenplay-character-cue',
      }),
      0,
    ];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-3': () => this.editor.commands.setNode(this.name),
    };
  },
});

export const Dialogue = Node.create({
  name: 'dialogue',
  group: 'block',
  content: 'text*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="dialogue"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'dialogue',
        class: 'screenplay-dialogue',
      }),
      0,
    ];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-4': () => this.editor.commands.setNode(this.name),
    };
  },
});

export const Parenthetical = Node.create({
  name: 'parenthetical',
  group: 'block',
  content: 'text*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="parenthetical"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'parenthetical',
        class: 'screenplay-parenthetical',
      }),
      0,
    ];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-5': () => this.editor.commands.setNode(this.name),
    };
  },
});

export const Transition = Node.create({
  name: 'transition',
  group: 'block',
  content: 'text*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="transition"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'transition',
        class: 'screenplay-transition',
      }),
      0,
    ];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-6': () => this.editor.commands.setNode(this.name),
    };
  },
});

export const DualDialogue = Node.create({
  name: 'dualDialogue',
  group: 'block',
  content: 'dialogueColumn dialogueColumn',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="dual-dialogue"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'dual-dialogue',
        class: 'screenplay-dual-dialogue',
      }),
      0,
    ];
  },
});

export const TitlePage = Node.create({
  name: 'titlePage',
  group: 'block',
  content: 'text*',

  addAttributes() {
    return {
      title: { default: '' },
      author: { default: '' },
      contact: { default: '' },
      draftDate: { default: '' },
      copyright: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="title-page"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'title-page',
        class: 'screenplay-title-page',
      }),
      0,
    ];
  },
});

export const SceneNumber = Node.create({
  name: 'sceneNumber',
  group: 'inline',
  inline: true,
  atom: true,
  content: 'text*',

  addAttributes() {
    return {
      number: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="scene-number"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'scene-number',
        class: 'screenplay-scene-number',
      }),
      0,
    ];
  },
});
```
