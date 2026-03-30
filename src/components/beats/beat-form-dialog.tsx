'use client'

import { useState, useEffect } from 'react'
import { Star, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useCreateBeat, useUpdateBeat, useDeleteBeat, useCharacters } from '@/lib/hooks/use-beats'
import type { BeatWithCharacter } from '@/lib/hooks/use-beats'
import type { BeatStatus } from '@/types'
import { showSuccess, showError } from '@/lib/toast'

const COLOR_PRESETS = [
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#eab308',
  '#a855f7',
  '#f97316',
]

interface BeatFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  worldId: string
  beat?: BeatWithCharacter | null
  defaultStatus?: BeatStatus
}

export function BeatFormDialog({
  open,
  onOpenChange,
  worldId,
  beat,
  defaultStatus = 'todo',
}: BeatFormDialogProps) {
  const isEditing = !!beat
  const createBeat = useCreateBeat(worldId)
  const updateBeat = useUpdateBeat(worldId)
  const deleteBeat = useDeleteBeat(worldId)
  const { data: characters } = useCharacters(worldId)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState<string | null>(null)
  const [starRating, setStarRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [characterId, setCharacterId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (beat) {
        setName(beat.name)
        setDescription(beat.description ?? '')
        setColor(beat.color ?? null)
        setStarRating(beat.starRating ?? 0)
        setNotes(beat.notes ?? '')
        setCharacterId(beat.characterId ?? null)
      } else {
        setName('')
        setDescription('')
        setColor(null)
        setStarRating(0)
        setNotes('')
        setCharacterId(null)
      }
    }
  }, [open, beat])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      color: color ?? undefined,
      starRating: starRating || undefined,
      notes: notes.trim() || undefined,
      characterId: characterId ?? undefined,
      status: (isEditing && beat ? beat.status as BeatStatus : defaultStatus),
    }

    if (isEditing && beat) {
      updateBeat.mutate(
        { id: beat.id, ...payload },
        {
          onSuccess: () => {
            showSuccess('Beat saved')
            onOpenChange(false)
          },
          onError: () => {
            showError('Failed to save beat')
          },
        },
      )
    } else {
      createBeat.mutate(payload, {
        onSuccess: () => {
          showSuccess('Beat saved')
          onOpenChange(false)
        },
        onError: () => {
          showError('Failed to save beat')
        },
      })
    }
  }

  const handleDelete = () => {
    if (!beat) return
    if (!window.confirm('Delete this beat? This cannot be undone.')) return

    deleteBeat.mutate(beat.id, {
      onSuccess: () => {
        showSuccess('Beat deleted')
        onOpenChange(false)
      },
      onError: () => {
        showError('Failed to delete beat')
      },
    })
  }

  const isPending = createBeat.isPending || updateBeat.isPending || deleteBeat.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Beat' : 'New Beat'}</DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Beat name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happens in this beat?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(color === c ? null : c)}
                    className={`size-7 rounded-full transition-transform ${
                      color === c
                        ? 'scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background'
                        : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Star Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setStarRating(starRating === i ? 0 : i)}
                  >
                    <Star
                      className={`size-5 ${
                        i <= starRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground/40'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Character</Label>
              <Select
                value={characterId ?? ''}
                onValueChange={(val) =>
                  setCharacterId(val ? String(val) : null)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {characters?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-4">
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
            <Button type="submit" disabled={isPending || !name.trim()} className="bg-primary text-primary-foreground hover:bg-[#0d9488] shadow-sm hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all duration-200">
              {isPending ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
