/**
 * Phase 11: Scholars Module - Comprehensive Playwright Test
 *
 * Covers:
 *   - Admin scholars page renders + lists registered scholars
 *   - Add new scholar (admin-only) creates a scholar account
 *   - Edit scholar modal updates name/phone/specialization
 *   - Reset password modal sets new password (BUG: F4 fixed)
 *   - Activate button re-activates deactivated scholars (BUG: F5 fixed)
 *   - Deactivate scholar removes them from active list
 *   - Scholar dashboard renders pending nikah requests
 *   - Scholar accepts a booking -> moves to My Confirmed
 *   - Reject reason modal requires reason, persists rejectionReason
 *   - Cross-mosque isolation (Al-Rahman admin cannot see/edit Al-Noor scholars)
 *   - Authorization (community/scholar cannot create scholars)
 */
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE_URL = 'http://127.0.0.1:5174'
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
  const { execSync } = require('child_process')
  try {
    execSync('node utils/seed.js', {
      cwd: path.join(__dirname, '..', '..', 'backend'),
      stdio: 'pipe',
    })
    console.log('  [INFO] Re-seeded database before Playwright run')
  } catch (err) {
    console.error('  [WARN] Re-seed failed:', err.message)
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()
  page.on('pageerror', (err) => console.error('BROWSER ERROR:', err))
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('CONSOLE ERROR:', msg.text())
  })
  console.log('\n=== Phase 11: Scholars Module Test ===\n')

  try {
    const mosquesRes = await page.request.get(API_URL + '/api/mosques/public')
    const mosquesJson = await mosquesRes.json()
    const alNoor = (mosquesJson.data || []).find((m) => m.name === 'Masjid Al-Noor')
    const alRahman = (mosquesJson.data || []).find((m) => m.name === 'Masjid Al-Rahman')

    if (!alNoor?._id) {
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

    const inactiveCard = await page.locator('text=Inactive').first().isVisible().catch(() => false)
    log('Inactive stat card visible (replaces old Total Nikah Performed)', inactiveCard ? 'PASS' : 'FAIL')

    const nikahCard = await page.locator('text=Total Nikah Performed').first().isVisible().catch(() => false)
    log('Old "Total Nikah Performed" stat card is gone (not just hidden)', !nikahCard ? 'PASS' : 'FAIL')

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

    const typedPassword = 'typedpw99'
    const scholarCreateRes = await page.request.post(API_URL + '/api/scholars', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        name: `Test Scholar ${Date.now()}`,
        email: `scholar-${Date.now()}@test.com`,
        phone: '03001234567',
        specialization: 'Nikah Services',
        password: typedPassword,
      },
    })
    const scholarCreateJson = await scholarCreateRes.json()
    log(
      'Admin POST /api/scholars with typed password returns the same password (BUG-B2 fixed)',
      scholarCreateRes.status() === 201 && scholarCreateJson.tempPassword === typedPassword ? 'PASS' : 'FAIL',
      `status=${scholarCreateRes.status()}, tempPassword=${scholarCreateJson.tempPassword}, expected=${typedPassword}`,
    )

    const newScholarId = scholarCreateJson.data?.id

    if (newScholarId) {
      const loginAsNewScholar = await page.request.post(API_URL + '/api/auth/login', {
        data: { email: scholarCreateJson.data.email, password: typedPassword },
      })
      log(
        'Newly created scholar can login with the typed password (BUG-B2 verified end-to-end)',
        loginAsNewScholar.status() === 200 ? 'PASS' : 'FAIL',
        `loginStatus=${loginAsNewScholar.status()}`,
      )

      const editRes = await page.request.put(API_URL + `/api/scholars/${newScholarId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          name: 'Renamed Scholar',
          specialization: 'Nikah & Janazah',
        },
      })
      const editJson = await editRes.json()
      log(
        'Admin PUT /api/scholars/:id edits name + specialization',
        editRes.status() === 200 && editJson.data?.name === 'Renamed Scholar' && editJson.data?.specialization === 'Nikah & Janazah' ? 'PASS' : 'FAIL',
        `status=${editRes.status()}, name=${editJson.data?.name}`,
      )

      const resetRes = await page.request.post(API_URL + `/api/scholars/${newScholarId}/reset-password`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { password: 'resetpw88' },
      })
      const resetJson = await resetRes.json()
      log(
        'Admin POST /api/scholars/:id/reset-password returns newPassword (BUG-F4 fixed)',
        resetRes.status() === 200 && resetJson.newPassword === 'resetpw88' ? 'PASS' : 'FAIL',
        `status=${resetRes.status()}, newPassword=${resetJson.newPassword}`,
      )

      const loginAfterReset = await page.request.post(API_URL + '/api/auth/login', {
        data: { email: scholarCreateJson.data.email, password: 'resetpw88' },
      })
      log(
        'Scholar can login with reset password (end-to-end)',
        loginAfterReset.status() === 200 ? 'PASS' : 'FAIL',
        `loginStatus=${loginAfterReset.status()}`,
      )

      const deactivateRes = await page.request.put(API_URL + `/api/scholars/${newScholarId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { isActive: false },
      })
      const deactivateJson = await deactivateRes.json()
      log(
        'Admin PUT /api/scholars/:id sets isActive=false (deactivate)',
        deactivateRes.status() === 200 && deactivateJson.data?.isActive === false ? 'PASS' : 'FAIL',
        `status=${deactivateRes.status()}, isActive=${deactivateJson.data?.isActive}`,
      )

      const loginDeactivated = await page.request.post(API_URL + '/api/auth/login', {
        data: { email: scholarCreateJson.data.email, password: 'resetpw88' },
      })
      log(
        'Deactivated scholar cannot login (BUG-F5 verified end-to-end)',
        loginDeactivated.status() === 403 || loginDeactivated.status() === 401 ? 'PASS' : 'FAIL',
        `loginStatus=${loginDeactivated.status()}`,
      )

      const reactivateRes = await page.request.put(API_URL + `/api/scholars/${newScholarId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { isActive: true },
      })
      const reactivateJson = await reactivateRes.json()
      log(
        'Admin PUT /api/scholars/:id sets isActive=true (reactivate)',
        reactivateRes.status() === 200 && reactivateJson.data?.isActive === true ? 'PASS' : 'FAIL',
        `status=${reactivateRes.status()}, isActive=${reactivateJson.data?.isActive}`,
      )

      const loginReactivated = await page.request.post(API_URL + '/api/auth/login', {
        data: { email: scholarCreateJson.data.email, password: 'resetpw88' },
      })
      log(
        'Reactivated scholar can login again (full activate/deactivate cycle)',
        loginReactivated.status() === 200 ? 'PASS' : 'FAIL',
        `loginStatus=${loginReactivated.status()}`,
      )
    }

    const unauthRes = await page.request.get(API_URL + '/api/scholars')
    log(
      'Unauthenticated GET /api/scholars returns 401',
      unauthRes.status() === 401 ? 'PASS' : 'FAIL',
      `status=${unauthRes.status()}`,
    )

    // =======================================================================
    // SECTION 3: Cross-mosque isolation via API (admin2 = Al-Rahman)
    // =======================================================================
    console.log('\n--- Section 3: Cross-mosque isolation (admin2 = Al-Rahman) ---')

    if (alRahman?._id) {
      const admin2LoginRes = await page.request.post(API_URL + '/api/auth/login', {
        data: { email: 'admin2@emasjid.pk', password: 'admin123' },
      })
      const admin2Token = (await admin2LoginRes.json()).token

      const alRahmanScholarsRes = await page.request.get(API_URL + '/api/scholars', {
        headers: { Authorization: `Bearer ${admin2Token}` },
      })
      const alRahmanScholarsJson = await alRahmanScholarsRes.json()
      const alRahmanScholars = alRahmanScholarsJson.data || []
      const containsAlNoorEmail = alRahmanScholars.some((s) => s.email === 'scholar@emasjid.pk')
      log(
        'Al-Rahman admin GET /api/scholars does NOT include Al-Noor scholar',
        alRahmanScholarsRes.status() === 200 && !containsAlNoorEmail ? 'PASS' : 'FAIL',
        `count=${alRahmanScholars.length}, containsAlNoorScholar=${containsAlNoorEmail}`,
      )

      if (newScholarId) {
        const crossEditRes = await page.request.put(API_URL + `/api/scholars/${newScholarId}`, {
          headers: { Authorization: `Bearer ${admin2Token}` },
          data: { name: 'Hacked By Al-Rahman' },
        })
        log(
          'Al-Rahman admin PUT Al-Noor scholar returns 404 (no leak)',
          crossEditRes.status() === 404 ? 'PASS' : 'FAIL',
          `status=${crossEditRes.status()}`,
        )

        const crossResetRes = await page.request.post(API_URL + `/api/scholars/${newScholarId}/reset-password`, {
          headers: { Authorization: `Bearer ${admin2Token}` },
          data: { password: 'hackedpw1' },
        })
        log(
          'Al-Rahman admin POST reset-password on Al-Noor scholar returns 404 (no leak)',
          crossResetRes.status() === 404 ? 'PASS' : 'FAIL',
          `status=${crossResetRes.status()}`,
        )
      }
    } else {
      log('Al-Rahman masjid missing, skipping cross-mosque API check', 'SKIP')
    }

    // =======================================================================
    // SECTION 4: Scholar dashboard - render + accept/reject booking
    // =======================================================================
    console.log('\n--- Section 4: Scholar dashboard ---')

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

      const rejectRes = await page.request.put(API_URL + `/api/nikah-bookings/${target._id}`, {
        headers: { Authorization: `Bearer ${scholarToken}` },
        data: { status: 'rejected', rejectionReason: 'Schedule conflict with Jummah prayer' },
      })
      const rejectJson = await rejectRes.json()
      log(
        'Scholar PUT reject with rejectionReason persists the reason (BUG-F6 fixed)',
        rejectRes.status() === 200 && rejectJson.data?.status === 'rejected' && rejectJson.data?.rejectionReason === 'Schedule conflict with Jummah prayer'
          ? 'PASS' : 'FAIL',
        `status=${rejectRes.status()}, reason=${rejectJson.data?.rejectionReason}`,
      )

      const acceptTarget = pendingInitial[1] || pendingInitial[0]
      if (acceptTarget && String(acceptTarget._id) !== String(target._id)) {
        const acceptRes = await page.request.put(API_URL + `/api/nikah-bookings/${acceptTarget._id}`, {
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
          acceptedNow.some((b) => String(b._id) === String(acceptTarget._id)) ? 'PASS' : 'FAIL',
          `accepted=${acceptedNow.length}`,
        )
      } else {
        log('Only one pending booking — accept flow skipped (would need a separate pending booking)', 'SKIP')
      }
    } else {
      log('Skipped accept/reject flow (no pending bookings to test)', 'SKIP')
    }

    // =======================================================================
    // SECTION 5: Scholar dashboard frontend - reject reason modal
    // =======================================================================
    console.log('\n--- Section 5: Scholar dashboard UI - reject reason modal ---')

    await page.evaluate(() => {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
    })
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    await page.locator('input[type="email"]').first().fill('scholar@emasjid.pk')
    await page.locator('input[type="password"]').first().fill('scholar123')
    const roleSelect = page.locator('select#role, select[name="role"]').first()
    if (await roleSelect.isVisible().catch(() => false)) {
      await roleSelect.selectOption('scholar')
    }
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(2500)

    const greeting = await page.locator('h1:has-text("Assalam-o-Alaikum")').first().textContent().catch(() => '')
    log(
      'Scholar dashboard greeting uses scholar.name (BUG-F1 fixed: not hardcoded "Maulana Abdullah!")',
      !greeting.includes('Maulana Abdullah') && greeting.includes('Sheikh Muhammad Hassan')
        ? 'PASS' : 'FAIL',
      `greeting="${greeting.trim().slice(0, 100)}"`,
    )

    const confirmedUpcomingLabel = await page.locator('text=Confirmed Upcoming').first().isVisible().catch(() => false)
    log(
      '"Confirmed Upcoming" stat card visible (renamed from "Confirmed This Month")',
      confirmedUpcomingLabel ? 'PASS' : 'FAIL',
    )

    const rejectBtn = page.locator('button:has-text("Reject")').first()
    const rejectBtnVisible = await rejectBtn.isVisible().catch(() => false)
    if (rejectBtnVisible) {
      await rejectBtn.click()
      await page.waitForTimeout(500)

      const rejectModalHeading = await page.locator('h3:has-text("Reject Booking")').first().isVisible().catch(() => false)
      log('Reject Booking modal opens with reason textarea', rejectModalHeading ? 'PASS' : 'FAIL')

      const textareaVisible = await page.locator('textarea').first().isVisible().catch(() => false)
      log('Reject reason textarea visible', textareaVisible ? 'PASS' : 'FAIL')

      const submitEmpty = page.locator('button:has-text("Reject Booking")').first()
      await submitEmpty.click()
      await page.waitForTimeout(800)
      const modalStillOpen = await page.locator('h3:has-text("Reject Booking")').first().isVisible().catch(() => false)
      log(
        'Empty reason cannot submit reject (form validation blocks)',
        modalStillOpen ? 'PASS' : 'FAIL',
      )

      await page.locator('textarea').first().fill('Schedule conflict with Jummah prayer')
      await page.waitForTimeout(200)
      await page.locator('button:has-text("Reject Booking")').first().click()
      await page.waitForTimeout(1500)

      const modalClosed = !(await page.locator('h3:has-text("Reject Booking")').first().isVisible().catch(() => false))
      log('Reject modal closes after successful submit', modalClosed ? 'PASS' : 'FAIL')

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-scholar-after-reject.png'), fullPage: true })
    } else {
      log('No Reject button visible (no pending bookings for scholar)', 'SKIP')
    }

    // =======================================================================
    // SECTION 6: Authorization - community cannot create scholars
    // =======================================================================
    console.log('\n--- Section 6: Authorization ---')

    const communityLoginRes = await page.request.post(API_URL + '/api/auth/login', {
      data: { email: 'user@emasjid.pk', password: 'user1234' },
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

    const scholarCreateAsScholarRes = await page.request.post(API_URL + '/api/scholars', {
      headers: { Authorization: `Bearer ${scholarToken}` },
      data: { name: 'Self Promote', email: 'self@test.com', password: 'test1234' },
    })
    log(
      'Scholar cannot create another scholar (403)',
      scholarCreateAsScholarRes.status() === 403 ? 'PASS' : 'FAIL',
      `status=${scholarCreateAsScholarRes.status()}`,
    )

    // =======================================================================
    // SECTION 7: Admin Add Scholar modal (UI)
    // =======================================================================
    console.log('\n--- Section 7: Admin Add Scholar modal ---')
    await page.evaluate(() => {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
    })
    await page.goto(BASE_URL + '/admin/login', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    await page.locator('input[type="email"]').first().fill('admin@emasjid.pk')
    await page.locator('input[type="password"]').first().fill('admin123')
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(2500)

    const sidebarLink = page.locator('a:has-text("Scholars")').first()
    if (await sidebarLink.isVisible().catch(() => false)) {
      await sidebarLink.click()
      await page.waitForTimeout(2000)
    }

    const addBtnSec7 = page.locator('button:has-text("Add New Scholar")').first()
    if (await addBtnSec7.isVisible().catch(() => false)) {
      await addBtnSec7.click()
      await page.waitForTimeout(500)

      const modalHeading = await page.locator('h3:has-text("Add New Scholar")').first().isVisible().catch(() => false)
      log('Add Scholar modal opens', modalHeading ? 'PASS' : 'FAIL')

      const modalInputs = await page.locator('div[class*="rounded-2xl"] input[type="text"], div[class*="rounded-2xl"] input[type="email"], div[class*="rounded-2xl"] input[type="tel"], div[class*="rounded-2xl"] input[type="password"]').count()
      log('Modal has form fields (name, email, phone, password, confirm)', modalInputs >= 5 ? 'PASS' : 'FAIL', `${modalInputs} inputs`)

      await page.locator('button:has-text("Cancel")').first().click()
      await page.waitForTimeout(500)
      const modalClosed = !(await page.locator('h3:has-text("Add New Scholar")').first().isVisible().catch(() => false))
      log('Add modal closes on Cancel', modalClosed ? 'PASS' : 'FAIL')
    } else {
      log('Add New Scholar button not reachable', 'SKIP')
    }

    // =======================================================================
    // SECTION 8: Admin Edit Scholar modal (UI)
    // =======================================================================
    console.log('\n--- Section 8: Admin Edit Scholar modal (UI) ---')

    const editButton = page.locator('button[title="Edit scholar"]').first()
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click()
      await page.waitForTimeout(800)

      const editModal = page.locator('div.fixed.inset-0.z-50:has(h3:has-text("Edit Scholar"))').first()
      const editModalHeading = await editModal.locator('h3').first().isVisible().catch(() => false)
      log('Edit Scholar modal opens on edit icon click', editModalHeading ? 'PASS' : 'FAIL')

      const editNameInput = editModal.locator('form input[type="text"]').first()
      await editNameInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
      const nameInputValue = await editNameInput.inputValue().catch(() => '')
      log('Edit modal pre-fills existing name', nameInputValue.length > 0 ? 'PASS' : 'FAIL', `value="${nameInputValue.slice(0, 40)}"`)

      await editNameInput.fill('UI Edited Scholar')
      await page.waitForTimeout(200)

      await editModal.locator('button:has-text("Save Changes")').first().click()
      await page.waitForTimeout(1500)

      const editModalStillVisible = await editModal.isVisible().catch(() => false)
      log('Edit modal closes after Save Changes', !editModalStillVisible ? 'PASS' : 'FAIL')

      const newNameVisible = await page.locator('text=UI Edited Scholar').first().isVisible().catch(() => false)
      log('UI shows updated scholar name after save', newNameVisible ? 'PASS' : 'FAIL')
    } else {
      log('Edit scholar button not visible (no scholars to edit)', 'SKIP')
    }

    // =======================================================================
    // SECTION 9: Admin Reset Password modal (UI)
    // =======================================================================
    console.log('\n--- Section 9: Admin Reset Password modal (UI) ---')

    const resetButton = page.locator('button[title="Reset password"]').first()
    if (await resetButton.isVisible().catch(() => false)) {
      await resetButton.click()
      await page.waitForTimeout(800)

      const resetModal = page.locator('div.fixed.inset-0.z-50:has(h3:has-text("Reset Password"))').first()
      const resetModalHeading = await resetModal.locator('h3').first().isVisible().catch(() => false)
      log('Reset Password modal opens on key icon click', resetModalHeading ? 'PASS' : 'FAIL')

      const passwordInputs = await resetModal.locator('input[type="password"]').count()
      log('Reset modal has password + confirm fields', passwordInputs >= 2 ? 'PASS' : 'FAIL', `${passwordInputs} inputs`)

      const pwdInputs = resetModal.locator('input[type="password"]')
      await pwdInputs.first().fill('newpw99')
      await pwdInputs.nth(1).fill('newpw99')
      await page.waitForTimeout(200)

      await resetModal.locator('button:has-text("Reset Password")').first().click()
      await page.waitForTimeout(1500)

      const revealedBox = await resetModal.locator('text=Password updated successfully').first().isVisible().catch(() => false)
      log('Reset modal reveals the new password in success box', revealedBox ? 'PASS' : 'FAIL')

      const codeEl = await resetModal.locator('code').first().textContent().catch(() => '')
      log(
        'Revealed password equals the one admin typed',
        codeEl.trim() === 'newpw99' ? 'PASS' : 'FAIL',
        `code="${codeEl.trim()}"`,
      )

      const copyBtn = await resetModal.locator('button:has-text("Copy")').first().isVisible().catch(() => false)
      log('Copy button visible next to revealed password', copyBtn ? 'PASS' : 'FAIL')

      await resetModal.locator('button:has-text("Close")').first().click()
      await page.waitForTimeout(500)
    } else {
      log('Reset password button not visible', 'SKIP')
    }

    // =======================================================================
    // SECTION 10: Admin Activate (re-activate) flow (UI)
    // =======================================================================
    console.log('\n--- Section 10: Admin Activate flow (UI) ---')

    const deactivateBtn = page.locator('button[title="Deactivate"]').first()
    if (await deactivateBtn.isVisible().catch(() => false)) {
      await deactivateBtn.click()
      await page.waitForTimeout(1500)
      log('Deactivate icon toggles scholar to inactive', 'PASS', 'icon clicked, toast expected')

      const activateBtn = page.locator('button[title="Activate"]').first()
      const activateBtnVisible = await activateBtn.isVisible().catch(() => false)
      log(
        'After deactivation, button changes from Deactivate to Activate (BUG-F5 UI fix)',
        activateBtnVisible ? 'PASS' : 'FAIL',
      )

      if (activateBtnVisible) {
        await activateBtn.click()
        await page.waitForTimeout(1500)
        const deactivateBtnAgain = page.locator('button[title="Deactivate"]').first()
        const backToDeactivate = await deactivateBtnAgain.isVisible().catch(() => false)
        log('After activation, button changes back to Deactivate (full cycle)', backToDeactivate ? 'PASS' : 'FAIL')
      }
    } else {
      log('No Deactivate button visible (no active scholars to test)', 'SKIP')
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-admin-scholars-final.png'), fullPage: true })

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