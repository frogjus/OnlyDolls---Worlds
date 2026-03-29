import { Eye } from 'lucide-react'
import { EmptyState } from '@/components/empty-states/empty-state'

export default function KnowledgePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Knowledge</h1>
        <p className="text-sm text-muted-foreground">
          Audience knowledge tracker — who knows what when.
        </p>
      </div>
      <EmptyState
        icon={Eye}
        title="Audience Knowledge Tracker"
        description="Track what the audience knows vs. what each character knows at any point in the narrative. Identify dramatic irony, manage mystery reveals, and map information asymmetry."
        comingSoon
      />
    </div>
  )
}
