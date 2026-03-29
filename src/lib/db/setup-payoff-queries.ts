import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

const setupPayoffIncludes = {
  setupScene: { select: { id: true, name: true, sjuzhetPosition: true } },
  payoffScene: { select: { id: true, name: true, sjuzhetPosition: true } },
}

export const setupPayoffQueries = {
  list(storyWorldId: string) {
    return prisma.setupPayoff.findMany({
      where: { storyWorldId },
      include: setupPayoffIncludes,
      orderBy: { createdAt: 'asc' },
    })
  },

  getById(id: string, storyWorldId: string) {
    return prisma.setupPayoff.findFirst({
      where: { id, storyWorldId },
      include: setupPayoffIncludes,
    })
  },

  create(data: Prisma.SetupPayoffUncheckedCreateInput) {
    return prisma.setupPayoff.create({
      data,
      include: setupPayoffIncludes,
    })
  },

  update(id: string, storyWorldId: string, data: Prisma.SetupPayoffUpdateInput) {
    return prisma.setupPayoff.updateMany({
      where: { id, storyWorldId },
      data,
    })
  },

  delete(id: string, storyWorldId: string) {
    return prisma.setupPayoff.deleteMany({
      where: { id, storyWorldId },
    })
  },
}
