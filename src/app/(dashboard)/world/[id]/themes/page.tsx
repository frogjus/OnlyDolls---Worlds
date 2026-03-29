'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Lightbulb,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react'

import type { Theme, CreateThemePayload, UpdateThemePayload } from '@/types'
import {
  useThemes,
  useCreateTheme,
  useUpdateTheme,
  useDeleteTheme,
} from '@/lib/hooks/use-themes'
import { useThemeStore } from '@/stores/theme-store'
import { EmptyState } from '@/components/empty-states/empty-state'

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
      },
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
    update.mutate(form, { onSuccess: () => setEditingThemeId(null) })
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
// Theme Card
// ---------------------------------------------------------------------------

function ThemeCard({
  theme,
  worldId,
}: {
  theme: Theme
  worldId: string
}) {
  const { setEditingThemeId, setSelectedThemeId } = useThemeStore()
  const deleteTheme = useDeleteTheme(worldId)

  return (
    <Card
      className="group cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => setSelectedThemeId(theme.id)}
    >
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <Lightbulb className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base truncate">{theme.name}</CardTitle>
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
                deleteTheme.mutate(theme.id)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
            <p className="text-sm text-muted-foreground italic">No description</p>
          )
        )}
      </CardContent>
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
        <Card key={i}>
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
    <EmptyState
      icon={Lightbulb}
      title="No themes yet"
      description="Track the thematic ideas, arguments, and motifs woven through your story. Define thematic oppositions and trace how themes manifest across scenes."
      primaryAction={{ label: 'New Theme', onClick: () => setCreateDialogOpen(true) }}
    />
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
          <h1 className="text-2xl font-bold">Themes</h1>
          <p className="text-sm text-muted-foreground">
            {themes.length > 0
              ? `${themes.length} theme${themes.length === 1 ? '' : 's'}`
              : 'Thematic ideas, arguments, and motifs in your story.'}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Theme
        </Button>
      </div>

      {isLoading ? (
        <ThemeSkeletons />
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
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
