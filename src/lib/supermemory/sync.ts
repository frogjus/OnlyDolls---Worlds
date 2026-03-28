import { getSuperMemoryClient } from './client'
import { prisma } from '@/lib/db/prisma'
import type { SyncResult, SearchResult } from './types'

/**
 * Sync a story world's key data to SuperMemory for semantic search
 * and contradiction detection.
 */
export async function syncWorldToMemory(worldId: string): Promise<SyncResult> {
  const client = getSuperMemoryClient(worldId)

  const result: SyncResult = {
    success: true,
    memoriesCreated: 0,
    memoriesUpdated: 0,
    errors: [],
  }

  const world = await prisma.storyWorld.findUnique({
    where: { id: worldId },
    select: {
      name: true,
      description: true,
      logline: true,
      characters: {
        select: {
          id: true,
          name: true,
          description: true,
          backstory: true,
          archetype: true,
        },
      },
      beats: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      locations: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      events: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  })

  if (!world) {
    return { success: false, memoriesCreated: 0, memoriesUpdated: 0, errors: ['World not found'] }
  }

  // Sync world overview
  try {
    const worldContent = [
      `Story World: ${world.name}`,
      world.logline ? `Logline: ${world.logline}` : null,
      world.description ? `Description: ${world.description}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    await client.addMemory(worldContent, {
      type: 'world_overview',
      worldId,
    })
    result.memoriesCreated++
  } catch (error) {
    result.errors.push(
      `Failed to sync world overview: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  // Sync characters
  for (const character of world.characters) {
    try {
      const content = [
        `Character: ${character.name}`,
        character.archetype ? `Archetype: ${character.archetype}` : null,
        character.description ?? null,
        character.backstory ? `Backstory: ${character.backstory}` : null,
      ]
        .filter(Boolean)
        .join('\n')

      await client.addMemory(content, {
        type: 'character',
        entityId: character.id,
        worldId,
      })
      result.memoriesCreated++
    } catch (error) {
      result.errors.push(
        `Failed to sync character ${character.name}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  // Sync beats
  for (const beat of world.beats) {
    try {
      const content = [
        `Beat: ${beat.name}`,
        beat.description ?? null,
      ]
        .filter(Boolean)
        .join('\n')

      await client.addMemory(content, {
        type: 'beat',
        entityId: beat.id,
        worldId,
      })
      result.memoriesCreated++
    } catch (error) {
      result.errors.push(
        `Failed to sync beat ${beat.name}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  // Sync locations
  for (const location of world.locations) {
    try {
      const content = [
        `Location: ${location.name}`,
        location.description ?? null,
      ]
        .filter(Boolean)
        .join('\n')

      await client.addMemory(content, {
        type: 'location',
        entityId: location.id,
        worldId,
      })
      result.memoriesCreated++
    } catch (error) {
      result.errors.push(
        `Failed to sync location ${location.name}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  // Sync events
  for (const event of world.events) {
    try {
      const content = [
        `Event: ${event.name}`,
        event.description ?? null,
      ]
        .filter(Boolean)
        .join('\n')

      await client.addMemory(content, {
        type: 'event',
        entityId: event.id,
        worldId,
      })
      result.memoriesCreated++
    } catch (error) {
      result.errors.push(
        `Failed to sync event ${event.name}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  result.success = result.errors.length === 0

  return result
}

/**
 * Search world memories via SuperMemory semantic search.
 */
export async function searchWorldMemory(
  worldId: string,
  query: string,
  limit = 10
): Promise<SearchResult[]> {
  const client = getSuperMemoryClient(worldId)
  return client.search(query, limit)
}
