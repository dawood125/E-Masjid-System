/**
 * Phase 3.5 visual test: verifies (1) navbar mosque selector no longer hides
 * under hero (z-index fix) and (2) the new MosqueSearchModal opens.
 */
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots', 'phase35')
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // 1) Baseline — homepage with the new navbar mosque button
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-homepage-baseline.png') })

  // 2) Scroll the hero so the navbar overlaps the hero — verify the mosque button
  //    is NOT hidden behind the hero (z-index fix)
  await page.evaluate(() => window.scrollTo(0, 200))
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-scrolled-mosque-button-visible.png') })

  // 3) Click the mosque button to open the modal
  const mosqueBtn = page.locator('button:has-text("Select a mosque"), button:has-text("Masjid")').first()
  await mosqueBtn.click({ timeout: 5000 })
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-mosque-search-modal-open.png') })

  // 4) Type a search query
  await page.fill('input[placeholder*="Search by name"]', 'Lahore')
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-modal-search-results.png') })

  // 5) Close the modal (Escape)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-modal-closed.png') })

  // 6) Navigate to /register and verify the 2-step form
  await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-register-step1.png') })

  console.log('Phase 3.5 visual test complete — 6 screenshots in ' + SCREENSHOT_DIR)
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
