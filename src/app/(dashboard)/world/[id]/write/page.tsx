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
  const { data: activeManuscriptData } = useManuscript(worldId, activeManuscriptId)
  const createManuscript = useCreateManuscript(worldId)
  const saveContent = useSaveContent(worldId)

  const contentRef = useRef<JSONContent | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const activeIdRef = useRef(activeManuscriptId)
  activeIdRef.current = activeManuscriptId

  const saveRef = useRef(saveContent)
  saveRef.current = saveContent

  // Track the active section ID from the fetched manuscript data
  const activeSectionIdRef = useRef<string | null>(null)
  useEffect(() => {
    activeSectionIdRef.current = activeManuscriptData?.activeSectionId ?? null
  }, [activeManuscriptData?.activeSectionId])

  useEffect(() => {
    if (!activeManuscriptId && manuscripts?.length) {
      setActiveManuscriptId(manuscripts[0].id)
    }
  }, [manuscripts, activeManuscriptId, setActiveManuscriptId])

  // Bug 3: Cancel pending save when switching manuscripts
  useEffect(() => {
    return () => {
      // Cancel any in-flight save and debounce timer on unmount or manuscript switch
      if (timerRef.current) clearTimeout(timerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [activeManuscriptId])

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
        const manuscriptId = activeIdRef.current
        const sectionId = activeSectionIdRef.current
        if (contentRef.current && manuscriptId && sectionId) {
          // Cancel any previous in-flight save before starting a new one
          if (abortRef.current) abortRef.current.abort()
          const controller = new AbortController()
          abortRef.current = controller

          saveRef.current.mutate(
            {
              manuscriptId,
              sectionId,
              content: contentRef.current,
              signal: controller.signal,
            },
            {
              onSuccess: () => {
                setIsDirty(false)
                showSuccess('Draft saved')
              },
              onError: (err) => {
                // Don't show error for aborted saves
                if (err instanceof DOMException && err.name === 'AbortError') return
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
        <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2">
          <Skeleton className="h-8 w-24 bg-muted" />
          <Skeleton className="h-8 w-24 bg-muted" />
          <Skeleton className="ml-auto h-8 w-48 bg-muted" />
        </div>
        <div className="flex flex-1">
          <div className="flex-1 p-6">
            <Skeleton className="h-full w-full bg-muted" />
          </div>
          <Skeleton className="h-full w-72 bg-card" />
        </div>
      </div>
    )
  }

  if (!manuscripts?.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-14">
        <div className="flex flex-col items-center rounded-xl border border-border bg-muted p-14 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card shadow-[0_0_25px_rgba(20,184,166,0.08)]">
            <FileText className="h-10 w-10 text-teal-300/70" />
          </div>
          <h3 className="mt-6 font-heading text-lg font-semibold tracking-tight text-foreground">No manuscript yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Create your first manuscript to start writing
          </p>
          <Button onClick={handleCreate} disabled={createManuscript.isPending} className="mt-6 bg-primary text-primary-foreground hover:bg-[#0d9488] shadow-sm hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all duration-200">
            <Plus className="size-4" />
            Create Manuscript
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2">
        <div className="flex items-center rounded-lg border border-border bg-muted p-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode('prose')}
            className={mode === 'prose' ? 'bg-primary/15 text-teal-300 hover:bg-primary/20 hover:text-teal-200' : 'text-muted-foreground hover:text-foreground'}
          >
            <BookOpen className="size-4" />
            Prose
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode('screenplay')}
            className={mode === 'screenplay' ? 'bg-primary/15 text-teal-300 hover:bg-primary/20 hover:text-teal-200' : 'text-muted-foreground hover:text-foreground'}
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
            <SelectTrigger className="w-48 border-border bg-muted focus:ring-primary/30">
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
        {activeManuscriptData ? (
          <StoryEditor
            key={activeManuscriptId}
            content={activeManuscriptData.content}
            onUpdate={handleUpdate}
            mode={mode}
            worldId={worldId}
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
