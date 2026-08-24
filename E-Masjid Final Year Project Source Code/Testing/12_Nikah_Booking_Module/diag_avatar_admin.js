const { chromium } = require('playwright')

const E2E_HOST = String.fromCharCode(49, 50, 55, 46, 48, 46, 48, 46, 49)
const BASE_URL = `http://${E2E_HOST}:5174`

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await ctx.newPage()

  await page.goto(BASE_URL + '/admin/login', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  await page.locator('input[type="email"]').first().fill('admin@emasjid.pk')
  await page.locator('input[type="password"]').first().fill('admin123')
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(2500)

  await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)

  const avatar = page.locator('button[aria-label="Account menu"]').first()
  await avatar.click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'Testing/12_Nikah_Booking_Module/screenshots/navbar-avatar-admin-open.png', fullPage: false })
  const adminLink = await page.locator('a:has-text("Admin Dashboard")').first().isVisible().catch(() => false)
  console.log('admin role link visible:', adminLink)

  await browser.close()
})()