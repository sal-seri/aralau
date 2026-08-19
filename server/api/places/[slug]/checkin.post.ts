// Answer verification + stamp issuance.
//
// Gating mirrors `[slug].get.ts`'s 404 surface (unknown slug, unpublished
// location, draft season all collapse into one generic 404). Once the
// place resolves, an existing `CheckIn` always short-circuits to success —
// even if the season has since closed — before any rate-limit cost is
// spent. `answers` is selected for server-side matching only and never
// appears on any response, correct or wrong; a wrong guess reveals nothing
// beyond "no" plus the caller's own remaining attempts this minute.
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { CheckinResult } from '~~/shared/types/place'
import { prisma } from '../../../db'
import { requireUser } from '../../../utils/session'
import { checkRateLimit } from '../../../utils/rateLimit'
import { generateStampPlacement, resolvePlacement } from '../../../utils/stampPlacement'
import { checkAnswer } from '../../../utils/answerMatch'

const bodySchema = z.object({ answer: z.string().trim().min(1).max(100) })

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002'
}

export default defineEventHandler(async (event): Promise<CheckinResult> => {
  setHeader(event, 'Cache-Control', 'private, no-store')

  const sessionUser = await requireUser(event)

  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 404, statusMessage: 'Place not found' })
  }

  const raw = bodySchema.safeParse(await readBody(event))
  if (!raw.success) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request' })
  }

  const now = new Date()
  const location = await prisma.location.findFirst({
    where: {
      slug,
      publishedAt: { lte: now },
      season: { status: { not: 'draft' } }
    },
    select: {
      id: true,
      seasonId: true,
      order: true,
      storyText: true,
      answers: true,
      season: { select: { status: true } }
    }
  })

  if (!location) {
    throw createError({ statusCode: 404, statusMessage: 'Place not found' })
  }

  const existing = await prisma.checkIn.findUnique({
    where: { userId_locationId: { userId: sessionUser.id, locationId: location.id } }
  })

  if (existing) {
    return {
      correct: true,
      alreadyFound: true,
      checkedInAt: existing.createdAt.toISOString(),
      stamp: resolvePlacement(existing, location.order),
      storyText: location.storyText
    }
  }

  if (location.season.status !== 'active') {
    throw createError({ statusCode: 409, statusMessage: 'Conflict', data: { reason: 'season_closed' } })
  }

  const rateLimitKey = `checkin:${sessionUser.id}:${location.id}`
  const minuteLimit = checkRateLimit(`${rateLimitKey}:min`, 5, 60_000)
  if (!minuteLimit.allowed) {
    event.node.res.setHeader('Retry-After', String(minuteLimit.retryAfterSec))
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      data: { reason: 'rate_limited', retryAfterSec: minuteLimit.retryAfterSec }
    })
  }

  const dailyLimit = checkRateLimit(`${rateLimitKey}:day`, 20, 24 * 60 * 60 * 1000)
  if (!dailyLimit.allowed) {
    event.node.res.setHeader('Retry-After', String(dailyLimit.retryAfterSec))
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      data: { reason: 'rate_limited', retryAfterSec: dailyLimit.retryAfterSec }
    })
  }

  const answers = Array.isArray(location.answers)
    ? location.answers.filter((value): value is string => typeof value === 'string')
    : []

  if (!checkAnswer(raw.data.answer, answers)) {
    return { correct: false, attemptsLeft: minuteLimit.remaining }
  }

  // Stamps already on this reader's sheet for the season, resolved to
  // concrete coords, so the new one can avoid overlapping them too much.
  const seasonCheckIns = await prisma.checkIn.findMany({
    where: { userId: sessionUser.id, location: { seasonId: location.seasonId } },
    select: {
      id: true,
      stampLeft: true,
      stampTop: true,
      stampRot: true,
      location: { select: { order: true } }
    }
  })
  const occupied = seasonCheckIns.map((checkIn) => resolvePlacement(checkIn, checkIn.location.order))

  const placement = generateStampPlacement(randomUUID(), occupied)

  try {
    const checkIn = await prisma.$transaction((tx) =>
      tx.checkIn.create({
        data: {
          userId: sessionUser.id,
          locationId: location.id,
          stampLeft: placement.left,
          stampTop: placement.top,
          stampRot: placement.rot
        }
      })
    )

    return {
      correct: true,
      alreadyFound: false,
      checkedInAt: checkIn.createdAt.toISOString(),
      stamp: placement,
      storyText: location.storyText
    }
  } catch (error) {
    if (!isUniqueViolation(error)) throw error

    // Concurrent double-submit: the unique constraint on
    // (userId, locationId) lost the race to another request. Treat it the
    // same as the already-found short-circuit above.
    const concurrent = await prisma.checkIn.findUniqueOrThrow({
      where: { userId_locationId: { userId: sessionUser.id, locationId: location.id } }
    })

    return {
      correct: true,
      alreadyFound: true,
      checkedInAt: concurrent.createdAt.toISOString(),
      stamp: resolvePlacement(concurrent, location.order),
      storyText: location.storyText
    }
  }
})
