<script setup lang="ts">
import type { PlaceDetail } from '#shared/types/place'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { loggedIn } = useUserSession()

const slug = computed(() => String(route.params.slug))

// Cookie forwarding for SSR: the place API personalizes per viewer,
// so the internal Nitro fetch needs the original request's Cookie
// header. On the client this is `{ cookie: undefined }` and the browser
// sends its own credentials — same pattern the auth-utils examples use.
const requestHeaders = useRequestHeaders(['cookie'])

const { data: place, error } = await useAsyncData(
  `place:${slug.value}`,
  () => $fetch<PlaceDetail>(`/api/places/${slug.value}`, { headers: requestHeaders }),
  { watch: [slug] }
)

if (error.value || !place.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: 'Place not found',
    fatal: true
  })
}

// «Найдено · 12 марта 2026» — Almaty-timezone calendar date; deterministic
// server↔client (same ISO in → same string) so no hydration mismatch.
const foundDate = computed(() => {
  const p = place.value
  return p?.viewer.found && p.viewer.checkedInAt
    ? formatCheckedInDate(p.viewer.checkedInAt, locale.value)
    : ''
})

// Whether the form (real interactive UI) should render — only when the
// viewer is signed in, has not yet found this place, and the season is
// still active. Closed / frozen / found states are handled by their own
// branches below.
const showRealForm = computed(() => {
  const p = place.value
  return !!p && loggedIn.value && !p.viewer.found && p.season.status === 'active'
})

// Anonymous users see the same form UI but as a "sign in to check in" wall:
// the wall fires on input focus or submit. We render the form whenever the
// user is anonymous AND not found (any season status — even closed ones
// funnel anonymous readers through the wall first).
const showAnonymousWall = computed(() => {
  const p = place.value
  return !!p && !loggedIn.value && !p.viewer.found
})

// Signed-in + not-found + non-active season → no form, just a muted note.
const showSeasonClosed = computed(() => {
  const p = place.value
  return (
    !!p &&
    loggedIn.value &&
    !p.viewer.found &&
    (p.season.status === 'closed' || p.season.status === 'frozen')
  )
})

// Pre-built wall target in the active locale. `route.fullPath` carries the
// locale prefix where applicable, so the post-redirect landing matches the
// page the reader was on.
const loginUrl = computed(() => {
  const p = place.value
  const redirectTarget = p ? localePath(`/places/${p.slug}`) : route.fullPath
  return localePath({
    path: '/auth/login',
    query: { redirect: redirectTarget }
  })
})

usePageSeo({
  title: () => (place.value ? `${place.value.title} — ${place.value.season.title}` : t('meta.place.description')),
  description: () => t('meta.place.description')
})

// The HTML page embeds per-viewer content (storyText for found readers),
// so it must never be served from a shared cache. Mirror the API's own
// `Cache-Control: private, no-store` at the document level via static
// `routeRules` in `nuxt.config.ts` (along with `Vary: Cookie`) to keep
// intermediate caches from replaying one user's unlocked content to another.
</script>

<template>
  <section v-if="place">
    <!-- 1. Header — eyebrow + serif title + back to season -->
    <NuxtLink
      :to="localePath(`/seasons/${place.season.slug}`)"
      class="text-sm font-bold tracking-wide text-ink-soft uppercase transition-colors hover:text-ink"
    >
      ← {{ t('places.backToSeason') }}
    </NuxtLink>
    <p class="mt-4 text-xs font-bold tracking-wider uppercase text-ink-soft">
      {{ place.season.title }}
    </p>
    <h1 class="mt-1.5 font-serif text-2xl font-bold leading-tight text-ink">
      {{ place.title }}
    </h1>

    <!-- 2. How to find — public, visible to everyone -->
    <h2 class="mt-10 font-serif text-xl font-bold text-ink">
      {{ t('places.orientTitle') }}
    </h2>
    <p class="mt-3 leading-relaxed whitespace-pre-line text-ink">{{ place.orientText }}</p>

    <!-- 3. Check-in — state-dependent -->
    <h2 class="mt-10 font-serif text-xl font-bold text-ink">
      {{ t('places.checkinTitle') }}
    </h2>

    <!-- 3D: found (any season) — date in Almaty timezone, no form -->
    <div
      v-if="place.viewer.found"
      class="mt-3 rounded-lg border border-ink/15 bg-paper-dim px-4 py-3"
    >
      <p class="text-sm font-bold text-ink">
        {{ t('places.found') }}<span v-if="foundDate"> · {{ foundDate }}</span>
      </p>
    </div>

    <!-- 3C: signed-in + not found + closed/frozen — muted note, no form -->
    <p v-else-if="showSeasonClosed" class="mt-3 text-sm text-ink-soft">
      {{ t('places.seasonClosed') }}
    </p>

    <!-- 3A/3B: anonymous wall OR signed-in active stub form -->
    <CheckInForm
      v-else-if="showRealForm || showAnonymousWall"
      :question="place.question"
      :logged-in="loggedIn"
      :login-url="loginUrl"
      class="mt-3"
    />

    <!-- 4. Story — locked (placeholder) or unlocked (storyText) -->
    <h2 class="mt-10 font-serif text-xl font-bold text-ink">
      {{ t('places.storyTitle') }}
    </h2>

    <div
      v-if="place.viewer.found && place.storyText"
      class="mt-3 font-serif text-[1.0625rem] leading-[1.7] text-ink whitespace-pre-line"
    >
      {{ place.storyText }}
    </div>

    <p
      v-else
      class="mt-3 rounded-lg border border-ink/10 bg-paper-dim px-4 py-5 text-sm text-ink-soft"
    >
      {{ t('places.storyLocked') }}
    </p>
  </section>
</template>