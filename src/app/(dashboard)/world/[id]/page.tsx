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
} from 'lucide-react'

import type { ApiResponse, ApiListResponse, StoryWorld, Character, Beat } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

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

  const world = worldData?.data
  const characterCount = charsData?.total ?? charsData?.data?.length
  const beatCount = beatsData?.total ?? beatsData?.data?.length

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
    { label: 'Characters', value: characterCount ?? '—' },
    { label: 'Beats', value: beatCount ?? '—' },
    { label: 'Locations', value: '—' },
    { label: 'Scenes', value: '—' },
    { label: 'Events', value: '—' },
    { label: 'Arcs', value: '—' },
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

      {/* Stats Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

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
