'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { CalendarClock, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from '@/lib/hooks/use-events'
import type { Event, CreateEventPayload } from '@/lib/hooks/use-events'
import { useEventStore } from '@/stores/event-store'

const emptyForm: CreateEventPayload = { name: '' }

export default function EventsPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const { data: events, isLoading, error } = useEvents(worldId)
  const createEvent = useCreateEvent(worldId)
  const updateEvent = useUpdateEvent(worldId)
  const deleteEvent = useDeleteEvent(worldId)

  const { searchQuery, setSearchQuery, filterKeyEvents, setFilterKeyEvents } = useEventStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [formData, setFormData] = useState<CreateEventPayload>(emptyForm)

  const filteredEvents = events?.filter((event) => {
    if (searchQuery && !event.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterKeyEvents !== null && event.isKeyEvent !== filterKeyEvents) return false
    return true
  })

  function openCreateDialog() {
    setEditingEvent(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  function openEditDialog(event: Event) {
    setEditingEvent(event)
    setFormData({
      name: event.name,
      description: event.description ?? undefined,
      fabulaPosition: event.fabulaPosition ?? undefined,
      fabulaDate: event.fabulaDate ?? undefined,
      isKeyEvent: event.isKeyEvent,
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingEvent) {
      await updateEvent.mutateAsync({ id: editingEvent.id, ...formData })
    } else {
      await createEvent.mutateAsync(formData)
    }
    setDialogOpen(false)
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-destructive">Failed to load events: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Story events across your narrative timeline.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4" />
          Add Event
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <Button
          variant={filterKeyEvents === true ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterKeyEvents(filterKeyEvents === true ? null : true)}
        >
          Key Events
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : filteredEvents?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <CalendarClock className="mb-3 size-10" />
          <p className="text-lg font-medium">No events yet</p>
          <p className="mt-1 text-sm">Create your first event to start building your timeline.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents?.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>{event.name}</CardTitle>
                  {event.fabulaPosition != null && (
                    <span className="text-xs text-muted-foreground">
                      #{event.fabulaPosition}
                    </span>
                  )}
                </div>
                <CardAction>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(event)}>
                        <Pencil className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => deleteEvent.mutate(event.id)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {event.isKeyEvent && <Badge>Key Event</Badge>}
                  {event.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {event.description}
                    </p>
                  )}
                  {event.fabulaDate && (
                    <p className="text-xs text-muted-foreground">{event.fabulaDate}</p>
                  )}
                  {event.locationId && (
                    <p className="text-xs text-muted-foreground">Location: {event.locationId}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => setDialogOpen(open)}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Edit Event' : 'Create Event'}</DialogTitle>
              <DialogDescription>
                {editingEvent
                  ? 'Update event details.'
                  : 'Add a new event to your story world.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-name">Name *</Label>
                <Input
                  id="event-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-description">Description</Label>
                <Textarea
                  id="event-description"
                  value={formData.description ?? ''}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value || undefined })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-position">Fabula Position</Label>
                <Input
                  id="event-position"
                  type="number"
                  step="any"
                  value={formData.fabulaPosition ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fabulaPosition: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-date">Fabula Date</Label>
                <Input
                  id="event-date"
                  value={formData.fabulaDate ?? ''}
                  onChange={(e) =>
                    setFormData({ ...formData, fabulaDate: e.target.value || undefined })
                  }
                  placeholder="e.g. Year 3, Day 42"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label>Key Event</Label>
                <Button
                  type="button"
                  variant={formData.isKeyEvent ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData({ ...formData, isKeyEvent: !formData.isKeyEvent })}
                >
                  {formData.isKeyEvent ? 'Yes' : 'No'}
                </Button>
              </div>
            </div>
            <DialogFooter showCloseButton>
              <Button
                type="submit"
                disabled={createEvent.isPending || updateEvent.isPending}
              >
                {editingEvent ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
