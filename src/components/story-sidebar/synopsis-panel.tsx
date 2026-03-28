'use client'

import { AlertTriangle } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface SynopsisPanelProps {
  synopsis: string
  onSynopsisChange: (value: string) => void
}

export function SynopsisPanel({ synopsis, onSynopsisChange }: SynopsisPanelProps) {
  return (
    <div className="space-y-2">
      <Textarea
        value={synopsis}
        onChange={(e) => onSynopsisChange(e.target.value)}
        placeholder="Write your story synopsis here. Required before AI Wand can be used."
        className="min-h-[100px] text-sm resize-y"
      />
      {!synopsis.trim() && (
        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <p className="text-xs">Synopsis required to use AI Wand</p>
        </div>
      )}
    </div>
  )
}
