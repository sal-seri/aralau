// On-site answer verification.
//
// `normalizeAnswer` intentionally does NOT run Unicode NFD stripping —
// Kazakh precomposed letters (ә ң ғ ү ұ қ һ і) would be corrupted by
// decomposing + stripping combining marks. It only lowercases, folds ё→е,
// strips punctuation, and collapses whitespace.
//
// Numeric variants («1875») compare digit-sequences only and never
// fuzzy-match («1874» must never pass for «1875»). Non-numeric variants
// fuzzy-match by Levenshtein distance, thresholded by the variant's
// normalized length: ≤4 chars → exact only, 5–9 → ≤1 typo, ≥10 → ≤2 typos.
const PUNCTUATION_RE = /\p{P}/gu
const WHITESPACE_RE = /\s+/g
const NON_DIGIT_RE = /\D/g
const NUMERIC_RE = /^[\d\s.,:-]+$/

export function normalizeAnswer(input: string): string {
  return input
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(PUNCTUATION_RE, '')
    .replace(WHITESPACE_RE, ' ')
    .trim()
}

export function isNumeric(input: string): boolean {
  const normalized = normalizeAnswer(input)
  return normalized.length > 0 && NUMERIC_RE.test(normalized) && /\d/.test(normalized)
}

function extractDigits(normalized: string): string {
  return normalized.replace(NON_DIGIT_RE, '')
}

function fuzzyThreshold(length: number): number {
  if (length <= 4) return 0
  if (length <= 9) return 1
  return 2
}

// Classic full-matrix Levenshtein distance — answer strings are short
// (≤100 chars), so no need for a rolling-window optimization.
function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  let prevRow = Array.from({ length: b.length + 1 }, (_, j) => j)

  for (let i = 1; i <= a.length; i++) {
    const currRow = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      currRow[j] = Math.min(
        prevRow[j]! + 1,
        currRow[j - 1]! + 1,
        prevRow[j - 1]! + cost
      )
    }
    prevRow = currRow
  }

  return prevRow[b.length]!
}

export function checkAnswer(input: string, answers: string[]): boolean {
  const normalizedInput = normalizeAnswer(input)
  if (!normalizedInput) return false

  for (const variant of answers) {
    const normalizedVariant = normalizeAnswer(variant)
    if (!normalizedVariant) continue

    if (isNumeric(variant)) {
      if (extractDigits(normalizedInput) === extractDigits(normalizedVariant)) return true
      continue
    }

    const threshold = fuzzyThreshold(normalizedVariant.length)
    if (levenshtein(normalizedInput, normalizedVariant) <= threshold) return true
  }

  return false
}
