import { z } from 'zod'
import { parseHandle } from '../../../shared/utils/handle'
import { prisma } from '../../db'
import { requireUser } from '../../utils/session'

const bodySchema = z.object({ handle: z.string() })

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002'
}

// Sets the handle of the signed-in user. Re-validates with the same Zod
// schema used on the client; the DB unique constraint is the final arbiter.
export default defineEventHandler(async (event) => {
  const sessionUser = await requireUser(event)

  const raw = bodySchema.safeParse(await readBody(event))
  if (!raw.success) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request' })
  }

  const parsed = parseHandle(raw.data.handle)
  if (!parsed.ok) {
    throw createError({ statusCode: 422, statusMessage: 'Unprocessable Entity', data: { reason: parsed.reason } })
  }

  if (sessionUser.handle) {
    // handle is chosen once during onboarding
    throw createError({ statusCode: 409, statusMessage: 'Conflict', data: { reason: 'taken' } })
  }

  try {
    const user = await prisma.user.update({
      where: { id: sessionUser.id },
      data: { handle: parsed.handle }
    })

    await replaceUserSession(event, { user: toSessionUser(user) })

    return { ok: true, handle: user.handle }
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw createError({ statusCode: 409, statusMessage: 'Conflict', data: { reason: 'taken' } })
    }
    throw error
  }
})
