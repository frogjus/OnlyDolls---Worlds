'use client'

import { useParams } from 'next/navigation'
import {
  Users,
  MapPin,
  Lightbulb,
  Heart,
  FileText,
  Sparkles,
  Target,
  Eye,
  AlertTriangle,
  ThumbsUp,
  Layers,
} from 'lucide-react'

import { useCharacters } from '@/lib/hooks/use-characters'
import { useLocations } from '@/lib/hooks/use-locations'
import { useThemes } from '@/lib/hooks/use-themes'
import { useRelationships } from '@/lib/hooks/use-relationships'
import { useSources } from '@/lib/hooks/use-sources'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function WorldDashboardPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const { data: charsData, isLoading: charsLoading } = useCharacters(worldId)
  const { data: locsData, isLoading: locsLoading } = useLocations(worldId)
  const { data: themesData, isLoading: themesLoading } = useThemes(worldId)
  const { data: relsData, isLoading: relsLoading } = useRelationships(worldId)
  const { data: sourcesData, isLoading: sourcesLoading } = useSources(worldId)

  const characters = charsData?.data ?? []
  const locations = locsData?.data ?? []
  const themes = themesData?.data ?? []
  const relationships = relsData?.data ?? []
  const sources = sourcesData?.data ?? []

  // Get insights from latest source material
  const latestSource = sources[0]
  const sourceMetadata = latestSource?.metadata as Record<string, unknown> | null
  const insights = sourceMetadata?.insights as {
    mirrorStructures?: string[]
    unconsciousPatterns?: string[]
    chekhovsGuns?: string[]
    strengths?: string[]
    weaknesses?: string[]
  } | null

  const isLoading = charsLoading || locsLoading || themesLoading || relsLoading || sourcesLoading

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-[-0.015em] text-foreground">
          World Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analysis overview and narrative insights.
        </p>
      </div>

      {/* Entity counts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Characters" count={characters.length} loading={charsLoading} color="text-teal-400" />
        <StatCard icon={MapPin} label="Locations" count={locations.length} loading={locsLoading} color="text-emerald-400" />
        <StatCard icon={Lightbulb} label="Themes" count={themes.length} loading={themesLoading} color="text-cyan-400" />
        <StatCard icon={Heart} label="Relationships" count={relationships.length} loading={relsLoading} color="text-rose-400" />
      </div>

      {/* Insights */}
      {!insights && !isLoading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted p-14 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/50" />
          <h3 className="mt-4 font-heading text-lg font-semibold tracking-tight text-foreground">
            No analysis yet
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Upload a manuscript in Sources to generate deep narrative analysis.
          </p>
        </div>
      )}

      {insights && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            Narrative Insights
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <InsightCard icon={Layers} title="Mirror Structures" items={insights.mirrorStructures} />
            <InsightCard icon={Eye} title="Unconscious Patterns" items={insights.unconsciousPatterns} />
            <InsightCard icon={Target} title="Chekhov's Guns" items={insights.chekhovsGuns} />
            <InsightCard icon={ThumbsUp} title="Strengths" items={insights.strengths} />
            <InsightCard icon={AlertTriangle} title="Weaknesses" items={insights.weaknesses} />
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, count, loading, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  count: number
  loading: boolean
  color: string
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          {loading ? (
            <Skeleton className="h-7 w-10" />
          ) : (
            <p className="text-2xl font-semibold text-foreground">{count}</p>
          )}
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function InsightCard({ icon: Icon, title, items }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  items?: string[]
}) {
  if (!items || items.length === 0) return null
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
