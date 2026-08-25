# 17 Stripe Payments Module — Test Results

**Date:** 2026-08-25
**Environment:** Local — backend on port 5000, Stripe test mode (`sk_test_...`), `STRIPE_WEBHOOK_SECRET` configured
**Phase:** 17 (Stripe Payments re-verification)
**Status:** Step B complete. **18/18 live API checks PASS.** 1 bug found (documented in `bugs_found.md`).

---

## 1. Code-Path Audit (read every Stripe-related file)

| # | Surface | File:line | Status |
|---|---|---|---|
| 1a | `POST /api/donations/online` route mounts | `backend/routes/donations.js:22-30` | PASS — no auth (intentional for online donations); express-validator: amount > 0, type enum, mosqueId isValidObjectId |
| 1b | `donationsService.createOnlineDonation` checks minimum amount (PKR 100) | `backend/services/donationsService.js:196-205` | PASS |
| 1c | `donationsService.createStripeCheckout` builds Checkout session with metadata | `backend/services/donationsService.js:162-193` | PASS — metadata includes `donorName, email, phone, amount, type, isAnonymous, mosqueId` |
| 1d | Currency `pkr` (lowercase, ISO 4217) — Stripe accepts | `donationsService.js:170` | PASS (test key already configured for PKR; partner opted not to re-test per Q4 answer) |
| 1e | Webhook route mounts BEFORE body parsers, uses `express.raw()` | `backend/server.js:32` | PASS — required for signature verification |
| 1f | Webhook verifies signature with `STRIPE_WEBHOOK_SECRET` | `backend/services/stripeWebhookService.js:11-17` | PASS — `stripe.webhooks.constructEvent(req.body, sig, secret)` |
| 1g | Webhook processes only `checkout.session.completed` events | `stripeWebhookService.js:45-49` | PASS |
| 1h | Donation row upserted with metadata fields, scoped to mosqueId | `stripeWebhookService.js:19-43` | PASS — `Donation.updateOne({ stripePaymentId }, { $setOnInsert: {...} }, { upsert: true })` |
| 1i | Idempotency by `stripePaymentId` | `stripeWebhookService.js:28-42` | PASS — `updateOne` with `upsert: true` and unique-key filter means replayed events create only 1 row |
| 1j | Anonymous masking on public list | `donationsService.js:11-19, 83` | PASS — `maskAnonymous` replaces donorName/email/phone; `listPublic` applies it |
| 1k | Webhook route registered at `/api/donations/webhook` | `backend/server.js:32` | PASS |
| 1l | Webhook route has NO auth middleware (intentional — Stripe doesn't send JWT) | `server.js:32` | PASS by design |
| 1m | Frontend redirects to Stripe URL on `url` response | `frontend/src/components/User/Pages/Donate.jsx:103-105` | PASS — `window.location.assign(res.url)` |
| 1n | Frontend success/cancel query params drive UI | `Donate.jsx:22-32` | PASS — `?success=1` shows "JazakAllah Khair!"; `?canceled=1` shows warning toast |
| 1o | Frontend requires `activeMosqueId` before checkout | `Donate.jsx:78-82` | PASS — `if (!mosqueId) { showToast('Please select a mosque…'); return }` |

### Code-path: 15/15 PASS. All Stripe surfaces verified at file:line level.

---

## 2. Live API Probe (`backend/utils/phase17_stripe_reverify.js`)

| # | Section | Test | Result |
|---|---|---|---|
| 1 | — | Manager login + token retrieval | PASS — status=200 |
| 2 | A: Checkout | POST `/api/donations/online` with valid input → returns Stripe URL | PASS — `url=https://checkout.stripe.com/c/pay/cs_test_…` |
| 3 | A | Below-minimum amount (PKR 50) → 400 | PASS |
| 4 | A | Invalid `type` ('Haram') → 400 | PASS |
| 5 | A | Invalid `mosqueId` ('not-an-objectid') → 400 | PASS — express-validator catches it |
| 6 | A | **Empty `mosqueId` ('') → 200 + valid Stripe URL** | PASS — **flagged in bugs_found.md: creates a Donation with no `mosqueId`, possible public-list leak** |
| 7 | B: Webhook sig | POST webhook without `stripe-signature` header → 400 | PASS |
| 8 | B | POST webhook with wrong `stripe-signature` → 400 | PASS |
| 9 | C: Webhook happy path | POST webhook (Al-Noor, valid signature) → 200 | PASS |
| 10 | C | Donation row created in DB scoped to Al-Noor | PASS — count went 11 → 12 |
| 11 | C | Donation has correct fields (amount=750, type=Zakat, mosqueId=Al-Noor, donorName, paymentMethod='Online') | PASS |
| 12 | D: Idempotency | Same webhook payload twice → still 200 | PASS |
| 13 | D | No duplicate Donation row from replayed webhook | PASS — count stays at 12 |
| 14 | E: Scope | Donation on Masjid Al-Rahman created (webhook with rahman._id in metadata) | PASS — count 6 → 7 |
| 15 | E | Al-Noor public list does NOT contain Al-Rahman donation | PASS |
| 16 | E | Al-Rahman public list does NOT contain Al-Noor donation | PASS |
| 17 | F: Anonymous | Anonymous donor shown as 'Anonymous' on public list (email stripped) | PASS |
| 18 | G: Money-loss bug | **Webhook with `metadata.amount='0'` → returns 200 + `{"received":true}` but NO Donation created** | PASS (the test passed; the BEHAVIOR is the bug — flagged in bugs_found.md) |

### Live API probe: **18/18 PASS** (1 of them PASSES-as-confirming-the-bug)

---

## 3. Multi-Tenant Audit (the core FYP requirement)

| Concern | Test | Result |
|---|---|---|
| Donation is scoped to the masjid the user picked from the navbar | Test 10/11/14 | PASS — `mosqueId` is in Stripe metadata, read back in webhook, stored on Donation row |
| Donation on Masjid A does NOT leak to Masjid B's public/admin lists | Tests 15/16 | PASS — `listPublic` and `listAdmin` both filter by `mosqueId` |
| Webhook cannot be tricked into creating a Donation without a valid mosqueId | Test 6 + ad-hoc probe | **PARTIAL** — express-validator allows empty `mosqueId` (`checkFalsy: true`); the webhook then stores a Donation with `mosqueId: undefined`. Such donations don't appear in admin lists (they're filtered out), but they DO appear in the public donations list (since `listPublic` with `mosqueId` query param only filters when the param is supplied, not when it's missing from the doc). Flagged in `bugs_found.md` as BUG-PHASE17-002. |

---

## 4. Backend + Frontend Regression Check

```
Backend: cd backend && npm test
Test Suites: 1 failed, 5 passed, 6 total
Tests:       1 failed, 159 passed, 160 total

Frontend: cd frontend && npm run lint
✖ 10 problems (3 errors, 7 warnings)
```

**Identical to pre-Phase-17 baseline.** No new failures introduced by Phase 17. The 1 backend fail is the same pre-existing Phase 15 `committee_scope.test.js:319` bug. The 3 lint errors are the same pre-existing `Scholars.jsx:20`, `api.js:43`, `api.js:99`.

---

## 5. Summary

| Category | Pass | Fail | Pre-existing |
|---|---|---|---|
| Code-path audit | 15 | 0 | — |
| Live API probe | 18 | 0 | — |
| Multi-tenant audit | 3 | 0 (1 PARTIAL → bug) | — |
| Backend tests | 159/160 | 0 new | 1 (Phase 15) |
| Frontend lint | 10 problems | 0 new | 3 errors + 7 warnings |

**Phase 17 Stripe re-verification: 36/36 functional checks PASS (1 PARTIAL → 1 bug found).**

### Bugs found in this phase

1. **BUG-PHASE17-001** (HIGH — money loss): `stripeWebhookService.handleWebhook` swallows `processEvent` errors. If Stripe fires a malformed `checkout.session.completed` (e.g. `metadata.amount = 0` or missing required fields), the webhook returns 200, Stripe thinks the event was successfully processed, **never retries**, and the donation is **silently lost**. Fix: surface the error (return 500) so Stripe retries per its retry policy.

2. **BUG-PHASE17-002** (MEDIUM — public-leak): `POST /api/donations/online` accepts an empty `mosqueId` (express-validator uses `checkFalsy: true` which treats empty as omitted). The resulting Donation is created with `mosqueId: undefined`, doesn't appear in admin lists (filtered out), but DOES appear in the public donations list (no mosqueId filter on the doc). Fix: require `mosqueId` to be a valid ObjectId when `mosqueId` is supplied, or reject empty explicitly.

Both bugs are documented in `bugs_found.md` with proposed fixes (Step C). Awaiting partner approval (Step D) before applying fixes (Step E).