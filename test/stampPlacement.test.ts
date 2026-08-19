import { describe, expect, it } from 'vitest'
import {
  STAMP_SLOTS,
  generateStampPlacement,
  resolvePlacement
} from '../server/utils/stampPlacement'

describe('generateStampPlacement', () => {
  it('is deterministic for the same seed', () => {
    const a = generateStampPlacement('some-checkin-id')
    const b = generateStampPlacement('some-checkin-id')
    expect(a).toEqual(b)
  })

  it('differs across seeds (in general)', () => {
    const a = generateStampPlacement('seed-a')
    const b = generateStampPlacement('seed-b')
    expect(a).not.toEqual(b)
  })

  it('stays within bounds', () => {
    for (const seed of ['x', 'y', 'z', 'checkin-1', 'checkin-2', crypto.randomUUID()]) {
      const { left, top, rot } = generateStampPlacement(seed)
      expect(left).toBeGreaterThanOrEqual(0)
      expect(left).toBeLessThanOrEqual(240)
      expect(top).toBeGreaterThanOrEqual(0)
      expect(top).toBeLessThanOrEqual(108)
      expect(rot).toBeGreaterThanOrEqual(-12)
      expect(rot).toBeLessThanOrEqual(12)
    }
  })
})

describe('resolvePlacement', () => {
  it('prefers stored coords when all three are non-null', () => {
    const row = { id: 'row-1', stampLeft: 5, stampTop: 6, stampRot: 7 }
    expect(resolvePlacement(row, 1)).toEqual({ left: 5, top: 6, rot: 7 })
  })

  it('falls back to the design slot for a null legacy row within STAMP_SLOTS range', () => {
    const row = { id: 'row-2', stampLeft: null, stampTop: null, stampRot: null }
    const [left, top, rot] = STAMP_SLOTS[0]
    expect(resolvePlacement(row, 1)).toEqual({ left, top, rot })
  })

  it('falls back to deterministic PRNG by row id beyond STAMP_SLOTS range', () => {
    const row = { id: 'row-3', stampLeft: null, stampTop: null, stampRot: null }
    expect(resolvePlacement(row, STAMP_SLOTS.length + 1)).toEqual(generateStampPlacement(row.id))
  })

  it('is immutable/repeatable: same null row + order always resolves identically', () => {
    const row = { id: 'row-4', stampLeft: null, stampTop: null, stampRot: null }
    expect(resolvePlacement(row, 5)).toEqual(resolvePlacement(row, 5))
  })
})
