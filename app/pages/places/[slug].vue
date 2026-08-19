<script setup lang="ts">
import type { CheckinSuccessResult, PlaceDetail } from '#shared/types/place'
import type { SeasonListItem, SeasonTocEntry } from '#shared/types/season'
import { isDraftEntry } from '#shared/types/season'

// Place page («Орын») — design 11d (before check-in: orientation, answer
// card, locked story) / 11e (after check-in: opened story first, small
// orientation, next-place CTA). Fully server-rendered; personalization
// comes from `/api/places/[slug]`, fetched with the viewer's cookie.
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
  // `deep: true`: onCheckinSuccess/onSeasonClosed mutate nested fields of
  // `place.value` in place (see below) rather than reassigning it — with
  // Nuxt's project-wide `deep: false` default this ref wouldn't track
  // those mutations and the UI would only catch up on a full reload.
  { watch: [slug], deep: true }
)

if (error.value || !place.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: 'Place not found',
    fatal: true
  })
}

// Full season list — the season's 1-based TOC rank drives the roman
// numeral and the «ед. хр.» unit, and the volume year drives the spine.
// Same key as the title/season pages: shared payload.
const { data: seasons } = await useAsyncData('seasons:list', () =>
  $fetch<SeasonTocEntry[]>('/api/seasons')
)

// 1-based rank across ALL seasons (drafts included), like the title TOC.
const seasonRank = computed(() => {
  const current = place.value?.season.slug
  const index = (seasons.value ?? []).findIndex((entry) => entry.slug === current)
  return index === -1 ? 1 : index + 1
})

const seasonRoman = computed(() => toRoman(seasonRank.value))
const placeRoman = computed(() => toRoman(place.value?.order ?? 1))
const unit = computed(() => String(seasonRank.value).padStart(2, '0'))

const visibleSeasons = computed<SeasonListItem[]>(() =>
  (seasons.value ?? []).filter((entry): entry is SeasonListItem => !isDraftEntry(entry))
)

const year = computed(() => volumeYear(visibleSeasons.value))

const statusWord = computed(() => {
  const status = place.value?.season.status
  if (status === 'active') return t('season.status.active')
  if (status === 'closed') return t('season.status.closed')
  return t('seasons.status.frozen')
})

// closed|frozen — the season is over: no answer card, just a muted note.
const settled = computed(() => {
  const status = place.value?.season.status
  return status === 'closed' || status === 'frozen'
})

const spine = computed(() =>
  t('place.spine', {
    season: seasonRoman.value,
    place: placeRoman.value,
    year: year.value
  })
)

const footerLeft = computed(() => {
  const base = t('place.footerUnit', { unit: unit.value, place: placeRoman.value })
  return place.value?.viewer.found ? `${base} · ${t('place.found')}` : base
})

// «мөр» row (11d/11e): «пустое место» before the check-in, the full
// Almaty date-and-time of the stamp after it.
const stampValue = computed(() => {
  const p = place.value
  return p?.viewer.found && p.viewer.checkedInAt
    ? formatStampDateTime(p.viewer.checkedInAt, locale.value)
    : t('place.meta.stampEmpty')
})

// Header stamp mark (11e): ring text and chip date, Almaty day.
const stampRing = computed(() =>
  t('stamp.ring', { season: seasonRoman.value, place: placeRoman.value }).toUpperCase()
)
const stampDay = computed(() => {
  const checkedInAt = place.value?.viewer.checkedInAt
  return checkedInAt ? formatStampDay(checkedInAt) : ''
})

// The answer card renders for anyone not-yet-found while the season is
// still active — the anonymous wall and the signed-in stub share it.
const showForm = computed(() => {
  const p = place.value
  return !!p && !p.viewer.found && !settled.value
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

const nextRoman = computed(() => {
  const next = place.value?.nextPlace
  return next ? toRoman(next.order) : ''
})

// sr-only status region: unlike the error/rate-limit notes (which stay
// inside CheckInForm's own aria-live region), a successful check-in
// unmounts CheckInForm entirely as the page flips to 11e — so the
// announcement lives here, on the page, where it survives that swap.
const announcement = ref('')

const prefersReducedMotion = ref(false)
let reducedMotionQuery: MediaQueryList | null = null
function onReducedMotionChange(event: MediaQueryListEvent) {
  prefersReducedMotion.value = event.matches
}
onMounted(() => {
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = reducedMotionQuery.matches
  reducedMotionQuery.addEventListener('change', onReducedMotionChange)
})
onUnmounted(() => {
  reducedMotionQuery?.removeEventListener('change', onReducedMotionChange)
})

// Gates the header stamp's reveal transition (see the template): only a
// fresh stamp (not `alreadyFound`) animates, and only without reduced
// motion — otherwise the swap is instant.
const animateReveal = ref(false)

function onCheckinSuccess(result: CheckinSuccessResult) {
  if (!place.value) return

  animateReveal.value = !result.alreadyFound

  place.value.viewer.found = true
  place.value.viewer.checkedInAt = result.checkedInAt
  place.value.storyText = result.storyText

  // Other pages must see this on their next visit, not their cached one.
  // NOT this page's own `place:${slug}` key: that key's `data` ref IS
  // `place` (the same live object we just mutated above) — clearing it
  // would reset `place.value` to null on this still-mounted instance and
  // blank the page we're standing on.
  clearNuxtData('me:progress')
  clearNuxtData(`me:checkins:${place.value.season.slug}`)

  if (result.alreadyFound) return

  announcement.value = t('place.found')
  navigator.vibrate?.(30)
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion.value ? 'auto' : 'smooth' })
  })
}

// A 409 mid-session: reuse the same "season closed" branch already used
// for a season that was closed on load — flipping the status here is
// enough, `settled`/`showForm` do the rest.
function onSeasonClosed() {
  if (place.value) place.value.season.status = 'closed'
}

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
  <BookPage
    v-if="place"
    :spine="spine"
    :footer-left="footerLeft"
    :footer-right="t('place.footerPage')"
  >
    <span class="sr-only" aria-live="polite">{{ announcement }}</span>

    <!-- Header (11d/11e): back link, eyebrow + serif title, stamp slot -->
    <div class="px-[22px] pt-[22px]">
      <NuxtLink
        :to="localePath(`/seasons/${place.season.slug}`)"
        class="font-mono text-[9.5px] tracking-[0.16em] text-faint uppercase no-underline hover:text-ink"
      >
        {{ t('place.backToSeason') }}
      </NuxtLink>
      <div class="mt-5 flex items-start gap-3">
        <div class="min-w-0 flex-1">
          <p class="font-mono text-[9.5px] tracking-[0.3em] text-faint uppercase">
            {{ place.season.title }} · {{ placeRoman }}
          </p>
          <h1
            class="mt-3.5 font-serif text-[28px] leading-[1.1] font-normal tracking-[-0.015em] text-ink"
          >
            {{ place.title }}
          </h1>
        </div>
        <Transition name="stamp-reveal" :css="animateReveal && !prefersReducedMotion">
          <StampSlot
            v-if="!place.viewer.found"
            key="slot"
            :line1="t('place.stamp')"
            :line2="t('place.emptySpot')"
          />
          <div v-else key="mark" class="stamp-wrap">
            <StampMark :size="96" :ring="stampRing" :date="stampDay" />
          </div>
        </Transition>
      </div>
    </div>

    <MetaTable class="mx-[22px] mt-[22px]">
      <MetaRow :label="t('place.meta.season')" :value="`${seasonRoman} · ${statusWord}`" />
      <MetaRow :label="t('place.meta.unit')" :value="`${unit} / ${placeRoman}`" />
      <MetaRow
        separated
        :label="t('place.meta.stamp')"
        :value="stampValue"
        tone="accent"
      />
    </MetaTable>

    <div class="px-[22px]">
      <!-- Before check-in (11d): orientation, answer card, locked story -->
      <template v-if="!place.viewer.found">
        <SectionHeader class="mt-[30px]" :label="t('place.orient')" />
        <p class="prose-book mt-3.5">{{ place.orientText }}</p>

        <SectionHeader class="mt-[30px]" :label="t('place.confirm')" />
        <CheckInForm
          v-if="showForm"
          :question="place.question"
          :logged-in="loggedIn"
          :login-url="loginUrl"
          :slug="place.slug"
          @success="onCheckinSuccess"
          @season-closed="onSeasonClosed"
        />
        <p
          v-else
          class="mt-3.5 text-pretty font-serif text-[13px] italic leading-[1.65] text-muted"
        >
          {{ t('place.seasonClosed') }}
        </p>

        <SectionHeader class="mt-[30px]" :label="t('place.story')" />
        <div
          class="mt-3.5 flex flex-col items-center gap-[9px] border border-dashed border-[rgba(34,30,23,0.35)] px-4 py-[22px] text-center"
        >
          <span class="font-mono text-[9px] tracking-[0.22em] text-placeholder uppercase">
            {{ t('place.storyLocked') }}
          </span>
          <span class="font-serif text-[13.5px] italic leading-[1.6] text-muted">
            {{ t('place.storyLockedText') }}
          </span>
          <span class="mt-1 h-px w-full bg-[rgba(34,30,23,0.15)]"></span>
          <span class="h-px w-full bg-[rgba(34,30,23,0.12)]"></span>
          <span class="h-px w-[66%] bg-[rgba(34,30,23,0.1)]"></span>
        </div>
      </template>

      <!-- After check-in (11e): the story moves FIRST, orientation
           shrinks, next place closes the page -->
      <template v-else>
        <SectionHeader class="mt-[30px]" :label="t('place.story')" />
        <p class="prose-book prose-book--story dropcap mt-3.5">{{ place.storyText }}</p>

        <SectionHeader class="mt-[30px]" :label="t('place.orient')" />
        <p class="prose-book prose-book--small mt-3.5">{{ place.orientText }}</p>

        <CtaButton
          v-if="place.nextPlace"
          class="mt-[22px]"
          variant="outline"
          :to="localePath(`/places/${place.nextPlace.slug}`)"
          :label="t('place.next', { roman: nextRoman })"
        />
      </template>
    </div>
  </BookPage>
</template>

<style scoped>
/* Resting state for the found-header stamp, kept as plain CSS (rather
   than Tailwind's rotate/opacity utilities) so the reveal transition
   below can animate `transform`/`opacity` toward it without a utility
   class fighting the transition for the same property. */
.stamp-wrap {
  flex: none;
  transform: rotate(-5deg);
  opacity: 0.92;
}

.stamp-reveal-enter-active {
  transition:
    transform 300ms ease-out,
    opacity 300ms ease-out;
}

.stamp-reveal-enter-from {
  transform: scale(1.5) rotate(0deg);
  opacity: 0;
}
</style>
