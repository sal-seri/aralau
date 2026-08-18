// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/eslint', '@vite-pwa/nuxt', '@nuxtjs/i18n', 'nuxt-auth-utils'],
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css'
  },
  css: [
    '~/assets/css/fonts.css',
    '@fontsource/pt-serif/400.css',
    '@fontsource/pt-serif/700.css',
    '@fontsource/pt-serif/400-italic.css',
    '@fontsource/pt-sans/400.css',
    '@fontsource/pt-sans/700.css',
    '@fontsource/pt-mono/latin-400.css',
    '@fontsource/pt-mono/cyrillic-400.css',
    '@fontsource/pt-mono/cyrillic-ext-400.css'
  ],
  runtimeConfig: {
    // Public base URL used for absolute og:image references.
    // Override locally with NUXT_PUBLIC_SITE_URL=http://localhost:3000
    public: {
      siteUrl: 'https://aralau.kz'
    },
    // nuxt-auth-utils sealed-cookie session.
    // h3 cookie defaults: httpOnly + secure + path '/'; SameSite set to lax here.
    // NUXT_SESSION_PASSWORD is injected from the environment automatically.
    session: {
      name: 'aralau-session',
      // 30 days — a PWA relaunch must keep the user signed in.
      maxAge: 60 * 60 * 24 * 30,
      cookie: {
        sameSite: 'lax'
      }
    },
    dbHost: process.env.DB_HOST ?? '127.0.0.1',
    dbPort: process.env.DB_PORT ?? '5432',
    dbUser: process.env.DB_USER ?? 'aralau',
    dbPassword: process.env.DB_PASSWORD ?? 'aralau',
    dbName: process.env.DB_NAME ?? 'aralau'
  },
  routeRules: {
    '/offline': { prerender: true },
    // Legacy Step 2–4 routes: the almanac title page replaced both the
    // seasons list and the passport placeholder — permanent redirects
    // keep old links (and the kk-prefixed variants) working.
    '/seasons': { redirect: { to: '/', statusCode: 301 } },
    '/passport': { redirect: { to: '/', statusCode: 301 } },
    '/kk/seasons': { redirect: { to: '/kk', statusCode: 301 } },
    '/kk/passport': { redirect: { to: '/kk', statusCode: 301 } },
    // The place HTML page embeds per-viewer content (storyText for found
    // readers). The matching API route sets the same header on its own
    // response; this rule mirrors it at the document layer so a shared
    // cache can never replay one user's unlocked content to another.
    // (Out-of-scope rule types like SSR `swr`/`isr` are intentionally not
    // applied here — personalised HTML must always be re-fetched.)
    '/places/**': {
      headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' }
    }
  },
  nitro: {
    externals: {
      // Bundle the generated Prisma client into the server build; left
      // external, its relative import breaks inside prerender workers.
      inline: [/generated[\\/]prisma/]
    }
  },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      meta: [
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'theme-color', content: '#221E17' }
      ],
      link: [{ rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png' }]
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Aralau — городской архив Алматы',
      short_name: 'Aralau',
      lang: 'ru',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      scope: '/',
      theme_color: '#221E17',
      background_color: '#EBE3CE',
      icons: [
        { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        {
          src: 'maskable-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,json}'],
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          urlPattern: '/api/',
          handler: 'NetworkOnly'
        },
        {
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkOnly',
          options: {
            precacheFallback: {
              fallbackURL: '/offline'
            }
          }
        }
      ]
    },
    client: {
      installPrompt: true
    },
    devOptions: {
      enabled: true
    }
  },
  i18n: {
    baseUrl: 'https://aralau.kz',
    defaultLocale: 'ru',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'ru', language: 'ru', name: 'Русский', file: 'ru.json' },
      { code: 'kk', language: 'kk', name: 'Қазақша', file: 'kk.json' }
    ],
    detectBrowserLanguage: false
  },
  typescript: {
    strict: true,
    typeCheck: true
  }
})
