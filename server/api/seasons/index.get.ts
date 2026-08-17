// Public season list — anonymous, cacheable, SEO-consumed.
// Every season appears (the book's TOC shows upcoming volumes as locked
// rows), but `draft` seasons are REDACTED: only `order` is real; slug,
// title, description, dates and the place count are nulled so nothing
// about an unpublished season leaks. Visible seasons are unchanged.
// Explicit `select` keeps answers/question/storyText out of the payload.
import type { PublicSeasonStatus, SeasonDraftItem, SeasonTocEntry } from '~~/shared/types/season'
import { prisma } from '../../db'

export default defineEventHandler(async (): Promise<SeasonTocEntry[]> => {
  const now = new Date()

  const seasons = await prisma.season.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: {
      slug: true,
      title: true,
      description: true,
      status: true,
      startsAt: true,
      endsAt: true,
      order: true,
      _count: {
        select: {
          locations: { where: { publishedAt: { lte: now } } }
        }
      }
    }
  })

  return seasons.map((season): SeasonTocEntry => {
    if (season.status === 'draft') {
      const redacted: SeasonDraftItem = {
        order: season.order,
        status: 'draft',
        slug: null,
        title: null,
        description: null,
        startsAt: null,
        endsAt: null,
        locationCount: null
      }
      return redacted
    }
    return {
      slug: season.slug,
      title: season.title,
      description: season.description,
      // narrowed by the branch above ('draft' never reaches here)
      status: season.status as PublicSeasonStatus,
      startsAt: season.startsAt?.toISOString() ?? null,
      endsAt: season.endsAt?.toISOString() ?? null,
      locationCount: season._count.locations
    }
  })
})
