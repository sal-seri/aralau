import { defineConfig } from 'vitest/config'

// Pure unit tests only — server/utils modules have no Nuxt runtime deps,
// so plain vitest (no Nuxt test-utils environment) is enough.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts']
  }
})
