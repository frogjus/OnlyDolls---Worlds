import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { locationQueries } from '@/lib/db/location-queries'
import type { UpdateLocationPayload } from '@/types'

type Params = { params: Promise<{ id: string; locationId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id, locationId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const location = await locationQueries.getById(locationId, id)
  if (!location) {
    return NextResponse.json(
      { error: 'Location not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: location })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id, locationId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const body = (await request.json()) as UpdateLocationPayload
  const updateData: Record<string, unknown> = { ...body }
  if ('locationType' in updateData) {
    updateData.type = updateData.locationType
    delete updateData.locationType
  }

  const result = await locationQueries.update(locationId, id, updateData)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Location not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const updated = await locationQueries.getById(locationId, id)
  return NextResponse.json({ data: updated })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, locationId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const result = await locationQueries.softDelete(locationId, id)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Location not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: { deleted: true } })
}
