<script setup lang="ts">
import { BookOpen, Map, User } from 'lucide-vue-next'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const tabs = computed(() => [
  { to: localePath('/seasons'), label: t('nav.seasons'), icon: Map },
  { to: localePath('/passport'), label: t('nav.passport'), icon: BookOpen },
  { to: localePath('/profile'), label: t('nav.profile'), icon: User }
])
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper pb-[env(safe-area-inset-bottom)]"
  >
    <div class="mx-auto grid max-w-md grid-cols-3">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        :aria-current="route.path.startsWith(tab.to) ? 'page' : undefined"
        class="flex min-h-[44px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-bold"
        :class="route.path.startsWith(tab.to) ? 'text-accent' : 'text-ink-soft'"
      >
        <component :is="tab.icon" class="size-5" aria-hidden="true" />
        <span>{{ tab.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
