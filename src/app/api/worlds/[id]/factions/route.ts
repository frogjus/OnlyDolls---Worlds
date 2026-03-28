import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { factionQueries } from '@/lib/db/faction-queries'
import type { CreateFactionPayload } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const factions = await factionQueries.list(id)
  return NextResponse.json({ data: factions, total: factions.length })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const body = (await request.json()) as CreateFactionPayload
  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: 'Name is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const faction = await factionQueries.create({
    storyWorldId: id,
    name: body.name.trim(),
    description: body.description,
    type: body.factionType,
    goals: body.goals ?? undefined,
    resources: body.resources ?? undefined,
  })

  return NextResponse.json({ data: faction }, { status: 201 })
}
