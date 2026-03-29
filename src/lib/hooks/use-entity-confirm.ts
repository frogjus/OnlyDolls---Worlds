import { useMutation, useQueryClient } from '@tanstack/react-query'
import { showSuccess, showError } from '@/lib/toast'

interface ConfirmEntity {
  name: string
  type: 'character' | 'location' | 'event' | 'item' | 'faction'
  description: string
  confidence: number
}

interface ConfirmResult {
  data: {
    created: Array<{ id: string; name: string; type: string }>
    errors: Array<{ name: string; type: string; error: string }>
    totalCreated: number
    totalErrors: number
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

export function useEntityConfirm(worldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entities: ConfirmEntity[]) =>
      apiFetch<ConfirmResult>(
        `/api/worlds/${worldId}/entities/confirm`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entities }),
        },
      ),
    onSuccess: (result) => {
      // Invalidate all entity lists that may have new records
      qc.invalidateQueries({ queryKey: ['characters', worldId] })
      qc.invalidateQueries({ queryKey: ['locations', worldId] })
      qc.invalidateQueries({ queryKey: ['events', worldId] })
      qc.invalidateQueries({ queryKey: ['objects', worldId] })
      qc.invalidateQueries({ queryKey: ['factions', worldId] })
      qc.invalidateQueries({ queryKey: ['sources', worldId] })

      const { totalCreated, totalErrors } = result.data
      if (totalErrors > 0) {
        showSuccess(`${totalCreated} entities created, ${totalErrors} failed`)
      } else {
        showSuccess(`${totalCreated} entities confirmed`)
      }
    },
    onError: (err: Error) => {
      showError('Failed to confirm entities: ' + err.message)
    },
  })
}
