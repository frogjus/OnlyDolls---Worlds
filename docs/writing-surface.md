# Writing Surface & Screenplay Architecture

> Technical architecture for StoryForge's integrated writing editor — supporting prose (novels) and screenplay formatting, built on TipTap with Fountain.js parsing, Yjs collaboration, and deep integration with the beat sheet, entity system, and AI Wand.

---

## Table of Contents

1. [TipTap Configuration](#1-tiptap-configuration)
2. [Screenplay Formatting](#2-screenplay-formatting)
3. [Beat-to-Script Navigation](#3-beat-to-script-navigation)
4. [Entity Highlighting](#4-entity-highlighting)
5. [Story Sidebar Integration](#5-story-sidebar-integration)
6. [AI Wand (Generation Assist)](#6-ai-wand-generation-assist)
7. [Treatment Auto-Generation](#7-treatment-auto-generation)
8. [Collaboration](#8-collaboration)
9. [Import/Export](#9-importexport)
10. [Performance](#10-performance)

---

## 1. TipTap Configuration

### 1.1 Base Setup

The editor is built on [TipTap v2](https://tiptap.dev/) (ProseMirror-based) with the following extension stack:

```
@tiptap/react                   — React integration
@tiptap/starter-kit             — Paragraph, Bold, Italic, Strike, Code, Heading, BulletList, OrderedList, Blockquote, HorizontalRule, History
@tiptap/extension-collaboration — Yjs CRDT binding
@tiptap/extension-collaboration-cursor — Remote cursor presence
@tiptap/extension-placeholder   — Per-node placeholder text
@tiptap/extension-character-count — Word/character counts
@tiptap/extension-underline     — Underline formatting
@tiptap/extension-text-align    — Center/right alignment (screenplay dialogue, transitions)
@tiptap/extension-typography    — Smart quotes, em dashes
@tiptap/extension-color         — Text color (entity highlights)
@tiptap/extension-highlight     — Background color (entity highlights)
@tiptap/extension-dropcursor    — Drop cursor for drag-and-drop
@tiptap/extension-gapcursor     — Gap cursor between blocks
fountain-js                     — Fountain screenplay format parser
yjs                             — CRDT engine
y-prosemirror                   — Yjs ↔ ProseMirror binding
y-websocket                     — WebSocket provider for Yjs
```

### 1.2 Editor Initialization

```typescript
// lib/editor/create-editor.ts

import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';

import { ScreenplayMode } from './extensions/screenplay-mode';
import { EntityHighlighter } from './extensions/entity-highlighter';
import { BeatMarker } from './extensions/beat-marker';
import { AIWand } from './extensions/ai-wand';

import type { EditorMode } from './types';
import type { Doc as YDoc } from 'yjs';
import { WebsocketProvider } from 'y-websocket';

interface CreateEditorOptions {
  mode: EditorMode;              // 'prose' | 'screenplay'
  manuscriptId: string;
  ydoc: YDoc;
  provider: WebsocketProvider;
  userId: string;
  userName: string;
  userColor: string;
  worldId: string;
}

export function useStoryForgeEditor(options: CreateEditorOptions) {
  const { mode, ydoc, provider, userId, userName, userColor, worldId } = options;

  return useEditor({
    extensions: [
      StarterKit.configure({
        history: false,            // Yjs handles undo/redo
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider,
        user: { name: userName, color: userColor },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (mode === 'screenplay') {
            return getScreenplayPlaceholder(node.type.name);
          }
          return 'Start writing...';
        },
      }),
      CharacterCount,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'screenplayDialogue', 'screenplayTransition'],
      }),
      Typography,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),

      // Custom extensions
      ScreenplayMode.configure({ enabled: mode === 'screenplay' }),
      EntityHighlighter.configure({ worldId }),
      BeatMarker.configure({ manuscriptId: options.manuscriptId }),
      AIWand.configure({ worldId, manuscriptId: options.manuscriptId }),
    ],
    editorProps: {
      attributes: {
        class: mode === 'screenplay'
          ? 'storyforge-editor screenplay-mode'
          : 'storyforge-editor prose-mode',
        spellcheck: 'true',
      },
    },
  });
}

function getScreenplayPlaceholder(nodeType: string): string {
  const placeholders: Record<string, string> = {
    screenplaySlugline: 'INT./EXT. LOCATION - TIME',
    screenplayAction: 'Action description...',
    screenplayCharacter: 'CHARACTER NAME',
    screenplayDialogue: 'Dialogue...',
    screenplayParenthetical: '(parenthetical)',
    screenplayTransition: 'CUT TO:',
    paragraph: 'Action description...',
  };
  return placeholders[nodeType] ?? '';
}
```

### 1.3 Mode Toggle

The editor supports two modes: **Prose** (novel/fiction) and **Screenplay** (film/TV). Switching is a toolbar toggle that reconfigures active node types and CSS classes.

```typescript
// lib/editor/types.ts

export type EditorMode = 'prose' | 'screenplay';

export interface EditorModeConfig {
  mode: EditorMode;
  nodeTypes: string[];          // Available block types in this mode
  toolbarItems: string[];       // Visible toolbar buttons
  cssClass: string;             // Applied to editor root
  pageBreakEnabled: boolean;    // Screenplay calculates page breaks
  fontFamily: string;
  fontSize: string;
}

export const PROSE_CONFIG: EditorModeConfig = {
  mode: 'prose',
  nodeTypes: ['paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList', 'horizontalRule'],
  toolbarItems: ['bold', 'italic', 'underline', 'heading', 'blockquote', 'bulletList', 'orderedList', 'align', 'aiWand'],
  cssClass: 'prose-mode',
  pageBreakEnabled: false,
  fontFamily: 'var(--font-serif)',       // e.g., Georgia, Merriweather
  fontSize: '16px',
};

export const SCREENPLAY_CONFIG: EditorModeConfig = {
  mode: 'screenplay',
  nodeTypes: [
    'screenplaySlugline',
    'screenplayAction',
    'screenplayCharacter',
    'screenplayDialogue',
    'screenplayParenthetical',
    'screenplayTransition',
    'screenplayDualDialogue',
    'screenplaySceneNumber',
  ],
  toolbarItems: ['slugline', 'action', 'character', 'dialogue', 'parenthetical', 'transition', 'dualDialogue', 'aiWand'],
  cssClass: 'screenplay-mode',
  pageBreakEnabled: true,
  fontFamily: "'Courier Prime', 'Courier New', monospace",
  fontSize: '12pt',
};
```

```typescript
// components/editor/mode-toggle.tsx

'use client';

import { Toggle } from '@/components/ui/toggle';
import { BookOpen, Clapperboard } from 'lucide-react';
import type { EditorMode } from '@/lib/editor/types';

interface ModeToggleProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-md border bg-muted p-0.5">
      <Toggle
        size="sm"
        pressed={mode === 'prose'}
        onPressedChange={() => onModeChange('prose')}
        aria-label="Prose mode"
      >
        <BookOpen className="h-4 w-4 mr-1" />
        Prose
      </Toggle>
      <Toggle
        size="sm"
        pressed={mode === 'screenplay'}
        onPressedChange={() => onModeChange('screenplay')}
        aria-label="Screenplay mode"
      >
        <Clapperboard className="h-4 w-4 mr-1" />
        Screenplay
      </Toggle>
    </div>
  );
}
```

**Mode switching behavior**: When toggling from Prose to Screenplay, the editor does NOT convert existing content. It changes the available node types, toolbar, and CSS. Users can have mixed-mode manuscripts (e.g., a novel with intercut screenplay scenes) by nesting `ManuscriptSection` records with different `format` fields.

### 1.4 Custom Extensions Overview

| Extension | Purpose | Node/Mark Type | Details |
|---|---|---|---|
| `ScreenplayMode` | Screenplay-specific block types and auto-formatting | Node (6 block types) | Section 2 |
| `EntityHighlighter` | Inline highlighting of recognized world entities | Mark (decoration) | Section 4 |
| `BeatMarker` | Invisible anchors linking text to beat cards | Node (atom, inline) | Section 3 |
| `AIWand` | Inline trigger for AI generation suggestions | Plugin (command) | Section 6 |

---

## 2. Screenplay Formatting

### 2.1 Fountain.js as Parsing Backbone

[Fountain.js](https://github.com/mattdaly/Fountain.js) parses Fountain markup into structured tokens. We use it for:

- **Import**: Parse `.fountain` files into TipTap document nodes
- **Export**: Serialize TipTap document back to Fountain format
- **Round-trip validation**: Ensure no data loss on import → edit → export

Fountain.js handles the Fountain spec: sluglines, action, character, dialogue, parentheticals, transitions, title pages, dual dialogue, sections, synopses, notes, boneyard, lyrics, and page breaks.

```typescript
// lib/editor/fountain-bridge.ts

import { fountain } from 'fountain-js';
import type { JSONContent } from '@tiptap/core';

/**
 * Parse a Fountain string into TipTap JSONContent document.
 */
export function fountainToTipTap(source: string): JSONContent {
  const parsed = fountain.parse(source);
  const content: JSONContent[] = [];

  for (const token of parsed.tokens) {
    switch (token.type) {
      case 'scene_heading':
        content.push({
          type: 'screenplaySlugline',
          attrs: {
            sceneNumber: token.scene_number ?? null,
          },
          content: [{ type: 'text', text: token.text }],
        });
        break;

      case 'action':
        content.push({
          type: 'screenplayAction',
          content: [{ type: 'text', text: token.text }],
        });
        break;

      case 'character':
        content.push({
          type: 'screenplayCharacter',
          attrs: {
            isDualDialogue: token.dual === 'right',
          },
          content: [{ type: 'text', text: token.text }],
        });
        break;

      case 'dialogue':
        content.push({
          type: 'screenplayDialogue',
          content: [{ type: 'text', text: token.text }],
        });
        break;

      case 'parenthetical':
        content.push({
          type: 'screenplayParenthetical',
          content: [{ type: 'text', text: token.text }],
        });
        break;

      case 'transition':
        content.push({
          type: 'screenplayTransition',
          content: [{ type: 'text', text: token.text }],
        });
        break;

      case 'page_break':
        content.push({ type: 'horizontalRule' });
        break;

      case 'section':
        content.push({
          type: 'heading',
          attrs: { level: token.depth ?? 1 },
          content: [{ type: 'text', text: token.text }],
        });
        break;

      case 'synopsis':
        // Store synopses as metadata, not visible content
        break;

      default:
        if (token.text?.trim()) {
          content.push({
            type: 'paragraph',
            content: [{ type: 'text', text: token.text }],
          });
        }
    }
  }

  return { type: 'doc', content };
}

/**
 * Serialize TipTap JSONContent back to Fountain format.
 */
export function tipTapToFountain(doc: JSONContent): string {
  const lines: string[] = [];

  for (const node of doc.content ?? []) {
    switch (node.type) {
      case 'screenplaySlugline': {
        const text = extractText(node);
        const sceneNum = node.attrs?.sceneNumber;
        lines.push('');
        lines.push(sceneNum ? `${text} #${sceneNum}#` : text);
        break;
      }

      case 'screenplayAction':
        lines.push('');
        lines.push(extractText(node));
        break;

      case 'screenplayCharacter': {
        const text = extractText(node);
        const dual = node.attrs?.isDualDialogue;
        lines.push('');
        lines.push(dual ? `${text} ^` : text);
        break;
      }

      case 'screenplayDialogue':
        lines.push(extractText(node));
        break;

      case 'screenplayParenthetical':
        lines.push(extractText(node));
        break;

      case 'screenplayTransition':
        lines.push('');
        lines.push(`> ${extractText(node)}`);
        break;

      case 'horizontalRule':
        lines.push('');
        lines.push('===');
        break;

      default:
        lines.push('');
        lines.push(extractText(node));
    }
  }

  return lines.join('\n').trim() + '\n';
}

function extractText(node: JSONContent): string {
  if (node.text) return node.text;
  return (node.content ?? []).map(extractText).join('');
}
```

### 2.2 ScreenplayMode Extension

A TipTap extension that registers 6 custom node types and handles auto-formatting.

```typescript
// lib/editor/extensions/screenplay-mode.ts

import { Extension, Node } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { TextSelection } from '@tiptap/pm/state';

// ---------------------------------------------------------------------------
// Node definitions
// ---------------------------------------------------------------------------

export const ScreenplaySlugline = Node.create({
  name: 'screenplaySlugline',
  group: 'block',
  content: 'text*',
  defining: true,

  addAttributes() {
    return {
      sceneNumber: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="slugline"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', {
      ...HTMLAttributes,
      'data-type': 'slugline',
      class: 'screenplay-slugline',
    }, 0];
  },
});

export const ScreenplayAction = Node.create({
  name: 'screenplayAction',
  group: 'block',
  content: 'text*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="action"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', {
      ...HTMLAttributes,
      'data-type': 'action',
      class: 'screenplay-action',
    }, 0];
  },
});

export const ScreenplayCharacter = Node.create({
  name: 'screenplayCharacter',
  group: 'block',
  content: 'text*',
  defining: true,

  addAttributes() {
    return {
      isDualDialogue: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="character"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', {
      ...HTMLAttributes,
      'data-type': 'character',
      class: 'screenplay-character',
    }, 0];
  },
});

export const ScreenplayDialogue = Node.create({
  name: 'screenplayDialogue',
  group: 'block',
  content: 'text*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="dialogue"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', {
      ...HTMLAttributes,
      'data-type': 'dialogue',
      class: 'screenplay-dialogue',
    }, 0];
  },
});

export const ScreenplayParenthetical = Node.create({
  name: 'screenplayParenthetical',
  group: 'block',
  content: 'text*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="parenthetical"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', {
      ...HTMLAttributes,
      'data-type': 'parenthetical',
      class: 'screenplay-parenthetical',
    }, 0];
  },
});

export const ScreenplayTransition = Node.create({
  name: 'screenplayTransition',
  group: 'block',
  content: 'text*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="transition"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', {
      ...HTMLAttributes,
      'data-type': 'transition',
      class: 'screenplay-transition',
    }, 0];
  },
});

// ---------------------------------------------------------------------------
// Auto-formatting plugin
// ---------------------------------------------------------------------------

const SLUGLINE_PATTERN = /^(INT\.|EXT\.|INT\.\/EXT\.|I\/E\.)\s/i;
const TRANSITION_PATTERN = /^.*(CUT TO:|FADE OUT\.|FADE IN:|DISSOLVE TO:|SMASH CUT TO:|WIPE TO:)$/i;
const CHARACTER_PATTERN = /^[A-Z][A-Z0-9 .'-]+(\s*\(V\.O\.\)|\s*\(O\.S\.\)|\s*\(O\.C\.\)|\s*\(CONT'D\))?$/;

const screenplayAutoFormatPluginKey = new PluginKey('screenplayAutoFormat');

function createAutoFormatPlugin() {
  return new Plugin({
    key: screenplayAutoFormatPluginKey,

    appendTransaction(transactions, _oldState, newState) {
      // Only act on user-typed transactions
      const hasDocChanges = transactions.some(tr => tr.docChanged && !tr.getMeta('screenplay-auto'));
      if (!hasDocChanges) return null;

      const { selection, doc } = newState;
      if (!(selection instanceof TextSelection)) return null;

      const $pos = selection.$from;
      const node = $pos.parent;

      // Only auto-format plain paragraphs — not already-typed screenplay nodes
      if (node.type.name !== 'paragraph' && node.type.name !== 'screenplayAction') return null;

      const text = node.textContent;
      if (!text) return null;

      const tr = newState.tr;
      tr.setMeta('screenplay-auto', true);

      // Rule 1: Slugline detection — INT./EXT. prefix
      if (SLUGLINE_PATTERN.test(text)) {
        const start = $pos.start() - 1;
        tr.setNodeMarkup(start, newState.schema.nodes.screenplaySlugline);
        return tr;
      }

      // Rule 2: Transition detection — ends with CUT TO: etc.
      if (TRANSITION_PATTERN.test(text.trim())) {
        const start = $pos.start() - 1;
        tr.setNodeMarkup(start, newState.schema.nodes.screenplayTransition);
        return tr;
      }

      // Rule 3: Character name detection — ALL CAPS line
      // Only trigger after a blank action/paragraph line
      if (CHARACTER_PATTERN.test(text.trim())) {
        const resolvedPos = doc.resolve($pos.start() - 1);
        const indexBefore = resolvedPos.index() - 1;
        if (indexBefore >= 0) {
          const prevNode = resolvedPos.parent.child(indexBefore);
          const prevText = prevNode.textContent.trim();
          // Character line follows an empty line or an action block
          if (prevText === '' || prevNode.type.name === 'screenplayAction') {
            const start = $pos.start() - 1;
            tr.setNodeMarkup(start, newState.schema.nodes.screenplayCharacter);
            return tr;
          }
        }
      }

      return null;
    },
  });
}

// ---------------------------------------------------------------------------
// Enter key handler: auto-advance to next screenplay element
// ---------------------------------------------------------------------------

function createEnterKeyPlugin() {
  return new Plugin({
    key: new PluginKey('screenplayEnterKey'),

    props: {
      handleKeyDown(view, event) {
        if (event.key !== 'Enter') return false;

        const { state } = view;
        const { selection } = state;
        if (!(selection instanceof TextSelection)) return false;

        const node = selection.$from.parent;
        const nodeType = node.type.name;
        const schema = state.schema;
        const tr = state.tr;

        // After character name → create dialogue block
        if (nodeType === 'screenplayCharacter') {
          const endPos = selection.$from.end();
          tr.split(endPos);
          const nextPos = endPos + 1;
          tr.setNodeMarkup(nextPos, schema.nodes.screenplayDialogue);
          tr.setSelection(TextSelection.create(tr.doc, nextPos + 1));
          view.dispatch(tr);
          return true;
        }

        // After dialogue → create action block (or next character)
        if (nodeType === 'screenplayDialogue') {
          const text = node.textContent;
          if (text.trim() === '') {
            // Empty dialogue line → switch to action (double-enter to exit dialogue)
            const start = selection.$from.start() - 1;
            tr.setNodeMarkup(start, schema.nodes.screenplayAction);
            view.dispatch(tr);
            return true;
          }
          // Non-empty dialogue → could be next parenthetical or more dialogue
          // Default: new dialogue line (writers keep typing)
          return false;
        }

        // After parenthetical → create dialogue block
        if (nodeType === 'screenplayParenthetical') {
          const endPos = selection.$from.end();
          tr.split(endPos);
          const nextPos = endPos + 1;
          tr.setNodeMarkup(nextPos, schema.nodes.screenplayDialogue);
          tr.setSelection(TextSelection.create(tr.doc, nextPos + 1));
          view.dispatch(tr);
          return true;
        }

        // After slugline → create action block
        if (nodeType === 'screenplaySlugline') {
          const endPos = selection.$from.end();
          tr.split(endPos);
          const nextPos = endPos + 1;
          tr.setNodeMarkup(nextPos, schema.nodes.screenplayAction);
          tr.setSelection(TextSelection.create(tr.doc, nextPos + 1));
          view.dispatch(tr);
          return true;
        }

        // After transition → create slugline block
        if (nodeType === 'screenplayTransition') {
          const endPos = selection.$from.end();
          tr.split(endPos);
          const nextPos = endPos + 1;
          tr.setNodeMarkup(nextPos, schema.nodes.screenplaySlugline);
          tr.setSelection(TextSelection.create(tr.doc, nextPos + 1));
          view.dispatch(tr);
          return true;
        }

        return false;
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Combined ScreenplayMode extension
// ---------------------------------------------------------------------------

export interface ScreenplayModeOptions {
  enabled: boolean;
}

export const ScreenplayMode = Extension.create<ScreenplayModeOptions>({
  name: 'screenplayMode',

  addOptions() {
    return { enabled: true };
  },

  addExtensions() {
    if (!this.options.enabled) return [];

    return [
      ScreenplaySlugline,
      ScreenplayAction,
      ScreenplayCharacter,
      ScreenplayDialogue,
      ScreenplayParenthetical,
      ScreenplayTransition,
    ];
  },

  addProseMirrorPlugins() {
    if (!this.options.enabled) return [];

    return [
      createAutoFormatPlugin(),
      createEnterKeyPlugin(),
    ];
  },
});
```

### 2.3 Screenplay CSS

All screenplay formatting follows industry standard margins (Courier 12pt, 1.5" left / 1" right / 1" top / 0.5" bottom on US Letter):

```css
/* styles/screenplay.css */

.screenplay-mode {
  font-family: 'Courier Prime', 'Courier New', monospace;
  font-size: 12pt;
  line-height: 1;
  max-width: 8.5in;
  margin: 0 auto;
  padding: 1in 1in 0.5in 1.5in;
  background: white;
  color: black;
}

/* Slugline: bold, uppercase, full width */
.screenplay-slugline {
  text-transform: uppercase;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 0;
}

/* Action: full width, single-spaced */
.screenplay-action {
  margin-top: 1em;
  margin-bottom: 0;
}

/* Character name: centered, uppercase, 3.7" from left edge */
.screenplay-character {
  text-transform: uppercase;
  margin-left: 2.2in;
  margin-top: 1em;
  margin-bottom: 0;
}

/* Dialogue: centered block, 2.5" from left, 2.5" from right */
.screenplay-dialogue {
  margin-left: 1in;
  margin-right: 1.5in;
  margin-top: 0;
  margin-bottom: 0;
}

/* Parenthetical: narrower than dialogue, 3.1" from left */
.screenplay-parenthetical {
  margin-left: 1.6in;
  margin-right: 2in;
  margin-top: 0;
  margin-bottom: 0;
}
.screenplay-parenthetical::before {
  content: '(';
}
.screenplay-parenthetical::after {
  content: ')';
}

/* Transition: right-aligned, uppercase */
.screenplay-transition {
  text-align: right;
  text-transform: uppercase;
  margin-top: 1em;
  margin-bottom: 0;
}

/* Scene numbers — positioned in left and right margins */
.screenplay-slugline[data-scene-number]::before {
  content: attr(data-scene-number);
  position: absolute;
  left: 0.75in;
}
.screenplay-slugline[data-scene-number]::after {
  content: attr(data-scene-number);
  position: absolute;
  right: 0.5in;
}

/* Page break indicator (every ~55 lines) */
.screenplay-page-break {
  border-bottom: 1px dashed var(--border);
  margin: 0.5em 0;
  page-break-after: always;
}
```

### 2.4 Auto-Complete: Sluglines and Character Names

Two auto-complete behaviors powered by the world entity list:

```typescript
// lib/editor/extensions/screenplay-autocomplete.ts

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { EditorView } from '@tiptap/pm/view';

export interface AutoCompleteOptions {
  /** Known location names from the StoryWorld entity list */
  getLocations: () => string[];
  /** Known character names from the StoryWorld entity list */
  getCharacters: () => string[];
}

const SLUGLINE_PREFIXES = ['INT. ', 'EXT. ', 'INT./EXT. ', 'I/E. '];
const TIME_SUFFIXES = [' - DAY', ' - NIGHT', ' - DAWN', ' - DUSK', ' - LATER', ' - CONTINUOUS', ' - MOMENTS LATER'];

/**
 * Provides auto-complete suggestions for:
 * 1. Sluglines: INT./EXT. + known locations + time of day
 * 2. Character names: known characters from the world entity list
 *
 * Renders a floating suggestion dropdown below the cursor.
 */
export const ScreenplayAutoComplete = Extension.create<AutoCompleteOptions>({
  name: 'screenplayAutoComplete',

  addOptions() {
    return {
      getLocations: () => [],
      getCharacters: () => [],
    };
  },

  addProseMirrorPlugins() {
    const { getLocations, getCharacters } = this.options;

    return [
      new Plugin({
        key: new PluginKey('screenplayAutoComplete'),

        props: {
          decorations(state) {
            // Decoration-based autocomplete rendering is handled
            // by the React component overlay — see AutoCompletePopover
            return DecorationSet.empty;
          },
        },
      }),
    ];
  },
});

// ---------------------------------------------------------------------------
// React component for the autocomplete popover
// ---------------------------------------------------------------------------

/*
 * The autocomplete popover is positioned absolutely relative to the editor
 * and listens to the editor state to determine when to show suggestions.
 *
 * Component: components/editor/autocomplete-popover.tsx
 *
 * Key behaviors:
 * - When inside a screenplaySlugline node and the user types after "INT. " or "EXT. ":
 *   → Show known locations filtered by typed prefix
 *   → After location is selected, suggest time suffixes
 *
 * - When inside a screenplayCharacter node:
 *   → Show known characters filtered by typed prefix
 *   → After selection, auto-advance to dialogue node
 *
 * - Tab key accepts the current suggestion
 * - Arrow keys navigate the suggestion list
 * - Escape dismisses
 */

export interface AutoCompleteSuggestion {
  label: string;         // Display text
  value: string;         // Inserted text
  type: 'location' | 'character' | 'time';
  entityId?: string;     // Link to world entity
}

export function getSuggestions(
  nodeType: string,
  text: string,
  locations: string[],
  characters: string[]
): AutoCompleteSuggestion[] {
  if (nodeType === 'screenplaySlugline') {
    // Check if we have a prefix (INT. / EXT.)
    const prefixMatch = SLUGLINE_PREFIXES.find(p => text.toUpperCase().startsWith(p));
    if (!prefixMatch) return [];

    const afterPrefix = text.slice(prefixMatch.length).toUpperCase();

    // Check if location is complete and we need time suffix
    const matchedLocation = locations.find(
      loc => afterPrefix.startsWith(loc.toUpperCase())
    );
    if (matchedLocation) {
      return TIME_SUFFIXES.map(suffix => ({
        label: suffix.trim(),
        value: `${prefixMatch}${matchedLocation.toUpperCase()}${suffix}`,
        type: 'time' as const,
      }));
    }

    // Filter locations by typed prefix
    return locations
      .filter(loc => loc.toUpperCase().startsWith(afterPrefix))
      .slice(0, 8)
      .map(loc => ({
        label: loc,
        value: `${prefixMatch}${loc.toUpperCase()}`,
        type: 'location' as const,
      }));
  }

  if (nodeType === 'screenplayCharacter') {
    const typed = text.toUpperCase().trim();
    if (!typed) {
      return characters.slice(0, 8).map(c => ({
        label: c,
        value: c.toUpperCase(),
        type: 'character' as const,
      }));
    }
    return characters
      .filter(c => c.toUpperCase().startsWith(typed))
      .slice(0, 8)
      .map(c => ({
        label: c,
        value: c.toUpperCase(),
        type: 'character' as const,
      }));
  }

  return [];
}
```

### 2.5 Page Break Calculation

Screenplay standard: ~55 lines per page on US Letter (accounting for 1" top margin, 0.5" bottom margin, 12pt Courier at exactly 6 lines/inch).

```typescript
// lib/editor/screenplay-pagination.ts

const LINES_PER_PAGE = 55;

/**
 * The page break calculator is a ProseMirror decoration plugin that
 * measures rendered node heights and inserts visual page-break
 * decorations at 55-line boundaries.
 *
 * It also enforces screenplay pagination rules:
 * - Never break in the middle of a dialogue block
 * - If a character name falls at the bottom of a page, move it to the next page
 * - If dialogue must break, insert "(MORE)" / "(CONT'D)" markers
 * - Sluglines always start at the top of a "page" section (visual only)
 */

export interface PageBreakPosition {
  /** Offset in the document where the break should be inserted */
  pos: number;
  /** Page number after this break */
  pageNumber: number;
}

export function calculatePageBreaks(
  view: import('@tiptap/pm/view').EditorView
): PageBreakPosition[] {
  const breaks: PageBreakPosition[] = [];
  const lineHeight = 12; // 12pt Courier = 1 line
  const pageHeight = LINES_PER_PAGE * lineHeight;
  let accumulatedHeight = 0;
  let currentPage = 1;

  view.state.doc.descendants((node, pos) => {
    if (!node.isBlock) return;

    const dom = view.nodeDOM(pos);
    if (!dom || !(dom instanceof HTMLElement)) return;

    const height = dom.getBoundingClientRect().height;
    accumulatedHeight += height;

    if (accumulatedHeight >= pageHeight) {
      // Apply pagination rules
      const nodeType = node.type.name;

      if (nodeType === 'screenplayCharacter' || nodeType === 'screenplayParenthetical') {
        // Never orphan a character name or parenthetical at page bottom —
        // push to next page
        breaks.push({ pos: pos - 1, pageNumber: ++currentPage });
      } else if (nodeType === 'screenplayDialogue') {
        // Dialogue can break, but needs MORE/CONT'D markers
        // (handled by the decoration renderer)
        breaks.push({ pos, pageNumber: ++currentPage });
      } else {
        breaks.push({ pos, pageNumber: ++currentPage });
      }

      accumulatedHeight = height; // Carry remainder onto next page
    }
  });

  return breaks;
}
```

### 2.6 Dual Dialogue

Dual dialogue renders two characters speaking simultaneously, side by side:

```typescript
// In the ScreenplayMode extension, add a wrapping node:

export const ScreenplayDualDialogue = Node.create({
  name: 'screenplayDualDialogue',
  group: 'block',
  content: '(screenplayCharacter screenplayDialogue screenplayParenthetical?){2}',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="dual-dialogue"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', {
      ...HTMLAttributes,
      'data-type': 'dual-dialogue',
      class: 'screenplay-dual-dialogue',
    }, 0];
  },
});
```

```css
/* Dual dialogue: side-by-side columns */
.screenplay-dual-dialogue {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5in;
  margin-top: 1em;
}
```

### 2.7 Scene Numbers

Scene numbers are stored as attributes on slugline nodes and rendered in both margins:

```typescript
// Command to toggle/set scene numbers across the entire document
export function setSceneNumbers(editor: import('@tiptap/core').Editor) {
  const { doc, tr } = editor.state;
  let sceneCount = 0;

  doc.descendants((node, pos) => {
    if (node.type.name === 'screenplaySlugline') {
      sceneCount++;
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        sceneNumber: String(sceneCount),
      });
    }
  });

  editor.view.dispatch(tr);
}
```

---

## 3. Beat-to-Script Navigation

### 3.1 Data Model Linkage

Each `Beat` in the database links to a `ManuscriptSection`. The `ManuscriptSection` is a row in the `manuscript_sections` table, which maps to a range of TipTap document content.

```
Beat (beat sheet card)
  └── manuscriptSectionId: FK → ManuscriptSection
        ├── manuscriptId: FK → Manuscript
        ├── type: 'chapter' | 'scene' | 'episode' | 'act'
        ├── order: Int (position in manuscript)
        ├── title: String
        └── content: JSON (TipTap document fragment)
```

The BeatMarker extension inserts invisible anchor nodes in the TipTap document that mark where each beat's content begins and ends.

### 3.2 BeatMarker Extension

```typescript
// lib/editor/extensions/beat-marker.ts

import { Node, Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

/**
 * Invisible inline atom node that marks the start of a beat's
 * script section. Stored in the document so it persists through
 * collaboration and serialization.
 */
export const BeatAnchor = Node.create({
  name: 'beatAnchor',
  group: 'block',
  atom: true,
  selectable: false,
  draggable: false,

  addAttributes() {
    return {
      beatId: { default: null },
      beatTitle: { default: '' },
      beatColor: { default: '#6366f1' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-beat-anchor]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', {
      ...HTMLAttributes,
      'data-beat-anchor': HTMLAttributes.beatId,
      class: 'beat-anchor',
      style: `border-left: 3px solid ${HTMLAttributes.beatColor};`,
    }];
  },
});

/**
 * Gutter decoration plugin — renders beat markers in the left margin.
 * These are ProseMirror decorations (not stored in the doc) that
 * overlay beat info on beat anchor positions.
 */
function createBeatGutterPlugin() {
  return new Plugin({
    key: new PluginKey('beatGutter'),

    props: {
      decorations(state) {
        const decorations: Decoration[] = [];

        state.doc.descendants((node, pos) => {
          if (node.type.name === 'beatAnchor') {
            const widget = Decoration.widget(pos, () => {
              const marker = document.createElement('div');
              marker.className = 'beat-gutter-marker';
              marker.setAttribute('data-beat-id', node.attrs.beatId);
              marker.style.backgroundColor = node.attrs.beatColor;
              marker.title = node.attrs.beatTitle;
              marker.textContent = ''; // Icon rendered via CSS
              return marker;
            }, { side: -1 });

            decorations.push(widget);
          }
        });

        return DecorationSet.create(state.doc, decorations);
      },
    },
  });
}

export interface BeatMarkerOptions {
  manuscriptId: string;
  /** Callback when a beat gutter marker is clicked */
  onBeatClick?: (beatId: string) => void;
}

export const BeatMarker = Extension.create<BeatMarkerOptions>({
  name: 'beatMarker',

  addOptions() {
    return {
      manuscriptId: '',
      onBeatClick: undefined,
    };
  },

  addExtensions() {
    return [BeatAnchor];
  },

  addProseMirrorPlugins() {
    return [createBeatGutterPlugin()];
  },

  addCommands() {
    return {
      /**
       * Insert a beat anchor at the current cursor position.
       */
      insertBeatAnchor: (attrs: { beatId: string; beatTitle: string; beatColor: string }) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: 'beatAnchor',
              attrs,
            })
            .run();
        },

      /**
       * Remove a beat anchor by beatId.
       */
      removeBeatAnchor: (beatId: string) =>
        ({ tr, state }) => {
          state.doc.descendants((node, pos) => {
            if (node.type.name === 'beatAnchor' && node.attrs.beatId === beatId) {
              tr.delete(pos, pos + node.nodeSize);
            }
          });
          return true;
        },

      /**
       * Scroll to the beat anchor for a given beatId.
       */
      scrollToBeat: (beatId: string) =>
        ({ editor }) => {
          let targetPos: number | null = null;
          editor.state.doc.descendants((node, pos) => {
            if (node.type.name === 'beatAnchor' && node.attrs.beatId === beatId) {
              targetPos = pos;
              return false; // stop iteration
            }
          });

          if (targetPos !== null) {
            const dom = editor.view.nodeDOM(targetPos);
            if (dom instanceof HTMLElement) {
              dom.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }

          return true;
        },
    };
  },
});
```

### 3.3 Beat Card "Go to Script" Button

```typescript
// components/beats/beat-card.tsx (relevant excerpt)

interface BeatCardProps {
  beat: Beat;
  editor: import('@tiptap/core').Editor | null;
}

function BeatCard({ beat, editor }: BeatCardProps) {
  const handleGoToScript = () => {
    if (!editor || !beat.manuscriptSectionId) return;
    editor.commands.scrollToBeat(beat.id);
  };

  return (
    <div className="beat-card" style={{ borderColor: beat.color }}>
      <h4>{beat.title}</h4>
      <p>{beat.description}</p>
      {beat.manuscriptSectionId && (
        <button
          onClick={handleGoToScript}
          className="text-xs text-muted-foreground hover:text-foreground"
          title="Go to script section"
        >
          Go to Script
        </button>
      )}
    </div>
  );
}
```

### 3.4 Beat Reorder → Manuscript Reorder

When beats are reordered in the beat sheet (drag-and-drop), the user is prompted to optionally reorder the corresponding manuscript sections:

```typescript
// lib/editor/beat-reorder-sync.ts

import type { Editor } from '@tiptap/core';

interface ReorderEvent {
  beatId: string;
  oldIndex: number;
  newIndex: number;
}

/**
 * Called when the beat sheet fires a reorder event.
 * Shows a confirmation dialog, then reorders manuscript sections
 * by moving beat anchor nodes in the TipTap document.
 */
export async function handleBeatReorder(
  editor: Editor,
  events: ReorderEvent[],
  confirm: (message: string) => Promise<boolean>
): Promise<void> {
  const shouldReorder = await confirm(
    'Beats were reordered. Reorder the corresponding script sections to match?'
  );
  if (!shouldReorder) return;

  const { state } = editor;
  const tr = state.tr;

  // Collect all beat anchors with their positions and content ranges
  const anchors: Array<{
    beatId: string;
    anchorPos: number;
    contentStart: number;
    contentEnd: number;
  }> = [];

  state.doc.descendants((node, pos) => {
    if (node.type.name === 'beatAnchor') {
      anchors.push({
        beatId: node.attrs.beatId,
        anchorPos: pos,
        contentStart: pos,
        contentEnd: pos, // Will be computed below
      });
    }
  });

  // Compute content ranges: each beat's content runs from its anchor
  // to the start of the next anchor (or end of document)
  for (let i = 0; i < anchors.length; i++) {
    anchors[i].contentEnd = i < anchors.length - 1
      ? anchors[i + 1].anchorPos
      : state.doc.content.size;
  }

  // Build a mapping from beatId to the document slice
  const slices = new Map<string, import('@tiptap/pm/model').Slice>();
  for (const anchor of anchors) {
    slices.set(
      anchor.beatId,
      state.doc.slice(anchor.contentStart, anchor.contentEnd)
    );
  }

  // Apply the new order based on beat reorder events
  // This is a simplified version — production would need careful
  // position remapping via ProseMirror's Mapping
  const reorderedBeatIds = anchors.map(a => a.beatId);
  for (const event of events) {
    const [moved] = reorderedBeatIds.splice(event.oldIndex, 1);
    reorderedBeatIds.splice(event.newIndex, 0, moved);
  }

  // Rebuild document from reordered slices
  const newContent: import('@tiptap/pm/model').Node[] = [];
  for (const beatId of reorderedBeatIds) {
    const slice = slices.get(beatId);
    if (slice) {
      slice.content.forEach(node => newContent.push(node));
    }
  }

  // Replace entire document content
  tr.replaceWith(0, state.doc.content.size, newContent);
  editor.view.dispatch(tr);
}
```

### 3.5 Gutter Marker CSS

```css
/* styles/beat-markers.css */

.beat-anchor {
  height: 0;
  overflow: visible;
  position: relative;
  border-left-width: 3px;
  border-left-style: solid;
  margin-left: -1.5rem;
  padding-left: 1.5rem;
}

.beat-gutter-marker {
  position: absolute;
  left: -2.5rem;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 150ms, transform 150ms;
}

.beat-gutter-marker:hover {
  opacity: 1;
  transform: scale(1.2);
}

/* Tooltip on hover showing beat title */
.beat-gutter-marker::after {
  content: attr(title);
  position: absolute;
  left: 1.5rem;
  top: -0.25rem;
  background: var(--popover);
  color: var(--popover-foreground);
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  white-space: nowrap;
  display: none;
  z-index: 10;
}

.beat-gutter-marker:hover::after {
  display: block;
}
```

---

## 4. Entity Highlighting

### 4.1 Architecture Overview

Entity highlighting works in three layers:

1. **Entity Registry** — fetches known entity names + types from the API and maintains a trie for fast prefix matching
2. **Decoration Plugin** — scans visible viewport text, matches against the registry, and renders colored highlight decorations
3. **Click Handler** — intercepts clicks on highlighted entities to open the detail popover

### 4.2 Entity Registry

```typescript
// lib/editor/entity-registry.ts

export type EntityType = 'character' | 'location' | 'object';

export interface WorldEntity {
  id: string;
  name: string;
  aliases: string[];           // "Jon", "Snow", "Jon Snow", "Lord Commander"
  type: EntityType;
  color: string;               // Override or default by type
  description?: string;
}

const TYPE_COLORS: Record<EntityType, string> = {
  character: '#3b82f6',   // blue
  location: '#22c55e',    // green
  object: '#f59e0b',      // amber
};

/**
 * Maintains a case-insensitive lookup of entity names/aliases
 * for fast matching during typing.
 */
export class EntityRegistry {
  private entities: Map<string, WorldEntity> = new Map();
  private nameLookup: Map<string, string> = new Map(); // lowercase name → entity ID

  constructor(entities: WorldEntity[]) {
    this.load(entities);
  }

  load(entities: WorldEntity[]) {
    this.entities.clear();
    this.nameLookup.clear();

    for (const entity of entities) {
      this.entities.set(entity.id, entity);

      // Index the primary name and all aliases
      const names = [entity.name, ...entity.aliases];
      for (const name of names) {
        this.nameLookup.set(name.toLowerCase(), entity.id);
      }
    }
  }

  /**
   * Find all entity mentions in a text string.
   * Returns matches sorted by position, longest match first (greedy).
   */
  findMentions(text: string): EntityMention[] {
    const mentions: EntityMention[] = [];
    const lowerText = text.toLowerCase();

    // Sort names by length descending for greedy matching
    const sortedNames = [...this.nameLookup.keys()].sort(
      (a, b) => b.length - a.length
    );

    // Track covered ranges to avoid overlapping matches
    const covered = new Set<number>();

    for (const name of sortedNames) {
      let searchFrom = 0;
      while (true) {
        const idx = lowerText.indexOf(name, searchFrom);
        if (idx === -1) break;

        // Check word boundaries
        const before = idx > 0 ? lowerText[idx - 1] : ' ';
        const after = idx + name.length < lowerText.length
          ? lowerText[idx + name.length]
          : ' ';

        const isWordBoundary = /\W/.test(before) && /\W/.test(after);

        if (isWordBoundary && !covered.has(idx)) {
          const entityId = this.nameLookup.get(name)!;
          const entity = this.entities.get(entityId)!;

          mentions.push({
            entityId,
            entityType: entity.type,
            from: idx,
            to: idx + name.length,
            text: text.slice(idx, idx + name.length),
            color: entity.color || TYPE_COLORS[entity.type],
          });

          // Mark range as covered
          for (let i = idx; i < idx + name.length; i++) {
            covered.add(i);
          }
        }

        searchFrom = idx + 1;
      }
    }

    return mentions.sort((a, b) => a.from - b.from);
  }

  getEntity(id: string): WorldEntity | undefined {
    return this.entities.get(id);
  }

  getColor(type: EntityType): string {
    return TYPE_COLORS[type];
  }
}

export interface EntityMention {
  entityId: string;
  entityType: EntityType;
  from: number;
  to: number;
  text: string;
  color: string;
}
```

### 4.3 EntityHighlighter Extension

```typescript
// lib/editor/extensions/entity-highlighter.ts

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { EntityRegistry, type EntityMention } from '../entity-registry';

export interface EntityHighlighterOptions {
  worldId: string;
  /** Injected entity registry — updated when world entities change */
  registry?: EntityRegistry;
  /** Called when user clicks a highlighted entity */
  onEntityClick?: (entityId: string, rect: DOMRect) => void;
  /** Called when user types an unrecognized capitalized name */
  onUnknownEntity?: (name: string, rect: DOMRect) => void;
}

const entityHighlighterKey = new PluginKey('entityHighlighter');

export const EntityHighlighter = Extension.create<EntityHighlighterOptions>({
  name: 'entityHighlighter',

  addOptions() {
    return {
      worldId: '',
      registry: undefined,
      onEntityClick: undefined,
      onUnknownEntity: undefined,
    };
  },

  addProseMirrorPlugins() {
    const { registry, onEntityClick, onUnknownEntity } = this.options;

    return [
      new Plugin({
        key: entityHighlighterKey,

        state: {
          init(_, state) {
            return buildDecorations(state.doc, registry);
          },
          apply(tr, oldDecorations, _oldState, newState) {
            // Only rebuild decorations when the document changes
            if (tr.docChanged) {
              return buildDecorations(newState.doc, registry);
            }
            return oldDecorations.map(tr.mapping, tr.doc);
          },
        },

        props: {
          decorations(state) {
            return this.getState(state) ?? DecorationSet.empty;
          },

          handleClick(view, pos, event) {
            const target = event.target as HTMLElement;

            // Check if clicked element is an entity highlight
            if (target.classList.contains('entity-highlight')) {
              const entityId = target.getAttribute('data-entity-id');
              if (entityId && onEntityClick) {
                const rect = target.getBoundingClientRect();
                onEntityClick(entityId, rect);
                return true;
              }
            }

            return false;
          },

          handleDoubleClick(view, pos, event) {
            // On double-click of an unrecognized word, offer to add as entity
            if (!onUnknownEntity || !registry) return false;

            const { state } = view;
            const $pos = state.doc.resolve(pos);
            const node = $pos.parent;
            const text = node.textContent;

            // Get the word at the cursor position
            const offsetInNode = pos - $pos.start();
            const wordMatch = getWordAt(text, offsetInNode);
            if (!wordMatch) return false;

            // Check if it looks like a proper noun (capitalized) and is NOT already known
            const word = wordMatch.text;
            if (!/^[A-Z]/.test(word)) return false;

            const mentions = registry.findMentions(word);
            if (mentions.length > 0) return false;

            const target = event.target as HTMLElement;
            onUnknownEntity(word, target.getBoundingClientRect());
            return true;
          },
        },
      }),
    ];
  },
});

function buildDecorations(
  doc: import('@tiptap/pm/model').Node,
  registry?: EntityRegistry
): DecorationSet {
  if (!registry) return DecorationSet.empty;

  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (!node.isTextblock) return;

    const text = node.textContent;
    if (!text) return;

    const mentions = registry.findMentions(text);
    const blockStart = pos + 1; // +1 for the opening of the text block

    for (const mention of mentions) {
      const from = blockStart + mention.from;
      const to = blockStart + mention.to;

      decorations.push(
        Decoration.inline(from, to, {
          class: `entity-highlight entity-${mention.entityType}`,
          'data-entity-id': mention.entityId,
          'data-entity-type': mention.entityType,
          style: `
            background-color: ${mention.color}20;
            border-bottom: 2px solid ${mention.color};
            cursor: pointer;
          `,
        })
      );
    }
  });

  return DecorationSet.create(doc, decorations);
}

function getWordAt(text: string, offset: number): { text: string; from: number; to: number } | null {
  const wordChars = /[\w'-]/;
  let start = offset;
  let end = offset;

  while (start > 0 && wordChars.test(text[start - 1])) start--;
  while (end < text.length && wordChars.test(text[end])) end++;

  const word = text.slice(start, end);
  if (word.length < 2) return null;

  return { text: word, from: start, to: end };
}
```

### 4.4 Entity Highlight CSS

```css
/* styles/entity-highlights.css */

.entity-highlight {
  cursor: pointer;
  border-radius: 2px;
  transition: background-color 150ms;
}

.entity-highlight:hover {
  filter: brightness(0.9);
}

.entity-character {
  background-color: rgba(59, 130, 246, 0.12);   /* blue */
  border-bottom: 2px solid #3b82f6;
}

.entity-location {
  background-color: rgba(34, 197, 94, 0.12);    /* green */
  border-bottom: 2px solid #22c55e;
}

.entity-object {
  background-color: rgba(245, 158, 11, 0.12);   /* amber */
  border-bottom: 2px solid #f59e0b;
}
```

### 4.5 Entity Detail Popover

```typescript
// components/editor/entity-popover.tsx

'use client';

import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import type { WorldEntity } from '@/lib/editor/entity-registry';

interface EntityPopoverProps {
  entityId: string | null;
  anchorRect: DOMRect | null;
  onClose: () => void;
  onViewFull: (entityId: string) => void;
}

export function EntityPopover({ entityId, anchorRect, onClose, onViewFull }: EntityPopoverProps) {
  const [entity, setEntity] = useState<EntityDetail | null>(null);

  useEffect(() => {
    if (!entityId) return;
    // Fetch entity detail from API
    fetch(`/api/entities/${entityId}`)
      .then(r => r.json())
      .then(setEntity);
  }, [entityId]);

  if (!entityId || !anchorRect || !entity) return null;

  return (
    <Popover open onOpenChange={open => { if (!open) onClose(); }}>
      <PopoverAnchor
        style={{
          position: 'fixed',
          left: anchorRect.left,
          top: anchorRect.bottom + 4,
        }}
      />
      <PopoverContent className="w-80 p-4" side="bottom" align="start">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">{entity.name}</h4>
            <Badge variant="outline">{entity.type}</Badge>
          </div>

          {entity.description && (
            <p className="text-sm text-muted-foreground">{entity.description}</p>
          )}

          {entity.relationships.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1">Relationships</p>
              <div className="flex flex-wrap gap-1">
                {entity.relationships.slice(0, 5).map(rel => (
                  <Badge key={rel.id} variant="secondary" className="text-xs">
                    {rel.label}: {rel.targetName}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {entity.sceneCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Appears in {entity.sceneCount} scene{entity.sceneCount !== 1 ? 's' : ''}
            </p>
          )}

          <button
            onClick={() => onViewFull(entity.id)}
            className="text-xs text-primary hover:underline"
          >
            View full profile
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface EntityDetail extends WorldEntity {
  relationships: Array<{ id: string; label: string; targetName: string }>;
  sceneCount: number;
}
```

### 4.6 "Add as Entity?" Popup

When the user double-clicks a capitalized word not in the registry:

```typescript
// components/editor/add-entity-popup.tsx

'use client';

import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { User, MapPin, Package } from 'lucide-react';
import type { EntityType } from '@/lib/editor/entity-registry';

interface AddEntityPopupProps {
  name: string;
  anchorRect: DOMRect | null;
  onAdd: (name: string, type: EntityType) => void;
  onDismiss: () => void;
}

export function AddEntityPopup({ name, anchorRect, onAdd, onDismiss }: AddEntityPopupProps) {
  if (!anchorRect) return null;

  return (
    <Popover open onOpenChange={open => { if (!open) onDismiss(); }}>
      <PopoverAnchor
        style={{
          position: 'fixed',
          left: anchorRect.left,
          top: anchorRect.bottom + 4,
        }}
      />
      <PopoverContent className="w-56 p-3" side="bottom" align="start">
        <p className="text-sm font-medium mb-2">Add "{name}" as:</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onAdd(name, 'character')}>
            <User className="h-3 w-3 mr-1" />
            Character
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAdd(name, 'location')}>
            <MapPin className="h-3 w-3 mr-1" />
            Location
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAdd(name, 'object')}>
            <Package className="h-3 w-3 mr-1" />
            Object
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

---

## 5. Story Sidebar Integration

### 5.1 Layout

The story sidebar is a persistent left panel (320px wide, collapsible) visible while writing. It provides context without leaving the editor.

```
+-------------------+-----------------------------------------------+
|  Story Sidebar    |           Writing Surface                     |
|  (320px)          |           (TipTap Editor)                     |
|                   |                                               |
|  [Synopsis]       |   INT. COFFEE SHOP - DAY                     |
|  [Quick Stats]    |                                               |
|  [Characters]     |   Sarah walks in, scans the room.             |
|  [Current Beat]   |   She spots JAMES at the counter.             |
|  [Scene Notes]    |                                               |
+-------------------+-----------------------------------------------+
```

### 5.2 Component Structure

```typescript
// components/editor/story-sidebar.tsx

'use client';

import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Editor } from '@tiptap/core';

interface StorySidebarProps {
  editor: Editor | null;
  manuscript: Manuscript;
  currentBeat: Beat | null;
  characters: Character[];
  synopsis: string;
  onSynopsisChange: (value: string) => void;
  onBeatClick: (beatId: string) => void;
}

export function StorySidebar({
  editor,
  manuscript,
  currentBeat,
  characters,
  synopsis,
  onSynopsisChange,
  onBeatClick,
}: StorySidebarProps) {
  const stats = useMemo(() => {
    if (!editor) return { words: 0, scenes: 0, characters: 0 };

    const text = editor.getText();
    const words = text.split(/\s+/).filter(Boolean).length;

    let scenes = 0;
    editor.state.doc.descendants(node => {
      if (node.type.name === 'screenplaySlugline') scenes++;
    });

    return { words, scenes, characters: characters.length };
  }, [editor?.state.doc, characters.length]);

  // Characters in the current scene (detected by entity highlighter)
  const sceneCharacters = useMemo(() => {
    if (!currentBeat) return characters;
    return characters.filter(c =>
      currentBeat.characterIds?.includes(c.id)
    );
  }, [currentBeat, characters]);

  return (
    <aside className="w-80 border-r bg-muted/30 flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">

          {/* Synopsis */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Synopsis</h3>
            <Textarea
              value={synopsis}
              onChange={e => onSynopsisChange(e.target.value)}
              placeholder="Write your story synopsis here. Required before AI Wand can be used."
              className="min-h-[100px] text-sm"
            />
            {!synopsis.trim() && (
              <p className="text-xs text-amber-600 mt-1">
                Synopsis required to use AI Wand
              </p>
            )}
          </section>

          {/* Quick Stats */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Quick Stats</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-background rounded-md p-2">
                <p className="text-lg font-bold">{stats.words.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Words</p>
              </div>
              <div className="bg-background rounded-md p-2">
                <p className="text-lg font-bold">{stats.scenes}</p>
                <p className="text-xs text-muted-foreground">Scenes</p>
              </div>
              <div className="bg-background rounded-md p-2">
                <p className="text-lg font-bold">{stats.characters}</p>
                <p className="text-xs text-muted-foreground">Characters</p>
              </div>
            </div>
          </section>

          {/* Characters in Scene */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Characters in Scene</h3>
            <div className="flex flex-wrap gap-2">
              {sceneCharacters.map(character => (
                <div
                  key={character.id}
                  className="flex items-center gap-1.5 text-sm"
                  title={character.name}
                >
                  <Avatar className="h-6 w-6">
                    {character.avatarUrl && (
                      <AvatarImage src={character.avatarUrl} alt={character.name} />
                    )}
                    <AvatarFallback className="text-xs">
                      {character.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate max-w-[80px]">{character.name}</span>
                </div>
              ))}
              {sceneCharacters.length === 0 && (
                <p className="text-xs text-muted-foreground">No characters linked yet</p>
              )}
            </div>
          </section>

          {/* Current Beat Info */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Current Beat</h3>
            {currentBeat ? (
              <div
                className="rounded-md border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                style={{ borderLeftColor: currentBeat.color, borderLeftWidth: 3 }}
                onClick={() => onBeatClick(currentBeat.id)}
              >
                <p className="font-medium text-sm">{currentBeat.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                  {currentBeat.description}
                </p>
                {currentBeat.tags && currentBeat.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {currentBeat.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Move your cursor to a section linked to a beat
              </p>
            )}
          </section>

        </div>
      </ScrollArea>
    </aside>
  );
}

// Types (from Prisma models)
interface Manuscript {
  id: string;
  title: string;
  format: 'prose' | 'screenplay' | 'mixed';
}

interface Beat {
  id: string;
  title: string;
  description: string;
  color: string;
  characterIds?: string[];
  tags?: string[];
  manuscriptSectionId?: string;
}

interface Character {
  id: string;
  name: string;
  avatarUrl?: string;
}
```

### 5.3 Current Beat Detection

The sidebar's "Current Beat" updates based on the cursor position. We determine which beat the cursor is inside by finding the nearest `beatAnchor` node above the cursor:

```typescript
// lib/editor/current-beat-tracker.ts

import type { EditorState } from '@tiptap/pm/state';

/**
 * Given the editor state, find the beatId of the beat anchor
 * closest above the current cursor position.
 */
export function getCurrentBeatId(state: EditorState): string | null {
  const { selection } = state;
  const cursorPos = selection.from;
  let closestBeatId: string | null = null;
  let closestPos = -1;

  state.doc.descendants((node, pos) => {
    if (
      node.type.name === 'beatAnchor' &&
      pos <= cursorPos &&
      pos > closestPos
    ) {
      closestBeatId = node.attrs.beatId;
      closestPos = pos;
    }
  });

  return closestBeatId;
}
```

---

## 6. AI Wand (Generation Assist)

### 6.1 Trigger Mechanism

The AI Wand can be triggered via:
1. **Toolbar button**: Wand icon in the editor toolbar
2. **Keyboard shortcut**: `Cmd+Shift+A` / `Ctrl+Shift+A`
3. **Slash command**: Type `/ai` in the editor (only in action/paragraph blocks)

### 6.2 Context Assembly

Before calling the Claude API, the wand assembles a context window from the story world:

```typescript
// lib/editor/ai-wand/context-assembler.ts

interface AIWandContext {
  synopsis: string;
  currentBeat: {
    title: string;
    description: string;
    characters: string[];
  } | null;
  surroundingBeats: {
    before: Array<{ title: string; description: string }>;
    after: Array<{ title: string; description: string }>;
  };
  characterProfiles: Array<{
    name: string;
    description: string;
    traits: string[];
    voiceNotes?: string;
  }>;
  worldRules: string[];
  precedingText: string;         // ~2000 chars before cursor
  followingText: string;         // ~1000 chars after cursor
  manuscriptFormat: 'prose' | 'screenplay';
}

/**
 * Assemble context for an AI Wand call.
 *
 * Hierarchy of importance:
 * 1. Synopsis (required — wand is disabled without it)
 * 2. Current beat description + surrounding beats
 * 3. Character profiles for characters in the current beat
 * 4. World rules that apply
 * 5. Surrounding manuscript text
 */
export async function assembleContext(params: {
  manuscriptId: string;
  beatId: string | null;
  cursorPos: number;
  editorText: string;
  worldId: string;
}): Promise<AIWandContext> {
  const { manuscriptId, beatId, cursorPos, editorText, worldId } = params;

  // Parallel fetch all context sources
  const [synopsisRes, beatsRes, charactersRes, rulesRes] = await Promise.all([
    fetch(`/api/worlds/${worldId}/synopsis`),
    fetch(`/api/worlds/${worldId}/beats?manuscriptId=${manuscriptId}`),
    fetch(`/api/worlds/${worldId}/characters?brief=true`),
    fetch(`/api/worlds/${worldId}/rules`),
  ]);

  const synopsis = (await synopsisRes.json()).synopsis ?? '';
  const allBeats = await beatsRes.json();
  const allCharacters = await charactersRes.json();
  const worldRules = (await rulesRes.json()).map((r: { description: string }) => r.description);

  // Find current beat and surrounding beats
  let currentBeat = null;
  const beforeBeats: Array<{ title: string; description: string }> = [];
  const afterBeats: Array<{ title: string; description: string }> = [];

  if (beatId) {
    const beatIndex = allBeats.findIndex((b: { id: string }) => b.id === beatId);
    if (beatIndex >= 0) {
      const beat = allBeats[beatIndex];
      currentBeat = {
        title: beat.title,
        description: beat.description,
        characters: beat.characters?.map((c: { name: string }) => c.name) ?? [],
      };

      // 3 beats before and after
      for (let i = Math.max(0, beatIndex - 3); i < beatIndex; i++) {
        beforeBeats.push({ title: allBeats[i].title, description: allBeats[i].description });
      }
      for (let i = beatIndex + 1; i < Math.min(allBeats.length, beatIndex + 4); i++) {
        afterBeats.push({ title: allBeats[i].title, description: allBeats[i].description });
      }
    }
  }

  // Filter characters to those in the current beat
  const beatCharacterNames = new Set(currentBeat?.characters ?? []);
  const relevantCharacters = beatCharacterNames.size > 0
    ? allCharacters.filter((c: { name: string }) => beatCharacterNames.has(c.name))
    : allCharacters.slice(0, 5); // Fallback: first 5 characters

  // Extract surrounding text
  const precedingText = editorText.slice(Math.max(0, cursorPos - 2000), cursorPos);
  const followingText = editorText.slice(cursorPos, cursorPos + 1000);

  return {
    synopsis,
    currentBeat,
    surroundingBeats: { before: beforeBeats, after: afterBeats },
    characterProfiles: relevantCharacters.map((c: {
      name: string;
      description: string;
      traits: string[];
      voiceNotes?: string;
    }) => ({
      name: c.name,
      description: c.description,
      traits: c.traits ?? [],
      voiceNotes: c.voiceNotes,
    })),
    worldRules,
    precedingText,
    followingText,
    manuscriptFormat: 'screenplay', // Determined by current editor mode
  };
}
```

### 6.3 Claude API Call

```typescript
// lib/editor/ai-wand/generate.ts

import Anthropic from '@anthropic-ai/sdk';
import type { AIWandContext } from './context-assembler';

export type WandTarget = 'script' | 'beat' | 'synopsis';

const client = new Anthropic();

export async function generateWithWand(
  context: AIWandContext,
  target: WandTarget,
  userInstruction?: string
): Promise<string> {
  const systemPrompt = buildSystemPrompt(context, target);
  const userMessage = buildUserMessage(context, target, userInstruction);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  return textBlock?.text ?? '';
}

function buildSystemPrompt(context: AIWandContext, target: WandTarget): string {
  const base = `You are a writing assistant for StoryForge, a story world architecture platform. Your role is to generate draft content that the writer can review, edit, or dismiss. Never claim authorship — you are generating suggestions.`;

  if (target === 'script' && context.manuscriptFormat === 'screenplay') {
    return `${base}

Generate screenplay content in proper Fountain format. Use standard screenplay elements:
- Scene headings (INT./EXT. LOCATION - TIME)
- Action lines (present tense, visual, concise)
- Character names (ALL CAPS centered)
- Dialogue (natural, character-appropriate)
- Parentheticals (sparingly, for essential direction)
- Transitions (only when necessary)

Match the voice and tone of the existing manuscript. Maintain character voice consistency.`;
  }

  if (target === 'script' && context.manuscriptFormat === 'prose') {
    return `${base}

Generate prose fiction content. Match the narrative voice, tense, and style of the surrounding text. Show don't tell. Use the existing character voices and world details.`;
  }

  if (target === 'beat') {
    return `${base}

Generate or refine a beat card. A beat is a story unit with a title (short, evocative) and description (1-3 sentences describing what happens). Keep it concise and actionable.`;
  }

  // synopsis
  return `${base}

Expand a logline or brief concept into a full synopsis (3-5 paragraphs). Cover the major story beats, character arcs, and thematic throughline. Write in present tense.`;
}

function buildUserMessage(
  context: AIWandContext,
  target: WandTarget,
  userInstruction?: string
): string {
  const parts: string[] = [];

  parts.push(`## Story Synopsis\n${context.synopsis}`);

  if (context.currentBeat) {
    parts.push(`## Current Beat\n**${context.currentBeat.title}**: ${context.currentBeat.description}`);
    if (context.currentBeat.characters.length > 0) {
      parts.push(`Characters in this beat: ${context.currentBeat.characters.join(', ')}`);
    }
  }

  if (context.surroundingBeats.before.length > 0) {
    parts.push(`## Preceding Beats\n${context.surroundingBeats.before.map(b => `- **${b.title}**: ${b.description}`).join('\n')}`);
  }

  if (context.surroundingBeats.after.length > 0) {
    parts.push(`## Following Beats\n${context.surroundingBeats.after.map(b => `- **${b.title}**: ${b.description}`).join('\n')}`);
  }

  if (context.characterProfiles.length > 0) {
    parts.push(`## Character Profiles\n${context.characterProfiles.map(c =>
      `**${c.name}**: ${c.description}${c.traits.length > 0 ? ` | Traits: ${c.traits.join(', ')}` : ''}${c.voiceNotes ? ` | Voice: ${c.voiceNotes}` : ''}`
    ).join('\n')}`);
  }

  if (context.worldRules.length > 0) {
    parts.push(`## World Rules\n${context.worldRules.map(r => `- ${r}`).join('\n')}`);
  }

  if (context.precedingText) {
    parts.push(`## Text Before Cursor\n\`\`\`\n${context.precedingText.slice(-500)}\n\`\`\``);
  }

  if (context.followingText) {
    parts.push(`## Text After Cursor\n\`\`\`\n${context.followingText.slice(0, 300)}\n\`\`\``);
  }

  if (userInstruction) {
    parts.push(`## Writer's Instruction\n${userInstruction}`);
  }

  if (target === 'script') {
    parts.push(`\nGenerate the next section of the ${context.manuscriptFormat === 'screenplay' ? 'screenplay' : 'manuscript'} based on the current beat and context. Write approximately 200-400 words.`);
  } else if (target === 'beat') {
    parts.push(`\nGenerate a refined title and description for this beat.`);
  } else {
    parts.push(`\nExpand this into a full synopsis.`);
  }

  return parts.join('\n\n');
}
```

### 6.4 AIWand Extension

```typescript
// lib/editor/extensions/ai-wand.ts

import { Extension } from '@tiptap/core';

export interface AIWandOptions {
  worldId: string;
  manuscriptId: string;
  /** Called to open the wand review panel */
  onTrigger?: (params: {
    cursorPos: number;
    beatId: string | null;
    selectedText: string;
  }) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiWand: {
      triggerAIWand: () => ReturnType;
    };
  }
}

export const AIWand = Extension.create<AIWandOptions>({
  name: 'aiWand',

  addOptions() {
    return {
      worldId: '',
      manuscriptId: '',
      onTrigger: undefined,
    };
  },

  addCommands() {
    return {
      triggerAIWand: () => ({ editor }) => {
        if (!this.options.onTrigger) return false;

        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, ' ');

        // Find current beat from cursor position
        let currentBeatId: string | null = null;
        let closestPos = -1;
        editor.state.doc.descendants((node, pos) => {
          if (
            node.type.name === 'beatAnchor' &&
            pos <= from &&
            pos > closestPos
          ) {
            currentBeatId = node.attrs.beatId;
            closestPos = pos;
          }
        });

        this.options.onTrigger({
          cursorPos: from,
          beatId: currentBeatId,
          selectedText,
        });

        return true;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-a': () => this.editor.commands.triggerAIWand(),
    };
  },
});
```

### 6.5 Review Panel

AI-generated content appears in a **review panel** (NOT inline). The user can accept, edit, or dismiss.

```typescript
// components/editor/ai-review-panel.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Check, X, Pencil, Wand2, Loader2 } from 'lucide-react';
import type { Editor } from '@tiptap/core';

interface AIReviewPanelProps {
  editor: Editor;
  generatedText: string;
  isLoading: boolean;
  target: 'script' | 'beat' | 'synopsis';
  cursorPos: number;
  onAccept: (text: string) => void;
  onDismiss: () => void;
}

export function AIReviewPanel({
  editor,
  generatedText,
  isLoading,
  target,
  cursorPos,
  onAccept,
  onDismiss,
}: AIReviewPanelProps) {
  const [editedText, setEditedText] = useState(generatedText);
  const [isEditing, setIsEditing] = useState(false);

  const handleAccept = () => {
    const finalText = isEditing ? editedText : generatedText;
    onAccept(finalText);

    // Insert into the editor at cursor position
    if (target === 'script') {
      editor.chain().focus().insertContentAt(cursorPos, finalText).run();
    }
  };

  return (
    <div className="border-t bg-muted/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Wand2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">AI Suggestion</span>
        <Badge variant="outline" className="text-xs">
          AI-generated
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Generating...</span>
        </div>
      ) : isEditing ? (
        <Textarea
          value={editedText}
          onChange={e => setEditedText(e.target.value)}
          className="min-h-[200px] font-mono text-sm"
        />
      ) : (
        <div className="rounded-md border bg-background p-3 max-h-[300px] overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap font-mono">{generatedText}</pre>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        <Button size="sm" onClick={handleAccept} disabled={isLoading}>
          <Check className="h-3 w-3 mr-1" />
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setIsEditing(!isEditing);
            if (!isEditing) setEditedText(generatedText);
          }}
          disabled={isLoading}
        >
          <Pencil className="h-3 w-3 mr-1" />
          {isEditing ? 'Preview' : 'Edit'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          <X className="h-3 w-3 mr-1" />
          Dismiss
        </Button>
      </div>
    </div>
  );
}
```

---

## 7. Treatment Auto-Generation

### 7.1 What is a Treatment?

A treatment is a prose summary of the story, generated by concatenating all beat descriptions in order, grouped by act/episode headers. It updates in real-time as beats change.

### 7.2 Generation Logic

```typescript
// lib/editor/treatment-generator.ts

interface TreatmentBeat {
  id: string;
  title: string;
  description: string;
  order: number;
  actId: string | null;
  actTitle: string | null;
  episodeId: string | null;
  episodeTitle: string | null;
  /** User's manual override for this beat's treatment text */
  treatmentOverride: string | null;
}

interface TreatmentSection {
  type: 'act-header' | 'episode-header' | 'beat';
  text: string;
  beatId?: string;
  isOverridden?: boolean;
}

/**
 * Generate a treatment document from ordered beats.
 * Beats are grouped under act and episode headers.
 * User overrides replace the auto-generated text per-beat.
 */
export function generateTreatment(beats: TreatmentBeat[]): TreatmentSection[] {
  const sections: TreatmentSection[] = [];
  let currentActId: string | null = null;
  let currentEpisodeId: string | null = null;

  const sorted = [...beats].sort((a, b) => a.order - b.order);

  for (const beat of sorted) {
    // Insert episode header if changed
    if (beat.episodeId && beat.episodeId !== currentEpisodeId) {
      currentEpisodeId = beat.episodeId;
      sections.push({
        type: 'episode-header',
        text: beat.episodeTitle ?? `Episode`,
      });
      currentActId = null; // Reset act tracking within new episode
    }

    // Insert act header if changed
    if (beat.actId && beat.actId !== currentActId) {
      currentActId = beat.actId;
      sections.push({
        type: 'act-header',
        text: beat.actTitle ?? `Act`,
      });
    }

    // Beat content: use override if present, otherwise auto-generate
    sections.push({
      type: 'beat',
      text: beat.treatmentOverride ?? `**${beat.title}** - ${beat.description}`,
      beatId: beat.id,
      isOverridden: !!beat.treatmentOverride,
    });
  }

  return sections;
}

/**
 * Render treatment sections to various output formats.
 */
export function treatmentToPlainText(sections: TreatmentSection[]): string {
  return sections.map(s => {
    switch (s.type) {
      case 'episode-header':
        return `\n${'='.repeat(60)}\n${s.text.toUpperCase()}\n${'='.repeat(60)}\n`;
      case 'act-header':
        return `\n--- ${s.text.toUpperCase()} ---\n`;
      case 'beat':
        return `${s.text}\n`;
      default:
        return '';
    }
  }).join('\n');
}

export function treatmentToMarkdown(sections: TreatmentSection[]): string {
  return sections.map(s => {
    switch (s.type) {
      case 'episode-header':
        return `\n# ${s.text}\n`;
      case 'act-header':
        return `\n## ${s.text}\n`;
      case 'beat':
        return `${s.text}\n`;
      default:
        return '';
    }
  }).join('\n');
}

export function treatmentToFountain(sections: TreatmentSection[]): string {
  return sections.map(s => {
    switch (s.type) {
      case 'episode-header':
        return `\n# ${s.text}\n`;
      case 'act-header':
        return `\n## ${s.text}\n`;
      case 'beat':
        return `= ${s.text}\n`; // Fountain synopsis syntax
      default:
        return '';
    }
  }).join('\n');
}
```

### 7.3 Real-Time Update Hook

```typescript
// hooks/use-treatment.ts

'use client';

import { useMemo, useCallback } from 'react';
import useSWR from 'swr';
import { generateTreatment, type TreatmentSection } from '@/lib/editor/treatment-generator';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useTreatment(worldId: string, manuscriptId: string) {
  // SWR revalidates on beat changes via mutation
  const { data: beats, mutate } = useSWR(
    `/api/worlds/${worldId}/manuscripts/${manuscriptId}/beats?include=act,episode`,
    fetcher,
    { refreshInterval: 0 } // Manual revalidation only
  );

  const sections = useMemo(() => {
    if (!beats) return [];
    return generateTreatment(beats);
  }, [beats]);

  const updateOverride = useCallback(async (beatId: string, text: string | null) => {
    await fetch(`/api/beats/${beatId}/treatment-override`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ treatmentOverride: text }),
    });
    mutate(); // Revalidate
  }, [mutate]);

  const refreshTreatment = useCallback(() => {
    mutate();
  }, [mutate]);

  return { sections, updateOverride, refreshTreatment };
}
```

### 7.4 Export Formats

The treatment supports export to: **PDF**, **DOCX**, **plain text**, and **Fountain**.

```typescript
// lib/editor/treatment-export.ts

import { treatmentToPlainText, treatmentToMarkdown, treatmentToFountain } from './treatment-generator';
import type { TreatmentSection } from './treatment-generator';

export type ExportFormat = 'pdf' | 'docx' | 'txt' | 'fountain';

export async function exportTreatment(
  sections: TreatmentSection[],
  format: ExportFormat,
  title: string
): Promise<Blob> {
  switch (format) {
    case 'txt': {
      const text = `${title}\n${'='.repeat(title.length)}\n\n${treatmentToPlainText(sections)}`;
      return new Blob([text], { type: 'text/plain' });
    }

    case 'fountain': {
      const fountain = `Title: ${title}\nAuthor: \nDraft date: ${new Date().toISOString().split('T')[0]}\n\n${treatmentToFountain(sections)}`;
      return new Blob([fountain], { type: 'text/plain' });
    }

    case 'pdf': {
      // Use @react-pdf/renderer or pdfmake for PDF generation
      // Server-side route: POST /api/export/treatment/pdf
      const res = await fetch('/api/export/treatment/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, sections }),
      });
      return res.blob();
    }

    case 'docx': {
      // Use docx npm package for DOCX generation
      // Server-side route: POST /api/export/treatment/docx
      const res = await fetch('/api/export/treatment/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, sections }),
      });
      return res.blob();
    }
  }
}
```

---

## 8. Collaboration

### 8.1 Yjs CRDT Integration

Real-time collaboration is powered by [Yjs](https://yjs.dev/) with TipTap's collaboration extensions. Each `Manuscript` has a dedicated Yjs document identified by `manuscript:{manuscriptId}`.

```typescript
// lib/editor/collaboration.ts

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

interface CollaborationConfig {
  manuscriptId: string;
  userId: string;
  userName: string;
  userColor: string;
  wsUrl: string;             // e.g., wss://api.storyforge.app/yjs
}

export function createCollaborationSession(config: CollaborationConfig) {
  const { manuscriptId, userId, userName, userColor, wsUrl } = config;

  // One Y.Doc per manuscript
  const ydoc = new Y.Doc();
  const roomName = `manuscript:${manuscriptId}`;

  const provider = new WebsocketProvider(wsUrl, roomName, ydoc, {
    params: {
      userId,
      manuscriptId,
    },
  });

  // Set user awareness (cursor presence)
  provider.awareness.setLocalStateField('user', {
    id: userId,
    name: userName,
    color: userColor,
  });

  return {
    ydoc,
    provider,
    destroy() {
      provider.destroy();
      ydoc.destroy();
    },
  };
}
```

### 8.2 Server-Side Yjs Provider

The Yjs WebSocket server persists documents to the database and handles authentication:

```typescript
// server/yjs-server.ts (Node.js WebSocket server)

import { WebSocketServer } from 'ws';
import { setupWSConnection, setPersistence } from 'y-websocket/bin/utils';
import { prisma } from '@/lib/prisma';

const wss = new WebSocketServer({ noServer: true });

// Persist Yjs documents to PostgreSQL via the Manuscript.yjsState column
setPersistence({
  provider: {
    async retrieveDoc(docName: string): Promise<Uint8Array | null> {
      const manuscriptId = docName.replace('manuscript:', '');
      const manuscript = await prisma.manuscript.findUnique({
        where: { id: manuscriptId },
        select: { yjsState: true },
      });
      return manuscript?.yjsState ?? null;
    },

    async persistDoc(docName: string, state: Uint8Array): Promise<void> {
      const manuscriptId = docName.replace('manuscript:', '');
      await prisma.manuscript.update({
        where: { id: manuscriptId },
        data: { yjsState: Buffer.from(state) },
      });
    },
  },
});

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req);
});

export { wss };
```

### 8.3 Cursor Presence

Remote cursors are rendered with name labels and colors:

```css
/* styles/collaboration.css */

/* Remote user cursor */
.collaboration-cursor__caret {
  position: relative;
  margin-left: -1px;
  margin-right: -1px;
  border-left: 2px solid;
  word-break: normal;
  pointer-events: none;
}

/* Username label above cursor */
.collaboration-cursor__label {
  position: absolute;
  top: -1.4em;
  left: -1px;
  font-size: 0.7rem;
  font-weight: 600;
  line-height: normal;
  padding: 0.1rem 0.3rem;
  border-radius: 3px 3px 3px 0;
  color: white;
  white-space: nowrap;
  user-select: none;
  pointer-events: none;
}
```

### 8.4 Entity-Level Locking

When a user opens an entity's edit panel (e.g., a character profile), a lock is acquired. Other users see a lock indicator and can view but not edit.

```typescript
// lib/collaboration/entity-lock.ts

import type { Awareness } from 'y-protocols/awareness';

interface EntityLock {
  entityId: string;
  entityType: string;
  userId: string;
  userName: string;
  lockedAt: number;
}

/**
 * Entity locking uses Yjs awareness protocol — no separate server needed.
 * Each client broadcasts which entity it's editing (if any).
 */
export class EntityLockManager {
  private awareness: Awareness;
  private userId: string;

  constructor(awareness: Awareness, userId: string) {
    this.awareness = awareness;
    this.userId = userId;
  }

  /** Acquire a lock on an entity. Returns false if already locked by another user. */
  acquire(entityId: string, entityType: string): boolean {
    const existingLock = this.getLock(entityId);
    if (existingLock && existingLock.userId !== this.userId) {
      return false; // Locked by someone else
    }

    this.awareness.setLocalStateField('entityLock', {
      entityId,
      entityType,
      userId: this.userId,
      userName: this.awareness.getLocalState()?.user?.name ?? 'Unknown',
      lockedAt: Date.now(),
    });

    return true;
  }

  /** Release the lock. */
  release() {
    this.awareness.setLocalStateField('entityLock', null);
  }

  /** Check if an entity is locked and by whom. */
  getLock(entityId: string): EntityLock | null {
    const states = this.awareness.getStates();
    for (const [_clientId, state] of states) {
      const lock = state.entityLock as EntityLock | undefined;
      if (lock?.entityId === entityId) {
        return lock;
      }
    }
    return null;
  }

  /** Listen for lock changes. */
  onChange(callback: () => void) {
    this.awareness.on('change', callback);
    return () => this.awareness.off('change', callback);
  }
}
```

### 8.5 Comment / Annotation System

Users can select text, right-click or use a toolbar button, and add a comment. Comments are threaded.

```typescript
// lib/editor/extensions/comments.ts

import { Mark } from '@tiptap/core';

/**
 * A mark (inline decoration) that links a text range to a comment thread.
 * The actual comment data lives in the database — the mark just stores
 * the threadId and renders the highlight.
 */
export const CommentMark = Mark.create({
  name: 'comment',

  addAttributes() {
    return {
      threadId: { default: null },
      resolved: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-comment-thread]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', {
      ...HTMLAttributes,
      'data-comment-thread': HTMLAttributes.threadId,
      class: HTMLAttributes.resolved
        ? 'comment-highlight comment-resolved'
        : 'comment-highlight',
    }, 0];
  },
});
```

```css
/* styles/comments.css */

.comment-highlight {
  background-color: rgba(255, 212, 0, 0.25);
  border-bottom: 2px solid rgba(255, 212, 0, 0.6);
  cursor: pointer;
}

.comment-highlight:hover {
  background-color: rgba(255, 212, 0, 0.4);
}

.comment-resolved {
  background-color: rgba(100, 100, 100, 0.1);
  border-bottom-color: rgba(100, 100, 100, 0.3);
}
```

---

## 9. Import/Export

### 9.1 Supported Formats

| Direction | Format | Extension | Library/Approach |
|---|---|---|---|
| Import | Fountain | `.fountain` | `fountain-js` → TipTap JSON |
| Import | Final Draft | `.fdx` | XML parse → TipTap JSON |
| Import | Word | `.docx` | `mammoth` → HTML → TipTap JSON |
| Import | Plain text | `.txt` | Direct → paragraph nodes |
| Import | Markdown | `.md` | `marked` → HTML → TipTap JSON |
| Export | Fountain | `.fountain` | TipTap JSON → Fountain string |
| Export | Final Draft | `.fdx` | TipTap JSON → FDX XML |
| Export | PDF (screenplay) | `.pdf` | TipTap JSON → Fountain → `afterwriting-labs` PDF |
| Export | PDF (prose) | `.pdf` | TipTap JSON → HTML → `puppeteer`/`@react-pdf` |
| Export | Word | `.docx` | `docx` npm package |
| Export | EPUB | `.epub` | `epub-gen` npm package |
| Export | Plain text | `.txt` | `editor.getText()` |

### 9.2 Final Draft XML (FDX) Import

```typescript
// lib/editor/importers/fdx-importer.ts

import type { JSONContent } from '@tiptap/core';

/**
 * Parse a Final Draft .fdx file (XML) into TipTap JSONContent.
 * FDX format: <FinalDraft> → <Content> → <Paragraph Type="..."> → <Text>
 */
export function fdxToTipTap(xml: string): JSONContent {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const paragraphs = doc.querySelectorAll('Content > Paragraph');
  const content: JSONContent[] = [];

  for (const para of paragraphs) {
    const type = para.getAttribute('Type') ?? 'Action';
    const textNodes = para.querySelectorAll('Text');
    const text = Array.from(textNodes).map(t => t.textContent ?? '').join('');

    if (!text.trim()) continue;

    const nodeType = fdxTypeToNodeType(type);
    const node: JSONContent = {
      type: nodeType,
      content: [{ type: 'text', text }],
    };

    // Handle scene numbers
    if (type === 'Scene Heading') {
      const sceneNum = para.getAttribute('Number');
      if (sceneNum) {
        node.attrs = { sceneNumber: sceneNum };
      }
    }

    // Handle dual dialogue
    if (type === 'Character' && para.getAttribute('DualDialogue') === 'Right') {
      node.attrs = { ...node.attrs, isDualDialogue: true };
    }

    content.push(node);
  }

  return { type: 'doc', content };
}

function fdxTypeToNodeType(fdxType: string): string {
  const mapping: Record<string, string> = {
    'Scene Heading': 'screenplaySlugline',
    'Action': 'screenplayAction',
    'Character': 'screenplayCharacter',
    'Dialogue': 'screenplayDialogue',
    'Parenthetical': 'screenplayParenthetical',
    'Transition': 'screenplayTransition',
    'General': 'paragraph',
    'Shot': 'screenplayAction',
  };
  return mapping[fdxType] ?? 'paragraph';
}
```

### 9.3 Final Draft XML (FDX) Export

```typescript
// lib/editor/exporters/fdx-exporter.ts

import type { JSONContent } from '@tiptap/core';

/**
 * Serialize TipTap JSONContent to Final Draft .fdx XML format.
 */
export function tipTapToFdx(doc: JSONContent, title: string): string {
  const paragraphs: string[] = [];

  for (const node of doc.content ?? []) {
    const fdxType = nodeTypeToFdxType(node.type!);
    const text = extractText(node);
    const attrs: string[] = [`Type="${fdxType}"`];

    if (node.type === 'screenplaySlugline' && node.attrs?.sceneNumber) {
      attrs.push(`Number="${node.attrs.sceneNumber}"`);
    }

    if (node.type === 'screenplayCharacter' && node.attrs?.isDualDialogue) {
      attrs.push(`DualDialogue="Right"`);
    }

    paragraphs.push(
      `    <Paragraph ${attrs.join(' ')}>\n      <Text>${escapeXml(text)}</Text>\n    </Paragraph>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<FinalDraft DocumentType="Script" Template="No" Version="5">
  <Content>
${paragraphs.join('\n')}
  </Content>
  <TitlePage>
    <Content>
      <Paragraph Type="Title Page">
        <Text>${escapeXml(title)}</Text>
      </Paragraph>
    </Content>
  </TitlePage>
</FinalDraft>`;
}

function nodeTypeToFdxType(nodeType: string): string {
  const mapping: Record<string, string> = {
    screenplaySlugline: 'Scene Heading',
    screenplayAction: 'Action',
    screenplayCharacter: 'Character',
    screenplayDialogue: 'Dialogue',
    screenplayParenthetical: 'Parenthetical',
    screenplayTransition: 'Transition',
    paragraph: 'General',
  };
  return mapping[nodeType] ?? 'General';
}

function extractText(node: JSONContent): string {
  if (node.text) return node.text;
  return (node.content ?? []).map(extractText).join('');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
```

### 9.4 Round-Trip Fidelity

To ensure no data loss on import → edit → export:

1. **Fountain round-trip**: Import via `fountain-js`, store as TipTap nodes, export via our `tipTapToFountain`. Test: `assert(tipTapToFountain(fountainToTipTap(source)) ≈ source)` — whitespace normalization is acceptable, structural elements must be identical.

2. **FDX round-trip**: Import via `fdxToTipTap`, export via `tipTapToFdx`. Test: structural elements (paragraph types, scene numbers, dual dialogue flags) must survive the round trip. FDX formatting metadata (fonts, revision colors) is preserved in a `metadata` JSONB sidecar column so it can be restored on export even though TipTap doesn't render it.

3. **Metadata preservation**: Any format-specific attributes not representable in TipTap nodes are stored in a `ManuscriptSection.importMetadata` JSONB field keyed by format name. On re-export to the same format, this metadata is merged back.

```typescript
// lib/editor/round-trip.ts

/**
 * Integration test helper: verify round-trip fidelity.
 */
export async function testFountainRoundTrip(source: string): Promise<{
  passed: boolean;
  diff: string[];
}> {
  const tipTapDoc = fountainToTipTap(source);
  const reExported = tipTapToFountain(tipTapDoc);

  // Normalize whitespace for comparison
  const normalize = (s: string) =>
    s.split('\n').map(l => l.trimEnd()).filter(Boolean).join('\n');

  const original = normalize(source);
  const result = normalize(reExported);

  if (original === result) {
    return { passed: true, diff: [] };
  }

  // Compute line-level diff
  const origLines = original.split('\n');
  const resultLines = result.split('\n');
  const diff: string[] = [];

  const maxLen = Math.max(origLines.length, resultLines.length);
  for (let i = 0; i < maxLen; i++) {
    if (origLines[i] !== resultLines[i]) {
      diff.push(`Line ${i + 1}: "${origLines[i] ?? '(missing)'}" → "${resultLines[i] ?? '(missing)'}"`);
    }
  }

  return { passed: false, diff };
}
```

---

## 10. Performance

### 10.1 Large Document Handling (100K+ Words)

A 100K-word manuscript is approximately 600KB of text, which produces a ProseMirror document with ~4,000-10,000 nodes. TipTap/ProseMirror can handle this, but we apply the following optimizations:

**Document Splitting**: Each `ManuscriptSection` (chapter/scene) is a separate TipTap subdocument within the Yjs Y.Doc. The editor only renders the currently active section plus a buffer of adjacent sections.

```typescript
// lib/editor/document-manager.ts

import * as Y from 'yjs';

/**
 * Manages manuscript as a collection of Y.Doc fragments.
 * Only the active section + buffer is loaded into the TipTap editor.
 */
export class DocumentManager {
  private ydoc: Y.Doc;
  private sectionIds: string[];
  private activeIndex: number = 0;
  private bufferSize: number = 2; // Load 2 sections before/after active

  constructor(ydoc: Y.Doc, sectionIds: string[]) {
    this.ydoc = ydoc;
    this.sectionIds = sectionIds;
  }

  /** Get the Y.XmlFragment for a section */
  getSection(sectionId: string): Y.XmlFragment {
    return this.ydoc.getXmlFragment(`section:${sectionId}`);
  }

  /** Get sections that should be loaded (active + buffer) */
  getLoadedSectionIds(): string[] {
    const start = Math.max(0, this.activeIndex - this.bufferSize);
    const end = Math.min(this.sectionIds.length, this.activeIndex + this.bufferSize + 1);
    return this.sectionIds.slice(start, end);
  }

  /** Switch active section */
  setActiveSection(sectionId: string) {
    const index = this.sectionIds.indexOf(sectionId);
    if (index >= 0) {
      this.activeIndex = index;
    }
  }

  /** Total section count */
  get totalSections(): number {
    return this.sectionIds.length;
  }
}
```

### 10.2 Virtualized Rendering

For the manuscript overview (scrolling through the entire document), we use virtualized rendering so only visible content is in the DOM:

```typescript
// components/editor/virtualized-manuscript.tsx

/**
 * For "scroll through entire manuscript" view, we virtualize sections.
 * Each ManuscriptSection is a row in a virtual list.
 * Only sections in the viewport (plus overscan) are rendered as TipTap instances.
 * Off-screen sections render as plain-text previews or collapsed headers.
 *
 * Library: @tanstack/react-virtual
 *
 * This is separate from the focused editing view, which renders a single
 * section with full TipTap editing capability.
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface VirtualizedManuscriptProps {
  sections: ManuscriptSectionSummary[];
  onSectionClick: (sectionId: string) => void;
}

interface ManuscriptSectionSummary {
  id: string;
  title: string;
  wordCount: number;
  preview: string; // First 200 chars
  type: 'chapter' | 'scene' | 'episode' | 'act';
}

export function VirtualizedManuscript({ sections, onSectionClick }: VirtualizedManuscriptProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: sections.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated px height per section preview
    overscan: 3,
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => {
          const section = sections[virtualItem.index];
          return (
            <div
              key={section.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="border-b p-4 cursor-pointer hover:bg-accent/50"
              onClick={() => onSectionClick(section.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-sm">{section.title}</h4>
                <span className="text-xs text-muted-foreground">
                  {section.wordCount.toLocaleString()} words
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {section.preview}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 10.3 Auto-Save Strategy

```typescript
// lib/editor/auto-save.ts

import { debounce } from 'lodash-es';
import type { Editor } from '@tiptap/core';

interface AutoSaveConfig {
  /** Debounce delay in ms after typing stops */
  debounceMs: number;
  /** Maximum interval between saves regardless of activity */
  maxIntervalMs: number;
  /** Save callback */
  onSave: (content: unknown) => Promise<void>;
}

const DEFAULT_CONFIG: AutoSaveConfig = {
  debounceMs: 2000,           // Save 2s after last keystroke
  maxIntervalMs: 30_000,      // Force save every 30s during active editing
  onSave: async () => {},
};

/**
 * Auto-save controller for the TipTap editor.
 *
 * Saves are triggered by:
 * 1. Debounced: 2 seconds after the last document change
 * 2. Periodic: Every 30 seconds during active editing
 * 3. On blur: When the editor/window loses focus
 * 4. On beforeunload: When the tab is closing
 *
 * Note: With Yjs collaboration, the Yjs state is persisted server-side
 * on every update. This auto-save is for the TipTap JSON representation
 * stored in ManuscriptSection.content as a fallback/snapshot.
 */
export class AutoSaveController {
  private editor: Editor;
  private config: AutoSaveConfig;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isDirty: boolean = false;
  private isSaving: boolean = false;
  private debouncedSave: ReturnType<typeof debounce>;
  private handleBlur: () => void;
  private handleBeforeUnload: (e: BeforeUnloadEvent) => void;

  constructor(editor: Editor, config: Partial<AutoSaveConfig> = {}) {
    this.editor = editor;
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Debounced save
    this.debouncedSave = debounce(() => this.save(), this.config.debounceMs);

    // Listen for document changes
    this.editor.on('update', () => {
      this.isDirty = true;
      this.debouncedSave();
    });

    // Periodic forced save
    this.intervalId = setInterval(() => {
      if (this.isDirty) this.save();
    }, this.config.maxIntervalMs);

    // Save on blur
    this.handleBlur = () => {
      if (this.isDirty) this.save();
    };
    window.addEventListener('blur', this.handleBlur);

    // Save on tab close
    this.handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (this.isDirty) {
        this.save(); // Best effort — may not complete
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  private async save() {
    if (this.isSaving || !this.isDirty) return;

    this.isSaving = true;
    try {
      const content = this.editor.getJSON();
      await this.config.onSave(content);
      this.isDirty = false;
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Will retry on next trigger
    } finally {
      this.isSaving = false;
    }
  }

  /** Force an immediate save */
  async forceSave() {
    this.debouncedSave.cancel();
    await this.save();
  }

  /** Clean up all listeners and timers */
  destroy() {
    this.debouncedSave.cancel();
    if (this.intervalId) clearInterval(this.intervalId);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    // Final save
    if (this.isDirty) this.save();
  }
}
```

### 10.4 Offline Support

```typescript
// lib/editor/offline.ts

/**
 * Offline strategy:
 *
 * 1. **IndexedDB persistence**: Yjs documents are persisted locally via
 *    y-indexeddb. This means the editor works fully offline — all edits
 *    are stored in IndexedDB and synced when connectivity returns.
 *
 * 2. **Service Worker**: A service worker caches the app shell, editor
 *    assets, and font files. API responses for entity data are cached
 *    with a stale-while-revalidate strategy.
 *
 * 3. **Sync on reconnect**: When the WebSocket reconnects, Yjs
 *    automatically merges local and remote changes via CRDT resolution.
 *    No manual conflict resolution needed.
 *
 * 4. **Offline indicator**: The UI shows a banner when offline and
 *    queues API calls (entity creates, beat updates) for replay on
 *    reconnect.
 */

import { IndexeddbPersistence } from 'y-indexeddb';
import type { Doc as YDoc } from 'yjs';

export function enableOfflinePersistence(ydoc: YDoc, manuscriptId: string) {
  const persistence = new IndexeddbPersistence(
    `storyforge:manuscript:${manuscriptId}`,
    ydoc
  );

  persistence.on('synced', () => {
    console.log(`[Offline] Local state loaded for manuscript ${manuscriptId}`);
  });

  return persistence;
}

/**
 * Queue for API calls made while offline.
 * Replayed in order when connectivity returns.
 */
export class OfflineQueue {
  private queue: Array<{
    url: string;
    method: string;
    body: string;
    timestamp: number;
  }> = [];

  private dbName = 'storyforge-offline-queue';

  async enqueue(url: string, method: string, body: unknown) {
    const entry = {
      url,
      method,
      body: JSON.stringify(body),
      timestamp: Date.now(),
    };
    this.queue.push(entry);
    await this.persistQueue();
  }

  async replay() {
    const entries = [...this.queue];
    this.queue = [];
    await this.persistQueue();

    for (const entry of entries) {
      try {
        await fetch(entry.url, {
          method: entry.method,
          headers: { 'Content-Type': 'application/json' },
          body: entry.body,
        });
      } catch {
        // Re-enqueue on failure
        this.queue.push(entry);
      }
    }

    if (this.queue.length > 0) {
      await this.persistQueue();
    }
  }

  private async persistQueue() {
    // Persist to IndexedDB for survival across page reloads
    const db = await openDB(this.dbName);
    const tx = db.transaction('queue', 'readwrite');
    await tx.store.clear();
    for (const entry of this.queue) {
      await tx.store.add(entry);
    }
    await tx.done;
  }
}

async function openDB(name: string) {
  const { openDB: idbOpen } = await import('idb');
  return idbOpen(name, 1, {
    upgrade(db) {
      db.createObjectStore('queue', { autoIncrement: true });
    },
  });
}
```

---

## Appendix A: Full Component Tree

```
WritingPage
├── StorySidebar (320px left panel)
│   ├── SynopsisField
│   ├── QuickStats (word count, scene count, character count)
│   ├── SceneCharacterList (avatars)
│   └── CurrentBeatCard
├── EditorContainer (main area)
│   ├── EditorToolbar
│   │   ├── ModeToggle (Prose / Screenplay)
│   │   ├── FormattingButtons (bold, italic, etc. — prose mode)
│   │   ├── ScreenplayTypeButtons (slugline, action, etc. — screenplay mode)
│   │   ├── AIWandButton
│   │   └── CollaborationAvatars (remote users)
│   ├── TipTapEditor
│   │   ├── BeatGutterMarkers (left margin)
│   │   ├── EntityHighlights (inline decorations)
│   │   └── PageBreakIndicators (screenplay mode only)
│   ├── AutoCompletePopover (slugline/character suggestions)
│   ├── EntityPopover (click entity → detail)
│   ├── AddEntityPopup (double-click unknown name)
│   └── AIReviewPanel (bottom panel, shown on wand trigger)
├── CommentsSidebar (right panel, togglable)
│   └── CommentThread[]
└── TreatmentPanel (togglable overlay/tab)
    ├── TreatmentSections
    └── ExportButtons
```

## Appendix B: NPM Dependencies

```json
{
  "dependencies": {
    "@tiptap/react": "^2.6.0",
    "@tiptap/starter-kit": "^2.6.0",
    "@tiptap/extension-collaboration": "^2.6.0",
    "@tiptap/extension-collaboration-cursor": "^2.6.0",
    "@tiptap/extension-placeholder": "^2.6.0",
    "@tiptap/extension-character-count": "^2.6.0",
    "@tiptap/extension-underline": "^2.6.0",
    "@tiptap/extension-text-align": "^2.6.0",
    "@tiptap/extension-typography": "^2.6.0",
    "@tiptap/extension-color": "^2.6.0",
    "@tiptap/extension-text-style": "^2.6.0",
    "@tiptap/extension-highlight": "^2.6.0",
    "@tiptap/pm": "^2.6.0",
    "fountain-js": "^1.1.0",
    "yjs": "^13.6.0",
    "y-prosemirror": "^1.2.0",
    "y-websocket": "^2.0.0",
    "y-indexeddb": "^9.0.0",
    "@tanstack/react-virtual": "^3.8.0",
    "@anthropic-ai/sdk": "^0.30.0",
    "mammoth": "^1.8.0",
    "docx": "^8.5.0",
    "idb": "^8.0.0",
    "lodash-es": "^4.17.0"
  },
  "devDependencies": {
    "@types/lodash-es": "^4.17.0"
  }
}
```

## Appendix C: Data Model Reference

These are the Prisma models relevant to the writing surface (from `prisma/schema.prisma`):

```prisma
model Manuscript {
  id            String              @id @default(cuid())
  storyWorldId  String
  title         String
  format        ManuscriptFormat    // PROSE | SCREENPLAY | MIXED
  yjsState      Bytes?              // Yjs document state for collaboration
  metadata      Json?               // Format-specific metadata (e.g., FDX revision colors)
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
  deletedAt     DateTime?

  storyWorld    StoryWorld          @relation(fields: [storyWorldId], references: [id])
  sections      ManuscriptSection[]
  treatments    Treatment[]
}

model ManuscriptSection {
  id            String              @id @default(cuid())
  manuscriptId  String
  type          SectionType         // CHAPTER | SCENE | EPISODE | ACT
  title         String
  order         Int
  content       Json?               // TipTap JSON snapshot (fallback for Yjs)
  importMetadata Json?              // Format-specific data for round-trip fidelity
  wordCount     Int                 @default(0)
  beatId        String?             // Link to beat card
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
  deletedAt     DateTime?

  manuscript    Manuscript          @relation(fields: [manuscriptId], references: [id])
  beat          Beat?               @relation(fields: [beatId], references: [id])
}

model Treatment {
  id            String              @id @default(cuid())
  manuscriptId  String
  title         String
  generatedAt   DateTime            @default(now())
  content       String              // Full generated treatment text

  manuscript    Manuscript          @relation(fields: [manuscriptId], references: [id])
}

model Beat {
  id                  String     @id @default(cuid())
  storyWorldId        String
  title               String
  description         String
  order               Int
  color               String     @default("#6366f1")
  tags                String[]
  notes               String?
  starRating          Int?
  actId               String?
  episodeId           String?
  treatmentOverride   String?    // Manual override for treatment text
  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt
  deletedAt           DateTime?

  storyWorld          StoryWorld @relation(fields: [storyWorldId], references: [id])
  manuscriptSections  ManuscriptSection[]
  characters          CharacterBeat[]
}
```

## Appendix D: Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Editor framework | TipTap v2 (ProseMirror) | Extensible, collaboration-ready, large ecosystem. Novel (16K stars) proves the pattern. |
| Screenplay parsing | Fountain.js | De facto standard for screenplay interchange. Handles all Fountain spec elements. |
| Collaboration CRDT | Yjs | Battle-tested, TipTap has first-party integration, handles offline/merge automatically. |
| AI generation placement | Review panel (not inline) | Writers want control. Inline insertion feels like the AI is writing for them. Review panel maintains authorial agency. |
| Document structure | Split by ManuscriptSection | Large document performance. Each section is an independent Y.XmlFragment — only active section is rendered. |
| Entity highlighting | ProseMirror decorations (not marks) | Decorations are ephemeral and recomputed — entities can be renamed/deleted without corrupting the document. Marks would be stored in the doc and break if the entity changes. |
| Screenplay auto-format | ProseMirror appendTransaction | Runs synchronously after each transaction. More reliable than input rules for multi-line screenplay flow (character → dialogue → parenthetical). |
| Treatment generation | Client-side concatenation | Simple, real-time, no server round-trip. Beat data is already loaded. Server-side only for PDF/DOCX export. |
| Offline persistence | y-indexeddb + API queue | Yjs handles document offline automatically. API calls (entity CRUD) queue and replay on reconnect. |
| Mode toggle (Prose ↔ Screenplay) | CSS class + extension enable/disable | Preserves document content. Doesn't convert nodes. A manuscript can have mixed-mode sections. |
