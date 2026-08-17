<script setup lang="ts">
import type { SeasonListItem, SeasonTocEntry } from '#shared/types/season'
import { isDraftEntry } from '#shared/types/season'

// Profile in the book aesthetic: the owner's page of the volume — colophon
// rows (handle, email, language) and sign-out. Minimal by design (5.5.4).
definePageMeta({ middleware: 'auth' })

const { t, locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const session = useUserSession()

const { data: seasons } = await useAsyncData('seasons:list', () =>
  $fetch<SeasonTocEntry[]>('/api/seasons')
)

const visibleSeasons = computed<SeasonListItem[]>(() =>
  (seasons.value ?? []).filter((entry): entry is SeasonListItem => !isDraftEntry(entry))
)

const year = computed(() => volumeYear(visibleSeasons.value))

const signingOut = ref(false)

async function signOut() {
  if (signingOut.value) return
  signingOut.value = true
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await session.fetch()
    await navigateTo('/auth/login')
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <BookPage
    :spine="t('title.spine', { year })"
    footer-left="aralau.kz"
    :footer-right="t('profile.footerPage')"
  >
    <div class="px-[22px] pt-[56px]">
      <p class="text-center font-mono text-[9.5px] tracking-[0.3em] text-faint uppercase">
        {{ t('title.eyebrow') }}
      </p>

      <MetaTable class="mt-[38px]">
        <MetaRow :label="t('title.meta.owner')" :value="session.user.value?.handle ? `@${session.user.value.handle}` : '—'" />
        <MetaRow :label="t('profile.email')" :value="session.user.value?.email ?? '—'" />
        <MetaRow :label="t('title.meta.lang')" separated>
          <template #value>
            <NuxtLink
              v-if="locale !== 'kk'"
              :to="switchLocalePath('kk')"
              class="text-faint no-underline"
            >
              ҚАЗ
            </NuxtLink>
            <span v-else class="border-b border-ink text-ink">ҚАЗ</span>
            <span class="text-[rgba(34,30,23,0.3)]">·</span>
            <NuxtLink
              v-if="locale !== 'ru'"
              :to="switchLocalePath('ru')"
              class="text-faint no-underline"
            >
              РУС
            </NuxtLink>
            <span v-else class="border-b border-ink text-ink">РУС</span>
          </template>
        </MetaRow>
      </MetaTable>

      <CtaButton
        class="mt-[26px]"
        variant="outline"
        :label="t('profile.signOut')"
        :disabled="signingOut"
        @click="signOut"
      />
    </div>
  </BookPage>
</template>
