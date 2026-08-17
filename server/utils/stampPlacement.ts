// Stamp placement on the season's stamp sheet ("almanac book" redesign).
//
// CONTRACT:
// - Placement (left, top, rot) is generated ONCE at check-in creation
//   (Step 6), persisted on the CheckIn row, and NEVER changes afterwards.
// - `null` coords exist only on legacy/seed rows created before this
//   contract; for those, `resolvePlacement` falls back deterministically
//   (design slot by location order, then PRNG by row id), so a null row
//   renders identically forever.
// - Coordinate space: CSS px in the 390px content column (≈346px usable,
//   22px side padding) with a 212px-high sheet and a 104px stamp. Bounds
//   are `left ∈ [0, 240]`, `top ∈ [0, 108]`, `rot ∈ [-12, 12]`; rotation
//   may visually overflow the stamp's box — per the mockup, intentionally.

// The wire shape `{ left, top, rot }` lives in shared/types/season.ts
// (single source of truth for the API payload).
import type { StampPlacement } from '../../shared/types/season'

// The three placed stamps from design turn 12d (Season Screen Directions):
// [left, top, rot] within the 212px sheet.
export const STAMP_SLOTS: ReadonlyArray<readonly [number, number, number]> = [
  [2, 8, -11],
  [150, 38, 8],
  [62, 100, -4]
]

const LEFT_MIN = 0
const LEFT_MAX = 240
const TOP_MIN = 0
const TOP_MAX = 108
const ROT_MIN = -12
const ROT_MAX = 12

// xmur3-style string hash -> 32-bit seed.
function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

// mulberry32 PRNG — tiny, deterministic, good enough spread for placement.
function mulberry32(a: number): () => number {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Deterministic placement for a check-in seed string (the row id): the same
// seed always yields the same integer triple, always within bounds.
export function generateStampPlacement(seed: string): StampPlacement {
  const rand = mulberry32(hashSeed(seed))
  const left = Math.floor(rand() * (LEFT_MAX - LEFT_MIN + 1)) + LEFT_MIN
  const top = Math.floor(rand() * (TOP_MAX - TOP_MIN + 1)) + TOP_MIN
  const rot = Math.floor(rand() * (ROT_MAX - ROT_MIN + 1)) + ROT_MIN
  return { left, top, rot }
}

// Stored check-in fields relevant to placement resolution.
export interface PlacementRow {
  id: string
  stampLeft: number | null
  stampTop: number | null
  stampRot: number | null
}

// Resolution order: stored coords win (they are immutable once written);
// else the design slot for the location's order (1-based) if it exists;
// else deterministic PRNG from the row id. Always returns a placement.
export function resolvePlacement(row: PlacementRow, locationOrder: number): StampPlacement {
  if (
    row.stampLeft !== null &&
    row.stampTop !== null &&
    row.stampRot !== null
  ) {
    return { left: row.stampLeft, top: row.stampTop, rot: row.stampRot }
  }

  const slot = STAMP_SLOTS[locationOrder - 1]
  if (slot) {
    return { left: slot[0], top: slot[1], rot: slot[2] }
  }

  return generateStampPlacement(row.id)
}
