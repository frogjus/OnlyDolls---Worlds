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
      <h2 className="px-6 pt-6 text-2xl font-bold">{title}</h2>
      <div className="flex-1 p-6">{children}</div>
    </div>
  )
}
