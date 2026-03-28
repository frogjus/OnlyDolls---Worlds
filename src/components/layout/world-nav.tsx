'use client'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

const views = [
  { slug: 'beats', label: 'Beats' },
  { slug: 'write', label: 'Write' },
  { slug: 'treatment', label: 'Treatment' },
  { slug: 'timeline', label: 'Timeline' },
  { slug: 'characters', label: 'Characters' },
  { slug: 'locations', label: 'Locations' },
  { slug: 'events', label: 'Events' },
  { slug: 'scenes', label: 'Scenes' },
  { slug: 'arcs', label: 'Arcs' },
  { slug: 'structure', label: 'Structure' },
  { slug: 'relationships', label: 'Relationships' },
  { slug: 'themes', label: 'Themes' },
  { slug: 'objects', label: 'Objects' },
  { slug: 'mindmap', label: 'Mind Map' },
  { slug: 'factions', label: 'Factions' },
  { slug: 'sources', label: 'Sources' },
  { slug: 'canon', label: 'Canon' },
  { slug: 'consistency', label: 'Consistency' },
  { slug: 'whatif', label: 'What-If' },
  { slug: 'causality', label: 'Causality' },
  { slug: 'foreshadowing', label: 'Foreshadowing' },
  { slug: 'pacing', label: 'Pacing' },
  { slug: 'knowledge', label: 'Knowledge' },
  { slug: 'wiki', label: 'Wiki' },
  { slug: 'systems', label: 'Systems' },
  { slug: 'settings', label: 'Settings' },
]

export function WorldNav() {
  const pathname = usePathname()
  const params = useParams()
  const worldId = params.id as string

  return (
    <ScrollArea className="w-full border-b">
      <div className="flex h-10 items-center gap-1 px-4">
        {views.map((view) => {
          const href = `/world/${worldId}/${view.slug}`
          const active = pathname === href
          return (
            <Link
              key={view.slug}
              href={href}
              className={cn(
                'inline-flex items-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {view.label}
            </Link>
          )
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
