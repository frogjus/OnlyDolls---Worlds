import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { beatQueries, verifyWorldOwnership } from '@/lib/db/queries'
import type { CreateBeatPayload } from '@/types'

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

  const beats = await beatQueries.list(id)
  return NextResponse.json({ data: beats, total: beats.length })
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

  const body = (await request.json()) as CreateBeatPayload
  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: 'Name is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const position = body.position ?? (await beatQueries.nextPosition(id))

  const beat = await beatQueries.create({
    storyWorldId: id,
    name: body.name.trim(),
    description: body.description,
    color: body.color,
    starRating: body.starRating,
    notes: body.notes,
    status: body.status ?? 'todo',
    characterId: body.characterId ?? undefined,
    sequenceId: body.sequenceId ?? undefined,
    position,
  })

  return NextResponse.json({ data: beat }, { status: 201 })
}
