'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  PacingHeatmap,
  type PacingHeatmapData,
  type PacingMetric,
  type PacingRow,
} from '@/components/visualizations/pacing-heatmap'
import { VizShell } from '@/components/visualizations/viz-shell'
import { VizEmptyState } from '@/components/visualizations/viz-empty-state'
import { VizSkeleton } from '@/components/visualizations/viz-skeleton'
import { useScenes } from '@/lib/hooks/use-scenes'
import type { Scene } from '@/types'

const PACING_METRICS: PacingMetric[] = [
  { id: 'dialogue_density', label: 'Dialogue', colorScale: 'sequential', description: 'Estimated dialogue density' },
  { id: 'action_density', label: 'Action', colorScale: 'sequential', description: 'Estimated action density' },
  { id: 'description_density', label: 'Description', colorScale: 'sequential', description: 'Estimated description density' },
  { id: 'word_density', label: 'Word Count', colorScale: 'sequential', description: 'Relative word count (vs. longest scene)' },
]

function estimateContentMetrics(content: string | null) {
  if (!content || content.trim().length === 0) {
    return { dialogue: 0, action: 0, description: 0, wordCount: 0 }
  }

  const lines = content.split('\n').filter((l) => l.trim().length > 0)
  const wordCount = content.split(/\s+/).length

  let dialogueLines = 0
  let actionLines = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('"') || trimmed.startsWith('\u201c') || trimmed.includes('said') || trimmed.includes('asked')) {
      dialogueLines++
    } else if (trimmed.length < 80 && /\b(ran|jumped|hit|grabbed|threw|pulled|pushed|fell|stood|walked)\b/i.test(trimmed)) {
      actionLines++
    }
  }

  const total = Math.max(lines.length, 1)
  return {
    dialogue: dialogueLines / total,
    action: actionLines / total,
    description: Math.max(0, 1 - (dialogueLines + actionLines) / total),
    wordCount,
  }
}

function buildPacingData(scenes: Scene[]): PacingHeatmapData {
  const sorted = [...scenes].sort(
    (a, b) => (a.sjuzhetPosition ?? 0) - (b.sjuzhetPosition ?? 0),
  )

  const maxWordCount = Math.max(
    ...sorted.map((s) => estimateContentMetrics(s.content ?? null).wordCount),
    1,
  )

  const rows: PacingRow[] = sorted.map((scene, i) => {
    const metrics = estimateContentMetrics(scene.content ?? null)
    return {
      id: scene.id,
      label: scene.name,
      position: i,
      values: {
        dialogue_density: metrics.dialogue,
        action_density: metrics.action,
        description_density: metrics.description,
        word_density: metrics.wordCount / maxWordCount,
      },
    }
  })

  return { rows, metrics: PACING_METRICS }
}

export default function PacingPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const { data, isLoading } = useScenes(worldId)
  const scenes = data?.data ?? []

  const pacingData = useMemo(() => {
    if (scenes.length === 0) return null
    return buildPacingData(scenes)
  }, [scenes])

  return (
    <VizShell title="Pacing Analysis">
      {isLoading ? (
        <VizSkeleton variant="chart" />
      ) : !pacingData ? (
        <VizEmptyState
          illustration="chart"
          title="No scenes yet"
          description="Create scenes with content to analyze pacing, dialogue density, and action intensity across your narrative."
        />
      ) : (
        <PacingHeatmap
          data={pacingData}
          onCellSelect={(rowId, metricId) => {
            /* future: open scene detail with metric highlight */
          }}
        />
      )}
    </VizShell>
  )
}
