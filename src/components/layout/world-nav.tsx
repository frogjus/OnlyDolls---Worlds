'use client'

import { usePathname, useParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { getViewBySlug, getGroupByViewSlug } from '@/lib/navigation-config'

export function WorldNav() {
  const pathname = usePathname()
  const params = useParams()
  const worldId = params.id as string

  const prefix = `/world/${worldId}/`
  const slug = pathname.startsWith(prefix)
    ? pathname.slice(prefix.length)
    : ''

  const view = getViewBySlug(slug)
  const group = getGroupByViewSlug(slug)

  return (
    <div className="flex h-10 items-center border-b px-4">
      {group && view ? (
        <div className="flex items-center gap-1 text-sm">
          <span className="text-muted-foreground">{group.label}</span>
          <ChevronRight className="size-3 text-muted-foreground" />
          <span className="font-medium">{view.label}</span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">Select a view</span>
      )}
    </div>
  )
}
