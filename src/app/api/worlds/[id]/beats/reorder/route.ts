import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { beatQueries, verifyWorldOwnership } from '@/lib/db/queries'
import type { ReorderBeatsPayload } from '@/types'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, err] = await requireAuth()
  if (err) return err

  const { id } = await params
  if (!(await verifyWorldOwnership(id, user.id))) {
    return NextResponse.json(
      { error: 'World not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const body = (await request.json()) as ReorderBeatsPayload
  if (!Array.isArray(body.beats) || body.beats.length === 0) {
    return NextResponse.json(
      { error: 'Beats array is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  await beatQueries.reorder(id, body.beats)

  const beats = await beatQueries.list(id)
  return NextResponse.json({ data: beats })
}
