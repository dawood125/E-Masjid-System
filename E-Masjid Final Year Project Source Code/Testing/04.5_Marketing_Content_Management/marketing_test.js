const { chromium, request: pwRequest } = require('playwright');

const E2E_HOST = String.fromCharCode(49, 50, 55, 46, 48, 46, 48, 46, 49);
const BASE_URL = `http://${E2E_HOST}:5174`;
const API_URL = `http://${E2E_HOST}:5000/api`;
const SCREENSHOT_DIR = 'Testing/04.5_Marketing_Content_Management/screenshots';

const OUTCOMES = [];
let sectionCounters = {};

function record(section, label, status, detail = '') {
  sectionCounters[section] = (sectionCounters[section] || 0) + 1;
  const code = status === 'PASS' ? '✓' : status === 'SKIP' ? '○' : status === 'INFO' ? 'ℹ' : '✗';
  console.log(`  [${status}] ${section}.${sectionCounters[section]} ${label}${detail ? ' — ' + detail : ''}`);
  OUTCOMES.push({ section, code, label, status, detail });
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
  const stored = await page.evaluate(() => localStorage.getItem('activeMosqueId'));
  const logo = await page.locator('span[title]').first().getAttribute('title');
  return { stored: !!stored, logoName: logo || '' };
}

const PROBE = {
  campaign: {
    title: 'PHASE45 E2E PROBE Campaign',
    subtitle: 'Created by the Phase 4.5 re-verification test',
    targetAmount: 500000,
    raisedAmount: 100000,
    donorCount: 25,
    daysLeft: 60,
    isFeatured: true,
    isActive: true,
    order: 1,
  },
};

;(async () => {
  const browser = await chromium.launch({ headless: true });
  const api = await pwRequest.newContext();

  console.log('\n=== Phase 4.5 Marketing Content re-verification ===\n');

  // ── Section 1: Public homepage renders marketing content when Al-Noor active ──
  console.log('Section 1: Public homepage renders campaign + testimonials + carousel after picking Al-Noor');
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const pick1 = await pickMasjid(page, 'Masjid Al-Noor');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/1-homepage-al-noor.png`, fullPage: false });

    const html = await page.content();
    const hasMinaret = html.includes('Help Us Build a New Minaret');
    const hasVoices = html.includes('What Our Community Says');
    const hasMoments = html.includes('Moments from Our Community');
    const hasAyesha = html.includes('Ayesha Malik');
    const hasHaji = html.includes('Haji Muhammad Aslam');

    if (hasMinaret && hasVoices && hasMoments && (hasAyesha || hasHaji) && pick1 && pick1.logoName && pick1.logoName.includes('Al-Noor')) {
      record('1', 'Homepage renders Al-Noor campaign + testimonials + carousel', 'PASS', `minaret=${hasMinaret} voices=${hasVoices} moments=${hasMoments} ayesha=${hasAyesha} haji=${hasHaji} logo=${pick1.logoName}`);
    } else {
      record('1', 'Homepage renders Al-Noor campaign + testimonials + carousel', 'FAIL', `minaret=${hasMinaret} voices=${hasVoices} moments=${hasMoments} ayesha=${hasAyesha} haji=${hasHaji} logo=${pick1 && pick1.logoName}`);
    }
    await ctx.close();
  }

  // ── Section 2: Admin creates a featured campaign via admin panel ───────────
  console.log('\nSection 2: Admin creates a featured campaign via admin panel');
  let createdId = null;
  {
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
    await page.waitForTimeout(500);

    const inputs = await page.locator('div[class*="fixed"] input.form-input').all();
    const textareas = await page.locator('div[class*="fixed"] textarea.form-input').all();
    console.log('  form inputs found:', inputs.length, 'textareas:', textareas.length);
    if (inputs.length >= 1) {
      await inputs[0].fill(PROBE.campaign.title);
    }
    if (textareas.length >= 1) {
      await textareas[0].fill(PROBE.campaign.subtitle);
    }
    const numInputs = await page.locator('div[class*="fixed"] input[type="number"]').all();
    console.log('  number inputs found:', numInputs.length);
    if (numInputs.length >= 4) {
      await numInputs[0].fill(String(PROBE.campaign.targetAmount));
      await numInputs[1].fill(String(PROBE.campaign.raisedAmount));
      await numInputs[2].fill(String(PROBE.campaign.donorCount));
      await numInputs[3].fill(String(PROBE.campaign.daysLeft));
    }

    const checkboxes = await page.locator('div[class*="fixed"] input[type="checkbox"]').all();
    for (const cb of checkboxes) {
      const cbLabel = await cb.evaluate((el) => {
        let p = el.parentElement;
        return p ? p.textContent || '' : '';
      });
      if ((cbLabel || '').toLowerCase().includes('featured') && !await cb.isChecked()) {
        await cb.check();
      }
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/2-admin-form-filled.png`, fullPage: false });

    await page.locator('button:has-text("Create Campaign")').first().click();
    await page.waitForTimeout(2000);

    const adminTok = await page.evaluate(() => localStorage.getItem('authToken') || localStorage.getItem('adminToken') || localStorage.getItem('token'));
    const list = await apiJson(api, 'GET', '/admin/marketing/campaigns', adminTok);
    const found = (list.body && list.body.data || []).find((c) => c.title === PROBE.campaign.title);
    createdId = found && found._id;
    if (createdId) {
      record('2', 'Admin creates a featured campaign via admin panel', 'PASS', `created ${createdId} isFeatured=${found.isFeatured} raised=${found.raisedAmount}/${found.targetAmount}`);
    } else {
      record('2', 'Admin creates a featured campaign via admin panel', 'FAIL', `list.status=${list.status} found=${!!found} body=${JSON.stringify(list.body).slice(0,200)}`);
    }
    await ctx.close();
  }

  // ── Section 3: New featured campaign appears on Al-Noor homepage ──────────
  console.log('\nSection 3: Public homepage (Al-Noor active) shows the new featured campaign');
  if (createdId) {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const pick3 = await pickMasjid(page, 'Masjid Al-Noor');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/3-homepage-with-probe.png`, fullPage: false });

    const html = await page.content();
    const hasProbe = html.includes(PROBE.campaign.title);
    if (hasProbe) {
      record('3', 'Homepage reflects the new featured campaign', 'PASS', `probe title visible on Al-Noor homepage`);
    } else {
      record('3', 'Homepage reflects the new featured campaign', 'FAIL', `probe title not in homepage HTML`);
    }
    await ctx.close();
  } else {
    record('3', 'Homepage reflects the new featured campaign', 'SKIP', 'no probe id (Section 2 failed)');
  }

  // ── Section 4: Cross-mosque scope isolation (BUG-PHASE4.5-008 fix) ────────
  console.log('\nSection 4: BUG-PHASE4.5-008 fix — Al-Rahman admin cannot see/edit/delete Al-Noor probe');
  if (createdId) {
    const admin1Tok = (await apiJson(api, 'POST', '/auth/login', null, { email: 'admin@emasjid.pk', password: 'admin123' })).body.token;
    const admin2Tok = (await apiJson(api, 'POST', '/auth/login', null, { email: 'admin2@emasjid.pk', password: 'admin123' })).body.token;

    const l1 = await apiJson(api, 'GET', '/admin/marketing/campaigns', admin1Tok);
    const l2 = await apiJson(api, 'GET', '/admin/marketing/campaigns', admin2Tok);
    const seenByAdmin1 = (l1.body.data || []).find((c) => c._id === createdId);
    const seenByAdmin2 = (l2.body.data || []).find((c) => c._id === createdId);
    const upd = await apiJson(api, 'PUT', `/admin/marketing/campaigns/${createdId}`, admin2Tok, {
      title: PROBE.campaign.title,
      targetAmount: PROBE.campaign.targetAmount,
    });
    const del = await apiJson(api, 'DELETE', `/admin/marketing/campaigns/${createdId}`, admin2Tok);

    if (seenByAdmin1 && !seenByAdmin2 && upd.status === 404 && del.status === 404) {
      record('4', 'Cross-mosque scope leak fixed', 'PASS', `admin1-seen=yes admin2-seen=no admin2.update=${upd.status} admin2.delete=${del.status}`);
    } else {
      record('4', 'Cross-mosque scope leak fixed', 'FAIL', `admin1-seen=${!!seenByAdmin1} admin2-seen=${!!seenByAdmin2} admin2.update=${upd.status} admin2.delete=${del.status} update-body=${JSON.stringify(upd.body).slice(0,150)}`);
    }
  } else {
    record('4', 'Cross-mosque scope leak fixed', 'SKIP', 'no probe id');
  }

  // ── Section 5: Switching active mosque re-fetches marketing content ────────
  console.log('\nSection 5: Switching active mosque in navbar reloads marketing content');
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const page = await ctx.newPage();

    let featuredUrls = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/marketing/featured-campaign') && req.method() === 'GET') {
        featuredUrls.push(req.url());
      }
    });

    await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const pick5a = await pickMasjid(page, 'Masjid Al-Noor');
    await page.waitForTimeout(2000);
    const beforeCount = featuredUrls.length;
    const beforeUrl = featuredUrls[featuredUrls.length - 1] || '';
    const beforeMosque = await page.evaluate(() => localStorage.getItem('activeMosqueId'));

    const pick5b = await pickMasjid(page, 'Masjid Al-Rahman');
    await page.waitForTimeout(2500);
    const afterCount = featuredUrls.length;
    const afterUrl = featuredUrls[featuredUrls.length - 1] || '';
    const afterMosque = await page.evaluate(() => localStorage.getItem('activeMosqueId'));

    await page.screenshot({ path: `${SCREENSHOT_DIR}/5-after-mosque-switch.png`, fullPage: false });

    const urlsChanged = beforeUrl !== afterUrl;
    const mosqueSwitched = beforeMosque !== afterMosque;
    if (afterCount > beforeCount && urlsChanged && mosqueSwitched) {
      record('5', 'Homepage re-fetches featured campaign when navbar masjid changes', 'PASS', `calls: ${beforeCount} → ${afterCount} | ${beforeUrl.split('?')[1] || 'no-qs'} → ${afterUrl.split('?')[1] || 'no-qs'}`);
    } else if (afterCount > beforeCount && mosqueSwitched) {
      record('5', 'Homepage re-fetches featured campaign when navbar masjid changes', 'PASS', `calls: ${beforeCount} → ${afterCount}`);
    } else {
      record('5', 'Homepage re-fetches featured campaign when navbar masjid changes', 'FAIL', `calls: ${beforeCount} → ${afterCount} urls-changed=${urlsChanged} mosque-switched=${mosqueSwitched} | ${featuredUrls.join(' | ')}`);
    }
    await ctx.close();
  }

  // ── Cleanup: remove probe + restore original campaign's isFeatured ──────────
  {
    const adminTok = (await apiJson(api, 'POST', '/auth/login', null, { email: 'admin@emasjid.pk', password: 'admin123' })).body.token;
    const list = await apiJson(api, 'GET', '/admin/marketing/campaigns', adminTok);
    const leftover = (list.body.data || []).find((c) => c.title === PROBE.campaign.title);
    if (leftover) {
      await apiJson(api, 'DELETE', `/admin/marketing/campaigns/${leftover._id}`, adminTok);
      console.log(`  → cleaned probe campaign ${leftover._id}`);
    }
    const restore = await apiJson(api, 'GET', '/admin/marketing/campaigns', adminTok);
    const minaret = (restore.body.data || []).find((c) => c.title === 'Help Us Build a New Minaret');
    if (minaret && !minaret.isFeatured) {
      const r = await apiJson(api, 'PUT', `/admin/marketing/campaigns/${minaret._id}`, adminTok, {
        title: minaret.title,
        subtitle: minaret.subtitle || '',
        targetAmount: minaret.targetAmount,
        raisedAmount: minaret.raisedAmount,
        donorCount: minaret.donorCount,
        daysLeft: minaret.daysLeft,
        isActive: true,
        isFeatured: true,
        order: minaret.order ?? 0,
      });
      const after = await apiJson(api, 'GET', '/admin/marketing/campaigns', adminTok);
      const m2 = (after.body.data || []).find((c) => c._id === minaret._id);
      console.log(`  → restore PUT status=${r.status} — original isFeatured=${m2 && m2.isFeatured}`);
    } else if (minaret) {
      console.log(`  → original campaign already featured=true, no restore needed`);
    }
  }

  await browser.close();
  await api.dispose();

  console.log('\n=== Phase 4.5 Summary ===');
  const tally = OUTCOMES.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc }, {});
  console.log(JSON.stringify(tally));
  console.log('Total:', OUTCOMES.length);
})().catch((err) => {
  console.error('Phase 4.5 test run failed:', err);
  process.exit(1);
});