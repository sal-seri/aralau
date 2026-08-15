<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <section class="py-10 text-center">
    <h1 class="text-2xl font-bold">{{ t('offline.title') }}</h1>
    <p class="mt-3 text-ink-soft">{{ t('offline.message') }}</p>
    <NuxtLink
      to="/"
      class="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-full bg-accent px-8 font-bold text-paper"
    >
      {{ t('offline.retry') }}
    </NuxtLink>
  </section>
</template>
