import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

const notDeleted = { deletedAt: null }

const memberInclude = {
  members: {
    include: {
      character: { select: { id: true, name: true } },
    },
  },
}

// =============================================================================
// Faction Queries
// =============================================================================

export const factionQueries = {
  list(storyWorldId: string) {
    return prisma.faction.findMany({
      where: { storyWorldId, ...notDeleted },
      orderBy: { name: 'asc' },
      include: memberInclude,
    })
  },

  getById(id: string, storyWorldId: string) {
    return prisma.faction.findFirst({
      where: { id, storyWorldId, ...notDeleted },
      include: memberInclude,
    })
  },

  create(data: Prisma.FactionUncheckedCreateInput) {
    return prisma.faction.create({
      data,
      include: memberInclude,
    })
  },

  update(id: string, storyWorldId: string, data: Prisma.FactionUpdateInput) {
    return prisma.faction.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data,
    })
  },

  softDelete(id: string, storyWorldId: string) {
    return prisma.faction.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data: { deletedAt: new Date() },
    })
  },
}

// =============================================================================
// Faction Member Queries
// =============================================================================

export const factionMemberQueries = {
  listMembers(factionId: string) {
    return prisma.factionMember.findMany({
      where: { factionId },
      include: { character: { select: { id: true, name: true } } },
    })
  },

  addMember(data: Prisma.FactionMemberUncheckedCreateInput) {
    return prisma.factionMember.create({
      data,
      include: { character: { select: { id: true, name: true } } },
    })
  },

  removeMember(factionId: string, characterId: string) {
    return prisma.factionMember.delete({
      where: { factionId_characterId: { factionId, characterId } },
    })
  },
}
