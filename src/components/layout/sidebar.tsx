'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Globe, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/worlds', label: 'Worlds', icon: Globe },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="flex w-60 flex-col border-r bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <BookOpen className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">StoryForge</span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
