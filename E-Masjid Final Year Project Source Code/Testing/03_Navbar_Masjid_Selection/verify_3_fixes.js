/**
 * Verify the 3 Phase 3.5 follow-up fixes:
 *   1. Navbar Services / More dropdowns no longer hidden under hero
 *   2. Register Step 1 validates all fields before moving to Step 2
 *   3. "Use my current location" button is gone from the mosque search modal
 */
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots', 'verify-fixes')
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const findings = []

  // ── FIX 1: Services / More dropdowns should appear above the hero ──
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  // Click the "Services" button
  const servicesBtn = page.locator('button:has-text("Services")').first()
  await servicesBtn.click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-services-dropdown-open.png') })
  // Check if the dropdown menu is visible (not behind hero)
  const dropdownVisible = await page.locator('a:has-text("Nikah Booking")').first().isVisible().catch(() => false)
  findings.push({ test: 'FIX 1: Services dropdown', result: dropdownVisible ? 'PASS' : 'FAIL', detail: dropdownVisible ? 'Dropdown items visible' : 'Dropdown items hidden' })

  // Close it
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)

  // Click the "More" button
  const moreBtn = page.locator('button:has-text("More")').first()
  await moreBtn.click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-more-dropdown-open.png') })
  const moreVisible = await page.locator('a:has-text("Announcements")').first().isVisible().catch(() => false)
  findings.push({ test: 'FIX 1: More dropdown', result: moreVisible ? 'PASS' : 'FAIL', detail: moreVisible ? 'Dropdown items visible' : 'Dropdown items hidden' })

  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)

  // ── FIX 3: Geolocation button should be GONE from the search modal ──
  const mosqueBtn = page.locator('button:has-text("Select a mosque"), button:has-text("Masjid")').first()
  await mosqueBtn.click({ timeout: 5000 })
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-search-modal-no-geolocation.png') })
  const geolocationBtnCount = await page.locator('button:has-text("Use my current location")').count()
  findings.push({
    test: 'FIX 3: Geolocation removed',
    result: geolocationBtnCount === 0 ? 'PASS' : 'FAIL',
    detail: geolocationBtnCount === 0 ? 'No geolocation button' : `${geolocationBtnCount} geolocation button(s) still present`,
  })

  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)

  // ── FIX 2: Register Step 1 validation ──
  await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  // Click "Continue" without filling any fields
  await page.locator('button:has-text("Continue")').first().click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-register-validation-errors.png') })
  // Check we are STILL on Step 1 (the URL did not change and the heading is still "Create Your Account")
  const stillOnStep1 = await page.locator('h2:has-text("Create Your Account")').isVisible()
  const step1of2 = await page.locator('p:has-text("Step 1 of 2")').isVisible()
  findings.push({
    test: 'FIX 2: Step 1 validation',
    result: stillOnStep1 && step1of2 ? 'PASS' : 'FAIL',
    detail: stillOnStep1 && step1of2 ? 'Did not advance to Step 2 when fields empty' : 'Advanced to Step 2 or step indicator missing',
  })

  // Now fill properly and advance
  await page.fill('#name', 'Test User')
  await page.fill('#email', `test${Date.now()}@example.com`)
  await page.fill('#phone', '03001234567')
  await page.fill('#password', 'Test1234')
  await page.fill('#confirmPassword', 'Test1234')
  await page.check('input[type="checkbox"]')
  await page.locator('button:has-text("Continue")').first().click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-register-step2.png') })
  const onStep2 = await page.locator('h2:has-text("Find Your Home Mosque")').isVisible()
  findings.push({
    test: 'FIX 2: Step 1 → Step 2 (valid)',
    result: onStep2 ? 'PASS' : 'FAIL',
    detail: onStep2 ? 'Advanced to Step 2 with valid fields' : 'Did not advance to Step 2',
  })

  console.log('\n=== Phase 3.5 fix verification ===')
  for (const f of findings) {
    console.log(`  [${f.result}] ${f.test}  —  ${f.detail}`)
  }
  const allPass = findings.every(f => f.result === 'PASS')
  console.log(`\n${allPass ? '✅ ALL 3 FIXES VERIFIED' : '❌ SOME FIXES FAILED — see above'}`)

  await browser.close()
  process.exit(allPass ? 0 : 1)
})().catch((e) => { console.error(e); process.exit(1) })
