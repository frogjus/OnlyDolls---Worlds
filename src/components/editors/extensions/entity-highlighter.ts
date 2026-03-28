import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { EntityRegistry, type EntityMention } from '@/lib/entity-registry';

export interface EntityHighlighterOptions {
  worldId: string;
  registry?: EntityRegistry;
  onEntityClick?: (entityId: string, rect: DOMRect) => void;
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
            if (!onUnknownEntity || !registry) return false;

            const { state } = view;
            const $pos = state.doc.resolve(pos);
            const node = $pos.parent;
            const text = node.textContent;

            const offsetInNode = pos - $pos.start();
            const wordMatch = getWordAt(text, offsetInNode);
            if (!wordMatch) return false;

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
    const blockStart = pos + 1;

    for (const mention of mentions) {
      const from = blockStart + mention.from;
      const to = blockStart + mention.to;

      decorations.push(
        Decoration.inline(from, to, {
          class: `entity-highlight entity-${mention.entityType}`,
          'data-entity-id': mention.entityId,
          'data-entity-type': mention.entityType,
          style: `background-color: ${mention.color}20; border-bottom: 2px solid ${mention.color}; cursor: pointer;`,
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
