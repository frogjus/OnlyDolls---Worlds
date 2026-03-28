import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

const notDeleted = { deletedAt: null }

const sceneIncludes = {
  sceneCharacters: {
    include: { character: { select: { id: true, name: true } } },
  },
  location: { select: { id: true, name: true } },
  beat: { select: { id: true, name: true } },
}

export const sceneQueries = {
  list(storyWorldId: string) {
    return prisma.scene.findMany({
      where: { storyWorldId, ...notDeleted },
      include: sceneIncludes,
      orderBy: { sjuzhetPosition: { sort: 'asc', nulls: 'last' } },
    })
  },

  getById(id: string, storyWorldId: string) {
    return prisma.scene.findFirst({
      where: { id, storyWorldId, ...notDeleted },
      include: sceneIncludes,
    })
  },

  create(data: Prisma.SceneUncheckedCreateInput) {
    return prisma.scene.create({
      data,
      include: sceneIncludes,
    })
  },

  update(id: string, storyWorldId: string, data: Prisma.SceneUpdateInput) {
    return prisma.scene.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data,
    })
  },

  softDelete(id: string, storyWorldId: string) {
    return prisma.scene.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data: { deletedAt: new Date() },
    })
  },
}
