'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  ZoomInIcon,
  ZoomOutIcon,
  Maximize2Icon,
  Minimize2Icon,
  FilterIcon,
  DownloadIcon,
  ScanIcon,
} from 'lucide-react'

export interface VizToolbarProps {
  zoom: number
  onZoomChange: (zoom: number) => void
  onToggleFilters: () => void
  filtersActive: boolean
  activeFilterCount: number
  onExport: (format: 'svg' | 'png') => void
  onToggleFullscreen: () => void
  isFullscreen: boolean
  extraControls?: React.ReactNode
}

const ZOOM_STEP = 0.1
const ZOOM_MIN = 0.1
const ZOOM_MAX = 5

function VizToolbar({
  zoom,
  onZoomChange,
  onToggleFilters,
  filtersActive,
  activeFilterCount,
  onExport,
  onToggleFullscreen,
  isFullscreen,
  extraControls,
}: VizToolbarProps) {
  const clampZoom = React.useCallback(
    (value: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100)),
    []
  )

  return (
    <div
      data-slot="viz-toolbar"
      className="flex h-10 shrink-0 items-center border-b border-border bg-background px-2"
    >
      {/* Left zone: Zoom controls */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onZoomChange(clampZoom(zoom - ZOOM_STEP))}
          disabled={zoom <= ZOOM_MIN}
          aria-label="Zoom out"
        >
          <ZoomOutIcon />
        </Button>
        <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onZoomChange(clampZoom(zoom + ZOOM_STEP))}
          disabled={zoom >= ZOOM_MAX}
          aria-label="Zoom in"
        >
          <ZoomInIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onZoomChange(1)}
          aria-label="Zoom to fit"
        >
          <ScanIcon />
        </Button>
      </div>

      {/* Center zone: Filter toggle */}
      <div className="flex flex-1 items-center justify-center">
        <Button
          variant={filtersActive ? 'secondary' : 'ghost'}
          size="sm"
          onClick={onToggleFilters}
          aria-label="Toggle filters"
          aria-expanded={filtersActive}
        >
          <FilterIcon data-icon="inline-start" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="default" className="ml-1 h-4 min-w-4 px-1 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Right zone: Export, fullscreen, extras */}
      <div className="flex items-center gap-0.5">
        {extraControls}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-xs" aria-label="Export visualization" />
            }
          >
            <DownloadIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport('svg')}>
              Export as SVG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('png')}>
              Export as PNG
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize2Icon /> : <Maximize2Icon />}
        </Button>
      </div>
    </div>
  )
}

export { VizToolbar }
