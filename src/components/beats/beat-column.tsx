'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { BeatStatus } from '@/types'
import type { BeatWithCharacter } from '@/lib/hooks/use-beats'
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
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function BeatColumn({ status, beats, onEdit, onDelete }: BeatColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <div className={`size-2 rounded-full ${STATUS_COLORS[status]}`} />
        <h3 className="text-sm font-medium">{STATUS_LABELS[status]}</h3>
        <span className="text-xs text-muted-foreground">{beats.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[200px] flex-1 flex-col gap-2 rounded-lg border border-dashed p-2 transition-colors ${
          isOver ? 'border-primary/50 bg-primary/5' : 'border-transparent'
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
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
