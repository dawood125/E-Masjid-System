/**
 * Targeted mobile overflow test
 * Run with:  node Testing/03_Navbar_Masjid_Selection/mobile_overflow_test.js
 *
 * Captures screenshots at iPhone SE, Android small, Android medium, iPhone 12 widths
 * AND at the full Home page (so we can see the hero section + prayer card overflow).
 */

const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const FRONTEND = 'http://localhost:5173'

const SCREENSHOT_DIR = path.resolve(
  __dirname,
  'screenshots',
  'mobile'
)
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

const MOBILE_WIDTHS = [
  { name: 'iphone-se-320', width: 320, height: 568 },
  { name: 'android-360', width: 360, height: 740 },
  { name: 'iphone-12-390', width: 390, height: 844 },
  { name: 'android-large-412', width: 412, height: 915 },
  { name: 'tablet-portrait-768', width: 768, height: 1024 },
]

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const findings = []

  try {
    for (const vp of MOBILE_WIDTHS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
        isMobile: vp.width < 768,
        hasTouch: true,
      })
      const page = await context.newPage()

      await page.goto(FRONTEND, { waitUntil: 'networkidle' })
      await page.waitForTimeout(800)

      // Full page screenshot
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${vp.name}-home-fullpage.png`),
        fullPage: true,
      })

      // Top viewport screenshot
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${vp.name}-home-top.png`),
        fullPage: false,
      })

      // Check for horizontal overflow
      const overflow = await page.evaluate(() => {
        const docW = document.documentElement.clientWidth
        const scrollW = document.documentElement.scrollWidth
        const overflowing = []
        // Find every header descendant with a non-zero width
        const headerEls = document.querySelectorAll('header, header *')
        const headerInfo = []
        for (const el of headerEls) {
          const r = el.getBoundingClientRect()
          if (r.width === 0) continue
          if (r.right > docW + 0.5) {
            overflowing.push({
              tag: el.tagName,
              cls: (el.className && el.className.toString().slice(0, 80)) || '',
              text: (el.innerText || el.value || el.getAttribute('aria-label') || '').toString().slice(0, 50).replace(/\s+/g, ' '),
              right: Math.round(r.right),
              width: Math.round(r.width),
              x: Math.round(r.x),
            })
          }
        }
        // Also get the header & all top-level flex children widths
        const header = document.querySelector('header')
        const headerR = header ? header.getBoundingClientRect() : null
        const topChildren = header ? Array.from(header.children[0]?.children || []).map((c) => {
          const r = c.getBoundingClientRect()
          return { tag: c.tagName, cls: c.className.slice(0, 50), width: Math.round(r.width), x: Math.round(r.x) }
        }) : []
        return {
          clientWidth: docW,
          scrollWidth: scrollW,
          overflow: scrollW > docW,
          headerWidth: headerR ? Math.round(headerR.width) : null,
          headerLeft: headerR ? Math.round(headerR.left) : null,
          headerRight: headerR ? Math.round(headerR.right) : null,
          topChildren,
          overflowing: overflowing.slice(0, 20),
        }
      })

      findings.push({ viewport: vp.name, ...overflow })

      await context.close()
    }
  } finally {
    await browser.close()
  }

  console.log('\n=== Mobile overflow report ===')
  for (const f of findings) {
    const flag = f.overflow ? '[OVERFLOW]' : '[ok]'
    console.log(
      `\n${flag} ${f.viewport}  clientWidth=${f.clientWidth}  scrollWidth=${f.scrollWidth}  (overflow=${f.scrollWidth - f.clientWidth}px)`
    )
    for (const o of f.overflowing) {
      console.log(
        `        - <${o.tag}> "${o.text}" right=${o.right} width=${o.width} x=${o.x}`
      )
    }
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
