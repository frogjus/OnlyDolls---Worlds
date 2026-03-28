import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ApiListResponse,
  ApiResponse,
  Theme,
  CreateThemePayload,
  UpdateThemePayload,
} from '@/types'

function themeKeys(worldId: string) {
  return {
    all: ['themes', worldId] as const,
    detail: (id: string) => ['themes', worldId, id] as const,
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

export function useThemes(worldId: string) {
  return useQuery({
    queryKey: themeKeys(worldId).all,
    queryFn: () =>
      apiFetch<ApiListResponse<Theme>>(
        `/api/worlds/${worldId}/themes`,
      ),
    enabled: !!worldId,
  })
}

export function useCreateTheme(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateThemePayload) =>
      apiFetch<ApiResponse<Theme>>(
        `/api/worlds/${worldId}/themes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: themeKeys(worldId).all }),
  })
}

export function useUpdateTheme(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateThemePayload & { id: string }) =>
      apiFetch<ApiResponse<Theme>>(
        `/api/worlds/${worldId}/themes/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: themeKeys(worldId).all }),
  })
}

export function useDeleteTheme(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<Theme>>(
        `/api/worlds/${worldId}/themes/${id}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: themeKeys(worldId).all }),
  })
}
