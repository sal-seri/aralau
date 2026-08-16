// Session helpers on top of nuxt-auth-utils.
//
// - getSessionUser: cheap read of the sealed-cookie snapshot (non-mutating routes)
// - requireUser: re-fetches the user from the DB and 401s if gone — mutating
//   API routes MUST use this, never the cookie snapshot alone.
import type { H3Event } from 'h3'
import { prisma } from '../db'

export interface SessionUser {
  id: string
  handle: string | null
  role: 'USER' | 'ADMIN'
  email: string
}

type DbUser = { id: string; handle: string | null; role: 'USER' | 'ADMIN'; email: string }

export function toSessionUser(user: DbUser): SessionUser {
  return { id: user.id, handle: user.handle, role: user.role, email: user.email }
}

export async function getSessionUser(event: H3Event): Promise<SessionUser | null> {
  const session = await getUserSession(event)
  return session.user ?? null
}

export async function requireUser(event: H3Event): Promise<SessionUser> {
  const sessionUser = await getSessionUser(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } })
  if (!user) {
    await clearUserSession(event)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return toSessionUser(user)
}
