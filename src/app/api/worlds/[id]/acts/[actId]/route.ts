import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { actQueries } from '@/lib/db/act-queries'
import type { UpdateActPayload } from '@/types'

type Params = { params: Promise<{ id: string; actId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id, actId } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  const act = await actQueries.getById(actId, id)
  if (!act) {
    return NextResponse.json(
      { error: 'Act not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: act })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id, actId } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  const body = (await request.json()) as UpdateActPayload
  const result = await actQueries.update(actId, id, body)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Act not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const updated = await actQueries.getById(actId, id)
  return NextResponse.json({ data: updated })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, actId } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  const result = await actQueries.softDelete(actId, id)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Act not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: { deleted: true } })
}
