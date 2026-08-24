const { chromium } = require('playwright')

const E2E_HOST = String.fromCharCode(49, 50, 55, 46, 48, 46, 48, 46, 49)
const BASE_URL = `http://${E2E_HOST}:5174`
const API_URL = `http://${E2E_HOST}:5000`

function isoDaysFromNow(days) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  await page.locator('input[type="email"]').first().fill('user@emasjid.pk')
  await page.locator('input[type="password"]').first().fill('user1234')
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(2500)

  await page.goto(BASE_URL + '/nikah-booking', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)

  const e2eBooking = await page.evaluate(async (apiUrl) => {
    const token = localStorage.getItem('authToken')
    const res = await fetch(apiUrl + '/api/nikah-bookings', {
      headers: { Authorization: 'Bearer ' + token },
    })
    const json = await res.json()
    const list = Array.isArray(json.data) ? json.data : []
    return list.find((b) => (b.groomName || '').toLowerCase().includes('e2e groom')) || null
  }, API_URL)

  const acceptedDay = e2eBooking?.preferredDate ? e2eBooking.preferredDate.slice(0, 10) : isoDaysFromNow(5)
  console.log('booking day:', acceptedDay, 'time:', e2eBooking?.preferredTime, 'scholar:', e2eBooking?.assignedScholarName)

  const dayNumber = parseInt(new Date(acceptedDay + 'T00:00:00').getDate(), 10)
  const dayCell = page.locator(`div.grid.grid-cols-7 button:has(span:text-is("${dayNumber}"))`).first()
  console.log('dayCell count:', await dayCell.count())
  console.log('dayCell text before click:', (await dayCell.textContent()))
  const beforeClick = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('div.grid.grid-cols-7 button'))
    return buttons.map((b) => ({
      text: b.textContent,
      hasSelectedClass: b.className.includes('border-[#047857]') && b.className.includes('shadow-sm'),
    }))
  })
  console.log('BEFORE CLICK:', JSON.stringify(beforeClick.filter((b) => b.hasSelectedClass), null, 2))
  await dayCell.click()
  await page.waitForTimeout(1500)

  const slotDiagnostics = await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button'))
    const allClasses = allButtons.map((b) => ({
      text: (b.textContent || '').slice(0, 30).replace(/\s+/g, ' '),
      cls: b.className || '',
      disabled: b.disabled,
    }))
    return allClasses
  })
  console.log('--- ALL BUTTONS ---')
  slotDiagnostics.forEach((b, i) => {
    console.log(`[${i}] disabled=${b.disabled} cls="${b.cls.slice(0, 200)}" text="${b.text}"`)
  })

  await browser.close()
})()