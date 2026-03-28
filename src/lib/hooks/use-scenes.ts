import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ApiListResponse,
  ApiResponse,
  Scene,
  CreateScenePayload,
  UpdateScenePayload,
} from '@/types'

function sceneKeys(worldId: string) {
  return {
    all: ['scenes', worldId] as const,
    detail: (id: string) => ['scenes', worldId, id] as const,
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

export function useScenes(worldId: string) {
  return useQuery({
    queryKey: sceneKeys(worldId).all,
    queryFn: () =>
      apiFetch<ApiListResponse<Scene>>(
        `/api/worlds/${worldId}/scenes`,
      ),
    enabled: !!worldId,
  })
}

export function useCreateScene(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateScenePayload) =>
      apiFetch<ApiResponse<Scene>>(
        `/api/worlds/${worldId}/scenes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: sceneKeys(worldId).all }),
  })
}

export function useUpdateScene(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateScenePayload & { id: string }) =>
      apiFetch<ApiResponse<Scene>>(
        `/api/worlds/${worldId}/scenes/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: sceneKeys(worldId).all }),
  })
}

export function useDeleteScene(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<Scene>>(
        `/api/worlds/${worldId}/scenes/${id}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: sceneKeys(worldId).all }),
  })
}
