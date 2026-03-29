'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateWorld } from '@/lib/hooks/use-worlds'
import { useCreateCharacter } from '@/lib/hooks/use-characters'
import { useCreateBeat } from '@/lib/hooks/use-beats'
import { useOnboardingStore } from '@/stores/onboarding-store'

type Step = 1 | 2 | 3

const stepLabels: Record<Step, string> = {
  1: 'Create World',
  2: 'Add Character',
  3: 'First Beat',
}

export function QuickstartWizard() {
  const router = useRouter()
  const setCompleted = useOnboardingStore((s) => s.setCompleted)

  const [step, setStep] = useState<Step>(1)

  // Step 1 state
  const [worldName, setWorldName] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [genre, setGenre] = useState('')

  // Created record IDs
  const [worldId, setWorldId] = useState<string | null>(null)
  const [characterId, setCharacterId] = useState<string | null>(null)

  // Step 2 state
  const [charName, setCharName] = useState('')
  const [charRole, setCharRole] = useState('')

  // Step 3 state
  const [beatTitle, setBeatTitle] = useState('')
  const [beatDesc, setBeatDesc] = useState('')

  // Mutations
  const createWorld = useCreateWorld()
  const createCharacter = useCreateCharacter(worldId ?? '')
  const createBeat = useCreateBeat(worldId ?? '')

  function handleCreateWorld() {
    if (!worldName.trim()) return
    createWorld.mutate(
      {
        name: worldName.trim(),
        description: synopsis.trim() || undefined,
        genre: genre.trim() || undefined,
        logline: synopsis.trim() || undefined,
      },
      {
        onSuccess: (res) => {
          setWorldId(res.data.id)
          setStep(2)
        },
      },
    )
  }

  function handleCreateCharacter() {
    if (!charName.trim() || !worldId) return
    createCharacter.mutate(
      {
        name: charName.trim(),
        archetype: charRole.trim() || undefined,
      },
      {
        onSuccess: (res) => {
          setCharacterId(res.data.id)
          setStep(3)
        },
      },
    )
  }

  function handleCreateBeat() {
    if (!beatTitle.trim() || !worldId) return
    createBeat.mutate(
      {
        name: beatTitle.trim(),
        description: beatDesc.trim() || undefined,
        characterId: characterId ?? undefined,
      },
      {
        onSuccess: () => {
          setCompleted()
          router.push(`/world/${worldId}/beats`)
        },
      },
    )
  }

  const isPending =
    createWorld.isPending || createCharacter.isPending || createBeat.isPending

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Set up your first story</h1>
        <p className="mt-1 text-muted-foreground">
          Three quick steps to get your world running
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                s < step
                  ? 'bg-primary text-primary-foreground'
                  : s === step
                    ? 'border-2 border-primary text-primary'
                    : 'border border-border text-muted-foreground'
              }`}
            >
              {s < step ? <Check className="h-3.5 w-3.5" /> : s}
            </div>
            <span
              className={`hidden text-xs sm:block ${
                s === step ? 'font-medium' : 'text-muted-foreground'
              }`}
            >
              {stepLabels[s]}
            </span>
            {s < 3 && (
              <div
                className={`mx-1 hidden h-px flex-1 sm:block ${
                  s < step ? 'bg-primary' : 'bg-border'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Create World */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Name your story world</CardTitle>
            <CardDescription>
              Give your narrative universe a name and a short synopsis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleCreateWorld()
              }}
              className="grid gap-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="world-name">World name *</Label>
                <Input
                  id="world-name"
                  placeholder="e.g. The Iron Kingdoms"
                  value={worldName}
                  onChange={(e) => setWorldName(e.target.value)}
                  autoFocus
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
                <Label htmlFor="synopsis">Synopsis</Label>
                <Textarea
                  id="synopsis"
                  placeholder="A brief overview of your story..."
                  rows={3}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={!worldName.trim() || isPending}
                className="ml-auto"
              >
                {createWorld.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ChevronRight className="mr-2 h-4 w-4" />
                )}
                Next
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Add Character */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Add your first character</CardTitle>
            <CardDescription>
              Who drives the story? You can add more later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleCreateCharacter()
              }}
              className="grid gap-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="char-name">Character name *</Label>
                <Input
                  id="char-name"
                  placeholder="e.g. Kira Navarro"
                  value={charName}
                  onChange={(e) => setCharName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="char-role">Role / archetype</Label>
                <Input
                  id="char-role"
                  placeholder="Protagonist, Mentor, Antagonist..."
                  value={charRole}
                  onChange={(e) => setCharRole(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={!charName.trim() || isPending}
                className="ml-auto"
              >
                {createCharacter.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ChevronRight className="mr-2 h-4 w-4" />
                )}
                Next
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Create Beat */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Create your first beat</CardTitle>
            <CardDescription>
              A beat is a key story moment. Start with your opening.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleCreateBeat()
              }}
              className="grid gap-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="beat-title">Beat title *</Label>
                <Input
                  id="beat-title"
                  placeholder="e.g. Opening Image"
                  value={beatTitle}
                  onChange={(e) => setBeatTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="beat-desc">Description</Label>
                <Textarea
                  id="beat-desc"
                  placeholder="What happens in this beat?"
                  rows={3}
                  value={beatDesc}
                  onChange={(e) => setBeatDesc(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={!beatTitle.trim() || isPending}
                className="ml-auto"
              >
                {createBeat.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Finish
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
