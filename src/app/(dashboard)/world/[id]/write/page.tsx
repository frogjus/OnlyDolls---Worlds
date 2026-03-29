'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import type { JSONContent } from '@tiptap/react'
import { BookOpen, Clapperboard, Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { StoryEditor } from '@/components/editors/story-editor'
import { useEditorUI } from '@/stores/editor-store'
import { showSuccess, showError } from '@/lib/toast'
import {
  useManuscripts,
  useManuscript,
  useCreateManuscript,
  useSaveContent,
} from '@/lib/hooks/use-manuscripts'
import '@/components/editors/editor.css'
import '@/components/editors/screenplay.css'

function extractText(content: JSONContent): string {
  if (!content) return ''
  let text = ''
  if (content.text) text += content.text
  if (content.content) {
    for (const child of content.content) {
      text += extractText(child) + ' '
    }
  }
  return text
}

export default function WritePage() {
  const { id: worldId } = useParams<{ id: string }>()
  const {
    mode,
    activeManuscriptId,
    isDirty,
    setMode,
    setWordCount,
    setActiveManuscriptId,
    setIsDirty,
    toggleFocusMode,
  } = useEditorUI()

  const { data: manuscripts, isLoading } = useManuscripts(worldId)
  const { data: activeManuscript } = useManuscript(worldId, activeManuscriptId)
  const createManuscript = useCreateManuscript(worldId)
  const saveContent = useSaveContent(worldId)

  const contentRef = useRef<JSONContent | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeIdRef = useRef(activeManuscriptId)
  activeIdRef.current = activeManuscriptId

  const saveRef = useRef(saveContent)
  saveRef.current = saveContent

  useEffect(() => {
    if (!activeManuscriptId && manuscripts?.length) {
      setActiveManuscriptId(manuscripts[0].id)
    }
  }, [manuscripts, activeManuscriptId, setActiveManuscriptId])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault()
        toggleFocusMode()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleFocusMode])

  const handleUpdate = useCallback(
    (content: JSONContent) => {
      contentRef.current = content
      setIsDirty(true)

      const text = extractText(content)
      const words = text.trim() ? text.trim().split(/\s+/).length : 0
      setWordCount(words)

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        if (contentRef.current && activeIdRef.current) {
          saveRef.current.mutate(
            { id: activeIdRef.current, content: contentRef.current },
            {
              onSuccess: () => {
                setIsDirty(false)
                showSuccess('Draft saved')
              },
              onError: () => {
                showError('Failed to save')
              },
            },
          )
        }
      }, 2000)
    },
    [setIsDirty, setWordCount],
  )

  const handleCreate = () => {
    createManuscript.mutate(
      { title: 'Untitled Manuscript' },
      { onSuccess: (data) => setActiveManuscriptId(data.id) },
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-slate-700/50 bg-slate-900/30 px-4 py-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="ml-auto h-8 w-48" />
        </div>
        <div className="flex flex-1">
          <div className="flex-1 p-6">
            <Skeleton className="h-full w-full" />
          </div>
          <Skeleton className="h-full w-72" />
        </div>
      </div>
    )
  }

  if (!manuscripts?.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <FileText className="size-12 text-teal-500/40" />
        <p className="text-lg text-muted-foreground">No manuscript yet</p>
        <Button onClick={handleCreate} disabled={createManuscript.isPending} className="bg-teal-600 hover:bg-teal-500 text-white">
          <Plus className="size-4" />
          Create Manuscript
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-700/50 bg-slate-900/30 px-4 py-2">
        <div className="flex items-center rounded-lg border border-teal-500/20 bg-slate-900/60 p-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode('prose')}
            className={mode === 'prose' ? 'bg-teal-600/20 text-teal-300 hover:bg-teal-600/30 hover:text-teal-200' : 'text-slate-400 hover:text-slate-200'}
          >
            <BookOpen className="size-4" />
            Prose
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode('screenplay')}
            className={mode === 'screenplay' ? 'bg-teal-600/20 text-teal-300 hover:bg-teal-600/30 hover:text-teal-200' : 'text-slate-400 hover:text-slate-200'}
          >
            <Clapperboard className="size-4" />
            Screenplay
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {manuscripts.length > 1 && (
          <Select
            value={activeManuscriptId ?? ''}
            onValueChange={setActiveManuscriptId}
          >
            <SelectTrigger className="w-48 border-teal-500/20 bg-slate-900/60 focus:ring-teal-500/30">
              <SelectValue placeholder="Select manuscript" />
            </SelectTrigger>
            <SelectContent>
              {manuscripts.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {isDirty && (
          <span className="ml-auto text-xs text-teal-400/60">Unsaved changes</span>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden shadow-[inset_0_2px_12px_rgba(0,0,0,0.3)]">
        {activeManuscript ? (
          <StoryEditor
            key={activeManuscriptId}
            content={activeManuscript.content}
            onUpdate={handleUpdate}
            mode={mode}
            className={cn('flex-1 border-0 rounded-none')}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <Skeleton className="h-3/4 w-3/4" />
          </div>
        )}
      </div>
    </div>
  )
}
