'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useCharacters } from '@/lib/hooks/use-characters'
import { useCharacterStore } from '@/stores/character-store'
import { useLayoutStore } from '@/stores/layout-store'

interface CharacterListPanelProps {
  characters?: Array<{ id: string; name: string; avatarUrl?: string }>
  onCharacterClick?: (id: string) => void
}

export function CharacterListPanel({ characters: propCharacters, onCharacterClick }: CharacterListPanelProps) {
  const params = useParams<{ id: string }>()
  const worldId = params?.id ?? ''
  const { data, isLoading } = useCharacters(worldId)
  const { selectedCharacterId, setSelectedCharacterId } = useCharacterStore()
  const { setInspectorOpen } = useLayoutStore()
  const [filter, setFilter] = useState('')

  const characters = data?.data?.map((c) => ({ id: c.id, name: c.name })) ?? propCharacters ?? []

  function handleClick(id: string) {
    setSelectedCharacterId(id)
    setInspectorOpen(true)
    onCharacterClick?.(id)
  }

  const filtered = characters.filter((c) =>
    c.name.toLowerCase().includes(filter.toLowerCase())
  )

  if (isLoading && worldId) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1.5">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter characters..."
          className="pl-7 h-7 text-sm"
        />
      </div>
      <div className="space-y-1">
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground py-1">
            {characters.length === 0 ? 'No characters yet' : 'No matches'}
          </p>
        )}
        {filtered.map((character) => (
          <button
            key={character.id}
            type="button"
            onClick={() => handleClick(character.id)}
            className={
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors text-left' +
              (selectedCharacterId === character.id ? ' bg-accent' : '')
            }
          >
            <Avatar size="sm">
              <AvatarFallback className="text-[10px]">
                {character.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{character.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
