<script setup lang="ts">
import { computed } from 'vue'

// Empty stamp placeholder (place header before check-in). `line2` breaks
// after its first word so «бос орын» reads on two lines, as in the design.
const props = defineProps<{
  line1: string
  line2: string
}>()

const line2Parts = computed(() => {
  const gap = props.line2.indexOf(' ')
  return gap === -1
    ? [props.line2]
    : [props.line2.slice(0, gap), props.line2.slice(gap + 1)]
})
</script>

<template>
  <div
    class="flex size-[78px] flex-none flex-col items-center justify-center gap-[3px] rounded-full border-[1.5px] border-dashed border-[rgba(154,66,54,0.5)] bg-[rgba(154,66,54,0.05)] text-accent"
  >
    <span class="font-mono text-[8.5px] tracking-[0.24em]">{{ line1 }}</span>
    <span
      class="text-center font-mono text-[8px] leading-[1.3] tracking-[0.06em] text-[rgba(154,66,54,0.75)]"
    >
      <span v-for="(part, i) in line2Parts" :key="i" class="block">{{ part }}</span>
    </span>
  </div>
</template>
