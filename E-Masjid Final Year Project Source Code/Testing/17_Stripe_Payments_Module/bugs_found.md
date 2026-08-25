# 17 Stripe Payments Module — Bugs Found

> Step C — discovered 2026-08-25 during Phase 17 re-verification. **2 bugs found; awaiting client approval (Step D) before applying fixes (Step E).**

---

## BUG-PHASE17-001 — Webhook swallows processing errors; donations are silently lost on malformed events (HIGH)

**Severity:** HIGH — direct money loss. The webhook handler catches errors from `processEvent` and returns HTTP 200 with `{"received":true}`. If Stripe fires a `checkout.session.completed` event with malformed metadata (e.g. `amount = 0`, `amount` field missing, `payment_intent` missing), Stripe interprets the 200 as success and **never retries**. The donation is permanently lost.

**Location:** `backend/services/stripeWebhookService.js#handleWebhook` lines 51-65.

```js
async function handleWebhook(req) {
  const stripe = getStripe();
  let event;
  try {
    event = verifySignature(req, stripe);
  } catch (err) {
    return { verified: false, error: err.message };
  }
  try {
    await processEvent(event);
  } catch (err) {
    console.error('Stripe webhook processing error:', err.message);
    // ↑ swallows the error; falls through to the line below
  }
  return { verified: true };  // ← BUG: returns success even when processing failed
}
```

**Root cause (trace):**
1. Stripe sends `checkout.session.completed` with `metadata.amount = '0'` (could happen if Stripe Checkout is configured with a 0-amount item, or if our code accidentally passes `amount: 0`).
2. `handleCheckoutCompleted` (line 19-43) calls `Number(meta.amount || 0)` → 0 → `Number.isFinite(0) && 0 <= 0` → true → throws `new Error('Invalid amount in webhook payload')`.
3. `handleWebhook`'s try/catch (line 59-63) catches the error, logs it to console, then falls through.
4. Controller returns `200 + {"received":true}`.
5. Stripe dashboard marks the event as succeeded → no retry → **donation silently lost**.

**Live API reproduction (confirmed by Section G of `phase17_stripe_reverify.js`):**

```
POST /api/donations/webhook
  body (signed): checkout.session.completed with metadata.amount='0'
→ status 200, body {"received":true}
→ DB has 0 Donation rows with this stripePaymentId
→ Stripe dashboard: "Webhook delivered successfully" → no retry
→ Donation LOST
```

**Impact:**
- Money-loss bug. Any future code path or Stripe-side quirk that produces a malformed `checkout.session.completed` will result in a missing donation record.
- FYP-defense impact: an examiner who probes the webhook will see "200 OK" and assume it works. The bug only surfaces if the metadata is malformed.

**Proposed fix (Step D — needs client approval):**

Re-throw the error from `processEvent` so the controller can return 500, which signals Stripe to retry:

```js
async function handleWebhook(req) {
  const stripe = getStripe();
  let event;
  try {
    event = verifySignature(req, stripe);
  } catch (err) {
    return { verified: false, error: err.message };
  }
  await processEvent(event);  // let any error bubble up
  return { verified: true };
}
```

Then in the controller (`backend/controllers/stripeWebhookController.js`), allow the error to propagate:

```js
async function stripeWebhook(req, res, next) {
  try {
    const result = await svc.handleWebhook(req);
    if (!result.verified) {
      return res.status(400).json({ success: false, message: `Webhook Error: ${result.error}` });
    }
    res.json({ received: true });
  } catch (e) { next(e); }  // already correct — just need handleWebhook to actually throw
}
```

The existing `errorHandler` middleware (mounted in `server.js`) returns 500 for thrown errors, which is exactly what Stripe wants for retry.

**Verification plan after fix:**
- Live API: webhook with `metadata.amount='0'` → expect 500 (not 200).
- Live API: webhook with valid metadata → still 200 + Donation created.
- Stripe-side: simulated retry of a previously-500'd event should re-process and create the Donation.

---

## BUG-PHASE17-002 — Empty `mosqueId` accepted in online donation → Donation created with no scope (MEDIUM)

**Severity:** MEDIUM — public-list scope leak. The express-validator for `POST /api/donations/online` uses `checkFalsy: true` on `mosqueId`, which treats an empty string as "not provided". So an empty `mosqueId` passes validation, gets forwarded to Stripe as `metadata.mosqueId: ''`, and the webhook (after `isValidObjectId('')` returns false) creates a Donation with `mosqueId: undefined`.

**Locations:**
- `backend/routes/donations.js:28` — `body('mosqueId').optional({ nullable: true, checkFalsy: true })`
- `backend/services/donationsService.js:189` — `mosqueId: input.mosqueId || ''` (forwards empty to Stripe metadata)
- `backend/services/stripeWebhookService.js:26` — `const mosqueId = (meta.mosqueId && isValidObjectId(meta.mosqueId)) ? meta.mosqueId : undefined;`

**Root cause (trace):**
1. POST `/api/donations/online` with `{ ..., mosqueId: '' }`.
2. express-validator: `checkFalsy: true` → empty string treated as omitted → validation passes.
3. `createStripeCheckout(input)` writes `metadata.mosqueId: ''`.
4. User pays on Stripe.
5. Webhook fires: `meta.mosqueId = ''` → `isValidObjectId('')` = false → `mosqueId = undefined`.
6. `Donation.updateOne` upserts with no `mosqueId` field.
7. Admin views: `listAdmin` filters by `mosqueId: { $in: managedIds }` (manager) or `mosqueId: user.mosqueId` (admin) → Donation with `mosqueId: undefined` does NOT match → invisible to admin.
8. Public view: `listPublic` with `?mosqueId=X` filters by that masjid → if called WITHOUT `mosqueId` (e.g. from the marketing stats aggregator), the Donation IS included → **public-leak**.

**Live API reproduction (confirmed by Test 6 of `phase17_stripe_reverify.js`):**

```
POST /api/donations/online
  body: { donorName:'X', amount:500, type:'Sadaqah', mosqueId:'' }
→ status 200, returns valid Stripe URL
→ Webhook would create Donation with mosqueId=undefined
```

(Full end-to-end with webhook not run because the front-end always sends a real mosqueId, so the bug requires a malicious/buggy caller. Still worth fixing.)

**Impact:**
- Currently no real-world trigger: `Donate.jsx` requires `activeMosqueId` before allowing checkout.
- But: the validator should still be strict. A future caller (or attacker) could exploit it.
- Defense in depth: every endpoint that takes a `mosqueId` should validate it strictly.

**Proposed fix (Step D — needs client approval):**

Make the validator strict — empty `mosqueId` should be a 400:

```js
body('mosqueId').optional({ nullable: true }).notEmpty().withMessage('mosqueId cannot be empty').custom((v) => isValidObjectId(v)).withMessage('Invalid mosqueId'),
```

Removed `checkFalsy: true`, added `.notEmpty()` so empty string now fails with a clear message. `.custom(isValidObjectId)` still validates format.

**Verification plan after fix:**
- Live API: POST `/api/donations/online` with `mosqueId: ''` → expect 400 with "mosqueId cannot be empty".
- Live API: POST with valid `mosqueId` → still 200.
- Live API: POST with NO `mosqueId` field at all → still 200 (mosqueId is genuinely optional in the schema; the route just becomes stricter when one is supplied).

---

## Pre-existing (Out of Scope — Phase 17 did not introduce these)

| File:line | Severity | Rule | Discovered in |
|---|---|---|---|
| `frontend/src/components/Admin/Pages/Scholars.jsx:20` | error | `no-empty` | pre-Phase 17 |
| `frontend/src/utils/api.js:43` | error | `no-empty` | pre-Phase 17 |
| `frontend/src/utils/api.js:99` | error | `no-empty` | pre-Phase 17 |
| 7 warnings across Scholars/Transparency/SlotPicker/api.js/report.js | warning | `no-unused-vars` | pre-Phase 17 |
| `backend/tests/integration/committee_scope.test.js:319` | test fail | `TypeError: notifyCommittee is not a function` | pre-Phase 17 (Phase 15) |

---

## NOT FOUND (Confirmed Absent)

- No SQL injection risks (Mongoose ODM + express-validator)
- No XSS risks (sanitizeString on donorName/email/phone in `createStripeCheckout`)
- No webhook signature bypass — verified live (Tests 7, 8)
- No replay-attack double-spend — `updateOne + upsert` by `stripePaymentId` (Test 13)
- No auth bypass — `/api/donations/webhook` intentionally has no auth (Stripe doesn't send JWT), but every other donations route uses `protect + authorize(...)` correctly
- No PKR currency issue — Stripe accepts `currency: 'pkr'` with the current test key (confirmed by Test 2 returning a real Checkout URL)
- No anonymous-leak — verified live (Test 17)
- No cross-mosque donation leak — verified live (Tests 15, 16)

---

**Awaiting partner approval (Step D) on the 2 proposed fixes.**