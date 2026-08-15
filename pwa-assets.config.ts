import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023'
  },
  preset: {
    ...minimal2023Preset,
    // placeholder artwork is a full-bleed opaque square: no maskable padding needed
    maskable: {
      sizes: [512],
      padding: 0
    }
  },
  images: ['public/icon.svg']
})
