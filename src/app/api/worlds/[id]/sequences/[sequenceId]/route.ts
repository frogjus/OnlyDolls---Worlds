import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { sequenceQueries } from '@/lib/db/sequence-queries'
import type { UpdateSequencePayload } from '@/types'

type Params = { params: Promise<{ id: string; sequenceId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id, sequenceId } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  const sequence = await sequenceQueries.getById(sequenceId, id)
  if (!sequence) {
    return NextResponse.json(
      { error: 'Sequence not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: sequence })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id, sequenceId } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  const body = (await request.json()) as UpdateSequencePayload
  const result = await sequenceQueries.update(sequenceId, id, body)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Sequence not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const updated = await sequenceQueries.getById(sequenceId, id)
  return NextResponse.json({ data: updated })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, sequenceId } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  const result = await sequenceQueries.softDelete(sequenceId, id)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Sequence not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: { deleted: true } })
}
