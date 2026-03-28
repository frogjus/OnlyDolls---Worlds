import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

const notDeleted = { deletedAt: null }

export const objectQueries = {
  list(storyWorldId: string) {
    return prisma.storyObject.findMany({
      where: { storyWorldId, ...notDeleted },
      orderBy: { name: 'asc' },
    })
  },

  getById(id: string, storyWorldId: string) {
    return prisma.storyObject.findFirst({
      where: { id, storyWorldId, ...notDeleted },
    })
  },

  create(data: Prisma.StoryObjectUncheckedCreateInput) {
    return prisma.storyObject.create({ data })
  },

  update(id: string, storyWorldId: string, data: Prisma.StoryObjectUpdateInput) {
    return prisma.storyObject.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data,
    })
  },

  softDelete(id: string, storyWorldId: string) {
    return prisma.storyObject.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data: { deletedAt: new Date() },
    })
  },
}
