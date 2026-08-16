import { z } from 'zod'

export const RESERVED_HANDLES = ['admin', 'aralau', 'support', 'moderator', 'root', 'official'] as const

const reservedSet = new Set<string>(RESERVED_HANDLES)

export type HandleRejection = 'short' | 'long' | 'invalid' | 'reserved'

const rejectionReasons = new Set<HandleRejection>(['short', 'long', 'invalid', 'reserved'])

// 3–20 chars, starts with a latin letter, then a-z/0-9/_ only.
// Input is trimmed and lowercased first: "Almaz" becomes "almaz",
// anything still failing the regex (e.g. Cyrillic) is rejected as 'invalid'.
export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'short')
  .max(20, 'long')
  .regex(/^[a-z][a-z0-9_]*$/, 'invalid')
  .refine((value) => !reservedSet.has(value), 'reserved')

export type HandleCheck = { ok: true; handle: string } | { ok: false; reason: HandleRejection }

export function parseHandle(input: string): HandleCheck {
  const result = handleSchema.safeParse(input)
  if (result.success) return { ok: true, handle: result.data }
  for (const issue of result.error.issues) {
    if (rejectionReasons.has(issue.message as HandleRejection)) {
      return { ok: false, reason: issue.message as HandleRejection }
    }
  }
  return { ok: false, reason: 'invalid' }
}
