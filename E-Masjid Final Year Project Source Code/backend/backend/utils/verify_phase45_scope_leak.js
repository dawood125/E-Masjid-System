const http = require('http');

const HOST = '127.0.0.1';
const PORT = 5000;

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      host: HOST,
      port: PORT,
      method,
      path,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const req = http.request(opts, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(buf); } catch (_) { parsed = buf; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function login(email, password) {
  const r = await request('POST', '/api/auth/login', { email, password });
  if (r.status !== 200) {
    throw new Error(`Login failed for ${email}: ${r.status} ${JSON.stringify(r.body)}`);
  }
  return r.body.token;
}

(async () => {
  console.log('\n===== BUG-PHASE4.5-008 multi-tenant scope leak check =====\n');

  const admin1Tok = await login('admin@emasjid.pk', 'admin123');
  console.log('  Logged in as Al-Noor admin (admin@emasjid.pk)');
  const admin2Tok = await login('admin2@emasjid.pk', 'admin123');
  console.log('  Logged in as Al-Rahman admin (admin2@emasjid.pk)');

  console.log('\n--- Step 1: List campaigns as Al-Noor admin ---');
  const list1 = await request('GET', '/api/admin/marketing/campaigns', null, admin1Tok);
  console.log(`  status=${list1.status}  count=${Array.isArray(list1.body) ? list1.body.length : 'n/a'}`);
  if (Array.isArray(list1.body)) {
    list1.body.forEach((c) => console.log(`    - "${c.title}" isFeatured=${c.isFeatured} raised=${c.raisedAmount}/${c.targetAmount}`));
  }

  console.log('\n--- Step 2: Create campaign as Al-Noor admin (with Al-Noor mosqueId in payload) ---');
  const before = (Array.isArray(list1.body) ? list1.body.length : 0) + 1;
  const createBody = {
    title: 'PHASE4.5-LEAK-PROBE-A',
    description: 'created by Al-Noor admin to test cross-mosque scope leak',
    targetAmount: 1000,
    category: 'General',
    isFeatured: false,
    order: 99,
  };
  const created = await request('POST', '/api/admin/marketing/campaigns', createBody, admin1Tok);
  console.log(`  status=${created.status}  created._id=${created.body && created.body._id}`);
  const createdId = created.body && created.body._id;

  console.log('\n--- Step 3: List campaigns as Al-Rahman admin ---');
  const list2 = await request('GET', '/api/admin/marketing/campaigns', null, admin2Tok);
  console.log(`  status=${list2.status}  count=${Array.isArray(list2.body) ? list2.body.length : 'n/a'}`);
  if (Array.isArray(list2.body)) {
    list2.body.forEach((c) => console.log(`    - "${c.title}" isFeatured=${c.isFeatured} raised=${c.raisedAmount}/${c.targetAmount}`));
    const seen = list2.body.find((c) => c.title === createBody.title);
    console.log(`  Cross-mosque visibility (admin2 sees Al-Noor's probe)? ${seen ? 'YES — LEAK' : 'no'}`);
  }

  console.log('\n--- Step 4: Al-Rahman admin tries to UPDATE the Al-Noor campaign ---');
  if (createdId) {
    const upd = await request('PUT', `/api/admin/marketing/campaigns/${createdId}`, { isFeatured: true }, admin2Tok);
    console.log(`  PUT status=${upd.status}`);
    if (upd.status === 200) {
      console.log('  Cross-mosque EDIT (admin2 edited Al-Noor's campaign)? YES — LEAK');
    } else {
      console.log('  Cross-mosque EDIT blocked ✓');
    }
  }

  console.log('\n--- Step 5: Al-Rahman admin tries to DELETE the Al-Noor campaign ---');
  if (createdId) {
    const del = await request('DELETE', `/api/admin/marketing/campaigns/${createdId}`, null, admin2Tok);
    console.log(`  DELETE status=${del.status}`);
    if (del.status === 200) {
      console.log('  Cross-mosque DELETE (admin2 deleted Al-Noor's campaign)? YES — LEAK');
    } else {
      console.log('  Cross-mosque DELETE blocked ✓');
    }
  }

  console.log('\n--- Step 6: Same probes for testimonials + hero slides ---');
  for (const kind of ['testimonials', 'hero-slides']) {
    const create = await request('POST', `/api/admin/marketing/${kind}`, { name: 'PHASE4.5-LEAK-PROBE', order: 99, caption: 'probe' }, admin1Tok);
    const id = create.body && create.body._id;
    const list = await request('GET', `/api/admin/marketing/${kind}`, null, admin2Tok);
    const seen = Array.isArray(list.body) && list.body.find((x) => x.name === 'PHASE4.5-LEAK-PROBE' || x.caption === 'probe');
    console.log(`  ${kind}: create status=${create.status} id=${id} admin2-sees-it=${!!seen}`);
    if (id) {
      const del = await request('DELETE', `/api/admin/marketing/${kind}/${id}`, null, admin2Tok);
      console.log(`  ${kind}: admin2 DELETE probe status=${del.status}`);
    }
  }

  console.log('\n--- Step 7: Public endpoint visibility (no token) ---');
  const pub = await request('GET', '/api/marketing/campaigns', null, null);
  console.log(`  Public /api/marketing/campaigns: status=${pub.status} count=${Array.isArray(pub.body) ? pub.body.length : 'n/a'}`);
  console.log('  (public is meant to be global for the homepage; only the admin endpoints should be scoped)');

  console.log('\n===== end =====\n');
  process.exit(0);
})().catch((e) => {
  console.error('verify_phase45_scope_leak failed:', e);
  process.exit(1);
});
