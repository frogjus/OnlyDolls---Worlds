import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { sourceQueries } from '@/lib/db/source-queries'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  const sources = await sourceQueries.list(id)

  return NextResponse.json({
    data: sources,
    total: sources.length,
  })
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const title = body.title
  if (!title || typeof title !== 'string') {
    return NextResponse.json(
      { error: 'title is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const source = await sourceQueries.create({
    title,
    type: typeof body.sourceType === 'string' ? body.sourceType : null,
    author: typeof body.author === 'string' ? body.author : null,
    url: typeof body.url === 'string' ? body.url : null,
    content: typeof body.content === 'string' ? body.content : null,
    notes: typeof body.notes === 'string' ? body.notes : null,
    storyWorldId: id,
  })

  return NextResponse.json({ data: source }, { status: 201 })
}
