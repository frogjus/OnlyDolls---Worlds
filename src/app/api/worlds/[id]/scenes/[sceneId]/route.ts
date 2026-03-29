import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { sceneQueries } from '@/lib/db/scene-queries'
import type { UpdateScenePayload } from '@/types'

type Params = { params: Promise<{ id: string; sceneId: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id, sceneId } = await params
    const [, err] = await requireWorldAuth(id)
    if (err) return err

    const scene = await sceneQueries.getById(sceneId, id)
    if (!scene) {
      return NextResponse.json(
        { error: 'Scene not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: scene })
  } catch (error) {
    console.error('[Scenes GET]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id, sceneId } = await params
    const [, err] = await requireWorldAuth(id)
    if (err) return err

    const body = (await request.json()) as UpdateScenePayload
    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.summary !== undefined) updateData.summary = body.summary
    if (body.content !== undefined) updateData.content = body.content
    if (body.sjuzhetPosition !== undefined) updateData.sjuzhetPosition = body.sjuzhetPosition
    if (body.purpose !== undefined) updateData.purpose = body.purpose
    if (body.tone !== undefined) updateData.tone = body.tone
    if (body.polarity !== undefined) updateData.polarity = String(body.polarity)
    if (body.wordCountTarget !== undefined) updateData.wordCountTarget = body.wordCountTarget
    if (body.eventId !== undefined) updateData.eventId = body.eventId
    if (body.locationId !== undefined) updateData.locationId = body.locationId
    if (body.beatId !== undefined) updateData.beatId = body.beatId
    if (body.sequenceId !== undefined) updateData.sequenceId = body.sequenceId
    if (body.actId !== undefined) updateData.actId = body.actId

    const result = await sceneQueries.update(sceneId, id, updateData)
    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Scene not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const updated = await sceneQueries.getById(sceneId, id)
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[Scenes PATCH]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id, sceneId } = await params
    const [, err] = await requireWorldAuth(id)
    if (err) return err

    const result = await sceneQueries.softDelete(sceneId, id)
    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Scene not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    console.error('[Scenes DELETE]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
