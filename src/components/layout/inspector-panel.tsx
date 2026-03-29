'use client'

import { useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

  return (
    <AnimatePresence>
      {inspectorOpen && (
        <motion.aside
          className="relative flex flex-col border-l bg-card overflow-hidden"
          style={{ minWidth: 280, maxWidth: 500 }}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: inspectorWidth, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
        >
          {/* Resize handle */}
          <div
            onMouseDown={handleMouseDown}
            className="absolute inset-y-0 left-0 w-1 cursor-col-resize hover:bg-primary/20 transition-colors"
          />

          {/* Header */}
          <motion.div
            className="flex items-center justify-between border-b px-3 py-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.2 }}
          >
            <span className="text-sm font-semibold">Inspector</span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setInspectorOpen(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </motion.div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <motion.div
              className="flex h-full items-center justify-center p-6"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Info className="h-8 w-8" />
                <p className="text-sm text-center">Select an item to see details</p>
              </div>
            </motion.div>
          </ScrollArea>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
