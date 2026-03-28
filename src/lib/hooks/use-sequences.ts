import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ApiListResponse,
  ApiResponse,
  Sequence,
  CreateSequencePayload,
  UpdateSequencePayload,
} from '@/types'

function sequenceKeys(worldId: string) {
  return {
    all: ['sequences', worldId] as const,
    detail: (id: string) => ['sequences', worldId, id] as const,
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

export function useSequences(worldId: string) {
  return useQuery({
    queryKey: sequenceKeys(worldId).all,
    queryFn: () =>
      apiFetch<ApiListResponse<Sequence>>(
        `/api/worlds/${worldId}/sequences`,
      ),
    enabled: !!worldId,
  })
}

export function useCreateSequence(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSequencePayload) =>
      apiFetch<ApiResponse<Sequence>>(
        `/api/worlds/${worldId}/sequences`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: sequenceKeys(worldId).all }),
  })
}

export function useUpdateSequence(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateSequencePayload & { id: string }) =>
      apiFetch<ApiResponse<Sequence>>(
        `/api/worlds/${worldId}/sequences/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: sequenceKeys(worldId).all }),
  })
}

export function useDeleteSequence(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<Sequence>>(
        `/api/worlds/${worldId}/sequences/${id}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: sequenceKeys(worldId).all }),
  })
}
