import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Faction {
  id: string
  name: string
  description: string | null
  type: string | null
  goals: string[]
  resources: string[]
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  storyWorldId: string
}

export interface CreateFactionPayload {
  name: string
  description?: string
  factionType?: string
  goals?: string[]
}

export interface UpdateFactionPayload {
  name?: string
  description?: string
  factionType?: string
  goals?: string[]
}

const factionKeys = {
  all: (worldId: string) => ['factions', worldId] as const,
  detail: (worldId: string, id: string) => ['factions', worldId, id] as const,
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error || res.statusText)
  }
  return res.json()
}

export function useFactions(worldId: string) {
  return useQuery({
    queryKey: factionKeys.all(worldId),
    queryFn: () => apiFetch<Faction[]>(`/api/worlds/${worldId}/factions`),
    enabled: !!worldId,
  })
}

export function useCreateFaction(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateFactionPayload) =>
      apiFetch<Faction>(`/api/worlds/${worldId}/factions`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: factionKeys.all(worldId) })
    },
  })
}

export function useUpdateFaction(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateFactionPayload & { id: string }) =>
      apiFetch<Faction>(`/api/worlds/${worldId}/factions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: factionKeys.all(worldId) })
    },
  })
}

export function useDeleteFaction(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/worlds/${worldId}/factions/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: factionKeys.all(worldId) })
    },
  })
}
