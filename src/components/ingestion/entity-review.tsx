'use client'

import { useState, useCallback } from 'react'
import { Check, X, User, MapPin, Zap, Package, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ExtractedEntityItem {
  name: string
  type: 'character' | 'location' | 'event' | 'item' | 'faction'
  description: string
  confidence: number
  confirmed: boolean
}

interface EntityReviewProps {
  entities: ExtractedEntityItem[]
  onConfirm: (confirmed: ExtractedEntityItem[]) => void
  onCancel: () => void
  isLoading?: boolean
}

const ENTITY_TYPE_CONFIG: Record<
  ExtractedEntityItem['type'],
  { icon: typeof User; label: string; color: string }
> = {
  character: { icon: User, label: 'Character', color: 'bg-blue-100 text-blue-800' },
  location: { icon: MapPin, label: 'Location', color: 'bg-green-100 text-green-800' },
  event: { icon: Zap, label: 'Event', color: 'bg-amber-100 text-amber-800' },
  item: { icon: Package, label: 'Item', color: 'bg-purple-100 text-purple-800' },
  faction: { icon: Users, label: 'Faction', color: 'bg-red-100 text-red-800' },
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percent = Math.round(confidence * 100)
  let variant: 'default' | 'secondary' = 'default'
  if (percent < 70) variant = 'secondary'

  return (
    <Badge variant={variant} className="text-[10px]">
      {percent}%
    </Badge>
  )
}

export function EntityReview({
  entities,
  onConfirm,
  onCancel,
  isLoading = false,
}: EntityReviewProps) {
  const [entityStates, setEntityStates] = useState<Record<number, boolean>>(
    () => {
      const states: Record<number, boolean> = {}
      entities.forEach((entity, index) => {
        states[index] = entity.confidence >= 0.7
      })
      return states
    }
  )

  const toggleEntity = useCallback((index: number) => {
    setEntityStates((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }, [])

  const selectAll = useCallback(() => {
    const states: Record<number, boolean> = {}
    entities.forEach((_, index) => {
      states[index] = true
    })
    setEntityStates(states)
  }, [entities])

  const deselectAll = useCallback(() => {
    const states: Record<number, boolean> = {}
    entities.forEach((_, index) => {
      states[index] = false
    })
    setEntityStates(states)
  }, [entities])

  const handleConfirm = useCallback(() => {
    const confirmed = entities
      .map((entity, index) => ({
        ...entity,
        confirmed: entityStates[index] ?? false,
      }))
      .filter((entity) => entity.confirmed)

    onConfirm(confirmed)
  }, [entities, entityStates, onConfirm])

  const selectedCount = Object.values(entityStates).filter(Boolean).length

  if (entities.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No entities were extracted from this content.
        </p>
        <Button variant="outline" onClick={onCancel} className="mt-4">
          Close
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">
            Review Extracted Entities
          </h3>
          <p className="text-xs text-muted-foreground">
            {selectedCount} of {entities.length} selected for import
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={deselectAll}>
            Deselect All
          </Button>
        </div>
      </div>

      <div className="max-h-[400px] space-y-2 overflow-y-auto">
        {entities.map((entity, index) => {
          const config = ENTITY_TYPE_CONFIG[entity.type]
          const Icon = config.icon
          const isSelected = entityStates[index] ?? false

          return (
            <button
              key={`${entity.type}-${entity.name}-${index}`}
              onClick={() => toggleEntity(index)}
              className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                isSelected
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-transparent bg-muted/30 opacity-60'
              }`}
            >
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Icon className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{entity.name}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${config.color}`}>
                    {config.label}
                  </span>
                  <ConfidenceBadge confidence={entity.confidence} />
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {entity.description}
                </p>
              </div>

              <div className="mt-1 shrink-0">
                {isSelected ? (
                  <Check className="size-5 text-primary" />
                ) : (
                  <X className="size-5 text-muted-foreground/40" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={selectedCount === 0 || isLoading}>
          {isLoading ? 'Importing...' : `Import ${selectedCount} ${selectedCount === 1 ? 'Entity' : 'Entities'}`}
        </Button>
      </div>
    </div>
  )
}
