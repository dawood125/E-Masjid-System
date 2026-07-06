/**
 * E-Masjid Public Navbar - Visual Regression Test
 * ------------------------------------------------
 * Run with:  node Testing/03_Navbar_Masjid_Selection/visual_test.js
 *
 * Requires the Playwright Node SDK to be installed in this project root:
 *   npm i -D playwright
 *   npx playwright install chromium
 *
 * The script drives a real Chromium browser at 5 viewport widths,
 * captures both full-page and cropped navbar (top 100px) screenshots
 * in logged-out and logged-in states, and exercises the mobile
 * hamburger menu.
 *
 * Screenshots are written to:
 *   Testing/03_Navbar_Masjid_Selection/screenshots/
 */

const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const FRONTEND = 'http://localhost:5173'
const LOGIN_URL = `${FRONTEND}/login`
// Use the community user — the public /login form posts with expectedRole='community'
// and rejects other roles, so we use user@emasjid.pk for the logged-in sweep.
const LOGIN_EMAIL = 'user@emasjid.pk'
const LOGIN_PASSWORD = 'user1234'

const SCREENSHOT_DIR = path.resolve(
  __dirname,
  'screenshots'
)
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

const VIEWPORTS = [
  { name: 'mobile-425', width: 425, height: 900 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-900', width: 900, height: 1024 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
]

async function captureAtViewport(page, vp, state) {
  await page.setViewportSize({ width: vp.width, height: vp.height })
  await page.waitForLoadState('networkidle')
  // tiny settle delay for any css transitions / fonts
  await page.waitForTimeout(400)

  const baseName = `${vp.name}-${state}`

  // 1) Full page
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${baseName}.png`),
    fullPage: true,
  })

  // 2) Cropped navbar (top 100px)
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${baseName}-navbar.png`),
    clip: { x: 0, y: 0, width: vp.width, height: 100 },
  })

  // 3) A second navbar crop showing hover/active state isn't needed; just
  //    record any element overflow detected for diagnostics
  const headerOverflow = await page.evaluate(() => {
    const header = document.querySelector('header')
    if (!header) return { error: 'no header' }
    const r = header.getBoundingClientRect()
    const docW = document.documentElement.clientWidth
    return {
      headerRight: r.right,
      docWidth: docW,
      overflows: r.right > docW,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }
  })

  // 4) Check for any horizontally-overflowing elements
  const overflowing = await page.evaluate(() => {
    const out = []
    document.querySelectorAll('header, header *').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.right > window.innerWidth + 0.5) {
        out.push({
          tag: el.tagName,
          cls: el.className && el.className.toString().slice(0, 120),
          text:
            (el.innerText || el.value || el.getAttribute('aria-label') || '')
              .toString()
              .slice(0, 60)
              .replace(/\s+/g, ' '),
          right: r.right,
          width: r.width,
        })
      }
    })
    return out
  })

  return { baseName, headerOverflow, overflowing }
}

async function login(page) {
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle' })
  await page.waitForSelector('input[type="email"], input[name="email"]', {
    timeout: 10000,
  })
  await page.fill('input[type="email"], input[name="email"]', LOGIN_EMAIL)
  await page.fill('input[type="password"], input[name="password"]', LOGIN_PASSWORD)
  // submit
  const submit = await page.$('button[type="submit"]')
  if (submit) {
    await submit.click()
  } else {
    await page.keyboard.press('Enter')
  }
  // wait until we leave /login (community user → /)
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), {
    timeout: 15000,
  })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(600)
}

async function logout(page) {
  // try to find a logout button in the header
  const btn = await page.$('header button:has-text("Logout")')
  if (btn) {
    await btn.click()
    await page.waitForLoadState('networkidle')
  }
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const findings = []
  let seq = 1

  try {
    // ---- LOGGED OUT sweep ----
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      })
      const page = await context.newPage()

      await page.goto(FRONTEND, { waitUntil: 'networkidle' })
      const result = await captureAtViewport(page, vp, 'loggedout')

      // Mobile hamburger open at 425px only
      if (vp.name === 'mobile-425') {
        const toggle = await page.$('button[aria-label="Toggle menu"]')
        if (toggle) {
          await toggle.click()
          await page.waitForTimeout(500)
          await page.screenshot({
            path: path.join(
              SCREENSHOT_DIR,
              `${vp.name}-hamburger-open.png`
            ),
            fullPage: false,
          })
          await page.screenshot({
            path: path.join(
              SCREENSHOT_DIR,
              `${vp.name}-hamburger-open-fullpage.png`
            ),
            fullPage: true,
          })
          // close it again
          await toggle.click()
          await page.waitForTimeout(200)
        }
      }

      findings.push({
        seq: seq++,
        viewport: vp.name,
        state: 'loggedout',
        ...result,
      })

      await context.close()
    }

    // ---- LOGGED IN sweep ----
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      })
      const page = await context.newPage()
      await login(page)
      await page.goto(FRONTEND, { waitUntil: 'networkidle' })
      const result = await captureAtViewport(page, vp, 'loggedin')
      findings.push({
        seq: seq++,
        viewport: vp.name,
        state: 'loggedin',
        ...result,
      })
      await context.close()
    }

    // ---- Write findings JSON ----
    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, '..', 'visual_test_findings.json'),
      JSON.stringify(findings, null, 2)
    )

    // ---- Console summary ----
    console.log('\n=== Visual test complete ===')
    console.log(`Screenshots written to: ${SCREENSHOT_DIR}`)
    console.log('Findings:')
    for (const f of findings) {
      const flag = f.headerOverflow.overflows ? '[OVERFLOW]' : '[ok]'
      console.log(
        `  ${flag} ${String(f.seq).padStart(2, '0')} ${f.viewport} ${f.state} -> ${f.baseName}.png / -navbar.png  (overflowing els: ${f.overflowing.length})`
      )
      if (f.overflowing.length) {
        for (const o of f.overflowing.slice(0, 5)) {
          console.log(
            `        - <${o.tag}> "${o.text}" right=${o.right.toFixed(1)} width=${o.width.toFixed(1)}`
          )
        }
      }
    }
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
