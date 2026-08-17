// One-off generator for the default OG image: 1200×630 PNG,
// paper background, ink PT Serif wordmark, stamp-circle accent.
// Run: npm run og
//
// Rendering: @resvg/resvg-js — sharp's bundled librsvg cannot load custom
// fonts on this platform (verified: data-URI @font-face is ignored), so
// resvg renders the SVG with the PT Serif TTFs from @expo-google-fonts,
// and sharp writes/normalizes the final PNG. Both are devDependencies;
// the output (public/og/default.png) is committed, so this only re-runs
// when the branding changes.
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import sharp from 'sharp'

const require = createRequire(import.meta.url)
const rootDir = fileURLToPath(new URL('..', import.meta.url))

const PAPER = '#EBE3CE'
const INK = '#221E17'
const INK_SOFT = '#6E6553'
const ACCENT = '#9A4236'

const fontFiles = [
  require.resolve('@expo-google-fonts/pt-serif/700Bold/PTSerif_700Bold.ttf')
]

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${PAPER}"/>

  <!-- archive card frame -->
  <rect x="36" y="36" width="1128" height="558" fill="none" stroke="${INK}" stroke-opacity="0.18" stroke-width="2"/>
  <rect x="44" y="44" width="1112" height="542" fill="none" stroke="${INK}" stroke-opacity="0.08" stroke-width="1"/>

  <!-- stamp circle accent -->
  <g transform="rotate(-14 930 330)">
    <circle cx="930" cy="330" r="178" fill="none" stroke="${ACCENT}" stroke-width="10"/>
    <circle cx="930" cy="330" r="148" fill="none" stroke="${ACCENT}" stroke-width="4"/>
    <text x="930" y="392" text-anchor="middle" font-family="PT Serif" font-size="184" font-weight="700" fill="${ACCENT}">A</text>
    <circle cx="930" cy="133" r="7" fill="${ACCENT}"/>
    <circle cx="930" cy="527" r="7" fill="${ACCENT}"/>
  </g>

  <!-- wordmark -->
  <text x="96" y="332" font-family="PT Serif" font-size="172" font-weight="700" letter-spacing="4" fill="${INK}">Aralau</text>
  <rect x="100" y="382" width="430" height="4" fill="${ACCENT}"/>

  <!-- tagline -->
  <text x="100" y="452" font-family="PT Serif" font-size="38" font-weight="700" letter-spacing="10" fill="${INK_SOFT}">ГОРОДСКОЙ АРХИВ · АЛМАТЫ</text>

  <!-- baseline -->
  <text x="100" y="530" font-family="PT Serif" font-size="26" font-weight="700" letter-spacing="6" fill="${INK_SOFT}">ARALAU.KZ</text>
</svg>
`

const resvg = new Resvg(svg, {
  font: {
    fontFiles,
    loadSystemFonts: false,
    defaultFontFamily: 'PT Serif'
  },
  fitTo: { mode: 'width', value: 1200 }
})

const outDir = path.join(rootDir, 'public', 'og')
await mkdir(outDir, { recursive: true })
const outFile = path.join(outDir, 'default.png')

await sharp(resvg.render().asPng()).png().toFile(outFile)

const meta = await sharp(outFile).metadata()
console.info(`Wrote ${path.relative(rootDir, outFile)} (${meta.width}x${meta.height})`)
