import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { arcQueries, arcPhaseQueries } from '@/lib/db/arc-queries'
import type { CreateArcPhasePayload } from '@/types'

type Params = { params: Promise<{ id: string; arcId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id, arcId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const arc = await arcQueries.getById(arcId, id)
  if (!arc) {
    return NextResponse.json(
      { error: 'Arc not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const phases = await arcPhaseQueries.list(arcId)
  return NextResponse.json({ data: phases, total: phases.length })
}

export async function POST(request: Request, { params }: Params) {
  const { id, arcId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const arc = await arcQueries.getById(arcId, id)
  if (!arc) {
    return NextResponse.json(
      { error: 'Arc not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const body = (await request.json()) as CreateArcPhasePayload
  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: 'Name is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const phase = await arcPhaseQueries.create({
    arcId,
    name: body.name.trim(),
    description: body.description,
    position: body.position,
    state: body.state,
    targetType: body.targetType,
    targetId: body.targetId,
  })

  return NextResponse.json({ data: phase }, { status: 201 })
}
