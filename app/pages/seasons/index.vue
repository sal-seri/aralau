<script setup lang="ts">
import type { SeasonListItem, SeasonTocEntry } from '#shared/types/season'
import { isDraftEntry } from '#shared/types/season'

const { t } = useI18n()

// /api/seasons now also returns redacted `draft` placeholders for the
// title page TOC. This legacy list page predates the redesign (it is
// replaced by redirects in 5.5.6) — keep it as-is: visible seasons only.
const { data: seasons } = await useAsyncData('seasons:list', () =>
  $fetch<SeasonTocEntry[]>('/api/seasons')
)

const visibleSeasons = computed<SeasonListItem[]>(() =>
  (seasons.value ?? []).filter((entry): entry is SeasonListItem => !isDraftEntry(entry))
)

usePageSeo({
  title: () => t('meta.seasons.title'),
  description: () => t('meta.seasons.description')
})
</script>

<template>
  <section>
    <h1 class="font-serif text-2xl font-bold text-ink">{{ t('seasons.title') }}</h1>
    <ul v-if="visibleSeasons.length" class="mt-5 space-y-3">
      <li v-for="season in visibleSeasons" :key="season.slug">
        <SeasonCard :season="season" />
      </li>
    </ul>
    <p v-else class="mt-4 text-ink-soft">{{ t('seasons.empty') }}</p>
  </section>
</template>
