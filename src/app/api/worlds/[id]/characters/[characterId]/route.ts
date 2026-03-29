import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { characterQueries, verifyWorldOwnership } from '@/lib/db/queries'
import { syncWorldToMemory } from '@/lib/supermemory/sync'
import type { UpdateCharacterPayload } from '@/types'

type Params = { params: Promise<{ id: string; characterId: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const [user, err] = await requireAuth()
    if (err) return err

    const { id, characterId } = await params
    if (!(await verifyWorldOwnership(id, user.id))) {
      return NextResponse.json(
        { error: 'World not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const character = await characterQueries.getById(characterId, id)
    if (!character) {
      return NextResponse.json(
        { error: 'Character not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: character })
  } catch (error) {
    console.error('[Characters GET]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const [user, err] = await requireAuth()
    if (err) return err

    const { id, characterId } = await params
    if (!(await verifyWorldOwnership(id, user.id))) {
      return NextResponse.json(
        { error: 'World not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const body = (await request.json()) as UpdateCharacterPayload
    const result = await characterQueries.update(characterId, id, body)
    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Character not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const updated = await characterQueries.getById(characterId, id)
    syncWorldToMemory(id).catch(console.error)
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[Characters PATCH]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const [user, err] = await requireAuth()
    if (err) return err

    const { id, characterId } = await params
    if (!(await verifyWorldOwnership(id, user.id))) {
      return NextResponse.json(
        { error: 'World not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const result = await characterQueries.softDelete(characterId, id)
    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Character not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    console.error('[Characters DELETE]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
