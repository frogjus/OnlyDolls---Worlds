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
      className="relative flex flex-col border-l border-slate-700/50 bg-slate-950/90 transition-[width] duration-200"
      style={{ width: inspectorWidth, minWidth: 280, maxWidth: 500 }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute inset-y-0 left-0 w-1 cursor-col-resize hover:bg-teal-500/40 transition-colors"
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/50 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-400/80">Inspector</span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setInspectorOpen(false)}
          className="text-slate-400 hover:text-slate-200"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="flex h-full items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <div className="relative">
              <Info className="h-8 w-8 text-teal-500/30" />
              <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(148,163,184,0.03)_2px,rgba(148,163,184,0.03)_4px)]" />
            </div>
            <p className="text-sm text-center text-slate-500">Select an element to inspect</p>
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}
