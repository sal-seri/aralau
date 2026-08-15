<script setup lang="ts">
const i18nHead = useLocaleHead()

useHead({
  htmlAttrs: {
    lang: () => i18nHead.value.htmlAttrs?.lang ?? 'ru'
  }
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
