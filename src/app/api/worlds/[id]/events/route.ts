import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { verifyWorldOwnership } from '@/lib/db/queries'
import { eventQueries } from '@/lib/db/event-queries'
import { syncWorldToMemory } from '@/lib/supermemory/sync'
import type { CreateEventPayload } from '@/types'

export async function GET(
  _request: Request,
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

  const events = await eventQueries.list(id)
  return NextResponse.json({ data: events, total: events.length })
}

export async function POST(
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

  const body = (await request.json()) as CreateEventPayload
  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: 'Name is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const event = await eventQueries.create({
    storyWorldId: id,
    name: body.name.trim(),
    description: body.description,
    fabulaPosition: body.fabulaPosition,
    fabulaDate: body.fabulaDate,
    isKeyEvent: body.isKeyEvent,
    locationId: body.locationId,
  })

  syncWorldToMemory(id).catch(console.error)
  return NextResponse.json({ data: event }, { status: 201 })
}
