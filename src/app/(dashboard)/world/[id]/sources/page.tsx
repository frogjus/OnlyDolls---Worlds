'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
  Upload,
  BookOpen,
} from 'lucide-react'

import type { SourceMaterial, CreateSourceMaterialPayload, UpdateSourceMaterialPayload } from '@/types'
import {
  useSources,
  useCreateSource,
  useUpdateSource,
  useDeleteSource,
} from '@/lib/hooks/use-sources'
import { useSourceStore } from '@/stores/source-store'
import { IngestionFlow } from '@/components/ingestion/ingestion-flow'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// ---------------------------------------------------------------------------
// Create Dialog
// ---------------------------------------------------------------------------

function CreateSourceDialog({ worldId }: { worldId: string }) {
  const { createDialogOpen, setCreateDialogOpen } = useSourceStore()
  const create = useCreateSource(worldId)
  const [form, setForm] = useState<CreateSourceMaterialPayload>({ title: '' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    create.mutate(form, {
      onSuccess: () => {
        setCreateDialogOpen(false)
        setForm({ title: '' })
      },
    })
  }

  return (
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Source Material</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-title">Title *</Label>
            <Input
              id="create-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Original Manuscript"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-sourceType">Type</Label>
            <Input
              id="create-sourceType"
              value={form.sourceType ?? ''}
              onChange={(e) => setForm({ ...form, sourceType: e.target.value })}
              placeholder="e.g. novel, screenplay, research"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-author">Author</Label>
            <Input
              id="create-author"
              value={form.author ?? ''}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              placeholder="Author name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-url">URL</Label>
            <Input
              id="create-url"
              value={form.url ?? ''}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-content">Content</Label>
            <Textarea
              id="create-content"
              value={form.content ?? ''}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Paste or type source content..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-notes">Notes</Label>
            <Textarea
              id="create-notes"
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || !form.title.trim()}>
              {create.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Edit Dialog
// ---------------------------------------------------------------------------

function EditSourceDialog({
  worldId,
  source,
}: {
  worldId: string
  source: SourceMaterial
}) {
  const { setEditingSourceId } = useSourceStore()
  const update = useUpdateSource(worldId)

  const [form, setForm] = useState<UpdateSourceMaterialPayload & { id: string }>({
    id: source.id,
    title: source.title,
    sourceType: source.type ?? '',
    author: source.author ?? '',
    url: source.url ?? '',
    content: source.content ?? '',
    notes: source.notes ?? '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate(form, { onSuccess: () => setEditingSourceId(null) })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && setEditingSourceId(null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Source Material</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={form.title ?? ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-sourceType">Type</Label>
            <Input
              id="edit-sourceType"
              value={form.sourceType ?? ''}
              onChange={(e) => setForm({ ...form, sourceType: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-author">Author</Label>
            <Input
              id="edit-author"
              value={form.author ?? ''}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-url">URL</Label>
            <Input
              id="edit-url"
              value={form.url ?? ''}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-content">Content</Label>
            <Textarea
              id="edit-content"
              value={form.content ?? ''}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingSourceId(null)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={update.isPending || !form.title?.trim()}>
              {update.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Source Card
// ---------------------------------------------------------------------------

function SourceCard({
  source,
  worldId,
}: {
  source: SourceMaterial
  worldId: string
}) {
  const { setEditingSourceId } = useSourceStore()
  const deleteSrc = useDeleteSource(worldId)

  return (
    <Link href={`/world/${worldId}/sources/${source.id}`}>
      <Card className="group cursor-pointer border-slate-700/50 bg-slate-900/80 transition-all hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/5">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800">
            <FileText className="h-5 w-5 text-teal-400" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{source.title}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {source.type && (
                <Badge variant="secondary" className="text-xs">
                  {source.type}
                </Badge>
              )}
              {source.author && (
                <span className="text-xs text-muted-foreground">
                  by {source.author}
                </span>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground opacity-0 group-hover:opacity-100"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setEditingSourceId(source.id)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  deleteSrc.mutate(source.id)
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {source.content ? (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {source.content}
            </p>
          ) : source.notes ? (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {source.notes}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No content</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                Open link
              </a>
            )}
            {source.createdAt && (
              <span className="text-xs text-muted-foreground">
                {new Date(source.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Loading Skeletons
// ---------------------------------------------------------------------------

function SourceSkeletons() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-5 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty State — ingest-first
// ---------------------------------------------------------------------------

function EmptyState({ worldId }: { worldId: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/60 p-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-slate-800/80 shadow-[0_0_25px_rgba(20,184,166,0.08)]">
        <BookOpen className="size-8 text-teal-400/70" />
      </div>
      <h3 className="mt-6 text-xl font-bold text-slate-100">Bring your story to life</h3>
      <p className="mt-2 max-w-md text-sm text-slate-400">
        Upload a manuscript, screenplay, or reference material to start building
        your story world. We&apos;ll analyze the content and extract characters,
        locations, events, and more.
      </p>
      <div className="mt-8 w-full max-w-lg">
        <IngestionFlow worldId={worldId} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SourcesPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const { data, isLoading, error } = useSources(worldId)
  const {
    editingSourceId,
    setCreateDialogOpen,
  } = useSourceStore()

  const sources = data?.data ?? []
  const editingSource = sources.find((s) => s.id === editingSourceId)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sources</h1>
          <p className="text-sm text-muted-foreground">
            Upload and analyze your story materials
          </p>
        </div>
        {sources.length > 0 && (
          <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Manually
          </Button>
        )}
      </div>

      {/* Upload Dropzone — always visible when sources exist */}
      {!isLoading && !error && sources.length > 0 && (
        <IngestionFlow worldId={worldId} />
      )}

      {/* Content */}
      {isLoading ? (
        <SourceSkeletons />
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load sources. Please try again.
        </div>
      ) : sources.length === 0 ? (
        <EmptyState worldId={worldId} />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              {sources.length} source{sources.length === 1 ? '' : 's'}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sources.map((source) => (
              <SourceCard key={source.id} source={source} worldId={worldId} />
            ))}
          </div>
        </>
      )}

      {/* Dialogs */}
      <CreateSourceDialog worldId={worldId} />
      {editingSource && (
        <EditSourceDialog worldId={worldId} source={editingSource} />
      )}
    </div>
  )
}
