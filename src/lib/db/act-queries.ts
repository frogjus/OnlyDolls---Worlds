import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

const notDeleted = { deletedAt: null }

const actInclude = {
  sequences: {
    orderBy: { position: 'asc' as const },
    select: { id: true, name: true, position: true },
  },
}

export const actQueries = {
  list(storyWorldId: string) {
    return prisma.act.findMany({
      where: { storyWorldId, ...notDeleted },
      include: actInclude,
      orderBy: { position: 'asc' },
    })
  },

  getById(id: string, storyWorldId: string) {
    return prisma.act.findFirst({
      where: { id, storyWorldId, ...notDeleted },
      include: actInclude,
    })
  },

  create(data: Prisma.ActUncheckedCreateInput) {
    return prisma.act.create({
      data,
      include: actInclude,
    })
  },

  update(id: string, storyWorldId: string, data: Prisma.ActUpdateInput) {
    return prisma.act.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data,
    })
  },

  softDelete(id: string, storyWorldId: string) {
    return prisma.act.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data: { deletedAt: new Date() },
    })
  },
}
