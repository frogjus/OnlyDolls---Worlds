'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'

import { ForeshadowingWeb } from '@/components/visualizations/foreshadowing-web'
import { VizShell } from '@/components/visualizations/viz-shell'
import { useBeats } from '@/lib/hooks/use-beats'

export default function ForeshadowingPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const { data: beats = [], isLoading } = useBeats(worldId)

  const foreshadowingData = useMemo(() => {
    if (beats.length === 0) return { nodes: [], links: [] }

    const sorted = [...beats].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0)
    )

    // Split into early (setup) and late (payoff) halves based on position
    const midpoint = Math.ceil(sorted.length / 2)
    const setupBeats = sorted.slice(0, midpoint)
    const payoffBeats = sorted.slice(midpoint)

    const setupIds = new Set(setupBeats.map((b) => b.id))
    const payoffIds = new Set(payoffBeats.map((b) => b.id))

    // Build links: pair each setup with a payoff by index order
    const links = setupBeats
      .map((setup, i) => {
        const payoff = payoffBeats[i]
        if (!payoff) return null
        const subtleties = ['obvious', 'moderate', 'subtle'] as const
        return {
          id: `link-${setup.id}-${payoff.id}`,
          setupId: setup.id,
          payoffId: payoff.id,
          subtlety: subtleties[i % subtleties.length],
          notes: `"${setup.name}" sets up "${payoff.name}"`,
        }
      })
      .filter((l): l is NonNullable<typeof l> => l !== null)

    const connectedSetupIds = new Set(links.map((l) => l.setupId))
    const connectedPayoffIds = new Set(links.map((l) => l.payoffId))

    const nodes = sorted.map((beat, i) => {
      const isSetup = setupIds.has(beat.id)
      const nodeType = isSetup ? ('setup' as const) : ('payoff' as const)

      let status: 'connected' | 'orphan-setup' | 'deus-ex-machina' = 'connected'
      if (isSetup && !connectedSetupIds.has(beat.id)) {
        status = 'orphan-setup'
      } else if (!isSetup && !connectedPayoffIds.has(beat.id)) {
        status = 'deus-ex-machina'
      }

      return {
        id: beat.id,
        type: nodeType,
        title: beat.name,
        description: beat.description ?? '',
        position: beat.position ?? i,
        positionLabel: `Beat ${beat.position ?? i + 1}`,
        sceneId: beat.id,
        status,
        characterIds: [] as string[],
        tags: beat.status ? [beat.status] : [],
      }
    })

    return { nodes, links }
  }, [beats])

  return (
    <VizShell
      title="Foreshadowing Web"
      isLoading={isLoading}
      isEmpty={foreshadowingData.nodes.length === 0 && !isLoading}
    >
      <ForeshadowingWeb data={foreshadowingData} />
    </VizShell>
  )
}
