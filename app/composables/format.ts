// Presentation helpers for public season data.

type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'

const monthFormatterCache = new Map<string, Intl.DateTimeFormat>()

function monthName(date: Date, locale: string): string {
  let formatter = monthFormatterCache.get(locale)
  if (!formatter) {
    // timeZone: 'UTC' — ISO dates must not drift across the server's
    // local zone (e.g. 2026-12-31T23:59:59Z renders as January in UTC+6).
    formatter = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' })
    monthFormatterCache.set(locale, formatter)
  }
  return formatter.format(date)
}

// «март — декабрь 2026» / «март 2026 — декабрь 2027» / «с марта…» open-ended.
// Locale-aware month names via Intl; null dates are rendered as an ellipsis.
export function formatSeasonRange(
  startsAt: string | null,
  endsAt: string | null,
  locale: string
): string {
  const start = startsAt ? new Date(startsAt) : null
  const end = endsAt ? new Date(endsAt) : null
  if (!start && !end) return ''

  if (start && end) {
    const sameYear = start.getUTCFullYear() === end.getUTCFullYear()
    const startPart = sameYear
      ? monthName(start, locale)
      : `${monthName(start, locale)} ${start.getUTCFullYear()}`
    const endPart = `${monthName(end, locale)} ${end.getUTCFullYear()}`
    return `${startPart} — ${endPart}`
  }
  if (start) {
    return `${monthName(start, locale)} ${start.getUTCFullYear()} — …`
  }
  if (end) {
    return `… — ${monthName(end, locale)} ${end.getUTCFullYear()}`
  }
  return ''
}

// Explicit plural category (ru: one/few/many) for i18n keys like
// seasons.locations.one|few|many|other — deterministic across vue-i18n versions.
export function pluralForm(locale: string, n: number): PluralCategory {
  return new Intl.PluralRules(locale).select(n) as PluralCategory
}

// Lowercase roman numeral for season/place ordinals («i», «ii», «iii»…).
// Supports 1–20 — beyond the three seasons and nine places a volume holds.
export function toRoman(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 20) {
    throw new RangeError(`toRoman expects an integer 1–20, received ${n}`)
  }
  const glyphs: ReadonlyArray<readonly [number, string]> = [
    [10, 'x'],
    [9, 'ix'],
    [5, 'v'],
    [4, 'iv'],
    [1, 'i']
  ]
  let rest = n
  let out = ''
  for (const [value, glyph] of glyphs) {
    while (rest >= value) {
      out += glyph
      rest -= value
    }
  }
  return out
}

const almatyDayMonthCache = new Map<string, Intl.DateTimeFormat>()

// «12 марта» / «12 наурыз» — day + genitive month name for the season TOC's
// found rows and the title page's completing-stamp meta («3 / 3 · 4 мая»).
// Same Asia/Almaty + formatToParts discipline as formatCheckedInDate
// (deterministic across server/client, no locale-specific suffixes).
export function formatDayMonth(date: string | Date, locale: string): string {
  let formatter = almatyDayMonthCache.get(locale)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      timeZone: 'Asia/Almaty'
    })
    almatyDayMonthCache.set(locale, formatter)
  }

  let day = ''
  let month = ''
  for (const part of formatter.formatToParts(typeof date === 'string' ? new Date(date) : date)) {
    if (part.type === 'day') day = part.value
    else if (part.type === 'month') month = part.value
  }
  return `${day} ${month}`
}

// «12.03» — the dd.MM chip inside a stamp mark's hatch core. Two-digit day
// and month of the ALMATY calendar day (the stamp date the reader walked
// away with — same reasoning as formatCheckedInDate). formatToParts with a
// structural locale so the joiner is exactly «.», never locale punctuation.
const almatyStampDayCache = new Map<string, Intl.DateTimeFormat>()

export function formatStampDay(date: string | Date): string {
  const cacheKey = 'stamp-day'
  let formatter = almatyStampDayCache.get(cacheKey)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'Asia/Almaty'
    })
    almatyStampDayCache.set(cacheKey, formatter)
  }

  let day = ''
  let month = ''
  for (const part of formatter.formatToParts(typeof date === 'string' ? new Date(date) : date)) {
    if (part.type === 'day') day = part.value
    else if (part.type === 'month') month = part.value
  }
  return `${day}.${month}`
}

// Volume year for the spine («Том I · Алматы · 2026»): the year the
// earliest visible season starts (endsAt as a fallback for startless
// seasons), else the current year.
export function volumeYear(
  visible: { startsAt: string | null; endsAt: string | null }[],
  fallback = new Date().getFullYear()
): number {
  const first = visible[0]
  if (!first) return fallback
  if (first.startsAt) return new Date(first.startsAt).getUTCFullYear()
  if (first.endsAt) return new Date(first.endsAt).getUTCFullYear()
  return fallback
}

// «12 марта 2026» — check-in date as the stamp would read in Almaty.
//
// `checkedInAt` arrives as an ISO 8601 string (server-absolute instant,
// produced via `.toISOString()` on the API). We format the calendar day
// in `Asia/Almaty` because the visible "Найдено · …" date is emotionally
// tied to the stamp date a user would have walked away with — a guest
// visiting from another zone must not see a different calendar day
// because their browser happened to be in UTC+0. (Almaty has been
// permanently UTC+05:00 since the December 2024 Kazakhstan reform; we
// simply forward the IANA zone name and let the platform ICU decide.)
//
// `formatToParts` (rather than `format`) so we emit «12 марта 2026»
// exactly, without the «г.» suffix Node's full ICU appends to
// `Intl.DateTimeFormat('ru', { day, month, year }).format()`.
//
// Deterministic server/client output (same ISO in → same string out)
// means no hydration mismatch on the found-date block.
const almatyDayMonthYearCache = new Map<string, Intl.DateTimeFormat>()

export function formatCheckedInDate(checkedInAt: string, locale: string): string {
  let formatter = almatyDayMonthYearCache.get(locale)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Almaty'
    })
    almatyDayMonthYearCache.set(locale, formatter)
  }

  let day = ''
  let month = ''
  let year = ''
  for (const part of formatter.formatToParts(new Date(checkedInAt))) {
    if (part.type === 'day') day = part.value
    else if (part.type === 'month') month = part.value
    else if (part.type === 'year') year = part.value
  }
  return `${day} ${month} ${year}`
}
