'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  BarChart3,
  StickyNote,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useWorldStats } from '@/lib/hooks/use-world-stats'
import { showSuccess, showError } from '@/lib/toast'
import { SynopsisPanel } from './synopsis-panel'
import { StatsPanel } from './stats-panel'
import { SceneNotes } from './scene-notes'
import { CharacterListPanel } from './character-list-panel'

interface StorySidebarProps {
  worldId: string
  collapsed?: boolean
  onToggle?: () => void
}

interface SectionHeaderProps {
  icon: React.ReactNode
  label: string
  open: boolean
  onToggle: () => void
}

type SectionState = {
  synopsis: boolean
  stats: boolean
  notes: boolean
  characters: boolean
}

const DEFAULT_SECTIONS: SectionState = {
  synopsis: true,
  stats: true,
  notes: true,
  characters: true,
}

function getSectionsKey(worldId: string) {
  return `storyforge-sidebar-sections-${worldId}`
}

function loadSections(worldId: string): SectionState {
  try {
    const raw = localStorage.getItem(getSectionsKey(worldId))
    if (raw) return { ...DEFAULT_SECTIONS, ...JSON.parse(raw) }
  } catch {
    // ignore bad data
  }
  return DEFAULT_SECTIONS
}

function SectionHeader({ icon, label, open, onToggle }: SectionHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
    </button>
  )
}

export function StorySidebar({ worldId, collapsed, onToggle }: StorySidebarProps) {
  const { data: stats } = useWorldStats(worldId)
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const isCollapsed = collapsed ?? internalCollapsed
  const toggle = onToggle ?? (() => setInternalCollapsed((v) => !v))

  // --- Section collapse persistence ---
  const [sections, setSections] = useState<SectionState>(DEFAULT_SECTIONS)

  useEffect(() => {
    setSections(loadSections(worldId))
  }, [worldId])

  const toggleSection = useCallback(
    (key: keyof SectionState) => {
      setSections((prev) => {
        const next = { ...prev, [key]: !prev[key] }
        localStorage.setItem(getSectionsKey(worldId), JSON.stringify(next))
        return next
      })
    },
    [worldId]
  )

  // --- Synopsis: fetch from API, save on blur ---
  const [synopsis, setSynopsis] = useState('')
  const [synopsisSaving, setSynopsisSaving] = useState(false)
  const lastSavedRef = useRef('')

  useEffect(() => {
    let cancelled = false
    fetch(`/api/worlds/${worldId}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return
        const desc = json.data?.description ?? ''
        setSynopsis(desc)
        lastSavedRef.current = desc
      })
      .catch(() => {
        // world fetch failed — leave empty
      })
    return () => {
      cancelled = true
    }
  }, [worldId])

  const saveSynopsis = useCallback(async () => {
    const trimmed = synopsis.trim()
    if (trimmed === lastSavedRef.current.trim()) return
    setSynopsisSaving(true)
    try {
      const res = await fetch(`/api/worlds/${worldId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: synopsis }),
      })
      if (!res.ok) throw new Error('save failed')
      lastSavedRef.current = synopsis
      showSuccess('Synopsis saved')
    } catch {
      showError('Failed to save synopsis')
    } finally {
      setSynopsisSaving(false)
    }
  }, [synopsis, worldId])

  return (
    <aside
      className={cn(
        'relative border-l bg-card transition-all duration-200 flex flex-col',
        isCollapsed ? 'w-0 overflow-hidden' : 'w-72'
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute -left-8 top-2 z-10 h-6 w-6"
        onClick={toggle}
      >
        {isCollapsed ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {!isCollapsed && (
        <ScrollArea className="h-full">
          <div className="p-4 space-y-1">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Story Sidebar
            </h2>

            <SectionHeader
              icon={<BookOpen className="h-3.5 w-3.5" />}
              label="Synopsis"
              open={sections.synopsis}
              onToggle={() => toggleSection('synopsis')}
            />
            <div
              className={cn(
                'grid transition-all duration-200',
                sections.synopsis ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="overflow-hidden">
                <div className="pb-2">
                  <SynopsisPanel
                    synopsis={synopsis}
                    saving={synopsisSaving}
                    onSynopsisChange={setSynopsis}
                    onBlur={saveSynopsis}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <SectionHeader
              icon={<BarChart3 className="h-3.5 w-3.5" />}
              label="Stats"
              open={sections.stats}
              onToggle={() => toggleSection('stats')}
            />
            <div
              className={cn(
                'grid transition-all duration-200',
                sections.stats ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="overflow-hidden">
                <div className="pb-2">
                  <StatsPanel
                    wordCount={stats?.wordCount ?? 0}
                    beatsDone={stats?.beatsDone ?? 0}
                    beatsTotal={stats?.beatsTotal ?? 0}
                    characterCount={stats?.characterCount ?? 0}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <SectionHeader
              icon={<StickyNote className="h-3.5 w-3.5" />}
              label="Scene Notes"
              open={sections.notes}
              onToggle={() => toggleSection('notes')}
            />
            <div
              className={cn(
                'grid transition-all duration-200',
                sections.notes ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="overflow-hidden">
                <div className="pb-2">
                  <SceneNotes worldId={worldId} />
                </div>
              </div>
            </div>

            <Separator />

            <SectionHeader
              icon={<Users className="h-3.5 w-3.5" />}
              label="Characters"
              open={sections.characters}
              onToggle={() => toggleSection('characters')}
            />
            <div
              className={cn(
                'grid transition-all duration-200',
                sections.characters ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="overflow-hidden">
                <div className="pb-2">
                  <CharacterListPanel characters={[]} />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      )}
    </aside>
  )
}
