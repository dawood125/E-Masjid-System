const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE_URL = 'http://127.0.0.1:5174'
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots')

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

let passCount = 0, failCount = 0, bugCount = 0, infoCount = 0, skipCount = 0

function log(assertion, status, detail = '') {
  if (status === 'PASS') passCount++
  else if (status === 'FAIL') failCount++
  else if (status === 'BUG') bugCount++
  else if (status === 'INFO') infoCount++
  else if (status === 'SKIP') skipCount++
  
  let colorPrefix = ''
  let reset = '\x1b[0m'
  if (status === 'PASS') colorPrefix = '\x1b[32m'
  if (status === 'FAIL') colorPrefix = '\x1b[31m'
  if (status === 'BUG') colorPrefix = '\x1b[35m'
  if (status === 'INFO') colorPrefix = '\x1b[36m'
  if (status === 'SKIP') colorPrefix = '\x1b[33m'

  console.log("  " + colorPrefix + "[" + status + "]" + reset + " " + assertion + " -- " + detail)
}

async function runTests() {
  console.log('\n=== Phase 5: Prayer Timings Module Test ===\n')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()))
  page.on('pageerror', err => console.error('BROWSER ERROR:', err))

  try {
    console.log('\n--- Section 1: Public Prayer Times (Initial) ---')
    await page.goto(BASE_URL + '/')
    await page.waitForLoadState('networkidle')
    
    const fajrLabel = page.locator('p:has-text("Fajr")').first()
    let initialFajrTime = ''
    if (await fajrLabel.isVisible().catch(() => false)) {
       const fajrContainer = fajrLabel.locator('xpath=./..').first()
       initialFajrTime = await fajrContainer.locator('p.text-2xl').textContent().catch(() => '')
       log('Fajr time visible on homepage', initialFajrTime ? 'PASS' : 'FAIL', 'Initial Fajr: ' + initialFajrTime)
    } else {
       log('Fajr time visible on homepage', 'FAIL', 'Fajr label missing')
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-public-initial.png') })

    console.log('\n--- Section 2: Admin Login ---')
    await page.goto(BASE_URL + '/admin/login')
    await page.waitForLoadState('networkidle')
    
    await page.fill('#admin-email', 'admin@emasjid.pk')
    await page.fill('#admin-password', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1500)
    
    const dashboardTitle = await page.locator('h1:has-text("Dashboard")').isVisible().catch(() => false)
    log('Admin logged in successfully', dashboardTitle ? 'PASS' : 'FAIL', dashboardTitle ? 'Navigated to /admin' : 'Login failed')

    console.log('\n--- Section 3: Admin Prayer Times Updates ---')
    await page.goto(BASE_URL + '/admin/prayer-times')
    await page.waitForLoadState('networkidle')

    const prayerTimesTitle = await page.locator('h1:has-text("Prayer Times")').isVisible().catch(() => false)
    log('Admin Prayer Times page loads', prayerTimesTitle ? 'PASS' : 'FAIL', 'Title visible')
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-admin-prayer-times.png') })

    const fajrInput = page.locator('label:has-text("Fajr") >> input[type="time"]').first()
    const currentFajrInputValue = await fajrInput.inputValue().catch(() => '')
    
    const newFajrTime = currentFajrInputValue === '05:30' ? '05:45' : '05:30'
    await fajrInput.fill(newFajrTime)
    await page.waitForTimeout(500)
    
    const saveBtn = page.locator('button:has-text("Update Prayer Times")').first()
    if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click()
        await page.waitForTimeout(2000)
        
        const toastSuccess = await page.locator('text=Prayer times updated successfully').isVisible().catch(() => false)
        log('Update Prayer Times submission', toastSuccess ? 'PASS' : 'BUG', toastSuccess ? 'Success toast shown' : 'Toast missing')
    } else {
        log('Save button found', 'FAIL', 'Could not find save button')
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-admin-updated.png') })

    console.log('\n--- Section 4: Verify Public Updates ---')
    await page.goto(BASE_URL + '/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const fajrLabelUpdated = page.locator('p:has-text("Fajr")').first()
    let updatedFajrTime = ''
    if (await fajrLabelUpdated.isVisible().catch(() => false)) {
       const fajrContainer = fajrLabelUpdated.locator('xpath=./..').first()
       updatedFajrTime = await fajrContainer.locator('p.text-2xl').textContent().catch(() => '')
       
       const isUpdated = updatedFajrTime !== initialFajrTime
       log('Public Fajr time matches admin update', isUpdated ? 'PASS' : 'BUG', 'Old: ' + initialFajrTime + ' -> New: ' + updatedFajrTime)
    } else {
       log('Fajr time visible on homepage after update', 'FAIL', 'Fajr label missing')
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-public-updated.png') })

    console.log('\n--- Section 5: Public Prayer Times Page ---')
    await page.goto(BASE_URL + '/prayer-times')
    await page.waitForLoadState('networkidle')
    
    const publicPageTitle = await page.locator('h1:has-text("Prayer Times")').first().isVisible().catch(() => false)
    log('Public /prayer-times page loads', publicPageTitle ? 'PASS' : 'FAIL', 'Page renders')
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-public-page.png') })

  } catch (error) {
    console.error('\n? Test execution failed with error:', error)
  } finally {
    await browser.close()
  }

  console.log('\n=== Phase 5 Test Summary ===')
  console.log("  PASS: " + passCount + " | FAIL: " + failCount + " | BUG: " + bugCount + " | INFO: " + infoCount + " | SKIP: " + skipCount)
  console.log("  Total: " + (passCount + failCount + bugCount + infoCount + skipCount))
  console.log("  Screenshots saved to: " + SCREENSHOT_DIR + "\n")
}

runTests()
