import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

const notDeleted = { deletedAt: null }

const commentIncludes = {
  user: { select: { id: true, name: true } },
  replies: {
    where: notDeleted,
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
}

export const commentQueries = {
  list(storyWorldId: string, targetType?: string, targetId?: string) {
    const where: Prisma.CommentWhereInput = {
      storyWorldId,
      parentId: null,
      ...notDeleted,
    }
    if (targetType && targetId) {
      where.targetType = targetType
      where.targetId = targetId
    }
    return prisma.comment.findMany({
      where,
      include: commentIncludes,
      orderBy: { createdAt: 'asc' },
    })
  },

  getById(id: string, storyWorldId: string) {
    return prisma.comment.findFirst({
      where: { id, storyWorldId, ...notDeleted },
      include: commentIncludes,
    })
  },

  create(data: Prisma.CommentUncheckedCreateInput) {
    return prisma.comment.create({
      data,
      include: commentIncludes,
    })
  },

  update(id: string, storyWorldId: string, data: Prisma.CommentUpdateInput) {
    return prisma.comment.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data,
    })
  },

  softDelete(id: string, storyWorldId: string) {
    return prisma.comment.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data: { deletedAt: new Date() },
    })
  },
}
