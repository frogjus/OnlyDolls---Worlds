import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'
import type { RegisterPayload } from '@/types'

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<RegisterPayload>

  if (!body.name || !body.email || !body.password) {
    return NextResponse.json(
      { error: 'Name, email, and password are required', code: 'VALIDATION' },
      { status: 400 }
    )
  }

  if (body.password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters', code: 'VALIDATION' },
      { status: 400 }
    )
  }

  const passwordHash = await hash(body.password, 12)

  try {
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
      },
      select: { id: true, email: true, name: true },
    })

    return NextResponse.json({ data: user }, { status: 201 })
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Email already registered', code: 'EMAIL_EXISTS' },
        { status: 409 }
      )
    }
    throw err
  }
}
