'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  DualTimeline,
  MOCK_DATA,
  type DualTimelineData,
  type TimelineEvent,
  type TimelineLane,
} from '@/components/visualizations/dual-timeline'
import { VizShell } from '@/components/visualizations/viz-shell'

// ---------------------------------------------------------------------------
// Types for API responses
// ---------------------------------------------------------------------------

interface ApiEvent {
  id: string
  name: string
  description?: string | null
  fabulaPosition?: number | null
  isKeyEvent?: boolean
  locationId?: string | null
}

interface ApiCharacter {
  id: string
  name: string
}

// ---------------------------------------------------------------------------
// Transform API data → DualTimelineData
// ---------------------------------------------------------------------------

const LANE_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
]

function transformToTimelineData(
  events: ApiEvent[],
  characters: ApiCharacter[],
): DualTimelineData {
  // Build one fabula + one sjuzhet lane per character
  const lanes: TimelineLane[] = characters.flatMap((char, i) => {
    const color = LANE_COLORS[i % LANE_COLORS.length]
    return [
      { id: `fabula-${char.id}`, label: char.name, color, timeline: 'fabula' as const, order: i },
      { id: `sjuzhet-${char.id}`, label: char.name, color, timeline: 'sjuzhet' as const, order: i },
    ]
  })

  // Default lane when there are no characters
  if (lanes.length === 0) {
    lanes.push(
      { id: 'fabula-default', label: 'Main', color: '#6366f1', timeline: 'fabula', order: 0 },
      { id: 'sjuzhet-default', label: 'Main', color: '#6366f1', timeline: 'sjuzhet', order: 0 },
    )
  }

  const timelineEvents: TimelineEvent[] = events.map((evt, i) => {
    const pos = evt.fabulaPosition ?? i
    const laneId = lanes.length > 2
      ? `fabula-${characters[0].id}`
      : 'fabula-default'

    return {
      id: evt.id,
      title: evt.name,
      description: evt.description ?? '',
      fabulaStart: pos,
      fabulaEnd: pos + 1,
      sjuzhetStart: i,
      sjuzhetEnd: i + 1,
      level: 'scene' as const,
      laneId,
      characterIds: [],
      category: evt.isKeyEvent ? 'key' : 'event',
      color: evt.isKeyEvent ? '#ef4444' : '#6366f1',
    }
  })

  return { events: timelineEvents, lanes }
}

// ---------------------------------------------------------------------------
// Data hook
// ---------------------------------------------------------------------------

function useTimelineData(worldId: string) {
  return useQuery<DualTimelineData>({
    queryKey: ['timeline', worldId],
    queryFn: async () => {
      const [eventsRes, charsRes] = await Promise.all([
        fetch(`/api/worlds/${worldId}/events`),
        fetch(`/api/worlds/${worldId}/characters`),
      ])
      if (!eventsRes.ok || !charsRes.ok) {
        throw new Error('Failed to fetch timeline data')
      }
      const events = await eventsRes.json()
      const chars = await charsRes.json()
      return transformToTimelineData(events.data ?? [], chars.data ?? [])
    },
    enabled: !!worldId,
  })
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TimelinePage() {
  const params = useParams<{ id: string }>()
  const worldId = params.id
  const { data, isLoading } = useTimelineData(worldId)

  const hasData = !!data && (data.events.length > 0 || data.lanes.length > 0)
  const timelineData = hasData ? data : MOCK_DATA

  return (
    <VizShell title="Timeline" isLoading={isLoading} isEmpty={!isLoading && !hasData}>
      <DualTimeline
        data={timelineData}
        onEventSelect={(eventId) => {
          /* future: open event detail panel */
        }}
      />
    </VizShell>
  )
}
