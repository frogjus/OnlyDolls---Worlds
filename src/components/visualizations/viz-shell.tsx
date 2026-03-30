'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { VizToolbar } from './viz-toolbar'
import { VizFilterPanel, type FilterDimension, type FilterValue } from './viz-filter-panel'
export type { FilterDimension, FilterValue }
import { VizSkeleton, type VizSkeletonProps } from './viz-skeleton'
import { VizEmptyState, type VizEmptyStateProps } from './viz-empty-state'
import { exportToSvg, exportToPng, downloadSvg, downloadBlob } from '@/lib/viz-export'

export interface VizShellProps {
  title: string
  children: React.ReactNode
  filterDimensions?: FilterDimension[]
  activeFilters?: Record<string, FilterValue>
  onFilterChange?: (filters: Record<string, FilterValue>) => void
  onFilterReset?: () => void
  extraControls?: React.ReactNode
  exportRef?: React.RefObject<HTMLElement | SVGElement | null>
  isLoading?: boolean
  emptyState?: VizEmptyStateProps
  isEmpty?: boolean
  skeletonVariant?: VizSkeletonProps['variant']
}

function countActiveFilters(filters: Record<string, FilterValue>): number {
  let count = 0
  for (const value of Object.values(filters)) {
    switch (value.type) {
      case 'multi-select':
        if (value.values.length > 0) count++
        break
      case 'range':
        count++
        break
      case 'toggle':
        if (value.enabled) count++
        break
      case 'search':
        if (value.query.length > 0) count++
        break
    }
  }
  return count
}

function VizShell({
  title,
  children,
  filterDimensions,
  activeFilters = {},
  onFilterChange,
  onFilterReset,
  extraControls,
  exportRef,
  isLoading = false,
  emptyState,
  isEmpty = false,
  skeletonVariant = 'graph',
}: VizShellProps) {
  const shellRef = React.useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = React.useState(1)
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)

  const activeFilterCount = countActiveFilters(activeFilters)
  const hasFilters = filterDimensions && filterDimensions.length > 0

  const handleToggleFullscreen = React.useCallback(() => {
    if (!shellRef.current) return
    if (!document.fullscreenElement) {
      shellRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }, [])

  React.useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const handleExport = React.useCallback(
    async (format: 'svg' | 'png') => {
      const el = exportRef?.current
      if (!el) return
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      if (format === 'svg') {
        const svgStr = await exportToSvg(el)
        downloadSvg(svgStr, `${slug}.svg`)
      } else {
        const blob = await exportToPng(el)
        downloadBlob(blob, `${slug}.png`)
      }
    },
    [exportRef, title]
  )

  React.useEffect(() => {
    const el = shellRef.current
    if (!el) return

    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey

      if (mod && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        setZoom((z) => Math.min(5, Math.round((z + 0.1) * 100) / 100))
      } else if (mod && e.key === '-') {
        e.preventDefault()
        setZoom((z) => Math.max(0.1, Math.round((z - 0.1) * 100) / 100))
      } else if (mod && e.key === '0') {
        e.preventDefault()
        setZoom(1)
      } else if (e.key === 'f' && !mod && !e.altKey && !e.shiftKey) {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return
        e.preventDefault()
        handleToggleFullscreen()
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen().catch(() => {})
        } else if (filtersOpen) {
          setFiltersOpen(false)
        }
      }
    }

    el.addEventListener('keydown', onKeyDown)
    return () => el.removeEventListener('keydown', onKeyDown)
  }, [isFullscreen, filtersOpen, handleToggleFullscreen])

  return (
    <div
      ref={shellRef}
      data-slot="viz-shell"
      tabIndex={-1}
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-lg border border-[var(--od-border-emphasis)] bg-card shadow-[var(--od-shadow-card)] outline-none',
        isFullscreen && 'rounded-none border-none shadow-none'
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--od-border-default)] px-3 py-1.5">
        <h2 className="font-heading text-sm font-medium tracking-tight text-foreground">{title}</h2>
      </div>

      <VizToolbar
        zoom={zoom}
        onZoomChange={setZoom}
        onToggleFilters={() => setFiltersOpen((o) => !o)}
        filtersActive={filtersOpen}
        activeFilterCount={activeFilterCount}
        onExport={handleExport}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
        extraControls={extraControls}
      />

      <div className="relative flex min-h-0 flex-1">
        <div className="min-h-0 flex-1 overflow-auto">
          {isLoading ? (
            <VizSkeleton variant={skeletonVariant} />
          ) : isEmpty && emptyState ? (
            <VizEmptyState {...emptyState} />
          ) : (
            children
          )}
        </div>

        {hasFilters && (
          <div
            className={cn(
              'absolute inset-y-0 right-0 z-10 transition-transform duration-200 ease-in-out',
              filtersOpen ? 'translate-x-0' : 'translate-x-full'
            )}
          >
            <VizFilterPanel
              dimensions={filterDimensions}
              activeFilters={activeFilters}
              onChange={onFilterChange ?? (() => {})}
              onReset={onFilterReset ?? (() => {})}
              onClose={() => setFiltersOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export { VizShell }
