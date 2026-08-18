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
    extend: {
      colors: {
        paper: '#EBE3CE',
        'paper-input': '#F3EEDF',
        ink: {
          DEFAULT: '#221E17',
          body: '#2B261E'
        },
        accent: '#9A4236',
        muted: '#6E6553',
        faint: '#8A7F66',
        tagline: '#453E32',
        placeholder: '#9B917C',
        line: {
          soft: 'rgba(34, 30, 23, 0.12)',
          DEFAULT: 'rgba(34, 30, 23, 0.18)',
          strong: 'rgba(34, 30, 23, 0.4)'
        }
      },
      fontFamily: {
        // JetBrains Mono lacks Kazakh Cyrillic glyphs (Ә Ң Һ Ұ Қ Ғ) — PT Mono covers them.
        serif: ['"Literata Variable"', '"PT Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono Variable"', '"JetBrains Mono"', '"PT Mono"', 'ui-monospace', 'monospace'],
        sans: ['"PT Sans"', 'system-ui', 'Arial', 'sans-serif']
      }
    }
  },
  plugins: []
}
