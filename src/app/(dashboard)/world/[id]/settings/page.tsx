'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings } from 'lucide-react'

import type { ApiResponse, StoryWorld, UpdateWorldPayload } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error ?? 'Request failed')
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WorldSettingsPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: worldData, isLoading, error } = useQuery({
    queryKey: ['world', worldId],
    queryFn: () => apiFetch<ApiResponse<StoryWorld>>(`/api/worlds/${worldId}`),
    enabled: !!worldId,
  })

  const world = worldData?.data

  const [form, setForm] = useState<UpdateWorldPayload>({
    name: '',
    description: '',
    genre: '',
    logline: '',
  })
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (world) {
      setForm({
        name: world.name,
        description: world.description ?? '',
        genre: world.genre ?? '',
        logline: world.logline ?? '',
      })
    }
  }, [world])

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateWorldPayload) =>
      apiFetch<ApiResponse<StoryWorld>>(`/api/worlds/${worldId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['world', worldId] })
      qc.invalidateQueries({ queryKey: ['worlds'] })
      setSuccessMsg('Settings saved successfully.')
      setTimeout(() => setSuccessMsg(''), 3000)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateMutation.mutate(form)
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-in fade-in duration-300">
        <div className="relative h-8 w-48 overflow-hidden rounded bg-muted">
          <div className="absolute inset-0 shimmer-sweep" />
        </div>
        <div className="relative h-64 overflow-hidden rounded-xl border border-[var(--od-border-default)] bg-card">
          <div className="absolute inset-0 shimmer-sweep" />
        </div>
      </div>
    )
  }

  if (error || !world) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-[var(--od-border-emphasis)] bg-destructive/10 p-4 text-sm text-destructive/80">
          Failed to load world settings. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary/60" />
        <h1 className="text-h2 text-foreground">Settings</h1>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>World Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-name">Name *</Label>
              <Input
                id="settings-name"
                value={form.name ?? ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-genre">Genre</Label>
              <Input
                id="settings-genre"
                value={form.genre ?? ''}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                placeholder="e.g. Fantasy, Sci-Fi, Thriller"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-logline">Logline</Label>
              <Input
                id="settings-logline"
                value={form.logline ?? ''}
                onChange={(e) => setForm({ ...form, logline: e.target.value })}
                placeholder="A one-sentence summary of your story..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-desc">Description</Label>
              <Textarea
                id="settings-desc"
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="A detailed description of your story world..."
                rows={4}
              />
            </div>

            {successMsg && (
              <div className="rounded-lg border border-[var(--od-border-teal)] bg-primary/10 p-3 text-sm text-[var(--od-teal-300)]">
                {successMsg}
              </div>
            )}

            {updateMutation.isError && (
              <div className="rounded-lg border border-[var(--od-border-emphasis)] bg-destructive/10 p-3 text-sm text-destructive/80">
                Failed to save settings. Please try again.
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateMutation.isPending || !form.name?.trim()}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
