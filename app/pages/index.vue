<script setup lang="ts">
import type { SeasonListItem } from '#shared/types/season'

const { t } = useI18n()
const localePath = useLocalePath()

const { data: seasons } = await useAsyncData('seasons:landing', () =>
  $fetch<SeasonListItem[]>('/api/seasons')
)

usePageSeo({
  title: () => t('meta.home.title'),
  description: () => t('meta.home.description')
})

const steps = computed(() => [
  t('landing.how.step1'),
  t('landing.how.step2'),
  t('landing.how.step3')
])

const year = new Date().getFullYear()
</script>

<template>
  <div>
    <section class="pt-6">
      <h1 class="font-serif text-[2rem] font-bold leading-tight text-ink">
        {{ t('landing.hero.title') }}
      </h1>
      <p class="mt-4 leading-relaxed text-ink-soft">
        {{ t('landing.hero.subline') }}
      </p>
      <NuxtLink
        :to="localePath('/seasons')"
        class="mt-7 inline-flex h-12 items-center justify-center rounded-lg bg-accent px-7 font-bold text-paper transition-opacity hover:opacity-90"
      >
        {{ t('landing.hero.cta') }}
      </NuxtLink>
    </section>

    <section class="mt-14">
      <h2 class="font-serif text-xl font-bold text-ink">
        {{ t('landing.how.title') }}
      </h2>
      <ol class="mt-5 space-y-5">
        <li v-for="(step, i) in steps" :key="i" class="flex items-start gap-3.5">
          <span
            class="flex size-8 shrink-0 items-center justify-center rounded-full border border-ink/30 font-serif text-sm font-bold text-ink"
          >
            {{ i + 1 }}
          </span>
          <p class="pt-1 leading-snug text-ink">{{ step }}</p>
        </li>
      </ol>
    </section>

    <blockquote
      class="mt-14 space-y-4 border-l-2 border-accent/40 pl-5 font-serif italic leading-relaxed text-ink-soft"
    >
      <p>{{ t('landing.manifesto.p1') }}</p>
      <p>{{ t('landing.manifesto.p2') }}</p>
    </blockquote>

    <section class="mt-14">
      <h2 class="font-serif text-xl font-bold text-ink">
        {{ t('landing.seasonsTitle') }}
      </h2>
      <ul v-if="seasons?.length" class="mt-5 space-y-3">
        <li v-for="season in seasons" :key="season.slug">
          <SeasonCard :season="season" />
        </li>
      </ul>
      <p v-else class="mt-4 text-ink-soft">{{ t('seasons.empty') }}</p>
    </section>

    <footer class="mt-14 border-t border-ink/10 pb-2 pt-5 text-center text-sm text-ink-soft">
      aralau.kz · {{ year }}
    </footer>
  </div>
</template>
