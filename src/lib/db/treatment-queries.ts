import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

const notDeleted = { deletedAt: null }

export const treatmentQueries = {
  list(storyWorldId: string) {
    return prisma.treatment.findMany({
      where: { storyWorldId, ...notDeleted },
      orderBy: { updatedAt: 'desc' },
    })
  },

  getById(id: string, storyWorldId: string) {
    return prisma.treatment.findFirst({
      where: { id, storyWorldId, ...notDeleted },
    })
  },

  create(data: Prisma.TreatmentUncheckedCreateInput) {
    return prisma.treatment.create({ data })
  },

  update(id: string, storyWorldId: string, data: Prisma.TreatmentUpdateInput) {
    return prisma.treatment.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data,
    })
  },

  softDelete(id: string, storyWorldId: string) {
    return prisma.treatment.updateMany({
      where: { id, storyWorldId, ...notDeleted },
      data: { deletedAt: new Date() },
    })
  },
}
