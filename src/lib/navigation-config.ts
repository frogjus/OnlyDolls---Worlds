import {
  Upload,
  FileText,
  PenTool,
  LayoutGrid,
  PenLine,
  FileOutput,
  Globe,
  Users,
  MapPin,
  Shield,
  BookOpen,
  Cog,
  Package,
  Palette,
  BarChart3,
  Clock,
  TrendingUp,
  Activity,
  Link,
  GitBranch,
  Brain,
  ShieldCheck,
  Compass,
  GitFork,
  Archive,
  Network,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface ViewConfig {
  slug: string
  label: string
  icon: LucideIcon
  tier?: 1 | 2 | 3
  hidden?: boolean
}

export interface WorkspaceGroup {
  id: string
  label: string
  icon: LucideIcon
  views: ViewConfig[]
}

export const workspaceGroups: WorkspaceGroup[] = [
  {
    id: 'ingest',
    label: 'Ingest',
    icon: Upload,
    views: [
      { slug: 'sources', label: 'Sources', icon: FileText },
    ],
  },
  {
    id: 'write',
    label: 'Write',
    icon: PenTool,
    views: [
      { slug: 'beats', label: 'Beats', icon: LayoutGrid },
      { slug: 'write', label: 'Writing Surface', icon: PenLine },
      { slug: 'treatment', label: 'Treatment', icon: FileOutput },
    ],
  },
  {
    id: 'build-world',
    label: 'Build World',
    icon: Globe,
    views: [
      { slug: 'characters', label: 'Characters', icon: Users },
      { slug: 'locations', label: 'Locations', icon: MapPin },
      { slug: 'factions', label: 'Factions', icon: Shield },
      { slug: 'wiki', label: 'Wiki', icon: BookOpen, hidden: true },
      { slug: 'systems', label: 'Systems', icon: Cog, hidden: true },
      { slug: 'objects', label: 'Objects', icon: Package },
      { slug: 'themes', label: 'Themes', icon: Palette },
    ],
  },
  {
    id: 'analyze',
    label: 'Analyze',
    icon: BarChart3,
    views: [
      { slug: 'timeline', label: 'Timeline', icon: Clock },
      { slug: 'arcs', label: 'Arcs', icon: TrendingUp },
      { slug: 'pacing', label: 'Pacing', icon: Activity, hidden: true },
      { slug: 'foreshadowing', label: 'Foreshadowing', icon: Link, hidden: true },
      { slug: 'causality', label: 'Causality', icon: GitBranch, hidden: true },
      { slug: 'knowledge', label: 'Knowledge', icon: Brain, hidden: true },
      { slug: 'consistency', label: 'Consistency', icon: ShieldCheck, hidden: true },
    ],
  },
  {
    id: 'plan',
    label: 'Plan',
    icon: Compass,
    views: [
      { slug: 'whatif', label: 'What-If', icon: GitFork, hidden: true },
      { slug: 'canon', label: 'Canon', icon: Archive, hidden: true },
      { slug: 'mindmap', label: 'Mind Map', icon: Network, hidden: true },
      { slug: 'settings', label: 'Settings', icon: Settings },
    ],
  },
]

const viewIndex = new Map<string, ViewConfig>()
const groupByView = new Map<string, WorkspaceGroup>()

for (const group of workspaceGroups) {
  for (const view of group.views) {
    viewIndex.set(view.slug, view)
    groupByView.set(view.slug, group)
  }
}

export function getViewBySlug(slug: string): ViewConfig | undefined {
  return viewIndex.get(slug)
}

export function getGroupByViewSlug(slug: string): WorkspaceGroup | undefined {
  return groupByView.get(slug)
}

export function getVisibleGroups(): WorkspaceGroup[] {
  return workspaceGroups
    .map((group) => ({
      ...group,
      views: group.views.filter((v) => !v.hidden),
    }))
    .filter((group) => group.views.length > 0)
}

export function getAllViews(): ViewConfig[] {
  return workspaceGroups.flatMap((g) => g.views)
}
