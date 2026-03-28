import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { arcQueries } from '@/lib/db/arc-queries'
import type { UpdateArcPayload } from '@/types'

type Params = { params: Promise<{ id: string; arcId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id, arcId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const arc = await arcQueries.getById(arcId, id)
  if (!arc) {
    return NextResponse.json(
      { error: 'Arc not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: arc })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id, arcId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const body = (await request.json()) as UpdateArcPayload
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.arcType !== undefined) data.type = body.arcType
  if (body.description !== undefined) data.description = body.description
  if (body.characterId !== undefined) data.characterId = body.characterId

  const result = await arcQueries.update(arcId, id, data)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Arc not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const updated = await arcQueries.getById(arcId, id)
  return NextResponse.json({ data: updated })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, arcId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const result = await arcQueries.softDelete(arcId, id)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Arc not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: { deleted: true } })
}
