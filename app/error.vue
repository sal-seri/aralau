<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const { t } = useI18n()

const isNotFound = computed(() => props.error.statusCode === 404)
const title = computed(() =>
  t(isNotFound.value ? 'error.notFound.title' : 'error.generic.title')
)
const text = computed(() =>
  t(isNotFound.value ? 'error.notFound.text' : 'error.generic.text')
)
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center bg-paper px-6 text-center text-ink">
    <p class="font-serif text-6xl font-bold text-accent">{{ error.statusCode }}</p>
    <h1 class="mt-4 font-serif text-2xl font-bold">{{ title }}</h1>
    <p class="mt-2 max-w-md leading-relaxed text-muted">{{ text }}</p>
    <a
      href="/"
      class="mt-8 inline-flex h-11 items-center rounded-lg bg-ink px-7 font-bold text-paper transition-opacity hover:opacity-90"
    >
      {{ t('error.home') }}
    </a>
  </div>
</template>
