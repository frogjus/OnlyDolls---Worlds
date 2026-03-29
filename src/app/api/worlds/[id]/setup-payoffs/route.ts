import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { setupPayoffQueries } from '@/lib/db/setup-payoff-queries'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  const items = await setupPayoffQueries.list(id)
  return NextResponse.json({ data: items, total: items.length })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  const body = await request.json()
  if (!body.setupSceneId?.trim()) {
    return NextResponse.json(
      { error: 'Setup scene is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const item = await setupPayoffQueries.create({
    storyWorldId: id,
    setupSceneId: body.setupSceneId,
    payoffSceneId: body.payoffSceneId ?? null,
    description: body.description,
    setupType: body.setupType,
    status: body.status ?? 'planted',
  })

  return NextResponse.json({ data: item }, { status: 201 })
}
