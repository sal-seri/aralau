// Public season payloads shared between the API layer and the app.
// These are the ONLY fields the public endpoints may expose —
// `answers`, `question` and `storyText` must never appear here.
// DB strings (title, description) are Russian-only by design.

export type PublicSeasonStatus = 'active' | 'closed' | 'frozen'

export interface SeasonListItem {
  slug: string
  title: string
  description: string | null
  status: PublicSeasonStatus
  startsAt: string | null
  endsAt: string | null
  locationCount: number
}

// Upcoming (`draft`) season as the book's TOC needs it: the count of
// upcoming seasons is public («жабық» rows), but slug/title/dates and the
// place count must NOT leak — everything but `order` is nulled.
export interface SeasonDraftItem {
  order: number
  status: 'draft'
  slug: null
  title: null
  description: null
  startsAt: null
  endsAt: null
  locationCount: null
}

// One TOC line: a visible season or a redacted draft placeholder.
export type SeasonTocEntry = SeasonListItem | SeasonDraftItem

export function isDraftEntry(entry: SeasonTocEntry): entry is SeasonDraftItem {
  return entry.status === 'draft'
}

export interface SeasonLocationItem {
  slug: string
  title: string
  order: number
}

export interface SeasonDetail {
  slug: string
  title: string
  description: string | null
  status: PublicSeasonStatus
  startsAt: string | null
  endsAt: string | null
  locations: SeasonLocationItem[]
}

// Stamp placement on the season's stamp sheet, CSS px (see
// server/utils/stampPlacement.ts): computed once at check-in creation,
// persisted, immutable. Always populated in API responses — null stored
// coords are resolved deterministically server-side.
export interface StampPlacement {
  left: number
  top: number
  rot: number
}

// Per-user check-in entry for the current viewer inside one season.
// Returned by `/api/me/checkins?season=<slug>` — never embedded in the
// public season payload, so the season's SSR HTML stays anonymous-identical
// and cacheable. `checkedInAt` is an ISO 8601 string (server-absolute instant).
export interface SeasonCheckIn {
  locationSlug: string
  checkedInAt: string
  stamp: StampPlacement
}

// Where the reader left off — drives the title page's continue CTA.
// `seasonOrder` is the 1-based TOC rank (i, ii, iii…) of the target season.
export type ContinueTarget =
  | {
      kind: 'none'
      seasonSlug: null
      placeSlug: null
      seasonTitle: null
      seasonOrder: null
    }
  | {
      kind: 'season-start' | 'place' | 'season-next'
      seasonSlug: string
      placeSlug: string | null
      seasonTitle: string
      seasonOrder: number
    }

// `/api/me/progress` payload (session required, `private, no-store`).
// `placesTotal` counts every published place in the volume — including
// seasons still locked as draft — because the «мөрлер» row reads progress
// against the whole book (3 / 9 in the design while ii–iii are locked).
// `seasons` lists visible seasons only, each with the reader's found count
// and, once every published place of that season is found, the ISO instant
// of the completing check-in (`completedAt`, else null).
export interface SeasonProgress {
  foundTotal: number
  placesTotal: number
  lastStampAt: string | null
  seasons: {
    slug: string
    found: number
    completedAt: string | null
  }[]
  continue: ContinueTarget
}
