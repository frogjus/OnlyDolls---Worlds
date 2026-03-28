import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { manuscriptQueries } from '@/lib/db/manuscript-queries'
import type { UpdateManuscriptPayload } from '@/types'

type Params = { params: Promise<{ id: string; manuscriptId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id, manuscriptId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const manuscript = await manuscriptQueries.getById(manuscriptId, id)
  if (!manuscript) {
    return NextResponse.json(
      { error: 'Manuscript not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: manuscript })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id, manuscriptId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const body = (await request.json()) as UpdateManuscriptPayload
  const result = await manuscriptQueries.update(manuscriptId, id, body)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Manuscript not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const updated = await manuscriptQueries.getById(manuscriptId, id)
  return NextResponse.json({ data: updated })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, manuscriptId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const result = await manuscriptQueries.softDelete(manuscriptId, id)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Manuscript not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: { deleted: true } })
}
