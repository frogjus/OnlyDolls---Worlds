export type ShortcutCategory = 'Navigation' | 'Panels' | 'Editor'

export interface KeyboardShortcut {
  id: string
  keys: string[]
  description: string
  category: ShortcutCategory
  chord?: boolean
}

export const shortcuts: KeyboardShortcut[] = [
  // Panels
  { id: 'toggle-command-palette', keys: ['mod', 'K'], description: 'Open command palette', category: 'Panels' },
  { id: 'toggle-sidebar', keys: ['mod', '\\'], description: 'Toggle sidebar', category: 'Panels' },
  { id: 'toggle-inspector', keys: ['mod', 'I'], description: 'Toggle inspector', category: 'Panels' },
  { id: 'shortcut-help', keys: ['?'], description: 'Open shortcut help', category: 'Panels' },
  { id: 'close-dialog', keys: ['Esc'], description: 'Close dialogs/panels', category: 'Panels' },

  // Navigation (chord sequences)
  { id: 'go-beats', keys: ['G', 'B'], description: 'Go to Beats', category: 'Navigation', chord: true },
  { id: 'go-write', keys: ['G', 'W'], description: 'Go to Write', category: 'Navigation', chord: true },
  { id: 'go-characters', keys: ['G', 'C'], description: 'Go to Characters', category: 'Navigation', chord: true },
  { id: 'go-timeline', keys: ['G', 'T'], description: 'Go to Timeline', category: 'Navigation', chord: true },
  { id: 'go-sources', keys: ['G', 'S'], description: 'Go to Sources', category: 'Navigation', chord: true },
]

function getIsMac(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform)
}

export function formatKey(key: string): string {
  if (key === 'mod') return getIsMac() ? '\u2318' : 'Ctrl'
  return key
}

export function getShortcutsByCategory(): Record<ShortcutCategory, KeyboardShortcut[]> {
  const grouped: Record<ShortcutCategory, KeyboardShortcut[]> = {
    Navigation: [],
    Panels: [],
    Editor: [],
  }

  for (const shortcut of shortcuts) {
    grouped[shortcut.category].push(shortcut)
  }

  return grouped
}

export function detectConflicts(): string[] {
  const seen = new Map<string, string>()
  const conflicts: string[] = []

  for (const shortcut of shortcuts) {
    const combo = shortcut.keys.join('+') + (shortcut.chord ? ':chord' : '')
    const existing = seen.get(combo)
    if (existing) {
      conflicts.push(
        `Conflict: "${shortcut.keys.join('+')}" is used by both "${existing}" and "${shortcut.id}"`
      )
    } else {
      seen.set(combo, shortcut.id)
    }
  }

  return conflicts
}
