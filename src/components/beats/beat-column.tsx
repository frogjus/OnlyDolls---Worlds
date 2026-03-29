'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import type { BeatStatus } from '@/types'
import type { BeatWithCharacter } from '@/lib/hooks/use-beats'
import type { BeatDensity } from '@/stores/beat-store'
import { BeatCard } from './beat-card'
import { staggerContainer, staggerItem } from '@/lib/animations'

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
        <motion.span
          key={beats.length}
          initial={{ scale: 1.3, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
        >
          {beats.length}
        </motion.span>
      </div>

      <motion.div
        ref={setNodeRef}
        className={`flex min-h-[200px] flex-1 flex-col gap-2 rounded-lg border p-2 transition-colors ${
          isOver
            ? 'border-primary/50 bg-primary/5 border-dashed'
            : 'border-dashed border-border/50'
        }`}
        animate={isOver ? { scale: 1.01 } : { scale: 1 }}
        transition={{ duration: 0.15 }}
      >
        <SortableContext
          items={beats.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <motion.div
            className="flex flex-col gap-2"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {beats.map((beat) => (
                <motion.div
                  key={beat.id}
                  variants={staggerItem}
                  layout
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                >
                  <BeatCard
                    beat={beat}
                    density={density}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </SortableContext>

        {beats.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center"
          >
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
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
