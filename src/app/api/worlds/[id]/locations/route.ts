import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { locationQueries } from '@/lib/db/location-queries'
import type { CreateLocationPayload } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const locations = await locationQueries.list(id)
  return NextResponse.json({ data: locations, total: locations.length })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const body = (await request.json()) as CreateLocationPayload
  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: 'Name is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const location = await locationQueries.create({
    storyWorldId: id,
    name: body.name.trim(),
    description: body.description,
    type: body.locationType,
    parentId: body.parentId,
    coordinates: body.coordinates ?? undefined,
    properties: body.properties ?? undefined,
  })

  return NextResponse.json({ data: location }, { status: 201 })
}
