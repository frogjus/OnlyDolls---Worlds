'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react'

import type { Location, CreateLocationPayload, UpdateLocationPayload } from '@/types'
import {
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from '@/lib/hooks/use-locations'
import { useLocationStore } from '@/stores/location-store'
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

function CreateLocationDialog({ worldId }: { worldId: string }) {
  const { createDialogOpen, setCreateDialogOpen } = useLocationStore()
  const create = useCreateLocation(worldId)
  const [form, setForm] = useState<CreateLocationPayload>({ name: '' })

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
          <DialogTitle>New Location</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-name">Name *</Label>
            <Input
              id="create-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. The Iron Citadel"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-type">Type</Label>
            <Input
              id="create-type"
              value={form.locationType ?? ''}
              onChange={(e) => setForm({ ...form, locationType: e.target.value })}
              placeholder="e.g. city, room, planet"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-parent">Parent Location ID</Label>
            <Input
              id="create-parent"
              value={form.parentId ?? ''}
              onChange={(e) => setForm({ ...form, parentId: e.target.value || undefined })}
              placeholder="Optional parent location ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-desc">Description</Label>
            <Textarea
              id="create-desc"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe this location..."
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

function EditLocationDialog({
  worldId,
  location,
}: {
  worldId: string
  location: Location
}) {
  const { setEditingLocationId } = useLocationStore()
  const update = useUpdateLocation(worldId)

  const [form, setForm] = useState<UpdateLocationPayload & { id: string }>({
    id: location.id,
    name: location.name,
    locationType: location.type ?? '',
    description: location.description ?? '',
    parentId: location.parentId ?? '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate(form, { onSuccess: () => setEditingLocationId(null) })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && setEditingLocationId(null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Location</DialogTitle>
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
              value={form.locationType ?? ''}
              onChange={(e) => setForm({ ...form, locationType: e.target.value })}
              placeholder="e.g. city, room, planet"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-parent">Parent Location ID</Label>
            <Input
              id="edit-parent"
              value={form.parentId ?? ''}
              onChange={(e) => setForm({ ...form, parentId: e.target.value || undefined })}
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
              onClick={() => setEditingLocationId(null)}
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
// Location Card
// ---------------------------------------------------------------------------

function LocationCard({
  location,
  worldId,
  allLocations,
}: {
  location: Location
  worldId: string
  allLocations: Location[]
}) {
  const { setEditingLocationId, setSelectedLocationId } = useLocationStore()
  const deleteLocation = useDeleteLocation(worldId)

  const parentLocation = location.parentId
    ? allLocations.find((l) => l.id === location.parentId)
    : null

  return (
    <Card
      className="group cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => setSelectedLocationId(location.id)}
    >
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <MapPin className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base truncate">{location.name}</CardTitle>
          {location.type && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {location.type}
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
                setEditingLocationId(location.id)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                deleteLocation.mutate(location.id)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {location.description ? (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {location.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No description</p>
        )}
        {parentLocation && (
          <p className="text-xs text-muted-foreground mt-2">
            Parent: {parentLocation.name}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Loading Skeletons
// ---------------------------------------------------------------------------

function LocationSkeletons() {
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

function LocationsEmptyState() {
  const { setCreateDialogOpen } = useLocationStore()
  return (
    <EmptyState
      icon={MapPin}
      title="No locations yet"
      description="Map the places, settings, and geography of your story world. Build a hierarchy from continents down to rooms."
      primaryAction={{ label: 'New Location', onClick: () => setCreateDialogOpen(true) }}
    />
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LocationsPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const { data, isLoading, error } = useLocations(worldId)
  const {
    editingLocationId,
    setCreateDialogOpen,
  } = useLocationStore()

  const locations = data?.data ?? []
  const editingLocation = locations.find((l) => l.id === editingLocationId)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Locations</h1>
          <p className="text-sm text-muted-foreground">
            {locations.length > 0
              ? `${locations.length} location${locations.length === 1 ? '' : 's'}`
              : 'Places, settings, and geography of your story world.'}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Location
        </Button>
      </div>

      {isLoading ? (
        <LocationSkeletons />
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load locations. Please try again.
        </div>
      ) : locations.length === 0 ? (
        <LocationsEmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              worldId={worldId}
              allLocations={locations}
            />
          ))}
        </div>
      )}

      <CreateLocationDialog worldId={worldId} />
      {editingLocation && (
        <EditLocationDialog worldId={worldId} location={editingLocation} />
      )}
    </div>
  )
}
