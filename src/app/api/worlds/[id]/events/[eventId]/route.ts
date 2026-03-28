import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { verifyWorldOwnership } from '@/lib/db/queries'
import { eventQueries } from '@/lib/db/event-queries'
import type { UpdateEventPayload } from '@/types'

type Params = { params: Promise<{ id: string; eventId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const [user, err] = await requireAuth()
  if (err) return err

  const { id, eventId } = await params
  if (!(await verifyWorldOwnership(id, user.id))) {
    return NextResponse.json(
      { error: 'World not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const event = await eventQueries.getById(eventId, id)
  if (!event) {
    return NextResponse.json(
      { error: 'Event not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: event })
}

export async function PATCH(request: Request, { params }: Params) {
  const [user, err] = await requireAuth()
  if (err) return err

  const { id, eventId } = await params
  if (!(await verifyWorldOwnership(id, user.id))) {
    return NextResponse.json(
      { error: 'World not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const body = (await request.json()) as UpdateEventPayload
  const result = await eventQueries.update(eventId, id, body)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Event not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const updated = await eventQueries.getById(eventId, id)
  return NextResponse.json({ data: updated })
}

export async function DELETE(_request: Request, { params }: Params) {
  const [user, err] = await requireAuth()
  if (err) return err

  const { id, eventId } = await params
  if (!(await verifyWorldOwnership(id, user.id))) {
    return NextResponse.json(
      { error: 'World not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const result = await eventQueries.softDelete(eventId, id)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Event not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: { deleted: true } })
}
