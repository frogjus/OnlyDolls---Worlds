import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

const notDeleted = { deletedAt: null }

export const tagQueries = {
  list(storyWorldId: string, targetType?: string, targetId?: string) {
    const where: Prisma.TagWhereInput = {
      storyWorldId,
      ...notDeleted,
    }
    if (targetType && targetId) {
      where.targetType = targetType
      where.targetId = targetId
    }
    return prisma.tag.findMany({
      where,
      orderBy: { name: 'asc' },
    })
  },

  create(data: Prisma.TagUncheckedCreateInput) {
    return prisma.tag.create({ data })
  },

  softDelete(id: string, storyWorldId: string) {
    return prisma.tag.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data: { deletedAt: new Date() },
    })
  },
}
