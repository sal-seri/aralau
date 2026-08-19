<script setup lang="ts">
import type { CheckinResult, CheckinSuccessResult } from '#shared/types/place'

// Check-in card (design 11d). Two sibling modes share one markup:
//   • `loggedIn === false` (the anonymous wall) — the question is shown,
//     but focusing the input or activating the button/form-submit
//     navigates to `loginUrl`, instead of behaving like a real form.
//   • `loggedIn === true` — a real POST to the check-in API, with inline
//     wrong-answer/offline/generic errors and a card-replacing rate-limit
//     note. A correct answer is handed to the parent via `success`; the
//     parent owns the 11d → 11e transition and its reveal animation.
//
// A 409 mid-session (season closed while the card was open) bubbles up via
// `seasonClosed` so the parent can flip to its own existing "season
// closed" note — the same one shown for a season that was already closed
// on load — rather than duplicating that markup here.

const props = defineProps<{
  question: string
  loggedIn: boolean
  // Fully-formatted login URL in the active locale, with a `?redirect=`
  // pointing back to this place page (locale-prefixed).
  loginUrl: string
  slug: string
}>()

const emit = defineEmits<{
  success: [result: CheckinSuccessResult]
  seasonClosed: []
}>()

const { t, locale } = useI18n()

const answer = ref('')
const loading = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

type InlineError = { kind: 'wrong'; attemptsLeft: number } | { kind: 'offline' } | { kind: 'generic' }
const inlineError = ref<InlineError | null>(null)

// Client-side only, on purpose: a reload re-asks the server, which is the
// real source of truth for the rate-limit window.
const rateLimited = ref(false)
const retryAfterSec = ref(0)

const inlineErrorMessage = computed(() => {
  const err = inlineError.value
  if (!err) return ''
  if (err.kind === 'wrong') {
    const count = err.attemptsLeft
    return t(`place.error.wrong.${pluralForm(locale.value, count)}`, { count })
  }
  if (err.kind === 'offline') return t('place.error.offline')
  return t('place.error.generic')
})

const rateLimitMessage = computed(() =>
  retryAfterSec.value < 3600
    ? t('place.error.rateLimited', { minutes: Math.max(1, Math.ceil(retryAfterSec.value / 60)) })
    : t('place.error.rateLimitedDay')
)

function focusInput() {
  inputRef.value?.focus()
}

// The wall fires on input focus OR form submit: both are "the user is
// trying to interact" signals. `replace: true` to keep the place page
// off the back stack once they are clearly proceeding to login.
function onInputFocus() {
  if (props.loggedIn) return
  return navigateTo(props.loginUrl, { replace: true })
}

function onInput() {
  inlineError.value = null
}

async function onSubmit() {
  if (!props.loggedIn) {
    return navigateTo(props.loginUrl, { replace: true })
  }

  const trimmed = answer.value.trim()
  if (!trimmed || loading.value) return

  // The reader is standing in a courtyard on mobile data — check before
  // spending a request, so a dropped connection never costs an attempt.
  if (navigator.onLine === false) {
    inlineError.value = { kind: 'offline' }
    focusInput()
    return
  }

  loading.value = true
  inlineError.value = null

  try {
    const result = await $fetch<CheckinResult>(`/api/places/${props.slug}/checkin`, {
      method: 'POST',
      body: { answer: trimmed }
    })

    if (result.correct) {
      emit('success', result)
      return
    }

    inlineError.value = { kind: 'wrong', attemptsLeft: result.attemptsLeft }
    focusInput()
  } catch (error) {
    const err = error as { statusCode?: number; data?: { reason?: string; retryAfterSec?: number } }

    if (err.statusCode === 401) {
      return navigateTo(props.loginUrl, { replace: true })
    }
    if (err.statusCode === 409 || err.data?.reason === 'season_closed') {
      emit('seasonClosed')
      return
    }
    if (err.statusCode === 429 || err.data?.reason === 'rate_limited') {
      rateLimited.value = true
      retryAfterSec.value = err.data?.retryAfterSec ?? 60
      return
    }
    // No statusCode means the request never reached the server — a
    // network failure (offline, DNS, dropped connection mid-flight).
    if (typeof err.statusCode !== 'number') {
      inlineError.value = { kind: 'offline' }
      focusInput()
      return
    }
    inlineError.value = { kind: 'generic' }
    focusInput()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mt-3.5 border border-[rgba(34,30,23,0.5)] p-4">
    <template v-if="!rateLimited">
      <form @submit.prevent="onSubmit">
        <p class="text-pretty font-serif text-[16px] leading-[1.6] text-ink">
          {{ question }}
        </p>

        <input
          ref="inputRef"
          v-model="answer"
          type="text"
          :placeholder="t('place.answerPlaceholder')"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          class="mt-3.5 min-h-[48px] w-full border bg-paper-input px-3.5 py-0 font-mono text-[12px] text-ink focus:outline-none"
          :class="
            inlineError
              ? 'border-accent focus:border-accent'
              : 'border-[rgba(34,30,23,0.3)] focus:border-[rgba(34,30,23,0.5)]'
          "
          @focus="onInputFocus"
          @input="onInput"
        />

        <!-- CtaButton renders type="button": the click handler covers mouse
             activation, the form's submit covers Enter in the input. -->
        <CtaButton
          class="mt-3"
          :class="{ 'opacity-50': loading }"
          :disabled="loading"
          :label="t('place.submit')"
          @click="onSubmit"
        />
      </form>

      <div aria-live="polite">
        <p v-if="inlineError" class="mt-3 font-mono text-[11px] text-accent">
          {{ inlineErrorMessage }}
        </p>
      </div>
    </template>

    <p
      v-else
      role="status"
      aria-live="polite"
      class="text-pretty font-serif text-[13px] italic leading-[1.65] text-muted"
    >
      {{ rateLimitMessage }}
    </p>
  </div>

  <p
    v-if="!loggedIn"
    class="mt-3 text-pretty font-serif text-[13px] italic leading-[1.65] text-muted"
  >
    {{ t('place.loginToCheckin') }}
  </p>
</template>
