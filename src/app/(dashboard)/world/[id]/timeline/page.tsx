'use client'

import { useParams } from 'next/navigation'
import { DualTimeline, MOCK_DATA } from '@/components/visualizations/dual-timeline'
import { VizShell } from '@/components/visualizations/viz-shell'

export default function TimelinePage() {
  const params = useParams<{ id: string }>()
  const _worldId = params.id

  return (
    <VizShell title="Timeline">
      <DualTimeline
        data={MOCK_DATA}
        onEventSelect={(eventId) => {
          /* future: open event detail panel */
        }}
      />
    </VizShell>
  )
}
