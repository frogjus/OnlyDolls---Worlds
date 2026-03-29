import { useQuery } from '@tanstack/react-query'
import type { ApiListResponse } from '@/types'

interface SetupPayoffWithScenes {
  id: string
  description: string | null
  setupType: string | null
  status: string
  metadata: unknown
  createdAt: string
  updatedAt: string
  storyWorldId: string
  setupSceneId: string
  payoffSceneId: string | null
  setupScene: { id: string; name: string; sjuzhetPosition: number | null }
  payoffScene: { id: string; name: string; sjuzhetPosition: number | null } | null
}

function setupPayoffKeys(worldId: string) {
  return {
    all: ['setup-payoffs', worldId] as const,
  }
}

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error ?? 'Request failed')
  }
  return res.json()
}

export function useSetupPayoffs(worldId: string) {
  return useQuery({
    queryKey: setupPayoffKeys(worldId).all,
    queryFn: () =>
      apiFetch<ApiListResponse<SetupPayoffWithScenes>>(
        `/api/worlds/${worldId}/setup-payoffs`,
      ),
    enabled: !!worldId,
  })
}

export type { SetupPayoffWithScenes }
