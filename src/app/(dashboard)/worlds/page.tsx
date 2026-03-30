'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Globe, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useWorldStore } from '@/stores/world-store'
import { useWorlds, useCreateWorld, useDeleteWorld } from '@/lib/hooks/use-worlds'
import { useOnboardingStore } from '@/stores/onboarding-store'
import { QuickstartWizard } from '@/components/onboarding/quickstart-wizard'

export default function WorldsPage() {
  const router = useRouter()
  const { data, isLoading } = useWorlds()
  const createWorld = useCreateWorld()
  const deleteWorld = useDeleteWorld()
  const { createDialogOpen, setCreateDialogOpen } = useWorldStore()
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState('')
  const [logline, setLogline] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const worlds = data?.data ?? []

  const showOnboarding = !isLoading && worlds.length === 0 && !hasCompletedOnboarding

  if (showOnboarding) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <QuickstartWizard />
      </div>
    )
  }

  function resetForm() {
    setName('')
    setDescription('')
    setGenre('')
    setLogline('')
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createWorld.mutate(
      { name: name.trim(), description: description.trim() || undefined, genre: genre.trim() || undefined, logline: logline.trim() || undefined },
      {
        onSuccess: (res) => {
          resetForm()
          setCreateDialogOpen(false)
          router.push(`/world/${res.data.id}/sources`)
        },
      },
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Page header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1
            className="text-h1"
            style={{ color: 'var(--od-text-primary)' }}
          >
            Story Worlds
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--od-text-secondary)' }}>
            Manage your narrative universes
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-[var(--od-teal-500)] font-medium text-[var(--od-bg-base)] hover:bg-[var(--od-teal-600)]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create World
        </Button>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border"
              style={{
                background: 'var(--od-bg-surface)',
                borderColor: 'var(--od-border-default)',
              }}
            >
              <Skeleton className="h-40 w-full rounded-none" />
              <div className="p-4">
                <Skeleton className="mb-2 h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && worlds.length === 0 && (
        <div
          className="flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center"
          style={{ borderColor: 'var(--od-border-emphasis)', background: 'var(--od-bg-raised)' }}
        >
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: 'rgba(20,184,166,0.1)' }}
          >
            <Globe className="h-7 w-7" style={{ color: 'var(--od-teal-400)' }} />
          </div>
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--od-text-secondary)' }}
          >
            No worlds yet
          </h2>
          <p className="mt-1 max-w-xs text-sm" style={{ color: 'var(--od-text-muted)' }}>
            Create your first story world to get started
          </p>
          <Button
            className="mt-5 bg-[var(--od-teal-500)] font-medium text-[var(--od-bg-base)] hover:bg-[var(--od-teal-600)]"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create World
          </Button>
        </div>
      )}

      {/* World grid — editorial poster cards */}
      {!isLoading && worlds.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {worlds.map((world) => (
            <Link
              key={world.id}
              href={`/world/${world.id}/beats`}
              className="group/card block"
            >
              <div
                className="card-interactive overflow-hidden rounded-xl border transition-all duration-200"
                style={{
                  background: 'var(--od-bg-surface)',
                  borderColor: 'var(--od-border-default)',
                  boxShadow: 'var(--od-shadow-card)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--od-border-teal)'
                  e.currentTarget.style.boxShadow = 'var(--od-glow-teal-md)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--od-border-default)'
                  e.currentTarget.style.boxShadow = 'var(--od-shadow-card)'
                }}
              >
                {/* Poster image area */}
                <div
                  className="relative flex h-36 items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, var(--od-bg-raised) 0%, var(--od-bg-surface) 100%)',
                    borderBottom: '1px solid var(--od-border-default)',
                  }}
                >
                  <Globe
                    className="h-10 w-10 transition-transform duration-200 group-hover/card:scale-110"
                    style={{ color: 'var(--od-text-disabled)' }}
                  />
                </div>

                {/* Card content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className="text-base font-semibold leading-tight"
                      style={{ fontFamily: 'var(--font-heading)', color: 'var(--od-text-primary)' }}
                    >
                      {world.name}
                    </h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0 opacity-0 transition-opacity group-hover/card:opacity-100"
                            onClick={(e) => e.preventDefault()}
                          />
                        }
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault()
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={(e) => {
                            e.preventDefault()
                            setPendingDeleteId(world.id)
                            setDeleteConfirmOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {world.description && (
                    <p
                      className="mt-1.5 line-clamp-2 text-sm leading-relaxed"
                      style={{ color: 'var(--od-text-secondary)' }}
                    >
                      {world.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    {world.genre && (
                      <Badge
                        variant="secondary"
                        className="border text-xs"
                        style={{
                          background: 'rgba(20,184,166,0.1)',
                          borderColor: 'rgba(20,184,166,0.2)',
                          color: 'var(--od-teal-300)',
                        }}
                      >
                        {world.genre}
                      </Badge>
                    )}
                    <span className="text-xs" style={{ color: 'var(--od-text-muted)' }}>
                      Updated{' '}
                      {new Date(world.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete world"
        description="Are you sure you want to delete this world? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (pendingDeleteId) {
            deleteWorld.mutate(pendingDeleteId)
            setPendingDeleteId(null)
          }
        }}
        onCancel={() => setPendingDeleteId(null)}
      />

      {/* Create dialog */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      >
        <DialogContent
          className="border sm:max-w-md"
          style={{
            background: 'var(--od-bg-surface)',
            borderColor: 'var(--od-border-default)',
            boxShadow: 'var(--od-shadow-elevated)',
          }}
        >
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>
                Create Story World
              </DialogTitle>
              <DialogDescription style={{ color: 'var(--od-text-secondary)' }}>
                Start a new narrative universe
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-xs font-medium" style={{ color: 'var(--od-text-secondary)' }}>
                  Name *
                </Label>
                <Input
                  id="name"
                  placeholder="My Story World"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border bg-[var(--od-bg-input)] text-[var(--od-text-primary)] placeholder:text-[var(--od-text-disabled)] focus-visible:ring-[var(--od-teal-500)]"
                  style={{ borderColor: 'var(--od-border-emphasis)' }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="genre" className="text-xs font-medium" style={{ color: 'var(--od-text-secondary)' }}>
                  Genre
                </Label>
                <Input
                  id="genre"
                  placeholder="Fantasy, Sci-Fi, Drama..."
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="border bg-[var(--od-bg-input)] text-[var(--od-text-primary)] placeholder:text-[var(--od-text-disabled)] focus-visible:ring-[var(--od-teal-500)]"
                  style={{ borderColor: 'var(--od-border-emphasis)' }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logline" className="text-xs font-medium" style={{ color: 'var(--od-text-secondary)' }}>
                  Logline
                </Label>
                <Input
                  id="logline"
                  placeholder="A one-sentence pitch"
                  value={logline}
                  onChange={(e) => setLogline(e.target.value)}
                  className="border bg-[var(--od-bg-input)] text-[var(--od-text-primary)] placeholder:text-[var(--od-text-disabled)] focus-visible:ring-[var(--od-teal-500)]"
                  style={{ borderColor: 'var(--od-border-emphasis)' }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-xs font-medium" style={{ color: 'var(--od-text-secondary)' }}>
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="What is this world about?"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border bg-[var(--od-bg-input)] text-[var(--od-text-primary)] placeholder:text-[var(--od-text-disabled)] focus-visible:ring-[var(--od-teal-500)]"
                  style={{ borderColor: 'var(--od-border-emphasis)' }}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="submit"
                disabled={!name.trim() || createWorld.isPending}
                className="bg-[var(--od-teal-500)] font-medium text-[var(--od-bg-base)] hover:bg-[var(--od-teal-600)]"
              >
                {createWorld.isPending ? 'Creating...' : 'Create World'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
