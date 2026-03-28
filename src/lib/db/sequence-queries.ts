import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

const notDeleted = { deletedAt: null }

const sequenceInclude = {
  act: { select: { id: true, name: true } },
}

export const sequenceQueries = {
  list(storyWorldId: string) {
    return prisma.sequence.findMany({
      where: { storyWorldId, ...notDeleted },
      include: sequenceInclude,
      orderBy: { position: 'asc' },
    })
  },

  getById(id: string, storyWorldId: string) {
    return prisma.sequence.findFirst({
      where: { id, storyWorldId, ...notDeleted },
      include: sequenceInclude,
    })
  },

  create(data: Prisma.SequenceUncheckedCreateInput) {
    return prisma.sequence.create({
      data,
      include: sequenceInclude,
    })
  },

  update(id: string, storyWorldId: string, data: Prisma.SequenceUpdateInput) {
    return prisma.sequence.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data,
    })
  },

  softDelete(id: string, storyWorldId: string) {
    return prisma.sequence.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data: { deletedAt: new Date() },
    })
  },
}
