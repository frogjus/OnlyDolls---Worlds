import { type LucideIcon } from 'lucide-react'
import {
  FileText,
  Eye,
  LayoutGrid,
  PenTool,
  ScrollText,
  Users,
  MapPin,
  Shield,
  BookOpen,
  Cpu,
  Box,
  Palette,
  Clock,
  TrendingUp,
  Activity,
  Link2,
  GitBranch,
  Brain,
  CheckCircle,
  GitFork,
  Archive,
  Map,
  Settings,
  Layers,
  Network,
  CalendarDays,
  Plus,
} from 'lucide-react'

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

interface NavigationView {
  id: string
  label: string
  path: string
  icon: LucideIcon
  group: string
  keywords?: string[]
}

const WORKSPACE_VIEWS: NavigationView[] = [
  // Ingest
  { id: 'sources', label: 'Sources', path: 'sources', icon: FileText, group: 'Ingest', keywords: ['upload', 'import', 'ingest', 'material'] },
  { id: 'source-viewer', label: 'Source Viewer', path: 'sources', icon: Eye, group: 'Ingest', keywords: ['view', 'reader', 'document'] },

  // Write
  { id: 'beats', label: 'Beats', path: 'beats', icon: LayoutGrid, group: 'Write', keywords: ['scene', 'board', 'kanban', 'cards'] },
  { id: 'write', label: 'Writing Surface', path: 'write', icon: PenTool, group: 'Write', keywords: ['editor', 'manuscript', 'script', 'prose', 'screenplay'] },
  { id: 'treatment', label: 'Treatment', path: 'treatment', icon: ScrollText, group: 'Write', keywords: ['outline', 'summary', 'synopsis'] },

  // Build World
  { id: 'characters', label: 'Characters', path: 'characters', icon: Users, group: 'Build World', keywords: ['people', 'cast', 'profiles'] },
  { id: 'locations', label: 'Locations', path: 'locations', icon: MapPin, group: 'Build World', keywords: ['places', 'settings', 'geography'] },
  { id: 'factions', label: 'Factions', path: 'factions', icon: Shield, group: 'Build World', keywords: ['groups', 'organizations', 'teams', 'allegiances'] },
  { id: 'wiki', label: 'Wiki', path: 'wiki', icon: BookOpen, group: 'Build World', keywords: ['encyclopedia', 'reference', 'lore'] },
  { id: 'systems', label: 'Systems', path: 'systems', icon: Cpu, group: 'Build World', keywords: ['magic', 'technology', 'rules'] },
  { id: 'objects', label: 'Objects', path: 'objects', icon: Box, group: 'Build World', keywords: ['items', 'props', 'artifacts'] },
  { id: 'themes', label: 'Themes', path: 'themes', icon: Palette, group: 'Build World', keywords: ['motifs', 'symbols', 'meaning'] },

  // Analyze
  { id: 'timeline', label: 'Timeline', path: 'timeline', icon: Clock, group: 'Analyze', keywords: ['chronology', 'fabula', 'sjuzhet', 'events'] },
  { id: 'arcs', label: 'Arcs', path: 'arcs', icon: TrendingUp, group: 'Analyze', keywords: ['story arc', 'structure', 'progression'] },
  { id: 'pacing', label: 'Pacing', path: 'pacing', icon: Activity, group: 'Analyze', keywords: ['rhythm', 'tempo', 'density', 'heatmap'] },
  { id: 'foreshadowing', label: 'Foreshadowing', path: 'foreshadowing', icon: Link2, group: 'Analyze', keywords: ['setup', 'payoff', 'chekhov'] },
  { id: 'causality', label: 'Causality', path: 'causality', icon: GitBranch, group: 'Analyze', keywords: ['cause', 'effect', 'chain', 'why'] },
  { id: 'knowledge', label: 'Knowledge', path: 'knowledge', icon: Brain, group: 'Analyze', keywords: ['audience', 'dramatic irony', 'information'] },
  { id: 'consistency', label: 'Consistency', path: 'consistency', icon: CheckCircle, group: 'Analyze', keywords: ['contradictions', 'errors', 'validation'] },

  // Plan
  { id: 'whatif', label: 'What-If', path: 'whatif', icon: GitFork, group: 'Plan', keywords: ['scenario', 'branch', 'alternative', 'fork'] },
  { id: 'canon', label: 'Canon', path: 'canon', icon: Archive, group: 'Plan', keywords: ['version', 'snapshot', 'official', 'canonical'] },
  { id: 'mindmap', label: 'Mind Map', path: 'mindmap', icon: Map, group: 'Plan', keywords: ['spatial', 'visual', 'overview', 'world map'] },
  { id: 'settings', label: 'Settings', path: 'settings', icon: Settings, group: 'Plan', keywords: ['config', 'preferences', 'calendar'] },
]

export function createNavigationActions(
  worldId: string,
  router: { push: (url: string) => void }
): CommandAction[] {
  return WORKSPACE_VIEWS.map((view) => ({
    id: `nav-${view.id}`,
    label: `Go to ${view.label}`,
    icon: view.icon,
    type: 'navigation' as const,
    keywords: [view.group.toLowerCase(), ...(view.keywords ?? [])],
    onSelect: () => router.push(`/world/${worldId}/${view.path}`),
  }))
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
