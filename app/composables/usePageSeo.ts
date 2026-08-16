// Per-page SEO meta. Title pattern: «{page} — Aralau»; og/twitter defaults;
// OG image is always the absolute default artwork (per-season art comes later).
// Canonical + hreflang alternates are handled globally in app.vue via useLocaleHead.
interface PageSeoOptions {
  title: () => string
  description: () => string
  ogTitle?: () => string
  ogDescription?: () => string
}

export function usePageSeo(options: PageSeoOptions) {
  const config = useRuntimeConfig()

  const title = () => `${options.title()} — Aralau`
  const description = options.description
  const ogImage = () => `${config.public.siteUrl}/og/default.png`

  useSeoMeta({
    title,
    description,
    ogTitle: options.ogTitle ?? title,
    ogDescription: options.ogDescription ?? description,
    ogType: 'website',
    ogImage,
    twitterCard: 'summary_large_image'
  })
}
