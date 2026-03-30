'use client'

import { useMemo } from 'react'
import type { SourceEntity } from '@/lib/hooks/use-source-detail'

// Dark dystopian entity highlight palette — translucent backgrounds with vivid text
const ENTITY_COLORS: Record<SourceEntity['type'], string> = {
  character:
    'bg-[rgba(6,182,212,0.12)] text-[var(--od-cyan-400)] decoration-[var(--od-cyan-500)] hover:bg-[rgba(6,182,212,0.2)]',
  location:
    'bg-[rgba(34,197,94,0.12)] text-emerald-400 decoration-emerald-500 hover:bg-[rgba(34,197,94,0.2)]',
  event:
    'bg-[rgba(124,58,237,0.12)] text-[var(--od-violet-400)] decoration-[var(--od-violet-500)] hover:bg-[rgba(124,58,237,0.2)]',
  item:
    'bg-[rgba(245,158,11,0.12)] text-amber-400 decoration-amber-500 hover:bg-[rgba(245,158,11,0.2)]',
  faction:
    'bg-[rgba(239,68,68,0.12)] text-rose-400 decoration-rose-500 hover:bg-[rgba(239,68,68,0.2)]',
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
    <div
      className="h-full overflow-y-auto p-6"
      style={{ background: 'var(--od-bg-base)' }}
    >
      <div
        className="max-w-none whitespace-pre-wrap font-mono text-sm leading-relaxed"
        style={{ color: 'var(--od-text-secondary)' }}
      >
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
              className={`inline cursor-pointer rounded px-0.5 underline decoration-2 underline-offset-2 transition-colors ${
                ENTITY_COLORS[segment.entity.type]
              } ${isSelected ? 'ring-2 ring-[var(--od-teal-500)] ring-offset-1 ring-offset-[var(--od-bg-base)]' : ''}`}
              style={{ transitionDuration: 'var(--duration-fast)' }}
            >
              {segment.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}
