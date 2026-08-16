<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
</script>

<template>
  <section>
    <h1 class="text-2xl font-bold">{{ t('nav.passport') }}</h1>
    <p class="mt-3 text-ink-soft">{{ t('passport.empty') }}</p>
  </section>
</template>
