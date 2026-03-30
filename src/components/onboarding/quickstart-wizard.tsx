'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateWorld } from '@/lib/hooks/use-worlds'
import { useOnboardingStore } from '@/stores/onboarding-store'

export function QuickstartWizard() {
  const router = useRouter()
  const setCompleted = useOnboardingStore((s) => s.setCompleted)
  const createWorld = useCreateWorld()

  const [worldName, setWorldName] = useState('')
  const [validationError, setValidationError] = useState('')

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!worldName.trim()) {
      setValidationError('World name is required')
      return
    }
    setValidationError('')
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
    <div className="mx-auto w-full max-w-md">
      {/* Progress bar */}
      <div className="mb-6 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
            style={{ background: 'var(--od-teal-500)', color: 'var(--od-bg-base)' }}
          >
            1
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--od-teal-400)' }}>
            Name your world
          </span>
        </div>
        <div
          className="h-px flex-1"
          style={{ background: 'var(--od-border-emphasis)' }}
        />
        <div className="flex items-center gap-1.5">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium"
            style={{ background: 'var(--od-border-emphasis)', color: 'var(--od-text-muted)' }}
          >
            2
          </div>
          <span className="text-xs" style={{ color: 'var(--od-text-muted)' }}>
            Add sources
          </span>
        </div>
      </div>

      {/* Card */}
      <div
        className="rounded-xl border p-6"
        style={{
          background: 'var(--od-bg-surface)',
          borderColor: 'var(--od-border-default)',
          boxShadow: 'var(--od-shadow-elevated)',
        }}
      >
        <div className="mb-5 flex flex-col items-center text-center">
          <div
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: 'rgba(20,184,166,0.1)' }}
          >
            <Globe className="h-6 w-6" style={{ color: 'var(--od-teal-400)' }} />
          </div>
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--od-text-primary)' }}
          >
            Name your world
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--od-text-secondary)' }}>
            You can add characters, beats, and details later.
          </p>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {(createWorld.error || validationError) && (
            <div
              className="rounded-lg border px-3 py-2.5 text-sm"
              style={{
                borderColor: 'rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.08)',
                color: '#f87171',
              }}
            >
              {validationError || createWorld.error?.message || 'Something went wrong.'}
            </div>
          )}
          <Input
            placeholder="e.g. The Iron Kingdoms"
            value={worldName}
            onChange={(e) => {
              setWorldName(e.target.value)
              if (validationError) setValidationError('')
            }}
            autoFocus
            required
            className="border bg-[var(--od-bg-input)] text-[var(--od-text-primary)] placeholder:text-[var(--od-text-disabled)] focus-visible:ring-[var(--od-teal-500)] focus-visible:border-[var(--od-border-teal)]"
            style={{ borderColor: 'var(--od-border-emphasis)' }}
          />
          <Button
            type="submit"
            disabled={!worldName.trim() || createWorld.isPending}
            className="w-full bg-[var(--od-teal-500)] font-medium text-[var(--od-bg-base)] hover:bg-[var(--od-teal-600)] disabled:opacity-50"
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
      </div>
    </div>
  )
}
