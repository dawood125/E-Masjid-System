const { chromium } = require('playwright')

const E2E_HOST = String.fromCharCode(49, 50, 55, 46, 48, 46, 48, 46, 49)
const BASE_URL = `http://${E2E_HOST}:5174`

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await ctx.newPage()

  await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  await page.locator('input[type="email"]').first().fill('user@emasjid.pk')
  await page.locator('input[type="password"]').first().fill('user1234')
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(2500)

  await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)

  await page.screenshot({ path: 'Testing/12_Nikah_Booking_Module/screenshots/navbar-avatar-closed.png', fullPage: false })

  const avatar = page.locator('button[aria-label="Account menu"]').first()
  console.log('avatar count:', await avatar.count())
  if (await avatar.count() > 0) {
    await avatar.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'Testing/12_Nikah_Booking_Module/screenshots/navbar-avatar-open.png', fullPage: false })
    const dropdownVisible = await page.locator('text=Abdullah Ahmed').first().isVisible().catch(() => false)
    const logoutBtn = await page.locator('button:has-text("Logout")').first().isVisible().catch(() => false)
    console.log('dropdown shows name:', dropdownVisible)
    console.log('dropdown shows logout:', logoutBtn)
  }

  await browser.close()
})()