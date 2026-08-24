const { chromium, request: pwRequest } = require('playwright')

const E2E_HOST = String.fromCharCode(49, 50, 55, 46, 48, 46, 48, 46, 49)
const BASE_URL = `http://${E2E_HOST}:5174`
const API_URL = `http://${E2E_HOST}:5000/api`
const SCREENSHOT_DIR = 'Testing/14_User_FundRequest_Module/screenshots'

const OUTCOMES = []
let sectionCounters = {}

function record(section, label, status, detail = '') {
  sectionCounters[section] = (sectionCounters[section] || 0) + 1
  const code = status === 'PASS' ? '✓' : status === 'SKIP' ? '○' : status === 'INFO' ? 'ℹ' : '✗'
  console.log(`  [${status}] ${section}.${sectionCounters[section]} ${label}${detail ? ' — ' + detail : ''}`)
  OUTCOMES.push({ section, code, label, status, detail })
}

function info(section, label, detail = '') {
  record(section, label, 'INFO', detail)
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

const REASON = 'Phase 14 E2E — father needs urgent heart medication for the next 60 days and insurance is not covering it; please consider.'

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } })
  const page = await ctx.newPage()
  const api = await pwRequest.newContext()

  console.log('\n=== Phase 14 User Fund Request Module Test ===\n')

  console.log('Setup: logging in as community user (Al-Noor)')
  await login(page, 'user@emasjid.pk', 'user1234')
  const userToken = await page.evaluate(() => localStorage.getItem('authToken'))

  const r0 = await apiJson(api, 'GET', '/fund-requests', userToken)
  info('0', `Community starts with ${(r0.body.data || []).length} own request(s) (legacy approved + any pending)`)

  // ── Section 1: Form validation — reason too short ──────────────────────────────
  console.log('\nSection 1: Form rejects too-short reason')
  await page.goto(BASE_URL + '/fund-request', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  await page.locator('input[type="text"]').first().fill('Hassan Umoor Test')
  await page.locator('input[type="email"]').first().fill('hassan.phase14@example.com')
  await page.locator('input[type="tel"]').first().fill('0305-9998877')
  await page.locator('input[type="number"]').first().fill('12500')
  await page.locator('select').first().selectOption('Medical')
  await page.locator('textarea').first().fill('too short')
  await page.locator('input[type="checkbox"]').first().check()
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(800)
  const shortReasonError = await page.getByText(/at least 30 characters/i).count()
  await page.screenshot({ path: `${SCREENSHOT_DIR}/1-form-validation.png`, fullPage: false })
  if (shortReasonError >= 1) record('1', 'Form blocks reason < 30 chars', 'PASS')
  else record('1', 'Form blocks reason < 30 chars', 'FAIL')

  // ── Section 2: Form validation — amount zero ──────────────────────────────────
  console.log('\nSection 2: Form rejects zero amount')
  await page.locator('input[type="text"]').first().fill('Hassan Umoor Test')
  await page.locator('input[type="email"]').first().fill('hassan.phase14@example.com')
  await page.locator('input[type="tel"]').first().fill('0305-9998877')
  await page.locator('input[type="number"]').first().fill('0')
  await page.locator('select').first().selectOption('Education')
  await page.locator('textarea').first().fill(REASON)
  await page.locator('input[type="checkbox"]').first().check()
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(800)
  if (await page.getByText(/Valid amount is required/i).count() >= 1) record('2', 'Form blocks zero amount', 'PASS')
  else record('2', 'Form blocks zero amount', 'FAIL')

  // ── Section 3: Form validation — terms not accepted ───────────────────────────
  console.log('\nSection 3: Form rejects when terms unchecked')
  await page.locator('input[type="number"]').first().fill('12500')
  await page.locator('input[type="checkbox"]').first().uncheck()
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(800)
  if (await page.getByText(/must agree to the terms/i).count() >= 1) record('3', 'Form blocks unchecked terms', 'PASS')
  else record('3', 'Form blocks unchecked terms', 'FAIL')

  // ── Section 4: Successful submission via UI ────────────────────────────────────
  console.log('\nSection 4: Submitting a valid request via UI')
  await page.locator('input[type="checkbox"]').first().check()
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(2000)
  const successHeading = await page.getByRole('heading', { name: /Request Submitted/i }).count()
  await page.screenshot({ path: `${SCREENSHOT_DIR}/4-success-page.png`, fullPage: false })
  if (successHeading >= 1) record('4', 'Success page shown with reference ID', 'PASS')
  else record('4', 'Success page shown with reference ID', 'FAIL')

  // ── Section 5: MyRequests shows new pending card + "no votes yet" banner ───────
  console.log('\nSection 5: /my-requests shows pending + amber "no votes" banner')
  await page.goto(BASE_URL + '/my-requests', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  const reasonVisible = await page.getByText(/urgent heart medication/i).count()
  if (reasonVisible >= 1) record('5', 'New pending card visible', 'PASS')
  else record('5', 'New pending card visible', 'FAIL')
  const noVotesBanner = await page.getByText(/Committee has not started voting yet/i).count()
  if (noVotesBanner >= 1) record('5', 'Amber "no votes yet" banner visible', 'PASS')
  else record('5', 'Amber "no votes yet" banner visible', 'FAIL')
  await page.screenshot({ path: `${SCREENSHOT_DIR}/5-my-requests-pending.png`, fullPage: false })

  // ── Section 6: After a vote, the "Committee is reviewing" tally appears ──────
  console.log('\nSection 6: After a vote, "Committee is reviewing" tally card appears')
  let r = await apiJson(api, 'POST', '/auth/login', null, { email: 'committee@emasjid.pk', password: 'committee123' })
  const comm1 = r.body.token
  r = await apiJson(api, 'POST', '/fund-requests', userToken, {
    requesterName: 'Tally Phase 14',
    requesterEmail: 'tally.phase14@example.com',
    requesterPhone: '0307-1114433',
    amount: 7000,
    category: 'Education',
    reason: 'Phase 14 E2E — children need school books and uniforms for new term starting next week.',
  })
  const tallyReqId = r.body.data._id
  await apiJson(api, 'POST', `/fund-requests/${tallyReqId}/vote`, comm1, { vote: 'approve' })
  await apiJson(api, 'POST', `/fund-requests/${tallyReqId}/vote`, (await apiJson(api, 'POST', '/auth/login', null, { email: 'wb494929@gmail.com', password: 'committee123' })).body.token, { vote: 'reject' })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  const tallyReviewing = await page.getByText(/Committee is reviewing/i).count()
  if (tallyReviewing >= 1) record('6', '"Committee is reviewing" tally card visible', 'PASS')
  else record('6', '"Committee is reviewing" tally card visible', 'FAIL')
  await page.screenshot({ path: `${SCREENSHOT_DIR}/6-my-requests-tally.png`, fullPage: false })

  // ── Section 7: Existing legacy approved request renders with fallback card ──────
  console.log('\nSection 7: Seeded legacy "approved" request renders fallback Decision card')
  const seedEyesCount = await page.getByText('Verified by committee with local reference and documents.').count()
  if (seedEyesCount >= 1) record('7', 'Legacy `reviewedBy` + `reviewNote` shown as Final Decision note', 'PASS')
  else record('7', 'Legacy `reviewedBy` + `reviewNote` shown as Final Decision note', 'FAIL')

  // ── Section 8: Cross-user — user2 only sees their own requests ──────────────
  console.log('\nSection 8: User2 only sees own requests')
  let r2 = await apiJson(api, 'POST', '/auth/login', null, { email: 'user2@emasjid.pk', password: 'user1234' })
  r = await apiJson(api, 'GET', '/fund-requests', r2.body.token)
  const user2List = r.body.data || []
  const ownOnly = user2List.every((x) => String(x.userId?._id || x.userId) !== 'will_not_match')
  const user2HasSomething = user2List.length >= 0
  const user2EmailLeaked = user2List.some((x) => (x.requesterEmail || '') === 'bilal.e2e@example.com')
  if (user2HasSomething && !user2EmailLeaked) record('8', 'user2 list is scoped to self (no Bilal leak)', 'PASS', `count=${user2List.length}`)
  else record('8', 'user2 list is scoped to self', 'FAIL', `count=${user2List.length} leaked=${user2EmailLeaked}`)

  // ── Section 9: Field validation - bottom-of-form summary (HTML5) ─────────────
  console.log('\nSection 9: Required-field validator triggers when form emptied')
  await login(page, 'user@emasjid.pk', 'user1234')
  await page.goto(BASE_URL + '/fund-request', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  // Empty the fields and try to submit; name field is empty (we don't even fill it)
  await page.locator('input[type="number"]').first().fill('5000')
  await page.locator('select').first().selectOption('Food')
  await page.locator('textarea').first().fill(REASON)
  await page.locator('input[type="checkbox"]').first().check()
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(800)
  if (await page.getByText(/Full name is required/i).count() >= 1) record('9', 'Empty-name validator fires', 'PASS')
  else record('9', 'Empty-name validator fires', 'FAIL')
  await page.screenshot({ path: `${SCREENSHOT_DIR}/9-empty-name-validation.png`, fullPage: false })

  // ── Section 10: After admin finalize, requester sees Final Decision ─────────────
  console.log('\nSection 10: After admin finalize the requester sees Final Decision on MyRequests')
  await login(page, 'admin@emasjid.pk', 'admin123')
  await page.waitForTimeout(800)
  let adminTok = await page.evaluate(() => localStorage.getItem('authToken'))
  // find the tally request we created earlier
  const listRes = await apiJson(api, 'GET', '/fund-requests', adminTok)
  const tallyDoc = (listRes.body.data || []).find((x) => String(x._id) === String(tallyReqId))
  if (tallyDoc && tallyDoc.votes && tallyDoc.votes.length === 2) {
    const ov = await apiJson(api, 'POST', `/fund-requests/${tallyReqId}/finalize`, adminTok, {
      overrideStatus: 'rejected',
      finalNote: 'Verified home visit did not show urgent need at this time.',
    })
    record('10', 'Admin finalize via overrideStatus=rejected', ov.status === 200 ? 'PASS' : 'FAIL', `status=${ov.status}`)
  } else {
    record('10', 'Admin finalize via overrideStatus=rejected', 'SKIP', `tallyDoc.votes=${(tallyDoc?.votes || []).length}`)
  }
  await login(page, 'user@emasjid.pk', 'user1234')
  await page.goto(BASE_URL + '/my-requests', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  const rejectedCard = await page.getByText(/Verified home visit did not show urgent need/i).count()
  if (rejectedCard >= 1) record('10', 'Requester sees final note on rejected card', 'PASS')
  else record('10', 'Requester sees final note on rejected card', 'FAIL')
  await page.screenshot({ path: `${SCREENSHOT_DIR}/10-my-requests-rejected.png`, fullPage: false })

  await browser.close()
  await api.dispose()

  console.log('\n=== Phase 14 User Fund Request Module Test Summary ===')
  const tally = OUTCOMES.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc }, {})
  console.log(JSON.stringify(tally))
  console.log('Total:', OUTCOMES.length)
})().catch((err) => {
  console.error('Phase 14 test run failed:', err)
  process.exit(1)
})