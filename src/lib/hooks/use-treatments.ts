'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface TreatmentSection {
  type: 'beat' | 'act-header'
  heading: string
  content: string
  beatId?: string
  isOverridden?: boolean
}

interface ApiBeat {
  id: string
  name: string
  description: string | null
  position: number
  actId: string | null
  actName: string | null
  treatmentOverride: string | null
}

interface ApiListResponse<T> {
  data: T[]
}

export function useTreatmentBeats(worldId: string) {
  return useQuery<ApiBeat[]>({
    queryKey: ['treatment-beats', worldId],
    queryFn: async () => {
      const res = await fetch(`/api/worlds/${worldId}/beats`)
      if (!res.ok) throw new Error('Failed to fetch beats')
      const json: ApiListResponse<ApiBeat> = await res.json()
      return json.data.sort((a, b) => a.position - b.position)
    },
    enabled: !!worldId,
  })
}

export function useSaveTreatmentOverride(worldId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      beatId,
      treatmentOverride,
    }: {
      beatId: string
      treatmentOverride: string | null
    }) => {
      const res = await fetch(`/api/worlds/${worldId}/beats/${beatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ treatmentOverride }),
      })
      if (!res.ok) throw new Error('Failed to save treatment override')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-beats', worldId] })
    },
  })
}

export function generateTreatment(beats: ApiBeat[]): TreatmentSection[] {
  const sections: TreatmentSection[] = []
  let currentActId: string | null = null

  const sorted = [...beats].sort((a, b) => a.position - b.position)

  for (const beat of sorted) {
    if (beat.actId && beat.actId !== currentActId) {
      currentActId = beat.actId
      sections.push({
        type: 'act-header',
        heading: beat.actName ?? 'Act',
        content: '',
      })
    }

    sections.push({
      type: 'beat',
      heading: beat.name,
      content: beat.treatmentOverride ?? beat.description ?? '',
      beatId: beat.id,
      isOverridden: !!beat.treatmentOverride,
    })
  }

  return sections
}

export function treatmentToMarkdown(sections: TreatmentSection[]): string {
  return sections
    .map((s) => {
      if (s.type === 'act-header') {
        return `\n## ${s.heading}\n`
      }
      return `### ${s.heading}\n\n${s.content}\n`
    })
    .join('\n')
}

export function treatmentToPlainText(sections: TreatmentSection[]): string {
  return sections
    .map((s) => {
      if (s.type === 'act-header') {
        return `\n--- ${s.heading.toUpperCase()} ---\n`
      }
      return `${s.heading}\n${s.content}\n`
    })
    .join('\n')
}
