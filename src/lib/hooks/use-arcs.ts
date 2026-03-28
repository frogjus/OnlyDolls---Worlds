import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ApiListResponse,
  ApiResponse,
  Arc,
  CreateArcPayload,
  UpdateArcPayload,
} from '@/types'

function arcKeys(worldId: string) {
  return {
    all: ['arcs', worldId] as const,
    detail: (id: string) => ['arcs', worldId, id] as const,
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

export function useArcs(worldId: string) {
  return useQuery({
    queryKey: arcKeys(worldId).all,
    queryFn: () =>
      apiFetch<ApiListResponse<Arc>>(
        `/api/worlds/${worldId}/arcs`,
      ),
    enabled: !!worldId,
  })
}

export function useCreateArc(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateArcPayload) =>
      apiFetch<ApiResponse<Arc>>(
        `/api/worlds/${worldId}/arcs`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: arcKeys(worldId).all }),
  })
}

export function useUpdateArc(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateArcPayload & { id: string }) =>
      apiFetch<ApiResponse<Arc>>(
        `/api/worlds/${worldId}/arcs/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: arcKeys(worldId).all }),
  })
}

export function useDeleteArc(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<Arc>>(
        `/api/worlds/${worldId}/arcs/${id}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: arcKeys(worldId).all }),
  })
}
