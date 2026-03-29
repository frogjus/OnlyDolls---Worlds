import { ShieldCheck } from 'lucide-react'
import { EmptyState } from '@/components/empty-states/empty-state'

export default function CanonPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Canon</h1>
        <p className="text-sm text-muted-foreground">
          Canon management — snapshots, branches, and versioning.
        </p>
      </div>
      <EmptyState
        icon={ShieldCheck}
        title="Canon Management"
        description="Version-control your story world with git-like snapshots. Mark content as canonical vs. draft, compare branches, and track how your world evolves over time."
        comingSoon
      />
    </div>
  )
}
