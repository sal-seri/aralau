<script setup lang="ts">
// Key-value line inside a MetaTable. `tone` colours the value; the `value`
// slot overrides it entirely (used e.g. for the language switcher row).
withDefaults(
  defineProps<{
    label: string
    value?: string
    tone?: 'default' | 'accent' | 'placeholder'
    separated?: boolean
  }>(),
  {
    value: undefined,
    tone: 'default',
    separated: false
  }
)

const toneClass = {
  default: 'text-ink',
  accent: 'text-accent',
  placeholder: 'text-placeholder'
} as const
</script>

<template>
  <div
    class="flex items-center justify-between"
    :class="separated ? 'border-t border-dotted border-[rgba(34,30,23,0.3)] pt-2' : ''"
  >
    <span>{{ label }}</span>
    <span v-if="$slots.value" class="flex items-center gap-2">
      <slot name="value" />
    </span>
    <span v-else :class="toneClass[tone]">{{ value }}</span>
  </div>
</template>
