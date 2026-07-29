// Verify the logo doesn't get cut off when masjid name is long or user is logged in
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots', 'logo-fix');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const findings = [];

  // ── Logged out, normal name ──
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-loggedout.png') });
  const headerEndLoggedOut = await page.evaluate(() => {
    const h = document.querySelector('header');
    return h ? h.getBoundingClientRect().right : null;
  });
  findings.push({ test: 'Logged out, header right edge ≤ 1440px', result: headerEndLoggedOut <= 1440 ? 'PASS' : 'FAIL', detail: `header.right = ${headerEndLoggedOut}` });

  // ── Logged in as a user with a very long name ──
  // Register a new user with a long name via API
  const longName = 'Muhammad Abdullah Khan Farooqi';
  const email = `test-${Date.now()}@example.com`;
  const regRes = await page.request.post('http://localhost:5000/api/auth/register', {
    data: { name: longName, email, password: 'Test1234', phone: '03001234567' },
  });
  const regJson = await regRes.json();
  const token = regJson.token;

  // Login through UI to populate auth state
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('#email', email);
  await page.fill('#password', 'Test1234');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(url => !url.pathname.includes('login'), { timeout: 10000 });
  await page.waitForTimeout(800);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-loggedin-longname.png') });

  // Check that the user name span is truncated (not pushing the layout)
  const userNameMetrics = await page.evaluate(() => {
    // Find span with the user name pattern (hidden xl:inline)
    const spans = Array.from(document.querySelectorAll('header span'));
    const userSpan = spans.find(s => s.title && s.title.length > 5 && s.classList.contains('xl:inline'));
    if (!userSpan) return null;
    const r = userSpan.getBoundingClientRect();
    return { text: userSpan.textContent, width: r.width, right: r.right, parent: userSpan.parentElement.className.slice(0, 60) };
  });
  findings.push({
    test: 'Logged in, user name span is truncated (no overflow)',
    result: userNameMetrics && userNameMetrics.width <= 200 ? 'PASS' : 'FAIL',
    detail: userNameMetrics ? `name "${userNameMetrics.text}" → width ${userNameMetrics.width}px, right ${userNameMetrics.right}px` : 'user name span not found',
  });

  // Verify the header is not overflowing the viewport
  const headerEndLoggedIn = await page.evaluate(() => {
    const h = document.querySelector('header');
    return h ? h.getBoundingClientRect().right : null;
  });
  findings.push({
    test: 'Logged in, header right edge ≤ 1440px',
    result: headerEndLoggedIn <= 1440 ? 'PASS' : 'FAIL',
    detail: `header.right = ${headerEndLoggedIn}`,
  });

  // Check the logo itself isn't pushed off
  const logoMetrics = await page.evaluate(() => {
    const logo = document.querySelector('header a[href="/"]');
    if (!logo) return null;
    const r = logo.getBoundingClientRect();
    return { right: r.right, x: r.x, width: r.width };
  });
  findings.push({
    test: 'Logo (left side) is fully visible',
    result: logoMetrics && logoMetrics.right < 1400 && logoMetrics.x >= 0 ? 'PASS' : 'FAIL',
    detail: `logo.x = ${logoMetrics?.x}, right = ${logoMetrics?.right}, width = ${logoMetrics?.width}`,
  });

  console.log('\n=== Logo fix verification ===');
  for (const f of findings) console.log(`  [${f.result}] ${f.test} — ${f.detail}`);
  const allPass = findings.every(f => f.result === 'PASS');
  console.log(`\n${allPass ? '✅ ALL LOGO FIXES VERIFIED' : '❌ SOME FAILED'}`);

  await browser.close();
  process.exit(allPass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
