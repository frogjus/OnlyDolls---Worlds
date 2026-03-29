import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { characterQueries } from '@/lib/db/queries'
import { locationQueries } from '@/lib/db/location-queries'
import { eventQueries } from '@/lib/db/event-queries'
import { objectQueries } from '@/lib/db/object-queries'
import { factionQueries } from '@/lib/db/faction-queries'

interface ConfirmEntity {
  name: string
  type: 'character' | 'location' | 'event' | 'item' | 'faction'
  description: string
  confidence: number
}

interface ConfirmPayload {
  entities: ConfirmEntity[]
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  let body: ConfirmPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  if (!Array.isArray(body.entities) || body.entities.length === 0) {
    return NextResponse.json(
      { error: 'entities array is required and must not be empty', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const created: Array<{ id: string; name: string; type: string }> = []
  const errors: Array<{ name: string; type: string; error: string }> = []

  for (const entity of body.entities) {
    if (!entity.name || !entity.type) {
      errors.push({ name: entity.name ?? '', type: entity.type ?? '', error: 'Missing name or type' })
      continue
    }

    try {
      switch (entity.type) {
        case 'character': {
          const record = await characterQueries.create({
            name: entity.name,
            description: entity.description,
            storyWorldId: id,
          })
          created.push({ id: record.id, name: record.name, type: 'character' })
          break
        }
        case 'location': {
          const record = await locationQueries.create({
            name: entity.name,
            description: entity.description,
            storyWorldId: id,
          })
          created.push({ id: record.id, name: record.name, type: 'location' })
          break
        }
        case 'event': {
          const record = await eventQueries.create({
            name: entity.name,
            description: entity.description,
            storyWorldId: id,
          })
          created.push({ id: record.id, name: record.name, type: 'event' })
          break
        }
        case 'item': {
          const record = await objectQueries.create({
            name: entity.name,
            description: entity.description,
            storyWorldId: id,
          })
          created.push({ id: record.id, name: record.name, type: 'item' })
          break
        }
        case 'faction': {
          const record = await factionQueries.create({
            name: entity.name,
            description: entity.description,
            storyWorldId: id,
          })
          created.push({ id: record.id, name: record.name, type: 'faction' })
          break
        }
        default:
          errors.push({ name: entity.name, type: entity.type, error: 'Unknown entity type' })
      }
    } catch (e) {
      errors.push({
        name: entity.name,
        type: entity.type,
        error: e instanceof Error ? e.message : 'Creation failed',
      })
    }
  }

  return NextResponse.json(
    {
      data: {
        created,
        errors,
        totalCreated: created.length,
        totalErrors: errors.length,
      },
    },
    { status: 201 }
  )
}
