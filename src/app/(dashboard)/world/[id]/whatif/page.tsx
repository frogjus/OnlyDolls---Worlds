import { GitBranch } from 'lucide-react'
import { EmptyState } from '@/components/empty-states/empty-state'

export default function WhatIfPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-h2 text-foreground">What-If</h1>
        <p className="mt-1 text-sm text-[var(--od-text-secondary)]">
          What-if scenario exploration and branching analysis.
        </p>
      </div>
      <EmptyState
        icon={GitBranch}
        title="What-If Scenarios"
        description="Fork any plot point and simulate cascading consequences. Compare parallel timelines side by side to explore alternate story paths before committing to changes."
        comingSoon
      />
    </div>
  )
}
