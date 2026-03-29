import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

const notDeleted = { deletedAt: null }

// =============================================================================
// Manuscript Queries
// =============================================================================

export const manuscriptQueries = {
  list(storyWorldId: string) {
    return prisma.manuscript.findMany({
      where: { storyWorldId, ...notDeleted },
      include: {
        author: { select: { id: true, name: true } },
        _count: { select: { sections: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
  },

  getById(id: string, storyWorldId: string) {
    return prisma.manuscript.findFirst({
      where: { id, storyWorldId, ...notDeleted },
      include: {
        author: { select: { id: true, name: true } },
        sections: {
          where: notDeleted,
          orderBy: { position: 'asc' },
          select: { id: true, title: true, type: true, position: true, content: true, wordCount: true, status: true },
        },
        _count: { select: { sections: true } },
      },
    })
  },

  create(data: Prisma.ManuscriptUncheckedCreateInput) {
    return prisma.manuscript.create({
      data,
      include: { author: { select: { id: true, name: true } } },
    })
  },

  update(id: string, storyWorldId: string, data: Prisma.ManuscriptUpdateInput) {
    return prisma.manuscript.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data,
    })
  },

  softDelete(id: string, storyWorldId: string) {
    return prisma.manuscript.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data: { deletedAt: new Date() },
    })
  },
}

// =============================================================================
// Manuscript Section Queries
// =============================================================================

export const sectionQueries = {
  list(manuscriptId: string) {
    return prisma.manuscriptSection.findMany({
      where: { manuscriptId, ...notDeleted },
      include: {
        scene: { select: { id: true, name: true } },
        children: {
          select: { id: true, title: true, position: true },
          where: notDeleted,
        },
      },
      orderBy: { position: 'asc' },
    })
  },

  getById(id: string, manuscriptId: string) {
    return prisma.manuscriptSection.findFirst({
      where: { id, manuscriptId, ...notDeleted },
      include: {
        scene: { select: { id: true, name: true } },
        children: {
          select: { id: true, title: true, position: true },
          where: notDeleted,
        },
      },
    })
  },

  create(data: Prisma.ManuscriptSectionUncheckedCreateInput) {
    return prisma.manuscriptSection.create({
      data,
      include: {
        scene: { select: { id: true, name: true } },
        children: {
          select: { id: true, title: true, position: true },
          where: notDeleted,
        },
      },
    })
  },

  update(id: string, manuscriptId: string, data: Prisma.ManuscriptSectionUpdateInput) {
    return prisma.manuscriptSection.updateMany({
      where: { id, manuscriptId, ...notDeleted },
      data,
    })
  },

  softDelete(id: string, manuscriptId: string) {
    return prisma.manuscriptSection.updateMany({
      where: { id, manuscriptId, ...notDeleted },
      data: { deletedAt: new Date() },
    })
  },
}
