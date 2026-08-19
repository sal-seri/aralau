<script setup lang="ts">
import { parseHandle, type HandleRejection } from '#shared/utils/handle'

const { t } = useI18n()
const localePath = useLocalePath()
const session = useUserSession()

type CheckState = 'idle' | 'checking' | 'available' | 'taken' | HandleRejection

const handle = ref('')
const checkState = ref<CheckState>('idle')
const submitting = ref(false)
const serverError = ref<HandleRejection | 'taken' | 'generic' | null>(null)

let timer: ReturnType<typeof setTimeout> | null = null

watch(handle, (value) => {
  if (timer) clearTimeout(timer)
  serverError.value = null

  const parsed = parseHandle(value)
  if (!parsed.ok) {
    checkState.value = parsed.reason
    return
  }

  checkState.value = 'checking'
  timer = setTimeout(async () => {
    try {
      const result = await $fetch<{ available: boolean; reason: string | null }>('/api/auth/handle-availability', {
        query: { handle: parsed.handle }
      })
      checkState.value = result.available ? 'available' : ((result.reason as HandleRejection) ?? 'taken')
    } catch {
      checkState.value = 'idle'
    }
  }, 400)
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})

const messageKey = computed(() => {
  switch (checkState.value) {
    case 'checking':
      return 'auth.onboarding.checking'
    case 'available':
      return 'auth.onboarding.available'
    case 'taken':
      return 'auth.onboarding.taken'
    case 'reserved':
      return 'auth.onboarding.reserved'
    case 'short':
    case 'long':
    case 'invalid':
      return 'auth.onboarding.invalid'
    default:
      return null
  }
})

const canSubmit = computed(() => checkState.value === 'available' && !submitting.value)

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  serverError.value = null

  try {
    await $fetch('/api/auth/handle', { method: 'POST', body: { handle: handle.value } })
    await session.fetch()
    await navigateTo(localePath('/'))
  } catch (error) {
    const reason = (error as { data?: { reason?: string } }).data?.reason
    serverError.value =
      reason === 'taken' || reason === 'reserved' || reason === 'short' || reason === 'long' || reason === 'invalid'
        ? reason
        : 'generic'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <BookPage
    :spine="t('auth.onboarding.spine')"
    footer-left="aralau.kz"
    :footer-right="t('auth.onboarding.footerPage')"
  >
    <div class="px-[22px] pt-[56px] text-center">
      <p class="font-mono text-[9.5px] tracking-[0.3em] text-faint uppercase">
        {{ t('title.eyebrow') }}
      </p>
      <h1
        class="mt-[26px] font-serif text-[28px] leading-[1.15] font-normal tracking-[-0.01em] text-ink"
      >
        {{ t('auth.onboarding.title') }}
      </h1>
      <div class="mx-auto mt-[22px] h-px w-[46px] bg-[rgba(34,30,23,0.5)]"></div>
      <p class="mt-[22px] text-pretty font-serif text-[13px] leading-[1.65] text-muted italic">
        {{ t('auth.onboarding.hint') }}
      </p>
    </div>

    <div class="px-[22px] mt-[34px]">
      <form class="space-y-3.5" @submit.prevent="submit">
        <label class="block">
          <span class="mb-2 block font-mono text-[9.5px] uppercase tracking-[0.22em] text-faint">
            {{ t('auth.onboarding.handle') }}
          </span>
          <input
            v-model="handle"
            type="text"
            inputmode="text"
            autocapitalize="none"
            autocomplete="off"
            spellcheck="false"
            class="min-h-[48px] w-full border border-[rgba(34,30,23,0.3)] bg-paper-input px-3.5 font-mono text-[14px] text-ink focus:border-[rgba(34,30,23,0.5)] focus:outline-none"
          />
        </label>

        <p
          v-if="messageKey"
          class="text-pretty font-serif text-[13px] italic leading-[1.6]"
          :class="checkState === 'available' ? 'text-muted' : 'text-accent'"
          aria-live="polite"
        >
          {{ t(messageKey) }}
        </p>

        <p v-if="serverError" role="alert" class="text-pretty font-serif text-[13px] italic leading-[1.6] text-accent">
          {{
            serverError === 'generic'
              ? t('auth.error.generic')
              : t(
                  serverError === 'taken'
                    ? 'auth.onboarding.taken'
                    : serverError === 'reserved'
                      ? 'auth.onboarding.reserved'
                      : 'auth.onboarding.invalid'
                )
          }}
        </p>

        <!-- CtaButton renders type="button": the click handler covers mouse
             activation, the form's submit covers Enter in the input. -->
        <CtaButton class="mt-1" :label="t('auth.onboarding.continue')" :disabled="!canSubmit" @click="submit" />
      </form>
    </div>
  </BookPage>
</template>
