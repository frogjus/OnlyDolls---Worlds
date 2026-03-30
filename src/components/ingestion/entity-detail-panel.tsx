'use client'

import { useEffect } from 'react'
import { User, MapPin, Zap, Package, Users, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLayoutStore } from '@/stores/layout-store'
import type { SourceEntity } from '@/lib/hooks/use-source-detail'

const ENTITY_CONFIG: Record<
  SourceEntity['type'],
  { icon: typeof User; label: string; color: string; bg: string }
> = {
  character: {
    icon: User,
    label: 'Character',
    color: 'text-[var(--od-cyan-400)]',
    bg: 'bg-[rgba(6,182,212,0.12)]',
  },
  location: {
    icon: MapPin,
    label: 'Location',
    color: 'text-emerald-400',
    bg: 'bg-[rgba(34,197,94,0.12)]',
  },
  event: {
    icon: Zap,
    label: 'Event',
    color: 'text-[var(--od-violet-400)]',
    bg: 'bg-[rgba(124,58,237,0.12)]',
  },
  item: {
    icon: Package,
    label: 'Item',
    color: 'text-amber-400',
    bg: 'bg-[rgba(245,158,11,0.12)]',
  },
  faction: {
    icon: Users,
    label: 'Faction',
    color: 'text-rose-400',
    bg: 'bg-[rgba(239,68,68,0.12)]',
  },
}

interface EntityDetailPanelProps {
  entity: SourceEntity | null
  worldId: string
  onClose: () => void
}

export function EntityDetailPanel({
  entity,
  worldId,
  onClose,
}: EntityDetailPanelProps) {
  const { setInspectorOpen } = useLayoutStore()

  // Open inspector when an entity is selected, close when deselected
  useEffect(() => {
    if (entity) {
      setInspectorOpen(true)
    }
  }, [entity, setInspectorOpen])

  if (!entity) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center p-6 text-center"
        style={{ background: 'var(--od-bg-raised)' }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--od-bg-surface)]">
          <User className="h-6 w-6" style={{ color: 'var(--od-text-muted)' }} />
        </div>
        <p className="mt-4 text-sm font-medium" style={{ color: 'var(--od-text-muted)' }}>
          Select a highlighted entity in the text to view details
        </p>
      </div>
    )
  }

  const config = ENTITY_CONFIG[entity.type]
  const Icon = config.icon
  const confidencePercent = Math.round(entity.confidence * 100)

  // Build link to the entity's page based on type
  const entityPagePath =
    entity.type === 'character'
      ? `/world/${worldId}/characters`
      : entity.type === 'location'
        ? `/world/${worldId}/settings`
        : null

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--od-bg-raised)' }}>
      {/* Header */}
      <div
        className="flex items-start justify-between p-4"
        style={{ borderBottom: '1px solid var(--od-border-default)' }}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bg}`}
          >
            <Icon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div>
            <h3 className="text-base font-semibold font-[family-name:var(--font-heading)]" style={{ color: 'var(--od-text-primary)' }}>
              {entity.name}
            </h3>
            <Badge
              variant="secondary"
              className={`mt-1 text-xs ${config.bg} ${config.color} border-0`}
            >
              {config.label}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Description */}
        <div>
          <h4 className="text-caption" style={{ color: 'var(--od-text-muted)' }}>
            Description
          </h4>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--od-text-secondary)' }}>
            {entity.description || 'No description available.'}
          </p>
        </div>

        {/* Confidence */}
        <div>
          <h4 className="text-caption" style={{ color: 'var(--od-text-muted)' }}>
            Extraction Confidence
          </h4>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full" style={{ background: 'var(--od-bg-surface)' }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${confidencePercent}%`,
                  background:
                    confidencePercent >= 80
                      ? 'linear-gradient(90deg, var(--od-teal-600), var(--od-teal-400))'
                      : confidencePercent >= 60
                        ? 'linear-gradient(90deg, #d97706, #fbbf24)'
                        : 'linear-gradient(90deg, #dc2626, #f87171)',
                }}
              />
            </div>
            <span
              className="text-sm font-medium tabular-nums"
              style={{ color: 'var(--od-text-primary)' }}
            >
              {confidencePercent}%
            </span>
          </div>
        </div>

        {/* Status */}
        <div>
          <h4 className="text-caption" style={{ color: 'var(--od-text-muted)' }}>
            Status
          </h4>
          <Badge
            variant={entity.confirmed ? 'default' : 'secondary'}
            className={`mt-1.5 ${
              entity.confirmed
                ? 'bg-[rgba(20,184,166,0.15)] text-[var(--od-teal-300)] border-0'
                : 'bg-[var(--od-bg-surface)] text-[var(--od-text-muted)] border-0'
            }`}
          >
            {entity.confirmed ? 'Confirmed' : 'Proposed'}
          </Badge>
        </div>

        {/* Link to entity page */}
        {entityPagePath && (
          <div>
            <a
              href={entityPagePath}
              className="inline-flex items-center gap-1 text-sm hover:underline"
              style={{ color: 'var(--od-teal-400)' }}
            >
              View all {config.label.toLowerCase()}s
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
