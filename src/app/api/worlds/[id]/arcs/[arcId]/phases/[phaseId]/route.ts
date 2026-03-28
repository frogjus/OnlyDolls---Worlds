import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { arcQueries, arcPhaseQueries } from '@/lib/db/arc-queries'
import type { UpdateArcPhasePayload } from '@/types'

type Params = { params: Promise<{ id: string; arcId: string; phaseId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id, arcId, phaseId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const arc = await arcQueries.getById(arcId, id)
  if (!arc) {
    return NextResponse.json(
      { error: 'Arc not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const phase = await arcPhaseQueries.getById(phaseId, arcId)
  if (!phase) {
    return NextResponse.json(
      { error: 'Phase not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: phase })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id, arcId, phaseId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const arc = await arcQueries.getById(arcId, id)
  if (!arc) {
    return NextResponse.json(
      { error: 'Arc not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const body = (await request.json()) as UpdateArcPhasePayload
  const result = await arcPhaseQueries.update(phaseId, arcId, body)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Phase not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const updated = await arcPhaseQueries.getById(phaseId, arcId)
  return NextResponse.json({ data: updated })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, arcId, phaseId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const arc = await arcQueries.getById(arcId, id)
  if (!arc) {
    return NextResponse.json(
      { error: 'Arc not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const result = await arcPhaseQueries.delete(phaseId, arcId)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Phase not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: { deleted: true } })
}
