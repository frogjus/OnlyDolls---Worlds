'use client'

import { useMemo, useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  useTreatmentBeats,
  useSaveTreatmentOverride,
  generateTreatment,
  type TreatmentSection,
} from '@/lib/hooks/use-treatments'

interface TreatmentViewProps {
  worldId: string
}

export function TreatmentView({ worldId }: TreatmentViewProps) {
  const { data: beats, isLoading } = useTreatmentBeats(worldId)
  const saveMutation = useSaveTreatmentOverride(worldId)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const sections = useMemo(() => {
    if (!beats || beats.length === 0) return []
    return generateTreatment(beats)
  }, [beats])

  if (isLoading) {
    return <TreatmentSkeleton />
  }

  if (!beats || beats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          No beats yet
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add beats to your story to auto-generate a treatment.
        </p>
      </div>
    )
  }

  function startEdit(section: TreatmentSection) {
    if (!section.beatId) return
    setEditingId(section.beatId)
    setEditValue(section.content)
  }

  function saveEdit(beatId: string) {
    saveMutation.mutate({ beatId, treatmentOverride: editValue })
    setEditingId(null)
    setEditValue('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {sections.map((section, i) => {
        if (section.type === 'act-header') {
          return (
            <h2
              key={`act-${i}`}
              className="border-b pb-2 text-xl font-semibold tracking-tight"
            >
              {section.heading}
            </h2>
          )
        }

        const isEditing = editingId === section.beatId

        return (
          <div key={section.beatId ?? i} className="group relative">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-medium">{section.heading}</h3>
                  {section.isOverridden && (
                    <Badge variant="secondary" className="text-xs">
                      Edited
                    </Badge>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="min-h-24"
                    />
                    <div className="flex gap-1">
                      <Button
                        size="xs"
                        onClick={() => saveEdit(section.beatId!)}
                      >
                        <Check className="size-3" />
                        Save
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={cancelEdit}
                      >
                        <X className="size-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 leading-relaxed text-muted-foreground">
                    {section.content}
                  </p>
                )}
              </div>

              {!isEditing && (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => startEdit(section)}
                >
                  <Pencil className="size-3" />
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TreatmentSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  )
}
