<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

// Full-width almanac CTA: label on the left, trailing «→» on the right.
// Renders a NuxtLink when `to` is given, otherwise a plain <button>
// (action CTAs like sign-out); click listeners fall through to it.
withDefaults(
  defineProps<{
    to?: RouteLocationRaw
    label: string
    variant?: 'primary' | 'outline'
  }>(),
  { to: undefined, variant: 'primary' }
)

const classes = (variant: 'primary' | 'outline') =>
  [
    'flex min-h-[54px] w-full items-center justify-between px-4 font-mono text-[11px] uppercase tracking-[0.16em] no-underline',
    variant === 'primary'
      ? 'bg-ink text-paper hover:bg-accent'
      : 'border border-[rgba(34,30,23,0.5)] bg-transparent text-ink hover:bg-ink hover:text-paper'
  ].join(' ')
</script>

<template>
  <NuxtLink v-if="to" :to="to" :class="classes(variant)">
    <span>{{ label }}</span>
    <span aria-hidden="true">→</span>
  </NuxtLink>
  <button v-else type="button" :class="classes(variant)">
    <span>{{ label }}</span>
    <span aria-hidden="true">→</span>
  </button>
</template>
