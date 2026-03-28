'use client'

import { type ReactNode } from 'react'

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

export function VizShell({
  children,
  title,
}: {
  children: ReactNode
  title: string
  [key: string]: unknown
}) {
  return (
    <div className="flex h-full flex-col">
      <h2 className="px-4 py-3 text-lg font-semibold">{title}</h2>
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  )
}
