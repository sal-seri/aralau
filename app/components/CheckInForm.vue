<script setup lang="ts">
// Check-in card (design 11d), self-contained so Step 6 only swaps the
// submit handler.
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
  <form class="mt-3.5 border-strong p-4" @submit.prevent="onSubmit">
    <p class="text-pretty font-serif text-[16px] leading-[1.6] text-ink">
      {{ question }}
    </p>

    <input
      v-model="answer"
      type="text"
      :placeholder="t('place.answerPlaceholder')"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      class="mt-3.5 min-h-[48px] w-full border border-[rgba(34,30,23,0.3)] bg-paper-input px-3.5 py-0 font-mono text-[12px] text-ink focus:border-[rgba(34,30,23,0.5)] focus:outline-none"
      @focus="onInputFocus"
    />

    <!-- CtaButton renders type="button": the click handler covers mouse
         activation, the form's submit covers Enter in the input. -->
    <CtaButton class="mt-3" :label="t('place.submit')" @click="onSubmit" />
  </form>

  <p
    v-if="!loggedIn"
    class="mt-3 text-pretty font-serif text-[13px] italic leading-[1.65] text-muted"
  >
    {{ t('place.loginToCheckin') }}
  </p>
  <p
    v-else-if="stubShown"
    role="status"
    class="mt-3 text-pretty font-serif text-[13px] italic leading-[1.65] text-muted"
  >
    {{ t('place.checkinSoon') }}
  </p>
</template>
