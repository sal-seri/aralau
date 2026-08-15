<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <section>
    <h1 class="text-2xl font-bold">{{ t('nav.seasons') }}</h1>
    <p class="mt-3 text-ink-soft">{{ t('seasons.empty') }}</p>
  </section>
</template>
