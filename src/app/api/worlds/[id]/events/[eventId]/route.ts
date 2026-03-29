import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { verifyWorldOwnership } from '@/lib/db/queries'
import { eventQueries } from '@/lib/db/event-queries'
import { syncWorldToMemory } from '@/lib/supermemory/sync'
import type { UpdateEventPayload } from '@/types'

type Params = { params: Promise<{ id: string; eventId: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
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
  } catch (error) {
    console.error('[Events GET]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
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
    syncWorldToMemory(id).catch(console.error)
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[Events PATCH]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
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
  } catch (error) {
    console.error('[Events DELETE]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
