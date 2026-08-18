// Public place payload shared between the API layer and the app.
//
// `answers` has no field here: it must NEVER leave the server — matching
// happens server-side only. `storyText` is gated by the viewer's found
// state: the API includes it ONLY when `viewer.found === true`, so the
// field is declared optional. The contract is enforced by the API route's
// explicit `select` whitelist (see `server/api/places/[slug].get.ts`).
import type { PublicSeasonStatus } from './season'

export interface PlaceViewerState {
  found: boolean
  checkedInAt: string | null
}

export interface PlaceSeasonRef {
  slug: string
  title: string
  status: PublicSeasonStatus
}

// Next published location of the same season by `order` — drives the
// found state's «Следующее место · {roman}» CTA. Null when this is the
// last place of the season.
export interface PlaceNextRef {
  slug: string
  order: number
}

export interface PlaceDetail {
  slug: string
  title: string
  // Location order inside its season (1-based) — roman numeral, «ед. хр.»
  // unit and the spine all derive from it.
  order: number
  orientText: string
  question: string
  season: PlaceSeasonRef
  viewer: PlaceViewerState
  nextPlace: PlaceNextRef | null
  // Present (incl. null) only when `viewer.found === true`; omitted otherwise.
  storyText?: string | null
}