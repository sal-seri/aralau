<script setup lang="ts">
// Check-in form, self-contained so Step 6 only swaps the submit handler.
//
// Two sibling modes share one markup:
//   • `loggedIn === false` (the anonymous wall) — the question is shown,
//     but focusing the input or activating the button/pro form-submit
//     navigates to `loginUrl` (a pre-built `/auth/login?redirect=…`),
//     instead of behaving like a real form. Server returns the visitor
//     to this place page after Google sign-in is completed.
//   • `loggedIn === true` (signed-in + active season + not yet found) —
//     the form is interactive, but `onSubmit` is a stub that flips an
//     inline muted notice. Step 6 replaces ONLY `onSubmit` and the
//     `stubShown` ref with a real `POST` to the check-in API; the
//     surrounding markup and props remain.
//
// The control over which mode is active lives in the parent via props;
// the season-status decision (render the form at all vs. "season closed"
// branch) is OUT of this component and decided by the place page.

const props = defineProps<{
  question: string
  loggedIn: boolean
  // Fully-formatted login URL in the active locale, with a `?redirect=`
  // pointing back to this place page (locale-prefixed).
  loginUrl: string
}>()

const { t } = useI18n()

const answer = ref('')
const stubShown = ref(false)

// The wall fires on input focus OR form submit: both are "the user is
// trying to interact" signals. `replace: true` to keep the place page
// off the back stack once they are clearly proceeding to login.
function onInputFocus() {
  if (props.loggedIn) return
  return navigateTo(props.loginUrl, { replace: true })
}

function onSubmit() {
  if (props.loggedIn) {
    // Step 5 stub: real verification arrives in Step 6.
    stubShown.value = true
    return
  }
  return navigateTo(props.loginUrl, { replace: true })
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <p class="leading-relaxed text-ink">{{ question }}</p>

    <input
      v-model="answer"
      type="text"
      :placeholder="t('places.answerPlaceholder')"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      class="mt-4 min-h-[48px] w-full rounded-lg border border-ink/20 bg-paper px-4 text-base text-ink focus:border-ink/50 focus:outline-none"
      @focus="onInputFocus"
    />

    <button
      type="submit"
      class="mt-4 min-h-[48px] w-full rounded-lg bg-ink px-4 text-sm font-bold text-paper transition-opacity hover:opacity-90"
    >
      {{ t('places.submit') }}
    </button>

    <p v-if="!loggedIn" class="mt-3 text-sm text-ink-soft">
      {{ t('places.loginToCheckin') }}
    </p>
    <p v-else-if="stubShown" class="mt-3 text-sm text-ink-soft" role="status">
      {{ t('places.checkinSoon') }}
    </p>
  </form>
</template>