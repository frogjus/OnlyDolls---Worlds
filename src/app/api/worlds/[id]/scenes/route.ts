import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { sceneQueries } from '@/lib/db/scene-queries'
import type { CreateScenePayload } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [, err] = await requireWorldAuth(id)
    if (err) return err

    const scenes = await sceneQueries.list(id)
    return NextResponse.json({ data: scenes, total: scenes.length })
  } catch (error) {
    console.error('[Scenes GET]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [, err] = await requireWorldAuth(id)
    if (err) return err

    const body = (await request.json()) as CreateScenePayload
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const scene = await sceneQueries.create({
      storyWorldId: id,
      name: body.name.trim(),
      summary: body.summary,
      content: body.content,
      sjuzhetPosition: body.sjuzhetPosition,
      purpose: body.purpose,
      tone: body.tone,
      polarity: body.polarity !== undefined ? String(body.polarity) : undefined,
      wordCountTarget: body.wordCountTarget,
      eventId: body.eventId,
      locationId: body.locationId,
      beatId: body.beatId,
      sequenceId: body.sequenceId,
      actId: body.actId,
    })

    return NextResponse.json({ data: scene }, { status: 201 })
  } catch (error) {
    console.error('[Scenes POST]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
