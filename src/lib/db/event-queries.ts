import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

const notDeleted = { deletedAt: null }

const eventIncludes = {
  participants: {
    include: { character: { select: { id: true, name: true } } },
  },
  location: { select: { id: true, name: true } },
} satisfies Prisma.EventInclude

export const eventQueries = {
  list(storyWorldId: string) {
    return prisma.event.findMany({
      where: { storyWorldId, ...notDeleted },
      include: eventIncludes,
      orderBy: { fabulaPosition: { sort: 'asc', nulls: 'last' } },
    })
  },

  getById(id: string, storyWorldId: string) {
    return prisma.event.findFirst({
      where: { id, storyWorldId, ...notDeleted },
      include: eventIncludes,
    })
  },

  create(data: Prisma.EventUncheckedCreateInput) {
    return prisma.event.create({
      data,
      include: eventIncludes,
    })
  },

  update(id: string, storyWorldId: string, data: Prisma.EventUpdateInput) {
    return prisma.event.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data,
    })
  },

  softDelete(id: string, storyWorldId: string) {
    return prisma.event.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data: { deletedAt: new Date() },
    })
  },
}
