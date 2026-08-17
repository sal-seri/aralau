<script setup lang="ts">
// Almanac book frame: ink spine on the left, paper column with the page
// content and a hairline footer pinned to the bottom. All text via props.
defineProps<{
  spine?: string
  footerLeft?: string
  footerRight?: string
}>()
</script>

<template>
  <div class="paper-texture flex flex-1 bg-paper text-ink">
    <div
      v-if="spine"
      class="flex w-[34px] flex-none items-center justify-center bg-ink py-[14px] text-paper"
    >
      <span
        class="rotate-180 font-mono text-[10px] uppercase tracking-[0.34em] [writing-mode:vertical-rl]"
      >
        {{ spine }}
      </span>
    </div>
    <div class="flex min-w-0 flex-1 flex-col">
      <slot />
      <footer
        v-if="footerLeft || footerRight"
        class="mt-auto flex items-baseline justify-between px-[22px] pb-[18px] pt-5 font-mono text-[9.5px] tracking-[0.1em] text-faint"
      >
        <span>{{ footerLeft }}</span>
        <span>{{ footerRight }}</span>
      </footer>
    </div>
  </div>
</template>
