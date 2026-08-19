import { describe, expect, it } from 'vitest'
import {
  STAMP_SLOTS,
  generateStampPlacement,
  resolvePlacement
} from '../server/utils/stampPlacement'

describe('STAMP_SLOTS', () => {
  it('keeps every hand-designed slot inside the sheet at its own rotation', () => {
    const SHEET_WIDTH = 346
    const SHEET_HEIGHT = 212
    const STAMP_SIZE = 104

    for (const [left, top, rot] of STAMP_SLOTS) {
      const rad = (Math.abs(rot) * Math.PI) / 180
      const grown = STAMP_SIZE * (Math.cos(rad) + Math.sin(rad))
      const inset = (grown - STAMP_SIZE) / 2
      const centerLeft = left + STAMP_SIZE / 2
      const centerTop = top + STAMP_SIZE / 2

      expect(centerLeft - grown / 2).toBeGreaterThanOrEqual(-0.01)
      expect(centerLeft + grown / 2).toBeLessThanOrEqual(SHEET_WIDTH + 0.01)
      expect(centerTop - grown / 2).toBeGreaterThanOrEqual(-0.01)
      expect(centerTop + grown / 2).toBeLessThanOrEqual(SHEET_HEIGHT + 0.01)
      expect(inset).toBeGreaterThanOrEqual(0)
    }
  })
})

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
      expect(left).toBeLessThanOrEqual(242)
      expect(top).toBeGreaterThanOrEqual(0)
      expect(top).toBeLessThanOrEqual(108)
      expect(rot).toBeGreaterThanOrEqual(-12)
      expect(rot).toBeLessThanOrEqual(12)
    }
  })

  it('never lets the rotated bounding box cross the sheet edges', () => {
    const SHEET_WIDTH = 346
    const SHEET_HEIGHT = 212
    const STAMP_SIZE = 104

    for (const seed of ['x', 'y', 'z', 'checkin-1', 'checkin-2', 'edge-a', 'edge-b', crypto.randomUUID()]) {
      const { left, top, rot } = generateStampPlacement(seed)
      const rad = (Math.abs(rot) * Math.PI) / 180
      const grown = STAMP_SIZE * (Math.cos(rad) + Math.sin(rad))
      const inset = (grown - STAMP_SIZE) / 2
      const centerLeft = left + STAMP_SIZE / 2
      const centerTop = top + STAMP_SIZE / 2

      expect(centerLeft - grown / 2).toBeGreaterThanOrEqual(-0.01)
      expect(centerLeft + grown / 2).toBeLessThanOrEqual(SHEET_WIDTH + 0.01)
      expect(centerTop - grown / 2).toBeGreaterThanOrEqual(-0.01)
      expect(centerTop + grown / 2).toBeLessThanOrEqual(SHEET_HEIGHT + 0.01)
      expect(inset).toBeGreaterThanOrEqual(0)
    }
  })

  it('keeps overlap with existing stamps at or below 20% when a spot allows it', () => {
    const occupied = [
      { left: 0, top: 0, rot: 0 },
      { left: 238, top: 0, rot: 0 }
    ]
    for (const seed of ['x', 'y', 'z', 'third-stamp', crypto.randomUUID()]) {
      const placement = generateStampPlacement(seed, occupied)
      for (const other of occupied) {
        const xOverlap = Math.max(
          0,
          Math.min(placement.left + 104, other.left + 104) - Math.max(placement.left, other.left)
        )
        const yOverlap = Math.max(
          0,
          Math.min(placement.top + 104, other.top + 104) - Math.max(placement.top, other.top)
        )
        const ratio = (xOverlap * yOverlap) / (104 * 104)
        expect(ratio).toBeLessThanOrEqual(0.2)
      }
    }
  })

  it('is deterministic given the same seed and occupied set', () => {
    const occupied = [{ left: 50, top: 20, rot: 5 }]
    const a = generateStampPlacement('repeat-seed', occupied)
    const b = generateStampPlacement('repeat-seed', occupied)
    expect(a).toEqual(b)
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
