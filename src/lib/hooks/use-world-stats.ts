import { useQuery } from '@tanstack/react-query'

interface WorldStats {
  wordCount: number
  beatsDone: number
  beatsTotal: number
  characterCount: number
}

export function useWorldStats(worldId: string) {
  return useQuery<WorldStats>({
    queryKey: ['world-stats', worldId],
    queryFn: async () => {
      const res = await fetch(`/api/worlds/${worldId}/stats`)
      if (!res.ok) throw new Error('Failed to fetch world stats')
      const json = await res.json()
      return json.data
    },
    enabled: !!worldId,
    refetchInterval: 30_000,
  })
}
