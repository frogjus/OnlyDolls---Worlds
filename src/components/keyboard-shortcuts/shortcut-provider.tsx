'use client'

import { useEffect, useRef, useCallback, useState, createContext, useContext } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { detectConflicts } from '@/lib/keyboard-shortcuts'
import { ShortcutHelpDialog } from './shortcut-help-dialog'

interface ShortcutContextValue {
  helpOpen: boolean
  setHelpOpen: (open: boolean) => void
}

const ShortcutContext = createContext<ShortcutContextValue>({
  helpOpen: false,
  setHelpOpen: () => {},
})

export function useShortcutHelp() {
  return useContext(ShortcutContext)
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  const tagName = target.tagName.toLowerCase()
  return tagName === 'input' || tagName === 'textarea' || target.isContentEditable
}

const CHORD_ROUTES: Record<string, string> = {
  b: 'beats',
  w: 'write',
  c: 'characters',
  t: 'timeline',
  s: 'sources',
}

const CHORD_TIMEOUT_MS = 1500

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
  const [helpOpen, setHelpOpen] = useState(false)
  const chordKey = useRef<string | null>(null)
  const chordTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const params = useParams()
  const worldId = params?.id as string | undefined

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const conflicts = detectConflicts()
      for (const c of conflicts) {
        console.warn('[keyboard-shortcuts]', c)
      }
    }
  }, [])

  const clearChord = useCallback(() => {
    chordKey.current = null
    if (chordTimer.current) {
      clearTimeout(chordTimer.current)
      chordTimer.current = null
    }
  }, [])

  const navigateTo = useCallback(
    (path: string) => {
      if (worldId) {
        router.push(`/world/${worldId}/${path}`)
      }
    },
    [worldId, router]
  )

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return

      // Complete a pending chord sequence
      if (chordKey.current === 'g') {
        const route = CHORD_ROUTES[e.key.toLowerCase()]
        clearChord()

        if (route) {
          e.preventDefault()
          navigateTo(route)
        }
        return
      }

      // Start chord with bare 'g' (no modifiers)
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        chordKey.current = 'g'
        chordTimer.current = setTimeout(clearChord, CHORD_TIMEOUT_MS)
        return
      }

      // '?' opens help dialog
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setHelpOpen(true)
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      clearChord()
    }
  }, [clearChord, navigateTo])

  return (
    <ShortcutContext.Provider value={{ helpOpen, setHelpOpen }}>
      {children}
      <ShortcutHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </ShortcutContext.Provider>
  )
}
