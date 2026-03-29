import { type LucideIcon } from 'lucide-react'
import {
  LayoutGrid,
  Users,
  MapPin,
  Shield,
  TrendingUp,
  Palette,
  Box,
  FileText,
  Layers,
  Network,
  CalendarDays,
} from 'lucide-react'
import { workspaceGroups } from '@/lib/navigation-config'

export type CommandActionType = 'navigation' | 'create' | 'search' | 'action'

export interface CommandAction {
  id: string
  label: string
  icon?: LucideIcon
  type: CommandActionType
  shortcut?: string
  keywords?: string[]
  onSelect: () => void
}

export function createNavigationActions(
  worldId: string,
  router: { push: (url: string) => void }
): CommandAction[] {
  return workspaceGroups.flatMap((group) =>
    group.views.map((view) => ({
      id: `nav-${view.slug}`,
      label: `Go to ${view.label}`,
      icon: view.icon,
      type: 'navigation' as const,
      keywords: [group.label.toLowerCase()],
      onSelect: () => router.push(`/world/${worldId}/${view.slug}`),
    }))
  )
}

interface EntityTemplate {
  id: string
  label: string
  icon: LucideIcon
  path: string
  keywords?: string[]
}

const ENTITY_TEMPLATES: EntityTemplate[] = [
  { id: 'beat', label: 'Create Beat', icon: LayoutGrid, path: 'beats', keywords: ['scene', 'card', 'new beat'] },
  { id: 'character', label: 'Create Character', icon: Users, path: 'characters', keywords: ['person', 'new character'] },
  { id: 'location', label: 'Create Location', icon: MapPin, path: 'locations', keywords: ['place', 'new location'] },
  { id: 'faction', label: 'Create Faction', icon: Shield, path: 'factions', keywords: ['group', 'organization', 'new faction'] },
  { id: 'arc', label: 'Create Arc', icon: TrendingUp, path: 'arcs', keywords: ['story arc', 'throughline', 'new arc'] },
  { id: 'event', label: 'Create Event', icon: CalendarDays, path: 'events', keywords: ['happening', 'incident', 'new event'] },
  { id: 'theme', label: 'Create Theme', icon: Palette, path: 'themes', keywords: ['motif', 'new theme'] },
  { id: 'object', label: 'Create Object', icon: Box, path: 'objects', keywords: ['item', 'prop', 'new object'] },
  { id: 'source', label: 'Upload Source', icon: FileText, path: 'sources', keywords: ['import', 'ingest', 'upload'] },
  { id: 'scene', label: 'Create Scene', icon: Layers, path: 'scenes', keywords: ['new scene'] },
  { id: 'relationship', label: 'Create Relationship', icon: Network, path: 'relationships', keywords: ['connection', 'link', 'new relationship'] },
]

export function createEntityActions(
  worldId: string,
  router: { push: (url: string) => void }
): CommandAction[] {
  return ENTITY_TEMPLATES.map((entity) => ({
    id: `create-${entity.id}`,
    label: entity.label,
    icon: entity.icon,
    type: 'create' as const,
    keywords: entity.keywords,
    onSelect: () => router.push(`/world/${worldId}/${entity.path}`),
  }))
}
