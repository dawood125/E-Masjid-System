# 17 Stripe Payments Module — Bugs Fixed

> Step E — 2 Phase-17 bugs fixed and re-verified 2026-08-25.

---

## FIX-PHASE17-001 — Webhook now propagates processing errors so Stripe retries (BUG-PHASE17-001)

**Why:** The webhook handler was swallowing errors from `processEvent` (`console.error` then fall-through). If Stripe sent a malformed `checkout.session.completed` (e.g. `metadata.amount = 0`), the webhook returned `200 + {"received":true}` → Stripe dashboard marked it as successful → **no retry** → donation silently lost. This is a money-loss bug.

### Backend change

**`backend/services/stripeWebhookService.js#handleWebhook`** — removed the try/catch around `processEvent` so errors propagate:

```diff
 async function handleWebhook(req) {
   const stripe = getStripe();
   let event;
   try {
     event = verifySignature(req, stripe);
   } catch (err) {
     return { verified: false, error: err.message };
   }
-  try {
-    await processEvent(event);
-  } catch (err) {
-    console.error('Stripe webhook processing error:', err.message);
-  }
+  await processEvent(event);
   return { verified: true };
 }
```

The controller (`backend/controllers/stripeWebhookController.js`) was already correct: it `next(err)`s on any thrown error, which hits the global `errorHandler` middleware and returns HTTP 500. That's exactly the signal Stripe looks for to retry.

### Test update (required — the old test asserted the bug)

**`backend/tests/integration/donations_scope.test.js:578-597`** — test was named "webhook with valid signature but invalid amount in metadata does not crash" and asserted `expect(res.status).toBe(200)`. That assertion was implicitly encoding the buggy behavior (200 = Stripe thinks success = no retry).

Updated to assert the post-fix correct behavior:
```diff
-test('webhook with valid signature but invalid amount in metadata does not crash', async () => {
+test('webhook with valid signature but invalid amount in metadata returns 500 (so Stripe retries)', async () => {
   ...
-  expect(res.status).toBe(200);
+  expect(res.status).toBe(500);
   const created = await Donation.findOne({ stripePaymentId: 'pi_test_payment_bad' });
   expect(created).toBeNull();
 });
```

The `created` assertion (`expect(created).toBeNull()`) was already correct — the test confirmed that no Donation is created in either case. Only the HTTP status assertion needed to change.

### Verification (live API probe — `backend/utils/phase17_stripe_reverify.js`)

Re-ran on 2026-08-25 after fix:

| Test | Pre-fix | Post-fix |
|---|---|---|
| Webhook with `metadata.amount='0'` | 200 + `{"received":true}` + **0 donations** (silent loss) | **500 + 0 donations** (Stripe will retry per its retry policy) ✅ |

| # | Test | Result |
|---|---|---|
| 1 | Manager login | PASS |
| 2 | Checkout session creation | PASS |
| 3 | Below-minimum amount rejected | PASS |
| 4 | Invalid type rejected | PASS |
| 5 | Invalid mosqueId rejected | PASS |
| 6 | **Empty mosqueId rejected** (was: accepted → scope leak) | **PASS — status=400 (was 200 pre-fix)** |
| 7 | Webhook without signature → 400 | PASS |
| 8 | Webhook with wrong signature → 400 | PASS |
| 9 | Webhook happy path → 200 | PASS |
| 10 | Donation row created in DB | PASS |
| 11 | Donation has correct fields | PASS |
| 12 | Replayed webhook → still 200 | PASS |
| 13 | No duplicate Donation from replayed webhook | PASS |
| 14 | Cross-mosque webhook (Al-Rahman) creates Donation | PASS |
| 15 | Al-Noor public list does NOT contain Al-Rahman donation | PASS |
| 16 | Al-Rahman public list does NOT contain Al-Noor donation | PASS |
| 17 | Anonymous donor shown as 'Anonymous' on public list | PASS |
| 18 | **Webhook with amount=0 → 500 (was 200 pre-fix)** | **PASS — Stripe will now retry** |

**18/18 PASS in 1 run after fix application.**

### Files modified

- `backend/services/stripeWebhookService.js` — removed try/catch (5 lines removed)
- `backend/tests/integration/donations_scope.test.js` — updated 1 test assertion (status 200 → 500) + retitled

---

## FIX-PHASE17-002 — Empty `mosqueId` no longer accepted on `POST /api/donations/online` (BUG-PHASE17-002)

**Why:** express-validator used `checkFalsy: true` on `mosqueId`, which treats empty string as "not provided". So an empty `mosqueId` passed validation, got forwarded to Stripe as `metadata.mosqueId: ''`, and the webhook stored a Donation with `mosqueId: undefined` — invisible to admin views but **visible on the public donations list** (potential scope leak).

### Backend change

**`backend/routes/donations.js:28`** — tightened the validator:

```diff
-body('mosqueId').optional({ nullable: true, checkFalsy: true }).custom((v) => isValidObjectId(v)).withMessage('Invalid mosqueId'),
+body('mosqueId').optional({ nullable: true }).notEmpty().withMessage('mosqueId cannot be empty').custom((v) => isValidObjectId(v)).withMessage('Invalid mosqueId'),
```

Removed `checkFalsy: true`, added `.notEmpty()` so empty string now fails with a clear message. `.custom(isValidObjectId)` still validates format.

- `mosqueId` is still optional (can be omitted entirely) for future use cases where the front-end might allow generic donations not tied to a specific masjid.
- `mosqueId: ''` is now rejected (was: silently accepted).
- `mosqueId: <valid ObjectId>` still accepted.
- `mosqueId: <invalid format>` still rejected with "Invalid mosqueId".

### Verification (live API probe)

| Test | Pre-fix | Post-fix |
|---|---|---|
| POST `/api/donations/online` with `mosqueId: ''` | 200 + valid Stripe URL (scope leak) | **400 with "mosqueId cannot be empty"** ✅ |

Live API re-run: Test 6 PASSES (status=400) post-fix.

### Files modified

- `backend/routes/donations.js` — tightened validator (1 line changed)

---

## Combined regression check

### Backend tests

```
cd backend && npm test
Test Suites: 1 failed, 5 passed, 6 total
Tests:       1 failed, 159 passed, 160 total
```

The 1 failure is the same pre-existing Phase 15 `committee_scope.test.js:319` bug (`TypeError: notifyCommittee is not a function` due to broken import). **Phase 17 fixes introduced 0 new test failures.**

The intermediate bump to 2 failures during Step E was caused by `donations_scope.test.js:594` asserting the OLD buggy behavior (200 on amount=0). Updated that one assertion to assert the NEW correct behavior (500 on amount=0) — test now passes. This is a test-update, not a regression.

### Frontend lint

```
cd frontend && npm run lint
✖ 10 problems (3 errors, 7 warnings)
```

Identical to pre-Phase-17 baseline (Scholars.jsx:20, api.js:43, api.js:99 errors; 7 warnings). **Phase 17 fixes introduced 0 new lint errors or warnings.**

### Live API probe (combined — both Phase 17 fixes verified)

**18/18 PASS** in 1 run after fix application. Script: `backend/utils/phase17_stripe_reverify.js`.

---

## Files Modified (combined — both Phase 17 fixes)

| File | Changes | Lines |
|---|---|---|
| `backend/services/stripeWebhookService.js` | Removed try/catch in `handleWebhook` to propagate processing errors | -5 |
| `backend/routes/donations.js` | Tightened `mosqueId` validator (removed `checkFalsy: true`, added `.notEmpty()`) | 1 |
| `backend/tests/integration/donations_scope.test.js` | Updated 1 assertion + retitled 1 test (was asserting old buggy behavior) | 2 |

**Total: 3 files, ~6 lines changed.**

---

## Stripe Module Final State

| Concern | Status |
|---|---|
| Checkout session creation | ✅ Works |
| Minimum amount (PKR 100) | ✅ Enforced |
| Type validation (Sadaqah / Zakat / Masjid Fund) | ✅ Enforced |
| MosqueId validation | ✅ Strict (empty rejected) |
| Webhook signature verification | ✅ Active (rejects no/wrong sig) |
| Webhook money-loss bug | ✅ FIXED (500 on malformed events → Stripe retries) |
| Webhook idempotency | ✅ Verified (replayed payload = 1 Donation) |
| Cross-mosque isolation | ✅ Verified (Donation on A not on B's list) |
| Anonymous masking | ✅ Verified (donorName='Anonymous' on public list) |
| Currency (PKR) | ✅ Works with current test key |

**Phase 17 Stripe Payments re-verification: COMPLETE. 2 bugs found, 2 bugs fixed, 18/18 live API checks PASS, 159/160 backend tests PASS, 0 new lint errors.**