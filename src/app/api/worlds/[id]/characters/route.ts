import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { characterQueries, verifyWorldOwnership } from '@/lib/db/queries'
import { syncWorldToMemory } from '@/lib/supermemory/sync'
import type { CreateCharacterPayload } from '@/types'

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

  const characters = await characterQueries.list(id)
  return NextResponse.json({ data: characters, total: characters.length })
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

  const body = (await request.json()) as CreateCharacterPayload
  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: 'Name is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const character = await characterQueries.create({
    storyWorldId: id,
    name: body.name.trim(),
    description: body.description,
    backstory: body.backstory,
    physicalDesc: body.physicalDesc,
    psychProfile: body.psychProfile,
    archetype: body.archetype,
    aliases: body.aliases,
    goals: body.goals ?? undefined,
    traits: body.traits ?? undefined,
  })

  syncWorldToMemory(id).catch(console.error)
  return NextResponse.json({ data: character }, { status: 201 })
}
