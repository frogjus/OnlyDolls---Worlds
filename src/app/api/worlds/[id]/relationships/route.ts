import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { relationshipQueries } from '@/lib/db/relationship-queries'
import type { CreateRelationshipPayload } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [, errorResponse] = await requireWorldAuth(id)
    if (errorResponse) return errorResponse

    const relationships = await relationshipQueries.list(id)
    return NextResponse.json({ data: relationships, total: relationships.length })
  } catch (error) {
    console.error('[Relationships GET]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [, errorResponse] = await requireWorldAuth(id)
    if (errorResponse) return errorResponse

    const body = (await request.json()) as CreateRelationshipPayload

    if (!body.type?.trim()) {
      return NextResponse.json(
        { error: 'Type is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }
    if (!body.characterAId) {
      return NextResponse.json(
        { error: 'characterAId is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }
    if (!body.characterBId) {
      return NextResponse.json(
        { error: 'characterBId is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const relationship = await relationshipQueries.create({
      storyWorldId: id,
      type: body.type.trim(),
      subtype: body.subtype,
      intensity: body.intensity,
      description: body.description,
      bidirectional: body.bidirectional,
      character1Id: body.characterAId,
      character2Id: body.characterBId,
      validFromEventId: body.validFromEventId,
      validToEventId: body.validToEventId,
    })

    return NextResponse.json({ data: relationship }, { status: 201 })
  } catch (error) {
    console.error('[Relationships POST]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
