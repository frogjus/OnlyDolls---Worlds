'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'

interface SceneNotesProps {
  worldId: string
}

function getStorageKey(worldId: string) {
  return `storyforge-scene-notes-${worldId}`
}

export function SceneNotes({ worldId }: SceneNotesProps) {
  const [notes, setNotes] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(getStorageKey(worldId))
    if (saved !== null) setNotes(saved)
  }, [worldId])

  const handleChange = useCallback(
    (value: string) => {
      setNotes(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        localStorage.setItem(getStorageKey(worldId), value)
      }, 500)
    },
    [worldId]
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <Textarea
      value={notes}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="Add notes for this scene..."
      className="min-h-[80px] text-sm resize-y"
    />
  )
}
