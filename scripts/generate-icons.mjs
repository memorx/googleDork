/**
 * Genera los iconos PNG de la PWA (192 y 512) a partir del SVG de la lupa,
 * usando Chromium vía Playwright. Uso: node scripts/generate-icons.mjs
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'public', 'icons')

const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6366f1"/>
      <stop offset="1" stop-color="#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <g stroke="#ffffff" stroke-width="30" fill="none" stroke-linecap="round">
    <circle cx="228" cy="228" r="92"/>
    <line x1="300" y1="300" x2="398" y2="398"/>
  </g>
</svg>`

await mkdir(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage()

for (const size of [192, 512]) {
  await page.setViewportSize({ width: size, height: size })
  const sized = iconSvg.replace('<svg ', `<svg style="width:${size}px;height:${size}px" `)
  await page.setContent(`<!doctype html><body style="margin:0">${sized}</body>`)
  await page
    .locator('svg')
    .screenshot({ path: path.join(outDir, `icon-${size}.png`) })
  console.log(`Generado icon-${size}.png`)
}

await browser.close()
