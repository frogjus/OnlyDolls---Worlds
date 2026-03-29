'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import type { BeatStatus } from '@/types'
import type { BeatWithCharacter } from '@/lib/hooks/use-beats'
import type { BeatDensity } from '@/stores/beat-store'
import { BeatCard } from './beat-card'

const STATUS_LABELS: Record<BeatStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

const STATUS_COLORS: Record<BeatStatus, string> = {
  todo: 'bg-muted-foreground/20',
  in_progress: 'bg-blue-500/20',
  done: 'bg-green-500/20',
}

interface BeatColumnProps {
  status: BeatStatus
  beats: BeatWithCharacter[]
  density: BeatDensity
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onAdd?: () => void
}

export function BeatColumn({ status, beats, density, onEdit, onDelete, onAdd }: BeatColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <div className={`size-2 rounded-full ${STATUS_COLORS[status]}`} />
        <h3 className="text-sm font-medium">{STATUS_LABELS[status]}</h3>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {beats.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[200px] flex-1 flex-col gap-2 rounded-lg border p-2 transition-colors ${
          isOver
            ? 'border-primary/50 bg-primary/5 border-dashed'
            : 'border-dashed border-border/50'
        }`}
      >
        <SortableContext
          items={beats.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {beats.map((beat) => (
            <BeatCard
              key={beat.id}
              beat={beat}
              density={density}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>

        {beats.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
            <p className="text-xs text-muted-foreground">
              Drag beats here
            </p>
            {onAdd && (
              <button
                onClick={onAdd}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="size-3" />
                or click + to add
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
