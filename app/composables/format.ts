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
