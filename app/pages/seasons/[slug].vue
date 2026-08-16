<script setup lang="ts">
import type { SeasonDetail } from '#shared/types/season'

const { t, locale } = useI18n()
const route = useRoute()

const slug = computed(() => String(route.params.slug))

const { data: season, error } = await useAsyncData(
  `season:${route.params.slug}`,
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

const range = computed(() =>
  formatSeasonRange(season.value?.startsAt ?? null, season.value?.endsAt ?? null, locale.value)
)

usePageSeo({
  title: () => season.value?.title ?? t('seasons.title'),
  description: () => season.value?.description ?? t('meta.season.description'),
  ogTitle: () => season.value?.title ?? t('seasons.title'),
  ogDescription: () => season.value?.description ?? t('meta.season.description')
})
</script>

<template>
  <section v-if="season">
    <SeasonStatusBadge :status="season.status" />
    <h1 class="mt-3 font-serif text-2xl font-bold leading-tight text-ink">
      {{ season.title }}
    </h1>
    <p v-if="range" class="mt-1.5 text-sm text-ink-soft">{{ range }}</p>
    <p v-if="season.description" class="mt-4 leading-relaxed text-ink">
      {{ season.description }}
    </p>

    <h2 class="mt-10 font-serif text-xl font-bold text-ink">
      {{ t('seasons.detail.locationsTitle') }}
    </h2>
    <ol v-if="season.locations.length" class="mt-3">
      <li
        v-for="(location, i) in season.locations"
        :key="location.slug"
        class="flex items-baseline gap-3.5 border-b border-ink/10 py-3.5"
      >
        <span class="w-7 shrink-0 font-serif text-sm tabular-nums text-ink-soft">
          {{ String(i + 1).padStart(2, '0') }}
        </span>
        <span class="font-serif text-ink">{{ location.title }}</span>
      </li>
    </ol>
    <p v-else class="mt-3 text-ink-soft">{{ t('seasons.detail.empty') }}</p>
  </section>
</template>
