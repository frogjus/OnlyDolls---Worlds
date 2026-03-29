import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { JSONContent } from '@tiptap/react'
import type {
  Manuscript,
  ManuscriptSection,
  CreateManuscriptPayload,
  UpdateManuscriptPayload,
  ApiResponse,
  ApiListResponse,
} from '@/types'
import { showSuccess, showError } from '@/lib/toast'

/** Manuscript with its sections included (sections carry the actual content). */
export type ManuscriptWithSections = Manuscript & {
  sections: Pick<ManuscriptSection, 'id' | 'title' | 'type' | 'position' | 'content' | 'wordCount' | 'status'>[]
}

/** Convenience type used by the write page. */
export interface ManuscriptWithContent {
  manuscript: ManuscriptWithSections
  /** Content parsed from the primary (first) section, or null. */
  content: JSONContent | null
  /** The section ID that holds the content (for saving). */
  activeSectionId: string | null
}

function parseSectionContent(raw: string | null | undefined): JSONContent | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as JSONContent
  } catch {
    // Plain text fallback — wrap in a TipTap doc structure
    return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: raw }] }] }
  }
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
      const json: ApiResponse<ManuscriptWithSections> = await res.json()
      const manuscript = json.data
      const primarySection = manuscript.sections?.[0] ?? null
      return {
        manuscript,
        content: parseSectionContent(primarySection?.content),
        activeSectionId: primarySection?.id ?? null,
      }
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
      const json: ApiResponse<ManuscriptWithSections> = await res.json()
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manuscripts', worldId] })
      showSuccess('Manuscript created')
    },
    onError: () => {
      showError('Failed to create manuscript')
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
      showSuccess('Manuscript updated')
    },
    onError: () => {
      showError('Failed to update manuscript')
    },
  })
}

export function useDeleteManuscript(worldId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (manuscriptId: string) => {
      const res = await fetch(`/api/worlds/${worldId}/manuscripts/${manuscriptId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete manuscript')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manuscripts', worldId] })
      showSuccess('Manuscript deleted')
    },
    onError: () => {
      showError('Failed to delete manuscript')
    },
  })
}

/**
 * Save editor content to a ManuscriptSection (NOT the Manuscript itself).
 * Accepts an AbortSignal so callers can cancel in-flight saves when
 * the user switches manuscripts.
 */
export function useSaveContent(worldId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      manuscriptId,
      sectionId,
      content,
      signal,
    }: {
      manuscriptId: string
      sectionId: string
      content: JSONContent
      signal?: AbortSignal
    }) => {
      const serialized = JSON.stringify(content)
      const wordCount = extractWordCount(content)
      const res = await fetch(
        `/api/worlds/${worldId}/manuscripts/${manuscriptId}/sections/${sectionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: serialized, wordCount }),
          signal,
        },
      )
      if (!res.ok) throw new Error('Failed to save content')
      return res.json()
    },
    onSuccess: (_, { manuscriptId }) => {
      queryClient.invalidateQueries({ queryKey: ['manuscripts', worldId, manuscriptId] })
    },
  })
}

function extractWordCount(content: JSONContent): number {
  let text = ''
  function walk(node: JSONContent) {
    if (node.text) text += node.text
    if (node.content) node.content.forEach(walk)
  }
  walk(content)
  return text.trim() ? text.trim().split(/\s+/).length : 0
}
