import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { manuscriptQueries, sectionQueries } from '@/lib/db/manuscript-queries'
import type { CreateManuscriptSectionPayload } from '@/types'

type Params = { params: Promise<{ id: string; manuscriptId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id, manuscriptId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const manuscript = await manuscriptQueries.getById(manuscriptId, id)
  if (!manuscript) {
    return NextResponse.json(
      { error: 'Manuscript not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const sections = await sectionQueries.list(manuscriptId)
  return NextResponse.json({ data: sections, total: sections.length })
}

export async function POST(request: Request, { params }: Params) {
  const { id, manuscriptId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const manuscript = await manuscriptQueries.getById(manuscriptId, id)
  if (!manuscript) {
    return NextResponse.json(
      { error: 'Manuscript not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const body = (await request.json()) as CreateManuscriptSectionPayload
  if (!body.title?.trim()) {
    return NextResponse.json(
      { error: 'Title is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const section = await sectionQueries.create({
    manuscriptId,
    title: body.title.trim(),
    type: body.sectionType,
    position: body.position,
    content: body.content,
    status: body.status,
    notes: body.notes,
    parentId: body.parentId,
    sceneId: body.sceneId,
  })

  return NextResponse.json({ data: section }, { status: 201 })
}
