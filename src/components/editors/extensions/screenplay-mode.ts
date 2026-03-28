import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import {
  ScreenplaySlugline,
  ScreenplayAction,
  ScreenplayCharacter,
  ScreenplayDialogue,
  ScreenplayParenthetical,
  ScreenplayTransition,
} from '../screenplay-nodes';

const SLUGLINE_PATTERN = /^(INT\.|EXT\.|INT\.\/EXT\.|I\/E\.)\s/i;
const TRANSITION_PATTERN = /^.*(CUT TO:|FADE OUT\.|FADE IN:|DISSOLVE TO:|SMASH CUT TO:|WIPE TO:)$/i;
const CHARACTER_PATTERN = /^[A-Z][A-Z0-9 .'-]+(\s*\(V\.O\.\)|\s*\(O\.S\.\)|\s*\(O\.C\.\)|\s*\(CONT'D\))?$/;

const screenplayAutoFormatPluginKey = new PluginKey('screenplayAutoFormat');

function createAutoFormatPlugin(): Plugin {
  return new Plugin({
    key: screenplayAutoFormatPluginKey,

    appendTransaction(transactions, _oldState, newState) {
      const hasDocChanges = transactions.some(tr => tr.docChanged && !tr.getMeta('screenplay-auto'));
      if (!hasDocChanges) return null;

      const { selection, doc } = newState;
      if (!(selection instanceof TextSelection)) return null;

      const $pos = selection.$from;
      const node = $pos.parent;

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

      // Rule 3: Character name detection — ALL CAPS line after empty/action
      if (CHARACTER_PATTERN.test(text.trim())) {
        const resolvedPos = doc.resolve($pos.start() - 1);
        const indexBefore = resolvedPos.index() - 1;
        if (indexBefore >= 0) {
          const prevNode = resolvedPos.parent.child(indexBefore);
          const prevText = prevNode.textContent.trim();
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

function createEnterKeyPlugin(): Plugin {
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

        // After dialogue → empty line switches to action
        if (nodeType === 'screenplayDialogue') {
          const text = node.textContent;
          if (text.trim() === '') {
            const start = selection.$from.start() - 1;
            tr.setNodeMarkup(start, schema.nodes.screenplayAction);
            view.dispatch(tr);
            return true;
          }
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
