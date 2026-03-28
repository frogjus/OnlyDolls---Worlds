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
      <div className="p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-1.5">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-7 w-36" />
          </div>
        </div>
        <Skeleton className="mt-1 h-4 w-72" />
        <Separator className="my-6" />
        <div className="mx-auto max-w-3xl space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Treatment</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Auto-generated from your beat sheet. Click the edit icon to override
            any section.
          </p>
        </div>
        <TreatmentExport sections={sections} title="Treatment" />
      </div>
      <Separator className="my-6" />
      <TreatmentView worldId={worldId} />
    </div>
  )
}
