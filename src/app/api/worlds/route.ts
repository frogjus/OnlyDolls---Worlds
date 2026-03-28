import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { worldQueries } from '@/lib/db/queries'
import type { CreateWorldPayload } from '@/types'

export async function GET() {
  const [user, err] = await requireAuth()
  if (err) return err

  const worlds = await worldQueries.list(user.id)
  return NextResponse.json({ data: worlds, total: worlds.length })
}

export async function POST(request: Request) {
  const [user, err] = await requireAuth()
  if (err) return err

  const body = (await request.json()) as CreateWorldPayload
  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: 'Name is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const world = await worldQueries.create({
    name: body.name.trim(),
    description: body.description,
    genre: body.genre,
    logline: body.logline,
    owner: { connect: { id: user.id } },
  })

  return NextResponse.json({ data: world }, { status: 201 })
}
