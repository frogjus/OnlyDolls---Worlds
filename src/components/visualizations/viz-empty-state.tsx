'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface VizEmptyStateProps {
  illustration: 'timeline' | 'graph' | 'chart' | 'board' | 'editor' | 'diff'
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

function TimelineIllustration() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" className="text-primary/30">
      <line x1="10" y1="40" x2="110" y2="40" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
      <circle cx="25" cy="40" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="55" cy="40" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="85" cy="40" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="18" y="18" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="48" y="52" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="78" y="18" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function GraphIllustration() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" className="text-primary/30">
      <line x1="30" y1="25" x2="60" y2="50" stroke="currentColor" strokeWidth="1.5" />
      <line x1="60" y1="50" x2="90" y2="25" stroke="currentColor" strokeWidth="1.5" />
      <line x1="30" y1="25" x2="90" y2="25" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="60" y1="50" x2="45" y2="65" stroke="currentColor" strokeWidth="1.5" />
      <line x1="60" y1="50" x2="80" y2="65" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="30" cy="25" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="90" cy="25" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="60" cy="50" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="45" cy="65" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="80" cy="65" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function ChartIllustration() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" className="text-primary/30">
      <line x1="20" y1="10" x2="20" y2="70" stroke="currentColor" strokeWidth="1.5" />
      <line x1="20" y1="70" x2="110" y2="70" stroke="currentColor" strokeWidth="1.5" />
      <rect x="30" y="45" width="12" height="25" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="50" y="30" width="12" height="40" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="70" y="38" width="12" height="32" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="90" y="20" width="12" height="50" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function BoardIllustration() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" className="text-primary/30">
      {[15, 45, 75].map((x) => (
        <g key={x}>
          <rect x={x} y="8" width="28" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <rect x={x} y="22" width="28" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <rect x={x} y="42" width="28" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <rect x={x} y="62" width="28" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </g>
      ))}
    </svg>
  )
}

function EditorIllustration() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" className="text-primary/30">
      <rect x="10" y="8" width="80" height="6" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="10" y="20" width="100" height="6" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="10" y="32" width="65" height="6" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="10" y="44" width="90" height="6" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="10" y="56" width="50" height="6" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="10" y="68" width="75" height="6" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function DiffIllustration() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" className="text-primary/30">
      <rect x="5" y="5" width="50" height="70" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="65" y="5" width="50" height="70" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="12" y="15" width="36" height="4" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
      <rect x="12" y="25" width="28" height="4" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
      <rect x="12" y="35" width="40" height="4" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
      <rect x="72" y="15" width="32" height="4" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
      <rect x="72" y="25" width="38" height="4" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
      <rect x="72" y="35" width="26" height="4" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  )
}

const illustrationMap: Record<VizEmptyStateProps['illustration'], React.FC> = {
  timeline: TimelineIllustration,
  graph: GraphIllustration,
  chart: ChartIllustration,
  board: BoardIllustration,
  editor: EditorIllustration,
  diff: DiffIllustration,
}

function VizEmptyState({ illustration, title, description, action }: VizEmptyStateProps) {
  const Illustration = illustrationMap[illustration]
  return (
    <div
      data-slot="viz-empty-state"
      className="flex h-full w-full flex-col items-center justify-center gap-5 p-8"
    >
      <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-muted/60 shadow-[var(--od-glow-teal-sm)]">
        <Illustration />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="font-heading text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="max-w-[300px] text-sm leading-relaxed text-[var(--od-text-secondary)]">{description}</p>
      </div>
      {action && (
        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-[var(--od-teal-600)] glow-teal-hover transition-all" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

export { VizEmptyState }
