import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Event {
  id: string
  name: string
  description: string | null
  fabulaPosition: number | null
  fabulaDate: string | null
  isKeyEvent: boolean
  locationId: string | null
  storyWorldId: string
  createdAt: string
  updatedAt: string
}

export interface CreateEventPayload {
  name: string
  description?: string
  fabulaPosition?: number
  fabulaDate?: string
  isKeyEvent?: boolean
  locationId?: string
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
  id: string
}

const eventKeys = {
  all: (worldId: string) => ['events', worldId] as const,
  detail: (worldId: string, id: string) => ['events', worldId, id] as const,
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API error: ${res.status}`)
  }
  return res.json()
}

export function useEvents(worldId: string | undefined) {
  return useQuery({
    queryKey: eventKeys.all(worldId!),
    queryFn: () => apiFetch<Event[]>(`/api/worlds/${worldId}/events`),
    enabled: !!worldId,
  })
}

export function useCreateEvent(worldId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateEventPayload) =>
      apiFetch<Event>(`/api/worlds/${worldId}/events`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      if (worldId) queryClient.invalidateQueries({ queryKey: eventKeys.all(worldId) })
    },
  })
}

export function useUpdateEvent(worldId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateEventPayload) =>
      apiFetch<Event>(`/api/worlds/${worldId}/events/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      if (worldId) queryClient.invalidateQueries({ queryKey: eventKeys.all(worldId) })
    },
  })
}

export function useDeleteEvent(worldId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/worlds/${worldId}/events/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      if (worldId) queryClient.invalidateQueries({ queryKey: eventKeys.all(worldId) })
    },
  })
}
