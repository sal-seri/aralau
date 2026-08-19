<script setup lang="ts">
import { setResponseHeader } from 'h3'
import type { RouteLocationRaw } from 'vue-router'
import type { SeasonCheckIn, SeasonDetail, SeasonListItem, SeasonTocEntry } from '#shared/types/season'
import { isDraftEntry } from '#shared/types/season'

// Season page («Маусым») — design 12c (empty sheet) / 11c (in progress) /
// 12d (complete): season header, colophon metadata, the stamp sheet
// («Мөр парағы») with server-positioned stamps, and the places TOC.
// Fully server-rendered; personalization comes from `/api/me/checkins`,
// also fetched during SSR so nothing pops in on the client.
const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { loggedIn } = useUserSession()

const slug = computed(() => String(route.params.slug))

const { data: season, error } = await useAsyncData(
  `seasons:detail:${slug.value}`,
  () => $fetch<SeasonDetail>(`/api/seasons/${slug.value}`),
  { watch: [slug] }
)

if (error.value || !season.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: 'Season not found',
    fatal: true
  })
}

// Full season list — the current season's 1-based TOC rank drives the
// roman numeral and the «ед. хр.» unit, and the next visible season
// drives the completion CTA. Same key as the title page: shared payload.
const { data: seasons } = await useAsyncData('seasons:list', () =>
  $fetch<SeasonTocEntry[]>('/api/seasons')
)

// Null-equivalent for anonymous visitors; for signed-in readers the
// session cookie travels with the server-side fetch (`useRequestFetch`
// forwards the incoming request's headers during SSR), so the stamps and
// found dates are in the very first HTML.
const requestFetch = useRequestFetch()
const { data: checkins } = await useAsyncData<SeasonCheckIn[]>(
  `me:checkins:${slug.value}`,
  () =>
    loggedIn.value
      ? requestFetch<SeasonCheckIn[]>('/api/me/checkins', { query: { season: slug.value } })
      : Promise.resolve([]),
  { default: () => [], watch: [slug] }
)

// A signed-in reader gets a personalized document — a shared cache must
// never store it for anyone else (mirrors the title page's rule).
if (import.meta.server && loggedIn.value) {
  const event = useRequestEvent()
  if (event) {
    setResponseHeader(event, 'Cache-Control', 'private, no-store')
    setResponseHeader(event, 'Vary', 'Cookie')
  }
}

// 1-based rank across ALL seasons (drafts included), like the title TOC.
const rank = computed(() => {
  const index = (seasons.value ?? []).findIndex((entry) => entry.slug === slug.value)
  return index === -1 ? 1 : index + 1
})

const romanSeason = computed(() => toRoman(rank.value))

const visibleSeasons = computed<SeasonListItem[]>(() =>
  (seasons.value ?? []).filter((entry): entry is SeasonListItem => !isDraftEntry(entry))
)

const year = computed(() => volumeYear(visibleSeasons.value))

const statusWord = computed(() => {
  const status = season.value?.status
  if (status === 'active') return t('season.status.active')
  if (status === 'closed') return t('season.status.closed')
  return t('seasons.status.frozen')
})

// closed|frozen — the season is over: spine/footer gain the status word.
const settled = computed(() => {
  const status = season.value?.status
  return status === 'closed' || status === 'frozen'
})

const spine = computed(() =>
  settled.value
    ? t('season.spineClosed', { roman: romanSeason.value, status: statusWord.value, year: year.value })
    : t('season.spine', { roman: romanSeason.value, year: year.value })
)

const footerLeft = computed(() =>
  settled.value
    ? t('season.footerUnitClosed', {
        unit: String(rank.value).padStart(2, '0'),
        status: statusWord.value
      })
    : t('season.footerUnit', { unit: String(rank.value).padStart(2, '0') })
)

const range = computed(() =>
  formatSeasonRange(season.value?.startsAt ?? null, season.value?.endsAt ?? null, locale.value)
)

const total = computed(() => season.value?.locations.length ?? 0)

const checkinBySlug = computed(
  () => new Map((checkins.value ?? []).map((checkin) => [checkin.locationSlug, checkin]))
)

// Found = check-ins that land on a published place of this season.
const found = computed(
  () =>
    (season.value?.locations ?? []).filter((location) => checkinBySlug.value.has(location.slug))
      .length
)

// «3» before the first stamp, «2 / 3» from the first one on (12c / 12d).
const placesValue = computed(() =>
  found.value > 0 ? `${found.value} / ${total.value}` : `${total.value}`
)

interface StampView {
  locationSlug: string
  ring: string
  date: string
  left: number
  top: number
  rot: number
}

// One placed stamp per found place: left/top/rot come from the API
// (computed once at check-in, immutable) — never from the client.
const stamps = computed<StampView[]>(() => {
  const rows: StampView[] = []
  for (const location of season.value?.locations ?? []) {
    const checkin = checkinBySlug.value.get(location.slug)
    if (!checkin) continue
    rows.push({
      locationSlug: location.slug,
      ring: t('stamp.ring', {
        season: romanSeason.value,
        place: toRoman(location.order)
      }).toUpperCase(),
      date: formatStampDay(checkin.checkedInAt),
      left: checkin.stamp.left,
      top: checkin.stamp.top,
      rot: checkin.stamp.rot
    })
  }
  return rows
})

const sheetFull = computed(() => total.value > 0 && found.value === total.value)

// Sheet caption — only once at least one stamp is placed (12c has none):
// «2 оттиска · 1 место свободно» while partial, «лист заполнен» when full.
// Both counts pluralize via Intl.PluralRules-driven key suffixes.
const sheetCaption = computed(() => {
  if (found.value === 0) return null
  if (sheetFull.value) {
    return t(`season.sheet.captionFull.${pluralForm(locale.value, found.value)}`, {
      count: found.value
    })
  }
  const remaining = total.value - found.value
  const free = t(`season.sheet.captionFree.${pluralForm(locale.value, remaining)}`, { remaining })
  return t(`season.sheet.captionProgress.${pluralForm(locale.value, found.value)}`, {
    found: found.value,
    free
  })
})

interface PlaceRowView {
  locationSlug: string
  numeral: string
  title: string
  to: RouteLocationRaw
  state: 'active' | 'default'
  meta: string
}

const placeRows = computed<PlaceRowView[]>(() => {
  const rows: PlaceRowView[] = []
  for (const location of season.value?.locations ?? []) {
    const checkin = checkinBySlug.value.get(location.slug)
    rows.push({
      locationSlug: location.slug,
      numeral: toRoman(location.order),
      title: location.title,
      to: localePath(`/places/${location.slug}`),
      state: checkin ? 'active' : 'default',
      meta: checkin ? formatDayMonth(checkin.checkedInAt, locale.value) : t('season.emptySpot')
    })
  }
  return rows
})

// Next-season CTA (12d): only when the sheet is complete and the season
// that follows by order exists and is visible (a draft would be «жабық»).
const nextSeason = computed<SeasonListItem | null>(() => {
  const list = seasons.value ?? []
  const index = list.findIndex((entry) => entry.slug === slug.value)
  const next = index >= 0 ? list[index + 1] : undefined
  if (!next || isDraftEntry(next)) return null
  return next
})

const showNextCta = computed(
  () => sheetFull.value && nextSeason.value !== null
)

usePageSeo({
  title: () => season.value?.title ?? t('seasons.title'),
  description: () => season.value?.description ?? t('meta.season.description'),
  ogTitle: () => season.value?.title ?? t('seasons.title'),
  ogDescription: () => season.value?.description ?? t('meta.season.description')
})
</script>

<template>
  <BookPage
    v-if="season"
    :spine="spine"
    :footer-left="footerLeft"
    :footer-right="t('season.footerPage')"
  >
    <!-- Header (12c/11c/12d): back link, eyebrow + status, season title -->
    <div class="px-[22px] pt-[22px]">
      <NuxtLink
        :to="localePath('/')"
        class="font-mono text-[9.5px] tracking-[0.16em] text-faint uppercase no-underline hover:text-ink"
      >
        {{ t('season.backToToc') }}
      </NuxtLink>
      <p class="mt-5 font-mono text-[9.5px] tracking-[0.3em] text-faint uppercase">
        {{ t('season.eyebrow', { roman: romanSeason }) }} ·
        <span class="text-accent">{{ statusWord }}</span>
      </p>
      <h1
        class="mt-3.5 font-serif text-[28px] leading-[1.1] font-normal tracking-[-0.015em] text-ink"
      >
        {{ season.title }}
      </h1>
    </div>

    <MetaTable class="mx-[22px] mt-[22px]">
      <MetaRow v-if="range" :label="t('season.meta.period')" :value="range" />
      <MetaRow :label="t('season.meta.places')" :value="placesValue" />
    </MetaTable>

    <div class="px-[22px]">
      <SectionHeader class="mt-[26px]" :label="t('season.sheet.title')" />

      <!-- Stamp sheet with placed stamps: a 346:212 field (design constraint
           — seasons hold ~3 places; the placement API generates coords for
           exactly that budget) that scales with the column's actual fluid
           width instead of assuming a fixed px column — left/top/size are
           all percentages of this box, so a stamp positioned to fit inside
           the 346x212 design reference (server-side, incl. rotation
           overflow — see server/utils/stampPlacement.ts) stays inside the
           sheet at any viewport width. -->
      <div v-if="stamps.length > 0" class="relative mt-3 aspect-[346/212] w-full">
        <div
          v-for="stamp in stamps"
          :key="stamp.locationSlug"
          class="absolute aspect-square opacity-[0.93]"
          :style="{
            left: `${(stamp.left / 346) * 100}%`,
            top: `${(stamp.top / 212) * 100}%`,
            width: `${(104 / 346) * 100}%`,
            transform: `rotate(${stamp.rot}deg)`
          }"
        >
          <StampMark container-relative :date="stamp.date" :ring="stamp.ring" />
        </div>
      </div>

      <!-- Empty sheet (12c): clean field under a hairline, awaiting the
           first stamp. -->
      <div
        v-else
        class="mt-3 flex flex-col items-center gap-3.5 border-b border-line-soft pb-[24px] pt-[26px]"
      >
        <p class="text-pretty text-center font-serif text-[14px] italic leading-[1.6] text-muted">
          {{ t('season.sheet.empty') }}
        </p>
        <span class="h-px w-[70%] bg-[rgba(34,30,23,0.12)]"></span>
        <span class="h-px w-[70%] bg-[rgba(34,30,23,0.1)]"></span>
        <span class="h-px w-[44%] bg-[rgba(34,30,23,0.08)]"></span>
      </div>

      <p
        v-if="sheetCaption"
        class="font-mono text-[9.5px] tracking-[0.14em] text-faint uppercase"
      >
        {{ sheetCaption }}
      </p>

      <p v-if="season.description" class="prose-book dropcap mt-[22px]">
        {{ season.description }}
      </p>

      <SectionHeader class="mt-[30px]" :label="t('season.toc')" />
      <div>
        <TocRow
          v-for="row in placeRows"
          :key="row.locationSlug"
          :numeral="row.numeral"
          :title="row.title"
          :meta="row.meta"
          :to="row.to"
          :state="row.state"
        />
      </div>

      <p class="mt-[22px] text-pretty font-serif text-[13px] italic leading-[1.65] text-muted">
        {{ t('season.note') }}
      </p>

      <CtaButton
        v-if="showNextCta && nextSeason"
        class="mt-6"
        :to="localePath(`/seasons/${nextSeason.slug}`)"
        :label="t('season.cta.next', { title: nextSeason.title })"
      />
    </div>
  </BookPage>
</template>
