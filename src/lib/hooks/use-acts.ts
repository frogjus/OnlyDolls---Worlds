import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ApiListResponse,
  ApiResponse,
  Act,
  CreateActPayload,
  UpdateActPayload,
} from '@/types'

function actKeys(worldId: string) {
  return {
    all: ['acts', worldId] as const,
    detail: (id: string) => ['acts', worldId, id] as const,
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

export function useActs(worldId: string) {
  return useQuery({
    queryKey: actKeys(worldId).all,
    queryFn: () =>
      apiFetch<ApiListResponse<Act>>(
        `/api/worlds/${worldId}/acts`,
      ),
    enabled: !!worldId,
  })
}

export function useCreateAct(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateActPayload) =>
      apiFetch<ApiResponse<Act>>(
        `/api/worlds/${worldId}/acts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: actKeys(worldId).all }),
  })
}

export function useUpdateAct(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateActPayload & { id: string }) =>
      apiFetch<ApiResponse<Act>>(
        `/api/worlds/${worldId}/acts/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: actKeys(worldId).all }),
  })
}

export function useDeleteAct(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<Act>>(
        `/api/worlds/${worldId}/acts/${id}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: actKeys(worldId).all }),
  })
}
