import { useQuery } from '@tanstack/react-query'
import type { SourceMaterial } from '@/types'

export interface SourceEntity {
  name: string
  type: 'character' | 'location' | 'event' | 'item' | 'faction'
  description: string
  confidence: number
  confirmed: boolean
}

export interface SourceDetail extends SourceMaterial {
  entities: SourceEntity[]
}

interface SourceDetailResponse {
  data: SourceDetail
}

function sourceDetailKeys(worldId: string, sourceId: string) {
  return ['sources', worldId, sourceId] as const
}

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error ?? 'Request failed')
  }
  return res.json()
}

export function useSourceDetail(worldId: string, sourceId: string) {
  return useQuery({
    queryKey: sourceDetailKeys(worldId, sourceId),
    queryFn: () =>
      apiFetch<SourceDetailResponse>(
        `/api/worlds/${worldId}/sources/${sourceId}`
      ),
    enabled: !!worldId && !!sourceId,
  })
}
