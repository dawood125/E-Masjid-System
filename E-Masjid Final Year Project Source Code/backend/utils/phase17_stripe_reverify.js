require('dotenv').config();
const http = require('http');
const crypto = require('crypto');
const mongoose = require('mongoose');
const stripeLib = require('stripe');

const BASE = 'http://localhost:5000';
const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function req(method, path, body, token, rawBody, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    if (token) opts.headers.Authorization = `Bearer ${token}`;
    const r = http.request(opts, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: buf ? JSON.parse(buf) : null }); }
        catch (e) { resolve({ status: res.statusCode, body: buf }); }
      });
    });
    r.on('error', reject);
    if (rawBody) r.write(rawBody);
    else if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function signPayload(payload) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const v1 = crypto.createHmac('sha256', WEBHOOK_SECRET).update(signedPayload, 'utf8').digest('hex');
  return { 'stripe-signature': `t=${timestamp},v1=${v1}`, timestamp };
}

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ' — ' + detail : ''}`);
}

(async () => {
  console.log('\n=== Phase 17 Stripe Payments — live API re-verification ===\n');

  const Donation = require('../models/Donation');
  await mongoose.connect(process.env.MONGODB_URI);

  const login = await req('POST', '/api/auth/login', {
    email: 'manager@emasjid.pk', password: 'manager123',
  });
  check('1. Manager login', login.status === 200 && !!login.body?.token, `status=${login.status}`);
  const token = login.body?.token;
  if (!token) { console.log('abort'); process.exit(1); }

  const mos = await req('GET', '/api/mosques', null, token);
  const all = mos.body?.data || [];
  const alNoor = all.find((m) => m.name === 'Masjid Al-Noor');
  const alRahman = all.find((m) => m.name === 'Masjid Al-Rahman');
  console.log(`  using Al-Noor (${alNoor?._id}), Al-Rahman (${alRahman?._id})`);

  console.log('\n--- Section A: Checkout session creation ---');
  const checkout = await req('POST', '/api/donations/online', {
    donorName: 'Phase17 Tester', email: 'phase17@test.local', phone: '03001234567',
    amount: 500, type: 'Sadaqah', isAnonymous: false, mosqueId: alNoor._id,
  });
  check('2. POST /api/donations/online returns Stripe URL', checkout.status === 200 && !!checkout.body?.url?.includes('stripe.com'), `url=${checkout.body?.url?.slice(0, 60)}…`);

  const belowMin = await req('POST', '/api/donations/online', {
    donorName: 'Tester', amount: 50, type: 'Sadaqah', mosqueId: alNoor._id,
  });
  check('3. Below-minimum amount (PKR 50) rejected', belowMin.status === 400, `status=${belowMin.status}`);

  const invalidType = await req('POST', '/api/donations/online', {
    donorName: 'Tester', amount: 500, type: 'Haram', mosqueId: alNoor._id,
  });
  check('4. Invalid type rejected', invalidType.status === 400, `status=${invalidType.status}`);

  const invalidMosque = await req('POST', '/api/donations/online', {
    donorName: 'Tester', amount: 500, type: 'Sadaqah', mosqueId: 'not-an-objectid',
  });
  check('5. Invalid mosqueId rejected by express-validator', invalidMosque.status === 400, `status=${invalidMosque.status}`);

  const emptyMosque = await req('POST', '/api/donations/online', {
    donorName: 'Tester', amount: 500, type: 'Sadaqah', mosqueId: '',
  });
  check('6. Empty mosqueId rejected by tightened validator (post-fix)',
    emptyMosque.status === 400,
    `status=${emptyMosque.status} (was 200 pre-fix)`);

  console.log('\n--- Section B: Webhook signature verification ---');
  const fakeEventNoSig = await req('POST', '/api/donations/webhook',
    { type: 'checkout.session.completed', data: { object: { id: 'cs_fake', payment_intent: 'pi_fake', metadata: { amount: '500', mosqueId: alNoor._id, donorName: 'NoSig', email: '', phone: '', type: 'Sadaqah', isAnonymous: 'false' } } } },
    null, null);
  check('7. POST webhook without signature → 400', fakeEventNoSig.status === 400, `status=${fakeEventNoSig.status}`);

  const fakeEventBadSig = await req('POST', '/api/donations/webhook',
    { type: 'checkout.session.completed', data: { object: { id: 'cs_fake', payment_intent: 'pi_fake', metadata: { amount: '500', mosqueId: alNoor._id, donorName: 'BadSig', email: '', phone: '', type: 'Sadaqah', isAnonymous: 'false' } } } },
    null, JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: 'cs_fake' } } }),
    { 'stripe-signature': 't=1,v1=0000000000000000000000000000000000000000000000000000000000000000' });
  check('8. POST webhook with wrong signature → 400', fakeEventBadSig.status === 400, `status=${fakeEventBadSig.status}`);

  console.log('\n--- Section C: Webhook happy path (Al-Noor) ---');
  const beforeNoor = await Donation.countDocuments({ mosqueId: alNoor._id });
  const piNoor = `pi_phase17_noor_${Date.now()}`;
  const evtNoor = {
    id: `evt_phase17_noor_${Date.now()}`,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: `cs_phase17_noor_${Date.now()}`,
        payment_intent: piNoor,
        metadata: {
          donorName: 'Phase17 Noor', email: 'noor@test.local', phone: '03001',
          amount: '750', type: 'Zakat', isAnonymous: 'false', mosqueId: alNoor._id,
        },
      },
    },
  };
  const payloadNoor = JSON.stringify(evtNoor);
  const sigNoor = signPayload(payloadNoor);
  const whNoor = await req('POST', '/api/donations/webhook', null, null, payloadNoor, sigNoor);
  check('9. POST webhook (Al-Noor, valid sig) → 200', whNoor.status === 200, `status=${whNoor.status}`);
  const afterNoor = await Donation.countDocuments({ mosqueId: alNoor._id });
  check('10. Donation row created in DB scoped to Al-Noor', afterNoor === beforeNoor + 1, `before=${beforeNoor}, after=${afterNoor}`);
  const noorDon = await Donation.findOne({ stripePaymentId: piNoor }).lean();
  check('11. Donation has correct fields (amount, type, mosqueId, donorName, paymentMethod)',
    !!noorDon && noorDon.amount === 750 && noorDon.type === 'Zakat' && String(noorDon.mosqueId) === alNoor._id && noorDon.donorName === 'Phase17 Noor' && noorDon.paymentMethod === 'Online',
    `amount=${noorDon?.amount}, type=${noorDon?.type}, mosqueId=${noorDon?.mosqueId}, paymentMethod=${noorDon?.paymentMethod}`);

  console.log('\n--- Section D: Webhook idempotency ---');
  const whNoorDup = await req('POST', '/api/donations/webhook', null, null, payloadNoor, sigNoor);
  check('12. Same webhook payload twice → still 200', whNoorDup.status === 200, `status=${whNoorDup.status}`);
  const afterDup = await Donation.countDocuments({ mosqueId: alNoor._id });
  check('13. No duplicate Donation row from replayed webhook', afterDup === afterNoor, `after=${afterDup}, expected=${afterNoor}`);

  console.log('\n--- Section E: Cross-mosque isolation ---');
  const beforeRahman = await Donation.countDocuments({ mosqueId: alRahman._id });
  const piRahman = `pi_phase17_rahman_${Date.now()}`;
  const evtRahman = {
    id: `evt_phase17_rahman_${Date.now()}`,
    type: 'checkout.session.completed',
    data: { object: { id: `cs_rahman_${Date.now()}`, payment_intent: piRahman,
      metadata: { donorName: 'Phase17 Rahman', email: '', phone: '', amount: '300', type: 'Sadaqah', isAnonymous: 'false', mosqueId: alRahman._id } } },
  };
  const payloadRahman = JSON.stringify(evtRahman);
  const sigRahman = signPayload(payloadRahman);
  await req('POST', '/api/donations/webhook', null, null, payloadRahman, sigRahman);
  const afterRahman = await Donation.countDocuments({ mosqueId: alRahman._id });
  check('14. Donation on Masjid Al-Rahman created', afterRahman === beforeRahman + 1, `before=${beforeRahman}, after=${afterRahman}`);

  const publicNoor = await req('GET', `/api/donations?mosqueId=${alNoor._id}&limit=50`, null);
  const publicRahman = await req('GET', `/api/donations?mosqueId=${alRahman._id}&limit=50`, null);
  const noorHasRahmanDon = publicNoor.body?.data?.some((d) => d.stripePaymentId === piRahman);
  const rahmanHasNoorDon = publicRahman.body?.data?.some((d) => d.stripePaymentId === piNoor);
  check('15. Al-Noor public list does NOT contain Al-Rahman donation', !noorHasRahmanDon);
  check('16. Al-Rahman public list does NOT contain Al-Noor donation', !rahmanHasNoorDon);

  console.log('\n--- Section F: Anonymous masking ---');
  const piAnon = `pi_phase17_anon_${Date.now()}`;
  const evtAnon = {
    id: `evt_phase17_anon_${Date.now()}`,
    type: 'checkout.session.completed',
    data: { object: { id: `cs_anon_${Date.now()}`, payment_intent: piAnon,
      metadata: { donorName: 'Real Name Should Not Leak', email: 'real@test.local', phone: '030099', amount: '500', type: 'Sadaqah', isAnonymous: 'true', mosqueId: alNoor._id } } },
  };
  const payloadAnon = JSON.stringify(evtAnon);
  const sigAnon = signPayload(payloadAnon);
  const whAnon = await req('POST', '/api/donations/webhook', null, null, payloadAnon, sigAnon);
  const publicAnon = await req('GET', `/api/donations?mosqueId=${alNoor._id}&limit=50`, null);
  const anonEntry = publicAnon.body?.data?.find((d) => d.stripePaymentId === piAnon);
  check('17. Anonymous donor shown as "Anonymous" on public list',
    !!anonEntry && anonEntry.donorName === 'Anonymous' && !anonEntry.email,
    `donorName=${anonEntry?.donorName}, email=${anonEntry?.email}`);

  console.log('\n--- Section G: Webhook bug — invalid amount is silently swallowed ---');
  const piBadAmt = `pi_phase17_bad_${Date.now()}`;
  const evtBadAmt = {
    id: `evt_phase17_bad_${Date.now()}`,
    type: 'checkout.session.completed',
    data: { object: { id: `cs_bad_${Date.now()}`, payment_intent: piBadAmt,
      metadata: { donorName: 'Bad Amount', email: '', phone: '', amount: '0', type: 'Sadaqah', isAnonymous: 'false', mosqueId: alNoor._id } } },
  };
  const payloadBad = JSON.stringify(evtBadAmt);
  const sigBad = signPayload(payloadBad);
  const beforeBad = await Donation.countDocuments({ stripePaymentId: piBadAmt });
  const whBad = await req('POST', '/api/donations/webhook', null, null, payloadBad, sigBad);
  const afterBad = await Donation.countDocuments({ stripePaymentId: piBadAmt });
  check('18. Webhook with metadata.amount=0 now returns 500 (post-fix — Stripe will retry)',
    whBad.status === 500 && beforeBad === 0 && afterBad === 0,
    `status=${whBad.status} (was 200 pre-fix), donation correctly NOT created`);

  const totalPass = results.filter((r) => r.ok).length;
  console.log(`\n=== RESULT: ${totalPass}/${results.length} checks passed ===\n`);
  process.exit(totalPass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });