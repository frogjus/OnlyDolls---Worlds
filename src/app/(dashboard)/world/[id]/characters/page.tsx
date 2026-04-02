'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Users,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  GitGraph,
} from 'lucide-react'

import type { Character, CreateCharacterPayload, UpdateCharacterPayload } from '@/types'
import {
  useCharacters,
  useCreateCharacter,
  useUpdateCharacter,
  useDeleteCharacter,
} from '@/lib/hooks/use-characters'
import { useRelationships } from '@/lib/hooks/use-relationships'
import { useFactions } from '@/lib/hooks/use-factions'
import { useCharacterStore } from '@/stores/character-store'
import { showSuccess, showError } from '@/lib/toast'
import {
  CharacterGraph,
  type CharacterGraphData,
} from '@/components/visualizations/character-graph'

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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// ---------------------------------------------------------------------------
// Create Dialog
// ---------------------------------------------------------------------------

function CreateCharacterDialog({ worldId }: { worldId: string }) {
  const { createDialogOpen, setCreateDialogOpen } = useCharacterStore()
  const create = useCreateCharacter(worldId)
  const [form, setForm] = useState<CreateCharacterPayload>({ name: '' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    create.mutate(form, {
      onSuccess: () => {
        setCreateDialogOpen(false)
        setForm({ name: '' })
        showSuccess('Character created')
      },
      onError: () => showError('Failed to create character'),
    })
  }

  return (
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Character</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-name">Name *</Label>
            <Input
              id="create-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Elara Voss"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-archetype">Archetype</Label>
            <Input
              id="create-archetype"
              value={form.archetype ?? ''}
              onChange={(e) => setForm({ ...form, archetype: e.target.value })}
              placeholder="e.g. Mentor, Trickster, Herald"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-desc">Description</Label>
            <Textarea
              id="create-desc"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="A brief summary of who this character is..."
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
// Edit Sheet
// ---------------------------------------------------------------------------

function EditCharacterSheet({
  worldId,
  character,
}: {
  worldId: string
  character: Character
}) {
  const { setEditingCharacterId } = useCharacterStore()
  const update = useUpdateCharacter(worldId)

  const [form, setForm] = useState<UpdateCharacterPayload & { id: string }>({
    id: character.id,
    name: character.name,
    archetype: character.archetype ?? '',
    description: character.description ?? '',
    backstory: character.backstory ?? '',
    physicalDesc: character.physicalDesc ?? '',
    psychProfile: character.psychProfile ?? '',
    aliases: character.aliases ?? [],
  })

  const [aliasInput, setAliasInput] = useState('')

  function addAlias() {
    const trimmed = aliasInput.trim()
    if (!trimmed) return
    setForm({ ...form, aliases: [...(form.aliases ?? []), trimmed] })
    setAliasInput('')
  }

  function removeAlias(idx: number) {
    setForm({ ...form, aliases: (form.aliases ?? []).filter((_, i) => i !== idx) })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate(form, {
      onSuccess: () => {
        setEditingCharacterId(null)
        showSuccess('Character updated')
      },
      onError: () => showError('Failed to update character'),
    })
  }

  return (
    <Sheet open onOpenChange={(open) => !open && setEditingCharacterId(null)}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Character</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              value={form.name ?? ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-archetype">Archetype</Label>
            <Input
              id="edit-archetype"
              value={form.archetype ?? ''}
              onChange={(e) => setForm({ ...form, archetype: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Aliases</Label>
            <div className="flex gap-2">
              <Input
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                placeholder="Add alias"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addAlias()
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addAlias}>
                Add
              </Button>
            </div>
            {(form.aliases ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {(form.aliases ?? []).map((alias, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {alias}
                    <button type="button" onClick={() => removeAlias(i)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
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
          <div className="space-y-2">
            <Label htmlFor="edit-backstory">Backstory</Label>
            <Textarea
              id="edit-backstory"
              value={form.backstory ?? ''}
              onChange={(e) => setForm({ ...form, backstory: e.target.value })}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-physical">Physical Description</Label>
            <Textarea
              id="edit-physical"
              value={form.physicalDesc ?? ''}
              onChange={(e) => setForm({ ...form, physicalDesc: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-psych">Psychological Profile</Label>
            <Textarea
              id="edit-psych"
              value={form.psychProfile ?? ''}
              onChange={(e) => setForm({ ...form, psychProfile: e.target.value })}
              rows={3}
            />
          </div>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingCharacterId(null)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={update.isPending || !form.name?.trim()}>
              {update.isPending ? 'Saving...' : 'Save'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// Analysis helper
// ---------------------------------------------------------------------------

function getAnalysis(entity: { metadata?: unknown }): Record<string, unknown> | null {
  const meta = entity.metadata as Record<string, unknown> | null
  if (!meta || typeof meta !== 'object') return null
  const analysis = meta.analysis as Record<string, unknown> | null
  return analysis && typeof analysis === 'object' ? analysis : null
}

// ---------------------------------------------------------------------------
// Character Card
// ---------------------------------------------------------------------------

function CharacterCard({
  character,
  worldId,
}: {
  character: Character
  worldId: string
}) {
  const { setEditingCharacterId } = useCharacterStore()
  const deleteChar = useDeleteCharacter(worldId)
  const [expanded, setExpanded] = useState(false)

  const analysis = getAnalysis(character)

  const initials = character.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()

  return (
    <Card className="group bg-card border-border">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/30">
          <AvatarFallback className="bg-muted text-teal-300 text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base truncate">{character.name}</CardTitle>
          {character.archetype && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {character.archetype}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {analysis && (
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          )}
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
                  setEditingCharacterId(character.id)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  if (!window.confirm('Delete this character? This cannot be undone.')) return
                  deleteChar.mutate(character.id, {
                    onSuccess: () => showSuccess('Character deleted'),
                    onError: () => showError('Failed to delete character'),
                  })
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {character.description ? (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {character.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/60 italic">No description</p>
        )}
        {character.aliases.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {character.aliases.map((alias) => (
              <Badge key={alias} variant="outline" className="text-xs">
                {alias}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      {expanded && analysis && (
        <div className="border-t border-border px-6 pb-4 pt-3 space-y-4">
          {!!analysis.psychologicalProfile && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Psychological Profile</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{analysis.psychologicalProfile as string}</p>
            </div>
          )}
          {!!analysis.motivation && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Motivation</h4>
              <div className="space-y-2">
                <div className="border-l-2 border-primary/30 pl-3">
                  <span className="text-xs font-medium text-muted-foreground">Surface</span>
                  <p className="text-sm text-muted-foreground">{(analysis.motivation as { surface?: string }).surface}</p>
                </div>
                <div className="border-l-2 border-primary/30 pl-3">
                  <span className="text-xs font-medium text-muted-foreground">Deep</span>
                  <p className="text-sm text-muted-foreground">{(analysis.motivation as { deep?: string }).deep}</p>
                </div>
              </div>
            </div>
          )}
          {!!analysis.arcTrajectory && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Arc Trajectory</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{analysis.arcTrajectory as string}</p>
            </div>
          )}
          {Array.isArray(analysis.contradictions) && (analysis.contradictions as string[]).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Contradictions</h4>
              <ul className="list-disc list-inside space-y-1">
                {(analysis.contradictions as string[]).map((c, i) => (
                  <li key={i} className="text-sm text-muted-foreground">{c}</li>
                ))}
              </ul>
            </div>
          )}
          {!!analysis.voicePattern && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Voice Pattern</h4>
              <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">{analysis.voicePattern as string}</p>
            </div>
          )}
          {Array.isArray(analysis.keyScenes) && (analysis.keyScenes as string[]).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Key Scenes</h4>
              <ul className="list-disc list-inside space-y-1">
                {(analysis.keyScenes as string[]).map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground">{s}</li>
                ))}
              </ul>
            </div>
          )}
          {!!analysis.thematicRole && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Thematic Role</h4>
              <p className="text-sm text-muted-foreground">{analysis.thematicRole as string}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Loading Skeletons
// ---------------------------------------------------------------------------

function CharacterSkeletons() {
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

function EmptyState() {
  const { setCreateDialogOpen } = useCharacterStore()
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted p-14 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card shadow-[0_0_25px_rgba(20,184,166,0.08)]">
        <Users className="h-10 w-10 text-teal-300/70" />
      </div>
      <h3 className="mt-6 font-heading text-lg font-semibold tracking-tight text-foreground">No characters yet</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        Create your first character to start building your story world.
      </p>
      <Button
        className="mt-6 bg-primary text-primary-foreground hover:bg-[#0d9488] shadow-sm hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all duration-200"
        onClick={() => setCreateDialogOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        New Character
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CharactersPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const { data, isLoading, error } = useCharacters(worldId)
  const { data: relsData } = useRelationships(worldId)
  const { data: factionsData } = useFactions(worldId)
  const {
    editingCharacterId,
    setCreateDialogOpen,
  } = useCharacterStore()
  const [graphExpanded, setGraphExpanded] = useState(false)

  const characters = data?.data ?? []
  const relationships = relsData?.data ?? []
  const factions = factionsData?.data ?? []
  const editingCharacter = characters.find((c) => c.id === editingCharacterId)

  const graphData = useMemo<CharacterGraphData | null>(() => {
    if (characters.length < 2 || relationships.length === 0) return null
    return {
      characters: characters.map((c) => ({
        id: c.id,
        name: c.name,
        importance: 0.5,
        traits: Array.isArray(c.traits) ? (c.traits as string[]) : [],
        status: 'alive' as const,
      })),
      relationships: relationships.map((r) => ({
        id: r.id,
        sourceId: r.character1Id,
        targetId: r.character2Id,
        type: (r.type as 'family' | 'romantic' | 'friendship' | 'rivalry' | 'professional' | 'mentor' | 'custom') ?? 'custom',
        weight: (r.intensity ?? 50) / 100,
        sentiment: 0,
        bidirectional: r.bidirectional ?? false,
      })),
      factions: factions.map((f) => ({
        id: f.id,
        name: f.name,
        color: '#6366f1',
      })),
    }
  }, [characters, relationships, factions])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.015em] text-foreground">Characters</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {characters.length > 0
              ? `${characters.length} character${characters.length === 1 ? '' : 's'}`
              : 'Character profiles, relationships, and voice analysis.'}
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-[#0d9488] shadow-sm hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all duration-200"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Character
        </Button>
      </div>

      {/* Relationship Graph (collapsible) */}
      {graphData && (
        <div className="rounded-lg border border-border bg-muted">
          <button
            onClick={() => setGraphExpanded(!graphExpanded)}
            className="flex w-full items-center gap-2 p-4 text-left hover:bg-accent/50 transition-colors"
          >
            {graphExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <GitGraph className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Relationship Map</span>
            <span className="text-xs text-muted-foreground ml-1">
              ({relationships.length} relationship{relationships.length === 1 ? '' : 's'})
            </span>
          </button>
          {graphExpanded && (
            <div className="h-[500px] border-t border-border">
              <CharacterGraph data={graphData} readOnly />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <CharacterSkeletons />
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load characters. Please try again.
        </div>
      ) : characters.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              worldId={worldId}
            />
          ))}
        </div>
      )}

      {/* Dialogs / Sheets */}
      <CreateCharacterDialog worldId={worldId} />
      {editingCharacter && (
        <EditCharacterSheet worldId={worldId} character={editingCharacter} />
      )}
    </div>
  )
}
