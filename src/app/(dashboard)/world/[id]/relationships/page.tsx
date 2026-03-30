'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Heart,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react'

import type { Relationship, Character, CreateRelationshipPayload, UpdateRelationshipPayload } from '@/types'
import {
  useRelationships,
  useCreateRelationship,
  useUpdateRelationship,
  useDeleteRelationship,
} from '@/lib/hooks/use-relationships'
import { useCharacters } from '@/lib/hooks/use-characters'
import { useRelationshipStore } from '@/stores/relationship-store'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// ---------------------------------------------------------------------------
// Create Dialog
// ---------------------------------------------------------------------------

function CreateRelationshipDialog({ worldId, characters }: { worldId: string; characters: Character[] }) {
  const { createDialogOpen, setCreateDialogOpen } = useRelationshipStore()
  const create = useCreateRelationship(worldId)
  const [form, setForm] = useState<CreateRelationshipPayload>({
    type: '',
    characterAId: '',
    characterBId: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.type.trim() || !form.characterAId || !form.characterBId) return
    create.mutate(form, {
      onSuccess: () => {
        setCreateDialogOpen(false)
        setForm({ type: '', characterAId: '', characterBId: '' })
        showSuccess('Relationship created')
      },
      onError: () => showError('Failed to create relationship'),
    })
  }

  return (
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Relationship</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-type">Type *</Label>
            <Input
              id="create-type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              placeholder="e.g. ally, enemy, lover, mentor"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Source Character *</Label>
            <Select
              value={form.characterAId}
              onValueChange={(val) => val && setForm({ ...form, characterAId: val })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a character" />
              </SelectTrigger>
              <SelectContent>
                {characters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Target Character *</Label>
            <Select
              value={form.characterBId}
              onValueChange={(val) => val && setForm({ ...form, characterBId: val })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a character" />
              </SelectTrigger>
              <SelectContent>
                {characters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-intensity">Strength (0-10)</Label>
            <Input
              id="create-intensity"
              type="number"
              min={0}
              max={10}
              value={form.intensity !== undefined ? form.intensity * 10 : 5}
              onChange={(e) =>
                setForm({ ...form, intensity: Number(e.target.value) / 10 })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-desc">Description</Label>
            <Textarea
              id="create-desc"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe this relationship..."
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
            <Button
              type="submit"
              disabled={
                create.isPending ||
                !form.type.trim() ||
                !form.characterAId ||
                !form.characterBId
              }
            >
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

function EditRelationshipDialog({
  worldId,
  relationship,
}: {
  worldId: string
  relationship: Relationship
}) {
  const { setEditingRelationshipId } = useRelationshipStore()
  const update = useUpdateRelationship(worldId)

  const [form, setForm] = useState<UpdateRelationshipPayload & { id: string }>({
    id: relationship.id,
    type: relationship.type,
    description: relationship.description ?? '',
    intensity: relationship.intensity ?? 0.5,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate(form, {
      onSuccess: () => {
        setEditingRelationshipId(null)
        showSuccess('Relationship updated')
      },
      onError: () => showError('Failed to update relationship'),
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && setEditingRelationshipId(null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Relationship</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-type">Type *</Label>
            <Input
              id="edit-type"
              value={form.type ?? ''}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-intensity">Strength (0-10)</Label>
            <Input
              id="edit-intensity"
              type="number"
              min={0}
              max={10}
              value={Math.round((form.intensity ?? 0.5) * 10)}
              onChange={(e) =>
                setForm({ ...form, intensity: Number(e.target.value) / 10 })
              }
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
              onClick={() => setEditingRelationshipId(null)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={update.isPending || !form.type?.trim()}>
              {update.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Relationship Card
// ---------------------------------------------------------------------------

function RelationshipCard({
  relationship,
  worldId,
  characters,
}: {
  relationship: Relationship
  worldId: string
  characters: Character[]
}) {
  const { setEditingRelationshipId } = useRelationshipStore()
  const deleteRel = useDeleteRelationship(worldId)

  const strengthDisplay = Math.round((relationship.intensity ?? 0.5) * 10)
  const char1Name = characters.find((c) => c.id === relationship.character1Id)?.name ?? 'Unknown'
  const char2Name = characters.find((c) => c.id === relationship.character2Id)?.name ?? 'Unknown'

  return (
    <Card className="group card-interactive cursor-pointer bg-card border-border">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <Heart className="h-5 w-5 text-rose-400" />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base truncate">
            {char1Name} &harr; {char2Name}
          </CardTitle>
          <div className="flex items-center gap-2 mt-1">
            {relationship.type && (
              <Badge variant="secondary" className="text-xs">
                {relationship.type}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              Strength: {strengthDisplay}/10
            </span>
          </div>
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
                setEditingRelationshipId(relationship.id)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                if (!window.confirm('Delete this relationship? This cannot be undone.')) return
                deleteRel.mutate(relationship.id, {
                  onSuccess: () => showSuccess('Relationship deleted'),
                  onError: () => showError('Failed to delete relationship'),
                })
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {relationship.description ? (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {relationship.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/60 italic">No description</p>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Loading Skeletons
// ---------------------------------------------------------------------------

function RelationshipSkeletons() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="bg-card border-border">
          <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-24" />
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

function RelationshipsEmptyState() {
  const { setCreateDialogOpen } = useRelationshipStore()
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted p-14 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card shadow-[0_0_25px_rgba(20,184,166,0.08)]">
        <Heart className="h-10 w-10 text-teal-300/70" />
      </div>
      <h3 className="mt-6 font-heading text-lg font-semibold tracking-tight text-foreground">No relationships mapped yet</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        Add characters first, then map their connections.
      </p>
      <Button
        className="mt-6 bg-primary text-primary-foreground hover:bg-[#0d9488] shadow-sm hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all duration-200"
        onClick={() => setCreateDialogOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        New Relationship
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RelationshipsPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const { data, isLoading, error } = useRelationships(worldId)
  const { data: charsData } = useCharacters(worldId)
  const {
    editingRelationshipId,
    setCreateDialogOpen,
  } = useRelationshipStore()

  const relationships = data?.data ?? []
  const characters = charsData?.data ?? []
  const editingRelationship = relationships.find((r) => r.id === editingRelationshipId)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.015em] text-foreground">Relationships</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {relationships.length > 0
              ? `${relationships.length} relationship${relationships.length === 1 ? '' : 's'}`
              : 'Character connections and dynamics.'}
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-[#0d9488] shadow-sm hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all duration-200"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Relationship
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <RelationshipSkeletons />
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load relationships. Please try again.
        </div>
      ) : relationships.length === 0 ? (
        <RelationshipsEmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {relationships.map((rel) => (
            <RelationshipCard key={rel.id} relationship={rel} worldId={worldId} characters={characters} />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateRelationshipDialog worldId={worldId} characters={characters} />
      {editingRelationship && (
        <EditRelationshipDialog worldId={worldId} relationship={editingRelationship} />
      )}
    </div>
  )
}
