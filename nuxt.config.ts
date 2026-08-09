// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/eslint'],
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css'
  },
  runtimeConfig: {
    dbHost: process.env.DB_HOST ?? '127.0.0.1',
    dbPort: process.env.DB_PORT ?? '5432',
    dbUser: process.env.DB_USER ?? 'aralau',
    dbPassword: process.env.DB_PASSWORD ?? 'aralau',
    dbName: process.env.DB_NAME ?? 'aralau'
  },
  typescript: {
    strict: true,
    typeCheck: true
  }
})
