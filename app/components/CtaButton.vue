<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

// Full-width almanac CTA: label on the left, trailing «→» on the right.
withDefaults(
  defineProps<{
    to: RouteLocationRaw
    label: string
    variant?: 'primary' | 'outline'
  }>(),
  { variant: 'primary' }
)
</script>

<template>
  <NuxtLink
    :to="to"
    class="flex min-h-[54px] items-center justify-between px-4 font-mono text-[11px] uppercase tracking-[0.16em] no-underline"
    :class="
      variant === 'primary'
        ? 'bg-ink text-paper hover:bg-accent'
        : 'border border-strong bg-transparent text-ink hover:bg-ink hover:text-paper'
    "
  >
    <span>{{ label }}</span>
    <span aria-hidden="true">→</span>
  </NuxtLink>
</template>
