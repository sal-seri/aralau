<script setup lang="ts">
const { t, locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const langs = ['ru', 'kk'] as const
</script>

<template>
  <section class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">{{ t('nav.profile') }}</h1>
      <p class="mt-3 text-ink-soft">{{ t('profile.soon') }}</p>
    </div>

    <section>
      <h2 class="text-sm font-bold tracking-wide text-ink-soft uppercase">
        {{ t('profile.language') }}
      </h2>
      <div class="mt-3 flex gap-3">
        <NuxtLink
          v-for="lang in langs"
          :key="lang"
          :to="switchLocalePath(lang)"
          :aria-current="locale === lang ? 'page' : undefined"
          class="flex min-h-[44px] items-center rounded-full border px-5 text-sm font-bold"
          :class="
            locale === lang
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-ink/20 text-ink-soft'
          "
        >
          {{ t(`language.${lang}`) }}
        </NuxtLink>
      </div>
    </section>
  </section>
</template>
