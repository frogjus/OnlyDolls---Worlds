'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { MapPin, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from '@/lib/hooks/use-locations'
import type { Location } from '@/lib/hooks/use-locations'
import { useLocationStore } from '@/stores/location-store'

function formatCoordinates(coords: Record<string, unknown>): string {
  if ('lat' in coords && 'lng' in coords) {
    return `${coords.lat}, ${coords.lng}`
  }
  return JSON.stringify(coords)
}

function parseCoordinates(value: string): Record<string, unknown> | undefined {
  if (!value.trim()) return undefined
  try {
    return JSON.parse(value)
  } catch {
    const parts = value.split(',').map((s) => s.trim())
    if (
      parts.length === 2 &&
      !isNaN(Number(parts[0])) &&
      !isNaN(Number(parts[1]))
    ) {
      return { lat: Number(parts[0]), lng: Number(parts[1]) }
    }
    return undefined
  }
}

export default function LocationsPage() {
  const params = useParams()
  const worldId = params.id as string

  const { data, isLoading, error } = useLocations(worldId)
  const createLocation = useCreateLocation(worldId)
  const updateLocation = useUpdateLocation(worldId)
  const deleteLocation = useDeleteLocation(worldId)

  const {
    dialogOpen,
    setDialogOpen,
    editingId,
    setEditingId,
    filterType,
  } = useLocationStore()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [locationType, setLocationType] = useState('')
  const [parentId, setParentId] = useState('')
  const [coordinates, setCoordinates] = useState('')

  const locations = data?.data ?? []
  const editingLocation = editingId
    ? locations.find((l) => l.id === editingId)
    : null

  const filteredLocations = filterType
    ? locations.filter((l) => l.type === filterType)
    : locations

  useEffect(() => {
    if (editingLocation) {
      setName(editingLocation.name)
      setDescription(editingLocation.description ?? '')
      setLocationType(editingLocation.type ?? '')
      setParentId(editingLocation.parentId ?? '')
      setCoordinates(
        editingLocation.coordinates
          ? JSON.stringify(editingLocation.coordinates)
          : ''
      )
    }
  }, [editingLocation])

  function resetForm() {
    setName('')
    setDescription('')
    setLocationType('')
    setParentId('')
    setCoordinates('')
  }

  function handleOpenCreate() {
    setEditingId(null)
    resetForm()
    setDialogOpen(true)
  }

  function handleOpenEdit(location: Location) {
    setEditingId(location.id)
    setDialogOpen(true)
  }

  function handleClose() {
    setDialogOpen(false)
    setEditingId(null)
    resetForm()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      locationType: locationType.trim() || undefined,
      parentId: parentId || undefined,
      coordinates: parseCoordinates(coordinates),
    }

    if (editingId) {
      updateLocation.mutate(
        { id: editingId, ...payload },
        { onSuccess: handleClose }
      )
    } else {
      createLocation.mutate(payload, { onSuccess: handleClose })
    }
  }

  function handleDelete(id: string) {
    deleteLocation.mutate(id)
  }

  const isPending = createLocation.isPending || updateLocation.isPending

  function getParentName(pid: string): string | undefined {
    return locations.find((l) => l.id === pid)?.name
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <MapPin className="size-6" />
              Locations
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage locations and places in your story world.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive p-4">
          <p className="text-sm text-destructive">
            Failed to load locations: {error.message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <MapPin className="size-6" />
            Locations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage locations and places in your story world.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="size-4" />
          Add Location
        </Button>
      </div>

      {locations.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
          <MapPin className="size-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">No locations yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first location to start building your world.
          </p>
          <Button className="mt-4" onClick={handleOpenCreate}>
            <Plus className="size-4" />
            Add Location
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLocations.map((location) => (
            <Card key={location.id}>
              <CardHeader>
                <CardTitle>{location.name}</CardTitle>
                <CardAction>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon-sm" />}
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleOpenEdit(location)}
                      >
                        <Pencil className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleDelete(location.id)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardAction>
              </CardHeader>
              <CardContent>
                {location.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {location.description}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {location.type && (
                    <Badge variant="secondary">{location.type}</Badge>
                  )}
                  {location.parentId && (
                    <Badge variant="outline">
                      {getParentName(location.parentId) ?? 'Unknown parent'}
                    </Badge>
                  )}
                </div>
                {location.coordinates && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatCoordinates(location.coordinates)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) handleClose()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Location' : 'Create Location'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update the details of this location.'
                : 'Add a new location to your story world.'}
            </DialogDescription>
          </DialogHeader>
          <form
            id="location-form"
            onSubmit={handleSubmit}
            className="grid gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="location-name">Name *</Label>
              <Input
                id="location-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Location name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location-description">Description</Label>
              <Textarea
                id="location-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this location..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location-type">Type</Label>
              <Input
                id="location-type"
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                placeholder="e.g. city, room, planet"
              />
            </div>
            <div className="grid gap-2">
              <Label>Parent Location</Label>
              <Select
                value={parentId}
                onValueChange={(val) => setParentId(val as string)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (top-level)</SelectItem>
                  {locations
                    .filter((l) => l.id !== editingId)
                    .map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location-coordinates">Coordinates</Label>
              <Input
                id="location-coordinates"
                value={coordinates}
                onChange={(e) => setCoordinates(e.target.value)}
                placeholder='e.g. {"lat": 40.71, "lng": -74.00}'
              />
            </div>
          </form>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              form="location-form"
              disabled={!name.trim() || isPending}
            >
              {editingId ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
