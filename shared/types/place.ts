// Public place payload shared between the API layer and the app.
//
// `answers` has no field here: it must NEVER leave the server — matching
// happens server-side only. `storyText` is gated by the viewer's found
// state: the API includes it ONLY when `viewer.found === true`, so the
// field is declared optional. The contract is enforced by the API route's
// explicit `select` whitelist (see `server/api/places/[slug].get.ts`).
import type { PublicSeasonStatus, StampPlacement } from './season'

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

// `POST /api/places/[slug]/checkin` payload. A wrong guess never reveals
// match details — just whether the per-minute rate-limit window has calls
// left. A right guess (fresh or already-found) always carries a resolved
// stamp placement and the unlocked story.
export interface CheckinWrongResult {
  correct: false
  attemptsLeft: number
}

export interface CheckinSuccessResult {
  correct: true
  alreadyFound: boolean
  checkedInAt: string
  stamp: StampPlacement
  storyText: string | null
}

export type CheckinResult = CheckinWrongResult | CheckinSuccessResult