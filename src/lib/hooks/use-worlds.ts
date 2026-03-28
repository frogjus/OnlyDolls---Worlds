import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ApiListResponse,
  ApiResponse,
  CreateWorldPayload,
  StoryWorld,
} from '@/types'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed (${res.status})`)
  }
  return res.json()
}

export function useWorlds() {
  return useQuery({
    queryKey: ['worlds'],
    queryFn: () =>
      fetchJson<ApiListResponse<StoryWorld>>('/api/worlds'),
  })
}

export function useCreateWorld() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateWorldPayload) =>
      fetchJson<ApiResponse<StoryWorld>>('/api/worlds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worlds'] }),
  })
}

export function useDeleteWorld() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<ApiResponse<StoryWorld>>(`/api/worlds/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worlds'] }),
  })
}
