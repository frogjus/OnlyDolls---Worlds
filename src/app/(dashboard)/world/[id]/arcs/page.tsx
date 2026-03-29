'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  TrendingUp,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react'

import type { Arc, CreateArcPayload, UpdateArcPayload } from '@/types'
import {
  useArcs,
  useCreateArc,
  useUpdateArc,
  useDeleteArc,
} from '@/lib/hooks/use-arcs'
import { useArcStore } from '@/stores/arc-store'
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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// ---------------------------------------------------------------------------
// Create Dialog
// ---------------------------------------------------------------------------

function CreateArcDialog({ worldId }: { worldId: string }) {
  const { createDialogOpen, setCreateDialogOpen } = useArcStore()
  const create = useCreateArc(worldId)
  const [form, setForm] = useState<CreateArcPayload>({ name: '' })

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
          <DialogTitle>New Arc</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-name">Name *</Label>
            <Input
              id="create-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Redemption Arc"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-arcType">Arc Type</Label>
            <Input
              id="create-arcType"
              value={form.arcType ?? ''}
              onChange={(e) => setForm({ ...form, arcType: e.target.value })}
              placeholder="e.g. character, thematic, relational"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-characterId">Character ID</Label>
            <Input
              id="create-characterId"
              value={form.characterId ?? ''}
              onChange={(e) => setForm({ ...form, characterId: e.target.value || undefined })}
              placeholder="Optional character ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-desc">Description</Label>
            <Textarea
              id="create-desc"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the arc's progression..."
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

function EditArcDialog({
  worldId,
  arc,
}: {
  worldId: string
  arc: Arc
}) {
  const { setEditingArcId } = useArcStore()
  const update = useUpdateArc(worldId)

  const [form, setForm] = useState<UpdateArcPayload & { id: string }>({
    id: arc.id,
    name: arc.name,
    arcType: arc.type ?? '',
    description: arc.description ?? '',
    characterId: arc.characterId ?? '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate(form, { onSuccess: () => setEditingArcId(null) })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && setEditingArcId(null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Arc</DialogTitle>
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
            <Label htmlFor="edit-arcType">Arc Type</Label>
            <Input
              id="edit-arcType"
              value={form.arcType ?? ''}
              onChange={(e) => setForm({ ...form, arcType: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-characterId">Character ID</Label>
            <Input
              id="edit-characterId"
              value={form.characterId ?? ''}
              onChange={(e) => setForm({ ...form, characterId: e.target.value || null })}
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
              onClick={() => setEditingArcId(null)}
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
// Arc Card
// ---------------------------------------------------------------------------

function ArcCard({
  arc,
  worldId,
}: {
  arc: Arc
  worldId: string
}) {
  const { setEditingArcId } = useArcStore()
  const deleteArc = useDeleteArc(worldId)

  return (
    <Card className="group cursor-pointer transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base truncate">{arc.name}</CardTitle>
          {arc.type && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {arc.type}
            </Badge>
          )}
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
                setEditingArcId(arc.id)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                deleteArc.mutate(arc.id)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {arc.description ? (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {arc.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No description</p>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Loading Skeletons
// ---------------------------------------------------------------------------

function ArcSkeletons() {
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

function ArcsEmptyState() {
  const { setCreateDialogOpen } = useArcStore()
  return (
    <EmptyState
      icon={TrendingUp}
      title="No arcs yet"
      description="Track character arcs, plot arcs, and thematic throughlines as they progress across your story."
      primaryAction={{ label: 'New Arc', onClick: () => setCreateDialogOpen(true) }}
    />
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ArcsPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const { data, isLoading, error } = useArcs(worldId)
  const {
    editingArcId,
    setCreateDialogOpen,
  } = useArcStore()

  const arcs = data?.data ?? []
  const editingArc = arcs.find((a) => a.id === editingArcId)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Arcs</h1>
          <p className="text-sm text-muted-foreground">
            {arcs.length > 0
              ? `${arcs.length} arc${arcs.length === 1 ? '' : 's'}`
              : 'Story arcs, phases, and structure template overlays.'}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Arc
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <ArcSkeletons />
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load arcs. Please try again.
        </div>
      ) : arcs.length === 0 ? (
        <ArcsEmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {arcs.map((arc) => (
            <ArcCard key={arc.id} arc={arc} worldId={worldId} />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateArcDialog worldId={worldId} />
      {editingArc && (
        <EditArcDialog worldId={worldId} arc={editingArc} />
      )}
    </div>
  )
}
