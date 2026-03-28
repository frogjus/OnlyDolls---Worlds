import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { motifQueries } from '@/lib/db/motif-queries'
import type { CreateMotifPayload } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const motifs = await motifQueries.list(id)
  return NextResponse.json({ data: motifs, total: motifs.length })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const body = (await request.json()) as CreateMotifPayload
  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: 'Name is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const motif = await motifQueries.create({
    storyWorldId: id,
    name: body.name.trim(),
    description: body.description,
    type: body.motifType,
    occurrences: body.occurrences ?? undefined,
  })

  return NextResponse.json({ data: motif }, { status: 201 })
}
