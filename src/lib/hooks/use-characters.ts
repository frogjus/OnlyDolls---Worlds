import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ApiListResponse,
  ApiResponse,
  Character,
  CreateCharacterPayload,
  UpdateCharacterPayload,
} from '@/types'

function characterKeys(worldId: string) {
  return {
    all: ['characters', worldId] as const,
    detail: (id: string) => ['characters', worldId, id] as const,
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

export function useCharacters(worldId: string) {
  return useQuery({
    queryKey: characterKeys(worldId).all,
    queryFn: () =>
      apiFetch<ApiListResponse<Character>>(
        `/api/worlds/${worldId}/characters`,
      ),
    enabled: !!worldId,
  })
}

export function useCreateCharacter(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCharacterPayload) =>
      apiFetch<ApiResponse<Character>>(
        `/api/worlds/${worldId}/characters`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: characterKeys(worldId).all }),
  })
}

export function useUpdateCharacter(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCharacterPayload & { id: string }) =>
      apiFetch<ApiResponse<Character>>(
        `/api/worlds/${worldId}/characters/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: characterKeys(worldId).all }),
  })
}

export function useDeleteCharacter(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<Character>>(
        `/api/worlds/${worldId}/characters/${id}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: characterKeys(worldId).all }),
  })
}
