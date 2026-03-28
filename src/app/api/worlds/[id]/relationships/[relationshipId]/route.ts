import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { relationshipQueries } from '@/lib/db/relationship-queries'
import type { UpdateRelationshipPayload } from '@/types'

type Params = { params: Promise<{ id: string; relationshipId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id, relationshipId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const relationship = await relationshipQueries.getById(relationshipId, id)
  if (!relationship) {
    return NextResponse.json(
      { error: 'Relationship not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: relationship })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id, relationshipId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const body = (await request.json()) as UpdateRelationshipPayload
  const result = await relationshipQueries.update(relationshipId, id, body)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Relationship not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const updated = await relationshipQueries.getById(relationshipId, id)
  return NextResponse.json({ data: updated })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, relationshipId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const result = await relationshipQueries.softDelete(relationshipId, id)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Relationship not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: { deleted: true } })
}
