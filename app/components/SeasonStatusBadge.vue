<script setup lang="ts">
import type { PublicSeasonStatus } from '#shared/types/season'

const props = defineProps<{ status: PublicSeasonStatus }>()

const { t } = useI18n()

const classes: Record<PublicSeasonStatus, string> = {
  active: 'border-accent/50 text-accent',
  closed: 'border-ink/20 text-ink-soft',
  frozen: 'border-ink/40 text-ink'
}
</script>

<template>
  <span
    class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
    :class="classes[props.status]"
  >
    {{ t(`seasons.status.${props.status}`) }}
  </span>
</template>
