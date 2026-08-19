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
  <BookPage :spine="t('auth.login.spine')" footer-left="aralau.kz" :footer-right="t('auth.login.footerPage')">
    <div class="px-[22px] pt-[56px] text-center">
      <p class="font-mono text-[9.5px] tracking-[0.3em] text-faint uppercase">
        {{ t('title.eyebrow') }}
      </p>
      <h1
        class="mt-[26px] font-serif text-[28px] leading-[1.15] font-normal tracking-[-0.01em] text-ink"
      >
        {{ t('auth.login.title') }}
      </h1>
      <div class="mx-auto mt-[22px] h-px w-[46px] bg-[rgba(34,30,23,0.5)]"></div>
    </div>

    <div class="px-[22px] mt-[38px]">
      <p
        v-if="oauthError"
        role="alert"
        class="mb-4 text-pretty text-center font-serif text-[13px] italic leading-[1.65] text-accent"
      >
        {{ t('auth.login.errorGoogle') }}
      </p>

      <a
        :href="googleDisabled ? undefined : googleUrl"
        :aria-disabled="googleDisabled || googleLoading ? 'true' : undefined"
        class="flex min-h-[54px] w-full items-center justify-between px-4 font-mono text-[11px] uppercase tracking-[0.16em] no-underline"
        :class="
          googleDisabled || googleLoading
            ? 'pointer-events-none cursor-not-allowed bg-ink text-paper opacity-40'
            : 'bg-ink text-paper hover:bg-accent'
        "
      >
        <span>{{ t('auth.login.google') }}</span>
        <span aria-hidden="true">→</span>
      </a>

      <p v-if="googleDisabled" class="mt-3 text-pretty text-center font-serif text-[13px] italic leading-[1.65] text-muted">
        {{ t('auth.login.googleDisabled') }}
      </p>
    </div>
  </BookPage>
</template>
