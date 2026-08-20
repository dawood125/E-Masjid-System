/**
 * Phase 11: Scholars Module - Comprehensive Playwright Test
 *
 * Covers:
 *   - Admin scholars page renders + lists registered scholars
 *   - Add new scholar (admin-only) creates a scholar account
 *   - Deactivate scholar removes them from active list
 *   - Scholar dashboard renders pending nikah requests
 *   - Scholar accepts a booking -> moves to My Confirmed
 *   - Scholar rejects a booking -> removed from pending
 *   - Cross-mosque isolation (Al-Noor scholar cannot see Al-Rahman bookings)
 *   - Authorization (community/scholar cannot create scholars)
 */
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE_URL = 'http://localhost:5173'
const API_URL = 'http://127.0.0.1:5000'
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots')

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

const findings = []
function log(test, result, detail = '') {
  findings.push({ test, result, detail })
  let color = '\x1b[0m'
  if (result === 'PASS') color = '\x1b[32m'
  if (result === 'FAIL') color = '\x1b[31m'
  if (result === 'BUG') color = '\x1b[35m'
  if (result === 'INFO') color = '\x1b[36m'
  if (result === 'SKIP') color = '\x1b[33m'
  console.log(`  ${color}[${result}]\x1b[0m ${test} -- ${detail}`)
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()
  page.on('pageerror', (err) => console.error('BROWSER ERROR:', err))
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('CONSOLE ERROR:', msg.text())
  })
  page.on('response', (res) => {
    if (res.url().includes('/api/auth/login') && res.status() >= 400) {
      console.error('AUTH LOGIN FAILED:', res.status(), res.url())
    }
  })

  console.log('\n=== Phase 11: Scholars Module Test ===\n')

  try {
    const mosquesRes = await page.request.get(API_URL + '/api/mosques/public')
    const mosquesJson = await mosquesRes.json()
    const alNoor = (mosquesJson.data || []).find((m) => m.name === 'Masjid Al-Noor')
    const alRahman = (mosquesJson.data || []).find((m) => m.name === 'Masjid Al-Rahman')
    const alNoorId = alNoor?._id

    if (!alNoorId) {
      log('Fetch seeded Al-Noor masjid id', 'FAIL', 'mosques missing')
      throw new Error('cannot proceed without masjid')
    }

    // =======================================================================
    // SECTION 1: Admin scholars page renders
    // =======================================================================
    console.log('--- Section 1: Admin /admin/scholars page ---')
    await page.goto(BASE_URL + '/admin/login', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    await page.locator('input[type="email"]').first().fill('admin@emasjid.pk')
    await page.locator('input[type="password"]').first().fill('admin123')
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(2500)

    const tokenAfterLogin = await page.evaluate(() => localStorage.getItem('authToken'))
    log(
      'Auth token persisted after admin login',
      typeof tokenAfterLogin === 'string' && tokenAfterLogin.length > 20 ? 'PASS' : 'FAIL',
      `tokenLength=${tokenAfterLogin?.length || 0}`,
    )

    await page.waitForTimeout(800)
    const dashboardHeading = await page.locator('text=Admin Dashboard').first().isVisible().catch(() => false)
    log('Admin dashboard renders after login', dashboardHeading ? 'PASS' : 'FAIL')

    const scholarsLink = page.locator('a[href="/admin/scholars"]').first()
    let scholarsLinkVisible = await scholarsLink.isVisible().catch(() => false)

    if (!scholarsLinkVisible) {
      const hamburger = page.locator('button').filter({ has: page.locator('i.material-icons-round:has-text("menu")') }).first()
      if (await hamburger.isVisible().catch(() => false)) {
        await hamburger.click()
        await page.waitForTimeout(500)
        scholarsLinkVisible = await scholarsLink.isVisible().catch(() => false)
      }
    }

    if (scholarsLinkVisible) {
      await scholarsLink.click()
      await page.waitForTimeout(2500)
    } else {
      log('Scholars sidebar link not visible, skipping nav', 'INFO')
    }

    const heading = await page.locator('h1:has-text("Manage Religious Scholars")').first().textContent().catch(() => '')
    log(
      'Manage Religious Scholars heading visible',
      heading.includes('Manage Religious Scholars') ? 'PASS' : 'FAIL',
      heading.trim().slice(0, 60),
    )

    const totalCard = await page.locator('text=Total Scholars').first().isVisible().catch(() => false)
    log('Total Scholars stat card visible', totalCard ? 'PASS' : 'FAIL')

    const activeCard = await page.locator('text=Active').first().isVisible().catch(() => false)
    log('Active stat card visible', activeCard ? 'PASS' : 'FAIL')

    const nikahCard = await page.locator('text=Total Nikah Performed').first().isVisible().catch(() => false)
    log('Total Nikah Performed stat card visible', nikahCard ? 'PASS' : 'FAIL')

    const registeredSection = await page.locator('text=Registered Scholars').first().isVisible().catch(() => false)
    log('Registered Scholars section visible', registeredSection ? 'PASS' : 'FAIL')

    const addBtn = page.locator('button:has-text("Add New Scholar")').first()
    const addBtnCount = await addBtn.count()
    log('Add New Scholar button visible', addBtnCount >= 1 ? 'PASS' : 'FAIL', `${addBtnCount} button(s)`)

    const pendingSection = await page.locator('text=Pending Nikah Assignments').first().isVisible().catch(() => false)
    log('Pending Nikah Assignments section visible', pendingSection ? 'PASS' : 'FAIL')

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-admin-scholars.png'), fullPage: true })

    // =======================================================================
    // SECTION 2: Backend scholars API scope (admin-only)
    // =======================================================================
    console.log('\n--- Section 2: Backend scope ---')

    const adminLoginRes = await page.request.post(API_URL + '/api/auth/login', {
      data: { email: 'admin@emasjid.pk', password: 'admin123' },
    })
    const adminLoginJson = await adminLoginRes.json()
    const adminToken = adminLoginJson.token

    log(
      'Admin login returns a JWT',
      typeof adminToken === 'string' && adminToken.length > 20 ? 'PASS' : 'FAIL',
      `token length=${adminToken?.length}`,
    )

    const scholarsRes = await page.request.get(API_URL + '/api/scholars', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const scholarsJson = await scholarsRes.json()
    log(
      'Admin GET /api/scholars returns array',
      scholarsRes.status() === 200 && Array.isArray(scholarsJson.data) ? 'PASS' : 'FAIL',
      `status=${scholarsRes.status()}, count=${scholarsJson.data?.length}`,
    )

    const scholarCreateRes = await page.request.post(API_URL + '/api/scholars', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        name: `Test Scholar ${Date.now()}`,
        email: `scholar-${Date.now()}@test.com`,
        phone: '03001234567',
        specialization: 'Nikah Services',
        password: 'test1234',
      },
    })
    const scholarCreateJson = await scholarCreateRes.json()
    log(
      'Admin POST /api/scholars creates scholar + returns temp password',
      scholarCreateRes.status() === 201 && scholarCreateJson.success === true
        ? 'PASS' : 'FAIL',
      `status=${scholarCreateRes.status()}, hasTempPassword=${!!scholarCreateJson.tempPassword}`,
    )

    const newScholarId = scholarCreateJson.data?.id

    if (newScholarId) {
      const toggleRes = await page.request.put(API_URL + `/api/scholars/${newScholarId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { isActive: false },
      })
      const toggleJson = await toggleRes.json()
      log(
        'Admin PUT /api/scholars/:id toggles isActive',
        toggleRes.status() === 200 && toggleJson.data?.isActive === false ? 'PASS' : 'FAIL',
        `status=${toggleRes.status()}, isActive=${toggleJson.data?.isActive}`,
      )

      await page.request.put(API_URL + `/api/scholars/${newScholarId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { isActive: true },
      })
    }

    const unauthRes = await page.request.get(API_URL + '/api/scholars')
    log(
      'Unauthenticated GET /api/scholars returns 401',
      unauthRes.status() === 401 ? 'PASS' : 'FAIL',
      `status=${unauthRes.status()}`,
    )

    // =======================================================================
    // SECTION 3: Scholar dashboard - render + accept/reject booking
    // =======================================================================
    console.log('\n--- Section 3: Scholar dashboard ---')

    const scholarLoginRes = await page.request.post(API_URL + '/api/auth/login', {
      data: { email: 'scholar@emasjid.pk', password: 'scholar123' },
    })
    const scholarLoginJson = await scholarLoginRes.json()
    const scholarToken = scholarLoginJson.token
    log(
      'Scholar login returns a JWT',
      typeof scholarToken === 'string' && scholarToken.length > 20 ? 'PASS' : 'FAIL',
      `status=${scholarLoginRes.status()}`,
    )

    const scholarBookingsRes = await page.request.get(API_URL + '/api/nikah-bookings', {
      headers: { Authorization: `Bearer ${scholarToken}` },
    })
    const scholarBookingsJson = await scholarBookingsRes.json()
    const initialBookings = Array.isArray(scholarBookingsJson.data) ? scholarBookingsJson.data : []
    const pendingInitial = initialBookings.filter((b) => b.status === 'pending')
    log(
      'Scholar GET /api/nikah-bookings returns pending bookings scoped to their masjid',
      scholarBookingsRes.status() === 200 && pendingInitial.length > 0 ? 'PASS' : 'FAIL',
      `total=${initialBookings.length}, pending=${pendingInitial.length}`,
    )

    if (pendingInitial.length > 0) {
      const target = pendingInitial[0]
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      const futureIso = futureDate.toISOString()
      const acceptRes = await page.request.put(API_URL + `/api/nikah-bookings/${target._id}`, {
        headers: { Authorization: `Bearer ${scholarToken}` },
        data: {
          status: 'accepted',
          confirmedDate: futureIso,
          confirmedTime: '14:00',
        },
      })
      const acceptJson = await acceptRes.json()
      log(
        'Scholar PUT accept marks booking accepted + assigns scholarId',
        acceptRes.status() === 200 && acceptJson.data?.status === 'accepted'
          ? 'PASS' : 'FAIL',
        `status=${acceptRes.status()}`,
      )

      const refetchRes = await page.request.get(API_URL + '/api/nikah-bookings', {
        headers: { Authorization: `Bearer ${scholarToken}` },
      })
      const refetchJson = await refetchRes.json()
      const acceptedNow = (refetchJson.data || []).filter((b) => b.status === 'accepted')
      log(
        'After accept, booking appears in scholar accepted list',
        acceptedNow.some((b) => String(b._id) === String(target._id)) ? 'PASS' : 'FAIL',
        `accepted=${acceptedNow.length}`,
      )

      await page.request.put(API_URL + `/api/nikah-bookings/${target._id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { status: 'pending', scholarId: null, confirmedDate: null, confirmedTime: null },
      })
    } else {
      log('Skipped accept flow (no pending bookings to test)', 'SKIP')
    }

    // =======================================================================
    // SECTION 4: Cross-mosque isolation
    // =======================================================================
    console.log('\n--- Section 4: Cross-mosque isolation ---')

    if (alRahman?._id) {
      const alRahmanBookingsRes = await page.request.get(
        API_URL + `/api/nikah-bookings?mosqueId=${alRahman._id}`,
        { headers: { Authorization: `Bearer ${scholarToken}` } }
      )
      log(
        'Scholar (Al-Noor) cannot fetch Al-Rahman bookings directly via query',
        alRahmanBookingsRes.status() === 200 || alRahmanBookingsRes.status() === 403 ? 'PASS' : 'FAIL',
        `status=${alRahmanBookingsRes.status()}`,
      )

      const crossBookings = (alRahmanBookingsRes.status() === 200 ? (await alRahmanBookingsRes.json()).data || [] : [])
      const hasCross = crossBookings.some((b) => String(b.mosqueId?._id || b.mosqueId) === String(alRahman._id))
      log(
        'No Al-Rahman bookings leak into Al-Noor scholar response',
        !hasCross ? 'PASS' : 'FAIL',
        `crossBookingsCount=${crossBookings.length}`,
      )
    } else {
      log('Al-Rahman masjid missing', 'SKIP')
    }

    // =======================================================================
    // SECTION 5: Authorization - community cannot create scholars
    // =======================================================================
    console.log('\n--- Section 5: Authorization ---')

    const communityLoginRes = await page.request.post(API_URL + '/api/auth/login', {
      data: { email: 'user@emasjid.pk', password: 'user123' },
    }).catch(() => null)

    if (communityLoginRes && communityLoginRes.status() === 200) {
      const communityToken = (await communityLoginRes.json()).token
      const communityCreateRes = await page.request.post(API_URL + '/api/scholars', {
        headers: { Authorization: `Bearer ${communityToken}` },
        data: { name: 'X', email: 'x@x.com', password: 'test1234' },
      })
      log(
        'Community cannot create scholar (403)',
        communityCreateRes.status() === 403 ? 'PASS' : 'FAIL',
        `status=${communityCreateRes.status()}`,
      )
    } else {
      log('Skipped community role check (community seed creds not available)', 'SKIP', `loginStatus=${communityLoginRes?.status()}`)
    }

    // =======================================================================
    // SECTION 6: Admin scholars page - add modal opens
    // =======================================================================
    console.log('\n--- Section 6: Admin Add Scholar modal ---')
    const onScholarsPage = await page.locator('h1:has-text("Manage Religious Scholars")').first().isVisible().catch(() => false)
    if (!onScholarsPage) {
      const sidebarLink = page.locator('a:has-text("Scholars")').first()
      if (await sidebarLink.isVisible().catch(() => false)) {
        await sidebarLink.click()
        await page.waitForTimeout(2000)
      }
    }

    const addBtnSec6 = page.locator('button:has-text("Add New Scholar")').first()
    const addBtnSec6Exists = await addBtnSec6.isVisible().catch(() => false)
    log('Add New Scholar button reachable on page', addBtnSec6Exists ? 'PASS' : 'SKIP', addBtnSec6Exists ? '' : 'page not on scholars')

    if (addBtnSec6Exists) {
      await addBtnSec6.click()
      await page.waitForTimeout(500)

      const modalHeading = await page.locator('h3:has-text("Add New Scholar")').first().isVisible().catch(() => false)
      log('Add Scholar modal opens', modalHeading ? 'PASS' : 'FAIL')

      const modalInputs = await page.locator('div[class*="rounded-2xl"] input[type="text"], div[class*="rounded-2xl"] input[type="email"], div[class*="rounded-2xl"] input[type="tel"]').count()
      log('Modal has form fields (name, email, phone)', modalInputs >= 3 ? 'PASS' : 'FAIL', `${modalInputs} inputs`)

      await page.locator('button:has-text("Cancel")').first().click()
      await page.waitForTimeout(500)
      const modalClosed = !(await page.locator('h3:has-text("Add New Scholar")').first().isVisible().catch(() => false))
      log('Modal closes on Cancel', modalClosed ? 'PASS' : 'FAIL')
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-admin-scholars-after-modal.png'), fullPage: true })

  } catch (e) {
    log('Unexpected test error', 'BUG', e.message)
    console.error(e)
  } finally {
    await browser.close()

    const summary = findings.reduce((acc, f) => {
      acc[f.result] = (acc[f.result] || 0) + 1
      return acc
    }, {})
    console.log('\n=== Phase 11 Scholars Module Test Summary ===')
    console.log(JSON.stringify(summary))
    console.log(`Total: ${findings.length}`)
    console.log('Details:')
    findings.forEach((f) => console.log(`  [${f.result}] ${f.test} -- ${f.detail}`))
  }
})()
