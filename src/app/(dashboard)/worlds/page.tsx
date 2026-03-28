import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Plus } from 'lucide-react'

export default function WorldsPage() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Story Worlds</h1>
          <p className="text-muted-foreground">Manage your narrative universes</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create World
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-muted-foreground">No worlds yet</CardTitle>
            <CardDescription>Create your first story world to get started</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
