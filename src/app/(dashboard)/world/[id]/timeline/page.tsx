'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  DualTimeline,
  type DualTimelineData,
  type TimelineEvent,
  type TimelineLane,
} from '@/components/visualizations/dual-timeline'
import { VizShell } from '@/components/visualizations/viz-shell'
import { VizEmptyState } from '@/components/visualizations/viz-empty-state'
import { VizSkeleton } from '@/components/visualizations/viz-skeleton'
import { useEvents } from '@/lib/hooks/use-events'
import { useScenes } from '@/lib/hooks/use-scenes'
import type { Event, Scene } from '@/types'

const EVENT_COLORS = [
  '#6366f1', '#22d3ee', '#10b981', '#f97316', '#ec4899',
  '#a78bfa', '#eab308', '#ef4444', '#64748b', '#f43f5e',
]

function buildTimelineData(
  events: Event[],
  scenes: Scene[],
): DualTimelineData {
  const sceneByEvent = new Map<string, Scene>()
  for (const s of scenes) {
    if (s.eventId) sceneByEvent.set(s.eventId, s)
  }

  const lanes: TimelineLane[] = [
    { id: 'fabula-main', label: 'Fabula (Chronological)', color: '#6366f1', timeline: 'fabula', order: 0 },
    { id: 'sjuzhet-main', label: 'Sjuzhet (Narrative)', color: '#22d3ee', timeline: 'sjuzhet', order: 0 },
  ]

  const timelineEvents: TimelineEvent[] = []
  const sorted = [...events].sort(
    (a, b) => (a.fabulaPosition ?? 0) - (b.fabulaPosition ?? 0),
  )

  sorted.forEach((event, idx) => {
    const fPos = event.fabulaPosition ?? idx
    const linkedScene = sceneByEvent.get(event.id)
    const sPos = linkedScene?.sjuzhetPosition ?? fPos
    const color = EVENT_COLORS[idx % EVENT_COLORS.length]

    // Fabula lane event
    timelineEvents.push({
      id: `${event.id}-f`,
      title: event.name,
      description: event.description ?? '',
      fabulaStart: fPos,
      fabulaEnd: fPos + 8,
      sjuzhetStart: sPos,
      sjuzhetEnd: sPos + 8,
      level: event.isKeyEvent ? 'episode' : 'scene',
      laneId: 'fabula-main',
      characterIds: [],
      category: event.isKeyEvent ? 'Key Event' : 'Event',
      color,
    })

    // Sjuzhet lane event
    timelineEvents.push({
      id: `${event.id}-s`,
      title: event.name,
      description: event.description ?? '',
      fabulaStart: fPos,
      fabulaEnd: fPos + 8,
      sjuzhetStart: sPos,
      sjuzhetEnd: sPos + 8,
      level: event.isKeyEvent ? 'episode' : 'scene',
      laneId: 'sjuzhet-main',
      characterIds: [],
      category: event.isKeyEvent ? 'Key Event' : 'Event',
      color,
    })
  })

  return { events: timelineEvents, lanes }
}

export default function TimelinePage() {
  const params = useParams<{ id: string }>()
  const worldId = params.id

  const { data: eventsData, isLoading: eventsLoading } = useEvents(worldId)
  const { data: scenesData, isLoading: scenesLoading } = useScenes(worldId)

  const isLoading = eventsLoading || scenesLoading
  const events = eventsData?.data ?? []
  const scenes = scenesData?.data ?? []

  const timelineData = useMemo(() => {
    if (events.length === 0) return null
    return buildTimelineData(events, scenes)
  }, [events, scenes])

  return (
    <VizShell title="Timeline">
      {isLoading ? (
        <VizSkeleton variant="timeline" />
      ) : !timelineData ? (
        <VizEmptyState
          illustration="timeline"
          title="No events yet"
          description="Create events in your story world to see them on the dual timeline (fabula vs. sjuzhet)."
        />
      ) : (
        <DualTimeline
          data={timelineData}
          onEventSelect={(eventId) => {
            /* future: open event detail panel */
          }}
        />
      )}
    </VizShell>
  )
}
