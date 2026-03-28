import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { motifQueries } from '@/lib/db/motif-queries'
import type { UpdateMotifPayload } from '@/types'

type Params = { params: Promise<{ id: string; motifId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id, motifId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const motif = await motifQueries.getById(motifId, id)
  if (!motif) {
    return NextResponse.json(
      { error: 'Motif not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: motif })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id, motifId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const body = (await request.json()) as UpdateMotifPayload
  const { motifType, ...rest } = body
  const result = await motifQueries.update(motifId, id, {
    ...rest,
    ...(motifType !== undefined && { type: motifType }),
  })
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Motif not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const updated = await motifQueries.getById(motifId, id)
  return NextResponse.json({ data: updated })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, motifId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const result = await motifQueries.softDelete(motifId, id)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Motif not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: { deleted: true } })
}
