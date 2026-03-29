'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCreateWorld } from '@/lib/hooks/use-worlds'
import { useOnboardingStore } from '@/stores/onboarding-store'

export function QuickstartWizard() {
  const router = useRouter()
  const setCompleted = useOnboardingStore((s) => s.setCompleted)
  const createWorld = useCreateWorld()

  const [worldName, setWorldName] = useState('')

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!worldName.trim()) return
    createWorld.mutate(
      { name: worldName.trim() },
      {
        onSuccess: (res) => {
          setCompleted()
          router.push(`/world/${res.data.id}/sources`)
        },
      },
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <Card className="border-border/50 shadow-[0_0_40px_-8px] shadow-primary/10">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Name your world</CardTitle>
          <CardDescription>
            You can add characters, beats, and details later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            {createWorld.error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {createWorld.error.message || 'Something went wrong.'}
              </div>
            )}
            <Input
              placeholder="e.g. The Iron Kingdoms"
              value={worldName}
              onChange={(e) => setWorldName(e.target.value)}
              autoFocus
              required
            />
            <Button
              type="submit"
              disabled={!worldName.trim() || createWorld.isPending}
              className="w-full"
            >
              {createWorld.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create World'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
