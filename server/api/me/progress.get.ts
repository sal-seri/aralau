// Per-reader progress for the title page («титул»): totals for the «мөрлер»
// row, per-season found counts for the TOC merge, and the `continue`
// target that drives the CTA:
//   - no active seasons                → none
//   - foundTotal == 0                  → season-start (earliest active season)
//   - S = earliest active season with unfound published places:
//       S.found > 0                    → place (first unfound place in S by order)
//       S.found == 0                   → season-next (earlier seasons complete)
//   - all active seasons fully found   → none
//
// `placesTotal` counts published places across the WHOLE volume (draft
// seasons included) — the «мөрлер» row reads «2 / 9» while seasons ii–iii
// are still locked, per design 12b. Season titles of drafts never appear
// here (only visible seasons are listed). Session required; the response
// is per-user, so it is `private, no-store`.
import type { ContinueTarget, SeasonProgress } from '~~/shared/types/season'
import { prisma } from '../../db'
import { requireUser } from '../../utils/session'

export default defineEventHandler(async (event): Promise<SeasonProgress> => {
  setHeader(event, 'Cache-Control', 'private, no-store')

  const user = await requireUser(event)
  const now = new Date()

  const [seasons, checkIns] = await Promise.all([
    prisma.season.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: {
        slug: true,
        title: true,
        status: true,
        locations: {
          where: { publishedAt: { lte: now } },
          orderBy: { order: 'asc' },
          select: { id: true, slug: true }
        }
      }
    }),
    prisma.checkIn.findMany({
      where: {
        userId: user.id,
        location: { publishedAt: { lte: now } }
      },
      select: { createdAt: true, locationId: true }
    })
  ])

  // 1-based TOC rank (i, ii, iii…) across ALL seasons, drafts included.
  const rankBySlug = new Map(seasons.map((season, index) => [season.slug, index + 1]))

  const foundLocationIds = new Set(checkIns.map((checkIn) => checkIn.locationId))
  const checkInByLocationId = new Map(checkIns.map((checkIn) => [checkIn.locationId, checkIn]))

  const visible = seasons.filter((season) => season.status !== 'draft')

  let foundTotal = 0
  let lastStampAt: Date | null = null
  const seasonRows: SeasonProgress['seasons'] = []
  // For the continue rules: visible seasons keep their published places
  // (ordered) plus the per-season found count.
  const seasonState: {
    season: (typeof visible)[number]
    locations: (typeof visible)[number]['locations']
    found: number
  }[] = []

  for (const season of visible) {
    let found = 0
    // the completing stamp is the latest of the season's check-ins
    let lastSeasonStampAt: Date | null = null

    for (const location of season.locations) {
      const checkIn = checkInByLocationId.get(location.id)
      if (!checkIn) continue
      found += 1
      if (!lastStampAt || checkIn.createdAt > lastStampAt) lastStampAt = checkIn.createdAt
      if (!lastSeasonStampAt || checkIn.createdAt > lastSeasonStampAt) {
        lastSeasonStampAt = checkIn.createdAt
      }
    }
    foundTotal += found

    const complete = season.locations.length > 0 && found === season.locations.length
    seasonRows.push({
      slug: season.slug,
      found,
      completedAt: complete && lastSeasonStampAt ? lastSeasonStampAt.toISOString() : null
    })

    seasonState.push({ season, locations: season.locations, found })
  }

  // ---- continue target --------------------------------------------------
  let continueTarget: ContinueTarget = {
    kind: 'none',
    seasonSlug: null,
    placeSlug: null,
    seasonTitle: null,
    seasonOrder: null
  }

  const active = seasonState.filter((state) => state.season.status === 'active')
  const earliest = active[0]

  if (earliest) {
    if (foundTotal === 0) {
      continueTarget = {
        kind: 'season-start',
        seasonSlug: earliest.season.slug,
        placeSlug: null,
        seasonTitle: earliest.season.title,
        seasonOrder: rankBySlug.get(earliest.season.slug) ?? 1
      }
    } else {
      // earliest active season with at least one unfound published place
      const target =
        active.find((state) => state.locations.some((loc) => !foundLocationIds.has(loc.id))) ??
        null
      if (target) {
        const seasonOrder = rankBySlug.get(target.season.slug) ?? 1
        if (target.found > 0) {
          const nextPlace = target.locations.find((loc) => !foundLocationIds.has(loc.id))
          continueTarget = {
            kind: 'place',
            seasonSlug: target.season.slug,
            placeSlug: nextPlace?.slug ?? null,
            seasonTitle: target.season.title,
            seasonOrder
          }
        } else {
          continueTarget = {
            kind: 'season-next',
            seasonSlug: target.season.slug,
            placeSlug: null,
            seasonTitle: target.season.title,
            seasonOrder
          }
        }
      }
    }
  }

  return {
    foundTotal,
    placesTotal: seasons.reduce((sum, season) => sum + season.locations.length, 0),
    lastStampAt: lastStampAt?.toISOString() ?? null,
    seasons: seasonRows,
    continue: continueTarget
  }
})
