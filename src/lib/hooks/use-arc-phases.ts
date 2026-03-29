import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ApiListResponse,
  ApiResponse,
  ArcPhase,
  CreateArcPhasePayload,
  UpdateArcPhasePayload,
} from '@/types'

function arcPhaseKeys(worldId: string, arcId: string) {
  return {
    all: ['arcPhases', worldId, arcId] as const,
    detail: (id: string) => ['arcPhases', worldId, arcId, id] as const,
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

export function useArcPhases(worldId: string, arcId: string) {
  return useQuery({
    queryKey: arcPhaseKeys(worldId, arcId).all,
    queryFn: () =>
      apiFetch<ApiListResponse<ArcPhase>>(
        `/api/worlds/${worldId}/arcs/${arcId}/phases`,
      ),
    enabled: !!worldId && !!arcId,
  })
}

export function useCreateArcPhase(worldId: string, arcId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateArcPhasePayload) =>
      apiFetch<ApiResponse<ArcPhase>>(
        `/api/worlds/${worldId}/arcs/${arcId}/phases`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: arcPhaseKeys(worldId, arcId).all }),
  })
}

export function useUpdateArcPhase(worldId: string, arcId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateArcPhasePayload & { id: string }) =>
      apiFetch<ApiResponse<ArcPhase>>(
        `/api/worlds/${worldId}/arcs/${arcId}/phases/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: arcPhaseKeys(worldId, arcId).all }),
  })
}

export function useDeleteArcPhase(worldId: string, arcId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<ArcPhase>>(
        `/api/worlds/${worldId}/arcs/${arcId}/phases/${id}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: arcPhaseKeys(worldId, arcId).all }),
  })
}
