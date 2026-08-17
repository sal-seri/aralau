<script setup lang="ts">
// Dev-only component showcase for the almanac book kit (sub-step 5.5.2).
// In production builds import.meta.dev is false, so the page redirects to /.
if (!import.meta.dev) {
  await navigateTo('/', { replace: true })
}

const romanTen = Array.from({ length: 10 }, (_, i) => toRoman(i + 1))

// Turn 12d — the exact three-stamp arrangement (left/top/rotation, .93).
const stampSheet = [
  { left: 2, top: 8, rotate: -11, ring: 'ARALAU · АЛМАТЫ · МАУСЫМ I · ОРЫН I ·', date: '12.03' },
  { left: 150, top: 38, rotate: 8, ring: 'ARALAU · АЛМАТЫ · МАУСЫМ I · ОРЫН II ·', date: '02.04' },
  { left: 62, top: 100, rotate: -4, ring: 'ARALAU · АЛМАТЫ · МАУСЫМ I · ОРЫН III ·', date: '04.05' }
]
</script>

<template>
  <BookPage spine="Том I · Алматы · 2026" footer-left="aralau.kz" footer-right="том I · бет 1">
    <div class="px-[22px] pb-10 pt-8">
      <header>
        <h1 class="font-serif text-2xl">Book kit — component proof</h1>
        <p class="mt-1 font-mono text-[10px] tracking-[0.22em] text-faint uppercase">
          dev only · /dev/book · turns t11/t12
        </p>
      </header>

      <section class="mt-8">
        <SectionHeader label="Шығыс деректер" />
        <div class="mt-3.5">
          <MetaTable>
            <MetaRow label="басылым" value="1 дана" />
            <MetaRow label="мерзімі" value="наурыз — желтоқсан 2026" />
            <MetaRow label="иесі" value="аты жазылмаған" tone="placeholder" />
            <MetaRow label="мөрлер" value="3 / 9" tone="accent" separated />
            <MetaRow label="тіл" separated>
              <template #value>
                <a href="#" class="border-b border-ink text-ink no-underline">ҚАЗ</a>
                <span class="text-[rgba(34,30,23,0.3)]">·</span>
                <a href="#" class="text-faint no-underline">РУС</a>
              </template>
            </MetaRow>
          </MetaTable>
        </div>
      </section>

      <section class="mt-8">
        <SectionHeader label="Мазмұны" />
        <div class="mt-3.5">
          <TocRow numeral="i" title="Первый слой" meta="3 / 3 · 4 мамыр" to="/" state="default" />
          <TocRow numeral="ii" title="Тереңдік" meta="0 / 3" to="/" state="active" />
          <TocRow numeral="iii" meta="жабық" state="locked" />
        </div>
      </section>

      <section class="mt-8">
        <SectionHeader label="Өту" />
        <div class="mt-3.5 space-y-6">
          <CtaButton to="/" label="Бірінші маусымды ашу" variant="primary" />
          <CtaButton to="/" label="Келесі орын · iii" variant="outline" />
        </div>
      </section>

      <section class="mt-8">
        <SectionHeader label="Мөр · 104 және 96" />
        <div class="mt-5 flex items-start gap-8">
          <StampMark
            :size="104"
            date="12.03"
            ring="ARALAU · АЛМАТЫ · МАУСЫМ I · ОРЫН I ·"
          />
          <StampMark
            :size="96"
            date="12.03"
            ring="ARALAU · АЛМАТЫ · МАУСЫМ I · ОРЫН II ·"
          />
        </div>
      </section>

      <section class="mt-8">
        <SectionHeader label="Мөр парағы" />
        <!-- Turn 12d: height 212, stamps at 2/8/-11°, 150/38/8°, 62/100/-4°, opacity .93 -->
        <div class="relative mt-3 h-[212px]">
          <div
            v-for="stamp in stampSheet"
            :key="stamp.ring"
            class="absolute opacity-[0.93]"
            :style="{
              left: `${stamp.left}px`,
              top: `${stamp.top}px`,
              transform: `rotate(${stamp.rotate}deg)`
            }"
          >
            <StampMark :size="104" :date="stamp.date" :ring="stamp.ring" />
          </div>
        </div>
        <p class="mt-0 font-mono text-[9.5px] tracking-[0.14em] text-faint uppercase">
          үш оттиск · парақ толды
        </p>
      </section>

      <section class="mt-8">
        <SectionHeader label="Бос орын" />
        <div class="mt-5">
          <StampSlot line1="МӨР" line2="бос орын" />
        </div>
      </section>

      <section class="mt-8">
        <SectionHeader label="Мәтін" />
        <p class="prose-book dropcap mt-[14px]">
          Первый сезон Aralau — места, которые город прячет на виду. Деревянный собор, старейший
          рынок, пешеходная улица с бронзовыми прохожими: ищите детали, на которые никто не
          смотрит, и собирайте первые оттиски в паспорт сезона.
        </p>
        <p class="prose-book prose-book--small mt-[22px]">
          Идите от собора вниз по пешеходной улице, пока воздух не изменится: специи, дыня,
          свежая рыба и сто голосов торговцев.
        </p>
      </section>

      <section class="mt-8">
        <SectionHeader label="toRoman · 1–10" />
        <p class="mt-[14px] font-mono text-[10px] tracking-[0.08em] text-muted">
          {{ romanTen.join(' · ') }}
        </p>
      </section>
    </div>
  </BookPage>
</template>
