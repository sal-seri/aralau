<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

// Table-of-contents line: numeral · title · dotted leader · meta.
withDefaults(
  defineProps<{
    numeral: string
    title?: string
    meta?: string
    to?: RouteLocationRaw
    state?: 'active' | 'default' | 'locked'
  }>(),
  {
    title: undefined,
    meta: undefined,
    to: undefined,
    state: 'default'
  }
)
</script>

<template>
  <div
    class="flex items-baseline gap-2 py-3"
    :class="[
      state === 'locked'
        ? 'border-b border-[rgba(34,30,23,0.14)] opacity-40'
        : 'border-b border-line'
    ]"
  >
    <span
      class="w-[18px] flex-none font-mono text-[10px]"
      :class="state === 'active' ? 'text-accent' : 'text-faint'"
    >
      {{ numeral }}
    </span>

    <NuxtLink
      v-if="to && state !== 'locked'"
      :to="to"
      class="font-serif text-[17px] text-ink no-underline hover:underline hover:underline-offset-4"
    >
      {{ title }}
    </NuxtLink>
    <span v-else-if="state === 'locked'" class="font-serif text-[17px] text-muted">—</span>
    <span v-else class="font-serif text-[17px] text-ink">{{ title }}</span>

    <span
      class="-translate-y-[3px] flex-1 border-b border-dotted"
      :class="
        state === 'locked' ? 'border-[rgba(34,30,23,0.3)]' : 'border-[rgba(34,30,23,0.35)]'
      "
    ></span>

    <span
      class="whitespace-nowrap font-mono text-[9.5px]"
      :class="state === 'active' ? 'text-accent' : 'text-faint'"
    >
      {{ meta }}
    </span>
  </div>
</template>
