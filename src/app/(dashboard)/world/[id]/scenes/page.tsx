'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Film,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react'

import type { Scene, CreateScenePayload, UpdateScenePayload } from '@/types'
import {
  useScenes,
  useCreateScene,
  useUpdateScene,
  useDeleteScene,
} from '@/lib/hooks/use-scenes'
import { useSceneStore } from '@/stores/scene-store'
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
import { Skeleton } from '@/components/ui/skeleton'

// ---------------------------------------------------------------------------
// Create Dialog
// ---------------------------------------------------------------------------

function CreateSceneDialog({ worldId }: { worldId: string }) {
  const { createDialogOpen, setCreateDialogOpen } = useSceneStore()
  const create = useCreateScene(worldId)
  const [form, setForm] = useState<CreateScenePayload>({ name: '' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    create.mutate(form, {
      onSuccess: () => {
        setCreateDialogOpen(false)
        setForm({ name: '' })
        showSuccess('Scene created')
      },
      onError: () => showError('Failed to create scene'),
    })
  }

  return (
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Scene</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-name">Name *</Label>
            <Input
              id="create-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. The Confrontation"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-purpose">Purpose</Label>
            <Input
              id="create-purpose"
              value={form.purpose ?? ''}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              placeholder="e.g. exposition, climax, resolution"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-tone">Tone</Label>
            <Input
              id="create-tone"
              value={form.tone ?? ''}
              onChange={(e) => setForm({ ...form, tone: e.target.value })}
              placeholder="e.g. tense, hopeful, melancholic"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-summary">Summary</Label>
            <Textarea
              id="create-summary"
              value={form.summary ?? ''}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="What happens in this scene..."
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

function EditSceneDialog({
  worldId,
  scene,
}: {
  worldId: string
  scene: Scene
}) {
  const { setEditingSceneId } = useSceneStore()
  const update = useUpdateScene(worldId)

  const [form, setForm] = useState<UpdateScenePayload & { id: string }>({
    id: scene.id,
    name: scene.name,
    summary: scene.summary ?? '',
    purpose: scene.purpose ?? '',
    tone: scene.tone ?? '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate(form, {
      onSuccess: () => {
        setEditingSceneId(null)
        showSuccess('Scene updated')
      },
      onError: () => showError('Failed to update scene'),
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && setEditingSceneId(null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Scene</DialogTitle>
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
            <Label htmlFor="edit-purpose">Purpose</Label>
            <Input
              id="edit-purpose"
              value={form.purpose ?? ''}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              placeholder="e.g. exposition, climax, resolution"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-tone">Tone</Label>
            <Input
              id="edit-tone"
              value={form.tone ?? ''}
              onChange={(e) => setForm({ ...form, tone: e.target.value })}
              placeholder="e.g. tense, hopeful, melancholic"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-summary">Summary</Label>
            <Textarea
              id="edit-summary"
              value={form.summary ?? ''}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingSceneId(null)}
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
// Scene Card
// ---------------------------------------------------------------------------

function SceneCard({
  scene,
  worldId,
}: {
  scene: Scene
  worldId: string
}) {
  const { setEditingSceneId, setSelectedSceneId } = useSceneStore()
  const deleteScene = useDeleteScene(worldId)

  return (
    <Card
      className="group card-interactive cursor-pointer bg-card border-border"
      onClick={() => setSelectedSceneId(scene.id)}
    >
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <Film className="h-5 w-5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base truncate">{scene.name}</CardTitle>
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
                setEditingSceneId(scene.id)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                if (!window.confirm('Delete this scene? This cannot be undone.')) return
                deleteScene.mutate(scene.id, {
                  onSuccess: () => showSuccess('Scene deleted'),
                  onError: () => showError('Failed to delete scene'),
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
        {scene.summary ? (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {scene.summary}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/60 italic">No summary</p>
        )}
        <div className="mt-2 space-y-1">
          {scene.purpose && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">Purpose:</span> {scene.purpose}
            </p>
          )}
          {scene.tone && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">Tone:</span> {scene.tone}
            </p>
          )}
          {scene.polarity && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">Polarity:</span> {scene.polarity}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Loading Skeletons
// ---------------------------------------------------------------------------

function SceneSkeletons() {
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

function ScenesEmptyState() {
  const { setCreateDialogOpen } = useSceneStore()
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted p-14 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card shadow-[0_0_25px_rgba(20,184,166,0.08)]">
        <Film className="h-10 w-10 text-teal-300/70" />
      </div>
      <h3 className="mt-6 font-heading text-lg font-semibold tracking-tight text-foreground">No scenes yet</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        Structure your narrative into scenes with purpose, tone, and value changes. Each scene tracks a net shift in your story.
      </p>
      <Button
        className="mt-6 bg-primary text-primary-foreground hover:bg-[#0d9488] shadow-sm hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all duration-200"
        onClick={() => setCreateDialogOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        New Scene
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ScenesPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const { data, isLoading, error } = useScenes(worldId)
  const {
    editingSceneId,
    setCreateDialogOpen,
  } = useSceneStore()

  const scenes = data?.data ?? []
  const editingScene = scenes.find((s) => s.id === editingSceneId)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.015em] text-foreground">Scenes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {scenes.length > 0
              ? `${scenes.length} scene${scenes.length === 1 ? '' : 's'}`
              : 'Scenes with purpose, tone, and value changes.'}
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-[#0d9488] shadow-sm hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all duration-200"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Scene
        </Button>
      </div>

      {isLoading ? (
        <SceneSkeletons />
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load scenes. Please try again.
        </div>
      ) : scenes.length === 0 ? (
        <ScenesEmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenes.map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              worldId={worldId}
            />
          ))}
        </div>
      )}

      <CreateSceneDialog worldId={worldId} />
      {editingScene && (
        <EditSceneDialog worldId={worldId} scene={editingScene} />
      )}
    </div>
  )
}
