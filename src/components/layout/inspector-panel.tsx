'use client'

import { useEffect, useCallback, useRef } from 'react'
import { Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useLayoutStore } from '@/stores/layout-store'

export function InspectorPanel() {
  const { inspectorOpen, inspectorWidth, toggleInspector, setInspectorOpen, setInspectorWidth } =
    useLayoutStore()
  const isResizing = useRef(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault()
        toggleInspector()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleInspector])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isResizing.current = true

      const startX = e.clientX
      const startWidth = inspectorWidth

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizing.current) return
        const delta = startX - moveEvent.clientX
        setInspectorWidth(startWidth + delta)
      }

      const handleMouseUp = () => {
        isResizing.current = false
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [inspectorWidth, setInspectorWidth]
  )

  if (!inspectorOpen) return null

  return (
    <aside
      className="relative flex flex-col border-l bg-card transition-[width] duration-200"
      style={{ width: inspectorWidth, minWidth: 280, maxWidth: 500 }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute inset-y-0 left-0 w-1 cursor-col-resize hover:bg-primary/20 transition-colors"
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-semibold">Inspector</span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setInspectorOpen(false)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="flex h-full items-center justify-center p-6">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Info className="h-8 w-8" />
            <p className="text-sm text-center">Select an item to see details</p>
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}
