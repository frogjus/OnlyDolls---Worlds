'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import {
  Plus,
  Shield,
  MoreVertical,
  Pencil,
  Trash2,
  LayoutGrid,
  GitFork,
} from 'lucide-react'

import type { Faction, CreateFactionPayload, UpdateFactionPayload } from '@/types'
import type { FactionMapData } from '@/components/visualizations/faction-map'
import {
  useFactions,
  useCreateFaction,
  useUpdateFaction,
  useDeleteFaction,
} from '@/lib/hooks/use-factions'
import { useFactionStore } from '@/stores/faction-store'

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

const FactionMap = dynamic(
  () => import('@/components/visualizations/faction-map'),
  { ssr: false },
)

// ---------------------------------------------------------------------------
// Color palette by faction type
// ---------------------------------------------------------------------------

const FACTION_TYPE_COLORS: Record<string, string> = {
  political: '#3b82f6',
  religious: '#a855f7',
  criminal: '#ef4444',
  military: '#f97316',
  merchant: '#eab308',
  academic: '#14b8a6',
  noble: '#ec4899',
}
const DEFAULT_FACTION_COLOR = '#6b7280'

function factionColor(type: string | null | undefined): string {
  if (!type) return DEFAULT_FACTION_COLOR
  return FACTION_TYPE_COLORS[type.toLowerCase()] ?? DEFAULT_FACTION_COLOR
}

// ---------------------------------------------------------------------------
// Transform DB factions → FactionMapData
// ---------------------------------------------------------------------------

function buildFactionMapData(factions: Faction[]): FactionMapData {
  const nodes = factions.map((f) => {
    const meta = (f.metadata && typeof f.metadata === 'object' && !Array.isArray(f.metadata))
      ? (f.metadata as Record<string, unknown>)
      : {}
    const rawPower = typeof meta.powerLevel === 'number' ? meta.powerLevel : 3
    // Normalize: if stored as 1-5 scale, convert to 0-1; if already 0-1, keep as-is
    const powerLevel = rawPower > 1 ? rawPower / 5 : rawPower

    return {
      id: f.id,
      name: f.name,
      color: factionColor(f.type),
      powerLevel,
      memberCount: typeof meta.memberCount === 'number' ? meta.memberCount : 0,
      childFactionIds: [] as string[],
    }
  })

  return { factions: nodes, alliances: [] }
}

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
      className="group cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => setSelectedFactionId(faction.id)}
    >
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <Shield className="h-5 w-5 text-muted-foreground" />
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
          <ul className="mt-2 space-y-0.5">
            {goals.map((goal, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                - {goal}
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

function EmptyState() {
  const { setCreateDialogOpen } = useFactionStore()
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
      <Shield className="h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-semibold">No factions yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Create your first faction to map power dynamics in your story world.
      </p>
      <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Faction
      </Button>
    </div>
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
  const [view, setView] = useState<'list' | 'map'>('list')

  const factions = data?.data ?? []
  const editingFaction = factions.find((f) => f.id === editingFactionId)

  const mapData = useMemo(
    () => (factions.length > 0 ? buildFactionMapData(factions) : undefined),
    [factions],
  )

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
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border">
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="rounded-r-none"
            >
              <LayoutGrid className="mr-1 h-4 w-4" />
              Cards
            </Button>
            <Button
              variant={view === 'map' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('map')}
              className="rounded-l-none"
            >
              <GitFork className="mr-1 h-4 w-4" />
              Map
            </Button>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Faction
          </Button>
        </div>
      </div>

      {isLoading ? (
        <FactionSkeletons />
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load factions. Please try again.
        </div>
      ) : factions.length === 0 ? (
        <EmptyState />
      ) : view === 'list' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {factions.map((faction) => (
            <FactionCard
              key={faction.id}
              faction={faction}
              worldId={worldId}
            />
          ))}
        </div>
      ) : (
        <div className="h-[600px]">
          <FactionMap data={mapData} />
        </div>
      )}

      <CreateFactionDialog worldId={worldId} />
      {editingFaction && (
        <EditFactionDialog worldId={worldId} faction={editingFaction} />
      )}
    </div>
  )
}
