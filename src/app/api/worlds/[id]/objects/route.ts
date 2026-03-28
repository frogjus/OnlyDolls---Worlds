import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { objectQueries } from '@/lib/db/object-queries'
import type { CreateObjectPayload } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const objects = await objectQueries.list(id)
  return NextResponse.json({ data: objects, total: objects.length })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const body = (await request.json()) as CreateObjectPayload
  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: 'Name is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const created = await objectQueries.create({
    storyWorldId: id,
    name: body.name.trim(),
    description: body.description,
    type: body.objectType,
    significance: body.significance,
    properties: body.properties ?? undefined,
  })

  return NextResponse.json({ data: created }, { status: 201 })
}
