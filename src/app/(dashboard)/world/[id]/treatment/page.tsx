'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { TreatmentView } from '@/components/treatment/treatment-view'
import { TreatmentExport } from '@/components/treatment/treatment-export'
import {
  useTreatmentBeats,
  generateTreatment,
} from '@/lib/hooks/use-treatments'

export default function TreatmentPage() {
  const params = useParams<{ id: string }>()
  const worldId = params.id
  const { data: beats, isLoading } = useTreatmentBeats(worldId)

  const sections = useMemo(() => {
    if (!beats || beats.length === 0) return []
    return generateTreatment(beats)
  }, [beats])

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 bg-muted" />
            <Skeleton className="mt-2 h-4 w-72 bg-muted" />
          </div>
          <div className="flex gap-1.5">
            <Skeleton className="h-7 w-36 bg-muted" />
            <Skeleton className="h-7 w-36 bg-muted" />
          </div>
        </div>
        <Separator className="border-border" />
        <div className="mx-auto max-w-3xl space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-48 bg-muted" />
              <Skeleton className="h-4 w-full bg-muted" />
              <Skeleton className="h-4 w-3/4 bg-muted" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.015em] text-foreground">Treatment</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Auto-generated from your beat sheet. Click the edit icon to override
            any section.
          </p>
        </div>
        <TreatmentExport sections={sections} title="Treatment" />
      </div>
      <Separator className="border-border" />
      <TreatmentView worldId={worldId} />
    </div>
  )
}
