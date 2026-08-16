// HEAD counterpart to `[slug].get.ts`. Required for two reasons:
//
//  1. Nitro's `.get.ts` routes don't auto-accept HEAD (true for every
//     existing `.get.ts` route in this app — `/api/health`, `/api/seasons/[slug]`,
//     ...). Without this file, `HEAD /api/places/<slug>` falls through to
//     Nitro's catch-all 404 and emits Nitro's default `cache-control: no-cache`
//     header, masking the `Cache-Control: private, no-store` we set on the GET
//     response. The spec's `curl -sI … | grep -i cache-control` check needs the
//     handler value to show through.
//
//  2. We must also mirror the GET handler's 404 conditions for the same URL,
//     so an `If-Modified-Since`-style probe against an unknown slug or a
//     draft-season / unpublished location still returns 404 from HEAD — the
//     response status of HEAD MUST match the equivalent GET.
//
// HEAD is a lightweight advisory method: we don't compute viewer state or
// story/gating and we explicitly return no body (h3 strips it anyway). The
// `Cache-Control` and `Vary` tokens are emit-only — the GET handler is the
// source of truth for the actual payload.
import { prisma } from '../../db'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'Vary', 'Cookie')

  const slug = getRouterParam(event, 'slug')
  const now = new Date()
  if (!slug) {
    throw createError({ statusCode: 404, statusMessage: 'Place not found' })
  }

  // Mirror `[slug].get.ts`'s 404 surface. A `findFirst` on `slug` alone
  // matches the place only when there's exactly one with this slug across
  // all visible seasons; hashing-by-id is unnecessary for the visibility
  // check we need here.
  const existing = await prisma.location.findFirst({
    where: {
      slug,
      publishedAt: { lte: now },
      season: { status: { not: 'draft' } }
    },
    select: { id: true }
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Place not found' })
  }

  // No body for HEAD — h3 also strips response bodies for HEAD requests,
  // but returning null makes the contract explicit.
  return null
})