import { SearchCheck } from 'lucide-react'
import { EmptyState } from '@/components/empty-states/empty-state'

export default function ConsistencyPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Consistency</h1>
        <p className="text-sm text-muted-foreground">
          Consistency checker — contradictions and plot holes.
        </p>
      </div>
      <EmptyState
        icon={SearchCheck}
        title="Consistency Checker"
        description="Automatically detect contradictions, timeline paradoxes, and plot holes across your story world. Flag dead characters reappearing, broken promises, and location inconsistencies."
        comingSoon
      />
    </div>
  )
}
