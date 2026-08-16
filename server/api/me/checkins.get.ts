// Per-user check-in list for the season page's client-only found badges.
//
// 401 for anonymous viewers (the only client that ever calls this —
// `/seasons/[slug]`'s SSR HTML stays anonymous-identical and cacheable).
// `?season=<slug>` is required: returns `{ locationSlug, checkedInAt }`
// for the current user within that season. `answers` is never touched
// here (it is not even selected — it belongs to the location, not the
// check-in), and `storyText` is irrelevant to this view.
//
// This route is consumed by an `onMounted` fetch on `/seasons/[slug]`,
// so it is NetworkOnly inside the service worker by virtue of the
// existing `/api/` runtime rule — no SW change needed.
import type { SeasonCheckIn } from '~~/shared/types/season'
import { prisma } from '../../db'
import { requireUser } from '../../utils/session'

export default defineEventHandler(async (event): Promise<SeasonCheckIn[]> => {
  const user = await requireUser(event)

  const query = getQuery(event)
  const seasonSlug = typeof query.season === 'string' ? query.season : null
  if (!seasonSlug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing season' })
  }

  const checkins = await prisma.checkIn.findMany({
    where: {
      userId: user.id,
      location: { season: { slug: seasonSlug } }
    },
    select: {
      createdAt: true,
      location: { select: { slug: true } }
    }
  })

  return checkins.map((c) => ({
    locationSlug: c.location.slug,
    checkedInAt: c.createdAt.toISOString()
  }))
})