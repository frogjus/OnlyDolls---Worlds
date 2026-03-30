import { BookOpen } from 'lucide-react'
import { EmptyState } from '@/components/empty-states/empty-state'

export default function WikiPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-h2 text-foreground">Wiki</h1>
        <p className="mt-1 text-sm text-[var(--od-text-secondary)]">
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
