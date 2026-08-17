<script setup lang="ts">
// Dev-only font proof sheet (Kazakh Cyrillic coverage). In production
// builds import.meta.dev is false, so the page redirects to /.
if (!import.meta.dev) {
  await navigateTo('/', { replace: true })
}

const testString =
  'Ә Ң Һ Ү Ұ Қ Ғ І ә ң һ ү ұ қ ғ і · Алматының қалалық мұрағаты · Бір жыл. Үш маусым.'

const stacks = [
  { label: 'font-serif — Literata Variable / PT Serif', cls: 'font-serif' },
  { label: 'font-mono — JetBrains Mono Variable / PT Mono', cls: 'font-mono' },
  { label: 'font-sans — PT Sans', cls: 'font-sans' }
]

const rows = [
  { label: '14px', cls: 'text-sm' },
  { label: '16px', cls: 'text-base' },
  { label: '20px', cls: 'text-xl' },
  { label: '28px', cls: 'text-[28px]' },
  { label: 'italic 400', cls: 'italic' },
  { label: '600', cls: 'font-semibold' }
]
</script>

<template>
  <div class="min-h-dvh bg-paper px-5 py-8 text-ink">
    <header class="border-b border-line pb-4">
      <h1 class="font-serif text-2xl">Font proof — Kazakh Cyrillic</h1>
      <p class="mt-1 font-mono text-[10px] tracking-[0.22em] text-faint uppercase">
        dev only · /dev/fonts
      </p>
    </header>

    <section v-for="stack in stacks" :key="stack.label" class="mt-8">
      <h2 class="font-mono text-[10px] tracking-[0.22em] text-muted uppercase">
        {{ stack.label }}
      </h2>
      <p
        v-for="row in rows"
        :key="row.label"
        :class="[stack.cls, row.cls]"
        class="mt-3 leading-relaxed"
      >
        <span class="mr-2 font-mono text-[10px] tracking-wider text-placeholder uppercase">
          {{ row.label }}
        </span>{{ testString }}
      </p>
    </section>

    <section class="mt-10 border-t border-line pt-6">
      <h2 class="font-mono text-[10px] tracking-[0.22em] text-muted uppercase">Token swatches</h2>
      <div class="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">
        <p class="bg-paper-input border border-line px-3 py-2">paper-input</p>
        <p class="bg-ink px-3 py-2 text-paper">ink / paper</p>
        <p class="text-ink-body px-3 py-2">ink-body</p>
        <p class="text-accent px-3 py-2">accent</p>
        <p class="text-muted px-3 py-2">muted</p>
        <p class="text-faint px-3 py-2">faint</p>
        <p class="text-placeholder px-3 py-2">placeholder</p>
        <p class="border-line-strong px-3 py-2">line-strong</p>
      </div>
    </section>
  </div>
</template>
