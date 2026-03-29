'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { useEffect } from 'react'
import { ChevronDown, PanelLeftClose, PanelLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { workspaceGroups } from '@/lib/navigation-config'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'

export function WorkspaceSidebar() {
  const pathname = usePathname()
  const params = useParams()
  const worldId = params.id as string

  const {
    sidebarCollapsed,
    collapsedSections,
    toggleSidebar,
    toggleSection,
  } = useWorkspaceStore()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  function isActive(slug: string) {
    const href = `/world/${worldId}/${slug}`
    return pathname === href || pathname.startsWith(href + '/')
  }

  if (sidebarCollapsed) {
    return (
      <TooltipProvider>
        <div className="flex h-full w-12 flex-col border-r border-sidebar-border bg-sidebar">
          <div className="flex flex-1 flex-col gap-1 py-2">
            {workspaceGroups.map((group) => {
              const GroupIcon = group.icon
              const hasActive = group.views.some((v) => isActive(v.slug))
              return (
                <Tooltip key={group.id}>
                  <TooltipTrigger
                    className={cn(
                      'mx-auto flex size-8 items-center justify-center rounded-md transition-all duration-200',
                      hasActive
                        ? 'bg-primary/15 text-primary shadow-[0_0_10px_-2px] shadow-primary/20'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-[0_0_10px_-2px] hover:shadow-primary/15'
                    )}
                    render={
                      <Link href={`/world/${worldId}/${group.views[0].slug}`} />
                    }
                  >
                    <GroupIcon className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent side="right">{group.label}</TooltipContent>
                </Tooltip>
              )
            })}
          </div>
          <div className="border-t border-sidebar-border p-1">
            <Tooltip>
              <TooltipTrigger
                className="mx-auto flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                render={<button onClick={toggleSidebar} />}
              >
                <PanelLeft className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    )
  }

  return (
    <div className="flex h-full w-[260px] flex-col border-r border-sidebar-border bg-sidebar">
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-0.5 p-2">
          {workspaceGroups.map((group) => {
            const GroupIcon = group.icon
            const isCollapsed = collapsedSections[group.id] ?? false
            const hasActive = group.views.some((v) => isActive(v.slug))
            return (
              <div key={group.id}>
                <button
                  onClick={() => toggleSection(group.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 hover:bg-muted hover:text-foreground',
                    hasActive
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  <GroupIcon className={cn(
                    'size-4 transition-colors duration-200',
                    !isCollapsed && 'text-primary'
                  )} />
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown
                    className={cn(
                      'size-3.5 transition-transform duration-200',
                      isCollapsed && '-rotate-90'
                    )}
                  />
                </button>
                {!isCollapsed && (
                  <div className="ml-2 flex flex-col gap-0.5 py-0.5">
                    {group.views.map((view) => {
                      const ViewIcon = view.icon
                      const active = isActive(view.slug)
                      return (
                        <Link
                          key={view.slug}
                          href={`/world/${worldId}/${view.slug}`}
                          className={cn(
                            'relative flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-all duration-200',
                            active
                              ? 'bg-primary/10 text-primary before:absolute before:left-0 before:top-1/2 before:h-4 before:-translate-y-1/2 before:w-[2px] before:rounded-r-full before:bg-primary'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          <ViewIcon className="size-3.5" />
                          {view.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
      <div className="border-t border-sidebar-border p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-start gap-2 text-muted-foreground transition-colors duration-200"
        >
          <PanelLeftClose className="size-4" />
          <span className="text-xs">Collapse</span>
        </Button>
      </div>
    </div>
  )
}
