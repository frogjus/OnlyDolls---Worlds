import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { commentQueries } from '@/lib/db/comment-queries'
import type { CreateCommentPayload } from '@/types'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const { searchParams } = new URL(request.url)
  const targetType = searchParams.get('targetType')
  const targetId = searchParams.get('targetId')

  const comments = await commentQueries.list(
    id,
    targetType ?? undefined,
    targetId ?? undefined
  )
  return NextResponse.json({ data: comments, total: comments.length })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [user, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const body = (await request.json()) as CreateCommentPayload
  if (!body.content?.trim()) {
    return NextResponse.json(
      { error: 'Content is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }
  if (!body.targetType?.trim()) {
    return NextResponse.json(
      { error: 'Target type is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }
  if (!body.targetId?.trim()) {
    return NextResponse.json(
      { error: 'Target ID is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const comment = await commentQueries.create({
    body: body.content.trim(),
    targetType: body.targetType,
    targetId: body.targetId,
    userId: user.id,
    storyWorldId: id,
    parentId: body.parentId,
  })

  return NextResponse.json({ data: comment }, { status: 201 })
}
