<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { t, locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const localePath = useLocalePath()
const session = useUserSession()

const langs = ['ru', 'kk'] as const

const signingOut = ref(false)

async function signOut() {
  if (signingOut.value) return
  signingOut.value = true
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await session.fetch()
    await navigateTo(localePath('/auth/login'))
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <section class="space-y-6">
    <h1 class="text-2xl font-bold">{{ t('nav.profile') }}</h1>

    <div class="rounded-lg border border-ink/10 bg-paper-dim px-4 py-4">
      <p class="font-serif text-xl font-bold text-ink">
        {{ session.user.value?.handle ? `@${session.user.value.handle}` : '—' }}
      </p>
      <p class="mt-1 text-sm text-ink-soft">{{ session.user.value?.email }}</p>
      <p
        v-if="session.user.value?.role === 'ADMIN'"
        class="mt-3 inline-block rounded-full border border-accent/40 bg-accent/10 px-3 py-0.5 text-xs font-bold text-accent"
      >
        {{ t('auth.role.admin') }}
      </p>
    </div>

    <button
      type="button"
      :disabled="signingOut"
      class="min-h-[48px] w-full rounded-lg border border-ink/20 px-4 text-sm font-bold text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
      @click="signOut"
    >
      {{ t('auth.logout') }}
    </button>

    <section>
      <h2 class="text-sm font-bold tracking-wide text-ink-soft uppercase">
        {{ t('profile.language') }}
      </h2>
      <div class="mt-3 flex gap-3">
        <NuxtLink
          v-for="lang in langs"
          :key="lang"
          :to="switchLocalePath(lang)"
          :aria-current="locale === lang ? 'page' : undefined"
          class="flex min-h-[44px] items-center rounded-full border px-5 text-sm font-bold"
          :class="
            locale === lang
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-ink/20 text-ink-soft'
          "
        >
          {{ t(`language.${lang}`) }}
        </NuxtLink>
      </div>
    </section>
  </section>
</template>
