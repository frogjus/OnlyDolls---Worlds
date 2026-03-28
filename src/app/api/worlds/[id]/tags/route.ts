import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { tagQueries } from '@/lib/db/tag-queries'
import type { CreateTagPayload } from '@/types'

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

  const tags = await tagQueries.list(
    id,
    targetType ?? undefined,
    targetId ?? undefined
  )
  return NextResponse.json({ data: tags, total: tags.length })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const body = (await request.json()) as CreateTagPayload
  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: 'Name is required', code: 'VALIDATION_ERROR' },
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

  const tag = await tagQueries.create({
    name: body.name.trim(),
    color: body.color,
    targetType: body.targetType,
    targetId: body.targetId,
    storyWorldId: id,
  })

  return NextResponse.json({ data: tag }, { status: 201 })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const { searchParams } = new URL(request.url)
  const tagId = searchParams.get('tagId')
  if (!tagId) {
    return NextResponse.json(
      { error: 'tagId is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const result = await tagQueries.softDelete(tagId, id)
  if (result.count === 0) {
    return NextResponse.json(
      { error: 'Tag not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: { deleted: true } })
}
