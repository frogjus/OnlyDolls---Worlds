'use client'

import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Maximize2,
  Minimize2,
  BookOpen,
  Clapperboard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useEditorUI } from '@/stores/editor-store'

interface EditorToolbarProps {
  editor: Editor | null
}

function EditorToolbar({ editor }: EditorToolbarProps) {
  const { mode, focusMode, toggleFocusMode } = useEditorUI()

  if (!editor) {
    return null
  }

  const wordCount = editor.storage.characterCount?.words() ?? 0

  return (
    <div className="flex items-center gap-0.5 border-b border-border bg-card px-2 py-1">
      {/* Inline formatting */}
      <ToolbarButton
        editor={editor}
        action={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        icon={<Bold className="size-4" />}
        label="Bold"
      />
      <ToolbarButton
        editor={editor}
        action={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        icon={<Italic className="size-4" />}
        label="Italic"
      />
      <ToolbarButton
        editor={editor}
        action={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        icon={<Underline className="size-4" />}
        label="Underline"
      />
      <ToolbarButton
        editor={editor}
        action={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        icon={<Strikethrough className="size-4" />}
        label="Strikethrough"
      />

      <Separator orientation="vertical" className="mx-1.5 h-5 bg-border" />

      {/* Headings */}
      <ToolbarButton
        editor={editor}
        action={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        icon={<Heading1 className="size-4" />}
        label="Heading 1"
      />
      <ToolbarButton
        editor={editor}
        action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        icon={<Heading2 className="size-4" />}
        label="Heading 2"
      />
      <ToolbarButton
        editor={editor}
        action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        icon={<Heading3 className="size-4" />}
        label="Heading 3"
      />

      <Separator orientation="vertical" className="mx-1.5 h-5 bg-border" />

      {/* Lists & blockquote */}
      <ToolbarButton
        editor={editor}
        action={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        icon={<List className="size-4" />}
        label="Bullet List"
      />
      <ToolbarButton
        editor={editor}
        action={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        icon={<ListOrdered className="size-4" />}
        label="Ordered List"
      />
      <ToolbarButton
        editor={editor}
        action={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        icon={<Quote className="size-4" />}
        label="Blockquote"
      />

      <Separator orientation="vertical" className="mx-1.5 h-5 bg-border" />

      {/* History */}
      <ToolbarButton
        editor={editor}
        action={() => editor.chain().focus().undo().run()}
        isActive={false}
        icon={<Undo className="size-4" />}
        label="Undo"
        disabled={!editor.can().undo()}
      />
      <ToolbarButton
        editor={editor}
        action={() => editor.chain().focus().redo().run()}
        isActive={false}
        icon={<Redo className="size-4" />}
        label="Redo"
        disabled={!editor.can().redo()}
      />

      {/* Word count + mode indicator + focus toggle */}
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-teal-400/60">
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </span>
        <Separator orientation="vertical" className="h-4 bg-border" />
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {mode === 'prose' ? <BookOpen className="size-3" /> : <Clapperboard className="size-3" />}
          {mode === 'prose' ? 'Prose' : 'Screenplay'}
        </span>
        <Separator orientation="vertical" className="h-4 bg-border" />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFocusMode}
          aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
          className="size-7 text-muted-foreground hover:text-teal-300 hover:bg-primary/10"
          title={focusMode ? 'Exit focus mode (Escape)' : 'Focus mode (Ctrl+Shift+F)'}
        >
          {focusMode ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </Button>
      </div>
    </div>
  )
}

function ToolbarButton({
  action,
  isActive,
  icon,
  label,
  disabled,
}: {
  editor: Editor
  action: () => void
  isActive: boolean
  icon: React.ReactNode
  label: string
  disabled?: boolean
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={action}
      disabled={disabled}
      aria-label={label}
      className={cn('size-8 text-muted-foreground hover:text-teal-300 hover:bg-primary/10', isActive && 'bg-primary/15 text-teal-300')}
    >
      {icon}
    </Button>
  )
}

export { EditorToolbar }
