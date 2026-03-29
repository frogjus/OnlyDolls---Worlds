import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

// =============================================================================
// Soft-delete filter — reuse everywhere
// =============================================================================

const notDeleted = { deletedAt: null }

// =============================================================================
// World Queries
// =============================================================================

export const worldQueries = {
  list(ownerId: string) {
    return prisma.storyWorld.findMany({
      where: { ownerId, ...notDeleted },
      orderBy: { updatedAt: 'desc' },
    })
  },

  getById(id: string, ownerId: string) {
    return prisma.storyWorld.findFirst({
      where: { id, ownerId, ...notDeleted },
    })
  },

  create(data: Prisma.StoryWorldCreateInput) {
    return prisma.storyWorld.create({ data })
  },

  update(id: string, ownerId: string, data: Prisma.StoryWorldUpdateInput) {
    return prisma.storyWorld.updateMany({
      where: { id, ownerId, ...notDeleted },
      data,
    })
  },

  softDelete(id: string, ownerId: string) {
    return prisma.storyWorld.updateMany({
      where: { id, ownerId, ...notDeleted },
      data: { deletedAt: new Date() },
    })
  },
}

// =============================================================================
// Character Queries
// =============================================================================

export const characterQueries = {
  list(storyWorldId: string) {
    return prisma.character.findMany({
      where: { storyWorldId, ...notDeleted },
      orderBy: { name: 'asc' },
    })
  },

  getById(id: string, storyWorldId: string) {
    return prisma.character.findFirst({
      where: { id, storyWorldId, ...notDeleted },
    })
  },

  create(data: Prisma.CharacterUncheckedCreateInput) {
    return prisma.character.create({ data })
  },

  update(
    id: string,
    storyWorldId: string,
    data: Prisma.CharacterUpdateInput
  ) {
    return prisma.character.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data,
    })
  },

  softDelete(id: string, storyWorldId: string) {
    return prisma.character.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data: { deletedAt: new Date() },
    })
  },
}

// =============================================================================
// Beat Queries
// =============================================================================

export const beatQueries = {
  list(storyWorldId: string) {
    return prisma.beat.findMany({
      where: { storyWorldId, ...notDeleted },
      include: {
        character: { select: { id: true, name: true } },
        sequence: { select: { actId: true, act: { select: { id: true, name: true } } } },
      },
      orderBy: { position: 'asc' },
    })
  },

  getById(id: string, storyWorldId: string) {
    return prisma.beat.findFirst({
      where: { id, storyWorldId, ...notDeleted },
      include: {
        character: { select: { id: true, name: true } },
        sequence: { select: { actId: true, act: { select: { id: true, name: true } } } },
      },
    })
  },

  create(data: Prisma.BeatUncheckedCreateInput) {
    return prisma.beat.create({
      data,
      include: { character: { select: { id: true, name: true } } },
    })
  },

  update(id: string, storyWorldId: string, data: Prisma.BeatUpdateInput) {
    return prisma.beat.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data,
    })
  },

  softDelete(id: string, storyWorldId: string) {
    return prisma.beat.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data: { deletedAt: new Date() },
    })
  },

  async reorder(
    storyWorldId: string,
    updates: { id: string; position: number; status?: string }[]
  ) {
    return prisma.$transaction(
      updates.map((u) =>
        prisma.beat.updateMany({
          where: { id: u.id, storyWorldId, ...notDeleted },
          data: { position: u.position, ...(u.status && { status: u.status }) },
        })
      )
    )
  },

  /** Get the next position value for new beats */
  async nextPosition(storyWorldId: string) {
    const last = await prisma.beat.findFirst({
      where: { storyWorldId, ...notDeleted },
      orderBy: { position: 'desc' },
      select: { position: true },
    })
    return (last?.position ?? 0) + 1
  },
}

// =============================================================================
// Auth helper: verify world ownership
// =============================================================================

export async function verifyWorldOwnership(
  worldId: string,
  userId: string
): Promise<boolean> {
  const world = await prisma.storyWorld.findFirst({
    where: { id: worldId, ownerId: userId, ...notDeleted },
    select: { id: true },
  })
  return !!world
}
