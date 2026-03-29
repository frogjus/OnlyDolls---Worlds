'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Globe, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const navItems = [
  { href: '/worlds', label: 'Worlds', icon: Globe },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <TooltipProvider>
      <aside className="flex w-14 flex-col items-center border-r border-sidebar-border bg-sidebar py-3">
        {/* Logo */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/worlds"
                className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg text-primary transition-colors duration-200 hover:bg-primary/10 hover:shadow-[0_0_12px_-2px] hover:shadow-primary/30"
              />
            }
          >
            <BookOpen className="h-5 w-5" />
          </TooltipTrigger>
          <TooltipContent side="right">OD:W</TooltipContent>
        </Tooltip>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname.startsWith(item.href)
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={item.href}
                      className={cn(
                        'relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
                        active
                          ? 'bg-primary/10 text-primary before:absolute before:left-0 before:top-1/2 before:h-5 before:-translate-x-[5px] before:-translate-y-1/2 before:w-[3px] before:rounded-r-full before:bg-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-[0_0_12px_-2px] hover:shadow-primary/20'
                      )}
                    />
                  }
                >
                  <Icon className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        {/* Sign out */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground transition-colors duration-200 hover:text-foreground"
              />
            }
          >
            <LogOut className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent side="right">Sign out</TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  )
}
