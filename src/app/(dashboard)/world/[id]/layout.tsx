'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { slug: 'sources', label: 'Sources' },
  { slug: 'characters', label: 'Characters' },
  { slug: 'locations', label: 'Locations' },
  { slug: 'relationships', label: 'Relationships' },
  { slug: 'themes', label: 'Themes' },
]

export default function WorldLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { id } = useParams<{ id: string }>()

  return (
    <div className="flex h-screen flex-col">
      <nav className="flex items-center gap-2 border-b px-4 py-2 text-sm">
        <Link href="/worlds" className="text-muted-foreground hover:text-foreground">
          &larr;
        </Link>
        <span className="text-muted-foreground">|</span>
        {NAV_ITEMS.map((item) => {
          const href = `/world/${id}/${item.slug}`
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={item.slug}
              href={href}
              className={cn(
                'rounded px-2 py-1 transition-colors',
                isActive
                  ? 'bg-accent font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
