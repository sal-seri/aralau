<script setup lang="ts">
// Mono section label with a trailing hairline. No top margin — parents
// control vertical rhythm.
defineProps<{
  label: string
}>()
</script>

<template>
  <div class="flex items-center gap-2.5">
    <span class="font-mono text-[9.5px] uppercase tracking-[0.22em] text-faint">
      {{ label }}
    </span>
    <span class="h-px flex-1 bg-[rgba(34,30,23,0.25)]"></span>
  </div>
</template>
