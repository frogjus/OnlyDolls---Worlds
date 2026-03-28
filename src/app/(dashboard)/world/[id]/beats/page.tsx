'use client'

import { useState, useMemo, useEffect } from 'react'
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
import { Plus, Star, X } from 'lucide-react'
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

const STATUSES: BeatStatus[] = ['todo', 'in_progress', 'done']

export default function BeatsPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const { data: beats, isLoading } = useBeats(worldId)
  const { data: characters } = useCharacters(worldId)
  const deleteBeat = useDeleteBeat(worldId)
  const reorderBeats = useReorderBeats(worldId)

  const {
    createDialogOpen,
    editingBeatId,
    filterStarRating,
    filterCharacterId,
    setCreateDialogOpen,
    setEditingBeatId,
    setFilterStarRating,
    setFilterCharacterId,
    resetFilters,
  } = useBeatUI()

  const [localBeats, setLocalBeats] = useState<BeatWithCharacter[]>([])
  const [activeBeat, setActiveBeat] = useState<BeatWithCharacter | null>(null)

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

    let finalBeats: BeatWithCharacter[] = []

    setLocalBeats((prev) => {
      let updated = [...prev]

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
      reorderBeats.mutate({ beats: updates })
    }
  }

  const handleEdit = (id: string) => setEditingBeatId(id)
  const handleDelete = (id: string) => deleteBeat.mutate(id)
  const hasFilters = filterStarRating != null || filterCharacterId != null

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex flex-1 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Beats</h1>
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
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="size-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>

        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
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
        <div className="flex flex-1 gap-4 overflow-x-auto">
          {STATUSES.map((status) => (
            <BeatColumn
              key={status}
              status={status}
              beats={grouped[status]}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>

        <DragOverlay>
          {activeBeat && (
            <BeatCard
              beat={activeBeat}
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
    </div>
  )
}
