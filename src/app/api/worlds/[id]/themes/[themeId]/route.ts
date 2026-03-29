import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { themeQueries } from '@/lib/db/theme-queries'
import type { UpdateThemePayload } from '@/types'

type Params = { params: Promise<{ id: string; themeId: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id, themeId } = await params
    const [, errorResponse] = await requireWorldAuth(id)
    if (errorResponse) return errorResponse

    const theme = await themeQueries.getById(themeId, id)
    if (!theme) {
      return NextResponse.json(
        { error: 'Theme not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: theme })
  } catch (error) {
    console.error('[Themes GET]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id, themeId } = await params
    const [, errorResponse] = await requireWorldAuth(id)
    if (errorResponse) return errorResponse

    const body = (await request.json()) as UpdateThemePayload
    const result = await themeQueries.update(themeId, id, body)
    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Theme not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const updated = await themeQueries.getById(themeId, id)
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[Themes PATCH]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id, themeId } = await params
    const [, errorResponse] = await requireWorldAuth(id)
    if (errorResponse) return errorResponse

    const result = await themeQueries.softDelete(themeId, id)
    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Theme not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    console.error('[Themes DELETE]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
