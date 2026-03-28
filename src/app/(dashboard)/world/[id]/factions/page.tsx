'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Shield, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useFactions,
  useCreateFaction,
  useUpdateFaction,
  useDeleteFaction,
  type Faction,
  type CreateFactionPayload,
} from '@/lib/hooks/use-factions'
import { useFactionStore } from '@/stores/faction-store'

function FactionFormDialog({
  open,
  onOpenChange,
  faction,
  worldId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  faction: Faction | null
  worldId: string
}) {
  const [name, setName] = useState(faction?.name ?? '')
  const [description, setDescription] = useState(faction?.description ?? '')
  const [factionType, setFactionType] = useState(faction?.type ?? '')
  const [goalsText, setGoalsText] = useState(
    faction?.goals?.length ? (faction.goals as string[]).join('\n') : ''
  )

  const createMutation = useCreateFaction(worldId)
  const updateMutation = useUpdateFaction(worldId)
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const goals = goalsText
      .split('\n')
      .map((g) => g.trim())
      .filter(Boolean)
    const payload: CreateFactionPayload = {
      name,
      description: description || undefined,
      factionType: factionType || undefined,
      goals: goals.length ? goals : undefined,
    }
    if (faction) {
      updateMutation.mutate(
        { id: faction.id, ...payload },
        {
          onSuccess: () => {
            onOpenChange(false)
          },
        }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          onOpenChange(false)
          setName('')
          setDescription('')
          setFactionType('')
          setGoalsText('')
        },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{faction ? 'Edit Faction' : 'Create Faction'}</DialogTitle>
            <DialogDescription>
              {faction
                ? 'Update this faction\'s details.'
                : 'Add a new faction to your story world.'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="faction-name">Name *</Label>
              <Input
                id="faction-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Faction name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="faction-description">Description</Label>
              <Textarea
                id="faction-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this faction..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="faction-type">Type</Label>
              <Input
                id="faction-type"
                value={factionType}
                onChange={(e) => setFactionType(e.target.value)}
                placeholder="e.g. political, religious, criminal"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="faction-goals">Goals</Label>
              <Textarea
                id="faction-goals"
                value={goalsText}
                onChange={(e) => setGoalsText(e.target.value)}
                placeholder="Enter goals, one per line"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? 'Saving...' : faction ? 'Save Changes' : 'Create Faction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function FactionsPage() {
  const params = useParams<{ id: string }>()
  const worldId = params.id
  const { data: factions, isLoading, error } = useFactions(worldId)
  const deleteMutation = useDeleteFaction(worldId)

  const {
    createDialogOpen,
    setCreateDialogOpen,
    editingFactionId,
    setEditingFactionId,
  } = useFactionStore()

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const editingFaction = editingFactionId
    ? factions?.find((f) => f.id === editingFactionId) ?? null
    : null

  const factionToDelete = deleteConfirmId
    ? factions?.find((f) => f.id === deleteConfirmId) ?? null
    : null

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Factions</h1>
          <p className="text-muted-foreground">Faction and power dynamics mapping.</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Faction
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-2 h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          Failed to load factions: {error.message}
        </div>
      )}

      {!isLoading && !error && (!factions || factions.length === 0) && (
        <Card className="border-dashed">
          <CardHeader className="items-center text-center">
            <Shield className="mb-2 h-10 w-10 text-muted-foreground" />
            <CardTitle className="text-muted-foreground">No factions yet</CardTitle>
            <CardDescription>Create your first faction to start mapping power dynamics.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {factions && factions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {factions.map((faction) => {
            const goals = Array.isArray(faction.goals) ? (faction.goals as string[]) : []
            return (
              <Card key={faction.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">{faction.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingFactionId(faction.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteConfirmId(faction.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {faction.type && (
                    <Badge variant="secondary" className="mt-1 w-fit">
                      {faction.type}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  {faction.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {faction.description}
                    </p>
                  )}
                  {goals.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {goals.slice(0, 3).map((goal, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {goal}
                        </Badge>
                      ))}
                      {goals.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{goals.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create dialog */}
      <FactionFormDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open)
        }}
        faction={null}
        worldId={worldId}
      />

      {/* Edit dialog */}
      <FactionFormDialog
        open={!!editingFactionId}
        onOpenChange={(open) => {
          if (!open) setEditingFactionId(null)
        }}
        faction={editingFaction}
        worldId={worldId}
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Faction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{factionToDelete?.name}&quot;? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteConfirmId) {
                  deleteMutation.mutate(deleteConfirmId, {
                    onSuccess: () => setDeleteConfirmId(null),
                  })
                }
              }}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
