'use client'

import { ForeshadowingWeb, MOCK_DATA } from '@/components/visualizations/foreshadowing-web'
import { VizShell } from '@/components/visualizations/viz-shell'

export default function ForeshadowingPage() {
  return (
    <VizShell title="Foreshadowing Web">
      <ForeshadowingWeb data={MOCK_DATA} />
    </VizShell>
  )
}
