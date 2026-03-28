import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Location {
  id: string
  name: string
  description: string | null
  type: string | null
  parentId: string | null
  coordinates: Record<string, unknown> | null
  properties: Record<string, unknown>
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  storyWorldId: string
}

export interface CreateLocationPayload {
  name: string
  description?: string
  locationType?: string
  parentId?: string
  coordinates?: Record<string, unknown>
}

export interface UpdateLocationPayload {
  name?: string
  description?: string
  locationType?: string
  parentId?: string | null
  coordinates?: Record<string, unknown> | null
}

interface ApiListResponse<T> {
  data: T[]
  total: number
}

interface ApiResponse<T> {
  data: T
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }
  return res.json()
}

function entityKeys(worldId: string) {
  return {
    all: ['locations', worldId] as const,
    detail: (id: string) => ['locations', worldId, id] as const,
  }
}

export function useLocations(worldId: string) {
  return useQuery({
    queryKey: entityKeys(worldId).all,
    queryFn: () =>
      apiFetch<ApiListResponse<Location>>(`/api/worlds/${worldId}/locations`),
    enabled: !!worldId,
  })
}

export function useCreateLocation(worldId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateLocationPayload) =>
      apiFetch<ApiResponse<Location>>(`/api/worlds/${worldId}/locations`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys(worldId).all })
    },
  })
}

export function useUpdateLocation(worldId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateLocationPayload & { id: string }) =>
      apiFetch<ApiResponse<Location>>(`/api/worlds/${worldId}/locations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys(worldId).all })
    },
  })
}

export function useDeleteLocation(worldId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/worlds/${worldId}/locations/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys(worldId).all })
    },
  })
}
