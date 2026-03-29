'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  MindMap,
  type MindMapData,
  type WorldElement,
  type WorldConnection,
} from '@/components/visualizations/mind-map'
import { VizShell } from '@/components/visualizations/viz-shell'
import { VizEmptyState } from '@/components/visualizations/viz-empty-state'
import { VizSkeleton } from '@/components/visualizations/viz-skeleton'
import { useCharacters } from '@/lib/hooks/use-characters'
import { useLocations } from '@/lib/hooks/use-locations'
import { useObjects } from '@/lib/hooks/use-objects'
import { useFactions } from '@/lib/hooks/use-factions'
import { useEvents } from '@/lib/hooks/use-events'
import { useThemes } from '@/lib/hooks/use-themes'
import { useRelationships } from '@/lib/hooks/use-relationships'
import type {
  Character,
  Location,
  StoryObject,
  Faction,
  Event,
  Theme,
  Relationship,
} from '@/types'

function buildMindMapData(
  characters: Character[],
  locations: Location[],
  objects: StoryObject[],
  factions: Faction[],
  events: Event[],
  themes: Theme[],
  relationships: Relationship[],
): MindMapData {
  const elements: WorldElement[] = []
  const connections: WorldConnection[] = []

  for (const c of characters) {
    elements.push({
      id: c.id,
      name: c.name,
      type: 'character',
      description: c.description ?? c.archetype ?? 'Character',
      tags: c.archetype ? [c.archetype] : [],
    })
  }

  for (const l of locations) {
    elements.push({
      id: l.id,
      name: l.name,
      type: 'location',
      description: l.description ?? l.type ?? 'Location',
      parentId: l.parentId ?? undefined,
      tags: l.type ? [l.type] : [],
    })
  }

  for (const o of objects) {
    elements.push({
      id: o.id,
      name: o.name,
      type: 'artifact',
      description: o.description ?? o.significance ?? 'Story object',
      tags: o.type ? [o.type] : [],
    })
  }

  for (const f of factions) {
    elements.push({
      id: f.id,
      name: f.name,
      type: 'faction',
      description: f.description ?? 'Faction',
      tags: f.type ? [f.type] : [],
    })
  }

  for (const e of events) {
    elements.push({
      id: e.id,
      name: e.name,
      type: 'event',
      description: e.description ?? 'Event',
      tags: e.isKeyEvent ? ['key-event'] : [],
    })
  }

  for (const t of themes) {
    elements.push({
      id: t.id,
      name: t.name,
      type: 'concept',
      description: t.description ?? t.thesis ?? 'Theme',
      tags: ['theme'],
    })
  }

  for (const r of relationships) {
    connections.push({
      id: r.id,
      sourceId: r.character1Id,
      targetId: r.character2Id,
      label: r.type,
      type: 'related',
    })
  }

  for (const e of events) {
    if (e.locationId) {
      connections.push({
        id: `evt-loc-${e.id}`,
        sourceId: e.id,
        targetId: e.locationId,
        label: 'at',
        type: 'located_in',
      })
    }
  }

  return { elements, connections }
}

export default function MindMapPage() {
  const { id: worldId } = useParams<{ id: string }>()

  const { data: charsData, isLoading: charsLoading } = useCharacters(worldId)
  const { data: locsData, isLoading: locsLoading } = useLocations(worldId)
  const { data: objsData, isLoading: objsLoading } = useObjects(worldId)
  const { data: factsData, isLoading: factsLoading } = useFactions(worldId)
  const { data: evtsData, isLoading: evtsLoading } = useEvents(worldId)
  const { data: themesData, isLoading: themesLoading } = useThemes(worldId)
  const { data: relsData, isLoading: relsLoading } = useRelationships(worldId)

  const isLoading =
    charsLoading || locsLoading || objsLoading || factsLoading ||
    evtsLoading || themesLoading || relsLoading

  const characters = charsData?.data ?? []
  const locations = locsData?.data ?? []
  const objects = objsData?.data ?? []
  const factions = factsData?.data ?? []
  const events = evtsData?.data ?? []
  const themes = themesData?.data ?? []
  const relationships = relsData?.data ?? []

  const totalEntities =
    characters.length + locations.length + objects.length +
    factions.length + events.length + themes.length

  const mindMapData = useMemo(() => {
    if (totalEntities === 0) return null
    return buildMindMapData(
      characters, locations, objects, factions, events, themes, relationships,
    )
  }, [characters, locations, objects, factions, events, themes, relationships, totalEntities])

  return (
    <VizShell title="Mind Map">
      {isLoading ? (
        <VizSkeleton variant="graph" />
      ) : !mindMapData ? (
        <VizEmptyState
          illustration="graph"
          title="No world entities yet"
          description="Add characters, locations, objects, or events to visualize your story world as an interactive mind map."
        />
      ) : (
        <MindMap
          data={mindMapData}
          onElementSelect={(elementId) => {
            /* future: open entity detail panel */
          }}
        />
      )}
    </VizShell>
  )
}
