<script setup lang="ts">
definePageMeta({
  middleware: () => navigateTo(useLocalePath()('/seasons'), { replace: true })
})
</script>

<template>
  <div />
</template>
