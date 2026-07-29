// Diagnose why the Services/More dropdown items are invisible
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots', 'diag');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  // Click Services
  await page.locator('button:has-text("Services")').first().click();
  await page.waitForTimeout(800);

  // Take a tall screenshot
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'services-open-tall.png'), fullPage: false });

  // Inspect ALL elements that look like the dropdown
  const info = await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div'));
    const candidates = allDivs.filter(d => {
      const txt = d.textContent || '';
      return /Nikah Booking|My Bookings|Transparency/.test(txt) && d.children.length < 10;
    });
    return candidates.slice(0, 5).map(d => {
      const r = d.getBoundingClientRect();
      const cs = getComputedStyle(d);
      return {
        tag: d.tagName,
        class: d.className.slice(0, 120),
        text: d.textContent.slice(0, 80),
        rect: { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom },
        zIndex: cs.zIndex,
        position: cs.position,
        display: cs.display,
        visibility: cs.visibility,
        opacity: cs.opacity,
        overflow: cs.overflow,
      };
    });
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
