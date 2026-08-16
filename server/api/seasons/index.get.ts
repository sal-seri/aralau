// Public season list — anonymous, cacheable, SEO-consumed.
// Only `active | closed | frozen` seasons are exposed; `draft` never appears.
// Explicit `select` keeps answers/question/storyText out of the payload.
import type { PublicSeasonStatus, SeasonListItem } from '~~/shared/types/season'
import { prisma } from '../../db'

export default defineEventHandler(async (): Promise<SeasonListItem[]> => {
  const now = new Date()

  const seasons = await prisma.season.findMany({
    where: { status: { in: ['active', 'closed', 'frozen'] } },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: {
      slug: true,
      title: true,
      description: true,
      status: true,
      startsAt: true,
      endsAt: true,
      _count: {
        select: {
          locations: { where: { publishedAt: { lte: now } } }
        }
      }
    }
  })

  return seasons.map((season) => ({
    slug: season.slug,
    title: season.title,
    description: season.description,
    // narrowed by the where-clause above ('draft' can never reach here)
    status: season.status as PublicSeasonStatus,
    startsAt: season.startsAt?.toISOString() ?? null,
    endsAt: season.endsAt?.toISOString() ?? null,
    locationCount: season._count.locations
  }))
})
