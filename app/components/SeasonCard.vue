<script setup lang="ts">
import type { SeasonListItem } from '#shared/types/season'

const props = defineProps<{ season: SeasonListItem }>()

const { t, locale } = useI18n()
const localePath = useLocalePath()

const range = computed(() =>
  formatSeasonRange(props.season.startsAt, props.season.endsAt, locale.value)
)

const locationCount = computed(() =>
  t(`seasons.locations.${pluralForm(locale.value, props.season.locationCount)}`, {
    n: props.season.locationCount
  })
)
</script>

<template>
  <NuxtLink
    :to="localePath(`/seasons/${season.slug}`)"
    class="block rounded-lg border border-ink/10 bg-paper-dim p-4 transition-colors hover:border-ink/25"
  >
    <SeasonStatusBadge :status="season.status" />
    <h3 class="mt-2.5 font-serif text-lg font-bold leading-snug text-ink">
      {{ season.title }}
    </h3>
    <p class="mt-1 text-sm text-ink-soft">
      <template v-if="range">{{ range }} · </template>{{ locationCount }}
    </p>
  </NuxtLink>
</template>
