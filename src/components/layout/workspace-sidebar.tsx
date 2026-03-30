'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { sidebarSlide, sidebarContent, sectionCollapse } from '@/lib/animations'

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

  return (
    <motion.div
      className="flex h-full flex-col border-r border-sidebar-border bg-sidebar overflow-hidden"
      variants={sidebarSlide}
      animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
      initial={false}
    >
      <AnimatePresence mode="wait" initial={false}>
        {sidebarCollapsed ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex h-full flex-col"
          >
            <TooltipProvider>
              <div className="flex flex-1 flex-col gap-1 py-2">
                {workspaceGroups.map((group, idx) => {
                  const GroupIcon = group.icon
                  const hasActive = group.views.some((v) => isActive(v.slug))
                  return (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.2 }}
                    >
                      <Tooltip>
                        <TooltipTrigger
                          className={cn(
                            'mx-auto flex size-8 items-center justify-center rounded-md transition-colors',
                            hasActive
                              ? 'bg-sidebar-accent text-primary shadow-[0_0_10px_rgba(20,184,166,0.1)]'
                              : 'text-muted-foreground hover:bg-[rgba(255,255,255,0.03)] hover:text-foreground'
                          )}
                          render={
                            <Link href={`/world/${worldId}/${group.views[0].slug}`} />
                          }
                        >
                          <GroupIcon className="size-4" />
                        </TooltipTrigger>
                        <TooltipContent side="right">{group.label}</TooltipContent>
                      </Tooltip>
                    </motion.div>
                  )
                })}
              </div>
              <div className="border-t p-1">
                <Tooltip>
                  <TooltipTrigger
                    className="mx-auto flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-[rgba(255,255,255,0.03)] hover:text-foreground transition-colors"
                    render={<button onClick={toggleSidebar} />}
                  >
                    <PanelLeft className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent side="right">Expand sidebar</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            variants={sidebarContent}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="flex h-full flex-col"
          >
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-0.5 p-2">
                {workspaceGroups.map((group) => {
                  const GroupIcon = group.icon
                  const isCollapsed = collapsedSections[group.id] ?? false
                  return (
                    <div key={group.id}>
                      <button
                        onClick={() => toggleSection(group.id)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:bg-[rgba(255,255,255,0.03)] hover:text-foreground"
                      >
                        <GroupIcon className="size-4" />
                        <span className="flex-1 text-left">{group.label}</span>
                        <motion.span
                          animate={{ rotate: isCollapsed ? -90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="size-3.5" />
                        </motion.span>
                      </button>
                      <AnimatePresence initial={false}>
                        {!isCollapsed && (
                          <motion.div
                            variants={sectionCollapse}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            className="overflow-hidden"
                          >
                            <div className="ml-2 flex flex-col gap-0.5 py-0.5">
                              {group.views.map((view) => {
                                const ViewIcon = view.icon
                                const active = isActive(view.slug)
                                return (
                                  <Link
                                    key={view.slug}
                                    href={`/world/${worldId}/${view.slug}`}
                                    className={cn(
                                      'flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-all duration-150',
                                      active
                                        ? 'bg-sidebar-accent text-primary font-medium'
                                        : 'text-muted-foreground hover:bg-[rgba(255,255,255,0.03)] hover:text-foreground hover:translate-x-0.5'
                                    )}
                                  >
                                    <ViewIcon className="size-3.5" />
                                    {view.label}
                                  </Link>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
            <div className="border-t p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-transparent"
              >
                <PanelLeftClose className="size-4" />
                <span className="text-xs">Collapse</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
