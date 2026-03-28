import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { JSONContent } from '@tiptap/react'
import type {
  Manuscript,
  CreateManuscriptPayload,
  UpdateManuscriptPayload,
  ApiResponse,
  ApiListResponse,
} from '@/types'

export type ManuscriptWithContent = Manuscript & {
  content: JSONContent | null
}

export function useManuscripts(worldId: string) {
  return useQuery<Manuscript[]>({
    queryKey: ['manuscripts', worldId],
    queryFn: async () => {
      const res = await fetch(`/api/worlds/${worldId}/manuscripts`)
      if (!res.ok) throw new Error('Failed to fetch manuscripts')
      const json: ApiListResponse<Manuscript> = await res.json()
      return json.data
    },
    enabled: !!worldId,
  })
}

export function useManuscript(worldId: string, manuscriptId: string | null) {
  return useQuery<ManuscriptWithContent>({
    queryKey: ['manuscripts', worldId, manuscriptId],
    queryFn: async () => {
      const res = await fetch(`/api/worlds/${worldId}/manuscripts/${manuscriptId}`)
      if (!res.ok) throw new Error('Failed to fetch manuscript')
      const json: ApiResponse<ManuscriptWithContent> = await res.json()
      return json.data
    },
    enabled: !!worldId && !!manuscriptId,
  })
}

export function useCreateManuscript(worldId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateManuscriptPayload) => {
      const res = await fetch(`/api/worlds/${worldId}/manuscripts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to create manuscript')
      const json: ApiResponse<Manuscript> = await res.json()
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manuscripts', worldId] })
    },
  })
}

export function useUpdateManuscript(worldId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateManuscriptPayload & { id: string }) => {
      const res = await fetch(`/api/worlds/${worldId}/manuscripts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to update manuscript')
      const json: ApiResponse<Manuscript> = await res.json()
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manuscripts', worldId] })
    },
  })
}

export function useSaveContent(worldId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: JSONContent }) => {
      const res = await fetch(`/api/worlds/${worldId}/manuscripts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error('Failed to save content')
      const json: ApiResponse<ManuscriptWithContent> = await res.json()
      return json.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['manuscripts', worldId, id] })
    },
  })
}
