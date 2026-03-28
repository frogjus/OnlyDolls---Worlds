import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

const notDeleted = { deletedAt: null }

export const themeQueries = {
  list(storyWorldId: string) {
    return prisma.theme.findMany({
      where: { storyWorldId, ...notDeleted },
      orderBy: { name: 'asc' },
    })
  },

  getById(id: string, storyWorldId: string) {
    return prisma.theme.findFirst({
      where: { id, storyWorldId, ...notDeleted },
    })
  },

  create(data: Prisma.ThemeUncheckedCreateInput) {
    return prisma.theme.create({ data })
  },

  update(id: string, storyWorldId: string, data: Prisma.ThemeUpdateInput) {
    return prisma.theme.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data,
    })
  },

  softDelete(id: string, storyWorldId: string) {
    return prisma.theme.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data: { deletedAt: new Date() },
    })
  },
}
