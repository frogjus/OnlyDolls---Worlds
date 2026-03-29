'use client'

import { useState } from 'react'
import Link from 'next/link'
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
import { useWorldStore } from '@/stores/world-store'
import { useWorlds, useCreateWorld, useDeleteWorld } from '@/lib/hooks/use-worlds'
import { useOnboardingStore } from '@/stores/onboarding-store'
import { QuickstartWizard } from '@/components/onboarding/quickstart-wizard'

export default function WorldsPage() {
  const { data, isLoading } = useWorlds()
  const createWorld = useCreateWorld()
  const deleteWorld = useDeleteWorld()
  const { createDialogOpen, setCreateDialogOpen } = useWorldStore()
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState('')
  const [logline, setLogline] = useState('')

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
        onSuccess: () => {
          resetForm()
          setCreateDialogOpen(false)
        },
      },
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Story Worlds</h1>
          <p className="text-muted-foreground">
            Manage your narrative universes
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create World
        </Button>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && worlds.length === 0 && (
        <Card className="border-dashed border-border/50">
          <CardHeader className="items-center py-12 text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-muted-foreground">
              No worlds yet
            </CardTitle>
            <CardDescription>
              Create your first story world to get started
            </CardDescription>
            <Button
              className="mt-4"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create World
            </Button>
          </CardHeader>
        </Card>
      )}

      {/* World grid */}
      {!isLoading && worlds.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {worlds.map((world) => (
            <Link
              key={world.id}
              href={`/world/${world.id}/beats`}
              className="group/link"
            >
              <Card className="border-border/50 transition-all duration-200 hover:border-primary/30 hover:shadow-[0_0_20px_-5px] hover:shadow-primary/10">
                <CardHeader>
                  <CardTitle>{world.name}</CardTitle>
                  <CardAction>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
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
                            // TODO: wire up edit dialog in a follow-up
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
                            deleteWorld.mutate(world.id)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardAction>
                  {world.description && (
                    <CardDescription className="line-clamp-2">
                      {world.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                  {world.genre && <Badge variant="secondary">{world.genre}</Badge>}
                  <span className="text-xs text-muted-foreground">
                    Updated{' '}
                    {new Date(world.updatedAt).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Story World</DialogTitle>
              <DialogDescription>
                Start a new narrative universe
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="My Story World"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  placeholder="Fantasy, Sci-Fi, Drama..."
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logline">Logline</Label>
                <Input
                  id="logline"
                  placeholder="A one-sentence pitch"
                  value={logline}
                  onChange={(e) => setLogline(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What is this world about?"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="submit"
                disabled={!name.trim() || createWorld.isPending}
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
