'use client'

import { useMemo } from 'react'
import type { SourceEntity } from '@/lib/hooks/use-source-detail'

const ENTITY_COLORS: Record<SourceEntity['type'], string> = {
  character: 'bg-blue-100 text-blue-900 hover:bg-blue-200',
  location: 'bg-green-100 text-green-900 hover:bg-green-200',
  event: 'bg-purple-100 text-purple-900 hover:bg-purple-200',
  item: 'bg-amber-100 text-amber-900 hover:bg-amber-200',
  faction: 'bg-red-100 text-red-900 hover:bg-red-200',
}

interface TextSegment {
  text: string
  entity?: SourceEntity
}

function buildAnnotatedSegments(
  text: string,
  entities: SourceEntity[]
): TextSegment[] {
  if (entities.length === 0) return [{ text }]

  // Find all entity name occurrences, longest match first to avoid partial overlaps
  const sorted = [...entities].sort((a, b) => b.name.length - a.name.length)

  interface Match {
    start: number
    end: number
    entity: SourceEntity
  }

  const matches: Match[] = []

  for (const entity of sorted) {
    if (!entity.name) continue
    const escaped = entity.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi')
    let m: RegExpExecArray | null
    while ((m = regex.exec(text)) !== null) {
      const start = m.index
      const end = start + m[0].length
      // Skip if overlaps with an existing match
      const overlaps = matches.some(
        (existing) => start < existing.end && end > existing.start
      )
      if (!overlaps) {
        matches.push({ start, end, entity })
      }
    }
  }

  matches.sort((a, b) => a.start - b.start)

  const segments: TextSegment[] = []
  let cursor = 0

  for (const match of matches) {
    if (match.start > cursor) {
      segments.push({ text: text.slice(cursor, match.start) })
    }
    segments.push({
      text: text.slice(match.start, match.end),
      entity: match.entity,
    })
    cursor = match.end
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) })
  }

  return segments
}

interface AnnotatedSourceViewProps {
  content: string
  entities: SourceEntity[]
  selectedEntity: SourceEntity | null
  onSelectEntity: (entity: SourceEntity) => void
}

export function AnnotatedSourceView({
  content,
  entities,
  selectedEntity,
  onSelectEntity,
}: AnnotatedSourceViewProps) {
  const segments = useMemo(
    () => buildAnnotatedSegments(content, entities),
    [content, entities]
  )

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="prose prose-sm max-w-none whitespace-pre-wrap font-mono text-sm leading-relaxed">
        {segments.map((segment, i) => {
          if (!segment.entity) {
            return <span key={i}>{segment.text}</span>
          }

          const isSelected =
            selectedEntity?.name === segment.entity.name &&
            selectedEntity?.type === segment.entity.type

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectEntity(segment.entity!)}
              className={`inline cursor-pointer rounded px-0.5 transition-colors ${
                ENTITY_COLORS[segment.entity.type]
              } ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}`}
            >
              {segment.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}
