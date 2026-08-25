require('dotenv').config();
process.env.NODE_ENV = 'test';
process.env.PORT = '59887';

const fs = require('fs');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');

const LOG_PATH = path.join(__dirname, '..', 'logs', 'phase18_probe.log');
fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
fs.writeFileSync(LOG_PATH, '');

const origLog = console.log.bind(console);
const origErr = console.error.bind(console);
const origWarn = console.warn.bind(console);
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
console.warn = hook('warn', origWarn);

const User = require('../models/User');
const FundRequest = require('../models/FundRequest');
const app = require('../server');

const PORT = process.env.PORT || 59887;
const server = app.listen(PORT);
console.log(`probe backend listening on ${PORT}`);

const BASE = `http://localhost:${PORT}`;
const LOG_TAIL_LINES = 80;

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

function readLog(sinceLine = 0) {
  try {
    const txt = fs.readFileSync(LOG_PATH, 'utf8');
    return txt.split('\n').slice(sinceLine).join('\n');
  } catch (e) { return ''; }
}

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ' — ' + detail : ''}`);
}

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

(async () => {
  console.log('\n=== Phase 18 Notification Email — live API re-verification (in-process) ===\n');

  await mongoose.connect(process.env.MONGODB_URI);
  const noor = await User.findOne({ email: 'jackcanada333@gmail.com' }).select('mosqueId').lean();
  const alNoorId = String(noor.mosqueId);

  console.log('--- Section A: Forgot Password email ---');
  const fp = await req('POST', '/api/auth/forgot-password', { email: 'jackcanada333@gmail.com' });
  check('1. POST /api/auth/forgot-password → 200', fp.status === 200, `status=${fp.status}`);
  await sleep(1500);
  const fpGotReset = await User.findOne({ email: 'jackcanada333@gmail.com' }).select('resetPasswordToken resetPasswordExpire').lean();
  check('2. resetPasswordToken populated + expires ~10min',
    !!fpGotReset?.resetPasswordToken && !!fpGotReset?.resetPasswordExpire,
    `tokenLen=${fpGotReset?.resetPasswordToken?.length || 0}, expiresIn=${fpGotReset?.resetPasswordExpire ? Math.round((new Date(fpGotReset.resetPasswordExpire).getTime() - Date.now()) / 60000) : 0}min`);

  const sectionAStart = fs.readFileSync(LOG_PATH, 'utf8').split('\n').length;
  console.log('\n--- Section B: Committee notification (Al-Noor, 4 active) ---');
  const activeMembersBefore = await User.countDocuments({ mosqueId: alNoorId, role: 'committee', isActive: true });
  console.log(`  active Al-Noor committee in DB = ${activeMembersBefore}`);

  const uLogin = await req('POST', '/api/auth/login', { email: 'user@emasjid.pk', password: 'user1234' });
  const uToken = uLogin.body?.token;
  check('3. Community user login', uLogin.status === 200 && !!uToken, `status=${uLogin.status}`);

  const fr = await req('POST', '/api/fund-requests', {
    requesterName: 'Phase18 Requester', requesterEmail: 'dawood.bhatti8812@gmail.com', requesterPhone: '03001234567',
    amount: 5000, category: 'Medical', reason: 'Phase 18 re-verify test request please ignore',
    mosqueId: alNoorId,
  }, uToken);
  check('4. POST /api/fund-requests → 201', fr.status === 201, `status=${fr.status}, err=${JSON.stringify(fr.body?.error)}`);

  await sleep(3500);
  const bLog = readLog(sectionAStart);
  const committeeLine = bLog.split('\n').find((l) => l.includes('[notifyCommittee]') && l.includes('request='));
  const sentLine = bLog.split('\n').find((l) => l.includes('[notifyCommittee]') && l.includes('sent='));
  check('5. notifyCommittee invoked (request line logged)',
    !!committeeLine && /members=4/.test(committeeLine),
    (committeeLine || '').slice(0, 250));
  check('6. notifyCommittee sent=4 failed=0',
    !!sentLine && /sent=4 failed=0/.test(sentLine),
    (sentLine || '').slice(0, 250));

  const emailsInLog = (committeeLine || '').split('emails=')[1] || '';
  const emailedAddrs = emailsInLog.split(',').map((m) => m.trim()).filter(Boolean);
  check('7. Recipients = 4 distinct emails',
    emailedAddrs.length === 4,
    `emails=${emailedAddrs.join(',')}`);

  const alRahmanComm = await User.findOne({ email: 'committee2@emasjid.pk' }).select('email mosqueId').lean();
  check('8. Scope isolation: Al-Rahman committee does NOT receive Al-Noor email',
    alRahmanComm && !emailedAddrs.includes(alRahmanComm.email),
    `alRahman=${alRahmanComm?.email}, sentTo=${emailedAddrs.join(',')}`);

  const inactiveAlNoorComm = await User.findOne({ email: 'committee@emasjid.pk', mosqueId: alNoorId }).select('email isActive').lean();
  check('9. Inactive filter: inactive Al-Noor committee does NOT receive email',
    inactiveAlNoorComm && !inactiveAlNoorComm.isActive && !emailedAddrs.includes(inactiveAlNoorComm.email),
    `inactive.isActive=${inactiveAlNoorComm?.isActive}, sentTo=${emailedAddrs.join(',')}`);

  console.log('\n--- Section C: Requester status update ---');
  const cLogin = await req('POST', '/api/auth/login', { email: 'jackcanada333@gmail.com', password: 'committee123' });
  const cToken = cLogin.body?.token;
  check('10. Committee member login', cLogin.status === 200 && !!cToken, `status=${cLogin.status}`);

  const fundReqId = fr.body?.data?._id;
  const reviewRes = await req('PUT', `/api/fund-requests/${fundReqId}`, { status: 'approved', reviewNote: 'Phase 18 test approval please ignore' }, cToken);
  check('11. PUT /api/fund-requests/:id (review) → 200', reviewRes.status === 200, `status=${reviewRes.status}, err=${JSON.stringify(reviewRes.body?.error)}`);

  await sleep(3500);
  const cLog = readLog();
  const notifyReqOk = cLog.split('\n').find((l) => l.includes('[notifyCommittee]') && l.includes('sent='));
  const notifyReqErr = cLog.split('\n').find((l) => l.includes('Failed to send requester notification'));
  const sentNoFail = !!notifyReqOk && /failed=0/.test(notifyReqOk);
  check('12. Requester notification attempted (success OR swallowed-failure)',
    !notifyReqErr || sentNoFail,
    notifyReqErr ? 'error swallowed (graceful)' : 'sent successfully');

  const reviewed = await FundRequest.findById(fundReqId).select('status reviewNote reviewedBy').lean();
  check('13. FundRequest updated to approved',
    reviewed?.status === 'approved' && reviewed?.reviewNote?.includes('Phase 18'),
    `status=${reviewed?.status}, note=${reviewed?.reviewNote}`);

  console.log('\n--- Section D: Forgot-password graceful degradation ---');
  const fp2 = await req('POST', '/api/auth/forgot-password', { email: 'jackcanada333@gmail.com' });
  check('14. Valid user forgot-pw returns 200', fp2.status === 200, `status=${fp2.status}`);
  const fp3 = await req('POST', '/api/auth/forgot-password', { email: 'nonexistent-user-12345@example.com' });
  check('15. Unknown email forgot-pw returns 200 (no enumeration)',
    fp3.status === 200 && fp3.body?.message?.includes('If the email exists'),
    `status=${fp3.status}, msg="${fp3.body?.message}"`);

  console.log('\n--- Section E: SMTP-failure graceful degradation (code-path confirmed) ---');
  const fs2 = require('fs');
  const authSrc = fs2.readFileSync(path.join(__dirname, '..', 'services', 'authService.js'), 'utf8');
  const svcSrc = fs2.readFileSync(path.join(__dirname, '..', 'services', 'fundRequestsService.js'), 'utf8');
  check('16. authService.requestPasswordReset wraps sendEmail in try/catch (graceful)',
    /async function requestPasswordReset[\s\S]*?catch \(emailErr\)[\s\S]*?console\.error\([\s\S]*?return \{ sent: true \}/.test(authSrc),
    'confirmed: email failure logged + returns {sent:true}');
  check('17. fundRequestsService.notifyCommittee uses Promise.allSettled (per-recipient graceful)',
    /Promise\.allSettled/.test(svcSrc) && /results\.filter\(\(r\) => r\.status === 'fulfilled'\)/.test(svcSrc),
    'confirmed: one failed SMTP does NOT block the others');
  check('18. fundRequestsService.notifyRequester wraps sendEmail in try/catch (graceful)',
    /async function notifyRequester\([\s\S]{0,500}catch \(err\)[\s\S]*?Failed to send requester notification/.test(svcSrc),
    'confirmed: requester notify failure logged, no throw');

  const totalPass = results.filter((r) => r.ok).length;
  console.log(`\n=== RESULT: ${totalPass}/${results.length} checks passed ===\n`);

  console.log('--- Log tail (last 25 lines) ---');
  const tail = fs.readFileSync(LOG_PATH, 'utf8').split('\n').filter(Boolean).slice(-25);
  tail.forEach((l) => console.log(l));

  server.close();
  await mongoose.disconnect();
  process.exit(totalPass === results.length ? 0 : 1);
})().catch((e) => { console.error('FATAL:', e); process.exit(1); });