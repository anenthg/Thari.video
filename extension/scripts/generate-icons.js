#!/usr/bin/env node

/**
 * Generates OpenLoom extension icons at 16x16, 48x48, and 128x128 px.
 *
 * The icon design: a rounded-rect "window" with the Jamakkalam stripe pattern
 * as background, a dark inner panel with traffic-light dots, and a play triangle.
 *
 * Requirements: Node.js 18+ (uses built-in fetch — no external deps).
 * This script outputs SVG files and converts them to PNG using the <canvas> trick
 * via an embedded HTML page, OR you can just use the SVGs directly with a
 * converter like Inkscape, librsvg, or sharp.
 *
 * Usage:
 *   node scripts/generate-icons.js          # writes SVGs to icons/
 *   node scripts/generate-icons.js --png    # also converts to PNG (requires sharp)
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ICONS_DIR = join(__dirname, '..', 'icons')

// Brand colors
const COLORS = {
  warpIndigo: '#1A1A2E',
  cotton: '#F5F5E8',
  crimson: '#D92B2B',
  mustard: '#F5C518',
  emerald: '#0E9A57',
  deepBlack: '#0A0A12',
}

function generateSVG(size) {
  // Scale factor relative to 128
  const s = size / 128

  // Outer rounded rect
  const r = Math.round(24 * s) // corner radius
  const pad = Math.round(4 * s) // padding for stripe background

  // Inner window
  const winInset = Math.round(16 * s)
  const winR = Math.round(12 * s)
  const winW = size - winInset * 2
  const winH = size - winInset * 2

  // Traffic light dots
  const dotR = Math.max(Math.round(3.5 * s), 1)
  const dotY = winInset + Math.round(12 * s)
  const dotStartX = winInset + Math.round(12 * s)
  const dotGap = Math.round(8 * s)

  // Play triangle
  const triCX = size / 2 + Math.round(2 * s) // offset slightly right for optical center
  const triCY = size / 2 + Math.round(6 * s)
  const triSize = Math.round(20 * s)

  // Stripe pattern (simplified Jamakkalam bands)
  const stripeId = `stripes-${size}`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <pattern id="${stripeId}" x="0" y="0" width="${Math.round(48 * s)}" height="${size}" patternUnits="userSpaceOnUse">
      <rect width="${Math.round(48 * s)}" height="${size}" fill="${COLORS.warpIndigo}"/>
      <rect x="0" y="0" width="${Math.round(3 * s)}" height="${size}" fill="${COLORS.cotton}" opacity="0.7"/>
      <rect x="${Math.round(4 * s)}" y="0" width="${Math.round(10 * s)}" height="${size}" fill="${COLORS.emerald}"/>
      <rect x="${Math.round(16 * s)}" y="0" width="${Math.round(4 * s)}" height="${size}" fill="${COLORS.mustard}"/>
      <rect x="${Math.round(22 * s)}" y="0" width="${Math.round(10 * s)}" height="${size}" fill="${COLORS.crimson}"/>
      <rect x="${Math.round(34 * s)}" y="0" width="${Math.round(3 * s)}" height="${size}" fill="${COLORS.deepBlack}"/>
      <rect x="${Math.round(39 * s)}" y="0" width="${Math.round(4 * s)}" height="${size}" fill="${COLORS.mustard}"/>
    </pattern>
    <clipPath id="outer-clip-${size}">
      <rect width="${size}" height="${size}" rx="${r}" ry="${r}"/>
    </clipPath>
  </defs>

  <!-- Stripe background -->
  <g clip-path="url(#outer-clip-${size})">
    <rect width="${size}" height="${size}" fill="url(#${stripeId})"/>
  </g>

  <!-- Dark inner window -->
  <rect x="${winInset}" y="${winInset}" width="${winW}" height="${winH}" rx="${winR}" ry="${winR}" fill="${COLORS.warpIndigo}" opacity="0.92"/>
  <rect x="${winInset}" y="${winInset}" width="${winW}" height="${winH}" rx="${winR}" ry="${winR}" fill="none" stroke="${COLORS.cotton}" stroke-opacity="0.08" stroke-width="${Math.max(Math.round(s), 1)}"/>

  <!-- Traffic light dots -->
  <circle cx="${dotStartX}" cy="${dotY}" r="${dotR}" fill="${COLORS.crimson}"/>
  <circle cx="${dotStartX + dotGap}" cy="${dotY}" r="${dotR}" fill="${COLORS.mustard}"/>
  <circle cx="${dotStartX + dotGap * 2}" cy="${dotY}" r="${dotR}" fill="${COLORS.emerald}"/>

  <!-- Play triangle -->
  <polygon points="${triCX - triSize * 0.4},${triCY - triSize * 0.5} ${triCX - triSize * 0.4},${triCY + triSize * 0.5} ${triCX + triSize * 0.5},${triCY}" fill="${COLORS.cotton}" opacity="0.85"/>
</svg>`
}

// Ensure icons directory exists
mkdirSync(ICONS_DIR, { recursive: true })

for (const size of [16, 48, 128]) {
  const svg = generateSVG(size)
  const svgPath = join(ICONS_DIR, `icon-${size}.svg`)
  writeFileSync(svgPath, svg)
  console.log(`  wrote ${svgPath}`)
}

console.log('\nSVG icons generated. To convert to PNG:')
console.log('  Option A: Install sharp and uncomment the PNG section below')
console.log('  Option B: Use Inkscape: inkscape -w 128 -h 128 icon-128.svg -o icon-128.png')
console.log('  Option C: Use librsvg: rsvg-convert -w 128 -h 128 icon-128.svg > icon-128.png')

// Uncomment if sharp is installed:
// import sharp from 'sharp'
// for (const size of [16, 48, 128]) {
//   const svgPath = join(ICONS_DIR, `icon-${size}.svg`)
//   const pngPath = join(ICONS_DIR, `icon-${size}.png`)
//   await sharp(svgPath).resize(size, size).png().toFile(pngPath)
//   console.log(`  wrote ${pngPath}`)
// }
