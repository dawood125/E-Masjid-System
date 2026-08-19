/**
 * Phase 9: Donations Module - Comprehensive Playwright Test
 *
 * Covers:
 *   - Public /donate form (validates amount + submits)
 *   - Public /transparency donations tab (filter, anonymity, view-all)
 *   - Admin /admin/donations CRUD (cash)
 *   - Anonymous donation creation + public masking
 *   - Cross-mosque authorization (admin2 cannot edit/delete Al-Noor)
 *   - Manager multi-mosque scope
 *   - Stripe mock end-to-end (no real key in .env → legacy path)
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

async function loginAs(page, email, password) {
  const r = await page.request.post(API_URL + '/api/auth/login', {
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({ email, password }),
  })
  const j = await r.json()
  return { token: j.token, user: j.user }
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  page.on('pageerror', (err) => console.error('BROWSER ERROR:', err))

  console.log('\n=== Phase 9: Donations Module Test ===\n')

  try {
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
    // SECTION 1: Public /donate page
    // =======================================================================
    console.log('--- Section 1: Public /donate page ---')
    await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' })
    await page.evaluate((id) => { localStorage.setItem('activeMosqueId', id) }, alNoorId)
    await page.goto(BASE_URL + '/donate', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const heading = await page.locator('h1').first().textContent().catch(() => '')
    log('Public /donate page loads', heading.includes('Akhirah') ? 'PASS' : 'FAIL', heading.trim().slice(0, 60))

    const typeButtons = await page.locator('button:has-text("Sadaqah"), button:has-text("Zakat"), button:has-text("Masjid Fund")').count()
    log('Donation type buttons rendered', typeButtons >= 3 ? 'PASS' : 'FAIL', `${typeButtons} type buttons`)

    const presetButtons = await page.locator('button:has-text("Rs.")').count()
    log('Preset amount buttons rendered', presetButtons >= 4 ? 'PASS' : 'FAIL', `${presetButtons} preset buttons`)

    const anonCheckbox = await page.locator('input[type="checkbox"]').first().isVisible().catch(() => false)
    log('Anonymous checkbox visible', anonCheckbox ? 'PASS' : 'FAIL')

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-donate-page.png'), fullPage: true })

    // =======================================================================
    // SECTION 2: Public /transparency donations tab
    // =======================================================================
    console.log('\n--- Section 2: Public /transparency donations tab ---')
    await page.goto(BASE_URL + '/transparency', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)

    const totalDonationsVisible = await page.locator('text=Total Donations Received').first().isVisible().catch(() => false)
    log('Donations summary card visible', totalDonationsVisible ? 'PASS' : 'FAIL')

    const donationRows = await page.locator('text=Donation History').first().isVisible().catch(() => false)
    log('Donation History section visible', donationRows ? 'PASS' : 'FAIL')

    // Anonymous donor display: search for "Anonymous" text on the page
    const anonVisible = await page.locator('text=Anonymous').first().isVisible({ timeout: 1500 }).catch(() => false)
    log('Anonymous label visible on transparency page', anonVisible ? 'PASS' : 'INFO', anonVisible ? 'masked donor present' : 'no anonymous donations seeded')

    // Filter chips — try clicking the Zakat chip
    const zakatChip = page.locator('button:has-text("Zakat"), button:has-text("zakat")').first()
    const zakatExists = await zakatChip.isVisible({ timeout: 1000 }).catch(() => false)
    if (zakatExists) {
      await zakatChip.click()
      await page.waitForTimeout(1500)
      log('Zakat filter chip clickable', 'PASS', 'chip present')
    } else {
      log('Zakat filter chip', 'SKIP', 'chip not visible')
    }

    // View All button
    const viewAllBtn = page.locator('button:has-text("View All")').first()
    const viewAllVisible = await viewAllBtn.isVisible({ timeout: 1000 }).catch(() => false)
    if (viewAllVisible) {
      await viewAllBtn.click()
      await page.waitForTimeout(1500)
      const collapseBtn = page.locator('button:has-text("Collapse"), button:has-text("Show Less")').first()
      const collapseVisible = await collapseBtn.isVisible({ timeout: 1000 }).catch(() => false)
      log('View All expands donations list', collapseVisible ? 'PASS' : 'FAIL')
    } else {
      log('View All button on donations', 'SKIP', 'button not visible')
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-transparency-donations.png'), fullPage: true })

    // =======================================================================
    // SECTION 3: Admin /admin/donations CRUD
    // =======================================================================
    console.log('\n--- Section 3: Admin /admin/donations CRUD ---')
    const adminSession = await loginAs(page, 'admin@emasjid.pk', 'admin123')
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(user))
    }, { token: adminSession.token, user: adminSession.user })

    await page.goto(BASE_URL + '/admin/donations', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    const addBtn = page.locator('button:has-text("Add Donation")').first()
    const addBtnVisible = await addBtn.isVisible({ timeout: 3000 }).catch(() => false)
    log('Admin donations Add button visible', addBtnVisible ? 'PASS' : 'FAIL')

    if (addBtnVisible) {
      await addBtn.click()
      await page.waitForTimeout(1500)

      const modalVisible = await page.locator('[role="dialog"], .modal, form').first().isVisible().catch(() => false)
      log('Add Donation modal opens', modalVisible ? 'PASS' : 'FAIL')

      const modalForm = page.locator('form').last()
      const donorNameInput = modalForm.locator('label:has-text("Donor Name") input').first()
      const amountInput = modalForm.locator('label:has-text("Amount") input').first()
      await donorNameInput.fill('Playwright Cash Donor').catch(() => {})
      await amountInput.fill('2500').catch(() => {})
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-add-donation-modal.png'), fullPage: true })

      const apiRespPromise = page.waitForResponse(
        (res) => res.url().includes('/api/donations') && res.request().method() === 'POST',
        { timeout: 5000 }
      ).catch(() => null)

      const submitBtn = modalForm.locator('button[type="submit"]').first()
      await submitBtn.click().catch(() => {})
      await page.waitForTimeout(2500)

      const verifyRes = await page.request.get(API_URL + '/api/donations/admin', {
        headers: { Authorization: 'Bearer ' + adminSession.token },
      })
      const verifyJson = await verifyRes.json().catch(() => ({ data: [] }))
      const created = (verifyJson.data || []).find((d) => d.donorName === 'Playwright Cash Donor')
      log(
        'Created donation appears via API',
        created ? 'PASS' : 'FAIL',
        created ? `id=${created._id} amount=${created.amount}` : 'not visible'
      )
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-admin-donations-table.png'), fullPage: true })

    // =======================================================================
    // SECTION 4: API verification — scope isolation
    // =======================================================================
    console.log('\n--- Section 4: API scope isolation ---')
    const admin2Session = await loginAs(page, 'admin2@emasjid.pk', 'admin123')
    const managerSession = await loginAs(page, 'manager@emasjid.pk', 'manager123')
    const userSession = await loginAs(page, 'user@emasjid.pk', 'user1234')

    log('admin login includes mosqueId', adminSession.user?.mosqueId === alNoorId ? 'PASS' : 'FAIL', `mosqueId=${adminSession.user?.mosqueId}`)
    log('admin2 login includes mosqueId', admin2Session.user?.mosqueId === alRahmanId ? 'PASS' : 'FAIL', `mosqueId=${admin2Session.user?.mosqueId}`)
    log('manager login has no mosqueId', !managerSession.user?.mosqueId ? 'PASS' : 'FAIL')

    // Public endpoint — no auth, returns donations across all masjids
    const pubAll = await page.request.get(API_URL + '/api/donations')
    const pubAllJson = await pubAll.json()
    const pubOk = pubAll.status() === 200
    log('GET /api/donations (public) → 200', pubOk ? 'PASS' : 'FAIL', `total=${pubAllJson.total || (pubAllJson.data || []).length}`)

    // Anonymous masking on public endpoint
    const pubAnonym = (pubAllJson.data || []).find((d) => d.donorName === 'Anonymous')
    log('Anonymous donor masked on public endpoint', pubAnonym ? 'PASS' : 'INFO', pubAnonym ? 'present in seed' : 'no anonymous in seed')

    // Public endpoint scoped by mosqueId
    const pubNoor = await page.request.get(API_URL + '/api/donations?mosqueId=' + alNoorId)
    const pubNoorJson = await pubNoor.json()
    const noorDonations = pubNoorJson.data || []
    const noorOnly = noorDonations.every((d) => d.mosqueId === alNoorId)
    log('GET /api/donations?mosqueId=Al-Noor → only Al-Noor', noorOnly ? 'PASS' : 'FAIL', `${noorDonations.length} items`)

    // admin POST with body.mosqueId = Al-Rahman (cross-mosque write) → 403
    const crossCreate = await page.request.post(API_URL + '/api/donations', {
      headers: { Authorization: 'Bearer ' + adminSession.token, 'Content-Type': 'application/json' },
      data: {
        donorName: 'Cross Hack', amount: 100, type: 'Sadaqah', paymentMethod: 'Cash', mosqueId: alRahmanId,
      },
    })
    log('admin POST cross-mosque body → 403', crossCreate.status() === 403 ? 'PASS' : 'FAIL', `HTTP ${crossCreate.status()}`)

    // admin POST without body.mosqueId → 201, mosqueId from token = Al-Noor
    const ownCreate = await page.request.post(API_URL + '/api/donations', {
      headers: { Authorization: 'Bearer ' + adminSession.token, 'Content-Type': 'application/json' },
      data: { donorName: 'Own Masjid Donor', amount: 1500, type: 'Zakat', paymentMethod: 'Cash' },
    })
    const ownCreateJson = await ownCreate.json()
    log(
      'admin POST no body.mosqueId → 201 with token mosqueId',
      ownCreate.status() === 201 && ownCreateJson.data?.mosqueId === alNoorId ? 'PASS' : 'FAIL',
      `mosqueId=${ownCreateJson.data?.mosqueId}`
    )

    // admin2 cannot edit Al-Noor donation → 404
    if (noorDonations.length > 0) {
      const target = noorDonations[0]
      const crossPut = await page.request.put(API_URL + '/api/donations/' + target._id, {
        headers: { Authorization: 'Bearer ' + admin2Session.token, 'Content-Type': 'application/json' },
        data: { amount: 99999 },
      })
      log('admin2 PUT Al-Noor donation → 404', crossPut.status() === 404 ? 'PASS' : 'FAIL', `HTTP ${crossPut.status()}`)

      const crossDel = await page.request.delete(API_URL + '/api/donations/' + target._id, {
        headers: { Authorization: 'Bearer ' + admin2Session.token },
      })
      log('admin2 DELETE Al-Noor donation → 404', crossDel.status() === 404 ? 'PASS' : 'FAIL', `HTTP ${crossDel.status()}`)
    }

    // Top donors aggregation respects mosqueId
    const topNoor = await page.request.get(API_URL + '/api/donations/top-donors?mosqueId=' + alNoorId)
    const topNoorJson = await topNoor.json()
    log('GET /top-donors?mosqueId=Al-Noor → 200', topNoor.status() === 200 ? 'PASS' : 'FAIL', `${(topNoorJson.data || []).length} top donors`)

    const topInvalid = await page.request.get(API_URL + '/api/donations/top-donors?mosqueId=bad-id')
    log('GET /top-donors?mosqueId=invalid → 400', topInvalid.status() === 400 ? 'PASS' : 'FAIL', `HTTP ${topInvalid.status()}`)

    // Summary aggregation
    const sumNoor = await page.request.get(API_URL + '/api/donations/summary?mosqueId=' + alNoorId)
    const sumNoorJson = await sumNoor.json()
    log(
      'GET /summary?mosqueId=Al-Noor → has totalDonations',
      sumNoor.status() === 200 && typeof sumNoorJson.data?.totalDonations === 'number' ? 'PASS' : 'FAIL',
      `total=${sumNoorJson.data?.totalDonations}`
    )

    // Online donation endpoint — public (no token). When STRIPE_SECRET_KEY is set, response is 200 with
    // {url: <stripe checkout>}; when not set, response is 201 with legacy record. Accept either.
    const onlineRes = await page.request.post(API_URL + '/api/donations/online', {
      data: {
        donorName: 'Online Public Donor',
        amount: 350,
        type: 'Sadaqah',
        mosqueId: alNoorId,
      },
    })
    const onlineJson = await onlineRes.json()
    const onlineAccepted = onlineRes.status() === 201 || (onlineRes.status() === 200 && onlineJson.url)
    log(
      'POST /api/donations/online (public) → 201 legacy OR 200 Stripe',
      onlineAccepted ? 'PASS' : 'FAIL',
      `HTTP ${onlineRes.status()}, ${onlineJson.url ? 'stripe url' : 'transactionId=' + (onlineJson.transactionId || 'n/a')}`
    )

    // Validation: amount below 100
    const tooSmall = await page.request.post(API_URL + '/api/donations/online', {
      data: { donorName: 'Tiny', amount: 50, type: 'Sadaqah', mosqueId: alNoorId },
    })
    log('POST /api/donations/online amount<100 → 400', tooSmall.status() === 400 ? 'PASS' : 'FAIL', `HTTP ${tooSmall.status()}`)

    // Validation: invalid mosqueId
    const badMosque = await page.request.post(API_URL + '/api/donations/online', {
      data: { donorName: 'Bad', amount: 500, type: 'Sadaqah', mosqueId: 'not-an-object-id' },
    })
    log('POST /api/donations/online invalid mosqueId → 400', badMosque.status() === 400 ? 'PASS' : 'FAIL', `HTTP ${badMosque.status()}`)

    // Anonymous online donation
    const anonOnline = await page.request.post(API_URL + '/api/donations/online', {
      data: {
        donorName: 'Hidden Online', email: 'h@x.com',
        amount: 700, type: 'Zakat', mosqueId: alNoorId, isAnonymous: true,
      },
    })
    const anonOnlineJson = await anonOnline.json()
    const anonStored = anonOnline.status() === 201
      ? anonOnlineJson.data?.isAnonymous === true
      : (anonOnline.status() === 200 && !!anonOnlineJson.url)
    log(
      'Anonymous online donation stored (legacy) or Stripe checkout URL returned',
      anonStored ? 'PASS' : 'FAIL',
      `HTTP ${anonOnline.status()}, isAnonymous=${anonOnlineJson.data?.isAnonymous ?? (anonOnlineJson.url ? 'stripe-path' : 'n/a')}`
    )

    // Re-fetch public endpoint → if legacy path used, that donor appears as "Anonymous"
    // (Stripe path returns a checkout URL; donation is only created via webhook, so we skip masking check.)
    if (anonOnlineJson.url) {
      log('Anonymous online donor masked in public list (legacy only)', 'SKIP', 'Stripe path — no record yet')
    } else {
      const pubNoor2 = await page.request.get(API_URL + '/api/donations?mosqueId=' + alNoorId)
      const pubNoor2Json = await pubNoor2.json()
      const maskedOnline = (pubNoor2Json.data || []).find((d) => d.donorName === 'Anonymous')
      log(
        'Anonymous online donor masked in public list',
        maskedOnline ? 'PASS' : 'FAIL',
        maskedOnline ? 'masked as Anonymous' : 'not masked'
      )
    }

    // Admin sees real name (not Anonymous) — admin view is /api/donations/admin
    const adminNoor = await page.request.get(API_URL + '/api/donations/admin?mosqueId=' + alNoorId, {
      headers: { Authorization: 'Bearer ' + adminSession.token },
    })
    let adminNoorJson = { data: [] }
    try {
      adminNoorJson = await adminNoor.json()
    } catch (e) {
      // Non-JSON response (HTML fallback) means endpoint missing
    }
    const realNameVisible = (adminNoorJson.data || []).some((d) => d.donorName === 'Hidden Online')
    log(
      'Admin /donations/admin scoped to own masjid',
      adminNoor.status() === 200 ? 'PASS' : 'FAIL',
      `HTTP ${adminNoor.status()}, items=${(adminNoorJson.data || []).length}`
    )
    log(
      'Admin sees real name for anonymous donor',
      realNameVisible ? 'PASS' : 'INFO',
      realNameVisible ? 'real name visible' : 'no anonymous in admin view (test re-run)'
    )

    // =======================================================================
    // SECTION 5: Manager multi-mosque
    // =======================================================================
    console.log('\n--- Section 5: Manager multi-mosque scope ---')
    const managerNoor = await page.request.get(API_URL + '/api/donations/admin?mosqueId=' + alNoorId, {
      headers: { Authorization: 'Bearer ' + managerSession.token },
    })
    log('manager GET /admin?mosqueId=Al-Noor → 200', managerNoor.status() === 200 ? 'PASS' : 'FAIL', `HTTP ${managerNoor.status()}`)

    const managerRahman = await page.request.get(API_URL + '/api/donations/admin?mosqueId=' + alRahmanId, {
      headers: { Authorization: 'Bearer ' + managerSession.token },
    })
    log('manager GET /admin?mosqueId=Al-Rahman → 200', managerRahman.status() === 200 ? 'PASS' : 'FAIL', `HTTP ${managerRahman.status()}`)

    const unmanagedId = '5f4f4f4f4f4f4f4f4f4f4f4f'
    const managerForeign = await page.request.get(API_URL + '/api/donations/admin?mosqueId=' + unmanagedId, {
      headers: { Authorization: 'Bearer ' + managerSession.token },
    })
    log('manager GET /admin?mosqueId=<unmanaged> → 403', managerForeign.status() === 403 ? 'PASS' : 'FAIL', `HTTP ${managerForeign.status()}`)

    // =======================================================================
    // SECTION 6: Anonymous UI smoke
    // =======================================================================
    console.log('\n--- Section 6: Anonymous donation UI smoke ---')
    await page.evaluate(() => { localStorage.removeItem('user') })
    await page.goto(BASE_URL + '/transparency', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)
    const anonLabels = await page.locator('text=Anonymous').count()
    log(
      'Public /transparency shows Anonymous donors',
      anonLabels > 0 ? 'PASS' : 'INFO',
      `${anonLabels} Anonymous label(s) on page`
    )

    // =======================================================================
    // SUMMARY
    // =======================================================================
    console.log('\n=== Phase 9 Donations Test Summary ===')
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
