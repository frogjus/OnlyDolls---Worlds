import { Workflow } from 'lucide-react'
import { EmptyState } from '@/components/empty-states/empty-state'

export default function CausalityPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-h2 text-foreground">Causality</h1>
        <p className="mt-1 text-sm text-[var(--od-text-secondary)]">
          Causal chain visualization between events.
        </p>
      </div>
      <EmptyState
        icon={Workflow}
        title="Causality Chains"
        description="Visualize not just when events happen, but why. Map physical causes, character motivations, psychological triggers, and enabling conditions as a directed graph."
        comingSoon
      />
    </div>
  )
}
