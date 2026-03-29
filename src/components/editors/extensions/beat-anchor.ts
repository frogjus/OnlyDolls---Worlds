import { Node, mergeAttributes } from '@tiptap/core'

export interface BeatAnchorOptions {
  onBeatClick?: (beatId: string) => void
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    beatAnchorNode: {
      insertBeatAnchorNode: (attrs: {
        beatId: string
        beatTitle: string
        beatColor?: string
      }) => ReturnType
    }
  }
}

export const BeatAnchorNode = Node.create<BeatAnchorOptions>({
  name: 'beatAnchorNode',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: false,
  draggable: false,

  addOptions() {
    return { onBeatClick: undefined }
  },

  addAttributes() {
    return {
      beatId: { default: null },
      beatTitle: { default: '' },
      beatColor: { default: '#6366f1' },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-beat-id]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-beat-id': node.attrs.beatId,
        contenteditable: 'false',
        class: 'beat-anchor-marker',
        style: `background-color: ${node.attrs.beatColor}20; border-left: 3px solid ${node.attrs.beatColor}; padding: 1px 6px; border-radius: 2px; font-size: 0.75em; color: ${node.attrs.beatColor}; user-select: none; cursor: default;`,
      }),
      node.attrs.beatTitle,
    ]
  },

  addCommands() {
    return {
      insertBeatAnchorNode:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          })
        },
    }
  },
})
