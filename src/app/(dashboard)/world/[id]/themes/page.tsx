'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Lightbulb,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

import type { Theme, CreateThemePayload, UpdateThemePayload } from '@/types'
import {
  useThemes,
  useCreateTheme,
  useUpdateTheme,
  useDeleteTheme,
} from '@/lib/hooks/use-themes'
import { useThemeStore } from '@/stores/theme-store'
import { showSuccess, showError } from '@/lib/toast'

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
import { Skeleton } from '@/components/ui/skeleton'

// ---------------------------------------------------------------------------
// Create Dialog
// ---------------------------------------------------------------------------

function CreateThemeDialog({ worldId }: { worldId: string }) {
  const { createDialogOpen, setCreateDialogOpen } = useThemeStore()
  const create = useCreateTheme(worldId)
  const [form, setForm] = useState<CreateThemePayload>({ name: '' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    create.mutate(form, {
      onSuccess: () => {
        setCreateDialogOpen(false)
        setForm({ name: '' })
        showSuccess('Theme created')
      },
      onError: () => showError('Failed to create theme'),
    })
  }

  return (
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Theme</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-name">Name *</Label>
            <Input
              id="create-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Redemption, Power vs. Freedom"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-thesis">Thesis</Label>
            <Input
              id="create-thesis"
              value={form.thesis ?? ''}
              onChange={(e) => setForm({ ...form, thesis: e.target.value })}
              placeholder="The thematic argument or statement"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-desc">Description</Label>
            <Textarea
              id="create-desc"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="How this theme manifests in your story..."
              rows={3}
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
            <Button type="submit" disabled={create.isPending || !form.name.trim()}>
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

function EditThemeDialog({
  worldId,
  theme,
}: {
  worldId: string
  theme: Theme
}) {
  const { setEditingThemeId } = useThemeStore()
  const update = useUpdateTheme(worldId)

  const [form, setForm] = useState<UpdateThemePayload & { id: string }>({
    id: theme.id,
    name: theme.name,
    thesis: theme.thesis ?? '',
    description: theme.description ?? '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate(form, {
      onSuccess: () => {
        setEditingThemeId(null)
        showSuccess('Theme updated')
      },
      onError: () => showError('Failed to update theme'),
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && setEditingThemeId(null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Theme</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              value={form.name ?? ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-thesis">Thesis</Label>
            <Input
              id="edit-thesis"
              value={form.thesis ?? ''}
              onChange={(e) => setForm({ ...form, thesis: e.target.value })}
              placeholder="The thematic argument or statement"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea
              id="edit-desc"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingThemeId(null)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={update.isPending || !form.name?.trim()}>
              {update.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Analysis helper
// ---------------------------------------------------------------------------

function getAnalysis(entity: { metadata?: unknown }): Record<string, unknown> | null {
  const meta = entity.metadata as Record<string, unknown> | null
  if (!meta || typeof meta !== 'object') return null
  const analysis = meta.analysis as Record<string, unknown> | null
  return analysis && typeof analysis === 'object' ? analysis : null
}

// ---------------------------------------------------------------------------
// Theme Card
// ---------------------------------------------------------------------------

function ThemeCard({
  theme,
  worldId,
}: {
  theme: Theme
  worldId: string
}) {
  const { setEditingThemeId } = useThemeStore()
  const deleteTheme = useDeleteTheme(worldId)
  const [expanded, setExpanded] = useState(false)

  const analysis = getAnalysis(theme)

  return (
    <Card className="group bg-card border-border">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <Lightbulb className="h-5 w-5 text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base truncate">{theme.name}</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          {analysis && (
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingThemeId(theme.id)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  if (!window.confirm('Delete this theme? This cannot be undone.')) return
                  deleteTheme.mutate(theme.id, {
                    onSuccess: () => showSuccess('Theme deleted'),
                    onError: () => showError('Failed to delete theme'),
                  })
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {theme.thesis && (
          <p className="text-sm italic text-muted-foreground mb-2">
            {theme.thesis}
          </p>
        )}
        {theme.description ? (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {theme.description}
          </p>
        ) : (
          !theme.thesis && (
            <p className="text-sm text-muted-foreground/60 italic">No description</p>
          )
        )}
      </CardContent>

      {expanded && analysis && (
        <div className="border-t border-border px-6 pb-4 pt-3 space-y-4">
          {analysis.thesis && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Thesis</h4>
              <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">{analysis.thesis as string}</p>
            </div>
          )}
          {analysis.manifestation && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Manifestation</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{analysis.manifestation as string}</p>
            </div>
          )}
          {Array.isArray(analysis.symbolicAnchors) && (analysis.symbolicAnchors as string[]).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Symbolic Anchors</h4>
              <div className="flex flex-wrap gap-1">
                {(analysis.symbolicAnchors as string[]).map((s, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          )}
          {analysis.evolution && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Evolution</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{analysis.evolution as string}</p>
            </div>
          )}
          {analysis.opposition && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Opposition</h4>
              <p className="text-sm text-muted-foreground">{analysis.opposition as string}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Loading Skeletons
// ---------------------------------------------------------------------------

function ThemeSkeletons() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="bg-card border-border">
          <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
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
// Empty State
// ---------------------------------------------------------------------------

function ThemesEmptyState() {
  const { setCreateDialogOpen } = useThemeStore()
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted p-14 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card shadow-[0_0_25px_rgba(20,184,166,0.08)]">
        <Lightbulb className="h-10 w-10 text-teal-300/70" />
      </div>
      <h3 className="mt-6 font-heading text-lg font-semibold tracking-tight text-foreground">No themes yet</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        Track the thematic ideas, arguments, and motifs woven through your story. Define thematic oppositions and trace how themes manifest across scenes.
      </p>
      <Button
        className="mt-6 bg-primary text-primary-foreground hover:bg-[#0d9488] shadow-sm hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all duration-200"
        onClick={() => setCreateDialogOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        New Theme
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ThemesPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const { data, isLoading, error } = useThemes(worldId)
  const {
    editingThemeId,
    setCreateDialogOpen,
  } = useThemeStore()

  const themes = data?.data ?? []
  const editingTheme = themes.find((t) => t.id === editingThemeId)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.015em] text-foreground">Themes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {themes.length > 0
              ? `${themes.length} theme${themes.length === 1 ? '' : 's'}`
              : 'Thematic ideas, arguments, and motifs in your story.'}
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-[#0d9488] shadow-sm hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all duration-200"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Theme
        </Button>
      </div>

      {isLoading ? (
        <ThemeSkeletons />
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load themes. Please try again.
        </div>
      ) : themes.length === 0 ? (
        <ThemesEmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              worldId={worldId}
            />
          ))}
        </div>
      )}

      <CreateThemeDialog worldId={worldId} />
      {editingTheme && (
        <EditThemeDialog worldId={worldId} theme={editingTheme} />
      )}
    </div>
  )
}
