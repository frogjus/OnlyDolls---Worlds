'use client'

import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface StoryWorld {
  id: string
  name: string
  description: string | null
  genre: string | null
  logline: string | null
}

interface ApiResponse<T> {
  data: T
  error?: string
}

interface UpdateWorldPayload {
  name: string
  description: string
  genre: string
  logline: string
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export default function SettingsPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState('')
  const [logline, setLogline] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['worlds', worldId],
    queryFn: () => fetchJson<ApiResponse<StoryWorld>>(`/api/worlds/${worldId}`),
    enabled: !!worldId,
  })

  const world = data?.data

  useEffect(() => {
    if (world) {
      setName(world.name)
      setDescription(world.description ?? '')
      setGenre(world.genre ?? '')
      setLogline(world.logline ?? '')
    }
  }, [world])

  const { mutate: saveWorld, isPending } = useMutation({
    mutationFn: (payload: UpdateWorldPayload) =>
      fetchJson<ApiResponse<StoryWorld>>(`/api/worlds/${worldId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worlds'] })
      setSuccessMsg('World settings saved.')
      setTimeout(() => setSuccessMsg(''), 3000)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    saveWorld({ name, description, genre, logline })
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              World Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-24" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            World Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="logline">Logline</Label>
              <Input
                id="logline"
                value={logline}
                onChange={(e) => setLogline(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isPending || !name.trim()}>
                {isPending ? 'Saving…' : 'Save'}
              </Button>
              {successMsg && (
                <span className="text-sm text-green-600">{successMsg}</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
