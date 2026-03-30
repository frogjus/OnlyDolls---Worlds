'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Plus, Star, X, List, LayoutGrid, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useBeatUI } from '@/stores/beat-store'
import type { BeatDensity } from '@/stores/beat-store'
import {
  useBeats,
  useCharacters,
  useDeleteBeat,
  useReorderBeats,
} from '@/lib/hooks/use-beats'
import type { BeatWithCharacter } from '@/lib/hooks/use-beats'
import type { BeatStatus } from '@/types'
import { BeatColumn } from '@/components/beats/beat-column'
import { BeatCard } from '@/components/beats/beat-card'
import { BeatFormDialog } from '@/components/beats/beat-form-dialog'
import { BeatMinimap } from '@/components/beats/beat-minimap'
import { showSuccess, showError } from '@/lib/toast'

const STATUSES: BeatStatus[] = ['todo', 'in_progress', 'done']

const DENSITY_OPTIONS: { value: BeatDensity; icon: typeof List; label: string }[] = [
  { value: 'minimal', icon: List, label: 'Minimal' },
  { value: 'standard', icon: LayoutGrid, label: 'Standard' },
  { value: 'detailed', icon: Maximize2, label: 'Detailed' },
]

export default function BeatsPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const { data: beats, isLoading } = useBeats(worldId)
  const { data: characters } = useCharacters(worldId)
  const deleteBeat = useDeleteBeat(worldId)
  const reorderBeats = useReorderBeats(worldId)

  const {
    density,
    createDialogOpen,
    editingBeatId,
    filterStarRating,
    filterCharacterId,
    setDensity,
    setCreateDialogOpen,
    setEditingBeatId,
    setFilterStarRating,
    setFilterCharacterId,
    resetFilters,
  } = useBeatUI()

  const [localBeats, setLocalBeats] = useState<BeatWithCharacter[]>([])
  const [activeBeat, setActiveBeat] = useState<BeatWithCharacter | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (beats && !activeBeat) {
      setLocalBeats(beats)
    }
  }, [beats, activeBeat])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const grouped = useMemo(() => {
    let filtered = localBeats
    if (filterStarRating) {
      filtered = filtered.filter((b) => b.starRating === filterStarRating)
    }
    if (filterCharacterId) {
      filtered = filtered.filter((b) => b.characterId === filterCharacterId)
    }
    return {
      todo: filtered.filter((b) => b.status === 'todo'),
      in_progress: filtered.filter((b) => b.status === 'in_progress'),
      done: filtered.filter((b) => b.status === 'done'),
    }
  }, [localBeats, filterStarRating, filterCharacterId])

  const editingBeat = editingBeatId
    ? localBeats.find((b) => b.id === editingBeatId) ?? null
    : null

  const handleDragStart = (event: DragStartEvent) => {
    const beat = localBeats.find((b) => b.id === event.active.id)
    setActiveBeat(beat ?? null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const targetStatus = STATUSES.includes(overId as BeatStatus)
      ? (overId as BeatStatus)
      : (localBeats.find((b) => b.id === overId)?.status as BeatStatus | undefined) ?? null

    if (!targetStatus) return

    setLocalBeats((prev) => {
      const ab = prev.find((b) => b.id === activeId)
      if (!ab || ab.status === targetStatus) return prev
      return prev.map((b) =>
        b.id === activeId ? { ...b, status: targetStatus } : b,
      )
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveBeat(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Determine target status from drop target (column or beat within column)
    const targetStatus = STATUSES.includes(overId as BeatStatus)
      ? (overId as BeatStatus)
      : (localBeats.find((b) => b.id === overId)?.status as BeatStatus | undefined) ?? null

    let finalBeats: BeatWithCharacter[] = []

    setLocalBeats((prev) => {
      let updated = [...prev]

      // Ensure status is applied even if handleDragOver didn't fire
      if (targetStatus) {
        updated = updated.map((b) =>
          b.id === activeId ? { ...b, status: targetStatus } : b,
        )
      }

      if (activeId !== overId && !STATUSES.includes(overId as BeatStatus)) {
        const ab = updated.find((b) => b.id === activeId)
        const ob = updated.find((b) => b.id === overId)
        if (ab && ob && ab.status === ob.status) {
          const col = updated.filter((b) => b.status === ab.status)
          const rest = updated.filter((b) => b.status !== ab.status)
          const oi = col.findIndex((b) => b.id === activeId)
          const ni = col.findIndex((b) => b.id === overId)
          updated = [...rest, ...arrayMove(col, oi, ni)]
        }
      }

      finalBeats = updated
      return updated
    })

    const updates = STATUSES.flatMap((status) =>
      finalBeats
        .filter((b) => b.status === status)
        .map((b, i) => ({ id: b.id, position: i, status })),
    )
    if (updates.length > 0) {
      reorderBeats.mutate({ beats: updates }, {
        onError: () => showError('Failed to save beat changes'),
      })
    }
  }

  const handleEdit = (id: string) => setEditingBeatId(id)
  const handleDelete = (id: string) => deleteBeat.mutate(id, {
    onSuccess: () => showSuccess('Beat deleted'),
    onError: () => showError('Failed to delete beat'),
  })
  const hasFilters = filterStarRating != null || filterCharacterId != null
  const isEmpty = !isLoading && localBeats.length === 0

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-4 p-6">
        <div className="flex items-center justify-between rounded-lg bg-card px-4 py-3 border border-border">
          <Skeleton className="h-8 w-32 bg-muted" />
          <Skeleton className="h-8 w-24 bg-muted" />
        </div>
        <div className="flex flex-1 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-6 w-24 bg-muted" />
              <Skeleton className="h-24 w-full bg-card border border-border rounded-lg" />
              <Skeleton className="h-24 w-full bg-card border border-border rounded-lg" />
              <Skeleton className="h-24 w-full bg-card border border-border rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.015em] text-foreground">Beats</h1>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-border bg-muted p-14 text-center mt-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card shadow-[0_0_25px_rgba(20,184,166,0.08)]">
            <LayoutGrid className="h-10 w-10 text-teal-300/70" />
          </div>
          <h3 className="mt-6 font-heading text-lg font-semibold tracking-tight text-foreground">No beats yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Start building your story structure by adding your first beat
          </p>
          <Button onClick={() => setCreateDialogOpen(true)} className="mt-6 bg-primary text-primary-foreground hover:bg-[#0d9488] shadow-sm hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all duration-200">
            <Plus className="size-4" />
            Add First Beat
          </Button>
        </div>

        <BeatFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          worldId={worldId}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between rounded-lg bg-card px-4 py-3 border border-border">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.015em] text-foreground">Beats</h1>

          {/* Density toggle */}
          <div className="flex items-center rounded-md border border-border bg-muted">
            {DENSITY_OPTIONS.map(({ value, icon: Icon, label }) => (
              <Button
                key={value}
                variant={density === value ? 'secondary' : 'ghost'}
                size="icon-xs"
                onClick={() => setDensity(value)}
                title={label}
                className={`rounded-none first:rounded-l-md last:rounded-r-md ${density === value ? 'bg-primary/15 text-teal-300' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="size-3.5" />
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={filterStarRating?.toString() ?? ''}
              onValueChange={(val) =>
                setFilterStarRating(val ? Number(val) : null)
              }
            >
              <SelectTrigger size="sm">
                <Star className="size-3.5" />
                <SelectValue placeholder="Stars" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Stars</SelectItem>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n} Star{n > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterCharacterId ?? ''}
              onValueChange={(val) => setFilterCharacterId(val ? String(val) : null)}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="Character" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Characters</SelectItem>
                {characters?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10">
                <X className="size-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>

        <Button size="sm" onClick={() => setCreateDialogOpen(true)} className="bg-primary text-primary-foreground hover:bg-[#0d9488] shadow-sm hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all duration-200">
          <Plus className="size-4" />
          New Beat
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div ref={scrollContainerRef} className="flex flex-1 gap-4 overflow-x-auto rounded-lg p-2" style={{ backgroundImage: 'radial-gradient(circle, rgba(20,184,166,0.06) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          {STATUSES.map((status) => (
            <BeatColumn
              key={status}
              status={status}
              beats={grouped[status]}
              density={density}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={() => setCreateDialogOpen(true)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeBeat && (
            <BeatCard
              beat={activeBeat}
              density={density}
              onEdit={() => {}}
              onDelete={() => {}}
              overlay
            />
          )}
        </DragOverlay>
      </DndContext>

      <BeatFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        worldId={worldId}
      />
      <BeatFormDialog
        open={!!editingBeatId}
        onOpenChange={(open) => {
          if (!open) setEditingBeatId(null)
        }}
        worldId={worldId}
        beat={editingBeat}
      />

      <BeatMinimap
        columns={grouped}
        density={density}
        scrollContainerRef={scrollContainerRef}
      />
    </div>
  )
}
