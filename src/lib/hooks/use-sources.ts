import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ApiListResponse,
  ApiResponse,
  SourceMaterial,
  CreateSourceMaterialPayload,
  UpdateSourceMaterialPayload,
} from '@/types'
import { showSuccess, showError } from '@/lib/toast'

function sourceKeys(worldId: string) {
  return {
    all: ['sources', worldId] as const,
    detail: (id: string) => ['sources', worldId, id] as const,
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

export function useSources(worldId: string) {
  return useQuery({
    queryKey: sourceKeys(worldId).all,
    queryFn: () =>
      apiFetch<ApiListResponse<SourceMaterial>>(
        `/api/worlds/${worldId}/sources`,
      ),
    enabled: !!worldId,
  })
}

export function useCreateSource(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSourceMaterialPayload) =>
      apiFetch<ApiResponse<SourceMaterial>>(
        `/api/worlds/${worldId}/sources`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sourceKeys(worldId).all })
      showSuccess('Source created')
    },
    onError: (err: Error) => {
      showError('Failed to create source: ' + err.message)
    },
  })
}

export function useUpdateSource(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateSourceMaterialPayload & { id: string }) =>
      apiFetch<ApiResponse<SourceMaterial>>(
        `/api/worlds/${worldId}/sources/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sourceKeys(worldId).all })
      showSuccess('Source updated')
    },
    onError: (err: Error) => {
      showError('Failed to update source: ' + err.message)
    },
  })
}

export function useDeleteSource(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<SourceMaterial>>(
        `/api/worlds/${worldId}/sources/${id}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sourceKeys(worldId).all })
      showSuccess('Source deleted')
    },
    onError: (err: Error) => {
      showError('Failed to delete source: ' + err.message)
    },
  })
}
