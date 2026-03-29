import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { locationQueries } from '@/lib/db/location-queries'
import { syncWorldToMemory } from '@/lib/supermemory/sync'
import type { UpdateLocationPayload } from '@/types'

type Params = { params: Promise<{ id: string; locationId: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
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
  } catch (error) {
    console.error('[Locations GET]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
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
    syncWorldToMemory(id).catch(console.error)
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[Locations PATCH]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
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
  } catch (error) {
    console.error('[Locations DELETE]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
