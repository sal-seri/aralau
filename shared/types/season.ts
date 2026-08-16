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
