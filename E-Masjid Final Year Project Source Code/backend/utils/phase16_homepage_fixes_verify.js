require('dotenv').config();
const http = require('http');

const BASE = 'http://localhost:5000';

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers.Authorization = `Bearer ${token}`;
    const r = http.request(opts, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: buf ? JSON.parse(buf) : null });
        } catch (e) {
          resolve({ status: res.statusCode, body: buf });
        }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${name}${detail ? ' — ' + detail : ''}`);
}

(async () => {
  console.log('\n=== Phase 16 home page fixes — live API verification ===\n');

  const login = await req('POST', '/api/auth/login', {
    email: 'manager@emasjid.pk',
    password: 'manager123',
  });
  check('1. Manager login succeeds', login.status === 200 && login.body?.success, `status=${login.status}`);
  const token = login.body?.token || login.body?.data?.token;
  if (!token) {
    console.log('\nAborting — no token.');
    process.exit(1);
  }

  const mos = await req('GET', '/api/mosques', null, token);
  check('2. GET /api/mosques returns list', mos.status === 200 && Array.isArray(mos.body?.data), `count=${mos.body?.data?.length}`);
  const all = mos.body?.data || [];
  if (all.length === 0) {
    console.log('No masjids.');
    process.exit(1);
  }

  const noor = all.find((m) => m.name === 'Masjid Al-Noor');
  const rahman = all.find((m) => m.name === 'Masjid Al-Rahman');
  const falah = all.find((m) => m.name === 'Masjid Al-Falah');
  const taqwa = all.find((m) => m.name === 'Masjid Al-Taqwa');
  const dera = all.find((m) => m.name === 'Dera Bhattia Masjids');

  const withIds = [noor, rahman, falah, taqwa, dera].filter(Boolean);
  console.log(`  found ${withIds.length} expected masjid(s): ${withIds.map((m) => m.name).join(', ')}`);

  console.log('\n--- BUG-HOME-STATS-001: per-masjid stats ---');
  const statsByMosque = {};
  for (const m of withIds) {
    const r = await req('GET', `/api/marketing/stats?mosqueId=${m._id}`, null, token);
    statsByMosque[m.name] = r.body?.data;
    check(
      `   stats for ${m.name} returns scoped values`,
      r.status === 200 && r.body?.success && typeof r.body?.data?.yearsServing === 'number',
      `years=${r.body?.data?.yearsServing}, donations=${r.body?.data?.totalDonationsPKR}`
    );
  }
  const yearsNoor = statsByMosque['Masjid Al-Noor']?.yearsServing;
  const yearsRahman = statsByMosque['Masjid Al-Rahman']?.yearsServing;
  const yearsDera = statsByMosque['Dera Bhattia Masjids']?.yearsServing;
  check(
      '3. yearsServing differs across masjids (Al-Noor vs Al-Rahman vs Dera)',
      yearsNoor !== yearsRahman || yearsNoor !== yearsDera || yearsRahman !== yearsDera,
      `noor=${yearsNoor}, rahman=${yearsRahman}, dera=${yearsDera}`
  );

  console.log('\n--- BUG-HOME-IMPACT-001: per-masjid impact ---');
  const impactByMosque = {};
  for (const m of withIds) {
    const r = await req('GET', `/api/marketing/impact?mosqueId=${m._id}`, null, token);
    impactByMosque[m.name] = r.body?.data;
    check(
      `   impact for ${m.name} returns scoped values`,
      r.status === 200 && r.body?.success && typeof r.body?.data?.prayersTracked === 'number',
      `prayers=${r.body?.data?.prayersTracked}, nikah=${r.body?.data?.nikahHosted}`
    );
  }
  const impactNoor = JSON.stringify(impactByMosque['Masjid Al-Noor']);
  const impactRahman = JSON.stringify(impactByMosque['Masjid Al-Rahman']);
  const impactDera = JSON.stringify(impactByMosque['Dera Bhattia Masjids']);
  check(
    '4. impact differs across masjids (Al-Noor vs Al-Rahman vs Dera)',
    impactNoor !== impactRahman || impactNoor !== impactDera || impactRahman !== impactDera,
    `noor=${impactNoor}, rahman=${impactRahman}, dera=${impactDera}`
  );

  console.log('\n--- BUG-HOME-SLIDES-001: hero slides per masjid ---');
  for (const m of withIds) {
    const r = await req('GET', `/api/marketing/hero-slides?mosqueId=${m._id}`, null, token);
    const slides = r.body?.data || [];
    check(
      `   ${m.name} has 6 hero slides`,
      r.status === 200 && slides.length === 6,
      `count=${slides.length}`
    );
  }

  console.log('\n--- BUG-MOSQUE-IMAGE-001: image field fully removed ---');
  const probeName = `__probe_img_${Date.now()}`;
  const create = await req(
    'POST',
    '/api/mosques',
    {
      name: probeName,
      city: 'Sheikhupura',
      address: 'Probe Lane',
      phone: '0000000000',
      email: 'probe@emasjid.pk',
      image: 'https://should-be-ignored.example.com/foo.png',
    },
    token
  );
  check(
    '5. POST /api/mosques — image field ignored, mosque created',
    create.status === 201 && create.body?.success && create.body?.data?._id && !('image' in (create.body?.data || {})),
    `image in response=${'image' in (create.body?.data || {}) ? 'YES (bug!)' : 'no'}`
  );

  const createdId = create.body?.data?._id;
  if (createdId) {
    const got = await req('GET', `/api/mosques/${createdId}`, null, token);
    check(
      '6. GET /api/mosques/:id — no image field in stored doc',
      got.status === 200 && !('image' in (got.body?.data || {})),
      `image in doc=${'image' in (got.body?.data || {}) ? 'YES (bug!)' : 'no'}`
    );

    const upd = await req(
      'PUT',
      `/api/mosques/${createdId}`,
      { image: 'https://should-also-be-ignored.example.com/bar.png' },
      token
    );
    check(
      '7. PUT /api/mosques/:id — image update ignored',
      upd.status === 200 && !('image' in (upd.body?.data || {})),
      `image in response=${'image' in (upd.body?.data || {}) ? 'YES (bug!)' : 'no'}`
    );

    const got2 = await req('GET', `/api/mosques/${createdId}`, null, token);
    check(
      '8. GET /api/mosques/:id after PUT — still no image field',
      got2.status === 200 && !('image' in (got2.body?.data || {})),
      `image in doc=${'image' in (got2.body?.data || {}) ? 'YES (bug!)' : 'no'}`
    );

    const del = await req('DELETE', `/api/mosques/${createdId}`, null, token);
    check('   cleanup — delete probe masjid', del.status === 200);
  }

  const finalNoImage = await req('GET', `/api/mosques/${noor._id}`, null, token);
  check(
    '9. Existing masjid (Al-Noor) — no image field in stored doc',
    finalNoImage.status === 200 && !('image' in (finalNoImage.body?.data || {})),
    `image in doc=${'image' in (finalNoImage.body?.data || {}) ? 'YES (bug!)' : 'no'}`
  );

  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`\n=== RESULT: ${passed}/${total} checks passed ===\n`);
  process.exit(passed === total ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});