'use client'

import { MindMap, MOCK_DATA } from '@/components/visualizations/mind-map'
import { VizShell } from '@/components/visualizations/viz-shell'

export default function MindMapPage() {
  return (
    <VizShell title="Mind Map">
      <MindMap data={MOCK_DATA} />
    </VizShell>
  )
}
