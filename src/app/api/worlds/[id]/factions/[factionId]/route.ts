import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { factionQueries } from '@/lib/db/faction-queries'
import type { UpdateFactionPayload } from '@/types'

type Params = { params: Promise<{ id: string; factionId: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id, factionId } = await params
    const [, errorResponse] = await requireWorldAuth(id)
    if (errorResponse) return errorResponse

    const faction = await factionQueries.getById(factionId, id)
    if (!faction) {
      return NextResponse.json(
        { error: 'Faction not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: faction })
  } catch (error) {
    console.error('[Factions GET]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id, factionId } = await params
    const [, errorResponse] = await requireWorldAuth(id)
    if (errorResponse) return errorResponse

    const body = (await request.json()) as UpdateFactionPayload
    const result = await factionQueries.update(factionId, id, {
      name: body.name,
      description: body.description,
      type: body.factionType,
      goals: body.goals,
      resources: body.resources,
    })
    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Faction not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const updated = await factionQueries.getById(factionId, id)
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[Factions PATCH]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id, factionId } = await params
    const [, errorResponse] = await requireWorldAuth(id)
    if (errorResponse) return errorResponse

    const result = await factionQueries.softDelete(factionId, id)
    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Faction not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    console.error('[Factions DELETE]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
