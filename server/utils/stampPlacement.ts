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
//   22px side padding) with a 212px-high sheet and a 104px stamp.
// - A new placement is clamped so the stamp's rotated bounding box always
//   stays fully inside the sheet (rotation grows the box — see
//   `rotationMargin`), and is chosen to keep overlap with every stamp
//   already on the same sheet at or below `MAX_OVERLAP_RATIO` whenever a
//   spot satisfying that exists; otherwise the least-overlapping candidate
//   tried wins (the sheet only ever holds a handful of stamps).

// The wire shape `{ left, top, rot }` lives in shared/types/season.ts
// (single source of truth for the API payload).
import type { StampPlacement } from '../../shared/types/season'

// The three placed stamps from design turn 12d (Season Screen Directions):
// [left, top, rot] within the 346x212 sheet. The first slot's left/top are
// nudged from the original mockup's [2, 8, -11] to [9, 9, -11] — at -11°
// rotation the stamp's bounding box bulges ~9px past its unrotated corner,
// so the original values put it just outside the sheet's left/top edges.
export const STAMP_SLOTS: ReadonlyArray<readonly [number, number, number]> = [
  [9, 9, -11],
  [150, 38, 8],
  [62, 100, -4]
]

const SHEET_WIDTH = 346
const SHEET_HEIGHT = 212
const STAMP_SIZE = 104

const LEFT_MIN = 0
const LEFT_MAX = SHEET_WIDTH - STAMP_SIZE
const TOP_MIN = 0
const TOP_MAX = SHEET_HEIGHT - STAMP_SIZE
const ROT_MIN = -12
const ROT_MAX = 12

// Two stamps may share no more than this fraction of a stamp's area,
// whenever a candidate spot achieving it exists on the sheet.
const MAX_OVERLAP_RATIO = 0.2
const MAX_PLACEMENT_ATTEMPTS = 60

// How far a stamp rotated by `rot` degrees bulges past its unrotated
// (left, top, 104, 104) box, per side, when rotated about its center.
function rotationMargin(rot: number): number {
  const rad = (Math.abs(rot) * Math.PI) / 180
  return (STAMP_SIZE / 2) * (Math.cos(rad) + Math.sin(rad) - 1)
}

// Pulls (left, top) inward, if needed, so the rotated stamp's bounding box
// never crosses the sheet edges.
function clampToSheet(left: number, top: number, rot: number): { left: number; top: number } {
  const margin = rotationMargin(rot)
  const minLeft = Math.max(LEFT_MIN, margin)
  const maxLeft = Math.min(LEFT_MAX, SHEET_WIDTH - STAMP_SIZE - margin)
  const minTop = Math.max(TOP_MIN, margin)
  const maxTop = Math.min(TOP_MAX, SHEET_HEIGHT - STAMP_SIZE - margin)
  return {
    left: Math.min(Math.max(left, minLeft), maxLeft),
    top: Math.min(Math.max(top, minTop), maxTop)
  }
}

// Axis-aligned overlap between two stamps' boxes, as a fraction of one
// stamp's area (0 = no overlap, 1 = fully overlapping).
function overlapRatio(a: StampPlacement, b: StampPlacement): number {
  const xOverlap =
    Math.max(0, Math.min(a.left + STAMP_SIZE, b.left + STAMP_SIZE) - Math.max(a.left, b.left))
  const yOverlap =
    Math.max(0, Math.min(a.top + STAMP_SIZE, b.top + STAMP_SIZE) - Math.max(a.top, b.top))
  return (xOverlap * yOverlap) / (STAMP_SIZE * STAMP_SIZE)
}

function worstOverlap(candidate: StampPlacement, occupied: readonly StampPlacement[]): number {
  let worst = 0
  for (const other of occupied) {
    worst = Math.max(worst, overlapRatio(candidate, other))
  }
  return worst
}

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

// Deterministic placement for a check-in seed string, avoiding heavy
// overlap with the stamps already on the same sheet (`occupied`). The same
// seed + occupied set always yields the same triple, always within bounds.
//
// Draws up to `MAX_PLACEMENT_ATTEMPTS` candidates from the seed's PRNG
// stream and keeps the least-overlapping one, stopping early once a
// candidate is at or below `MAX_OVERLAP_RATIO` against every occupied
// stamp. With no occupied stamps (the sheet's first one), this draws
// exactly once, same as before.
export function generateStampPlacement(
  seed: string,
  occupied: readonly StampPlacement[] = []
): StampPlacement {
  const rand = mulberry32(hashSeed(seed))
  const draw = (): StampPlacement => {
    const left = Math.floor(rand() * (LEFT_MAX - LEFT_MIN + 1)) + LEFT_MIN
    const top = Math.floor(rand() * (TOP_MAX - TOP_MIN + 1)) + TOP_MIN
    const rot = Math.floor(rand() * (ROT_MAX - ROT_MIN + 1)) + ROT_MIN
    return { ...clampToSheet(left, top, rot), rot }
  }

  let best = draw()
  let bestOverlap = worstOverlap(best, occupied)

  for (let attempt = 1; attempt < MAX_PLACEMENT_ATTEMPTS && bestOverlap > MAX_OVERLAP_RATIO; attempt++) {
    const candidate = draw()
    const candidateOverlap = worstOverlap(candidate, occupied)
    if (candidateOverlap < bestOverlap) {
      best = candidate
      bestOverlap = candidateOverlap
    }
  }

  return best
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
