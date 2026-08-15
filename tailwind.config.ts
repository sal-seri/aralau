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
        paper: {
          DEFAULT: '#F4EFE6',
          dim: '#EAE3D4'
        },
        ink: {
          DEFAULT: '#211D18',
          soft: '#6B6353'
        },
        accent: '#B3392C'
      },
      fontFamily: {
        serif: ['"PT Serif"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['"PT Sans"', 'system-ui', 'Arial', 'sans-serif']
      }
    }
  },
  plugins: []
}
