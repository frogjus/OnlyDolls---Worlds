import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { themeQueries } from '@/lib/db/theme-queries'
import type { CreateThemePayload } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const themes = await themeQueries.list(id)
  return NextResponse.json({ data: themes, total: themes.length })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const body = (await request.json()) as CreateThemePayload
  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: 'Name is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const theme = await themeQueries.create({
    storyWorldId: id,
    name: body.name.trim(),
    description: body.description,
    thesis: body.thesis,
  })

  return NextResponse.json({ data: theme }, { status: 201 })
}
