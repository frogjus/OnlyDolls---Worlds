'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Gem,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react'

import type { StoryObject, CreateObjectPayload, UpdateObjectPayload } from '@/types'
import {
  useObjects,
  useCreateObject,
  useUpdateObject,
  useDeleteObject,
} from '@/lib/hooks/use-objects'
import { useObjectStore } from '@/stores/object-store'
import { showSuccess, showError } from '@/lib/toast'
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

function CreateObjectDialog({ worldId }: { worldId: string }) {
  const { createDialogOpen, setCreateDialogOpen } = useObjectStore()
  const create = useCreateObject(worldId)
  const [form, setForm] = useState<CreateObjectPayload>({ name: '' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    create.mutate(form, {
      onSuccess: () => {
        setCreateDialogOpen(false)
        setForm({ name: '' })
        showSuccess('Object created')
      },
      onError: () => showError('Failed to create object'),
    })
  }

  return (
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Object</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-name">Name *</Label>
            <Input
              id="create-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. The Obsidian Blade"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-type">Type</Label>
            <Input
              id="create-type"
              value={form.objectType ?? ''}
              onChange={(e) => setForm({ ...form, objectType: e.target.value })}
              placeholder="e.g. weapon, artifact, document, macguffin"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-significance">Significance</Label>
            <Input
              id="create-significance"
              value={form.significance ?? ''}
              onChange={(e) => setForm({ ...form, significance: e.target.value })}
              placeholder="Narrative significance of this object"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-desc">Description</Label>
            <Textarea
              id="create-desc"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe this object..."
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

function EditObjectDialog({
  worldId,
  object,
}: {
  worldId: string
  object: StoryObject
}) {
  const { setEditingObjectId } = useObjectStore()
  const update = useUpdateObject(worldId)

  const [form, setForm] = useState<UpdateObjectPayload & { id: string }>({
    id: object.id,
    name: object.name,
    objectType: object.type ?? '',
    significance: object.significance ?? '',
    description: object.description ?? '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate(form, {
      onSuccess: () => {
        setEditingObjectId(null)
        showSuccess('Object updated')
      },
      onError: () => showError('Failed to update object'),
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && setEditingObjectId(null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Object</DialogTitle>
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
            <Label htmlFor="edit-type">Type</Label>
            <Input
              id="edit-type"
              value={form.objectType ?? ''}
              onChange={(e) => setForm({ ...form, objectType: e.target.value })}
              placeholder="e.g. weapon, artifact, document, macguffin"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-significance">Significance</Label>
            <Input
              id="edit-significance"
              value={form.significance ?? ''}
              onChange={(e) => setForm({ ...form, significance: e.target.value })}
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
              onClick={() => setEditingObjectId(null)}
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
// Object Card
// ---------------------------------------------------------------------------

function ObjectCard({
  object,
  worldId,
}: {
  object: StoryObject
  worldId: string
}) {
  const { setEditingObjectId, setSelectedObjectId } = useObjectStore()
  const deleteObject = useDeleteObject(worldId)

  return (
    <Card
      className="group cursor-pointer border-slate-700/50 bg-slate-900/80 transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5"
      onClick={() => setSelectedObjectId(object.id)}
    >
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800">
          <Gem className="h-5 w-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base truncate">{object.name}</CardTitle>
          {object.type && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {object.type}
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
                setEditingObjectId(object.id)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                if (!window.confirm('Delete this object? This cannot be undone.')) return
                deleteObject.mutate(object.id, {
                  onSuccess: () => showSuccess('Object deleted'),
                  onError: () => showError('Failed to delete object'),
                })
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {object.description ? (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {object.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No description</p>
        )}
        {object.significance && (
          <p className="text-xs text-muted-foreground mt-2">
            {object.significance}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Loading Skeletons
// ---------------------------------------------------------------------------

function ObjectSkeletons() {
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

function ObjectsEmptyState() {
  const { setCreateDialogOpen } = useObjectStore()
  return (
    <EmptyState
      icon={Gem}
      title="No objects yet"
      description="Track significant items, artifacts, and props in your story. From Chekhov's gun to magical macguffins — every object that matters."
      primaryAction={{ label: 'New Object', onClick: () => setCreateDialogOpen(true) }}
    />
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ObjectsPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const { data, isLoading, error } = useObjects(worldId)
  const {
    editingObjectId,
    setCreateDialogOpen,
  } = useObjectStore()

  const objects = data?.data ?? []
  const editingObject = objects.find((o) => o.id === editingObjectId)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Objects</h1>
          <p className="text-sm text-muted-foreground">
            {objects.length > 0
              ? `${objects.length} object${objects.length === 1 ? '' : 's'}`
              : 'Significant items, artifacts, and props in your story world.'}
          </p>
        </div>
        <Button className="bg-teal-600 text-white hover:bg-teal-500 hover:shadow-[0_0_20px_rgba(20,184,166,0.25)] transition-all" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Object
        </Button>
      </div>

      {isLoading ? (
        <ObjectSkeletons />
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load objects. Please try again.
        </div>
      ) : objects.length === 0 ? (
        <ObjectsEmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {objects.map((object) => (
            <ObjectCard
              key={object.id}
              object={object}
              worldId={worldId}
            />
          ))}
        </div>
      )}

      <CreateObjectDialog worldId={worldId} />
      {editingObject && (
        <EditObjectDialog worldId={worldId} object={editingObject} />
      )}
    </div>
  )
}
