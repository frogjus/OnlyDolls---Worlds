import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import type { SessionUser } from '@/types'

const DEMO_EMAIL = 'demo@storyforge.dev'
const DEMO_NAME = 'Demo User'

async function getOrCreateDemoUser(): Promise<SessionUser> {
  let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
  if (!user) {
    user = await prisma.user.create({
      data: { email: DEMO_EMAIL, name: DEMO_NAME },
    })
  }
  return { id: user.id, email: user.email, name: user.name }
}

/**
 * Get the authenticated user from the session.
 * Falls back to demo user when no session exists (no-auth mode).
 */
export async function getSessionUser(): Promise<SessionUser> {
  return getOrCreateDemoUser()
}

/**
 * Require authentication. In no-auth mode, always returns the demo user.
 */
export async function requireAuth(): Promise<
  [SessionUser, null] | [null, NextResponse]
> {
  const user = await getSessionUser()
  return [user, null]
}

/**
 * Require auth + world access. In no-auth mode, skips ownership check.
 */
export async function requireWorldAuth(
  worldId: string
): Promise<[SessionUser, null] | [null, NextResponse]> {
  const [user, authError] = await requireAuth()
  if (authError) return [null, authError]

  // In no-auth mode, just verify the world exists
  const world = await prisma.storyWorld.findFirst({
    where: { id: worldId, deletedAt: null },
  })
  if (!world) {
    return [
      null,
      NextResponse.json(
        { error: 'World not found', code: 'NOT_FOUND' },
        { status: 404 }
      ),
    ]
  }
  return [user, null]
}
