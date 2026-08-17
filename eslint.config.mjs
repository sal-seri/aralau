// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import prettier from 'eslint-config-prettier'

export default withNuxt(
  {
    ignores: ['design/**']
  },
  // Your custom configs here
  prettier
)
