'use client'

import { usePathname, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { getViewBySlug, getGroupByViewSlug } from '@/lib/navigation-config'

function resolveSlug(slug: string) {
  // Try exact match first, then progressively shorter paths
  // e.g. "sources/abc123" -> try "sources/abc123", then "sources"
  let current = slug
  while (current) {
    const view = getViewBySlug(current)
    if (view) return { view, group: getGroupByViewSlug(current) }
    const lastSlash = current.lastIndexOf('/')
    if (lastSlash === -1) break
    current = current.slice(0, lastSlash)
  }
  return { view: undefined, group: undefined }
}

export function WorldNav() {
  const pathname = usePathname()
  const params = useParams()
  const worldId = params.id as string

  const { data: worldName } = useQuery({
    queryKey: ['world-name', worldId],
    queryFn: async () => {
      const res = await fetch(`/api/worlds/${worldId}`)
      if (!res.ok) return null
      const json = await res.json()
      return (json.data?.name as string) ?? null
    },
    enabled: !!worldId,
    staleTime: 60_000,
  })

  const prefix = `/world/${worldId}/`
  const slug = pathname.startsWith(prefix)
    ? pathname.slice(prefix.length)
    : ''

  const { view, group } = resolveSlug(slug)

  return (
    <div className="flex h-10 items-center border-b px-4">
      <div className="flex items-center gap-1 text-sm">
        <span className="text-muted-foreground truncate max-w-[160px]">
          {worldName ?? 'World'}
        </span>
        {group && view && (
          <>
            <ChevronRight className="size-3 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">{group.label}</span>
            <ChevronRight className="size-3 text-muted-foreground shrink-0" />
            <span className="font-medium">{view.label}</span>
          </>
        )}
      </div>
    </div>
  )
}
