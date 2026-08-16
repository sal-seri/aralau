import { parseHandle } from '../../../shared/utils/handle'
import { prisma } from '../../db'
import { checkRateLimit, getClientIp } from '../../utils/rateLimit'

// Handle availability check: rate-limited 30 req/min per IP.
export default defineEventHandler(async (event) => {
  const limit = checkRateLimit(`handle-availability:${getClientIp(event)}`, 30, 60_000)
  if (!limit.allowed) {
    event.node.res.setHeader('Retry-After', String(limit.retryAfterSec))
    throw createError({ statusCode: 429, statusMessage: 'Too Many Requests' })
  }

  const query = getQuery(event)
  const parsed = parseHandle(typeof query.handle === 'string' ? query.handle : '')
  if (!parsed.ok) {
    return { available: false, reason: parsed.reason }
  }

  const existing = await prisma.user.findUnique({ where: { handle: parsed.handle }, select: { id: true } })
  return { available: !existing, reason: existing ? 'taken' : null }
})
