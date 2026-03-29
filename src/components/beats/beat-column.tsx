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
  todo: 'bg-teal-500/40',
  in_progress: 'bg-teal-400/60',
  done: 'bg-teal-300/80',
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
        <div className={`size-2 rounded-full ${STATUS_COLORS[status]} shadow-[0_0_6px_rgba(20,184,166,0.4)]`} />
        <h3 className="text-xs font-medium uppercase tracking-wider text-slate-300">{STATUS_LABELS[status]}</h3>
        <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-teal-400">
          {beats.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[200px] flex-1 flex-col gap-2 rounded-lg border p-2 transition-colors ${
          isOver
            ? 'border-teal-500/50 bg-teal-500/5 border-dashed shadow-[0_0_8px_rgba(20,184,166,0.1)]'
            : 'border-dashed border-slate-700/50'
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
            <p className="text-xs text-slate-500">
              Drop beats here
            </p>
            {onAdd && (
              <button
                onClick={onAdd}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-teal-400 transition-colors"
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
