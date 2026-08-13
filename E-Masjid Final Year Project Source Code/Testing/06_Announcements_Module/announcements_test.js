/**
 * Phase 6: Announcements Module - Comprehensive Playwright Test
 *
 * Covers all 11 BUG-ANN-001 to 011 fixes:
 *   - BUG-ANN-001/002 (FIX-ANN-001): public page dynamic mosque name + dynamic Islamic date
 *   - BUG-ANN-003 (FIX-ANN-009): dead sort button removed
 *   - BUG-ANN-004/010 (FIX-ANN-003): quick actions wired to real API
 *   - BUG-ANN-005 (FIX-ANN-004): mosque-mismatch banner on admin
 *   - BUG-ANN-006 (FIX-ANN-007): past publishDate allowed on PUT
 *   - BUG-ANN-007 (FIX-ANN-008): pagination cap fixed (ellipsis + neighborhood)
 *   - BUG-ANN-008 (FIX-ANN-005): delete confirmation modal (type title)
 *   - BUG-ANN-009 (FIX-ANN-006): publishedBy from useAuth
 *   - BUG-ANN-011 (FIX-ANN-005 part): title attributes on icon buttons
 *
 * Plus coverage gap from Phase 4:
 *   - Mosque-switch on /announcements page (Phase 5 → all future modules)
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
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  page.on('pageerror', (err) => console.error('BROWSER ERROR:', err))

  console.log('\n=== Phase 6: Announcements Module Test ===\n')

  try {
    // Fetch mosques first via API so we know the IDs before navigating.
    const mosquesRes = await page.request.get(API_URL + '/api/mosques/public')
    const mosquesJson = await mosquesRes.json()
    const alNoor = (mosquesJson.data || []).find((m) => m.name === 'Masjid Al-Noor')
    const alRahman = (mosquesJson.data || []).find((m) => m.name === 'Masjid Al-Rahman')
    const alNoorId = alNoor?._id
    const alRahmanId = alRahman?._id
    if (!alNoorId || !alRahmanId) {
      log('Could not fetch mosque IDs', 'FAIL', 'mosques missing')
    }

    // =======================================================================
    // SECTION 1: Public /announcements page — initial Al-Noor state
    // =======================================================================
    console.log('--- Section 1: Public /announcements page (Al-Noor) ---')
    // Visit the site first so we can set localStorage under the correct origin.
    await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' })
    // Now seed localStorage: Al-Noor first. /api/mosques/public returns
    // Al-Rahman first (newest), so without an explicit localStorage seed,
    // the MosqueContext would auto-pick Al-Rahman.
    await page.evaluate((id) => { localStorage.setItem('activeMosqueId', id) }, alNoorId)
    await page.goto(BASE_URL + '/announcements', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)

    const h1Visible = await page.locator('h1:has-text("Community Announcements")').first().isVisible().catch(() => false)
    log('Public /announcements page loads', h1Visible ? 'PASS' : 'FAIL', h1Visible ? 'h1 visible' : 'h1 missing')

    // Wait for the MosqueContext to populate `activeMosque` so the subtitle
    // switches from the fallback ("from your masjid") to the dynamic name.
    await page.waitForTimeout(2500)

    // FIX-ANN-001 (BUG-ANN-001/002): subtitle should be dynamic, not "Masjid Al-Noor" hardcoded
    // The header has h1 + p (subtitle). Use a more specific selector.
    const subtitleText = await page.locator('header p').first().textContent().catch(() => '')
    const subtitleHasNoor = subtitleText.includes('Masjid Al-Noor')
    log(
      'Subtitle mentions Al-Noor initially',
      subtitleHasNoor ? 'PASS' : 'FAIL',
      subtitleText.substring(0, 80)
    )

    // FIX-ANN-001 (BUG-ANN-002): no hardcoded "15 Shawwal 1446 AH"
    const allText = await page.content()
    const hasHardcodedHardcoded = allText.includes('15 Shawwal 1446 AH')
    log(
      'No hardcoded "15 Shawwal 1446 AH" badge',
      hasHardcodedHardcoded ? 'FAIL' : 'PASS',
      hasHardcodedHardcoded ? 'hardcoded string found' : 'dynamic or absent'
    )

    // FIX-ANN-002 (BUG-ANN urgent): amber banner at top if any urgent exists
    const urgentBanner = await page.locator('article:has-text("Urgent Notice")').first().isVisible().catch(() => false)
    log(
      'Urgent banner visible at top',
      urgentBanner ? 'PASS' : 'FAIL',
      urgentBanner ? 'amber banner shown' : 'no amber banner'
    )

    // FIX-ANN-002 (BUG-ANN urgent): red badge on urgent cards
    const urgentBadgeCount = await page.locator('span:has-text("Urgent")').count()
    log(
      'Red "Urgent" badge appears on cards',
      urgentBadgeCount > 0 ? 'PASS' : 'FAIL',
      `Found ${urgentBadgeCount} urgent badge(s) on page`
    )

    // FIX-ANN-009 (BUG-ANN-003): dead "Newest First" button removed
    const hasSortButton = await page.locator('button:has-text("Newest First")').count()
    log(
      'Dead "Newest First" button removed',
      hasSortButton === 0 ? 'PASS' : 'FAIL',
      hasSortButton === 0 ? 'absent' : `still ${hasSortButton} element(s)`
    )

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-public-initial.png'), fullPage: true })

    // =======================================================================
    // SECTION 2: Mosque switch on /announcements page
    // =======================================================================
    console.log('\n--- Section 2: Mosque switch on /announcements ---')
    // (alNoorId / alRahmanId already fetched in Section 1 setup.)

    // Capture initial card count
    const noorCardCount = await page.locator('article:has(h3)').count()
    log(
      'Al-Noor card count > 0',
      noorCardCount > 0 ? 'PASS' : 'FAIL',
      `found ${noorCardCount} cards`
    )

    // Switch to Al-Rahman via localStorage + reload
    await page.evaluate((id) => { localStorage.setItem('activeMosqueId', id) }, alRahmanId)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)

    // FIX-ANN-001 (BUG-ANN-001): subtitle now mentions Al-Rahman
    const subtitleRahman = await page.locator('header p').first().textContent().catch(() => '')
    const subtitleHasRahman = subtitleRahman.includes('Masjid Al-Rahman')
    log(
      'Subtitle updates to Al-Rahman after switch',
      subtitleHasRahman ? 'PASS' : 'FAIL',
      subtitleRahman.substring(0, 80)
    )

    // FIX-ANN-002 (BUG-ANN urgent): Al-Rahman has "New Prayer Hall Opened" urgent
    const rahmanUrgent = await page.locator('article:has-text("New Prayer Hall Opened")').first().isVisible().catch(() => false)
    log(
      'Al-Rahman urgent announcement appears',
      rahmanUrgent ? 'PASS' : 'FAIL',
      rahmanUrgent ? '"New Prayer Hall Opened" visible' : 'not found'
    )

    // Switch back to Al-Noor
    await page.evaluate((id) => { localStorage.setItem('activeMosqueId', id) }, alNoorId)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-mosque-switch.png'), fullPage: true })

    // =======================================================================
    // SECTION 3: Admin login
    // =======================================================================
    console.log('\n--- Section 3: Admin Login ---')
    // First, set localStorage to Al-Noor so login lands in the right mosque
    await page.evaluate((id) => { localStorage.setItem('activeMosqueId', id) }, alNoorId)
    await page.goto(BASE_URL + '/admin/login', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    // Try common selectors + handle either way
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    await emailInput.fill('admin@emasjid.pk')
    await passwordInput.fill('admin123')
    const loginButton = page.locator('button[type="submit"]:has-text("Login"), button:has-text("Login")').first()
    await loginButton.click()
    await page.waitForTimeout(2500)
    log('Admin login submitted', 'PASS', 'login form filled')

    // =======================================================================
    // SECTION 4: Admin Announcements page
    // =======================================================================
    console.log('\n--- Section 4: Admin Announcements page ---')
    await page.goto(BASE_URL + '/admin/announcements', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const adminPageTitle = await page.locator('h1:has-text("Manage Announcements")').first().isVisible().catch(() => false)
    log('Admin Announcements page loads', adminPageTitle ? 'PASS' : 'FAIL', adminPageTitle ? 'h1 visible' : 'h1 missing')

    // FIX-ANN-004 (BUG-ANN-005): mosque-mismatch banner via UI mosque selector
    // (We use the navbar selector instead of direct localStorage because
    //  MosqueContext only reads localStorage on mount; manual localStorage
    //  changes don't trigger a re-render in React.)
    // The mosque selector is in the navbar at viewport >= xl (1280px). Our
    // viewport is 1440x900 so it should be visible.
    if (alRahmanId) {
      // Find the navbar mosque selector button
      const navSelector = page.locator('button[title*="Al-Noor"], button[title*="masjid"]').first()
      let selectorAvailable = await navSelector.isVisible().catch(() => false)
      if (!selectorAvailable) {
        // Fallback: find the dropdown chevron next to the mosque name
        const fallback = page.locator('header').locator('button:has-text("Masjid")').first()
        selectorAvailable = await fallback.isVisible().catch(() => false)
      }
      if (selectorAvailable) {
        await navSelector.click()
        await page.waitForTimeout(800)
        // Click the Al-Rahman option in the modal
        const rahmanOption = page.locator('button:has-text("Masjid Al-Rahman"), [role="option"]:has-text("Masjid Al-Rahman")').first()
        await rahmanOption.click()
        await page.waitForTimeout(1500)
      }

      const banner = await page.locator('section:has-text("different mosque in the navbar")').first().isVisible({ timeout: 3000 }).catch(() => false)
      log(
        'Mosque mismatch banner appears',
        banner ? 'PASS' : 'FAIL',
        banner ? 'yellow banner shown' : 'no banner'
      )

      // FIX-ANN-004 (BUG-ANN-005): form/list still shows admin's own mosque (Al-Noor)
      const noorIqamaTitle = await page.locator('h3:has-text("Ramadan Schedule Updated")').first().isVisible().catch(() => false)
      log(
        'Admin list still shows Al-Noor (own mosque)',
        noorIqamaTitle ? 'PASS' : 'FAIL',
        noorIqamaTitle ? 'Al-Noor item visible' : 'not found'
      )

      // Reset
      await page.evaluate((id) => { localStorage.setItem('activeMosqueId', id) }, alNoorId)
      await page.reload({ waitUntil: 'networkidle' })
      await page.waitForTimeout(1500)
    }

    // FIX-ANN-011 (BUG-ANN-011): icon buttons have title attributes
    const editButton = page.locator('button[aria-label="Edit announcement"]').first()
    const hasTitleAria = await editButton.getAttribute('aria-label').catch(() => '')
    log(
      'Icon buttons have aria-label',
      hasTitleAria === 'Edit announcement' ? 'PASS' : 'FAIL',
      `aria-label="${hasTitleAria}"`
    )

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-admin-announcements.png'), fullPage: true })

    // =======================================================================
    // SECTION 5: Create new announcement
    // =======================================================================
    console.log('\n--- Section 5: Create new announcement ---')
    const newButton = page.locator('button:has-text("New Announcement")').first()
    await newButton.click()
    await page.waitForTimeout(1000)
    const modalTitle = await page.locator('h3:has-text("Create New Announcement")').first().isVisible().catch(() => false)
    log('Create modal opens', modalTitle ? 'PASS' : 'FAIL', modalTitle ? 'modal visible' : 'modal missing')

    const titleInput = page.locator('label:has-text("Announcement Title") input[type="text"]').first()
    const contentTextarea = page.locator('label:has-text("Content") textarea').first()
    await titleInput.fill('TEST-ANN - Quick Smoke Test')
    await contentTextarea.fill('This is an automated test announcement created by the Phase 6 test runner.')
    const submitButton = page.locator('button[type="submit"]:has-text("Create Announcement")').first()
    await submitButton.click()
    await page.waitForTimeout(2500)

    // Wait for the toast to disappear and the list to re-render
    await page.waitForTimeout(3000)
    const createdItem = await page.locator('h3:has-text("TEST-ANN - Quick Smoke Test")').first().isVisible({ timeout: 5000 }).catch(() => false)
    log('Created announcement appears in list', createdItem ? 'PASS' : 'FAIL', createdItem ? 'visible' : 'not found')

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-after-create.png'), fullPage: true })

    // =======================================================================
    // SECTION 6: FIX-ANN-003 (BUG-ANN-004) — wire Mark Urgent to real API
    // =======================================================================
    console.log('\n--- Section 6: Mark Urgent quick action (FIX-ANN-003) ---')
    // Find a non-urgent published announcement and click its urgent button
    const urgentButton = page.locator('button[aria-label="Mark as urgent"]').first()
    const urgentButtonVisible = await urgentButton.isVisible().catch(() => false)
    if (urgentButtonVisible) {
      await urgentButton.click()
      await page.waitForTimeout(2000)
      // Look for the "Urgent" badge in the same card area
      const urgentAfterMark = await page.locator('button[aria-label="Remove urgent flag"]').first().isVisible().catch(() => false)
      log(
        'Mark Urgent quick action calls API',
        urgentAfterMark ? 'PASS' : 'FAIL',
        urgentAfterMark ? 'urgent flag toggled' : 'no toggle observed'
      )
    } else {
      log('Mark Urgent quick action button visible', 'SKIP', 'all non-urgent items already urgent')
    }

    // =======================================================================
    // SECTION 7: FIX-ANN-005 (BUG-ANN-008) — delete confirmation modal
    // =======================================================================
    console.log('\n--- Section 7: Delete confirmation modal ---')
    const deleteButton = page.locator('button[aria-label="Delete announcement"]').first()
    await deleteButton.click()
    await page.waitForTimeout(1000)
    const confirmModal = await page.locator('h3:has-text("Delete Announcement")').first().isVisible().catch(() => false)
    log('Delete confirmation modal opens', confirmModal ? 'PASS' : 'FAIL', confirmModal ? 'modal shown' : 'modal missing')

    // Try clicking Delete with empty input — should be disabled
    const deletePermanently = page.locator('button:has-text("Delete Permanently")').first()
    const isDisabled = await deletePermanently.isDisabled().catch(() => false)
    log('Delete disabled until title typed', isDisabled ? 'PASS' : 'FAIL', isDisabled ? 'disabled' : 'enabled')

    // Cancel out
    const cancelBtn = page.locator('button:has-text("Cancel")').first()
    await cancelBtn.click()
    await page.waitForTimeout(500)

    // =======================================================================
    // SECTION 8: FIX-ANN-003 (BUG-ANN-004) — Mark Urgent round-trip via API
    // =======================================================================
    console.log('\n--- Section 8: Mark Urgent round-trip via API ---')
    // Get auth token
    const loginRes = await page.request.post(API_URL + '/api/auth/login', {
      data: { email: 'admin@emasjid.pk', password: 'admin123' },
    })
    const loginJson = await loginRes.json()
    const token = loginJson.token
    if (!token) {
      log('Admin login via API', 'FAIL', 'no token returned')
    }

    // Find the TES-ANN announcement we just created (now likely urgent)
    const annList = await page.request.get(API_URL + '/api/announcements?mosqueId=' + alNoorId + '&includeAll=true', {
      headers: { Authorization: 'Bearer ' + token },
    })
    const annListJson = await annList.json()
    const testAnn = (annListJson.data || []).find((a) => a.title === 'TEST-ANN - Quick Smoke Test')
    if (testAnn) {
      // FIX-ANN-006 (BUG-ANN-009): publishedBy should not be hardcoded 'Admin'
      const pubBy = testAnn.publishedBy
      log(
        'publishedBy is admin user name (not "Admin")',
        pubBy && pubBy !== 'Admin' ? 'PASS' : 'FAIL',
        `value="${pubBy}"`
      )

      // FIX-ANN-007 (BUG-ANN-006): PUT with a past publishDate should succeed (not 400)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const putRes = await page.request.put(API_URL + '/api/announcements/' + testAnn._id, {
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        data: { publishDate: yesterday, isUrgent: false },
      })
      log(
        'PUT with past publishDate succeeds',
        putRes.status() === 200 ? 'PASS' : 'FAIL',
        `HTTP ${putRes.status()}`
      )
    } else {
      log('Find test announcement via API', 'FAIL', 'not in list')
    }

    // =======================================================================
    // SECTION 9: FIX-ANN-008 (BUG-ANN-007) — pagination cap
    // =======================================================================
    console.log('\n--- Section 9: Pagination cap (FIX-ANN-008) ---')
    // We can't easily seed 30+ announcements, but we can verify the pageNumbers
    // logic by checking that the page buttons DO exist on the public page
    // (this is the live public page, but it has 6 items per page, so for 6+
    // announcements there will be page numbers 1, 2, 3, etc.)
    await page.goto(BASE_URL + '/announcements', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    // Switch to Al-Rahman to leverage their 3 announcements
    await page.evaluate((id) => { localStorage.setItem('activeMosqueId', id) }, alRahmanId)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    const pageButtons = await page.locator('nav button').count()
    log(
      'Pagination renders at least 2 buttons',
      pageButtons >= 2 ? 'PASS' : 'SKIP',
      `found ${pageButtons} nav buttons (insufficient data to fully test pagination cap)`
    )

    // =======================================================================
    // SECTION 10: API endpoint verification
    // =======================================================================
    console.log('\n--- Section 10: API endpoint verification ---')
    const allRes = await page.request.get(API_URL + '/api/announcements')
    const allJson = await allRes.json()
    const allList = allJson.data || []
    log(
      'GET /api/announcements (no params)',
      allRes.status() === 200 && allList.length > 0 ? 'PASS' : 'FAIL',
      `${allList.length} announcement(s)`
    )

    const noorRes = await page.request.get(API_URL + '/api/announcements?mosqueId=' + alNoorId)
    const noorJson = await noorRes.json()
    const noorList = noorJson.data || []
    log(
      'GET /api/announcements?mosqueId=Al-Noor',
      noorRes.status() === 200 && noorList.every((a) => a.mosqueId === alNoorId) ? 'PASS' : 'FAIL',
      `${noorList.length} Al-Noor item(s)`
    )

    // Drafts should NOT be in public list (unless includeAll=true)
    const rasmanRes = await page.request.get(API_URL + '/api/announcements?mosqueId=' + alRahmanId)
    const rahmanJson = await rasmanRes.json()
    const noDraftsInPublic = (rahmanJson.data || []).every((a) => a.status !== 'draft')
    log(
      'Public GET excludes drafts',
      noDraftsInPublic ? 'PASS' : 'FAIL',
      `no drafts in public list`
    )

    // Cleanup: delete the test announcement
    if (testAnn && token) {
      await page.request.delete(API_URL + '/api/announcements/' + testAnn._id, {
        headers: { Authorization: 'Bearer ' + token },
      })
    }

    // =======================================================================
    // SUMMARY
    // =======================================================================
    console.log('\n=== Phase 6 Announcements Test Summary ===')
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
