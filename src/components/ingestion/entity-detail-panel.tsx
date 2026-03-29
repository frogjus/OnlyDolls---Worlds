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
    color: 'text-blue-700',
    bg: 'bg-blue-50',
  },
  location: {
    icon: MapPin,
    label: 'Location',
    color: 'text-green-700',
    bg: 'bg-green-50',
  },
  event: {
    icon: Zap,
    label: 'Event',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
  },
  item: {
    icon: Package,
    label: 'Item',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  faction: {
    icon: Users,
    label: 'Faction',
    color: 'text-red-700',
    bg: 'bg-red-50',
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
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <User className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground">
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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between border-b p-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bg}`}
          >
            <Icon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div>
            <h3 className="text-base font-semibold">{entity.name}</h3>
            <Badge variant="secondary" className="mt-1 text-xs">
              {config.label}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Description */}
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Description
          </h4>
          <p className="mt-1 text-sm">{entity.description || 'No description available.'}</p>
        </div>

        {/* Confidence */}
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Extraction Confidence
          </h4>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-muted">
              <div
                className={`h-2 rounded-full transition-all ${
                  confidencePercent >= 80
                    ? 'bg-green-500'
                    : confidencePercent >= 60
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
            <span className="text-sm font-medium tabular-nums">
              {confidencePercent}%
            </span>
          </div>
        </div>

        {/* Status */}
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </h4>
          <Badge
            variant={entity.confirmed ? 'default' : 'secondary'}
            className="mt-1"
          >
            {entity.confirmed ? 'Confirmed' : 'Proposed'}
          </Badge>
        </div>

        {/* Link to entity page */}
        {entityPagePath && (
          <div>
            <a
              href={entityPagePath}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all {config.label.toLowerCase()}s
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
