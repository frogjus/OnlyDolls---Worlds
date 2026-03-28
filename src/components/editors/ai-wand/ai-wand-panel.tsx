'use client'

import { useState, useCallback, useEffect } from 'react'
import { Wand2, Check, X, Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AIWandPanelProps {
  worldId: string
  synopsis?: string
  selectedText?: string
  generationType: 'beat_generation' | 'script_generation' | 'synopsis_expansion'
  onAccept: (text: string) => void
  onDismiss: () => void
}

interface GenerationResponse {
  data: {
    suggestion: string
    confidence: number
    contextUsed: string[]
  }
}

export function AIWandPanel({
  worldId,
  synopsis,
  selectedText,
  generationType,
  onAccept,
  onDismiss,
}: AIWandPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async () => {
    setIsGenerating(true)
    setError(null)
    setSuggestion(null)

    try {
      const response = await fetch(`/api/worlds/${worldId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: generationType,
          context: {
            worldId,
            synopsis,
            selectedText,
          },
          logline: generationType === 'synopsis_expansion' ? selectedText : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = (await response.json()) as { error: string }
        throw new Error(errorData.error ?? 'Generation failed')
      }

      const result = (await response.json()) as GenerationResponse
      setSuggestion(result.data.suggestion)
      setConfidence(result.data.confidence)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }, [worldId, synopsis, selectedText, generationType])

  useEffect(() => {
    if (!synopsis) {
      setError('Synopsis is required. Fill in the Story Sidebar synopsis to enable AI suggestions.')
      return
    }
    generate()
  }, [generate, synopsis])

  const handleAccept = useCallback(() => {
    if (suggestion) {
      onAccept(suggestion)
    }
  }, [suggestion, onAccept])

  return (
    <div className="rounded-lg border bg-card shadow-lg">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Wand2 className="size-4 text-primary" />
        <span className="text-sm font-medium">AI Suggestion</span>
        <span className="text-xs text-muted-foreground">
          (for review only)
        </span>
      </div>

      <div className="p-4">
        {isGenerating && (
          <div className="flex items-center gap-3 py-8">
            <Loader2 className="size-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Generating suggestion...
            </span>
          </div>
        )}

        {error && !isGenerating && (
          <div className="py-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {suggestion && !isGenerating && (
          <div className="space-y-3">
            <div className="max-h-[300px] overflow-y-auto rounded-md bg-muted/50 p-3">
              <p className="whitespace-pre-wrap text-sm">{suggestion}</p>
            </div>
            {confidence > 0 && (
              <p className="text-xs text-muted-foreground">
                Confidence: {Math.round(confidence * 100)}%
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t px-4 py-3">
        <p className="text-[10px] text-muted-foreground">
          This is a suggestion for you to review, not your story.
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            <X className="mr-1 size-3.5" />
            Dismiss
          </Button>
          {suggestion && !isGenerating && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={generate}
                disabled={isGenerating}
              >
                <RotateCcw className="mr-1 size-3.5" />
                Regenerate
              </Button>
              <Button size="sm" onClick={handleAccept}>
                <Check className="mr-1 size-3.5" />
                Accept
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
