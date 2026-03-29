import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { sourceQueries } from '@/lib/db/source-queries'

type Params = { params: Promise<{ id: string; sourceId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id, sourceId } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  const source = await sourceQueries.getById(sourceId, id)

  if (!source) {
    return NextResponse.json(
      { error: 'Source not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  // Extract entities from metadata if present
  const metadata = (source.metadata ?? {}) as Record<string, unknown>
  const entities = Array.isArray(metadata.entities) ? metadata.entities : []

  return NextResponse.json({
    data: {
      ...source,
      entities,
    },
  })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id, sourceId } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  const existing = await sourceQueries.getById(sourceId, id)
  if (!existing) {
    return NextResponse.json(
      { error: 'Source not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const data: Record<string, unknown> = {}
  if (typeof body.title === 'string') data.title = body.title
  if (typeof body.sourceType === 'string') data.type = body.sourceType
  if (typeof body.author === 'string') data.author = body.author
  if (typeof body.url === 'string') data.url = body.url
  if (typeof body.content === 'string') data.content = body.content
  if (typeof body.notes === 'string') data.notes = body.notes

  await sourceQueries.update(sourceId, id, data)

  const updated = await sourceQueries.getById(sourceId, id)
  return NextResponse.json({ data: updated })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, sourceId } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  const existing = await sourceQueries.getById(sourceId, id)
  if (!existing) {
    return NextResponse.json(
      { error: 'Source not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  await sourceQueries.softDelete(sourceId, id)
  return NextResponse.json({ data: existing })
}
