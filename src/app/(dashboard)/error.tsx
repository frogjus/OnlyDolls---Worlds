'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { showError } from '@/lib/toast'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
    showError('Something went wrong')
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-[var(--od-border-emphasis)] bg-card p-10 text-center shadow-[var(--od-shadow-card)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-7 w-7 text-destructive/80" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">Something went wrong</h2>
          <p className="max-w-md text-sm leading-relaxed text-[var(--od-text-secondary)]">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
        </div>
        <Button className="mt-2 bg-primary text-primary-foreground hover:bg-[var(--od-teal-600)] glow-teal-hover transition-all" onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  )
}
