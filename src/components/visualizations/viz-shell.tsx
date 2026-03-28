'use client'

import { type ReactNode, useState, useCallback } from 'react'

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

export interface VizEmptyStateProps {
  illustration: 'timeline' | 'graph' | 'chart' | 'board' | 'editor' | 'diff'
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export interface VizShellProps {
  children: ReactNode
  title: string
  filters?: FilterDimension[]
  activeFilters?: Record<string, FilterValue>
  onFilterChange?: (key: string, value: FilterValue) => void
  toolbar?: ReactNode
  emptyState?: VizEmptyStateProps
}

export function VizShell({
  children,
  title,
  filters,
  activeFilters,
  onFilterChange,
  toolbar,
}: VizShellProps) {
  const [filterOpen, setFilterOpen] = useState(false)

  const handleToggle = useCallback(
    (dim: FilterDimension) => {
      if (!onFilterChange) return
      const current = activeFilters?.[dim.key]
      if (dim.type === 'multi-select') {
        const val = current as { type: 'multi-select'; values: string[] } | undefined
        const allValues = dim.options?.map((o) => o.value) ?? []
        const isAllSelected = val?.values.length === allValues.length
        onFilterChange(dim.key, {
          type: 'multi-select',
          values: isAllSelected ? [] : allValues,
        })
      } else if (dim.type === 'toggle') {
        const val = current as { type: 'toggle'; enabled: boolean } | undefined
        onFilterChange(dim.key, { type: 'toggle', enabled: !val?.enabled })
      }
    },
    [activeFilters, onFilterChange],
  )

  const handleOptionClick = useCallback(
    (dim: FilterDimension, optionValue: string) => {
      if (!onFilterChange || dim.type !== 'multi-select') return
      const current = activeFilters?.[dim.key] as
        | { type: 'multi-select'; values: string[] }
        | undefined
      const values = current?.values ?? dim.options?.map((o) => o.value) ?? []
      const next = values.includes(optionValue)
        ? values.filter((v) => v !== optionValue)
        : [...values, optionValue]
      onFilterChange(dim.key, { type: 'multi-select', values: next })
    },
    [activeFilters, onFilterChange],
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          {toolbar}
          {filters && filters.length > 0 && (
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            >
              Filters
            </button>
          )}
        </div>
      </div>
      {filterOpen && filters && (
        <div className="flex flex-wrap gap-4 border-b px-4 py-3">
          {filters.map((dim) => (
            <div key={dim.key} className="flex flex-col gap-1">
              <button
                onClick={() => handleToggle(dim)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                {dim.label}
              </button>
              {dim.type === 'multi-select' && dim.options && (
                <div className="flex flex-wrap gap-1">
                  {dim.options.map((opt) => {
                    const current = activeFilters?.[dim.key] as
                      | { type: 'multi-select'; values: string[] }
                      | undefined
                    const allValues = dim.options?.map((o) => o.value) ?? []
                    const values = current?.values ?? allValues
                    const active = values.includes(opt.value)
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleOptionClick(dim, opt.value)}
                        className={`rounded-full px-2 py-0.5 text-xs transition-colors ${
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {opt.label}
                        {opt.count != null && (
                          <span className="ml-1 opacity-60">({opt.count})</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="relative flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
