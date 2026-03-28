import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { sequenceQueries } from '@/lib/db/sequence-queries'
import type { CreateSequencePayload } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  const sequences = await sequenceQueries.list(id)
  return NextResponse.json({ data: sequences, total: sequences.length })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  const body = (await request.json()) as CreateSequencePayload
  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: 'Name is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const sequence = await sequenceQueries.create({
    storyWorldId: id,
    name: body.name.trim(),
    description: body.description,
    position: body.position ?? 0,
    actId: body.actId ?? undefined,
  })

  return NextResponse.json({ data: sequence }, { status: 201 })
}
