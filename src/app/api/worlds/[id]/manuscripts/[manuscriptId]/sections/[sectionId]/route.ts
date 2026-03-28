import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { manuscriptQueries, sectionQueries } from '@/lib/db/manuscript-queries'
import type { UpdateManuscriptSectionPayload } from '@/types'

type Params = { params: Promise<{ id: string; manuscriptId: string; sectionId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id, manuscriptId, sectionId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const manuscript = await manuscriptQueries.getById(manuscriptId, id)
  if (!manuscript) {
    return NextResponse.json(
      { error: 'Manuscript not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const section = await sectionQueries.getById(sectionId, manuscriptId)
  if (!section) {
    return NextResponse.json(
      { error: 'Section not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: section })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id, manuscriptId, sectionId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const manuscript = await manuscriptQueries.getById(manuscriptId, id)
  if (!manuscript) {
    return NextResponse.json(
      { error: 'Manuscript not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const body = (await request.json()) as UpdateManuscriptSectionPayload
  const { sectionType, ...rest } = body
  const updateData = {
    ...rest,
    ...(sectionType !== undefined && { type: sectionType }),
  }

  const result = await sectionQueries.update(sectionId, manuscriptId, updateData)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Section not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const updated = await sectionQueries.getById(sectionId, manuscriptId)
  return NextResponse.json({ data: updated })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, manuscriptId, sectionId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const manuscript = await manuscriptQueries.getById(manuscriptId, id)
  if (!manuscript) {
    return NextResponse.json(
      { error: 'Manuscript not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const result = await sectionQueries.softDelete(sectionId, manuscriptId)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Section not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: { deleted: true } })
}
