<script setup lang="ts">
import { sanitizeRedirect } from '#shared/utils/redirect'

const { t } = useI18n()
const route = useRoute()

const providers = ref<{ google: boolean } | null>(null)

onMounted(async () => {
  providers.value = await $fetch<{ google: boolean }>('/api/auth/providers').catch(() => ({ google: false }))
})

const googleDisabled = computed(() => providers.value !== null && !providers.value.google)
const googleLoading = computed(() => providers.value === null)

// not localized: /api/** routes are not i18n-managed
const googleUrl = computed(() => {
  const redirect = sanitizeRedirect(typeof route.query.redirect === 'string' ? route.query.redirect : null)
  return redirect ? `/api/auth/google?redirect=${encodeURIComponent(redirect)}` : '/api/auth/google'
})

const oauthError = computed(() => route.query.error === 'google')
</script>

<template>
  <section class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">{{ t('auth.login.title') }}</h1>
    </div>

    <p
      v-if="oauthError"
      class="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent"
      role="alert"
    >
      {{ t('auth.login.errorGoogle') }}
    </p>

    <a
      :href="googleDisabled ? undefined : googleUrl"
      :aria-disabled="googleDisabled || googleLoading ? 'true' : undefined"
      class="flex min-h-[48px] w-full items-center justify-center rounded-lg border border-ink/20 bg-paper-input px-4 text-sm font-bold text-ink transition-colors"
      :class="
        googleDisabled || googleLoading
          ? 'pointer-events-none cursor-not-allowed opacity-50'
          : 'hover:border-ink/40 hover:bg-paper'
      "
    >
      {{ t('auth.login.google') }}
    </a>

    <p v-if="googleDisabled" class="text-center text-xs text-muted">
      {{ t('auth.login.googleDisabled') }}
    </p>
  </section>
</template>
