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
  <section class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">{{ t('auth.onboarding.title') }}</h1>
      <p class="mt-3 text-sm text-muted">{{ t('auth.onboarding.hint') }}</p>
    </div>

    <form class="space-y-3" @submit.prevent="submit">
      <label class="block">
        <span class="mb-1 block text-sm font-bold">{{ t('auth.onboarding.handle') }}</span>
        <input
          v-model="handle"
          type="text"
          inputmode="text"
          autocapitalize="none"
          autocomplete="off"
          spellcheck="false"
          class="min-h-[48px] w-full rounded-lg border border-ink/20 bg-paper px-4 text-base text-ink focus:border-ink/50 focus:outline-none"
        />
      </label>

      <p
        v-if="messageKey"
        class="text-sm"
        :class="checkState === 'available' ? 'text-muted' : 'text-accent'"
        aria-live="polite"
      >
        {{ t(messageKey) }}
      </p>

      <p v-if="serverError" class="text-sm text-accent" role="alert">
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

      <button
        type="submit"
        :disabled="!canSubmit"
        class="min-h-[48px] w-full rounded-lg bg-ink px-4 text-sm font-bold text-paper transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        {{ t('auth.onboarding.continue') }}
      </button>
    </form>
  </section>
</template>
