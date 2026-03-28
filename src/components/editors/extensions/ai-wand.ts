import { Extension } from '@tiptap/react'

/**
 * TipTap extension that adds AI Wand functionality to the editor.
 * Registers a command to trigger the AI wand panel for the current selection
 * or cursor position.
 */

declare module '@tiptap/react' {
  interface Commands<ReturnType> {
    aiWand: {
      openAIWand: () => ReturnType
      closeAIWand: () => ReturnType
      acceptAISuggestion: (text: string) => ReturnType
    }
  }
}

export interface AIWandStorage {
  isOpen: boolean
  selectedText: string
  cursorPosition: number
}

export const AIWandExtension = Extension.create<Record<string, never>, AIWandStorage>({
  name: 'aiWand',

  addStorage() {
    return {
      isOpen: false,
      selectedText: '',
      cursorPosition: 0,
    }
  },

  addCommands() {
    return {
      openAIWand:
        () =>
        ({ editor, commands }) => {
          const { from, to } = editor.state.selection
          const selectedText = editor.state.doc.textBetween(from, to, ' ')

          this.storage.isOpen = true
          this.storage.selectedText = selectedText
          this.storage.cursorPosition = from

          // Dispatch a custom event that the React panel component listens for
          const event = new CustomEvent('ai-wand-open', {
            detail: { selectedText, cursorPosition: from },
          })
          document.dispatchEvent(event)

          return commands.focus()
        },

      closeAIWand:
        () =>
        ({ commands }) => {
          this.storage.isOpen = false
          this.storage.selectedText = ''

          const event = new CustomEvent('ai-wand-close')
          document.dispatchEvent(event)

          return commands.focus()
        },

      acceptAISuggestion:
        (text: string) =>
        ({ editor, commands }) => {
          const { from, to } = editor.state.selection

          if (from !== to) {
            // Replace selected text
            editor.chain().deleteRange({ from, to }).insertContentAt(from, text).run()
          } else {
            // Insert at cursor
            editor.chain().insertContentAt(from, text).run()
          }

          this.storage.isOpen = false
          this.storage.selectedText = ''

          const event = new CustomEvent('ai-wand-close')
          document.dispatchEvent(event)

          return commands.focus()
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-a': () => this.editor.commands.openAIWand(),
      Escape: () => {
        if (this.storage.isOpen) {
          return this.editor.commands.closeAIWand()
        }
        return false
      },
    }
  },
})
