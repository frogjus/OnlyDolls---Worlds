import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ApiListResponse,
  ApiResponse,
  Relationship,
  CreateRelationshipPayload,
  UpdateRelationshipPayload,
} from '@/types'

function relationshipKeys(worldId: string) {
  return {
    all: ['relationships', worldId] as const,
    detail: (id: string) => ['relationships', worldId, id] as const,
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

export function useRelationships(worldId: string) {
  return useQuery({
    queryKey: relationshipKeys(worldId).all,
    queryFn: () =>
      apiFetch<ApiListResponse<Relationship>>(
        `/api/worlds/${worldId}/relationships`,
      ),
    enabled: !!worldId,
  })
}

export function useCreateRelationship(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRelationshipPayload) =>
      apiFetch<ApiResponse<Relationship>>(
        `/api/worlds/${worldId}/relationships`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: relationshipKeys(worldId).all }),
  })
}

export function useUpdateRelationship(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateRelationshipPayload & { id: string }) =>
      apiFetch<ApiResponse<Relationship>>(
        `/api/worlds/${worldId}/relationships/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: relationshipKeys(worldId).all }),
  })
}

export function useDeleteRelationship(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<Relationship>>(
        `/api/worlds/${worldId}/relationships/${id}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: relationshipKeys(worldId).all }),
  })
}
