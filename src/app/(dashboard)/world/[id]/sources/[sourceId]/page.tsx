'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

import { useSourceDetail } from '@/lib/hooks/use-source-detail'
import type { SourceEntity } from '@/lib/hooks/use-source-detail'
import { AnnotatedSourceView } from '@/components/ingestion/annotated-source-view'
import { EntityDetailPanel } from '@/components/ingestion/entity-detail-panel'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default function SourceDetailPage() {
  const { id: worldId, sourceId } = useParams<{ id: string; sourceId: string }>()
  const { data, isLoading, error } = useSourceDetail(worldId, sourceId)
  const [selectedEntity, setSelectedEntity] = useState<SourceEntity | null>(null)

  if (isLoading) {
    return (
      <div className="flex h-full flex-col" style={{ background: 'var(--od-bg-base)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--od-border-default)' }}>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
        <div className="flex flex-1">
          <div className="flex-1 p-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="w-80 p-6" style={{ borderLeft: '1px solid var(--od-border-default)' }}>
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="mt-4 h-4 w-32" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-4 p-6"
        style={{ background: 'var(--od-bg-base)' }}
      >
        <div
          className="rounded-lg p-6 text-center text-sm text-destructive"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          Failed to load source material. Please try again.
        </div>
        <Link
          href={`/world/${worldId}/sources`}
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          style={{
            border: '1px solid var(--od-border-emphasis)',
            color: 'var(--od-text-secondary)',
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sources
        </Link>
      </div>
    )
  }

  const source = data.data

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--od-bg-base)' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid var(--od-border-default)' }}
      >
        <Link
          href={`/world/${worldId}/sources`}
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-accent"
          title="Back to Sources"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <FileText className="h-5 w-5" style={{ color: 'var(--od-teal-500)' }} />
        <div className="min-w-0 flex-1">
          <h1
            className="truncate text-lg font-semibold font-[family-name:var(--font-heading)]"
            style={{ color: 'var(--od-text-primary)' }}
          >
            {source.title}
          </h1>
          <div className="flex items-center gap-2">
            {source.type && (
              <Badge
                variant="secondary"
                className="text-xs border-0"
                style={{
                  background: 'rgba(20, 184, 166, 0.1)',
                  color: 'var(--od-teal-300)',
                }}
              >
                {source.type}
              </Badge>
            )}
            {source.author && (
              <span className="text-xs" style={{ color: 'var(--od-text-muted)' }}>
                by {source.author}
              </span>
            )}
            {source.entities.length > 0 && (
              <span className="text-xs" style={{ color: 'var(--od-text-muted)' }}>
                {source.entities.length} entities detected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Annotated text — dark reading surface */}
        <div
          className="flex-1 overflow-hidden"
          style={{ borderRight: '1px solid var(--od-border-default)' }}
        >
          {source.content ? (
            <AnnotatedSourceView
              content={source.content}
              entities={source.entities}
              selectedEntity={selectedEntity}
              onSelectEntity={setSelectedEntity}
            />
          ) : (
            <div
              className="flex h-full items-center justify-center text-sm"
              style={{ color: 'var(--od-text-muted)' }}
            >
              No content available for this source.
            </div>
          )}
        </div>

        {/* Right: Entity detail panel */}
        <div className="w-80 shrink-0 overflow-hidden">
          <EntityDetailPanel
            entity={selectedEntity}
            worldId={worldId}
            onClose={() => setSelectedEntity(null)}
          />
        </div>
      </div>
    </div>
  )
}
