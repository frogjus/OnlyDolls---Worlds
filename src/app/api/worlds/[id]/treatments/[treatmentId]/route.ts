import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { treatmentQueries } from '@/lib/db/treatment-queries'
import type { UpdateTreatmentPayload } from '@/types'

type Params = { params: Promise<{ id: string; treatmentId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id, treatmentId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const treatment = await treatmentQueries.getById(treatmentId, id)
  if (!treatment) {
    return NextResponse.json(
      { error: 'Treatment not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: treatment })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id, treatmentId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const body = (await request.json()) as UpdateTreatmentPayload
  const result = await treatmentQueries.update(treatmentId, id, body)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Treatment not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const updated = await treatmentQueries.getById(treatmentId, id)
  return NextResponse.json({ data: updated })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, treatmentId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const result = await treatmentQueries.softDelete(treatmentId, id)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Treatment not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: { deleted: true } })
}
