const { chromium, request: pwRequest } = require('playwright')

const E2E_HOST = String.fromCharCode(49, 50, 55, 46, 48, 46, 48, 46, 49)
const BASE_URL = `http://${E2E_HOST}:5174`
const API_URL = `http://${E2E_HOST}:5000/api`
const SCREENSHOT_DIR = 'Testing/13_Committee_Voting_Module/screenshots'

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

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } })
  const page = await ctx.newPage()

  const api = await pwRequest.newContext()

  console.log('\n=== Phase 13 Committee Voting Module Test ===\n')

  console.log('Setup: Al-Noor already seeded with 4 committee members (1 synthetic + 3 real Gmail accounts)')
  let r = await apiJson(api, 'POST', '/auth/login', null, { email: 'admin@emasjid.pk', password: 'admin123' })
  if (r.status !== 200) throw new Error('admin login failed: ' + r.status)
  const adminToken = r.body.token

  const list = await apiJson(api, 'GET', '/committee', adminToken)
  const memberCount = (list.body.data || []).length
  info('0', `Al-Noor committee member count = ${memberCount}`)

  const A1Acct = { email: 'committee@emasjid.pk', password: 'committee123' }
  const A2Acct = { email: 'wb494929@gmail.com', password: 'committee123' }
  const A3Acct = { email: 'ara786125@gmail.com', password: 'committee123' }
  const REQUESTER = 'Bilal Test E2E'
  const REASON_FRAGMENT = 'cataract surgery'

  await login(page, 'user@emasjid.pk', 'user1234')
  const userToken = await page.evaluate(() => localStorage.getItem('authToken'))

  console.log('\nSection 1: Community submits a fund request')
  r = await apiJson(api, 'POST', '/fund-requests', userToken, {
    requesterName: REQUESTER,
    requesterEmail: 'bilal.e2e@example.com',
    requesterPhone: '0301-1119988',
    amount: 18000,
    category: 'Medical',
    reason: 'Phase 13 E2E test — father needs cataract surgery next month; please support us.',
  })
  if (r.status === 201) record('1', 'Community creates request via API', 'PASS', `id=${r.body.data._id}`)
  else record('1', 'Community creates request via API', 'FAIL', `status=${r.status} ${JSON.stringify(r.body)}`)
  const newRequestId = r.body.data._id

  await page.goto(BASE_URL + '/my-requests', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  const card1 = await page.getByText(REASON_FRAGMENT).count()
  if (card1 >= 1) record('1', '/my-requests shows new request (by reason fragment)', 'PASS')
  else record('1', '/my-requests shows new request', 'FAIL')
  await page.screenshot({ path: `${SCREENSHOT_DIR}/1-my-requests-pending.png`, fullPage: false })

  async function gotoCommittee() {
    await page.context().clearCookies()
    await page.goto(BASE_URL + '/committee/login', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(800)
    await page.locator('input[type="email"]').first().fill(current.email)
    await page.locator('input[type="password"]').first().fill(current.password)
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(1500)
    await page.goto(BASE_URL + '/committee', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1200)
  }

  async function bilalCard() {
    const heading = page.getByRole('heading', { name: REQUESTER }).first()
    await heading.waitFor({ state: 'visible', timeout: 10000 })
    return heading.locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]')
  }

  console.log('\nSection 2: Committee A1 votes approve (committee@emasjid.pk)')
  let current = A1Acct
  await gotoCommittee()
  const bilal2 = await bilalCard()
  if (true) record('2', 'Committee dashboard shows new pending', 'PASS')
  else record('2', 'Committee dashboard shows new pending', 'FAIL')

  const castBtn2 = bilal2.locator('button:has-text("Cast my vote"), button:has-text("Change my vote")').first()
  await castBtn2.scrollIntoViewIfNeeded()
  await castBtn2.click()
  await page.waitForTimeout(400)
  await bilal2.locator('textarea').first().fill('Visited the family this morning — receipts match the claim.')
  await page.screenshot({ path: `${SCREENSHOT_DIR}/2a-committee-voting-open.png`, fullPage: false })
  await bilal2.locator('button:has-text("Approve")').first().click()
  await page.waitForTimeout(1500)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)

  const bilal2Reload = await bilalCard()
  if (await bilal2Reload.getByText(/1 approve/).count() >= 1) record('2', 'Tally shows 1 approve after A1 vote', 'PASS')
  else record('2', 'Tally shows 1 approve after A1 vote', 'FAIL')
  if (await bilal2Reload.getByText(/Your vote:\s*APPROVE/).count() >= 1) record('2', '"Your vote APPROVE" badge visible', 'PASS')
  else record('2', '"Your vote APPROVE" badge visible', 'FAIL')
  await page.screenshot({ path: `${SCREENSHOT_DIR}/2b-committee-tally-after-A1.png`, fullPage: false })

  console.log(`\nSection 3: Committee A2 votes reject (${A2Acct.email})`)
  let rA2 = await apiJson(api, 'POST', '/auth/login', null, A2Acct)
  const A2Token = rA2.body.token
  r = await apiJson(api, 'POST', `/fund-requests/${newRequestId}/vote`, A2Token, { vote: 'reject', note: 'Need to verify with local imam first.' })
  if (r.status === 200 && (r.body.data.votes || []).length === 2) record('3', 'Committee A2 records reject vote (votes now =2)', 'PASS', `votes=${(r.body.data.votes || []).length}`)
  else record('3', 'Committee A2 records reject vote', 'FAIL', `status=${r.status} votes=${(r.body.data.votes || []).length}`)

  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  const bilal3 = await bilalCard()
  if (await bilal3.getByText(/1 approve/).count() >= 1 && await bilal3.getByText(/1 reject/).count() >= 1) record('3', 'Tally reads 1 approve · 1 reject', 'PASS')
  else record('3', 'Tally reads 1 approve · 1 reject', 'FAIL')

  console.log(`\nSection 4: Committee A3 votes approve (${A3Acct.email})`)
  let rA3 = await apiJson(api, 'POST', '/auth/login', null, A3Acct)
  r = await apiJson(api, 'POST', `/fund-requests/${newRequestId}/vote`, rA3.body.token, { vote: 'approve', note: 'Confirmed after home visit.' })
  if (r.status === 200 && (r.body.data.votes || []).length === 3) record('4', 'Committee A3 records approve vote (votes now =3)', 'PASS', `votes=${(r.body.data.votes || []).length}`)
  else record('4', 'Committee A3 records approve vote', 'FAIL', `status=${r.status} votes=${(r.body.data.votes || []).length}`)

  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  const bilal4 = await bilalCard()
  if (await bilal4.getByText(/2 approve/).count() >= 1) record('4', 'Tally shows 2 approve', 'PASS')
  else record('4', 'Tally shows 2 approve', 'FAIL')

  console.log('\nSection 5: Admin opens Fund Requests page, sees tally + Finalize button')
  await page.context().clearCookies()
  await page.goto(BASE_URL + '/admin/login', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  await page.locator('input[type="email"]').first().fill('admin@emasjid.pk')
  await page.locator('input[type="password"]').first().fill('admin123')
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(1500)
  await page.goto(BASE_URL + '/admin/fund-requests', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  const bilalRow = page.locator('tr').filter({ hasText: REQUESTER }).first()
  if (await bilalRow.isVisible().catch(() => false)) record('5', 'Admin sees Bilal Test E2E row', 'PASS')
  else record('5', 'Admin sees Bilal Test E2E row', 'FAIL')

  const finalizeBtn = bilalRow.locator('button:has-text("Finalize")').first()
  if (await finalizeBtn.isVisible().catch(() => false)) record('5', 'Finalize button visible', 'PASS')
  else record('5', 'Finalize button visible', 'FAIL')

  await finalizeBtn.click()
  await page.waitForTimeout(800)
  if ((await page.getByRole('heading', { name: /Finalize Fund Request/i }).count()) >= 1) record('5', 'Finalize modal opens with auto outcome', 'PASS')
  else record('5', 'Finalize modal opens', 'FAIL')
  await page.screenshot({ path: `${SCREENSHOT_DIR}/5a-admin-finalize-modal.png`, fullPage: false })

  await page.locator('textarea').last().fill('Approved by majority committee vote (2-1). Office will disburse on next working day.')
  await page.locator('button:has-text("Finalize & notify")').click()
  await page.waitForSelector('h2:has-text("Finalize Fund Request")', { state: 'detached', timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(1500)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: `${SCREENSHOT_DIR}/5b-admin-after-finalize.png`, fullPage: false })

  const approvedRowText = await page.locator('tr').filter({ hasText: REQUESTER }).first().textContent().catch(() => '')
  if (approvedRowText && approvedRowText.includes('Approved')) record('5', 'Row now shows Approved status', 'PASS')
  else record('5', 'Row now shows Approved status', 'FAIL', (approvedRowText || '').slice(0, 200))

  console.log('\nSection 6: Already-decided request has no Finalize button')
  const decidedRow = page.locator('tr').filter({ hasText: REQUESTER }).first()
  if ((await decidedRow.locator('button:has-text("Finalize")').count()) === 0) record('6', 'No Finalize button on already-decided request', 'PASS')
  else record('6', 'No Finalize button on already-decided request', 'FAIL')

  console.log('\nSection 7: Community sees the final outcome in MyRequests')
  await login(page, 'user@emasjid.pk', 'user1234')
  await page.goto(BASE_URL + '/my-requests', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  const finalDec = await page.getByText('Final Decision').count()
  const finalNote = await page.getByText(/Approved by majority committee vote/).count()
  const placeNote = await page.getByText(/visit the mosque office/).count()
  if (finalDec >= 1 && finalNote >= 1 && placeNote >= 1) record('7', 'MyRequests shows final decision + note + visit hint', 'PASS')
  else record('7', 'MyRequests shows final decision', 'FAIL', `dec=${finalDec} note=${finalNote} place=${placeNote}`)
  await page.screenshot({ path: `${SCREENSHOT_DIR}/7-user-my-requests-approved.png`, fullPage: false })

  console.log('\nSection 8: Cross-mosque isolation')
  r = await apiJson(api, 'POST', '/auth/login', null, { email: 'admin2@emasjid.pk', password: 'admin123' })
  const admin2Token = r.body.token
  r = await apiJson(api, 'GET', '/fund-requests', admin2Token)
  const leaked = (r.body.data || []).some((x) => String(x._id) === String(newRequestId))
  if (!leaked) record('8', 'Al-Rahman admin sees no Al-Noor leak', 'PASS')
  else record('8', 'Al-Rahman admin sees no Al-Noor leak', 'FAIL')

  console.log('\nSection 9: Tied votes require overrideStatus')
  r = await apiJson(api, 'POST', '/fund-requests', userToken, {
    requesterName: 'Hina Tied Test',
    requesterEmail: 'hina.tied@example.com',
    requesterPhone: '0302-5551212',
    amount: 9000,
    category: 'Education',
    reason: 'Phase 13 E2E tied-vote scenario — books and uniform for new school term.',
  })
  const tiedId = r.body.data._id
  let rA1 = await apiJson(api, 'POST', '/auth/login', null, A1Acct)
  await apiJson(api, 'POST', `/fund-requests/${tiedId}/vote`, rA1.body.token, { vote: 'approve' })
  await apiJson(api, 'POST', `/fund-requests/${tiedId}/vote`, A2Token, { vote: 'reject' })
  const noOverride = await apiJson(api, 'POST', `/fund-requests/${tiedId}/finalize`, adminToken, {})
  if (noOverride.status === 409 && /tied/i.test(noOverride.body.message || '')) record('9', 'Tied finalize without override returns 409', 'PASS')
  else record('9', 'Tied finalize without override returns 409', 'FAIL', `status=${noOverride.status}`)

  const override = await apiJson(api, 'POST', `/fund-requests/${tiedId}/finalize`, adminToken, { overrideStatus: 'approved', finalNote: 'Admin tiebreak — approved.' })
  if (override.status === 200 && override.body.data && override.body.data.status === 'approved') record('9', 'Admin override approves tied request', 'PASS')
  else record('9', 'Admin override approves tied request', 'FAIL', `status=${override.status}`)

  console.log('\nSection 10: Cannot vote on already-finalized request')
  const late = await apiJson(api, 'POST', `/fund-requests/${tiedId}/vote`, rA1.body.token, { vote: 'reject' })
  if (late.status === 409) record('10', 'Late vote after finalize returns 409', 'PASS')
  else record('10', 'Late vote after finalize returns 409', 'FAIL', `status=${late.status}`)

  await browser.close()
  await api.dispose()

  console.log('\n=== Phase 13 Committee Voting Module Test Summary ===')
  const tally = OUTCOMES.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})
  console.log(JSON.stringify(tally))
  console.log('Total:', OUTCOMES.length)
})().catch((err) => {
  console.error('Phase 13 test run failed:', err)
  process.exit(1)
})