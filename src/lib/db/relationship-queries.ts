import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

const notDeleted = { deletedAt: null }

const relationshipIncludes = {
  character1: { select: { id: true, name: true } },
  character2: { select: { id: true, name: true } },
  validFromEvent: { select: { id: true, name: true } },
  validToEvent: { select: { id: true, name: true } },
}

export const relationshipQueries = {
  list(storyWorldId: string) {
    return prisma.relationship.findMany({
      where: { storyWorldId, ...notDeleted },
      include: relationshipIncludes,
      orderBy: { createdAt: 'desc' },
    })
  },

  getById(id: string, storyWorldId: string) {
    return prisma.relationship.findFirst({
      where: { id, storyWorldId, ...notDeleted },
      include: relationshipIncludes,
    })
  },

  create(data: Prisma.RelationshipUncheckedCreateInput) {
    return prisma.relationship.create({
      data,
      include: relationshipIncludes,
    })
  },

  update(
    id: string,
    storyWorldId: string,
    data: Prisma.RelationshipUpdateInput
  ) {
    return prisma.relationship.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data,
    })
  },

  softDelete(id: string, storyWorldId: string) {
    return prisma.relationship.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data: { deletedAt: new Date() },
    })
  },
}
