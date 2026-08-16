// Open-redirect protection: a safe redirect must be a same-origin path —
// it must start with "/" but not "//" (protocol-relative) or "/\"
// (browsers normalize backslashes to forward slashes).
export function sanitizeRedirect(candidate: string | null | undefined): string | null {
  if (typeof candidate !== 'string' || candidate.length === 0) return null
  if (!candidate.startsWith('/')) return null
  if (candidate.startsWith('//') || candidate.startsWith('/\\')) return null
  return candidate
}
