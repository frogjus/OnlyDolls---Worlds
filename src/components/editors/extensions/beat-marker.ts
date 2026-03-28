import { Node, Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

/**
 * Invisible block atom node that marks the start of a beat's
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
  onBeatClick?: (beatId: string) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    beatMarker: {
      insertBeatAnchor: (attrs: { beatId: string; beatTitle: string; beatColor: string }) => ReturnType;
      removeBeatAnchor: (beatId: string) => ReturnType;
      scrollToBeat: (beatId: string) => ReturnType;
    };
  }
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
      insertBeatAnchor: (attrs: { beatId: string; beatTitle: string; beatColor: string }) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: 'beatAnchor',
              attrs,
            })
            .run();
        },

      removeBeatAnchor: (beatId: string) =>
        ({ tr, state }) => {
          state.doc.descendants((node, pos) => {
            if (node.type.name === 'beatAnchor' && node.attrs.beatId === beatId) {
              tr.delete(pos, pos + node.nodeSize);
            }
          });
          return true;
        },

      scrollToBeat: (beatId: string) =>
        ({ editor }) => {
          let targetPos: number | null = null;
          editor.state.doc.descendants((node, pos) => {
            if (node.type.name === 'beatAnchor' && node.attrs.beatId === beatId) {
              targetPos = pos;
              return false;
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
