import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { SessionUser } from '@/types'

/**
 * Get the authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name!,
  }
}

/**
 * Require authentication. Returns the user or a 401 response.
 * Usage in API routes:
 *   const [user, errorResponse] = await requireAuth()
 *   if (errorResponse) return errorResponse
 */
export async function requireAuth(): Promise<
  [SessionUser, null] | [null, NextResponse]
> {
  const user = await getSessionUser()
  if (!user) {
    return [
      null,
      NextResponse.json(
        { error: 'Not authenticated', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    ]
  }
  return [user, null]
}
