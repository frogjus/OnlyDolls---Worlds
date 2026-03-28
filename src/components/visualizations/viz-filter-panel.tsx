'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { XIcon, RotateCcwIcon, SearchIcon } from 'lucide-react'

export interface FilterDimension {
  key: string
  label: string
  type: 'multi-select' | 'range' | 'toggle' | 'search'
  options?: { value: string; label: string; count?: number }[]
  min?: number
  max?: number
}

export type FilterValue =
  | { type: 'multi-select'; values: string[] }
  | { type: 'range'; min: number; max: number }
  | { type: 'toggle'; enabled: boolean }
  | { type: 'search'; query: string }

export interface VizFilterPanelProps {
  dimensions: FilterDimension[]
  activeFilters: Record<string, FilterValue>
  onChange: (filters: Record<string, FilterValue>) => void
  onReset: () => void
  onClose: () => void
}

function MultiSelectFilter({
  dimension,
  value,
  onChange,
}: {
  dimension: FilterDimension
  value: string[]
  onChange: (values: string[]) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {dimension.options?.map((option) => {
        const checked = value.includes(option.value)
        return (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted"
          >
            <span
              role="checkbox"
              aria-checked={checked}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  onChange(
                    checked
                      ? value.filter((v) => v !== option.value)
                      : [...value, option.value]
                  )
                }
              }}
              onClick={() =>
                onChange(
                  checked
                    ? value.filter((v) => v !== option.value)
                    : [...value, option.value]
                )
              }
              className={cn(
                'flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
                checked
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-transparent'
              )}
            >
              {checked && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 5L4.5 7.5L8 2.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span className="flex-1 truncate text-foreground">{option.label}</span>
            {option.count !== undefined && (
              <span className="text-xs text-muted-foreground">{option.count}</span>
            )}
          </label>
        )
      })}
    </div>
  )
}

function RangeFilter({
  dimension,
  value,
  onChange,
}: {
  dimension: FilterDimension
  value: { min: number; max: number }
  onChange: (range: { min: number; max: number }) => void
}) {
  const min = dimension.min ?? 0
  const max = dimension.max ?? 100
  const rangeMin = value.min
  const rangeMax = value.max
  const pctMin = ((rangeMin - min) / (max - min)) * 100
  const pctMax = ((rangeMax - min) / (max - min)) * 100

  return (
    <div className="flex flex-col gap-3 px-1">
      <div className="relative h-5">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-muted" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${pctMin}%`, width: `${pctMax - pctMin}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={rangeMin}
          onChange={(e) => onChange({ min: Number(e.target.value), max: rangeMax })}
          className="pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={rangeMax}
          onChange={(e) => onChange({ min: rangeMin, max: Number(e.target.value) })}
          className="pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background"
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{rangeMin}</span>
        <span>{rangeMax}</span>
      </div>
    </div>
  )
}

function ToggleFilter({
  value,
  onChange,
}: {
  value: boolean
  onChange: (enabled: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
        value ? 'bg-primary' : 'bg-input'
      )}
    >
      <span
        className={cn(
          'pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform',
          value ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  )
}

function SearchFilter({
  value,
  onChange,
}: {
  value: string
  onChange: (query: string) => void
}) {
  return (
    <div className="relative">
      <SearchIcon className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search..."
        className="h-7 pl-7 text-xs"
      />
    </div>
  )
}

function getDefaultFilterValue(dimension: FilterDimension): FilterValue {
  switch (dimension.type) {
    case 'multi-select':
      return { type: 'multi-select', values: [] }
    case 'range':
      return { type: 'range', min: dimension.min ?? 0, max: dimension.max ?? 100 }
    case 'toggle':
      return { type: 'toggle', enabled: false }
    case 'search':
      return { type: 'search', query: '' }
  }
}

function VizFilterPanel({
  dimensions,
  activeFilters,
  onChange,
  onReset,
  onClose,
}: VizFilterPanelProps) {
  const updateFilter = React.useCallback(
    (key: string, value: FilterValue) => {
      onChange({ ...activeFilters, [key]: value })
    },
    [activeFilters, onChange]
  )

  return (
    <div
      data-slot="viz-filter-panel"
      className="flex h-full w-72 shrink-0 flex-col border-l border-border bg-background"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium text-foreground">Filters</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" onClick={onReset} aria-label="Reset all filters">
            <RotateCcwIcon />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={onClose} aria-label="Close filters">
            <XIcon />
          </Button>
        </div>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="flex flex-col gap-5">
          {dimensions.map((dim) => {
            const filterVal = activeFilters[dim.key] ?? getDefaultFilterValue(dim)
            return (
              <div key={dim.key} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {dim.label}
                  </span>
                  {dim.type === 'toggle' && (
                    <ToggleFilter
                      value={filterVal.type === 'toggle' ? filterVal.enabled : false}
                      onChange={(enabled) =>
                        updateFilter(dim.key, { type: 'toggle', enabled })
                      }
                    />
                  )}
                </div>
                {dim.type === 'multi-select' && (
                  <MultiSelectFilter
                    dimension={dim}
                    value={filterVal.type === 'multi-select' ? filterVal.values : []}
                    onChange={(values) =>
                      updateFilter(dim.key, { type: 'multi-select', values })
                    }
                  />
                )}
                {dim.type === 'range' && (
                  <RangeFilter
                    dimension={dim}
                    value={
                      filterVal.type === 'range'
                        ? { min: filterVal.min, max: filterVal.max }
                        : { min: dim.min ?? 0, max: dim.max ?? 100 }
                    }
                    onChange={(range) =>
                      updateFilter(dim.key, { type: 'range', ...range })
                    }
                  />
                )}
                {dim.type === 'search' && (
                  <SearchFilter
                    value={filterVal.type === 'search' ? filterVal.query : ''}
                    onChange={(query) =>
                      updateFilter(dim.key, { type: 'search', query })
                    }
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export { VizFilterPanel }
