import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ApiListResponse,
  ApiResponse,
  Event,
  CreateEventPayload,
  UpdateEventPayload,
} from '@/types'

function eventKeys(worldId: string) {
  return {
    all: ['events', worldId] as const,
    detail: (id: string) => ['events', worldId, id] as const,
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

export function useEvents(worldId: string) {
  return useQuery({
    queryKey: eventKeys(worldId).all,
    queryFn: () =>
      apiFetch<ApiListResponse<Event>>(
        `/api/worlds/${worldId}/events`,
      ),
    enabled: !!worldId,
  })
}

export function useCreateEvent(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateEventPayload) =>
      apiFetch<ApiResponse<Event>>(
        `/api/worlds/${worldId}/events`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys(worldId).all }),
  })
}

export function useUpdateEvent(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateEventPayload & { id: string }) =>
      apiFetch<ApiResponse<Event>>(
        `/api/worlds/${worldId}/events/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys(worldId).all }),
  })
}

export function useDeleteEvent(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<Event>>(
        `/api/worlds/${worldId}/events/${id}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys(worldId).all }),
  })
}
