const { chromium, request: pwRequest } = require('playwright');

const E2E_HOST = '127.0.0.1';
const BASE_URL = `http://${E2E_HOST}:5174`;
const API_URL = `http://${E2E_HOST}:5000/api`;
const SCREENSHOT_DIR = 'Testing/04.5_Marketing_Content_Management/screenshots';

const OUTCOMES = [];
function record(section, label, status, detail = '') {
  const code = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : 'ℹ';
  console.log(`  [${status}] ${section} ${label}${detail ? ' — ' + detail : ''}`);
  OUTCOMES.push({ section, label, status, detail });
}

async function apiJson(api, method, path, token, data = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const opts = { method, headers };
  if (data !== null && data !== undefined) opts.data = JSON.stringify(data);
  const r = await api.fetch(`${API_URL}${path}`, opts);
  let body = {};
  try { body = await r.json(); } catch (_) {}
  return { status: r.status(), body };
}

async function pickMasjid(page, name) {
  await page.evaluate(() => localStorage.removeItem('activeMosqueId'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const sel = page.locator('button[title*="Masjid"]').first();
  await sel.waitFor({ state: 'visible', timeout: 10000 });
  await sel.click();
  const modal = page.locator('text=Select Your Home Mosque');
  await modal.waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(1200);
  const opt = page.locator(`button:has(p.font-semibold:text-is("${name}"))`).first();
  await opt.waitFor({ state: 'visible', timeout: 10000 });
  await opt.click();
  const confirmBtn = page.locator('button:has-text("Confirm Selection")').first();
  await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });
  await confirmBtn.click();
  await page.waitForTimeout(2500);
  const logo = await page.locator('span[title]').first().getAttribute('title');
  return { logoName: logo || '' };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const api = await pwRequest.newContext();

  console.log('\n=== Phase 4.5 Marketing — Post-Feedback Fixes ===\n');

  // ── Section 1: Hero Slide link is clickable ─────────────────────────────────
  console.log('Section 1: Hero Slide "Link URL" — image becomes clickable when link is set');
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const page = await ctx.newPage();

    const login = await apiJson(api, 'POST', '/auth/login', null, { email: 'admin@emasjid.pk', password: 'admin123' });
    const tok = login.body.token;

    // Get a hero slide, set its link to '/donate'
    const slides = await apiJson(api, 'GET', '/admin/marketing/hero-slides', tok);
    const firstSlide = slides.body.data[0];
    const upd = await apiJson(api, 'PUT', `/admin/marketing/hero-slides/${firstSlide._id}`, tok, {
      image: firstSlide.image,
      caption: firstSlide.caption,
      link: '/donate',
      isActive: true,
      order: firstSlide.order ?? 0,
    });

    await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const pick = await pickMasjid(page, 'Masjid Al-Noor');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/postfix-1-hero-with-link.png`, fullPage: false });

    // Look for an anchor wrapping the hero image with href="/donate"
    const anchorHrefs = await page.locator('section img[alt]').first().evaluate(() => {
      const section = document.querySelector('section')
      if (!section) return []
      const imgs = section.querySelectorAll('a img')
      return Array.from(imgs).map(a => a.closest('a').getAttribute('href')).filter(Boolean)
    })

    // The carousel image at index 0 has the link
    const heroSection = page.locator('section').filter({ has: page.locator('h2:has-text("Moments from Our Community")') }).first()
    await heroSection.scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    const anchorInHero = await heroSection.locator('a[href="/donate"]').count()

    if (upd.status === 200 && anchorInHero > 0) {
      record('1', 'Hero slide image wraps in <a> when link is set', 'PASS', `update=200 anchorCount=${anchorInHero}`);
    } else {
      record('1', 'Hero slide image wraps in <a> when link is set', 'FAIL', `update=${upd.status} anchorCount=${anchorInHero}`);
    }

    // Cleanup — remove link
    await apiJson(api, 'PUT', `/admin/marketing/hero-slides/${firstSlide._id}`, tok, {
      image: firstSlide.image,
      caption: firstSlide.caption,
      link: '',
      isActive: true,
      order: firstSlide.order ?? 0,
    });
    await ctx.close();
  }

  // ── Section 2: Testimonials slider — 4 testimonials, only 3 visible at once, can scroll
  console.log('\nSection 2: Testimonials slider — extra testimonials browsable');
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const page = await ctx.newPage();
    const tok = (await apiJson(api, 'POST', '/auth/login', null, { email: 'admin@emasjid.pk', password: 'admin123' })).body.token;

    const before = await apiJson(api, 'GET', '/admin/marketing/testimonials', tok);
    const beforeCount = (before.body.data || []).length;

    // Make sure we have at least 4 testimonials so we can prove the slider works
    const created = [];
    for (let i = beforeCount; i < 4; i++) {
      const res = await apiJson(api, 'POST', '/admin/marketing/testimonials', tok, {
        name: `Slider Testimonial ${i + 1}`,
        role: 'Test role',
        quote: `Quote ${i + 1} — verifying the slider scrolls past the first 3.`,
        photo: '/assets/images/testimonials/testimonial-1.jpg',
        order: i,
        isActive: true,
      });
      if (res.status === 201) created.push(res.body.data);
    }

    await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const pick = await pickMasjid(page, 'Masjid Al-Noor');
    await page.waitForTimeout(2000);
    await page.locator('section').filter({ has: page.locator('h2:has-text("What Our Community Says")') }).first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/postfix-2-testimonials-slider.png`, fullPage: false });

    const testSection = page.locator('section').filter({ has: page.locator('h2:has-text("What Our Community Says")') }).first();
    const firstPageFigures = await testSection.locator('figure').count();

    // Click next-arrow
    const nextBtn = testSection.locator('button[aria-label="Next testimonials"]').first();
    const hasNext = await nextBtn.count() > 0;
    const dotCount = await testSection.locator('button[aria-label^="Go to testimonials page"]').count();

    // Capture which testimonial names are on page 1
    const page1Names = await testSection.locator('figcaption p.font-bold').allTextContents();

    if (hasNext) await nextBtn.click();
    await page.waitForTimeout(1200);

    // Capture page 2 names
    const page2Names = await testSection.locator('figcaption p.font-bold').allTextContents();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/postfix-2-testimonials-slider-after-next.png`, fullPage: false });

    const pageChanged = JSON.stringify(page1Names) !== JSON.stringify(page2Names);

    if (firstPageFigures >= 1 && firstPageFigures <= 3 && hasNext && dotCount >= 2 && pageChanged) {
      record('2', 'Testimonials slider scrolls past the first 3', 'PASS', `firstPage=${firstPageFigures} hasNext=${hasNext} dots=${dotCount} pageChanged=${pageChanged}`);
    } else {
      record('2', 'Testimonials slider scrolls past the first 3', 'FAIL', `firstPage=${firstPageFigures} hasNext=${hasNext} dots=${dotCount} pageChanged=${pageChanged} page1=${JSON.stringify(page1Names)} page2=${JSON.stringify(page2Names)}`);
    }

    // Cleanup created testimonials
    for (const t of created) {
      await apiJson(api, 'DELETE', `/admin/marketing/testimonials/${t._id}`, tok);
    }
    await ctx.close();
  }

  // ── Section 3: Other Campaigns grid — non-featured active campaigns visible
  console.log('\nSection 3: Other Active Campaigns grid — non-featured isActive campaigns appear');
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const page = await ctx.newPage();
    const tok = (await apiJson(api, 'POST', '/auth/login', null, { email: 'admin@emasjid.pk', password: 'admin123' })).body.token;

    // Ensure "Buy new speaker" is not featured (so it shows in "Other Campaigns")
    const camps = await apiJson(api, 'GET', '/admin/marketing/campaigns', tok);
    const speaker = camps.body.data.find((c) => c.title === 'Buy new speaker');
    let restoredFeaturedId = null;
    if (speaker) {
      if (speaker.isFeatured) {
        // Temporarily unfeature it (so Minaret stays the only featured)
        await apiJson(api, 'PUT', `/admin/marketing/campaigns/${speaker._id}`, tok, {
          title: speaker.title,
          subtitle: speaker.subtitle || '',
          targetAmount: speaker.targetAmount,
          raisedAmount: speaker.raisedAmount,
          daysLeft: speaker.daysLeft,
          isActive: true,
          isFeatured: false,
          order: speaker.order ?? 0,
        });
      }
    }

    await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await pickMasjid(page, 'Masjid Al-Noor');
    await page.waitForTimeout(2500);

    const otherSection = page.locator('section').filter({ has: page.locator('h2:has-text("Other Active Campaigns")') }).first();
    const otherSectionExists = await otherSection.count() > 0;

    let gridHasSpeaker = false;
    if (otherSectionExists) {
      await otherSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      gridHasSpeaker = await otherSection.locator('h3:has-text("Buy new speaker")').count() > 0;
      await page.screenshot({ path: `${SCREENSHOT_DIR}/postfix-3-other-campaigns.png`, fullPage: false });
    }

    // The Featured section should show Minaret
    const featuredSection = page.locator('section').filter({ has: page.locator('h2:has-text("Buy new speaker")'), has: page.locator('text=Help Us Build a New Minaret') }).first();
    const featuredShowsMinaret = (await page.content()).includes('Help Us Build a New Minaret');

    if (otherSectionExists && gridHasSpeaker) {
      record('3', 'Other Active Campaigns grid shows non-featured campaigns', 'PASS', `gridHasSpeaker=${gridHasSpeaker} featuredStillShowsMinaret=${featuredShowsMinaret}`);
    } else {
      record('3', 'Other Active Campaigns grid shows non-featured campaigns', 'FAIL', `gridExists=${otherSectionExists} gridHasSpeaker=${gridHasSpeaker}`);
    }
    await ctx.close();
  }

  // ── Section 4: donorCount removed — no field in admin form, no field in API
  console.log('\nSection 4: donorCount field removed from Campaign model + admin form');
  {
    const tok = (await apiJson(api, 'POST', '/auth/login', null, { email: 'admin@emasjid.pk', password: 'admin123' })).body.token;
    const camps = await apiJson(api, 'GET', '/admin/marketing/campaigns', tok);
    const hasDonorCountInResponse = camps.body.data.some((c) => c.donorCount !== undefined);

    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE_URL + '/admin/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.locator('input[type="email"]').first().fill('admin@emasjid.pk');
    await page.locator('input[type="password"]').first().fill('admin123');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(1500);
    await page.goto(BASE_URL + '/admin/marketing', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.locator('button:has-text("New Campaign")').first().click();
    await page.waitForTimeout(800);
    const formHasDonorCount = await page.locator('text=Donor Count').count();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/postfix-4-no-donor-count-form.png`, fullPage: false });

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    if (!hasDonorCountInResponse && formHasDonorCount === 0) {
      record('4', 'donorCount removed from API response + admin form', 'PASS', `apiReturnsField=${hasDonorCountInResponse} formHasField=${formHasDonorCount}`);
    } else {
      record('4', 'donorCount removed from API response + admin form', 'FAIL', `apiReturnsField=${hasDonorCountInResponse} formHasField=${formHasDonorCount}`);
    }
    await ctx.close();
  }

  // ── Section 5: Re-verify original 5/5 still PASS
  console.log('\nSection 5: Original 5/5 still passes after the post-feedback fixes');
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const pick = await pickMasjid(page, 'Masjid Al-Noor');
    await page.waitForTimeout(2000);

    const html = await page.content();
    const hasMinaret = html.includes('Help Us Build a New Minaret');
    const hasVoices = html.includes('What Our Community Says');
    const hasMoments = html.includes('Moments from Our Community');
    const hasAyesha = html.includes('Ayesha Malik');

    if (hasMinaret && hasVoices && hasMoments && hasAyesha && pick.logoName.includes('Al-Noor')) {
      record('5', 'Original 5 sections still PASS after post-feedback fixes', 'PASS', `minaret=${hasMinaret} voices=${hasVoices} moments=${hasMoments} ayesha=${hasAyesha}`);
    } else {
      record('5', 'Original 5 sections still PASS after post-feedback fixes', 'FAIL', `minaret=${hasMinaret} voices=${hasVoices} moments=${hasMoments} ayesha=${hasAyesha}`);
    }
    await ctx.close();
  }

  await browser.close();
  await api.dispose();

  console.log('\n=== Post-Feedback Summary ===');
  const tally = OUTCOMES.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc }, {});
  console.log(JSON.stringify(tally));
  console.log('Total:', OUTCOMES.length);
})().catch((err) => {
  console.error('Post-feedback test failed:', err);
  process.exit(1);
});