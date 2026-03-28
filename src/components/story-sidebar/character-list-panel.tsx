'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface CharacterListPanelProps {
  characters: Array<{ id: string; name: string; avatarUrl?: string }>
  onCharacterClick?: (id: string) => void
}

export function CharacterListPanel({ characters, onCharacterClick }: CharacterListPanelProps) {
  const [filter, setFilter] = useState('')

  const filtered = characters.filter((c) =>
    c.name.toLowerCase().includes(filter.toLowerCase())
  )

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
            onClick={() => onCharacterClick?.(character.id)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors text-left"
          >
            <Avatar size="sm">
              {character.avatarUrl && (
                <AvatarImage src={character.avatarUrl} alt={character.name} />
              )}
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
