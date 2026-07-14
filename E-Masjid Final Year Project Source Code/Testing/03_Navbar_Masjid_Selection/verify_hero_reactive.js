/**
 * Verify the hero heading reactively updates when the mosque dropdown changes.
 * This proves BUG-NAV-011 / FIX-NAV-011 (and the whole useMosque() refactor).
 */
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots', 'hero-reactive')
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // Read hero heading with the default selected mosque (likely Al-Noor from localStorage)
  const before = await page.locator('h1:has-text("Welcome to")').innerText()
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-before-switch.png'), fullPage: false })

  // Find the mosque dropdown (it has both "Masjid Al-Noor" and "Masjid Al-Rahman" as options)
  // The dropdown is a <select> with the <option> text containing "(Lahore)" for Al-Rahman
  const select = page.locator('select').filter({ hasText: 'Lahore' }).first()
  const optionsCount = await select.locator('option').count()
  console.log(`Mosque dropdown has ${optionsCount} options`)

  // Switch to Al-Rahman
  const rahmanValue = await select.locator('option').filter({ hasText: 'Lahore' }).first().getAttribute('value')
  await select.selectOption(rahmanValue)
  await page.waitForTimeout(1200)

  const after = await page.locator('h1:has-text("Welcome to")').innerText()
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-after-switch-to-rahman.png'), fullPage: false })

  // Switch back to Al-Noor
  const noorValue = await select.locator('option').filter({ hasText: 'Sheikhupura' }).first().getAttribute('value')
  await select.selectOption(noorValue)
  await page.waitForTimeout(1200)

  const back = await page.locator('h1:has-text("Welcome to")').innerText()
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-after-switch-back-to-noor.png'), fullPage: false })

  console.log('\n=== Hero heading reactivity test ===')
  console.log('Before switch :', JSON.stringify(before))
  console.log('After  switch :', JSON.stringify(after))
  console.log('After  switch back:', JSON.stringify(back))

  // Verify the heading actually changed
  const changed = before !== after
  const changedBack = after !== back
  console.log('\nHeading changed on dropdown switch :', changed ? 'YES ✅' : 'NO ❌')
  console.log('Heading changed back on second switch :', changedBack ? 'YES ✅' : 'NO ❌')

  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
