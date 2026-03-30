'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Layers,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react'

import type {
  Act,
  Sequence,
  CreateActPayload,
  UpdateActPayload,
  CreateSequencePayload,
  UpdateSequencePayload,
} from '@/types'
import {
  useActs,
  useCreateAct,
  useUpdateAct,
  useDeleteAct,
} from '@/lib/hooks/use-acts'
import {
  useSequences,
  useCreateSequence,
  useUpdateSequence,
  useDeleteSequence,
} from '@/lib/hooks/use-sequences'
import { useStructureStore } from '@/stores/structure-store'

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
// Create Act Dialog
// ---------------------------------------------------------------------------

function CreateActDialog({ worldId }: { worldId: string }) {
  const { createActDialogOpen, setCreateActDialogOpen } = useStructureStore()
  const create = useCreateAct(worldId)
  const [form, setForm] = useState<CreateActPayload>({ name: '' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    create.mutate(form, {
      onSuccess: () => {
        setCreateActDialogOpen(false)
        setForm({ name: '' })
      },
    })
  }

  return (
    <Dialog open={createActDialogOpen} onOpenChange={setCreateActDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Act</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-act-name">Name *</Label>
            <Input
              id="create-act-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Act 1 — Setup"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-act-position">Position</Label>
            <Input
              id="create-act-position"
              type="number"
              value={form.position ?? 0}
              onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-act-desc">Description</Label>
            <Textarea
              id="create-act-desc"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe this act..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateActDialogOpen(false)}
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
// Edit Act Dialog
// ---------------------------------------------------------------------------

function EditActDialog({
  worldId,
  act,
}: {
  worldId: string
  act: Act
}) {
  const { setEditingActId } = useStructureStore()
  const update = useUpdateAct(worldId)

  const [form, setForm] = useState<UpdateActPayload & { id: string }>({
    id: act.id,
    name: act.name,
    description: act.description ?? '',
    position: act.position,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate(form, { onSuccess: () => setEditingActId(null) })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && setEditingActId(null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Act</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-act-name">Name *</Label>
            <Input
              id="edit-act-name"
              value={form.name ?? ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-act-position">Position</Label>
            <Input
              id="edit-act-position"
              type="number"
              value={form.position ?? 0}
              onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-act-desc">Description</Label>
            <Textarea
              id="edit-act-desc"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingActId(null)}
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
// Create Sequence Dialog
// ---------------------------------------------------------------------------

function CreateSequenceDialog({ worldId }: { worldId: string }) {
  const { createSequenceDialogOpen, setCreateSequenceDialogOpen, selectedActId } =
    useStructureStore()
  const create = useCreateSequence(worldId)
  const [form, setForm] = useState<CreateSequencePayload>({ name: '' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    create.mutate(
      { ...form, actId: selectedActId ?? undefined },
      {
        onSuccess: () => {
          setCreateSequenceDialogOpen(false)
          setForm({ name: '' })
        },
      },
    )
  }

  return (
    <Dialog open={createSequenceDialogOpen} onOpenChange={setCreateSequenceDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Sequence</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-seq-name">Name *</Label>
            <Input
              id="create-seq-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Opening Sequence"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-seq-position">Position</Label>
            <Input
              id="create-seq-position"
              type="number"
              value={form.position ?? 0}
              onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-seq-desc">Description</Label>
            <Textarea
              id="create-seq-desc"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe this sequence..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateSequenceDialogOpen(false)}
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
// Edit Sequence Dialog
// ---------------------------------------------------------------------------

function EditSequenceDialog({
  worldId,
  sequence,
}: {
  worldId: string
  sequence: Sequence
}) {
  const { setEditingSequenceId } = useStructureStore()
  const update = useUpdateSequence(worldId)

  const [form, setForm] = useState<UpdateSequencePayload & { id: string }>({
    id: sequence.id,
    name: sequence.name,
    description: sequence.description ?? '',
    position: sequence.position,
    actId: sequence.actId,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate(form, { onSuccess: () => setEditingSequenceId(null) })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && setEditingSequenceId(null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Sequence</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-seq-name">Name *</Label>
            <Input
              id="edit-seq-name"
              value={form.name ?? ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-seq-position">Position</Label>
            <Input
              id="edit-seq-position"
              type="number"
              value={form.position ?? 0}
              onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-seq-desc">Description</Label>
            <Textarea
              id="edit-seq-desc"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingSequenceId(null)}
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
// Act Card
// ---------------------------------------------------------------------------

function ActCard({
  act,
  worldId,
  isSelected,
}: {
  act: Act
  worldId: string
  isSelected: boolean
}) {
  const { setEditingActId, setSelectedActId } = useStructureStore()
  const deleteAct = useDeleteAct(worldId)

  return (
    <Card
      className={`group cursor-pointer card-interactive border-[var(--od-border-default)] bg-card shadow-[var(--od-shadow-card)] ${
        isSelected ? 'ring-2 ring-primary shadow-[var(--od-glow-teal-sm)]' : ''
      }`}
      onClick={() => setSelectedActId(act.id)}
    >
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <div className="flex-1 min-w-0">
          <CardTitle className="font-heading text-base tracking-tight truncate">{act.name}</CardTitle>
          <Badge variant="outline" className="mt-1 text-xs">
            Position: {act.position}
          </Badge>
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
                setEditingActId(act.id)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                deleteAct.mutate(act.id)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {act.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {act.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No description</p>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Sequence Card
// ---------------------------------------------------------------------------

function SequenceCard({
  sequence,
  worldId,
}: {
  sequence: Sequence
  worldId: string
}) {
  const { setEditingSequenceId } = useStructureStore()
  const deleteSeq = useDeleteSequence(worldId)

  return (
    <Card className="group cursor-pointer card-interactive border-[var(--od-border-default)] bg-card shadow-[var(--od-shadow-card)]">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <div className="flex-1 min-w-0">
          <CardTitle className="font-heading text-sm tracking-tight truncate">{sequence.name}</CardTitle>
          <Badge variant="outline" className="mt-1 text-xs">
            Position: {sequence.position}
          </Badge>
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
                setEditingSequenceId(sequence.id)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                deleteSeq.mutate(sequence.id)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {sequence.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {sequence.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No description</p>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Loading Skeletons
// ---------------------------------------------------------------------------

function StructureSkeletons() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="border-[var(--od-border-default)] bg-card shadow-[var(--od-shadow-card)]">
          <CardHeader className="space-y-0 pb-2">
            <div className="relative h-4 w-32 overflow-hidden rounded bg-muted">
              <div className="absolute inset-0 shimmer-sweep" />
            </div>
            <div className="relative mt-1 h-5 w-20 overflow-hidden rounded-full bg-muted">
              <div className="absolute inset-0 shimmer-sweep" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative h-4 w-full overflow-hidden rounded bg-muted">
              <div className="absolute inset-0 shimmer-sweep" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty States
// ---------------------------------------------------------------------------

function EmptyActState() {
  const { setCreateActDialogOpen } = useStructureStore()
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--od-border-emphasis)] bg-card p-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted shadow-[var(--od-glow-teal-sm)]">
        <Layers className="h-8 w-8 text-primary/60" />
      </div>
      <h3 className="mt-4 font-heading text-base font-semibold tracking-tight text-foreground">No acts yet</h3>
      <p className="mt-1.5 text-sm text-[var(--od-text-secondary)]">
        Create acts to structure your narrative.
      </p>
      <Button className="mt-4 bg-primary text-primary-foreground hover:bg-[var(--od-teal-600)] glow-teal-hover transition-all" size="sm" onClick={() => setCreateActDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Act
      </Button>
    </div>
  )
}

function EmptySequenceState() {
  const { setCreateSequenceDialogOpen, selectedActId } = useStructureStore()
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--od-border-emphasis)] bg-card p-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted shadow-[var(--od-glow-teal-sm)]">
        <Layers className="h-8 w-8 text-primary/60" />
      </div>
      <h3 className="mt-4 font-heading text-base font-semibold tracking-tight text-foreground">
        {selectedActId ? 'No sequences in this act' : 'Select an act'}
      </h3>
      <p className="mt-1.5 text-sm text-[var(--od-text-secondary)]">
        {selectedActId
          ? 'Add sequences to break this act into smaller units.'
          : 'Click on an act to see its sequences.'}
      </p>
      {selectedActId && (
        <Button
          className="mt-4 bg-primary text-primary-foreground hover:bg-[var(--od-teal-600)] glow-teal-hover transition-all"
          size="sm"
          onClick={() => setCreateSequenceDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Sequence
        </Button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StructurePage() {
  const { id: worldId } = useParams<{ id: string }>()

  const { data: actsData, isLoading: actsLoading, error: actsError } = useActs(worldId)
  const { data: seqData, isLoading: seqLoading, error: seqError } = useSequences(worldId)

  const {
    selectedActId,
    editingActId,
    editingSequenceId,
    setCreateActDialogOpen,
    setCreateSequenceDialogOpen,
  } = useStructureStore()

  const acts = actsData?.data ?? []
  const allSequences = seqData?.data ?? []
  const filteredSequences = selectedActId
    ? allSequences.filter((s) => s.actId === selectedActId)
    : allSequences

  const editingAct = acts.find((a) => a.id === editingActId)
  const editingSequence = allSequences.find((s) => s.id === editingSequenceId)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-6 w-6 text-primary/60" />
          <div>
            <h1 className="text-h2 text-foreground">Structure</h1>
            <p className="mt-1 text-sm text-[var(--od-text-secondary)]">
              Acts and sequences that form your narrative structure.
            </p>
          </div>
        </div>
      </div>

      {/* Acts Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-h3 text-foreground">Acts</h2>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-[var(--od-teal-600)] glow-teal-hover transition-all" onClick={() => setCreateActDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Act
          </Button>
        </div>
        {actsLoading ? (
          <StructureSkeletons />
        ) : actsError ? (
          <div className="rounded-lg border border-[var(--od-border-emphasis)] bg-destructive/10 p-4 text-sm text-destructive/80">
            Failed to load acts. Please try again.
          </div>
        ) : acts.length === 0 ? (
          <EmptyActState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {acts.map((act) => (
              <ActCard
                key={act.id}
                act={act}
                worldId={worldId}
                isSelected={selectedActId === act.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sequences Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-h3 text-foreground">
            Sequences
            {selectedActId && (
              <span className="ml-2 text-sm font-normal text-[var(--od-text-secondary)]">
                (filtered by selected act)
              </span>
            )}
          </h2>
          {selectedActId && (
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-[var(--od-teal-600)] glow-teal-hover transition-all" onClick={() => setCreateSequenceDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Sequence
            </Button>
          )}
        </div>
        {seqLoading ? (
          <StructureSkeletons />
        ) : seqError ? (
          <div className="rounded-lg border border-[var(--od-border-emphasis)] bg-destructive/10 p-4 text-sm text-destructive/80">
            Failed to load sequences. Please try again.
          </div>
        ) : filteredSequences.length === 0 ? (
          <EmptySequenceState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSequences.map((seq) => (
              <SequenceCard key={seq.id} sequence={seq} worldId={worldId} />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateActDialog worldId={worldId} />
      <CreateSequenceDialog worldId={worldId} />
      {editingAct && <EditActDialog worldId={worldId} act={editingAct} />}
      {editingSequence && (
        <EditSequenceDialog worldId={worldId} sequence={editingSequence} />
      )}
    </div>
  )
}
