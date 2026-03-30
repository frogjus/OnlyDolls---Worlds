'use client'

import { useState, useCallback } from 'react'
import { Check, X, User, MapPin, Zap, Package, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  { icon: typeof User; label: string; color: string; bg: string }
> = {
  character: {
    icon: User,
    label: 'Character',
    color: 'text-[var(--od-cyan-400)]',
    bg: 'bg-[rgba(6,182,212,0.15)]',
  },
  location: {
    icon: MapPin,
    label: 'Location',
    color: 'text-emerald-400',
    bg: 'bg-[rgba(34,197,94,0.15)]',
  },
  event: {
    icon: Zap,
    label: 'Event',
    color: 'text-[var(--od-violet-400)]',
    bg: 'bg-[rgba(124,58,237,0.15)]',
  },
  item: {
    icon: Package,
    label: 'Item',
    color: 'text-amber-400',
    bg: 'bg-[rgba(245,158,11,0.15)]',
  },
  faction: {
    icon: Users,
    label: 'Faction',
    color: 'text-rose-400',
    bg: 'bg-[rgba(239,68,68,0.15)]',
  },
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const percent = Math.round(confidence * 100)
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-20 overflow-hidden rounded-full"
        style={{ background: 'var(--od-bg-surface)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percent}%`,
            background:
              percent >= 80
                ? 'linear-gradient(90deg, var(--od-teal-600), var(--od-teal-400))'
                : percent >= 60
                  ? 'linear-gradient(90deg, #d97706, #fbbf24)'
                  : 'linear-gradient(90deg, #dc2626, #f87171)',
          }}
        />
      </div>
      <span
        className="text-[10px] font-medium tabular-nums"
        style={{
          color: percent >= 70 ? 'var(--od-teal-300)' : 'var(--od-text-muted)',
        }}
      >
        {percent}%
      </span>
    </div>
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
      <div
        className="rounded-lg p-8 text-center"
        style={{
          background: 'var(--od-bg-raised)',
          border: '1px solid var(--od-border-default)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--od-text-muted)' }}>
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
          <h3
            className="text-sm font-semibold font-[family-name:var(--font-heading)]"
            style={{ color: 'var(--od-text-primary)' }}
          >
            Review Extracted Entities
          </h3>
          <p className="text-xs" style={{ color: 'var(--od-text-muted)' }}>
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
              className={`card-interactive flex w-full items-start gap-3 rounded-lg p-3 text-left transition-all ${
                isSelected
                  ? 'border border-[rgba(20,184,166,0.3)]'
                  : 'border border-transparent opacity-60'
              }`}
              style={{
                background: isSelected
                  ? 'rgba(20, 184, 166, 0.05)'
                  : 'var(--od-bg-raised)',
              }}
            >
              <div
                className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${config.bg}`}
              >
                <Icon className={`size-4 ${config.color}`} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--od-text-primary)' }}>
                    {entity.name}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${config.bg} ${config.color}`}
                  >
                    {config.label}
                  </span>
                </div>
                <p
                  className="mt-0.5 line-clamp-2 text-xs"
                  style={{ color: 'var(--od-text-muted)' }}
                >
                  {entity.description}
                </p>
                <div className="mt-1.5">
                  <ConfidenceBar confidence={entity.confidence} />
                </div>
              </div>

              <div className="mt-1 shrink-0">
                {isSelected ? (
                  <Check className="size-5" style={{ color: 'var(--od-teal-400)' }} />
                ) : (
                  <X className="size-5" style={{ color: 'var(--od-text-disabled)' }} />
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div
        className="flex justify-end gap-2 pt-4"
        style={{ borderTop: '1px solid var(--od-border-default)' }}
      >
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
