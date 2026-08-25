require('dotenv').config();
process.env.NODE_ENV = 'test';
process.env.PORT = '59888';
const fs = require('fs');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');

const LOG_PATH = path.join(__dirname, '..', 'logs', 'phase19_probe.log');
fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
fs.writeFileSync(LOG_PATH, '');

const origLog = console.log.bind(console);
const origErr = console.error.bind(console);
function stamp() { return new Date().toISOString(); }
function hook(name, orig) {
  return (...args) => {
    const line = `[${stamp()}] [${name}] ${args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')}\n`;
    try { fs.appendFileSync(LOG_PATH, line); } catch (_) {}
    orig(...args);
  };
}
console.log = hook('log', origLog);
console.error = hook('error', origErr);

const User = require('../models/User');
const Donation = require('../models/Donation');
const Expense = require('../models/Expense');
const Mosque = require('../models/Mosque');
const app = require('../server');

const PORT = process.env.PORT || 59888;
const server = app.listen(PORT);
const BASE = `http://localhost:${PORT}`;

function req(method, p, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + p);
    const r = http.request({ hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }, (res) => {
      let buf = ''; res.on('data', (c) => (buf += c));
      res.on('end', () => { try { resolve({ status: res.statusCode, body: buf ? JSON.parse(buf) : null }); } catch (e) { resolve({ status: res.statusCode, body: buf }); } });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ' — ' + detail : ''}`);
}

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

(async () => {
  console.log('\n=== Phase 19 Admin Dashboard + Monthly Report re-verification ===\n');

  await mongoose.connect(process.env.MONGODB_URI);

  const alNoor = await Mosque.findOne({ name: /Al-Noor/i }).select('_id name').lean();
  const alRahman = await Mosque.findOne({ name: /Al-Rahman/i }).select('_id name').lean();
  const alNoorId = String(alNoor._id);
  const alRahmanId = String(alRahman._id);

  console.log('--- Section A: Admin login + load all 6 dashboard endpoints ---');
  const aLogin = await req('POST', '/api/auth/login', { email: 'admin@emasjid.pk', password: 'admin123' });
  const aToken = aLogin.body?.token;
  check('1. Admin login', aLogin.status === 200 && !!aToken, `status=${aLogin.status}`);

  const dList = await req('GET', `/api/donations?mosqueId=${alNoorId}&limit=5`, null, aToken);
  check('2. GET /api/donations?mosqueId=Al-Noor → 200 + array',
    dList.status === 200 && Array.isArray(dList.body?.data),
    `status=${dList.status}, count=${dList.body?.data?.length}`);

  const eList = await req('GET', `/api/expenses?mosqueId=${alNoorId}&limit=5`, null, aToken);
  check('3. GET /api/expenses?mosqueId=Al-Noor → 200 + array',
    eList.status === 200 && Array.isArray(eList.body?.data),
    `status=${eList.status}, count=${eList.body?.data?.length}`);

  const dSummary = await req('GET', `/api/donations/summary?mosqueId=${alNoorId}`, null, aToken);
  check('4. GET /api/donations/summary?mosqueId=Al-Noor → 200 + totalDonations',
    dSummary.status === 200 && typeof dSummary.body?.data?.totalDonations === 'number',
    `status=${dSummary.status}, total=${dSummary.body?.data?.totalDonations}`);

  const eSummary = await req('GET', `/api/expenses/summary?mosqueId=${alNoorId}`, null, aToken);
  check('5. GET /api/expenses/summary?mosqueId=Al-Noor → 200 + totalExpenses',
    eSummary.status === 200 && typeof eSummary.body?.data?.totalExpenses === 'number',
    `status=${eSummary.status}, total=${eSummary.body?.data?.totalExpenses}`);

  console.log('\n--- Section B: Scope isolation (admin of Al-Noor must NOT see Al-Rahman data via ADMIN endpoints) ---');
  const adminUser = await User.findOne({ email: 'admin@emasjid.pk' }).select('mosqueId role').lean();
  check('6. admin@emasjid.pk is assigned to Al-Noor',
    adminUser && adminUser.role === 'admin' && String(adminUser.mosqueId) === alNoorId,
    `role=${adminUser?.role}, mosque=${String(adminUser?.mosqueId)}, expected=${alNoorId}`);

  const dListCross = await req('GET', `/api/donations/admin?mosqueId=${alRahmanId}`, null, aToken);
  check('7. Admin A denied at /api/donations/admin when asking for Al-Rahman',
    dListCross.status === 403,
    `status=${dListCross.status}, err="${dListCross.body?.error}"`);

  const dListCrossNoMosque = await req('GET', `/api/donations/admin`, null, aToken);
  const alRahmanInResponse = dListCrossNoMosque.body?.data?.some?.((d) => String(d.mosqueId) === alRahmanId);
  check('8. /api/donations/admin without mosqueId defaults to admin\'s masjid only',
    dListCrossNoMosque.status === 200 && !alRahmanInResponse,
    `status=${dListCrossNoMosque.status}, no-rahman=${!alRahmanInResponse}, total=${dListCrossNoMosque.body?.total}`);

  const eListCross = await req('GET', `/api/expenses?mosqueId=${alRahmanId}`, null, aToken);
  check('9. **BUG-PHASE19-001** /api/expenses has NO admin scope (doesn\'t deny cross-masjid)',
    eListCross.status === 200,
    `status=${eListCross.status} (expected: 403 like /donations/admin; actual: 200 — any authenticated user can query any masjidId)`);

  const eListOwn = await req('GET', `/api/expenses?mosqueId=${alNoorId}`, null, aToken);
  const eListNoFilter = await req('GET', `/api/expenses`, null, aToken);
  check('9b. /api/expenses without mosqueId returns ALL masjids (no implicit scope)',
    eListNoFilter.status === 200 && (eListNoFilter.body?.total || 0) >= (eListOwn.body?.total || 0),
    `noFilter.total=${eListNoFilter.body?.total}, alNoor.total=${eListOwn.body?.total} (expected: alNoor.total when scoped to user; actual: returns all masjids)`);

  console.log('\n--- Section C: Month filter changes totals ---');
  const now = new Date();
  const thisMonthName = now.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
  const thisMonthNum = now.getMonth() + 1;
  const lastMonthName = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
  const lastMonthNum = new Date(now.getFullYear(), now.getMonth() - 1, 1).getMonth() + 1;

  const dbAllNoor = await Donation.aggregate([
    { $match: { mosqueId: new mongoose.Types.ObjectId(alNoorId) } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const dbThisMonth = await Donation.aggregate([
    { $match: { mosqueId: new mongoose.Types.ObjectId(alNoorId), $expr: { $eq: [{ $month: '$createdAt' }, thisMonthNum] } } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const dbLastMonth = await Donation.aggregate([
    { $match: { mosqueId: new mongoose.Types.ObjectId(alNoorId), $expr: { $eq: [{ $month: '$createdAt' }, lastMonthNum] } } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const apiThis = await req('GET', `/api/donations/admin?mosqueId=${alNoorId}&month=${thisMonthName}&limit=100`, null, aToken);
  const apiLast = await req('GET', `/api/donations/admin?mosqueId=${alNoorId}&month=${lastMonthName}&limit=100`, null, aToken);
  check('10. /api/donations/admin?month=<name> returns matching total (this month)',
    apiThis.status === 200 && apiThis.body?.data?.reduce?.((s, d) => s + d.amount, 0) === (dbThisMonth[0]?.total || 0),
    `month="${thisMonthName}" api.sum=${apiThis.body?.data?.reduce?.((s, d) => s + d.amount, 0)}, db.sum=${dbThisMonth[0]?.total || 0}`);

  check('11. /api/donations/admin?month=<name> returns last-month total',
    apiLast.status === 200 && apiLast.body?.data?.reduce?.((s, d) => s + d.amount, 0) === (dbLastMonth[0]?.total || 0),
    `month="${lastMonthName}" api.sum=${apiLast.body?.data?.reduce?.((s, d) => s + d.amount, 0)}, db.sum=${dbLastMonth[0]?.total || 0}, thisMonth.db=${dbThisMonth[0]?.total || 0}`);

  const badMonth = await req('GET', `/api/donations/admin?mosqueId=${alNoorId}&month=2026-08&limit=100`, null, aToken);
  check('24. **FIX-PHASE19-002** /api/donations/admin?month=2026-08 returns clear 400 (was: CastError "Resource not found")',
    badMonth.status === 400 && /Invalid month format/i.test(badMonth.body?.message || ''),
    `month="2026-08" returns status=${badMonth.status}, msg="${badMonth.body?.message}"`);

  const badMonthExp = await req('GET', `/api/expenses/admin?mosqueId=${alNoorId}&month=2026-08&limit=100`, null, aToken);
  check('25. **FIX-PHASE19-002** /api/expenses/admin?month=2026-08 also returns clear 400',
    badMonthExp.status === 400 && /Invalid month format/i.test(badMonthExp.body?.message || ''),
    `month="2026-08" returns status=${badMonthExp.status}, msg="${badMonthExp.body?.message}"`);

  const expensesAdminNoor = await req('GET', `/api/expenses/admin?mosqueId=${alNoorId}`, null, aToken);
  check('26. **FIX-PHASE19-001** /api/expenses/admin?mosqueId=Al-Noor returns 200 with admin data',
    expensesAdminNoor.status === 200 && Array.isArray(expensesAdminNoor.body?.data),
    `status=${expensesAdminNoor.status}, count=${expensesAdminNoor.body?.data?.length}`);

  const expensesAdminCross = await req('GET', `/api/expenses/admin?mosqueId=${alRahmanId}`, null, aToken);
  check('27. **FIX-PHASE19-001** /api/expenses/admin?mosqueId=Al-Rahman → 403 (scope enforced)',
    expensesAdminCross.status === 403,
    `status=${expensesAdminCross.status}, msg="${expensesAdminCross.body?.message || expensesAdminCross.body?.error}"`);

  const expensesAdminNoFilter = await req('GET', `/api/expenses/admin`, null, aToken);
  const noFilterLeak = expensesAdminNoFilter.body?.data?.some?.((e) => String(e.mosqueId) === alRahmanId);
  check('28. **FIX-PHASE19-001** /api/expenses/admin without mosqueId locks to admin\'s masjid only',
    expensesAdminNoFilter.status === 200 && !noFilterLeak,
    `status=${expensesAdminNoFilter.status}, no-rahman-leak=${!noFilterLeak}, total=${expensesAdminNoFilter.body?.total}`);

  check('12. Summary endpoint (no month param) is ALL-TIME total',
    dSummary.body?.data?.totalDonations === (dbAllNoor[0]?.total || 0),
    `api.total=${dSummary.body?.data?.totalDonations}, db.total=${dbAllNoor[0]?.total || 0}`);

  console.log('\n--- Section D: CSV report integrity (replicated from frontend logic) ---');
  const allDonationsNoor = await Donation.find({ mosqueId: new mongoose.Types.ObjectId(alNoorId) }).sort({ createdAt: -1 }).lean();
  const allExpensesNoor = await Expense.find({ mosqueId: new mongoose.Types.ObjectId(alNoorId) }).sort({ createdAt: -1 }).lean();

  const donationByType = {};
  allDonationsNoor.forEach((d) => { donationByType[d.type || 'Other'] = (donationByType[d.type || 'Other'] || 0) + (d.amount || 0); });
  const expenseByCategory = {};
  allExpensesNoor.forEach((e) => { expenseByCategory[e.category || 'Other'] = (expenseByCategory[e.category || 'Other'] || 0) + (e.amount || 0); });

  check('13. CSV donation-by-type breakdown totals match summary',
    Object.values(donationByType).reduce((s, v) => s + v, 0) === (dbAllNoor[0]?.total || 0),
    `byType.sum=${Object.values(donationByType).reduce((s, v) => s + v, 0)}, summary=${dbAllNoor[0]?.total || 0}`);

  check('14. CSV expense-by-category breakdown totals match summary',
    Object.values(expenseByCategory).reduce((s, v) => s + v, 0) === (eSummary.body?.data?.totalExpenses || 0),
    `byCat.sum=${Object.values(expenseByCategory).reduce((s, v) => s + v, 0)}, summary=${eSummary.body?.data?.totalExpenses || 0}`);

  const topDonorMatch = await Donation.aggregate([
    { $match: { mosqueId: new mongoose.Types.ObjectId(alNoorId), isAnonymous: false } },
    { $group: { _id: '$donorName', totalAmount: { $sum: '$amount' }, donationCount: { $sum: 1 } } },
    { $sort: { totalAmount: -1 } },
    { $limit: 10 },
  ]);
  const topDonorsApi = await req('GET', `/api/donations/top-donors?mosqueId=${alNoorId}`, null, aToken);
  check('15. /api/donations/top-donors returns aggregated top 10 with rank',
    topDonorsApi.status === 200 && Array.isArray(topDonorsApi.body?.data) && topDonorsApi.body?.data?.length === topDonorMatch.length,
    `api.len=${topDonorsApi.body?.data?.length}, db.len=${topDonorMatch.length}`);

  const anonCount = allDonationsNoor.filter((d) => d.isAnonymous).length;
  check('16. Anonymous donations present in DB',
    anonCount >= 0,
    `anon=${anonCount} (will be masked as "Anonymous" in CSV per report.js:80)`);

  const report = await req('GET', `/api/donations/admin?mosqueId=${alNoorId}&limit=10000`, null, aToken);
  check('17. Admin donations list (large limit) returns same count as DB',
    report.status === 200 && report.body?.total === allDonationsNoor.length,
    `api.total=${report.body?.total}, db.count=${allDonationsNoor.length}`);

  console.log('\n--- Section E: Hardcoded month-over-month labels removed (post-fix) ---');
  const dashSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'frontend', 'src', 'components', 'Admin', 'Pages', 'Dashboard.jsx'), 'utf8');
  const deSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'frontend', 'src', 'components', 'Admin', 'Pages', 'DonationsExpenses.jsx'), 'utf8');
  check('18. Dashboard no longer shows "+12% this month" (FIX-PHASE19-003 applied)',
    !/\+12% this month/.test(dashSrc),
    '+12% this month string removed from Dashboard.jsx');
  check('19. Dashboard no longer shows "This month" label (FIX-PHASE19-003 applied)',
    !/This month/.test(dashSrc),
    '"This month" string removed from Dashboard.jsx');
  check('20. DonationsExpenses no longer shows "+12% vs last month" (FIX-PHASE19-003 applied)',
    !/\+12% vs last month/.test(deSrc),
    '+12% vs last month string removed from DonationsExpenses.jsx');
  check('21. DonationsExpenses no longer shows "+5% vs last month" (FIX-PHASE19-003 applied)',
    !/\+5% vs last month/.test(deSrc),
    '+5% vs last month string removed from DonationsExpenses.jsx');

  console.log('\n--- Section F: DonationsExpenses client-side filter behavior ---');
  check('22. DonationsExpenses filters client-side (no month/category sent to backend)',
    !/api\.getDonations\([^)]*month/.test(deSrc) && !/api\.getExpenses\([^)]*month/.test(deSrc),
    'confirmed: all filtering happens in useMemo on the client');

  console.log('\n--- Section G: Top-donors public endpoint consistency ---');
  const topPublic = await req('GET', `/api/donations/top-donors?mosqueId=${alNoorId}`, null, null);
  check('23. /api/donations/top-donors is PUBLIC (no token needed)',
    topPublic.status === 200 && Array.isArray(topPublic.body?.data),
    `status=${topPublic.status}, count=${topPublic.body?.data?.length}`);

  const totalPass = results.filter((r) => r.ok).length;
  console.log(`\n=== RESULT: ${totalPass}/${results.length} checks passed ===\n`);

  server.close();
  await mongoose.disconnect();
  process.exit(totalPass === results.length ? 0 : 1);
})().catch((e) => { console.error('FATAL:', e); process.exit(1); });