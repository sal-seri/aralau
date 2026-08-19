// In-memory sliding-window rate limiter.
//
// NOTE: state lives in the Node process — suitable only for a single-instance
// deployment. It resets on restart and does not share counters across
// instances; back this with Redis before scaling horizontally.
import { getRequestIP, type H3Event } from 'h3'

const buckets = new Map<string, number[]>()

export interface RateLimitResult {
  allowed: boolean
  retryAfterSec: number
  // Remaining calls allowed in the current window, after this one. 0 when
  // this call itself was rejected.
  remaining: number
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const windowStart = now - windowMs
  const hits = (buckets.get(key) ?? []).filter((timestamp) => timestamp > windowStart)

  if (hits.length >= limit) {
    buckets.set(key, hits)
    const oldest = hits[0] ?? now
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
    return { allowed: false, retryAfterSec, remaining: 0 }
  }

  hits.push(now)
  buckets.set(key, hits)

  if (buckets.size > 10_000) {
    for (const [mapKey, timestamps] of buckets) {
      if (timestamps.every((timestamp) => timestamp <= windowStart)) buckets.delete(mapKey)
    }
  }

  return { allowed: true, retryAfterSec: 0, remaining: Math.max(0, limit - hits.length) }
}

export function getClientIp(event: H3Event): string {
  return getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
}
