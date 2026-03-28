import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { actQueries } from '@/lib/db/act-queries'
import type { CreateActPayload } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  const acts = await actQueries.list(id)
  return NextResponse.json({ data: acts, total: acts.length })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  const body = (await request.json()) as CreateActPayload
  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: 'Name is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const act = await actQueries.create({
    storyWorldId: id,
    name: body.name.trim(),
    description: body.description,
    position: body.position ?? 0,
  })

  return NextResponse.json({ data: act }, { status: 201 })
}
