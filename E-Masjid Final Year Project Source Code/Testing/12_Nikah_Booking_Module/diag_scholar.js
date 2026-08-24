const { chromium } = require('playwright')

const E2E_HOST = String.fromCharCode(49, 50, 55, 46, 48, 46, 48, 46, 49)
const BASE_URL = `http://${E2E_HOST}:5174`

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  const roleDropdown = page.locator('select').first()
  if (await roleDropdown.isVisible().catch(() => false)) {
    await roleDropdown.selectOption({ value: 'scholar' }).catch(() => {})
  }
  await page.locator('input[type="email"]').first().fill('scholar@emasjid.pk')
  await page.locator('input[type="password"]').first().fill('scholar123')
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(2500)

  await page.goto(BASE_URL + '/scholar', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)

  const pageUrl = page.url()
  console.log('current URL:', pageUrl)
  const pageTitle = await page.title()
  console.log('page title:', pageTitle)
  const h1s = await page.evaluate(() => Array.from(document.querySelectorAll('h1, h2')).map(h => h.textContent.trim().slice(0, 60)))
  console.log('headings:', h1s)

  const allButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map((b) => ({
      text: b.textContent.trim().slice(0, 40),
      visible: window.getComputedStyle(b).display !== 'none' && b.offsetParent !== null,
    }))
  })
  console.log('--- ALL BUTTONS on /scholar ---')
  allButtons.forEach((b, i) => {
    console.log(`[${i}] visible=${b.visible} text="${b.text}"`)
  })

  const acceptExact = await page.locator('button:text-is("Accept")').count()
  console.log('Accept exact match count:', acceptExact)

  const acceptContains = await page.locator('button:has-text("Accept")').count()
  console.log('Accept contains count:', acceptContains)

  const tableRows = await page.evaluate(() => Array.from(document.querySelectorAll('table tbody tr')).map((tr) => tr.textContent.replace(/\s+/g, ' ').trim().slice(0, 100)))
  console.log('table tbody rows:', tableRows)

  const hasNoPending = await page.locator('text=No pending requests right now').isVisible().catch(() => false)
  console.log('No pending requests visible:', hasNoPending)

  await browser.close()
})()