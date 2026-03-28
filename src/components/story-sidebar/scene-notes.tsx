'use client'

import { Textarea } from '@/components/ui/textarea'

interface SceneNotesProps {
  notes: string
  onChange: (value: string) => void
}

export function SceneNotes({ notes, onChange }: SceneNotesProps) {
  return (
    <Textarea
      value={notes}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Add notes for this scene..."
      className="min-h-[80px] text-sm resize-y"
    />
  )
}
