import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { objectQueries } from '@/lib/db/object-queries'
import type { UpdateObjectPayload } from '@/types'

type Params = { params: Promise<{ id: string; objectId: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id, objectId } = await params
    const [, errorResponse] = await requireWorldAuth(id)
    if (errorResponse) return errorResponse

    const object = await objectQueries.getById(objectId, id)
    if (!object) {
      return NextResponse.json(
        { error: 'Object not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: object })
  } catch (error) {
    console.error('[Objects GET]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id, objectId } = await params
    const [, errorResponse] = await requireWorldAuth(id)
    if (errorResponse) return errorResponse

    const body = (await request.json()) as UpdateObjectPayload
    const result = await objectQueries.update(objectId, id, {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.objectType !== undefined && { type: body.objectType }),
      ...(body.significance !== undefined && { significance: body.significance }),
      ...(body.properties !== undefined && { properties: body.properties }),
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Object not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const updated = await objectQueries.getById(objectId, id)
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[Objects PATCH]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id, objectId } = await params
    const [, errorResponse] = await requireWorldAuth(id)
    if (errorResponse) return errorResponse

    const result = await objectQueries.softDelete(objectId, id)
    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Object not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    console.error('[Objects DELETE]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
