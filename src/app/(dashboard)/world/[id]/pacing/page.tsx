'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PacingHeatmap } from '@/components/visualizations/pacing-heatmap'
import type { PacingHeatmapData, PacingRow, PacingMetric } from '@/components/visualizations/pacing-heatmap'
import { VizShell } from '@/components/visualizations/viz-shell'

// ---------------------------------------------------------------------------
// Metric definitions
// ---------------------------------------------------------------------------

const PACING_METRICS: PacingMetric[] = [
  {
    id: 'action_density',
    label: 'Action Density',
    colorScale: 'sequential',
    description: 'Derived from scene purpose — climax/confrontation scenes score high, exposition/setup scenes score low',
  },
  {
    id: 'dialogue_ratio',
    label: 'Dialogue Ratio',
    colorScale: 'sequential',
    description: 'Estimated dialogue-to-prose ratio derived from scene tone',
  },
  {
    id: 'tension',
    label: 'Tension',
    colorScale: 'diverging',
    description: 'Narrative tension level derived from scene polarity — negative polarity indicates high tension',
  },
  {
    id: 'scene_length',
    label: 'Scene Length',
    colorScale: 'sequential',
    description: 'Normalized word count target relative to the longest scene',
  },
]

// ---------------------------------------------------------------------------
// Derivation helpers
// ---------------------------------------------------------------------------

const PURPOSE_ACTION: Record<string, number> = {
  climax: 0.9,
  confrontation: 0.85,
  action: 0.8,
  turning_point: 0.7,
  complication: 0.65,
  rising_action: 0.6,
  resolution: 0.5,
  revelation: 0.45,
  falling_action: 0.4,
  development: 0.35,
  transition: 0.3,
  setup: 0.25,
  exposition: 0.2,
  introduction: 0.15,
}

const TONE_DIALOGUE: Record<string, number> = {
  intense: 0.7,
  dramatic: 0.65,
  confrontational: 0.7,
  emotional: 0.6,
  tense: 0.55,
  suspenseful: 0.45,
  ominous: 0.4,
  mysterious: 0.35,
  reflective: 0.3,
  melancholic: 0.25,
  calm: 0.2,
  peaceful: 0.15,
  humorous: 0.6,
  lighthearted: 0.5,
}

function deriveActionDensity(purpose?: string | null): number {
  if (!purpose) return 0.3
  const key = purpose.toLowerCase().replace(/[\s-]+/g, '_')
  return PURPOSE_ACTION[key] ?? 0.3
}

function deriveDialogueRatio(tone?: string | null): number {
  if (!tone) return 0.35
  const key = tone.toLowerCase().replace(/[\s-]+/g, '_')
  return TONE_DIALOGUE[key] ?? 0.35
}

function deriveTension(polarity?: number | string | null): number {
  if (polarity == null) return 0.5
  const num = typeof polarity === 'string' ? parseFloat(polarity) : polarity
  if (isNaN(num)) return 0.5
  // polarity: positive → low tension, negative → high tension, 0 → mid
  return Math.max(0, Math.min(1, 0.5 - num * 0.4))
}

// ---------------------------------------------------------------------------
// Scene response type (matches API)
// ---------------------------------------------------------------------------

interface SceneResponse {
  id: string
  name: string
  summary?: string | null
  sjuzhetPosition?: number | null
  purpose?: string | null
  tone?: string | null
  polarity?: number | string | null
  wordCountTarget?: number | null
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PacingPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const [data, setData] = useState<PacingHeatmapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!worldId) return

    let cancelled = false

    async function fetchScenes() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/worlds/${worldId}/scenes`)
        if (!res.ok) throw new Error(`Failed to fetch scenes (${res.status})`)
        const json = await res.json()
        const scenes: SceneResponse[] = json.data ?? []

        if (cancelled) return

        // Find max word count for normalization
        const maxWordCount = scenes.reduce(
          (max, s) => Math.max(max, s.wordCountTarget ? Number(s.wordCountTarget) : 0),
          1,
        )

        const rows: PacingRow[] = scenes
          .sort((a, b) => (a.sjuzhetPosition ?? 0) - (b.sjuzhetPosition ?? 0))
          .map((scene, i) => ({
            id: scene.id,
            label: scene.name,
            position: scene.sjuzhetPosition ?? i,
            values: {
              action_density: deriveActionDensity(scene.purpose),
              dialogue_ratio: deriveDialogueRatio(scene.tone),
              tension: deriveTension(scene.polarity),
              scene_length: scene.wordCountTarget
                ? Math.max(0, Math.min(1, Number(scene.wordCountTarget) / maxWordCount))
                : 0,
            },
          }))

        setData({ rows, metrics: PACING_METRICS })
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchScenes()
    return () => { cancelled = true }
  }, [worldId])

  const isEmpty = !isLoading && !error && (!data || data.rows.length === 0)

  return (
    <VizShell
      title="Pacing Analysis"
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyState={{
        illustration: 'chart',
        title: 'No scenes yet',
        description: 'Add scenes to this story world to see pacing analysis.',
      }}
    >
      {error ? (
        <div className="flex h-64 items-center justify-center text-destructive">
          {error}
        </div>
      ) : (
        <PacingHeatmap data={data ?? undefined} />
      )}
    </VizShell>
  )
}
