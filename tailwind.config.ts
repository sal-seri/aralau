import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.{vue,js,ts}',
    './app/pages/**/*.{vue,js,ts}',
    './app/app.vue',
    './app/app.{js,ts}',
    './server/**/*.{js,ts}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
