'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Shield,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react'

import type { Faction, CreateFactionPayload, UpdateFactionPayload } from '@/types'
import {
  useFactions,
  useCreateFaction,
  useUpdateFaction,
  useDeleteFaction,
} from '@/lib/hooks/use-factions'
import { useFactionStore } from '@/stores/faction-store'
import { EmptyState } from '@/components/empty-states/empty-state'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// ---------------------------------------------------------------------------
// Create Dialog
// ---------------------------------------------------------------------------

function CreateFactionDialog({ worldId }: { worldId: string }) {
  const { createDialogOpen, setCreateDialogOpen } = useFactionStore()
  const create = useCreateFaction(worldId)
  const [form, setForm] = useState<CreateFactionPayload>({ name: '' })
  const [goalInput, setGoalInput] = useState('')

  const goals = Array.isArray(form.goals) ? (form.goals as string[]) : []

  function addGoal() {
    const trimmed = goalInput.trim()
    if (!trimmed) return
    setForm({ ...form, goals: [...goals, trimmed] })
    setGoalInput('')
  }

  function removeGoal(idx: number) {
    setForm({ ...form, goals: goals.filter((_, i) => i !== idx) })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    create.mutate(form, {
      onSuccess: () => {
        setCreateDialogOpen(false)
        setForm({ name: '' })
        setGoalInput('')
      },
    })
  }

  return (
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Faction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-name">Name *</Label>
            <Input
              id="create-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. The Silver Order"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-type">Type</Label>
            <Input
              id="create-type"
              value={form.factionType ?? ''}
              onChange={(e) => setForm({ ...form, factionType: e.target.value })}
              placeholder="e.g. political, religious, criminal"
            />
          </div>
          <div className="space-y-2">
            <Label>Goals</Label>
            <div className="flex gap-2">
              <Input
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Add a goal"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addGoal()
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addGoal}>
                Add
              </Button>
            </div>
            {goals.length > 0 && (
              <ul className="mt-1 space-y-1">
                {goals.map((goal, i) => (
                  <li key={i} className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{goal}</span>
                    <button
                      type="button"
                      onClick={() => removeGoal(i)}
                      className="text-destructive hover:text-destructive/80 text-xs"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-desc">Description</Label>
            <Textarea
              id="create-desc"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe this faction..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || !form.name.trim()}>
              {create.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Edit Dialog
// ---------------------------------------------------------------------------

function EditFactionDialog({
  worldId,
  faction,
}: {
  worldId: string
  faction: Faction
}) {
  const { setEditingFactionId } = useFactionStore()
  const update = useUpdateFaction(worldId)

  const initialGoals = Array.isArray(faction.goals) ? (faction.goals as string[]) : []

  const [form, setForm] = useState<UpdateFactionPayload & { id: string }>({
    id: faction.id,
    name: faction.name,
    factionType: faction.type ?? '',
    description: faction.description ?? '',
    goals: initialGoals,
  })

  const [goalInput, setGoalInput] = useState('')

  const goals = Array.isArray(form.goals) ? (form.goals as string[]) : []

  function addGoal() {
    const trimmed = goalInput.trim()
    if (!trimmed) return
    setForm({ ...form, goals: [...goals, trimmed] })
    setGoalInput('')
  }

  function removeGoal(idx: number) {
    setForm({ ...form, goals: goals.filter((_, i) => i !== idx) })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate(form, { onSuccess: () => setEditingFactionId(null) })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && setEditingFactionId(null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Faction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              value={form.name ?? ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-type">Type</Label>
            <Input
              id="edit-type"
              value={form.factionType ?? ''}
              onChange={(e) => setForm({ ...form, factionType: e.target.value })}
              placeholder="e.g. political, religious, criminal"
            />
          </div>
          <div className="space-y-2">
            <Label>Goals</Label>
            <div className="flex gap-2">
              <Input
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Add a goal"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addGoal()
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addGoal}>
                Add
              </Button>
            </div>
            {goals.length > 0 && (
              <ul className="mt-1 space-y-1">
                {goals.map((goal, i) => (
                  <li key={i} className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{goal}</span>
                    <button
                      type="button"
                      onClick={() => removeGoal(i)}
                      className="text-destructive hover:text-destructive/80 text-xs"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea
              id="edit-desc"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingFactionId(null)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={update.isPending || !form.name?.trim()}>
              {update.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Faction Card
// ---------------------------------------------------------------------------

function FactionCard({
  faction,
  worldId,
}: {
  faction: Faction
  worldId: string
}) {
  const { setEditingFactionId, setSelectedFactionId } = useFactionStore()
  const deleteFaction = useDeleteFaction(worldId)

  const goals = Array.isArray(faction.goals) ? (faction.goals as string[]) : []

  return (
    <Card
      className="group cursor-pointer border-slate-700/50 bg-slate-900/80 transition-all hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/5"
      onClick={() => setSelectedFactionId(faction.id)}
    >
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800">
          <Shield className="h-5 w-5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base truncate">{faction.name}</CardTitle>
          {faction.type && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {faction.type}
            </Badge>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground opacity-0 group-hover:opacity-100"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setEditingFactionId(faction.id)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                deleteFaction.mutate(faction.id)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {faction.description ? (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {faction.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No description</p>
        )}
        {goals.length > 0 && (
          <ul className="mt-2 space-y-1">
            {goals.map((goal, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-400">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400/50" />
                {goal}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Loading Skeletons
// ---------------------------------------------------------------------------

function FactionSkeletons() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function FactionsEmptyState() {
  const { setCreateDialogOpen } = useFactionStore()
  return (
    <EmptyState
      icon={Shield}
      title="No factions yet"
      description="Define the organizations, alliances, and power structures in your world. Track goals, hierarchies, and shifting allegiances."
      primaryAction={{ label: 'New Faction', onClick: () => setCreateDialogOpen(true) }}
    />
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FactionsPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const { data, isLoading, error } = useFactions(worldId)
  const {
    editingFactionId,
    setCreateDialogOpen,
  } = useFactionStore()

  const factions = data?.data ?? []
  const editingFaction = factions.find((f) => f.id === editingFactionId)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Factions</h1>
          <p className="text-sm text-muted-foreground">
            {factions.length > 0
              ? `${factions.length} faction${factions.length === 1 ? '' : 's'}`
              : 'Factions, organizations, and power dynamics.'}
          </p>
        </div>
        <Button className="bg-teal-600 text-white hover:bg-teal-500 hover:shadow-[0_0_20px_rgba(20,184,166,0.25)] transition-all" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Faction
        </Button>
      </div>

      {isLoading ? (
        <FactionSkeletons />
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load factions. Please try again.
        </div>
      ) : factions.length === 0 ? (
        <FactionsEmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {factions.map((faction) => (
            <FactionCard
              key={faction.id}
              faction={faction}
              worldId={worldId}
            />
          ))}
        </div>
      )}

      <CreateFactionDialog worldId={worldId} />
      {editingFaction && (
        <EditFactionDialog worldId={worldId} faction={editingFaction} />
      )}
    </div>
  )
}
