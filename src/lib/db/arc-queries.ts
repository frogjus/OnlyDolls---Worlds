import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

const notDeleted = { deletedAt: null }

// =============================================================================
// Arc Queries
// =============================================================================

export const arcQueries = {
  list(storyWorldId: string) {
    return prisma.arc.findMany({
      where: { storyWorldId, ...notDeleted },
      orderBy: { name: 'asc' },
      include: {
        phases: { orderBy: { position: 'asc' } },
        character: { select: { id: true, name: true } },
      },
    })
  },

  getById(id: string, storyWorldId: string) {
    return prisma.arc.findFirst({
      where: { id, storyWorldId, ...notDeleted },
      include: {
        phases: { orderBy: { position: 'asc' } },
        character: { select: { id: true, name: true } },
      },
    })
  },

  create(data: Prisma.ArcUncheckedCreateInput) {
    return prisma.arc.create({
      data,
      include: {
        phases: { orderBy: { position: 'asc' } },
        character: { select: { id: true, name: true } },
      },
    })
  },

  update(id: string, storyWorldId: string, data: Prisma.ArcUpdateInput) {
    return prisma.arc.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data,
    })
  },

  softDelete(id: string, storyWorldId: string) {
    return prisma.arc.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data: { deletedAt: new Date() },
    })
  },
}

// =============================================================================
// ArcPhase Queries
// =============================================================================

export const arcPhaseQueries = {
  list(arcId: string) {
    return prisma.arcPhase.findMany({
      where: { arcId },
      orderBy: { position: 'asc' },
    })
  },

  getById(id: string, arcId: string) {
    return prisma.arcPhase.findFirst({
      where: { id, arcId },
    })
  },

  create(data: Prisma.ArcPhaseUncheckedCreateInput) {
    return prisma.arcPhase.create({ data })
  },

  update(id: string, arcId: string, data: Prisma.ArcPhaseUpdateInput) {
    return prisma.arcPhase.updateMany({
      where: { id, arcId },
      data,
    })
  },

  delete(id: string, arcId: string) {
    return prisma.arcPhase.deleteMany({
      where: { id, arcId },
    })
  },
}
