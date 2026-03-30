import { Sparkles } from 'lucide-react'
import { EmptyState } from '@/components/empty-states/empty-state'

export default function SystemsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-h2 text-foreground">Systems</h1>
        <p className="mt-1 text-sm text-[var(--od-text-secondary)]">
          Magic systems, world rules, and custom calendars.
        </p>
      </div>
      <EmptyState
        icon={Sparkles}
        title="World Systems Designer"
        description="Design rule-based magic systems, technology frameworks, and custom calendar systems for your world. Define rules, costs, limitations, and practitioners with dedicated modules."
        comingSoon
      />
    </div>
  )
}
