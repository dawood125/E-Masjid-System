/**
 * Phase 7: Events Module - Comprehensive Playwright Test
 *
 * Covers the same auth/scope hardening as Phase 6 (BUG-EVENT-001):
 *   - admin/manager/scholar/committee must use /api/events/admin (server
 *     scopes to caller.mosqueId). An unscoped call to /api/events returns
 *     rows from every masjid, so the admin UI must NEVER hit it directly.
 *   - manager: cross-mosque by design (manages all 4 seeded masjids).
 *     Picks ?mosqueId=<managed id>; rejected with 400 if not one of theirs.
 *   - admin (regular): forbidden to POST/PUT against a different masjid.
 *
 * Plus the original Phase 7 UI smoke test (public page + admin CRUD).
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

function futureDate(daysAhead) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toISOString().slice(0, 10)
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  page.on('pageerror', (err) => console.error('BROWSER ERROR:', err))

  console.log('\n=== Phase 7: Events Module Test ===\n')

  try {
    // Pull masjid ids up front so the API sections can reference them.
    const mosquesRes = await page.request.get(API_URL + '/api/mosques/public')
    const mosquesJson = await mosquesRes.json()
    const alNoor = (mosquesJson.data || []).find((m) => m.name === 'Masjid Al-Noor')
    const alRahman = (mosquesJson.data || []).find((m) => m.name === 'Masjid Al-Rahman')
    const alNoorId = alNoor?._id
    const alRahmanId = alRahman?._id
    if (!alNoorId || !alRahmanId) {
      log('Fetch seeded masjid ids', 'FAIL', 'mosques missing')
    }

    // =======================================================================
    // SECTION 1: Public /events page — initial Al-Noor state
    // =======================================================================
    console.log('--- Section 1: Public /events page (Al-Noor) ---')
    await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' })
    await page.evaluate((id) => { localStorage.setItem('activeMosqueId', id) }, alNoorId)
    await page.goto(BASE_URL + '/events', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const headingVisible = await page.locator('h1').first().isVisible().catch(() => false)
    log('Public /events page loads', headingVisible ? 'PASS' : 'FAIL', headingVisible ? 'h1 visible' : 'h1 missing')

    const noorCardCount = await page.locator('article').count()
    log(
      'Al-Noor event cards rendered',
      noorCardCount > 0 ? 'PASS' : 'FAIL',
      `found ${noorCardCount} card(s)`
    )

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-public-noor.png'), fullPage: true })

    // =======================================================================
    // SECTION 2: Mosque switch → Al-Rahman shows different events
    // =======================================================================
    console.log('\n--- Section 2: Mosque switch on /events ---')
    await page.evaluate((id) => { localStorage.setItem('activeMosqueId', id) }, alRahmanId)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // "Youth Quran Competition" is the seed for Al-Rahman
    const rahmanEvent = await page.locator('text=Youth Quran Competition').first().isVisible({ timeout: 5000 }).catch(() => false)
    log(
      'Al-Rahman seeded event visible after switch',
      rahmanEvent ? 'PASS' : 'FAIL',
      rahmanEvent ? '"Youth Quran Competition" visible' : 'not found'
    )

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-public-rahman.png'), fullPage: true })

    // Reset
    await page.evaluate((id) => { localStorage.setItem('activeMosqueId', id) }, alNoorId)

    // =======================================================================
    // SECTION 3: Admin login + navigate to Events
    // =======================================================================
    console.log('\n--- Section 3: Admin Login + Events page ---')
    await page.evaluate((id) => { localStorage.setItem('activeMosqueId', id) }, alNoorId)
    await page.goto(BASE_URL + '/admin/login', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first().fill('admin@emasjid.pk')
    await page.locator('input[type="password"]').first().fill('admin123')
    await page.locator('button[type="submit"]:has-text("Login"), button:has-text("Login")').first().click()
    await page.waitForTimeout(2500)
    log('Admin login submitted', 'PASS', 'form filled')

    await page.goto(BASE_URL + '/admin/events', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)
    const adminH1 = await page.locator('h1:has-text("Manage Events")').first().isVisible().catch(() => false)
    log('Admin Events page loads', adminH1 ? 'PASS' : 'FAIL', adminH1 ? 'h1 visible' : 'h1 missing')

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-admin-events.png'), fullPage: true })

    // =======================================================================
    // SECTION 4: Create event via UI
    // =======================================================================
    console.log('\n--- Section 4: Create event via UI ---')
    await page.locator('button:has-text("Add New Event")').first().click()
    await page.waitForTimeout(1000)
    const modalTitle = await page.locator('h3:has-text("Create New Event")').first().isVisible().catch(() => false)
    log('Create modal opens', modalTitle ? 'PASS' : 'FAIL', modalTitle ? 'modal visible' : 'modal missing')

    const titleInput = page.locator('label:has-text("Event Title") input[type="text"]').first()
    const descTextarea = page.locator('label:has-text("Description") textarea').first()
    const dateInput = page.locator('label:has-text("Event Date") input[type="date"]').first()
    const timeInput = page.locator('label:has-text("Start Time") input[type="time"]').first()
    const locSelect = page.locator('label:has-text("Location") select').first()

    const testTitle = 'TEST-EVT - Phase 7 Smoke Event'
    await titleInput.fill(testTitle)
    await descTextarea.fill('Automated test event created by Phase 7 runner.')
    await dateInput.fill(futureDate(30))
    await timeInput.fill('15:30')
    await locSelect.selectOption('Main Prayer Hall')

    await page.locator('button[type="submit"]:has-text("Create Event")').first().click()
    await page.waitForTimeout(2500)
    // The default dateFilter is 'this-month' which hides a +30-day future
    // event. Switch to 'All Time' so the new row is visible regardless of
    // when the test runs.
    await page.locator('select').filter({ hasText: 'This Month' }).first().selectOption('all')
    await page.waitForTimeout(1000)
    const createdVisible = await page.locator(`text=${testTitle}`).first().isVisible({ timeout: 5000 }).catch(() => false)
    log('Created event appears in list', createdVisible ? 'PASS' : 'FAIL', createdVisible ? 'visible' : 'not found')

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-after-create.png'), fullPage: true })

    // =======================================================================
    // SECTION 5: Edit event
    // =======================================================================
    console.log('\n--- Section 5: Edit event ---')
    // Find the row that contains our test title and click its edit button.
    // The admin Events table uses bare icon buttons (no aria-label); we
    // locate by row filter + the i.material-icons-round containing 'edit'.
    const row = page.locator('tr').filter({ hasText: testTitle }).first()
    const editBtn = row.locator('button').filter({ has: page.locator('i.material-icons-round', { hasText: 'edit' }) }).first()
    const editVisible = await editBtn.isVisible({ timeout: 3000 }).catch(() => false)
    if (editVisible) {
      await editBtn.click()
      await page.waitForTimeout(800)
      const editTitle = await page.locator('h3:has-text("Edit Event")').first().isVisible().catch(() => false)
      log('Edit modal opens for our event', editTitle ? 'PASS' : 'FAIL', editTitle ? 'modal shown' : 'modal missing')

      const titleInModal = page.locator('label:has-text("Event Title") input[type="text"]').first()
      await titleInModal.fill(testTitle + ' (edited)')
      await page.locator('button[type="submit"]:has-text("Update Event")').first().click()
      await page.waitForTimeout(2000)
      const editedVisible = await page.locator(`text=${testTitle} (edited)`).first().isVisible({ timeout: 5000 }).catch(() => false)
      log('Edited event title appears in list', editedVisible ? 'PASS' : 'FAIL', editedVisible ? 'visible' : 'not found')
    } else {
      log('Edit event row found', 'SKIP', 'row not visible')
    }

    // =======================================================================
    // SECTION 6: Delete event
    // =======================================================================
    console.log('\n--- Section 6: Delete event ---')
    // Section 5 edited the title to "(edited)" — locate by that.
    const editedTitle = testTitle + ' (edited)'
    const rowToDelete = page.locator('tr').filter({ hasText: editedTitle }).first()
    const deleteBtn = rowToDelete.locator('button').filter({ has: page.locator('i.material-icons-round', { hasText: 'delete' }) }).first()
    const delAvailable = await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)
    if (delAvailable) {
      await deleteBtn.click()
      await page.waitForTimeout(1000)
      page.once('dialog', (d) => d.accept())
      await page.waitForTimeout(1500)
      const stillThere = await page.locator(`text=${editedTitle}`).first().isVisible({ timeout: 1000 }).catch(() => false)
      log(
        'Created event removed from list',
        !stillThere ? 'PASS' : 'FAIL',
        !stillThere ? 'gone' : 'still visible'
      )
    } else {
      log('Delete event row found', 'SKIP', 'row not visible')
    }

    // =======================================================================
    // SECTION 7: API verification
    // =======================================================================
    console.log('\n--- Section 7: API endpoint verification ---')

    async function loginAs(email, password) {
      const r = await page.request.post(API_URL + '/api/auth/login', { data: { email, password } })
      const j = await r.json()
      return { token: j.token, user: j.user }
    }

    const adminSession = await loginAs('admin@emasjid.pk', 'admin123')
    const admin2Session = await loginAs('admin2@emasjid.pk', 'admin123')
    const managerSession = await loginAs('manager@emasjid.pk', 'manager123')
    const userSession = await loginAs('user@emasjid.pk', 'user1234')

    const unmanagedMosqueId = '5f4f4f4f4f4f4f4f4f4f4f4f'

    log('admin login response includes mosqueId', adminSession.user?.mosqueId === alNoorId ? 'PASS' : 'FAIL', `mosqueId=${adminSession.user?.mosqueId}`)
    log('admin2 login response includes mosqueId', admin2Session.user?.mosqueId === alRahmanId ? 'PASS' : 'FAIL', `mosqueId=${admin2Session.user?.mosqueId}`)
    log('manager login response has no mosqueId', !managerSession.user?.mosqueId ? 'PASS' : 'FAIL', `mosqueId=${managerSession.user?.mosqueId || '(none)'}`)

    // Public endpoint — no auth, returns all active events.
    const pubAll = await page.request.get(API_URL + '/api/events')
    const pubAllJson = await pubAll.json()
    log(
      'GET /api/events (public, no params) returns 200',
      pubAll.status() === 200 ? 'PASS' : 'FAIL',
      `${(pubAllJson.data || []).length} active event(s)`
    )

    // admin GET /api/events/admin (no scope) → only Al-Noor
    const adminScope = await page.request.get(API_URL + '/api/events/admin', {
      headers: { Authorization: 'Bearer ' + adminSession.token },
    })
    const adminScopeJson = await adminScope.json()
    const adminList = adminScopeJson.data || []
    const adminOnlyNoor = adminList.length > 0 && adminList.every((e) => e.mosqueId === alNoorId)
    log(
      'admin (Al-Noor) GET /admin → only Al-Noor items',
      adminOnlyNoor ? 'PASS' : 'FAIL',
      `${adminList.length} items, all mosqueId=${adminList[0]?.mosqueId}`
    )

    // admin2 GET /api/events/admin → only Al-Rahman
    const admin2Scope = await page.request.get(API_URL + '/api/events/admin', {
      headers: { Authorization: 'Bearer ' + admin2Session.token },
    })
    const admin2ScopeJson = await admin2Scope.json()
    const admin2List = admin2ScopeJson.data || []
    const admin2OnlyRahman = admin2List.length > 0 && admin2List.every((e) => e.mosqueId === alRahmanId)
    log(
      'admin2 (Al-Rahman) GET /admin → only Al-Rahman items',
      admin2OnlyRahman ? 'PASS' : 'FAIL',
      `${admin2List.length} items`
    )

    // manager GET /api/events/admin → events from all 4 managed masjids
    const managerAll = await page.request.get(API_URL + '/api/events/admin', {
      headers: { Authorization: 'Bearer ' + managerSession.token },
    })
    const managerAllJson = await managerAll.json()
    const managerList = managerAllJson.data || []
    const managerMosques = new Set(managerList.map((e) => e.mosqueId))
    log(
      'manager GET /admin → events across managed masjids',
      managerList.length > 0 && managerMosques.size >= 2 ? 'PASS' : 'FAIL',
      `${managerList.length} items across ${managerMosques.size} masjid(s)`
    )

    // manager GET ?mosqueId=Al-Noor → only Al-Noor
    const managerNoor = await page.request.get(API_URL + '/api/events/admin?mosqueId=' + alNoorId, {
      headers: { Authorization: 'Bearer ' + managerSession.token },
    })
    const managerNoorJson = await managerNoor.json()
    const managerNoorList = managerNoorJson.data || []
    const managerNoorOnlyNoor = managerNoorList.length > 0 && managerNoorList.every((e) => e.mosqueId === alNoorId)
    log(
      'manager GET ?mosqueId=Al-Noor → only Al-Noor',
      managerNoorOnlyNoor ? 'PASS' : 'FAIL',
      `${managerNoorList.length} items`
    )

    // manager GET ?mosqueId=Al-Rahman (also managed) → 200
    const managerRahman = await page.request.get(API_URL + '/api/events/admin?mosqueId=' + alRahmanId, {
      headers: { Authorization: 'Bearer ' + managerSession.token },
    })
    log(
      'manager GET ?mosqueId=Al-Rahman (also managed) → 200',
      managerRahman.status() === 200 ? 'PASS' : 'FAIL',
      `HTTP ${managerRahman.status()}`
    )

    // manager GET ?mosqueId=<unmanaged> → 400
    const managerForeign = await page.request.get(API_URL + '/api/events/admin?mosqueId=' + unmanagedMosqueId, {
      headers: { Authorization: 'Bearer ' + managerSession.token },
    })
    log(
      'manager GET ?mosqueId=<unmanaged> → 400',
      managerForeign.status() === 400 ? 'PASS' : 'FAIL',
      `HTTP ${managerForeign.status()}`
    )

    // admin2 POST with body.mosqueId=Al-Noor → 403
    const crossPost = await page.request.post(API_URL + '/api/events', {
      headers: { Authorization: 'Bearer ' + admin2Session.token, 'Content-Type': 'application/json' },
      data: { title: 'cross-mosque post', date: futureDate(10), mosqueId: alNoorId },
    })
    log(
      'admin2 POST with body.mosqueId=Al-Noor → 403',
      crossPost.status() === 403 ? 'PASS' : 'FAIL',
      `HTTP ${crossPost.status()}`
    )

    // admin2 PUT Al-Noor event → 404
    const noorEvt = (pubAllJson.data || []).find((e) => e.mosqueId === alNoorId)
    if (noorEvt) {
      const crossPut = await page.request.put(API_URL + '/api/events/' + noorEvt._id, {
        headers: { Authorization: 'Bearer ' + admin2Session.token, 'Content-Type': 'application/json' },
        data: { title: 'HACKED by admin2' },
      })
      log(
        'admin2 PUT Al-Noor event → 404',
        crossPut.status() === 404 ? 'PASS' : 'FAIL',
        `HTTP ${crossPut.status()}`
      )
    }

    // admin2 DELETE Al-Noor event → 404
    if (noorEvt) {
      const crossDel = await page.request.delete(API_URL + '/api/events/' + noorEvt._id, {
        headers: { Authorization: 'Bearer ' + admin2Session.token },
      })
      log(
        'admin2 DELETE Al-Noor event → 404',
        crossDel.status() === 404 ? 'PASS' : 'FAIL',
        `HTTP ${crossDel.status()}`
      )
    }

    // manager POST with mosqueId=Al-Noor (managed) → 201
    const managerPostNoor = await page.request.post(API_URL + '/api/events', {
      headers: { Authorization: 'Bearer ' + managerSession.token, 'Content-Type': 'application/json' },
      data: {
        title: 'Manager Noor event',
        description: 'manager can post for any managed mosque',
        date: futureDate(45),
        location: 'Main Hall',
        mosqueId: alNoorId,
      },
    })
    const managerPostNoorJson = await managerPostNoor.json()
    const managerNoorSaved = managerPostNoorJson.data?.mosqueId === alNoorId
    log(
      'manager POST with mosqueId=Al-Noor (managed) → 201',
      managerPostNoor.status() === 201 && managerNoorSaved ? 'PASS' : 'FAIL',
      `HTTP ${managerPostNoor.status()}, mosqueId=${managerPostNoorJson.data?.mosqueId}`
    )

    // manager POST with mosqueId=Al-Rahman (also managed) → 201
    const managerPostRahman = await page.request.post(API_URL + '/api/events', {
      headers: { Authorization: 'Bearer ' + managerSession.token, 'Content-Type': 'application/json' },
      data: {
        title: 'Manager Rahman event',
        description: 'manager can post for any managed mosque',
        date: futureDate(45),
        location: 'Lecture Hall',
        mosqueId: alRahmanId,
      },
    })
    log(
      'manager POST with mosqueId=Al-Rahman (also managed) → 201',
      managerPostRahman.status() === 201 ? 'PASS' : 'FAIL',
      `HTTP ${managerPostRahman.status()}`
    )

    // manager POST with mosqueId=<unmanaged> → 403
    const managerForeignPost = await page.request.post(API_URL + '/api/events', {
      headers: { Authorization: 'Bearer ' + managerSession.token, 'Content-Type': 'application/json' },
      data: { title: 'should fail', date: futureDate(10), mosqueId: unmanagedMosqueId },
    })
    log(
      'manager POST with mosqueId=<unmanaged> → 403',
      managerForeignPost.status() === 403 ? 'PASS' : 'FAIL',
      `HTTP ${managerForeignPost.status()}`
    )

    // admin POST with no body.mosqueId and no user.mosqueId → 400
    // (We synthesize a request as the orphan realEmailManager who has no
    //  mosqueId. The POST should reject before it tries to scope.)
    // We use the manager role here intentionally to confirm the "no mosqueId
    // on user" path doesn't apply to manager (they pick via body) — and we
    // verify that by omitting body.mosqueId we get 400.
    const managerPostNoMosqueId = await page.request.post(API_URL + '/api/events', {
      headers: { Authorization: 'Bearer ' + managerSession.token, 'Content-Type': 'application/json' },
      data: { title: 'no mosqueId', date: futureDate(10) },
    })
    log(
      'manager POST without body.mosqueId → 400',
      managerPostNoMosqueId.status() === 400 ? 'PASS' : 'FAIL',
      `HTTP ${managerPostNoMosqueId.status()}`
    )

    // Cleanup: delete the two manager-created events
    if (managerPostNoorJson.data?._id) {
      await page.request.delete(API_URL + '/api/events/' + managerPostNoorJson.data._id, {
        headers: { Authorization: 'Bearer ' + managerSession.token },
      })
    }
    if (managerPostRahman.status() === 201) {
      const r = await page.request.get(API_URL + '/api/events/admin?mosqueId=' + alRahmanId, {
        headers: { Authorization: 'Bearer ' + managerSession.token },
      })
      const rj = await r.json()
      const created = (rj.data || []).find((e) => e.title === 'Manager Rahman event')
      if (created) {
        await page.request.delete(API_URL + '/api/events/' + created._id, {
          headers: { Authorization: 'Bearer ' + managerSession.token },
        })
      }
    }

    // =======================================================================
    // SECTION 8: Public registration
    // =======================================================================
    console.log('\n--- Section 8: Public event registration ---')
    const evtToRegister = (pubAllJson.data || []).find((e) => e.mosqueId === alNoorId)
    if (evtToRegister && userSession.token) {
      const regRes = await page.request.post(API_URL + '/api/events/' + evtToRegister._id + '/register', {
        headers: { Authorization: 'Bearer ' + userSession.token },
      })
      const regJson = await regRes.json()
      // On test re-runs the user is already registered → 400 "Already registered".
      // Both 200 and that 400 confirm the endpoint works for an authenticated
      // community user, so accept either.
      const registeredNow = regRes.status() === 200
      const alreadyRegistered = regRes.status() === 400 && /already/i.test(regJson.message || '')
      log(
        'community user can register for an event',
        registeredNow || alreadyRegistered ? 'PASS' : 'FAIL',
        registeredNow ? 'registered' : (alreadyRegistered ? 'already registered (test re-run)' : `HTTP ${regRes.status()} ${regJson.message || ''}`)
      )

      // Double-register → 400
      const regAgain = await page.request.post(API_URL + '/api/events/' + evtToRegister._id + '/register', {
        headers: { Authorization: 'Bearer ' + userSession.token },
      })
      log(
        'double-registration rejected',
        regAgain.status() === 400 ? 'PASS' : 'FAIL',
        `HTTP ${regAgain.status()}`
      )
    }

    // =======================================================================
    // SUMMARY
    // =======================================================================
    console.log('\n=== Phase 7 Events Test Summary ===')
    const stats = { PASS: 0, FAIL: 0, BUG: 0, INFO: 0, SKIP: 0 }
    findings.forEach((f) => stats[f.result]++)
    console.log(`PASS: ${stats.PASS} | FAIL: ${stats.FAIL} | BUG: ${stats.BUG} | INFO: ${stats.INFO} | SKIP: ${stats.SKIP}`)
    console.log(`Total: ${findings.length}`)
  } catch (err) {
    console.error('TEST RUNNER ERROR:', err)
  } finally {
    await browser.close()
  }
})()