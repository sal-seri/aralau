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
