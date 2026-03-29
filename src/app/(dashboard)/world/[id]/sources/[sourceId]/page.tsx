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
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
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
          <div className="w-80 border-l p-6">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="mt-4 h-4 w-32" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
          Failed to load source material. Please try again.
        </div>
      </div>
    )
  }

  const source = data.data

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Link
          href={`/world/${worldId}/sources`}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <FileText className="h-5 w-5 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold">{source.title}</h1>
          <div className="flex items-center gap-2">
            {source.type && (
              <Badge variant="secondary" className="text-xs">
                {source.type}
              </Badge>
            )}
            {source.author && (
              <span className="text-xs text-muted-foreground">
                by {source.author}
              </span>
            )}
            {source.entities.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {source.entities.length} entities detected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Annotated text */}
        <div className="flex-1 overflow-hidden border-r">
          {source.content ? (
            <AnnotatedSourceView
              content={source.content}
              entities={source.entities}
              selectedEntity={selectedEntity}
              onSelectEntity={setSelectedEntity}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
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
