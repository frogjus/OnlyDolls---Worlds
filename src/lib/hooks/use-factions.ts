import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ApiListResponse,
  ApiResponse,
  Faction,
  CreateFactionPayload,
  UpdateFactionPayload,
} from '@/types'

function factionKeys(worldId: string) {
  return {
    all: ['factions', worldId] as const,
    detail: (id: string) => ['factions', worldId, id] as const,
  }
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error ?? 'Request failed')
  }
  return res.json()
}

export function useFactions(worldId: string) {
  return useQuery({
    queryKey: factionKeys(worldId).all,
    queryFn: () =>
      apiFetch<ApiListResponse<Faction>>(
        `/api/worlds/${worldId}/factions`,
      ),
    enabled: !!worldId,
  })
}

export function useCreateFaction(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateFactionPayload) =>
      apiFetch<ApiResponse<Faction>>(
        `/api/worlds/${worldId}/factions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: factionKeys(worldId).all }),
  })
}

export function useUpdateFaction(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateFactionPayload & { id: string }) =>
      apiFetch<ApiResponse<Faction>>(
        `/api/worlds/${worldId}/factions/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: factionKeys(worldId).all }),
  })
}

export function useDeleteFaction(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<Faction>>(
        `/api/worlds/${worldId}/factions/${id}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: factionKeys(worldId).all }),
  })
}
