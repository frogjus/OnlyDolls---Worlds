'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export function StorySidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'relative border-l bg-card transition-all duration-200',
        collapsed ? 'w-0 overflow-hidden' : 'w-72'
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute -left-8 top-2 z-10 h-6 w-6"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>
      {!collapsed && (
        <ScrollArea className="h-full">
          <div className="p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Story Sidebar
            </h2>
            <Separator className="my-3" />
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-medium text-muted-foreground">Synopsis</h3>
                <p className="mt-1 text-sm text-muted-foreground italic">No synopsis yet...</p>
              </div>
              <Separator />
              <div>
                <h3 className="text-xs font-medium text-muted-foreground">Beat List</h3>
                <p className="mt-1 text-sm text-muted-foreground italic">No beats created yet...</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      )}
    </aside>
  )
}
