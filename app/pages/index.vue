<script setup lang="ts">
import { setResponseHeader } from 'h3'
import type { RouteLocationRaw } from 'vue-router'
import type { SeasonListItem, SeasonProgress, SeasonTocEntry } from '#shared/types/season'
import { isDraftEntry } from '#shared/types/season'

// Title page («титул») — the book's front door: wordmark, per-reader
// colophon, continue CTA and the seasons table of contents (design 11a /
// 12a / 12b). Fully server-rendered; personalization comes from
// `/api/me/progress`, also fetched during SSR so nothing pops in.
const { t, locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const config = useRuntimeConfig()
const { loggedIn, user } = useUserSession()

const { data: seasons } = await useAsyncData('seasons:list', () =>
  $fetch<SeasonTocEntry[]>('/api/seasons')
)

// Null for anonymous visitors; for signed-in readers the session cookie
// travels with the server-side fetch (`useRequestFetch` forwards the
// incoming request's headers during SSR), so the personalized rows
// (owner, stamps, TOC counts) are in the very first HTML.
const requestFetch = useRequestFetch()
const { data: progress } = await useAsyncData<SeasonProgress | null>(
  'me:progress',
  () => (loggedIn.value ? requestFetch<SeasonProgress>('/api/me/progress') : Promise.resolve(null)),
  { default: () => null }
)

// A signed-in reader gets a personalized document — a shared cache must
// never store it for anyone else (mirrors the /places/** route rule).
if (import.meta.server && loggedIn.value) {
  const event = useRequestEvent()
  if (event) {
    setResponseHeader(event, 'Cache-Control', 'private, no-store')
    setResponseHeader(event, 'Vary', 'Cookie')
  }
}

const visibleSeasons = computed<SeasonListItem[]>(() =>
  (seasons.value ?? []).filter((entry): entry is SeasonListItem => !isDraftEntry(entry))
)

const year = computed(() => volumeYear(visibleSeasons.value))

// «март — декабрь 2026» — the project range across visible seasons.
const period = computed(() => {
  if (!visibleSeasons.value.length) return ''
  const starts = visibleSeasons.value
    .map((season) => season.startsAt)
    .filter((value): value is string => Boolean(value))
    .sort()
  const ends = visibleSeasons.value
    .map((season) => season.endsAt)
    .filter((value): value is string => Boolean(value))
    .sort()
  return formatSeasonRange(starts[0] ?? null, ends.at(-1) ?? null, locale.value)
})

const firstActive = computed<SeasonListItem | null>(
  () => visibleSeasons.value.find((season) => season.status === 'active') ?? null
)

function seasonOrdinal(order: number): string {
  return order >= 1 && order <= 3
    ? t(`title.ordinal.${order}`)
    : t('title.ordinal.other', { n: order })
}

// Continue CTA: driven by progress.continue; anonymous readers (or a
// failed progress fetch) fall back to season-start from public data.
const cta = computed<{ to: RouteLocationRaw; label: string } | null>(() => {
  const cont = progress.value?.continue ?? null
  if (cont) {
    if (cont.kind === 'none') return null
    if (cont.kind === 'place') {
      if (!cont.placeSlug) return null
      return {
        to: localePath(`/places/${cont.placeSlug}`),
        label: t('title.cta.nextPlace')
      }
    }
    if (cont.kind === 'season-next') {
      return {
        to: localePath(`/seasons/${cont.seasonSlug}`),
        label: t('title.cta.season', {
          season: seasonOrdinal(cont.seasonOrder),
          title: cont.seasonTitle
        })
      }
    }
    return {
      to: localePath(`/seasons/${cont.seasonSlug}`),
      label: t('title.cta.firstSeason')
    }
  }
  if (firstActive.value) {
    return {
      to: localePath(`/seasons/${firstActive.value.slug}`),
      label: t('title.cta.firstSeason')
    }
  }
  return null
})

interface TocRowView {
  numeral: string
  title: string | null
  meta: string
  to: RouteLocationRaw | undefined
  state: 'active' | 'default' | 'locked'
}

const tocRows = computed<TocRowView[]>(() => {
  const firstActiveSlug = firstActive.value?.slug
  return (seasons.value ?? []).map((entry, index): TocRowView => {
    const numeral = toRoman(index + 1)
    if (isDraftEntry(entry)) {
      return {
        numeral,
        title: null,
        meta: t('title.tocLocked'),
        to: undefined,
        state: 'locked'
      }
    }
    const foundEntry = progress.value?.seasons.find((season) => season.slug === entry.slug)
    const found = foundEntry?.found ?? 0
    let meta = `${found} / ${entry.locationCount}`
    if (foundEntry?.completedAt) {
      meta += ` · ${formatDayMonth(foundEntry.completedAt, locale.value)}`
    }
    return {
      numeral,
      title: entry.title,
      meta,
      to: localePath(`/seasons/${entry.slug}`),
      state: entry.slug === firstActiveSlug ? 'active' : 'default'
    }
  })
})

const note = computed(() => {
  const current = progress.value
  if (current && current.foundTotal > 0 && current.lastStampAt) {
    return t('title.note.lastStamp', {
      date: formatCheckedInDate(current.lastStampAt, locale.value)
    })
  }
  return t('title.note.firstStamp')
})

useSeoMeta({
  title: () => t('meta.home.title'),
  description: () => t('meta.home.description'),
  ogTitle: () => t('meta.home.title'),
  ogDescription: () => t('meta.home.description'),
  ogType: 'website',
  ogImage: () => `${config.public.siteUrl}/og/default.png`,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <BookPage
    :spine="t('title.spine', { year })"
    footer-left="aralau.kz"
    :footer-right="t('title.footerPage')"
  >
    <div class="px-[22px] pt-[56px] text-center">
      <p class="font-mono text-[9.5px] tracking-[0.3em] text-faint uppercase">
        {{ t('title.eyebrow') }}
      </p>
      <h1
        class="mt-[26px] font-serif text-[46px] leading-none font-normal tracking-[0.14em] text-ink uppercase"
      >
        Aralau
      </h1>
      <div class="mx-auto mt-[22px] h-px w-[46px] bg-[rgba(34,30,23,0.5)]"></div>
      <p
        class="mt-[22px] font-serif text-[17px] leading-[1.6] text-tagline italic whitespace-pre-line text-pretty"
      >
        {{ t('title.tagline') }}
      </p>
    </div>

    <MetaTable class="mx-[22px] mt-[38px]">
      <MetaRow :label="t('title.meta.edition')" :value="t('title.meta.editionValue')" />
      <MetaRow v-if="period" :label="t('title.meta.period')" :value="period" />
      <MetaRow v-if="loggedIn" :label="t('title.meta.owner')">
        <template #value>
          <NuxtLink
            :to="localePath('/profile')"
            class="text-ink no-underline hover:underline hover:underline-offset-4"
          >
            @{{ user?.handle }}
          </NuxtLink>
        </template>
      </MetaRow>
      <MetaRow
        v-else
        :label="t('title.meta.owner')"
        :value="t('title.meta.ownerUnknown')"
        tone="placeholder"
      />
      <MetaRow
        v-if="loggedIn && progress"
        :label="t('title.meta.stamps')"
        :value="`${progress.foundTotal} / ${progress.placesTotal}`"
        tone="accent"
        separated
      />
      <MetaRow :label="t('title.meta.lang')" :separated="!(loggedIn && progress)">
        <template #value>
          <NuxtLink
            v-if="locale !== 'kk'"
            :to="switchLocalePath('kk')"
            class="text-faint no-underline"
          >
            ҚАЗ
          </NuxtLink>
          <span v-else class="border-b border-ink text-ink">ҚАЗ</span>
          <span class="text-[rgba(34,30,23,0.3)]">·</span>
          <NuxtLink
            v-if="locale !== 'ru'"
            :to="switchLocalePath('ru')"
            class="text-faint no-underline"
          >
            РУС
          </NuxtLink>
          <span v-else class="border-b border-ink text-ink">РУС</span>
        </template>
      </MetaRow>
    </MetaTable>

    <div class="px-[22px]">
      <CtaButton v-if="cta" class="mt-[26px]" :to="cta.to" :label="cta.label" />
      <SectionHeader class="mt-[34px]" :label="t('title.toc')" />
      <div>
        <TocRow
          v-for="row in tocRows"
          :key="row.numeral"
          :numeral="row.numeral"
          :title="row.title ?? undefined"
          :meta="row.meta"
          :to="row.to"
          :state="row.state"
        />
      </div>
      <p class="mt-[22px] font-serif text-[13px] leading-[1.65] text-muted italic text-pretty">
        {{ note }}
      </p>
    </div>
  </BookPage>
</template>
