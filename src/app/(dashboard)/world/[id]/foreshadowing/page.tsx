'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { ForeshadowingWeb } from '@/components/visualizations/foreshadowing-web'
import { VizShell } from '@/components/visualizations/viz-shell'
import { VizEmptyState } from '@/components/visualizations/viz-empty-state'
import { VizSkeleton } from '@/components/visualizations/viz-skeleton'
import { useSetupPayoffs, type SetupPayoffWithScenes } from '@/lib/hooks/use-setup-payoffs'

function buildForeshadowingData(items: SetupPayoffWithScenes[]) {
  const nodes: Array<{
    id: string
    type: 'setup' | 'payoff'
    title: string
    description: string
    position: number
    positionLabel: string
    sceneId: string
    status: 'connected' | 'orphan-setup' | 'deus-ex-machina'
    characterIds: string[]
    tags: string[]
  }> = []

  const links: Array<{
    id: string
    setupId: string
    payoffId: string
    subtlety: 'obvious' | 'moderate' | 'subtle'
    notes?: string
  }> = []

  for (const item of items) {
    const hasPayoff = !!item.payoffScene
    const setupPos = item.setupScene.sjuzhetPosition ?? 0
    const setupNodeId = `setup-${item.id}`

    nodes.push({
      id: setupNodeId,
      type: 'setup',
      title: item.description ?? item.setupScene.name,
      description: `Setup: ${item.setupScene.name}${item.setupType ? ` (${item.setupType})` : ''}`,
      position: setupPos,
      positionLabel: item.setupScene.name,
      sceneId: item.setupSceneId,
      status: hasPayoff ? 'connected' : 'orphan-setup',
      characterIds: [],
      tags: item.setupType ? [item.setupType] : [],
    })

    if (item.payoffScene) {
      const payoffPos = item.payoffScene.sjuzhetPosition ?? 0
      const payoffNodeId = `payoff-${item.id}`

      nodes.push({
        id: payoffNodeId,
        type: 'payoff',
        title: item.payoffScene.name,
        description: `Payoff for: ${item.description ?? item.setupScene.name}`,
        position: payoffPos,
        positionLabel: item.payoffScene.name,
        sceneId: item.payoffSceneId!,
        status: 'connected',
        characterIds: [],
        tags: item.status ? [item.status] : [],
      })

      const subtlety: 'obvious' | 'moderate' | 'subtle' =
        item.setupType === 'obvious' ? 'obvious'
          : item.setupType === 'subtle' ? 'subtle'
          : 'moderate'

      links.push({
        id: `link-${item.id}`,
        setupId: setupNodeId,
        payoffId: payoffNodeId,
        subtlety,
        notes: item.description ?? undefined,
      })
    }
  }

  return { nodes, links }
}

export default function ForeshadowingPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const { data, isLoading } = useSetupPayoffs(worldId)
  const items = data?.data ?? []

  const foreshadowingData = useMemo(() => {
    if (items.length === 0) return null
    return buildForeshadowingData(items)
  }, [items])

  return (
    <VizShell title="Foreshadowing Web">
      {isLoading ? (
        <VizSkeleton variant="graph" />
      ) : !foreshadowingData ? (
        <VizEmptyState
          illustration="graph"
          title="No foreshadowing data"
          description="Create setup/payoff links between scenes to track foreshadowing, Chekhov's guns, and narrative plants."
        />
      ) : (
        <ForeshadowingWeb
          data={foreshadowingData}
          onNodeSelect={(nodeId) => {
            /* future: open scene detail panel */
          }}
        />
      )}
    </VizShell>
  )
}
