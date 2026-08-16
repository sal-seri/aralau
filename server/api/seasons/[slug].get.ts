// Public season detail — anonymous, cacheable, SEO-consumed.
// Unknown slug or draft season → 404. Locations are filtered to published
// ones and expose `slug, title, order` only — orientText/question/answers/
// storyText are served per-place in later steps, never from here.
import type { SeasonDetail } from '~~/shared/types/season'
import { prisma } from '../../db'

export default defineEventHandler(async (event): Promise<SeasonDetail> => {
  const slug = getRouterParam(event, 'slug')
  const now = new Date()

  if (!slug) {
    throw createError({ statusCode: 404, statusMessage: 'Season not found' })
  }

  const season = await prisma.season.findUnique({
    where: { slug },
    select: {
      slug: true,
      title: true,
      description: true,
      status: true,
      startsAt: true,
      endsAt: true,
      locations: {
        where: { publishedAt: { lte: now } },
        orderBy: { order: 'asc' },
        select: { slug: true, title: true, order: true }
      }
    }
  })

  if (!season || season.status === 'draft') {
    throw createError({ statusCode: 404, statusMessage: 'Season not found' })
  }

  return {
    slug: season.slug,
    title: season.title,
    description: season.description,
    status: season.status,
    startsAt: season.startsAt?.toISOString() ?? null,
    endsAt: season.endsAt?.toISOString() ?? null,
    locations: season.locations.map((location) => ({
      slug: location.slug,
      title: location.title,
      order: location.order
    }))
  }
})
