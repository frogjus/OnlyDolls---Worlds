'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useWorlds, useCreateWorld } from '@/lib/hooks/use-worlds'

export default function WorldsPage() {
  const router = useRouter()
  const { data, isLoading } = useWorlds()
  const createWorld = useCreateWorld()
  const [name, setName] = useState('')

  const worlds = data?.data ?? []

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createWorld.mutate(
      { name: name.trim() },
      {
        onSuccess: (res) => {
          setName('')
          router.push(`/world/${res.data.id}/sources`)
        },
      },
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold tracking-tight">OnlyDolls</h1>
      <p className="mt-1 text-muted-foreground">Story world architecture platform</p>

      <form onSubmit={handleCreate} className="mt-8 flex gap-2">
        <Input
          placeholder="New world name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={!name.trim() || createWorld.isPending}>
          <Plus className="mr-1 h-4 w-4" />
          Create
        </Button>
      </form>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading...</p>}

      {!isLoading && worlds.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">No worlds yet. Create one above.</p>
      )}

      {worlds.length > 0 && (
        <ul className="mt-6 space-y-2">
          {worlds.map((world) => (
            <li key={world.id}>
              <Link
                href={`/world/${world.id}/sources`}
                className="block rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <span className="font-medium">{world.name}</span>
                {world.description && (
                  <span className="ml-2 text-sm text-muted-foreground">{world.description}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
