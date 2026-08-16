<script setup lang="ts">
import type { SeasonListItem } from '#shared/types/season'

const { t } = useI18n()

const { data: seasons } = await useAsyncData('seasons:list', () =>
  $fetch<SeasonListItem[]>('/api/seasons')
)

usePageSeo({
  title: () => t('meta.seasons.title'),
  description: () => t('meta.seasons.description')
})
</script>

<template>
  <section>
    <h1 class="font-serif text-2xl font-bold text-ink">{{ t('seasons.title') }}</h1>
    <ul v-if="seasons?.length" class="mt-5 space-y-3">
      <li v-for="season in seasons" :key="season.slug">
        <SeasonCard :season="season" />
      </li>
    </ul>
    <p v-else class="mt-4 text-ink-soft">{{ t('seasons.empty') }}</p>
  </section>
</template>
