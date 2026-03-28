import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

const notDeleted = { deletedAt: null }

const hierarchyInclude = {
  children: { select: { id: true, name: true } },
  parent: { select: { id: true, name: true } },
}

export const locationQueries = {
  list(storyWorldId: string) {
    return prisma.location.findMany({
      where: { storyWorldId, ...notDeleted },
      include: hierarchyInclude,
      orderBy: { name: 'asc' },
    })
  },

  getById(id: string, storyWorldId: string) {
    return prisma.location.findFirst({
      where: { id, storyWorldId, ...notDeleted },
      include: hierarchyInclude,
    })
  },

  create(data: Prisma.LocationUncheckedCreateInput) {
    return prisma.location.create({
      data,
      include: hierarchyInclude,
    })
  },

  update(id: string, storyWorldId: string, data: Prisma.LocationUpdateInput) {
    return prisma.location.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data,
    })
  },

  softDelete(id: string, storyWorldId: string) {
    return prisma.location.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data: { deletedAt: new Date() },
    })
  },
}
