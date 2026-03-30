'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  TrendingUp,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

import type { Arc, ArcPhase, CreateArcPayload, UpdateArcPayload, CreateArcPhasePayload, UpdateArcPhasePayload } from '@/types'
import {
  useArcs,
  useCreateArc,
  useUpdateArc,
  useDeleteArc,
} from '@/lib/hooks/use-arcs'
import {
  useArcPhases,
  useCreateArcPhase,
  useUpdateArcPhase,
  useDeleteArcPhase,
} from '@/lib/hooks/use-arc-phases'
import { useArcStore } from '@/stores/arc-store'
import { showSuccess, showError } from '@/lib/toast'

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

function CreateArcDialog({ worldId }: { worldId: string }) {
  const { createDialogOpen, setCreateDialogOpen } = useArcStore()
  const create = useCreateArc(worldId)
  const [form, setForm] = useState<CreateArcPayload>({ name: '' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    create.mutate(form, {
      onSuccess: () => {
        setCreateDialogOpen(false)
        setForm({ name: '' })
        showSuccess('Arc created')
      },
      onError: () => showError('Failed to create arc'),
    })
  }

  return (
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Arc</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-name">Name *</Label>
            <Input
              id="create-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Redemption Arc"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-arcType">Arc Type</Label>
            <Input
              id="create-arcType"
              value={form.arcType ?? ''}
              onChange={(e) => setForm({ ...form, arcType: e.target.value })}
              placeholder="e.g. character, thematic, relational"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-characterId">Character ID</Label>
            <Input
              id="create-characterId"
              value={form.characterId ?? ''}
              onChange={(e) => setForm({ ...form, characterId: e.target.value || undefined })}
              placeholder="Optional character ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-desc">Description</Label>
            <Textarea
              id="create-desc"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the arc's progression..."
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

function EditArcDialog({
  worldId,
  arc,
}: {
  worldId: string
  arc: Arc
}) {
  const { setEditingArcId } = useArcStore()
  const update = useUpdateArc(worldId)

  const [form, setForm] = useState<UpdateArcPayload & { id: string }>({
    id: arc.id,
    name: arc.name,
    arcType: arc.type ?? '',
    description: arc.description ?? '',
    characterId: arc.characterId ?? '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate(form, {
      onSuccess: () => {
        setEditingArcId(null)
        showSuccess('Arc updated')
      },
      onError: () => showError('Failed to update arc'),
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && setEditingArcId(null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Arc</DialogTitle>
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
            <Label htmlFor="edit-arcType">Arc Type</Label>
            <Input
              id="edit-arcType"
              value={form.arcType ?? ''}
              onChange={(e) => setForm({ ...form, arcType: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-characterId">Character ID</Label>
            <Input
              id="edit-characterId"
              value={form.characterId ?? ''}
              onChange={(e) => setForm({ ...form, characterId: e.target.value || null })}
            />
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
              onClick={() => setEditingArcId(null)}
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
// Arc Phase Section (expandable per-arc)
// ---------------------------------------------------------------------------

function ArcPhaseSection({ worldId, arcId }: { worldId: string; arcId: string }) {
  const { data, isLoading } = useArcPhases(worldId, arcId)
  const createPhase = useCreateArcPhase(worldId, arcId)
  const updatePhase = useUpdateArcPhase(worldId, arcId)
  const deletePhase = useDeleteArcPhase(worldId, arcId)
  const [showCreate, setShowCreate] = useState(false)
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateArcPhasePayload>({ name: '' })
  const [editForm, setEditForm] = useState<UpdateArcPhasePayload & { id: string }>({ id: '', name: '' })

  const phases = data?.data ?? []

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    createPhase.mutate(form, {
      onSuccess: () => {
        setShowCreate(false)
        setForm({ name: '' })
        showSuccess('Phase created')
      },
      onError: () => showError('Failed to create phase'),
    })
  }

  function startEdit(phase: ArcPhase) {
    setEditingPhaseId(phase.id)
    setEditForm({
      id: phase.id,
      name: phase.name,
      description: phase.description ?? '',
      position: phase.position,
      state: phase.state ?? '',
    })
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    updatePhase.mutate(editForm, {
      onSuccess: () => {
        setEditingPhaseId(null)
        showSuccess('Phase updated')
      },
      onError: () => showError('Failed to update phase'),
    })
  }

  if (isLoading) return <Skeleton className="h-8 w-full" />

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Phases ({phases.length})
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={() => setShowCreate(!showCreate)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Phase
        </Button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Phase name"
            className="h-7 text-xs"
            autoFocus
          />
          <Button type="submit" size="sm" className="h-7 text-xs" disabled={createPhase.isPending || !form.name.trim()}>
            Add
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowCreate(false)}>
            Cancel
          </Button>
        </form>
      )}

      {phases.length > 0 && (
        <ul className="space-y-1">
          {phases
            .sort((a, b) => a.position - b.position)
            .map((phase) => (
            <li key={phase.id} className="flex items-center gap-2 text-xs text-muted-foreground rounded px-1.5 py-1 hover:bg-accent/50 transition-colors">
              {editingPhaseId === phase.id ? (
                <form onSubmit={handleUpdate} className="flex flex-1 gap-2">
                  <Input
                    value={editForm.name ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="h-6 text-xs flex-1"
                    autoFocus
                  />
                  <Button type="submit" size="sm" className="h-6 text-xs" disabled={updatePhase.isPending}>
                    Save
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setEditingPhaseId(null)}>
                    Cancel
                  </Button>
                </form>
              ) : (
                <>
                  <span className="flex-1 truncate">{phase.name}</span>
                  {phase.state && (
                    <Badge variant="outline" className="text-[10px] h-4">{phase.state}</Badge>
                  )}
                  <button
                    type="button"
                    onClick={() => startEdit(phase)}
                    className="hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm('Delete this phase?')) return
                      deletePhase.mutate(phase.id, {
                        onSuccess: () => showSuccess('Phase deleted'),
                        onError: () => showError('Failed to delete phase'),
                      })
                    }}
                    className="hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Arc Card
// ---------------------------------------------------------------------------

function ArcCard({
  arc,
  worldId,
}: {
  arc: Arc
  worldId: string
}) {
  const { setEditingArcId } = useArcStore()
  const deleteArc = useDeleteArc(worldId)
  const [phasesExpanded, setPhasesExpanded] = useState(false)

  return (
    <Card className="group card-interactive cursor-pointer bg-card border-border">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <TrendingUp className="h-5 w-5 text-teal-300" />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base truncate">{arc.name}</CardTitle>
          {arc.type && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {arc.type}
            </Badge>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setEditingArcId(arc.id)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                if (!window.confirm('Delete this arc? This cannot be undone.')) return
                deleteArc.mutate(arc.id, {
                  onSuccess: () => showSuccess('Arc deleted'),
                  onError: () => showError('Failed to delete arc'),
                })
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-3">
        {arc.description ? (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {arc.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/60 italic">No description</p>
        )}
        <div className="border-t border-border pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setPhasesExpanded(!phasesExpanded)
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {phasesExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Phases
          </button>
          {phasesExpanded && (
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              <ArcPhaseSection worldId={worldId} arcId={arc.id} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Loading Skeletons
// ---------------------------------------------------------------------------

function ArcSkeletons() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="bg-card border-border">
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

function ArcsEmptyState() {
  const { setCreateDialogOpen } = useArcStore()
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted p-14 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card shadow-[0_0_25px_rgba(20,184,166,0.08)]">
        <TrendingUp className="h-10 w-10 text-teal-300/70" />
      </div>
      <h3 className="mt-6 font-heading text-lg font-semibold tracking-tight text-foreground">No arcs yet</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        Track character arcs, plot arcs, and thematic throughlines as they progress across your story.
      </p>
      <Button
        className="mt-6 bg-primary text-primary-foreground hover:bg-[#0d9488] shadow-sm hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all duration-200"
        onClick={() => setCreateDialogOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        New Arc
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ArcsPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const { data, isLoading, error } = useArcs(worldId)
  const {
    editingArcId,
    setCreateDialogOpen,
  } = useArcStore()

  const arcs = data?.data ?? []
  const editingArc = arcs.find((a) => a.id === editingArcId)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.015em] text-foreground">Arcs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {arcs.length > 0
              ? `${arcs.length} arc${arcs.length === 1 ? '' : 's'}`
              : 'Story arcs, phases, and structure template overlays.'}
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-[#0d9488] shadow-sm hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all duration-200"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Arc
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <ArcSkeletons />
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load arcs. Please try again.
        </div>
      ) : arcs.length === 0 ? (
        <ArcsEmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {arcs.map((arc) => (
            <ArcCard key={arc.id} arc={arc} worldId={worldId} />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateArcDialog worldId={worldId} />
      {editingArc && (
        <EditArcDialog worldId={worldId} arc={editingArc} />
      )}
    </div>
  )
}
