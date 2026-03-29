import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const [wordCountResult, beatsTotal, beatsDone, characterCount] =
    await Promise.all([
      prisma.manuscriptSection.aggregate({
        where: { manuscript: { storyWorldId: id, deletedAt: null }, deletedAt: null },
        _sum: { wordCount: true },
      }),
      prisma.beat.count({
        where: { storyWorldId: id, deletedAt: null },
      }),
      prisma.beat.count({
        where: { storyWorldId: id, deletedAt: null, status: 'done' },
      }),
      prisma.character.count({
        where: { storyWorldId: id, deletedAt: null },
      }),
    ])

  return NextResponse.json({
    data: {
      wordCount: wordCountResult._sum.wordCount ?? 0,
      beatsDone,
      beatsTotal,
      characterCount,
    },
  })
}
