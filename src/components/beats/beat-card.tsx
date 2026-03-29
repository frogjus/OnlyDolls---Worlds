'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useParams, useRouter } from 'next/navigation'
import { GripVertical, Star, MoreVertical, Pencil, PenLine, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import type { BeatWithCharacter } from '@/lib/hooks/use-beats'

interface BeatCardProps {
  beat: BeatWithCharacter
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  overlay?: boolean
}

export function BeatCard({ beat, onEdit, onDelete, overlay }: BeatCardProps) {
  const router = useRouter()
  const { id: worldId } = useParams<{ id: string }>()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: beat.id, data: { beat }, disabled: overlay })

  const handleCardClick = () => {
    if (!overlay) {
      router.push(`/world/${worldId}/write?beatId=${beat.id}`)
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderLeft: beat.color ? `4px solid ${beat.color}` : undefined,
  }

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? { borderLeft: style.borderLeft } : style}
      className={`rounded-lg bg-card p-3 ring-1 ring-foreground/10 ${
        isDragging ? 'opacity-50' : ''
      } ${overlay ? 'shadow-lg' : ''}`}
      {...(overlay ? {} : attributes)}
    >
      <div className="flex items-start gap-2">
        {!overlay && (
          <button
            className="mt-0.5 cursor-grab text-muted-foreground hover:text-foreground"
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        )}

        <div
          className="min-w-0 flex-1 cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={handleCardClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleCardClick()
            }
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <h4 className="truncate text-sm font-medium">{beat.name}</h4>
              {!overlay && (
                <PenLine className="size-3 shrink-0 text-muted-foreground/50" />
              )}
            </div>
            {!overlay && (
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon-xs" />}
                  >
                    <MoreVertical className="size-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(beat.id)}>
                      <Pencil className="size-3.5" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete(beat.id)}
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {beat.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {beat.description}
            </p>
          )}

          <div className="mt-2 flex items-center gap-2">
            {beat.starRating != null && beat.starRating > 0 && (
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`size-3 ${
                      i <= (beat.starRating ?? 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/40'
                    }`}
                  />
                ))}
              </div>
            )}
            {beat.character && (
              <Badge variant="secondary" className="text-[10px]">
                {beat.character.name}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
