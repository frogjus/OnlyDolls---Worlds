import { useMemo } from 'react'
import { useBeats } from '@/lib/hooks/use-beats'
import { useCharacters } from '@/lib/hooks/use-characters'
import { useSources } from '@/lib/hooks/use-sources'
import { useDisclosureStore } from '@/stores/disclosure-store'

export type DisclosureTier = 1 | 2 | 3

const TIER_1_VIEWS = ['beats', 'write', 'characters', 'sources'] as const
const TIER_2_VIEWS = ['timeline', 'arcs', 'mindmap', 'treatment'] as const
const TIER_3_VIEWS = [
  'foreshadowing',
  'pacing',
  'causality',
  'factions',
  'knowledge',
  'wiki',
  'consistency',
  'systems',
  'whatif',
  'canon',
] as const

export type ViewSlug =
  | (typeof TIER_1_VIEWS)[number]
  | (typeof TIER_2_VIEWS)[number]
  | (typeof TIER_3_VIEWS)[number]

function getTierForView(slug: string): DisclosureTier {
  if ((TIER_1_VIEWS as readonly string[]).includes(slug)) return 1
  if ((TIER_2_VIEWS as readonly string[]).includes(slug)) return 2
  return 3
}

export function useProgressiveDisclosure(worldId: string) {
  const { data: beats } = useBeats(worldId)
  const { data: charactersResponse } = useCharacters(worldId)
  const { data: sourcesResponse } = useSources(worldId)
  const { showAllViews, tierOverrides } = useDisclosureStore()

  const characters = charactersResponse?.data ?? charactersResponse
  const sources = sourcesResponse?.data ?? sourcesResponse

  const beatCount = Array.isArray(beats) ? beats.length : 0
  const characterCount = Array.isArray(characters) ? characters.length : 0
  const hasUploaded = Array.isArray(sources) ? sources.length > 0 : false

  const maxTier = useMemo<DisclosureTier>(() => {
    if (showAllViews) return 3
    const hasContent = beatCount > 0 || characterCount > 0
    const hasSubstantial =
      beatCount >= 5 && characterCount >= 2 && hasUploaded
    if (hasSubstantial) return 3
    if (hasContent) return 2
    return 1
  }, [showAllViews, beatCount, characterCount, hasUploaded])

  function isViewVisible(slug: string): boolean {
    if (showAllViews) return true
    if (tierOverrides[slug] !== undefined) return tierOverrides[slug]
    return getTierForView(slug) <= maxTier
  }

  return {
    maxTier,
    beatCount,
    characterCount,
    hasUploaded,
    isViewVisible,
    showAllViews,
  }
}
