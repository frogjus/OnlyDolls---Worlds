import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

const notDeleted = { deletedAt: null }

export const sourceQueries = {
  list(storyWorldId: string) {
    return prisma.sourceMaterial.findMany({
      where: { storyWorldId, ...notDeleted },
      orderBy: { updatedAt: 'desc' },
    })
  },

  getById(id: string, storyWorldId: string) {
    return prisma.sourceMaterial.findFirst({
      where: { id, storyWorldId, ...notDeleted },
    })
  },

  create(data: Prisma.SourceMaterialUncheckedCreateInput) {
    return prisma.sourceMaterial.create({ data })
  },

  update(id: string, storyWorldId: string, data: Prisma.SourceMaterialUpdateInput) {
    return prisma.sourceMaterial.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data,
    })
  },

  softDelete(id: string, storyWorldId: string) {
    return prisma.sourceMaterial.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data: { deletedAt: new Date() },
    })
  },
}
