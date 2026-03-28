'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'

import { MindMap, MOCK_DATA } from '@/components/visualizations/mind-map'
import type { MindMapData, WorldElement, WorldConnection } from '@/components/visualizations/mind-map'
import { VizShell } from '@/components/visualizations/viz-shell'
import type {
  Character,
  Location,
  Faction,
  Event,
  StoryObject,
  Relationship,
  ApiListResponse,
} from '@/types'

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error ?? 'Request failed')
  }
  return res.json()
}

function mapRelationshipType(type: string): WorldConnection['type'] {
  const lower = type.toLowerCase()
  if (lower === 'contains' || lower === 'parent') return 'contains'
  if (lower === 'controls' || lower === 'commands' || lower === 'leads') return 'controls'
  if (lower === 'located_in' || lower === 'resides' || lower === 'lives_in') return 'located_in'
  return 'related'
}

function transformToMindMapData(
  characters: Character[],
  locations: Location[],
  factions: Faction[],
  events: Event[],
  objects: StoryObject[],
  relationships: Relationship[],
): MindMapData {
  const elements: WorldElement[] = [
    ...characters.map((c): WorldElement => ({
      id: c.id,
      name: c.name,
      type: 'character',
      description: c.description ?? '',
      tags: c.aliases ?? [],
    })),
    ...locations.map((l): WorldElement => ({
      id: l.id,
      name: l.name,
      type: 'location',
      description: l.description ?? '',
      parentId: l.parentId ?? undefined,
      tags: l.type ? [l.type] : [],
    })),
    ...factions.map((f): WorldElement => ({
      id: f.id,
      name: f.name,
      type: 'faction',
      description: f.description ?? '',
      tags: f.type ? [f.type] : [],
    })),
    ...events.map((e): WorldElement => ({
      id: e.id,
      name: e.name,
      type: 'event',
      description: e.description ?? '',
      tags: e.isKeyEvent ? ['key-event'] : [],
    })),
    ...objects.map((o): WorldElement => ({
      id: o.id,
      name: o.name,
      type: 'artifact',
      description: o.description ?? '',
      tags: o.type ? [o.type] : [],
    })),
  ]

  const connections: WorldConnection[] = relationships.map((r): WorldConnection => ({
    id: r.id,
    sourceId: r.character1Id,
    targetId: r.character2Id,
    label: r.subtype ?? r.type,
    type: mapRelationshipType(r.type),
  }))

  return { elements, connections }
}

function useMindMapData(worldId: string) {
  return useQuery({
    queryKey: ['mindmap', worldId],
    queryFn: async (): Promise<MindMapData> => {
      const [characters, locations, factions, events, objects, relationships] =
        await Promise.all([
          apiFetch<ApiListResponse<Character>>(`/api/worlds/${worldId}/characters`),
          apiFetch<ApiListResponse<Location>>(`/api/worlds/${worldId}/locations`),
          apiFetch<ApiListResponse<Faction>>(`/api/worlds/${worldId}/factions`),
          apiFetch<ApiListResponse<Event>>(`/api/worlds/${worldId}/events`),
          apiFetch<ApiListResponse<StoryObject>>(`/api/worlds/${worldId}/objects`),
          apiFetch<ApiListResponse<Relationship>>(`/api/worlds/${worldId}/relationships`),
        ])
      return transformToMindMapData(
        characters.data,
        locations.data,
        factions.data,
        events.data,
        objects.data,
        relationships.data,
      )
    },
    enabled: !!worldId,
  })
}

export default function MindMapPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const { data, isLoading } = useMindMapData(worldId)

  const isEmpty = useMemo(
    () => !isLoading && (!data || data.elements.length === 0),
    [isLoading, data],
  )

  return (
    <VizShell title="Mind Map" isLoading={isLoading} isEmpty={isEmpty}>
      <MindMap data={data ?? MOCK_DATA} />
    </VizShell>
  )
}
