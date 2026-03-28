import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { characterQueries, verifyWorldOwnership } from '@/lib/db/queries'
import type { UpdateCharacterPayload } from '@/types'

type Params = { params: Promise<{ id: string; characterId: string }> }

export async function GET(_request: Request, { params }: Params) {
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
}

export async function PATCH(request: Request, { params }: Params) {
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
  return NextResponse.json({ data: updated })
}

export async function DELETE(_request: Request, { params }: Params) {
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
}
