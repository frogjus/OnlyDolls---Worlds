'use client'

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import type { JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CharacterCount from '@tiptap/extension-character-count'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Dropcursor from '@tiptap/extension-dropcursor'
import Gapcursor from '@tiptap/extension-gapcursor'
import Placeholder from '@tiptap/extension-placeholder'
import { cn } from '@/lib/utils'
import { useEditorUI } from '@/stores/editor-store'
import { EditorToolbar } from './editor-toolbar'
import { BeatAnchorNode } from './extensions/beat-anchor'
import { ScreenplayMode } from './extensions/screenplay-mode'
import { EntityHighlighter } from './extensions/entity-highlighter'
import { AIWandExtension } from './extensions/ai-wand'
import './editor.css'
import './focus-mode.css'

type EditorMode = 'prose' | 'screenplay'

interface StoryEditorProps {
  content: JSONContent | null
  onUpdate: (content: JSONContent) => void
  mode?: EditorMode
  editable?: boolean
  className?: string
  placeholder?: string
  worldId?: string
}

function StoryEditor({
  content,
  onUpdate,
  mode = 'prose',
  editable = true,
  className,
  placeholder = 'Start writing...',
  worldId,
}: StoryEditorProps) {
  const { focusMode, exitFocusMode } = useEditorUI()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        dropcursor: false,
        gapcursor: false,
      }),
      CharacterCount,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Typography,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Dropcursor,
      Gapcursor,
      Placeholder.configure({ placeholder }),
      BeatAnchorNode,
      // Screenplay nodes are always registered so the schema can parse them;
      // auto-format plugins only activate for screenplay node types.
      ScreenplayMode.configure({ enabled: mode === 'screenplay' }),
      // Entity highlighting — works when a registry is provided externally
      EntityHighlighter.configure({ worldId: worldId ?? '' }),
      // AI Wand — keyboard shortcut Mod-Shift-A to open, Escape to close
      AIWandExtension,
    ],
    content: content ?? undefined,
    editable,
    editorProps: {
      attributes: {
        class: cn(
          'storyforge-editor',
          mode === 'prose' ? 'prose-mode' : 'screenplay-mode'
        ),
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onUpdate(ed.getJSON())
    },
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusMode) {
        exitFocusMode()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusMode, exitFocusMode])

  return (
    <div className={cn('flex flex-col rounded-md border', className, focusMode && 'editor-focus-mode')}>
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export { StoryEditor }
export type { EditorMode }
