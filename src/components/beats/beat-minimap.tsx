'use client'

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type RefObject,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { BeatWithCharacter } from '@/lib/hooks/use-beats'
import type { BeatStatus } from '@/types'

const MINIMAP_WIDTH = 200
const MINIMAP_HEIGHT = 120
const CARD_HEIGHT = 6
const CARD_GAP = 2
const COL_GAP = 4
const COL_PADDING = 3

const STATUS_COLORS: Record<BeatStatus, string> = {
  todo: '#a1a1aa',
  in_progress: '#3b82f6',
  done: '#22c55e',
}

interface BeatMinimapProps {
  columns: Record<BeatStatus, BeatWithCharacter[]>
  scrollContainerRef: RefObject<HTMLDivElement | null>
}

export function BeatMinimap({ columns, scrollContainerRef }: BeatMinimapProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [viewport, setViewport] = useState({ x: 0, y: 0, w: 1, h: 1 })
  const [contentSize, setContentSize] = useState({ w: 0, h: 0 })
  const [needsMinimap, setNeedsMinimap] = useState(false)
  const isDragging = useRef(false)
  const minimapRef = useRef<HTMLDivElement>(null)

  const updateViewport = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const sw = el.scrollWidth
    const sh = el.scrollHeight
    const cw = el.clientWidth
    const ch = el.clientHeight

    setNeedsMinimap(sw > cw + 1 || sh > ch + 1)
    setContentSize({ w: sw, h: sh })
    setViewport({
      x: sw > 0 ? el.scrollLeft / sw : 0,
      y: sh > 0 ? el.scrollTop / sh : 0,
      w: sw > 0 ? cw / sw : 1,
      h: sh > 0 ? ch / sh : 1,
    })
  }, [scrollContainerRef])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    updateViewport()
    el.addEventListener('scroll', updateViewport, { passive: true })

    const ro = new ResizeObserver(updateViewport)
    ro.observe(el)
    // Also observe children so that card additions/removals trigger recalculation
    for (const child of Array.from(el.children)) {
      ro.observe(child)
    }

    return () => {
      el.removeEventListener('scroll', updateViewport)
      ro.disconnect()
    }
  }, [scrollContainerRef, updateViewport])

  const scrollToMinimapPos = useCallback(
    (clientX: number, clientY: number) => {
      const el = scrollContainerRef.current
      const mm = minimapRef.current
      if (!el || !mm) return

      const rect = mm.getBoundingClientRect()
      const ratioX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const ratioY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))

      el.scrollTo({
        left: ratioX * el.scrollWidth - el.clientWidth / 2,
        top: ratioY * el.scrollHeight - el.clientHeight / 2,
        behavior: isDragging.current ? 'instant' : 'smooth',
      })
    },
    [scrollContainerRef],
  )

  const handleMouseDown = (e: ReactMouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    scrollToMinimapPos(e.clientX, e.clientY)

    const onMove = (me: globalThis.MouseEvent) => {
      if (isDragging.current) scrollToMinimapPos(me.clientX, me.clientY)
    }
    const onUp = () => {
      isDragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  if (!needsMinimap) return null

  const statuses: BeatStatus[] = ['todo', 'in_progress', 'done']
  const colCount = statuses.length
  const innerWidth = MINIMAP_WIDTH - COL_PADDING * 2
  const colWidth = (innerWidth - COL_GAP * (colCount - 1)) / colCount

  // Compute max column height in cards to scale vertically
  const maxCards = Math.max(1, ...statuses.map((s) => columns[s].length))
  const naturalHeight = COL_PADDING + maxCards * (CARD_HEIGHT + CARD_GAP) + COL_PADDING
  const scaleY = naturalHeight > MINIMAP_HEIGHT ? MINIMAP_HEIGHT / naturalHeight : 1
  const scaledCardH = CARD_HEIGHT * scaleY
  const scaledGap = CARD_GAP * scaleY

  return (
    <div className="fixed bottom-4 left-4 z-50 select-none">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="mb-1 flex items-center gap-1 rounded bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground backdrop-blur hover:text-foreground"
      >
        {collapsed ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        Mini-map
      </button>

      {!collapsed && (
        <div
          ref={minimapRef}
          onMouseDown={handleMouseDown}
          className="cursor-crosshair overflow-hidden rounded-lg border border-border/50 bg-background/90 backdrop-blur"
          style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
        >
          {/* Column cards */}
          <svg width={MINIMAP_WIDTH} height={MINIMAP_HEIGHT}>
            {statuses.map((status, ci) => {
              const x = COL_PADDING + ci * (colWidth + COL_GAP)
              return (
                <g key={status}>
                  {/* Column background */}
                  <rect
                    x={x}
                    y={COL_PADDING * scaleY}
                    width={colWidth}
                    height={MINIMAP_HEIGHT - COL_PADDING * scaleY * 2}
                    rx={2}
                    fill="currentColor"
                    className="text-muted/30"
                  />
                  {/* Cards */}
                  {columns[status].map((beat, i) => (
                    <rect
                      key={beat.id}
                      x={x + 2}
                      y={COL_PADDING * scaleY + i * (scaledCardH + scaledGap) + scaledGap}
                      width={colWidth - 4}
                      height={scaledCardH}
                      rx={1}
                      fill={beat.color || STATUS_COLORS[status]}
                      opacity={0.85}
                    />
                  ))}
                </g>
              )
            })}

            {/* Viewport rectangle */}
            <rect
              x={viewport.x * MINIMAP_WIDTH}
              y={viewport.y * MINIMAP_HEIGHT}
              width={Math.max(viewport.w * MINIMAP_WIDTH, 8)}
              height={Math.max(viewport.h * MINIMAP_HEIGHT, 8)}
              rx={2}
              fill="hsl(var(--primary) / 0.15)"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
            />
          </svg>
        </div>
      )}
    </div>
  )
}
