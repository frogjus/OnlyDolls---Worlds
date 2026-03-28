import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ApiListResponse,
  ApiResponse,
  Location,
  CreateLocationPayload,
  UpdateLocationPayload,
} from '@/types'

function locationKeys(worldId: string) {
  return {
    all: ['locations', worldId] as const,
    detail: (id: string) => ['locations', worldId, id] as const,
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

export function useLocations(worldId: string) {
  return useQuery({
    queryKey: locationKeys(worldId).all,
    queryFn: () =>
      apiFetch<ApiListResponse<Location>>(
        `/api/worlds/${worldId}/locations`,
      ),
    enabled: !!worldId,
  })
}

export function useCreateLocation(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateLocationPayload) =>
      apiFetch<ApiResponse<Location>>(
        `/api/worlds/${worldId}/locations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys(worldId).all }),
  })
}

export function useUpdateLocation(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateLocationPayload & { id: string }) =>
      apiFetch<ApiResponse<Location>>(
        `/api/worlds/${worldId}/locations/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys(worldId).all }),
  })
}

export function useDeleteLocation(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<Location>>(
        `/api/worlds/${worldId}/locations/${id}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys(worldId).all }),
  })
}
