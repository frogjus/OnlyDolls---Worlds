import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { arcQueries } from '@/lib/db/arc-queries'
import type { CreateArcPayload } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [, errorResponse] = await requireWorldAuth(id)
    if (errorResponse) return errorResponse

    const arcs = await arcQueries.list(id)
    return NextResponse.json({ data: arcs, total: arcs.length })
  } catch (error) {
    console.error('[Arcs GET]', error)
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

    const body = (await request.json()) as CreateArcPayload
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const arc = await arcQueries.create({
      storyWorldId: id,
      name: body.name.trim(),
      type: body.arcType,
      description: body.description,
      characterId: body.characterId,
    })

    return NextResponse.json({ data: arc }, { status: 201 })
  } catch (error) {
    console.error('[Arcs POST]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
