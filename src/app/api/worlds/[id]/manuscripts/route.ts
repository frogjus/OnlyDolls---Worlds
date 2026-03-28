import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { manuscriptQueries } from '@/lib/db/manuscript-queries'
import type { CreateManuscriptPayload } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const manuscripts = await manuscriptQueries.list(id)
  return NextResponse.json({ data: manuscripts, total: manuscripts.length })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [user, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const body = (await request.json()) as CreateManuscriptPayload
  if (!body.title?.trim()) {
    return NextResponse.json(
      { error: 'Title is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const manuscript = await manuscriptQueries.create({
    storyWorldId: id,
    authorId: user.id,
    title: body.title.trim(),
    format: body.format,
    status: body.status,
    targetWordCount: body.targetWordCount,
  })

  return NextResponse.json({ data: manuscript }, { status: 201 })
}
