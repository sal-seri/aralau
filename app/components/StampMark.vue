<script setup lang="ts">
// The stamp artwork itself. Rotation/opacity/position are applied by the
// parent wrapper — this component only renders the mark, sized either to a
// literal `size` px (default) or to 100% of its parent box when
// `containerRelative` is set (the parent then controls the actual px size,
// e.g. via a percentage width — see the season stamp sheet, which must
// scale with its own fluid-width container instead of a fixed px budget).
// Unique textPath id per instance (useId) so several stamps can share a page.
withDefaults(
  defineProps<{
    date: string
    ring: string
    size?: number
    containerRelative?: boolean
  }>(),
  { size: 104, containerRelative: false }
)

const ringPathId = `stamp-ring-${useId()}`

// The core hatch circle (60%) and date chip (≈6.73% of the mark, i.e. 7px
// at a 104px mark) are proportions of the rendered box, not of `size` —
// expressed as `%`/`cqw` so they hold in both sizing modes above.
</script>

<template>
  <div
    class="relative"
    :style="
      containerRelative
        ? { width: '100%', height: '100%', containerType: 'inline-size' }
        : { width: `${size}px`, height: `${size}px`, containerType: 'inline-size' }
    "
  >
    <svg width="100%" height="100%" viewBox="0 0 160 160" class="block" aria-hidden="true">
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
      class="absolute left-1/2 top-1/2 flex size-[60%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
      style="background: repeating-linear-gradient(45deg, rgba(154, 66, 54, 0.28) 0 2px, transparent 2px 6px)"
    >
      <span
        class="bg-paper px-[3px] py-px font-mono tracking-[0.06em] text-accent"
        style="font-size: 6.73cqw"
      >
        {{ date }}
      </span>
    </div>
  </div>
</template>
