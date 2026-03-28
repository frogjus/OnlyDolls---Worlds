import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { treatmentQueries } from '@/lib/db/treatment-queries'
import type { CreateTreatmentPayload } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const treatments = await treatmentQueries.list(id)
  return NextResponse.json({ data: treatments, total: treatments.length })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const body = (await request.json()) as CreateTreatmentPayload
  if (!body.title?.trim()) {
    return NextResponse.json(
      { error: 'Title is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const treatment = await treatmentQueries.create({
    storyWorldId: id,
    title: body.title.trim(),
    level: body.level,
    content: body.content ?? '',
    version: body.version,
  })

  return NextResponse.json({ data: treatment }, { status: 201 })
}
