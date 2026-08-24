const { chromium, request: pwRequest } = require('playwright')

const E2E_HOST = String.fromCharCode(49, 50, 55, 46, 48, 46, 48, 46, 49)
const BASE_URL = `http://${E2E_HOST}:5174`
const API_URL = `http://${E2E_HOST}:5000/api`
const SCREENSHOT_DIR = 'Testing/15_Committee_Account_Module/screenshots'

const OUTCOMES = []
let sectionCounters = {}

function record(section, label, status, detail = '') {
  sectionCounters[section] = (sectionCounters[section] || 0) + 1
  const code = status === 'PASS' ? '✓' : status === 'SKIP' ? '○' : status === 'INFO' ? 'ℹ' : '✗'
  console.log(`  [${status}] ${section}.${sectionCounters[section]} ${label}${detail ? ' — ' + detail : ''}`)
  OUTCOMES.push({ section, code, label, status, detail })
}

async function login(page, email, password) {
  await page.context().clearCookies()
  await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)
  await page.locator('input[type="email"]').first().fill(email)
  await page.locator('input[type="password"]').first().fill(password)
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(1500)
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

function uniqEmail() {
  const t = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  return `comm.${t}@example.com`
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } })
  const page = await ctx.newPage()
  const api = await pwRequest.newContext()

  console.log('\n=== Phase 15 Admin Committee Account Management Test ===\n')

  console.log('Setup: logging in as Al-Noor admin')
  await login(page, 'admin@emasjid.pk', 'admin123')
  const adminToken = await page.evaluate(() => localStorage.getItem('authToken'))

  // ── Section 1: Admin Committee page renders list ──────────────────────────────
  console.log('\nSection 1: Admin Committee page renders existing list')
  await page.goto(BASE_URL + '/admin/committee', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  const listRows = await page.locator('table tbody tr').count()
  if (listRows >= 3) record('1', `Existing list renders ${listRows} rows`, 'PASS')
  else record('1', 'Existing list renders rows', 'FAIL', `rows=${listRows}`)
  await page.screenshot({ path: `${SCREENSHOT_DIR}/1-list-renders.png`, fullPage: false })

  // ── Section 2: Validation - missing name + bad email ──────────────────────────
  console.log('\nSection 2: Form rejects empty name + bad email')
  await page.getByRole('button', { name: /Add Member/i }).first().click()
  await page.waitForTimeout(400)
  await page.locator('input[placeholder="Full name"]').first().fill('')
  await page.locator('input[type="email"]').first().fill('not-an-email')
  await page.locator('input[placeholder="03XX-XXXXXXX"]').first().fill('0301-2345678')
  await page.getByRole('button', { name: /Create Member/i }).first().click()
  await page.waitForTimeout(800)
  const validationToast = await page.getByText(/Name and email are required|Valid email/i).count()
  if (validationToast >= 1) record('2', 'Empty name + bad email blocked', 'PASS')
  else record('2', 'Empty name + bad email blocked', 'FAIL')
  await page.screenshot({ path: `${SCREENSHOT_DIR}/2-validation.png`, fullPage: false })

  // ── Section 3: API reject duplicate email ─────────────────────────────────────
  console.log('\nSection 3: API blocks duplicate email (400)')
  const dupe = await apiJson(api, 'POST', '/committee', adminToken, {
    name: 'Dup Test', email: 'committee@emasjid.pk', phone: '0301-0000000',
  })
  if (dupe.status === 400) record('3', 'Duplicate email rejected with 400', 'PASS', `msg="${dupe.body.message}"`)
  else record('3', 'Duplicate email rejected with 400', 'FAIL', `status=${dupe.status}`)

  // ── Section 4: Create committee member via UI ─────────────────────────────────
  console.log('\nSection 4: Create a new committee member via UI')
  const newEmail = uniqEmail()
  await page.locator('input[placeholder="Full name"]').first().fill('Phase 15 Tester')
  await page.locator('input[type="email"]').first().fill(newEmail)
  await page.locator('input[placeholder="03XX-XXXXXXX"]').first().fill('0301-7777711')
  await page.getByRole('button', { name: /Create Member/i }).first().click()
  await page.waitForTimeout(1500)
  const createdRow = await page.getByText(newEmail).count()
  if (createdRow >= 1) record('4', 'New member appears in the list', 'PASS')
  else record('4', 'New member appears in the list', 'FAIL', `email=${newEmail}`)
  await page.screenshot({ path: `${SCREENSHOT_DIR}/4-created.png`, fullPage: false })

  // ── Section 5: Toggle Active -> Inactive via API ─────────────────────────────
  console.log('\nSection 5: Toggle member to Inactive via API and back to Active')
  const list = await apiJson(api, 'GET', '/committee', adminToken)
  const created = (list.body.data || []).find((m) => m.email === newEmail)
  if (created) {
    const off = await apiJson(api, 'PUT', `/committee/${created._id}`, adminToken, { isActive: false })
    if (off.status === 200 && off.body.data.isActive === false) record('5', 'Set isActive=false via API', 'PASS')
    else record('5', 'Set isActive=false via API', 'FAIL', `status=${off.status}`)
    const on = await apiJson(api, 'PUT', `/committee/${created._id}`, adminToken, { isActive: true })
    if (on.status === 200 && on.body.data.isActive === true) record('5', 'Set isActive=true via API', 'PASS')
    else record('5', 'Set isActive=true via API', 'FAIL', `status=${on.status}`)
  } else {
    record('5', 'Toggle isActive via API', 'SKIP', `created member not found in list`)
  }

  // ── Section 6: Deactivate-mid-vote - committee A1 votes, then gets deactivated, then cannot change vote ──
  console.log('\nSection 6: Deactivate-mid-vote edge case')
  let comm1 = await apiJson(api, 'POST', '/auth/login', null, { email: 'committee@emasjid.pk', password: 'committee123' })
  let community = await apiJson(api, 'POST', '/auth/login', null, { email: 'user@emasjid.pk', password: 'user1234' })
  const submitted = await apiJson(api, 'POST', '/fund-requests', community.body.token, {
    requesterName: 'Mid Vote Phase 15',
    requesterEmail: 'midvote.phase15@example.com',
    requesterPhone: '0302-2223344',
    amount: 4500,
    category: 'Medical',
    reason: 'Phase 15 E2E — deactivating committee mid-vote should not let them change their vote afterwards.',
  })
  const midReqId = submitted.body.data._id
  await apiJson(api, 'POST', `/fund-requests/${midReqId}/vote`, comm1.body.token, { vote: 'approve' })
  await apiJson(api, 'PUT', `/committee/${comm1.body.user?._id || ''}`, adminToken, {})
  // find A1 user id by email lookup
  const a1List = await apiJson(api, 'GET', '/committee', adminToken)
  const a1 = (a1List.body.data || []).find((m) => m.email === 'committee@emasjid.pk')
  if (!a1) {
    record('6', 'Find A1 by email', 'SKIP', 'A1 not in list')
  } else {
    await apiJson(api, 'PUT', `/committee/${a1._id}`, adminToken, { isActive: false })
    // now their existing token should be rejected
    const blocked = await apiJson(api, 'POST', `/fund-requests/${midReqId}/vote`, comm1.body.token, { vote: 'reject' })
    if (blocked.status === 401) record('6', 'Deactivated member gets 401 on next vote', 'PASS')
    else record('6', 'Deactivated member gets 401 on next vote', 'FAIL', `status=${blocked.status}`)
    // confirm tally still has only one approve
    const tallyDoc = await apiJson(api, 'GET', '/fund-requests', community.body.token)
    const tallyReq = (tallyDoc.body.data || []).find((x) => String(x._id) === String(midReqId))
    const voteCount = (tallyReq?.votes || []).length
    if (voteCount === 1) record('6', 'Tally unchanged after deactivation', 'PASS', `votes=${voteCount}`)
    else record('6', 'Tally unchanged after deactivation', 'FAIL', `votes=${voteCount}`)
    // restore
    await apiJson(api, 'PUT', `/committee/${a1._id}`, adminToken, { isActive: true })
  }
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${SCREENSHOT_DIR}/6-after-deactivation.png`, fullPage: false })

  // ── Section 7: Cross-mosque admin cannot see or modify this committee ───────
  console.log('\nSection 7: Cross-mosque admin gets empty list')
  const adminBR = await apiJson(api, 'POST', '/auth/login', null, { email: 'admin.rahman@emasjid.pk', password: 'admin123' })
  if (adminBR.body.token) {
    const listB = await apiJson(api, 'GET', '/committee', adminBR.body.token)
    const alNoorLeak = (listB.body.data || []).some((m) => m.email === 'committee@emasjid.pk')
    if (!alNoorLeak) record('7', 'Al-Rahman admin sees zero Al-Noor members', 'PASS', `count=${(listB.body.data || []).length}`)
    else record('7', 'Al-Rahman admin sees zero Al-Noor members', 'FAIL', 'leak detected')
    const updateBlocked = await apiJson(api, 'PUT', `/committee/${a1?._id || '0'}`, adminBR.body.token, { isActive: false })
    if (updateBlocked.status === 404) record('7', 'Al-Rahman admin cannot update Al-Noor member', 'PASS')
    else record('7', 'Al-Rahman admin cannot update Al-Noor member', 'FAIL', `status=${updateBlocked.status}`)
  } else {
    record('7', 'Cross-mosque admin test', 'SKIP', 'admin.rahman not seeded')
  }

  // ── Section 8: Delete created member via UI ─────────────────────────────────
  console.log('\nSection 8: Delete created member via UI')
  await page.goto(BASE_URL + '/admin/committee', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  const targetRow = page.getByRole('row').filter({ hasText: newEmail })
  if (await targetRow.count() >= 1) {
    await targetRow.locator('button').last().click()
    await page.waitForTimeout(1200)
    const stillThere = await page.getByText(newEmail).count()
    if (stillThere === 0) record('8', 'Created member removed from list', 'PASS')
    else record('8', 'Created member removed from list', 'FAIL', `still=${stillThere}`)
  } else {
    record('8', 'Delete created member via UI', 'SKIP', 'row not found')
  }
  await page.screenshot({ path: `${SCREENSHOT_DIR}/8-after-delete.png`, fullPage: false })

  // ── Section 9: Login attempt for deactivated account is 403 ──────────────────
  console.log('\nSection 9: Login attempt for deactivated committee account is blocked')
  if (a1) {
    await apiJson(api, 'PUT', `/committee/${a1._id}`, adminToken, { isActive: false })
    const loginDenied = await apiJson(api, 'POST', '/auth/login', null, { email: 'committee@emasjid.pk', password: 'committee123' })
    if (loginDenied.status === 403) record('9', 'Deactivated account login returns 403', 'PASS', `msg="${loginDenied.body.message}"`)
    else record('9', 'Deactivated account login returns 403', 'FAIL', `status=${loginDenied.status}`)
    await apiJson(api, 'PUT', `/committee/${a1._id}`, adminToken, { isActive: true })
  } else {
    record('9', 'Deactivated login block', 'SKIP', 'A1 id missing')
  }

  await browser.close()
  await api.dispose()

  console.log('\n=== Phase 15 Admin Committee Account Management Test Summary ===')
  const tally = OUTCOMES.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc }, {})
  console.log(JSON.stringify(tally))
  console.log('Total:', OUTCOMES.length)
})().catch((err) => {
  console.error('Phase 15 test run failed:', err)
  process.exit(1)
})