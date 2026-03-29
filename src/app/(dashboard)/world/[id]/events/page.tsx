'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  CalendarClock,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react'

import type { Event, CreateEventPayload, UpdateEventPayload } from '@/types'
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from '@/lib/hooks/use-events'
import { useEventStore } from '@/stores/event-store'
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

function CreateEventDialog({ worldId }: { worldId: string }) {
  const { createDialogOpen, setCreateDialogOpen } = useEventStore()
  const create = useCreateEvent(worldId)
  const [form, setForm] = useState<CreateEventPayload>({ name: '' })

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
          <DialogTitle>New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-name">Name *</Label>
            <Input
              id="create-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. The Battle of Verdun"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-date">Fabula Date</Label>
            <Input
              id="create-date"
              value={form.fabulaDate ?? ''}
              onChange={(e) => setForm({ ...form, fabulaDate: e.target.value })}
              placeholder="In-world date (e.g. Year 3, Day of the Eclipse)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-position">Fabula Position</Label>
            <Input
              id="create-position"
              type="number"
              step="any"
              value={form.fabulaPosition ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  fabulaPosition: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              placeholder="Chronological sort order"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="create-key"
              checked={form.isKeyEvent ?? false}
              onChange={(e) => setForm({ ...form, isKeyEvent: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="create-key">Key Event</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-desc">Description</Label>
            <Textarea
              id="create-desc"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What happens in this event..."
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

function EditEventDialog({
  worldId,
  event,
}: {
  worldId: string
  event: Event
}) {
  const { setEditingEventId } = useEventStore()
  const update = useUpdateEvent(worldId)

  const [form, setForm] = useState<UpdateEventPayload & { id: string }>({
    id: event.id,
    name: event.name,
    description: event.description ?? '',
    fabulaDate: event.fabulaDate ?? '',
    fabulaPosition: event.fabulaPosition ?? undefined,
    isKeyEvent: event.isKeyEvent,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate(form, { onSuccess: () => setEditingEventId(null) })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && setEditingEventId(null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
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
            <Label htmlFor="edit-date">Fabula Date</Label>
            <Input
              id="edit-date"
              value={form.fabulaDate ?? ''}
              onChange={(e) => setForm({ ...form, fabulaDate: e.target.value })}
              placeholder="In-world date"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-position">Fabula Position</Label>
            <Input
              id="edit-position"
              type="number"
              step="any"
              value={form.fabulaPosition ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  fabulaPosition: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-key"
              checked={form.isKeyEvent ?? false}
              onChange={(e) => setForm({ ...form, isKeyEvent: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="edit-key">Key Event</Label>
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
              onClick={() => setEditingEventId(null)}
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
// Event Card
// ---------------------------------------------------------------------------

function EventCard({
  event,
  worldId,
}: {
  event: Event
  worldId: string
}) {
  const { setEditingEventId, setSelectedEventId } = useEventStore()
  const deleteEvent = useDeleteEvent(worldId)

  return (
    <Card
      className="group cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => setSelectedEventId(event.id)}
    >
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <CalendarClock className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base truncate">{event.name}</CardTitle>
          <div className="flex flex-wrap gap-1 mt-1">
            {event.isKeyEvent && (
              <Badge variant="default" className="text-xs">
                Key Event
              </Badge>
            )}
            {event.fabulaDate && (
              <Badge variant="outline" className="text-xs">
                {event.fabulaDate}
              </Badge>
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
                setEditingEventId(event.id)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                deleteEvent.mutate(event.id)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {event.description ? (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {event.description}
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

function EventSkeletons() {
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

function EventsEmptyState() {
  const { setCreateDialogOpen } = useEventStore()
  return (
    <EmptyState
      icon={CalendarClock}
      title="No events yet"
      description="Create chronological events to build your story's fabula timeline — the ground truth of what happens in your world."
      primaryAction={{ label: 'New Event', onClick: () => setCreateDialogOpen(true) }}
    />
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EventsPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const { data, isLoading, error } = useEvents(worldId)
  const {
    editingEventId,
    setCreateDialogOpen,
  } = useEventStore()

  const events = data?.data ?? []
  const editingEvent = events.find((e) => e.id === editingEventId)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-sm text-muted-foreground">
            {events.length > 0
              ? `${events.length} event${events.length === 1 ? '' : 's'}`
              : 'Chronological events that make up your story world.'}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Event
        </Button>
      </div>

      {isLoading ? (
        <EventSkeletons />
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load events. Please try again.
        </div>
      ) : events.length === 0 ? (
        <EventsEmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              worldId={worldId}
            />
          ))}
        </div>
      )}

      <CreateEventDialog worldId={worldId} />
      {editingEvent && (
        <EditEventDialog worldId={worldId} event={editingEvent} />
      )}
    </div>
  )
}
