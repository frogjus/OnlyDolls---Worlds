'use client'

import { PacingHeatmap, MOCK_DATA } from '@/components/visualizations/pacing-heatmap'
import { VizShell } from '@/components/visualizations/viz-shell'

export default function PacingPage() {
  return (
    <VizShell title="Pacing Analysis">
      <PacingHeatmap data={MOCK_DATA} />
    </VizShell>
  )
}
