'use client'

import { useState, useCallback } from 'react'
import type { SearchResult } from './types'

interface UseWorldMemorySearchResult {
  results: SearchResult[]
  isSearching: boolean
  error: string | null
  search: (query: string) => Promise<SearchResult[]>
}

export function useWorldMemorySearch(worldId: string): UseWorldMemorySearchResult {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(
    async (query: string): Promise<SearchResult[]> => {
      setIsSearching(true)
      setError(null)
      try {
        const res = await fetch(`/api/worlds/${worldId}/memory/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(body.error ?? `Search failed (${res.status})`)
        }
        const data = (await res.json()) as { data: SearchResult[] }
        setResults(data.data)
        return data.data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Search failed'
        setError(message)
        return []
      } finally {
        setIsSearching(false)
      }
    },
    [worldId]
  )

  return { results, isSearching, error, search }
}

interface UseWorldMemorySyncResult {
  isSyncing: boolean
  error: string | null
  sync: () => Promise<void>
}

export function useWorldMemorySync(worldId: string): UseWorldMemorySyncResult {
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sync = useCallback(async () => {
    setIsSyncing(true)
    setError(null)
    try {
      const res = await fetch(`/api/worlds/${worldId}/memory/sync`, {
        method: 'POST',
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Sync failed (${res.status})`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed'
      setError(message)
    } finally {
      setIsSyncing(false)
    }
  }, [worldId])

  return { isSyncing, error, sync }
}
