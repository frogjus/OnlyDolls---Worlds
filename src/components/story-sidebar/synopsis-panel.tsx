'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface SynopsisPanelProps {
  synopsis: string
  saving: boolean
  onSynopsisChange: (value: string) => void
  onBlur: () => void
}

export function SynopsisPanel({ synopsis, saving, onSynopsisChange, onBlur }: SynopsisPanelProps) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          value={synopsis}
          onChange={(e) => onSynopsisChange(e.target.value)}
          onBlur={onBlur}
          placeholder="Write your story synopsis here. Required before AI Wand can be used."
          className="min-h-[100px] text-sm resize-y"
        />
        {saving && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs">Saving…</span>
          </div>
        )}
      </div>
      {!synopsis.trim() && (
        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <p className="text-xs">Synopsis required to use AI Wand</p>
        </div>
      )}
    </div>
  )
}
