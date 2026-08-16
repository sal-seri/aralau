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

export interface PlaceDetail {
  slug: string
  title: string
  orientText: string
  question: string
  season: PlaceSeasonRef
  viewer: PlaceViewerState
  // Present (incl. null) only when `viewer.found === true`; omitted otherwise.
  storyText?: string | null
}