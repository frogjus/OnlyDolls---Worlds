'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  Globe,
  Users,
  Music,
  MapPin,
  Calendar,
  Clapperboard,
  TrendingUp,
  Shield,
  FileText,
  Settings,
  Layers,
  Gem,
  Lightbulb,
  Rocket,
} from 'lucide-react'

import type { ApiResponse, ApiListResponse, StoryWorld, Character, Beat } from '@/types'
import { useLocations } from '@/lib/hooks/use-locations'
import { useEvents } from '@/lib/hooks/use-events'
import { useScenes } from '@/lib/hooks/use-scenes'
import { useArcs } from '@/lib/hooks/use-arcs'
import { useObjects } from '@/lib/hooks/use-objects'
import { useFactions } from '@/lib/hooks/use-factions'
import { useThemes } from '@/lib/hooks/use-themes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-states/empty-state'

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error ?? 'Request failed')
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// Quick links config
// ---------------------------------------------------------------------------

const quickLinks = (worldId: string) => [
  { label: 'Characters', href: `/world/${worldId}/characters`, icon: Users },
  { label: 'Beats', href: `/world/${worldId}/beats`, icon: Music },
  { label: 'Locations', href: `/world/${worldId}/locations`, icon: MapPin },
  { label: 'Events', href: `/world/${worldId}/events`, icon: Calendar },
  { label: 'Scenes', href: `/world/${worldId}/scenes`, icon: Clapperboard },
  { label: 'Arcs', href: `/world/${worldId}/arcs`, icon: TrendingUp },
  { label: 'Factions', href: `/world/${worldId}/factions`, icon: Shield },
  { label: 'Sources', href: `/world/${worldId}/sources`, icon: FileText },
  { label: 'Structure', href: `/world/${worldId}/structure`, icon: Layers },
  { label: 'Settings', href: `/world/${worldId}/settings`, icon: Settings },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WorldOverviewPage() {
  const { id: worldId } = useParams<{ id: string }>()

  const { data: worldData, isLoading: worldLoading, error: worldError } = useQuery({
    queryKey: ['world', worldId],
    queryFn: () => apiFetch<ApiResponse<StoryWorld>>(`/api/worlds/${worldId}`),
    enabled: !!worldId,
  })

  const { data: charsData } = useQuery({
    queryKey: ['characters', worldId],
    queryFn: () =>
      apiFetch<ApiListResponse<Character>>(`/api/worlds/${worldId}/characters`),
    enabled: !!worldId,
  })

  const { data: beatsData } = useQuery({
    queryKey: ['beats', worldId],
    queryFn: () =>
      apiFetch<ApiListResponse<Beat>>(`/api/worlds/${worldId}/beats`),
    enabled: !!worldId,
  })

  const { data: locationsData } = useLocations(worldId)
  const { data: eventsData } = useEvents(worldId)
  const { data: scenesData } = useScenes(worldId)
  const { data: arcsData } = useArcs(worldId)
  const { data: objectsData } = useObjects(worldId)
  const { data: factionsData } = useFactions(worldId)
  const { data: themesData } = useThemes(worldId)

  const world = worldData?.data
  const characterCount = charsData?.total ?? charsData?.data?.length ?? 0
  const beatCount = beatsData?.total ?? beatsData?.data?.length ?? 0
  const locationCount = locationsData?.data?.length ?? 0
  const sceneCount = scenesData?.data?.length ?? 0
  const eventCount = eventsData?.data?.length ?? 0
  const arcCount = arcsData?.data?.length ?? 0
  const objectCount = objectsData?.data?.length ?? 0
  const factionCount = factionsData?.data?.length ?? 0
  const themeCount = themesData?.data?.length ?? 0

  const totalEntities = characterCount + beatCount + locationCount + sceneCount + eventCount + arcCount + objectCount + factionCount + themeCount

  if (worldLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (worldError || !world) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load world. Please try again.
        </div>
      </div>
    )
  }

  const stats = [
    { label: 'Characters', value: characterCount, icon: Users },
    { label: 'Beats', value: beatCount, icon: Music },
    { label: 'Locations', value: locationCount, icon: MapPin },
    { label: 'Scenes', value: sceneCount, icon: Clapperboard },
    { label: 'Events', value: eventCount, icon: Calendar },
    { label: 'Arcs', value: arcCount, icon: TrendingUp },
    { label: 'Objects', value: objectCount, icon: Gem },
    { label: 'Factions', value: factionCount, icon: Shield },
    { label: 'Themes', value: themeCount, icon: Lightbulb },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Globe className="h-8 w-8 text-muted-foreground" />
          <h1 className="text-2xl font-bold">{world.name}</h1>
          {world.genre && (
            <Badge variant="secondary">{world.genre}</Badge>
          )}
        </div>
        {world.description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {world.description}
          </p>
        )}
        {world.logline && (
          <p className="mt-2 text-sm italic text-muted-foreground">
            {world.logline}
          </p>
        )}
      </div>

      {/* Stats Grid or Empty State */}
      {totalEntities === 0 ? (
        <EmptyState
          icon={Rocket}
          title="Your story world is empty"
          description="Start building your world by adding characters, beats, locations, or any other story elements. Use the quick links below to get started."
        />
      ) : (
        <div>
          <h2 className="text-lg font-semibold mb-3">Overview</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label}>
                  <CardContent className="flex items-center gap-3 pt-4">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Links</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {quickLinks(worldId).map((link) => {
            const Icon = link.icon
            return (
              <Link key={link.href} href={link.href}>
                <Card className="transition-shadow hover:shadow-md cursor-pointer">
                  <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-sm">{link.label}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
