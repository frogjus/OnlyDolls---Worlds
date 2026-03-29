'use client'

import { useState, useCallback } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { UploadDropzone } from './upload-dropzone'
import { EntityReview } from './entity-review'
import { useEntityConfirm } from '@/lib/hooks/use-entity-confirm'
import { useSourceStore } from '@/stores/source-store'
import { showSuccess, showError } from '@/lib/toast'

type FlowState = 'upload' | 'extracting' | 'reviewing' | 'confirmed'

interface ExtractedEntityItem {
  name: string
  type: 'character' | 'location' | 'event' | 'item' | 'faction'
  description: string
  confidence: number
  confirmed: boolean
}

interface IngestionFlowProps {
  worldId: string
  onComplete?: (created: Array<{ id: string; name: string; type: string }>) => void
}

export function IngestionFlow({ worldId, onComplete }: IngestionFlowProps) {
  const [state, setState] = useState<FlowState>('upload')
  const [entities, setEntities] = useState<ExtractedEntityItem[]>([])
  const [createdCount, setCreatedCount] = useState(0)
  const confirmMutation = useEntityConfirm(worldId)
  const { setIngestionStep } = useSourceStore()

  const handleUploadStart = useCallback(() => {
    setIngestionStep('uploading')
  }, [setIngestionStep])

  const handleUploadComplete = useCallback(
    (result: { entities?: ExtractedEntityItem[] }) => {
      showSuccess('File uploaded — starting analysis...')
      setIngestionStep('analyzing')
      const extracted = result.entities ?? []
      if (extracted.length > 0) {
        setEntities(extracted)
        setState('reviewing')
        setIngestionStep('reviewing')
        showSuccess('Analysis complete — review extracted entities')
      } else {
        setState('upload')
        setIngestionStep('idle')
      }
    },
    [setIngestionStep]
  )

  const handleUploadError = useCallback(
    (errorMsg: string) => {
      showError('Ingestion failed: ' + errorMsg)
      setIngestionStep('error')
    },
    [setIngestionStep]
  )

  const handleConfirm = useCallback(
    (confirmed: ExtractedEntityItem[]) => {
      confirmMutation.mutate(confirmed, {
        onSuccess: (result) => {
          setCreatedCount(result.data.totalCreated)
          setState('confirmed')
          setIngestionStep('complete')
          showSuccess('Entities confirmed and added to world')
          onComplete?.(result.data.created)
        },
        onError: (err) => {
          showError('Failed to confirm entities: ' + err.message)
          setIngestionStep('error')
        },
      })
    },
    [confirmMutation, onComplete, setIngestionStep]
  )

  const handleCancel = useCallback(() => {
    setEntities([])
    setState('upload')
    setIngestionStep('idle')
  }, [setIngestionStep])

  const handleReset = useCallback(() => {
    setEntities([])
    setCreatedCount(0)
    confirmMutation.reset()
    setState('upload')
    setIngestionStep('idle')
  }, [confirmMutation, setIngestionStep])

  if (state === 'confirmed') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border p-8 text-center">
        <CheckCircle2 className="size-10 text-green-600" />
        <p className="text-sm font-medium">
          {createdCount} {createdCount === 1 ? 'entity' : 'entities'} imported successfully
        </p>
        <button
          onClick={handleReset}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Import more
        </button>
      </div>
    )
  }

  if (state === 'reviewing') {
    return (
      <div className="space-y-4">
        {confirmMutation.isPending && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Creating entities...</span>
          </div>
        )}
        {confirmMutation.isError && (
          <p className="text-sm text-destructive">
            {confirmMutation.error.message}
          </p>
        )}
        <EntityReview
          entities={entities}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isLoading={confirmMutation.isPending}
        />
      </div>
    )
  }

  return (
    <UploadDropzone
      worldId={worldId}
      onUploadComplete={handleUploadComplete}
      onError={handleUploadError}
      onUploadStart={handleUploadStart}
    />
  )
}
