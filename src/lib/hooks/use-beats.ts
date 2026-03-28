import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Beat,
  Character,
  CreateBeatPayload,
  UpdateBeatPayload,
  ReorderBeatsPayload,
  ApiResponse,
  ApiListResponse,
} from '@/types'

export type BeatWithCharacter = Beat & {
  character: Pick<Character, 'id' | 'name'> | null
}

export function useBeats(worldId: string) {
  return useQuery<BeatWithCharacter[]>({
    queryKey: ['beats', worldId],
    queryFn: async () => {
      const res = await fetch(`/api/worlds/${worldId}/beats`)
      if (!res.ok) throw new Error('Failed to fetch beats')
      const json: ApiListResponse<BeatWithCharacter> = await res.json()
      return json.data
    },
    enabled: !!worldId,
  })
}

export function useCharacters(worldId: string) {
  return useQuery<Character[]>({
    queryKey: ['characters', worldId],
    queryFn: async () => {
      const res = await fetch(`/api/worlds/${worldId}/characters`)
      if (!res.ok) throw new Error('Failed to fetch characters')
      const json: ApiListResponse<Character> = await res.json()
      return json.data
    },
    enabled: !!worldId,
  })
}

export function useCreateBeat(worldId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateBeatPayload) => {
      const res = await fetch(`/api/worlds/${worldId}/beats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to create beat')
      const json: ApiResponse<BeatWithCharacter> = await res.json()
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beats', worldId] })
    },
  })
}

export function useUpdateBeat(worldId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateBeatPayload & { id: string }) => {
      const res = await fetch(`/api/worlds/${worldId}/beats/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to update beat')
      const json: ApiResponse<BeatWithCharacter> = await res.json()
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beats', worldId] })
    },
  })
}

export function useDeleteBeat(worldId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/worlds/${worldId}/beats/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete beat')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beats', worldId] })
    },
  })
}

export function useReorderBeats(worldId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ReorderBeatsPayload) => {
      const res = await fetch(`/api/worlds/${worldId}/beats/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to reorder beats')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beats', worldId] })
    },
  })
}
