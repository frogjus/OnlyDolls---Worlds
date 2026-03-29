import { BookOpen } from 'lucide-react'
import { EmptyState } from '@/components/empty-states/empty-state'

export default function WikiPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Wiki</h1>
        <p className="text-sm text-muted-foreground">
          Auto-linking encyclopedia for world elements.
        </p>
      </div>
      <EmptyState
        icon={BookOpen}
        title="World Encyclopedia"
        description="An auto-linking wiki that recognizes and connects every character, location, object, and concept in your story world. Browse and search your world knowledge base."
        comingSoon
      />
    </div>
  )
}
