/**
 * Phase 4 visual test — capture the new marketing homepage at multiple widths.
 * Saves screenshots to Testing/03_Navbar_Masjid_Selection/screenshots/phase4/
 */
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots', 'phase4')
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

const VIEWPORTS = [
  { name: 'mobile-425',     width: 425,  height: 900  },
  { name: 'iphone-12-390',  width: 390,  height: 844  },
  { name: 'tablet-768',     width: 768,  height: 1024 },
  { name: 'desktop-1280',   width: 1280, height: 800  },
  { name: 'desktop-1440',   width: 1440, height: 900  },
]

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const findings = []

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.width < 768 ? 2 : 1,
      isMobile: vp.width < 768,
    })
    const page = await context.newPage()
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
    // Wait for hero video to attempt autoplay
    await page.waitForTimeout(2500)

    // Full page screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${vp.name}-fullpage.png`),
      fullPage: true,
    })

    // Top viewport (hero only)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${vp.name}-hero.png`),
      fullPage: false,
    })

    // Scroll to "Impact Counters" section and capture
    await page.evaluate(() => window.scrollTo(0, 1000))
    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${vp.name}-impact.png`),
      fullPage: false,
    })

    // Scroll to "Programs" section
    await page.evaluate(() => window.scrollTo(0, 2800))
    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${vp.name}-programs.png`),
      fullPage: false,
    })

    // Check overflow
    const overflow = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth
      const sw = document.documentElement.scrollWidth
      const overflowing = []
      document.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.right > docW + 0.5 && r.width > 0) {
          overflowing.push({
            tag: el.tagName,
            cls: (el.className && el.className.toString().slice(0, 60)) || '',
            right: Math.round(r.right),
            width: Math.round(r.width),
          })
        }
      })
      return {
        clientWidth: docW,
        scrollWidth: sw,
        overflow: sw > docW,
        overflowCount: overflowing.length,
        topOverflowers: overflowing.slice(0, 5),
      }
    })

    findings.push({ viewport: vp.name, ...overflow })
    await context.close()
  }

  await browser.close()
  console.log('\n=== Phase 4 visual test report ===')
  for (const f of findings) {
    const flag = f.overflow ? '[OVERFLOW]' : '[ok]'
    console.log(`${flag} ${f.viewport}  clientWidth=${f.clientWidth}  scrollWidth=${f.scrollWidth}  (overflow=${f.scrollWidth - f.clientWidth}px)  overflowing_els=${f.overflowCount}`)
    if (f.overflowCount) {
      for (const o of f.topOverflowers) {
        console.log(`        - <${o.tag}> "${o.cls}" right=${o.right} width=${o.width}`)
      }
    }
  }
  console.log(`\nScreenshots in: ${SCREENSHOT_DIR}`)
})().catch((e) => { console.error(e); process.exit(1) })
