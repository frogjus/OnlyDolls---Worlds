import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { beatQueries, verifyWorldOwnership } from '@/lib/db/queries'
import type { UpdateBeatPayload } from '@/types'

type Params = { params: Promise<{ id: string; beatId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const [user, err] = await requireAuth()
  if (err) return err

  const { id, beatId } = await params
  if (!(await verifyWorldOwnership(id, user.id))) {
    return NextResponse.json(
      { error: 'World not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const beat = await beatQueries.getById(beatId, id)
  if (!beat) {
    return NextResponse.json(
      { error: 'Beat not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: beat })
}

export async function PATCH(request: Request, { params }: Params) {
  const [user, err] = await requireAuth()
  if (err) return err

  const { id, beatId } = await params
  if (!(await verifyWorldOwnership(id, user.id))) {
    return NextResponse.json(
      { error: 'World not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const body = (await request.json()) as UpdateBeatPayload
  const result = await beatQueries.update(beatId, id, body)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Beat not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const updated = await beatQueries.getById(beatId, id)
  return NextResponse.json({ data: updated })
}

export async function DELETE(_request: Request, { params }: Params) {
  const [user, err] = await requireAuth()
  if (err) return err

  const { id, beatId } = await params
  if (!(await verifyWorldOwnership(id, user.id))) {
    return NextResponse.json(
      { error: 'World not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const result = await beatQueries.softDelete(beatId, id)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Beat not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: { deleted: true } })
}
