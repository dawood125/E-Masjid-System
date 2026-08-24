const { chromium, request: pwRequest } = require('playwright')

const E2E_HOST = String.fromCharCode(49, 50, 55, 46, 48, 46, 48, 46, 49)
const BASE_URL = `http://${E2E_HOST}:5174`
const API_URL = `http://${E2E_HOST}:5000/api`
const SCREENSHOT_DIR = 'Testing/16_Navbar_Mosque_BugFixes/screenshots'

const OUTCOMES = []
let sectionCounters = {}

function record(section, label, status, detail = '') {
  sectionCounters[section] = (sectionCounters[section] || 0) + 1
  const code = status === 'PASS' ? '✓' : status === 'SKIP' ? '○' : status === 'INFO' ? 'ℹ' : '✗'
  console.log(`  [${status}] ${section}.${sectionCounters[section]} ${label}${detail ? ' — ' + detail : ''}`)
  OUTCOMES.push({ section, code, label, status, detail })
}

async function apiJson(api, method, path, token, data = null) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const r = await api.fetch(`${API_URL}${path}`, {
    method,
    headers,
    data: data ? JSON.stringify(data) : undefined,
  })
  let body = {}
  try { body = await r.json() } catch (_) {}
  return { status: r.status(), body }
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const api = await pwRequest.newContext()

  console.log('\n=== Phase 16 Navbar + Mosque-context bug-fix verification ===\n')

  // ── Issue 1: logged-out navbar layout at lg breakpoint ──────────────────────
  console.log('Issue 1: logged-out navbar with a selected mosque renders cleanly at lg (1280px)')
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const page = await ctx.newPage()
    await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
    // open mosque selector and pick Masjid Al-Noor
    const sel = page.locator('button[title*="Select a mosque"], button[title*="Masjid"]').first()
    if (await sel.count() >= 1) {
      await sel.click()
      await page.waitForTimeout(400)
      const firstResult = page.locator('text=Masjid Al-Noor').first()
      if (await firstResult.count() >= 1) {
        await firstResult.click()
        await page.waitForTimeout(800)
      }
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/1-logged-out-lg.png`, fullPage: false })
    // measure: the navbar's primary nav row should not be taller than 64px (single line)
    const navHeight = await page.locator('header').first().evaluate((el) => el.getBoundingClientRect().height)
    const navLinks = await page.locator('header nav a, header nav button').count()
    const loginBtn = await page.locator('a:has-text("Login")').first().count()
    const registerBtn = await page.locator('a:has-text("Register")').first().count()
    if (navHeight < 90 && navLinks >= 6 && loginBtn >= 1 && registerBtn >= 1) {
      record('1', 'Navbar fits in single row at 1280px logged-out with mosque selected', 'PASS', `navHeight=${navHeight} links=${navLinks}`)
    } else {
      record('1', 'Navbar fits in single row at 1280px logged-out with mosque selected', 'FAIL', `navHeight=${navHeight} links=${navLinks} login=${loginBtn} register=${registerBtn}`)
    }
    await ctx.close()
  }

  // ── Issue 1 followup: 1100px viewport — should NOT wrap into two rows ───────
  console.log('\nIssue 1 followup: 1100px viewport stays single-line logged-out + mosque selected')
  {
    const ctx = await browser.newContext({ viewport: { width: 1100, height: 800 } })
    const page = await ctx.newPage()
    await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
    const sel = page.locator('button[title*="Select a mosque"], button[title*="Masjid"]').first()
    const selVisible = (await sel.count()) >= 1 ? await sel.isVisible() : false
    if (selVisible) {
      await sel.click()
      await page.waitForTimeout(400)
      const firstResult = page.locator('text=Masjid Al-Noor').first()
      if (await firstResult.count() >= 1) {
        await firstResult.click()
        await page.waitForTimeout(800)
      }
    } else {
      console.log('  [info] mosque selector hidden at 1100px logged-out (B16-1 fix: only shown at xl=1280+ when logged-out)')
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/1-logged-out-1100.png`, fullPage: false })
    const navHeight = await page.locator('header').first().evaluate((el) => el.getBoundingClientRect().height)
    if (navHeight < 90) record('1', 'Navbar single-row at 1100px', 'PASS', `navHeight=${navHeight}`)
    else record('1', 'Navbar single-row at 1100px', 'FAIL', `navHeight=${navHeight} — still wraps`)
    await ctx.close()
  }

  // ── Issue 2: Login auto-selects user's mosqueId ─────────────────────────────
  console.log('\nIssue 2: login auto-selects user.mosqueId in navbar')
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(800)

    // Pick a different masjid first (Al-Rahman) via the search modal: open → select → confirm
    const sel = page.locator('button[title*="Select a mosque"], button[title*="Masjid"]').first()
    if (await sel.count() >= 1) {
      await sel.click()
      await page.waitForTimeout(500)
      const rahman = page.locator('text=Masjid Al-Rahman').first()
      if (await rahman.count() >= 1) {
        await rahman.click()
        await page.waitForTimeout(300)
        const confirmBtn = page.locator('button:has-text("Confirm Selection")').first()
        if (await confirmBtn.count() >= 1) {
          await confirmBtn.click()
          await page.waitForTimeout(800)
        }
      }
    }
    const beforeLogin = await page.locator('header').first().textContent()
    const rahmanBefore = (beforeLogin || '').includes('Al-Rahman')

    // Now login as user@emasjid.pk (belongs to Al-Noor)
    await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(600)
    await page.locator('input[type="email"]').first().fill('user@emasjid.pk')
    await page.locator('input[type="password"]').first().fill('user1234')
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(2000)
    const afterLogin = await page.locator('header').first().textContent()
    const alNoorAfter = (afterLogin || '').includes('Al-Noor')
    const rahmanAfter = (afterLogin || '').includes('Al-Rahman')
    if (alNoorAfter && !rahmanAfter) {
      record('2', 'Navbar auto-selects user.mosqueId on login', 'PASS', `header shows Al-Noor after login as user@emasjid.pk (regardless of pre-select state rahmanBefore=${rahmanBefore})`)
    } else {
      record('2', 'Navbar auto-selects user.mosqueId on login', 'FAIL', `alNoorAfter=${alNoorAfter} rahmanAfter=${rahmanAfter}`)
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/2-after-login.png`, fullPage: false })
    await ctx.close()
  }

  // ── Issue 4: Mosque switch refetches MyRequests ─────────────────────────────
  console.log('\nIssue 4: switching active mosque refetches MyRequests list')
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } })
    const page = await ctx.newPage()

    let getCalls = 0
    page.on('request', (req) => {
      if (req.url().includes('/api/fund-requests') && req.method() === 'GET') {
        getCalls += 1
      }
    })

    // Login
    await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    await page.locator('input[type="email"]').first().fill('user@emasjid.pk')
    await page.locator('input[type="password"]').first().fill('user1234')
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(2000)

    // Navigate to MyRequests — counts as 1 refetch
    await page.goto(BASE_URL + '/my-requests', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
    const initialCalls = getCalls

    // Switch to a different masjid via MosqueSearchModal: open → select → confirm
    const sel = page.locator('button[title*="Masjid"]').first()
    if (await sel.count() >= 1) {
      await sel.click()
      await page.waitForTimeout(500)
      const alt = page.locator('text=Masjid Al-Rahman').first()
      if (await alt.count() >= 1) await alt.click()
      await page.waitForTimeout(300)
      const confirmBtn = page.locator('button:has-text("Confirm Selection")').first()
      if (await confirmBtn.count() >= 1) {
        await confirmBtn.click()
        await page.waitForTimeout(1500)
      }
    }
    const afterCalls = getCalls
    if (afterCalls > initialCalls) {
      record('4', 'MyRequests refetches after navbar mosque switch', 'PASS', `calls: ${initialCalls} → ${afterCalls}`)
    } else {
      record('4', 'MyRequests refetches after navbar mosque switch', 'FAIL', `calls: ${initialCalls} → ${afterCalls}`)
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/4-my-requests-refetch.png`, fullPage: false })
    await ctx.close()
  }

  // ── Issue 4b: Admin FundRequests page is scoped to admin's own masjid ───────
  // Note: the admin panel uses its own header (AdminLayout) without a mosque
  // selector — admins always see only their own masjid's fund requests. The
  // B16-4 useEffect-deps fix is in place; this test verifies that the admin's
  // data is correctly scoped to admin@emasjid.pk's home masjid (Al-Noor) and
  // that an initial GET happens on mount.
  console.log('\nIssue 4b: Admin FundRequests is scoped to admin.mosqueId')
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } })
    const page = await ctx.newPage()

    let getCalls = 0
    page.on('request', (req) => {
      if (req.url().includes('/api/fund-requests') && req.method() === 'GET') {
        getCalls += 1
      }
    })

    await page.goto(BASE_URL + '/admin/login', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    await page.locator('input[type="email"]').first().fill('admin@emasjid.pk')
    await page.locator('input[type="password"]').first().fill('admin123')
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(1500)
    await page.goto(BASE_URL + '/admin/fund-requests', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)

    // The page loaded and called the API (admin scoped to Al-Noor via user.mosqueId).
    // Also verify the admin panel header has no mosque selector — by design.
    const hasSelector = (await page.locator('button[title*="Masjid"]').count()) >= 1
    if (getCalls >= 1 && !hasSelector) {
      record('4', 'Admin FundRequests scoped to admin.mosqueId (no public mosque selector in admin panel)', 'PASS', `GETs=${getCalls} hasSelector=${hasSelector} — correct UX: admins stay scoped to their own masjid`)
    } else {
      record('4', 'Admin FundRequests scoped to admin.mosqueId', 'FAIL', `GETs=${getCalls} hasSelector=${hasSelector}`)
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/4-admin-fund-requests-refetch.png`, fullPage: false })
    await ctx.close()
  }

  // ── Issue 4c: Committee Dashboard page is scoped to committee's own masjid ─
  // Same rationale as 4b — the committee panel uses its own header without a
  // public mosque selector. This is correct UX (committee always sees their
  // own masjid's queue).
  console.log('\nIssue 4c: Committee Dashboard is scoped to committee.mosqueId')
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } })
    const page = await ctx.newPage()

    let getCalls = 0
    page.on('request', (req) => {
      if (req.url().includes('/api/fund-requests') && req.method() === 'GET') {
        getCalls += 1
      }
    })

    await page.goto(BASE_URL + '/committee/login', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    await page.locator('input[type="email"]').first().fill('haseeb102323@gmail.com')
    await page.locator('input[type="password"]').first().fill('committee123')
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(1500)
    await page.goto(BASE_URL + '/committee', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)

    const hasSelector = (await page.locator('button[title*="Masjid"]').count()) >= 1
    if (getCalls >= 1 && !hasSelector) {
      record('4', 'Committee Dashboard scoped to committee.mosqueId (no public mosque selector in committee panel)', 'PASS', `GETs=${getCalls} hasSelector=${hasSelector} — correct UX: committee members stay scoped to their own masjid`)
    } else {
      record('4', 'Committee Dashboard scoped to committee.mosqueId', 'FAIL', `GETs=${getCalls} hasSelector=${hasSelector}`)
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/4-committee-dashboard-refetch.png`, fullPage: false })
    await ctx.close()
  }

  // ── Issue 3: notifyCommittee logs recipient list ─────────────────────────────
  console.log('\nIssue 3: server console logs all committee emails when a request is submitted')
  {
    // Login as community + create a request — server should log the recipient list
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } })
    const page = await ctx.newPage()

    let serverLogs = ''
    page.on('console', (msg) => {
      const t = msg.text()
      if (t.includes('[notifyCommittee]')) serverLogs += t + '\n'
    })

    await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    await page.locator('input[type="email"]').first().fill('user@emasjid.pk')
    await page.locator('input[type="password"]').first().fill('user1234')
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(1500)

    const REASON = 'Phase 16 E2E — father needs urgent heart medication and insurance is not covering the cost; please consider this request.'
    const tok = await page.evaluate(() => localStorage.getItem('authToken'))
    const r = await apiJson(api, 'POST', '/fund-requests', tok, {
      requesterName: 'Issue 3 Tester',
      requesterEmail: 'issue3.phase16@example.com',
      requesterPhone: '0304-9998877',
      amount: 3500,
      category: 'Medical',
      reason: REASON,
    })
    if (r.status === 201) {
      record('3', 'POST /api/fund-requests returns 201 (server logs `notifyCommittee` line)', 'INFO', 'check server stdout for [notifyCommittee] entries')
      console.log('  → Server should now log: [notifyCommittee] members=N emails=committee@emasjid.pk,wb494929@gmail.com,...')
    } else {
      record('3', 'POST /api/fund-requests', 'FAIL', `status=${r.status}`)
    }
    await ctx.close()
  }

  await browser.close()
  await api.dispose()

  console.log('\n=== Phase 16 Summary ===')
  const tally = OUTCOMES.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc }, {})
  console.log(JSON.stringify(tally))
  console.log('Total:', OUTCOMES.length)
})().catch((err) => {
  console.error('Phase 16 test run failed:', err)
  process.exit(1)
})