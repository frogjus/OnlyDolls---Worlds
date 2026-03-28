import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { worldQueries } from '@/lib/db/queries'
import type { UpdateWorldPayload } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, err] = await requireAuth()
  if (err) return err

  const { id } = await params
  const world = await worldQueries.getById(id, user.id)
  if (!world) {
    return NextResponse.json(
      { error: 'World not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: world })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, err] = await requireAuth()
  if (err) return err

  const { id } = await params
  const body = (await request.json()) as UpdateWorldPayload

  const result = await worldQueries.update(id, user.id, body)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'World not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const updated = await worldQueries.getById(id, user.id)
  return NextResponse.json({ data: updated })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, err] = await requireAuth()
  if (err) return err

  const { id } = await params
  const result = await worldQueries.softDelete(id, user.id)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'World not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: { deleted: true } })
}
