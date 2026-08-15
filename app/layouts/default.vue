<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
  <div class="min-h-dvh">
    <header class="border-b border-ink/10 bg-paper">
      <div class="mx-auto flex h-14 max-w-md items-center justify-center px-4">
        <NuxtLink
          :to="localePath('/')"
          class="font-serif text-xl font-bold uppercase tracking-[0.2em] text-ink"
        >
          Aralau
        </NuxtLink>
      </div>
    </header>

    <main class="mx-auto w-full max-w-md px-4 pt-6 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <slot />
    </main>

    <TabBar />
  </div>
</template>
