import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ApiListResponse,
  ApiResponse,
  StoryObject,
  CreateObjectPayload,
  UpdateObjectPayload,
} from '@/types'

function objectKeys(worldId: string) {
  return {
    all: ['objects', worldId] as const,
    detail: (id: string) => ['objects', worldId, id] as const,
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

export function useObjects(worldId: string) {
  return useQuery({
    queryKey: objectKeys(worldId).all,
    queryFn: () =>
      apiFetch<ApiListResponse<StoryObject>>(
        `/api/worlds/${worldId}/objects`,
      ),
    enabled: !!worldId,
  })
}

export function useCreateObject(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateObjectPayload) =>
      apiFetch<ApiResponse<StoryObject>>(
        `/api/worlds/${worldId}/objects`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: objectKeys(worldId).all }),
  })
}

export function useUpdateObject(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateObjectPayload & { id: string }) =>
      apiFetch<ApiResponse<StoryObject>>(
        `/api/worlds/${worldId}/objects/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: objectKeys(worldId).all }),
  })
}

export function useDeleteObject(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<StoryObject>>(
        `/api/worlds/${worldId}/objects/${id}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: objectKeys(worldId).all }),
  })
}
