// Public place detail — personalized per viewer.
//
// Returns 404 for an unknown slug, an unpublished location, or a location
// whose season is `draft` (draft seasons are invisible to the public).
//
// `question` and `orientText` are public (visible to anonymous readers
// by design — the orientation only tells you where to look, not the
// answer). `storyText` is gated: the API includes it ONLY when
// `viewer.found === true`. `answers` never appears in the payload — the
// `select` whitelist omits it and matching happens server-side only.
//
// Conscious deviation from Step 4's anonymous/cacheable rule: this endpoint
// personalizes its response by reading the check-in for the current viewer,
// so it MUST NOT be served from a shared cache. Send `Cache-Control:
// private, no-store` and rely on the cookie-bearing request each time.
import type { PublicSeasonStatus } from '~~/shared/types/season'
import type { PlaceDetail } from '~~/shared/types/place'
import { prisma } from '../../db'
import { getSessionUser } from '../../utils/session'

export default defineEventHandler(async (event): Promise<PlaceDetail> => {
  setHeader(event, 'Cache-Control', 'private, no-store')

  const slug = getRouterParam(event, 'slug')
  const now = new Date()

  if (!slug) {
    throw createError({ statusCode: 404, statusMessage: 'Place not found' })
  }

  // `Location.slug` is not globally `@unique` by schema (only
  // `@@unique([seasonId, slug])`), but the app's URL space treats slugs
  // as globally unique — `findFirst` enforces this convention without
  // needing a schema migration.
  const location = await prisma.location.findFirst({
    where: {
      slug,
      publishedAt: { lte: now },
      season: { status: { not: 'draft' } }
    },
    select: {
      id: true,
      slug: true,
      title: true,
      orientText: true,
      question: true,
      storyText: true,
      season: { select: { slug: true, title: true, status: true } }
    }
  })

  if (!location) {
    throw createError({ statusCode: 404, statusMessage: 'Place not found' })
  }

  // Per-viewer state. Anonymous → empty viewer with found=false.
  // A signed-in user is resolved from the cookie only (cheap; this is a
  // read route, not a mutation, so `getSessionUser` is enough).
  const sessionUser = await getSessionUser(event)
  let found = false
  let checkedInAt: string | null = null

  if (sessionUser) {
    const checkIn = await prisma.checkIn.findUnique({
      where: { userId_locationId: { userId: sessionUser.id, locationId: location.id } },
      select: { createdAt: true }
    })
    if (checkIn) {
      found = true
      checkedInAt = checkIn.createdAt.toISOString()
    }
  }

  const place: PlaceDetail = {
    slug: location.slug,
    title: location.title,
    orientText: location.orientText,
    question: location.question,
    season: {
      slug: location.season.slug,
      title: location.season.title,
      // narrowed by the where-clause above ('draft' can never reach here)
      status: location.season.status as PublicSeasonStatus
    },
    viewer: { found, checkedInAt }
  }

  if (found) {
    place.storyText = location.storyText
  }

  return place
})