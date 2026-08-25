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
  if (r.status !== 200) throw new Error(`Login failed for ${email}: ${r.status}`);
  return r.body.token;
}

function dataOf(r) {
  return r.body && r.body.data;
}

(async () => {
  console.log('\n===== BUG-PHASE4.5-008 scope-leak probe =====\n');

  const t1 = await login('admin@emasjid.pk', 'admin123');
  const t2 = await login('admin2@emasjid.pk', 'admin123');
  console.log('  ✓ logged in admin@emasjid.pk (Al-Noor) and admin2@emasjid.pk (Al-Rahman)');

  const stamp = Date.now();
  const probeTitle = `PHASE45 LEAK PROBE ${stamp}`;

  for (const kind of ['campaigns', 'testimonials', 'hero-slides']) {
    console.log(`\n--- ${kind} ---`);
    const payload = (() => {
      if (kind === 'campaigns') return { title: probeTitle, description: 'probe', targetAmount: 1000, category: 'General', isFeatured: false, order: 99 };
      if (kind === 'testimonials') return { name: probeTitle, role: 'probe-role', message: 'probe-msg', order: 99, isActive: true };
      return { caption: probeTitle, image: '/uploads/probe.jpg', order: 99, isActive: true };
    })();
    const create = await request('POST', `/api/admin/marketing/${kind}`, payload, t1);
    const id = dataOf(create) && dataOf(create)._id;
    console.log(`  create as Al-Noor: status=${create.status} id=${id}`);

    if (!id) {
      console.log('  create failed, body=', JSON.stringify(create.body));
      continue;
    }

    const list2 = await request('GET', `/api/admin/marketing/${kind}`, null, t2);
    const data2 = dataOf(list2) || [];
    const seen = data2.find((x) =>
      (x.title === probeTitle) || (x.name === probeTitle) || (x.caption === probeTitle)
    );
    console.log(`  Al-Rahman admin LIST count=${data2.length}  sees-probe=${!!seen}`);

    const upd = await request('PUT', `/api/admin/marketing/${kind}/${id}`,
      { title: probeTitle + ' HACKED', name: probeTitle + ' HACKED', caption: probeTitle + ' HACKED' },
      t2);
    console.log(`  Al-Rahman admin UPDATE: status=${upd.status}`);

    const del = await request('DELETE', `/api/admin/marketing/${kind}/${id}`, null, t2);
    console.log(`  Al-Rahman admin DELETE: status=${del.status}`);
  }

  console.log('\n--- /api/marketing/campaigns (PUBLIC, no token) ---');
  const pub = await request('GET', '/api/marketing/campaigns', null, null);
  console.log(`  status=${pub.status} body-keys=${pub.body ? Object.keys(pub.body) : '?'}`);

  console.log('\n===== done =====\n');
  process.exit(0);
})().catch((e) => {
  console.error('verify_phase45_scope_leak failed:', e);
  process.exit(1);
});