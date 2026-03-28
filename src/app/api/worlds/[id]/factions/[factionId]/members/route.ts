import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { factionQueries, factionMemberQueries } from '@/lib/db/faction-queries'

interface AddMemberPayload {
  characterId: string
  role?: string
  joinedAt?: string
  status?: string
}

interface UpdateMemberPayload {
  role?: string
  joinedAt?: string
  leftAt?: string
  status?: string
}

type Params = { params: Promise<{ id: string; factionId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id, factionId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const faction = await factionQueries.getById(factionId, id)
  if (!faction) {
    return NextResponse.json(
      { error: 'Faction not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const members = await factionMemberQueries.listMembers(factionId)
  return NextResponse.json({ data: members, total: members.length })
}

export async function POST(request: Request, { params }: Params) {
  const { id, factionId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const faction = await factionQueries.getById(factionId, id)
  if (!faction) {
    return NextResponse.json(
      { error: 'Faction not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const body = (await request.json()) as AddMemberPayload
  if (!body.characterId?.trim()) {
    return NextResponse.json(
      { error: 'characterId is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const member = await factionMemberQueries.addMember({
    factionId,
    characterId: body.characterId,
    role: body.role,
    joinedAt: body.joinedAt,
    status: body.status,
  })

  return NextResponse.json({ data: member }, { status: 201 })
}

export async function DELETE(request: Request, { params }: Params) {
  const { id, factionId } = await params
  const [, errorResponse] = await requireWorldAuth(id)
  if (errorResponse) return errorResponse

  const body = (await request.json()) as { characterId: string }
  if (!body.characterId?.trim()) {
    return NextResponse.json(
      { error: 'characterId is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  await factionMemberQueries.removeMember(factionId, body.characterId)
  return NextResponse.json({ data: { deleted: true } })
}
