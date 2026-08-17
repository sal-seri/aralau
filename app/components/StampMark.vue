<script setup lang="ts">
import { computed } from 'vue'

// The stamp artwork itself. Rotation/opacity/position are applied by the
// parent wrapper — this component only renders the mark at `size` px.
// Unique textPath id per instance (useId) so several stamps can share a page.
const props = withDefaults(
  defineProps<{
    date: string
    ring: string
    size?: number
  }>(),
  { size: 104 }
)

const ringPathId = `stamp-ring-${useId()}`

// Design: hatch core is 62px at 104 / 58px at 96 — 60% of the mark.
const coreSize = computed(() => Math.round(props.size * 0.6))
// Date chip reads 7px at 104 / 6.5px at 96.
const dateFontSize = computed(() => Math.round(((props.size * 7) / 104) * 10) / 10)
</script>

<template>
  <div class="relative" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" viewBox="0 0 160 160" class="block" aria-hidden="true">
      <defs>
        <path
          :id="ringPathId"
          d="M80,80 m-62,0 a62,62 0 1,1 124,0 a62,62 0 1,1 -124,0"
          fill="none"
        />
      </defs>
      <circle cx="80" cy="80" r="74" fill="none" class="stroke-accent" stroke-width="2.5" />
      <circle cx="80" cy="80" r="69" fill="none" class="stroke-accent" stroke-width="1" />
      <circle cx="80" cy="80" r="52" fill="none" class="stroke-accent" stroke-width="1" />
      <text
        class="fill-accent"
        font-family="JetBrains Mono, monospace"
        font-size="9.5"
        letter-spacing="2.6"
      >
        <textPath :href="`#${ringPathId}`" startOffset="4%">{{ ring }}</textPath>
      </text>
    </svg>
    <div
      class="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
      :style="{
        width: `${coreSize}px`,
        height: `${coreSize}px`,
        background:
          'repeating-linear-gradient(45deg, rgba(154,66,54,.28) 0 2px, transparent 2px 6px)'
      }"
    >
      <span
        class="bg-paper px-[3px] py-px font-mono tracking-[0.06em] text-accent"
        :style="{ fontSize: `${dateFontSize}px` }"
      >
        {{ date }}
      </span>
    </div>
  </div>
</template>
