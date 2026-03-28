import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { commentQueries } from '@/lib/db/comment-queries'
import type { UpdateCommentPayload } from '@/types'

type Params = { params: Promise<{ id: string; commentId: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const { id, commentId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const body = (await request.json()) as UpdateCommentPayload
  if (!body.content?.trim()) {
    return NextResponse.json(
      { error: 'Content is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const result = await commentQueries.update(commentId, id, {
    body: body.content.trim(),
  })
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Comment not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const updated = await commentQueries.getById(commentId, id)
  return NextResponse.json({ data: updated })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, commentId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const result = await commentQueries.softDelete(commentId, id)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Comment not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: { deleted: true } })
}
