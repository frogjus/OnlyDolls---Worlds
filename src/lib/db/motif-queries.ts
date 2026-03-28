import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

const notDeleted = { deletedAt: null }

export const motifQueries = {
  list(storyWorldId: string) {
    return prisma.motif.findMany({
      where: { storyWorldId, ...notDeleted },
      orderBy: { name: 'asc' },
    })
  },

  getById(id: string, storyWorldId: string) {
    return prisma.motif.findFirst({
      where: { id, storyWorldId, ...notDeleted },
    })
  },

  create(data: Prisma.MotifUncheckedCreateInput) {
    return prisma.motif.create({ data })
  },

  update(id: string, storyWorldId: string, data: Prisma.MotifUpdateInput) {
    return prisma.motif.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data,
    })
  },

  softDelete(id: string, storyWorldId: string) {
    return prisma.motif.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data: { deletedAt: new Date() },
    })
  },
}
