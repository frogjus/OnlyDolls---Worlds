import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { verifyWorldOwnership } from '@/lib/db/queries'
import { prisma } from '@/lib/db/prisma'

type Params = { params: Promise<{ id: string; sourceId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const [user, err] = await requireAuth()
  if (err) return err

  const { id, sourceId } = await params
  if (!(await verifyWorldOwnership(id, user.id))) {
    return NextResponse.json(
      { error: 'World not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const source = await prisma.sourceMaterial.findFirst({
    where: { id: sourceId, storyWorldId: id, deletedAt: null },
  })

  if (!source) {
    return NextResponse.json(
      { error: 'Source not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  // Extract entities from metadata if present
  const metadata = (source.metadata ?? {}) as Record<string, unknown>
  const entities = Array.isArray(metadata.entities) ? metadata.entities : []

  return NextResponse.json({
    data: {
      ...source,
      entities,
    },
  })
}
