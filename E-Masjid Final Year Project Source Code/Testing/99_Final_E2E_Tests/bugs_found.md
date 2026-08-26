# 99 Final E2E Tests — bugs found

> Phase 99 — cross-module end-to-end verification. Refilled 2026-08-26 from the
> current state of the codebase. This file lists only bugs that emerged
> **at the seams between modules** — not re-issues already filed inside their
> own phase folder.

## Honesty note

Phase 99 was not run as a separate, dedicated cross-module test pass. The
findings below are **aggregated from the per-phase test results** in the
other `Testing/<NN>_<module>/test_results.md` files plus the live API
re-verification scripts that exercised multi-module flows. No new FIX-E2E
stories are claimed here. Where a cross-module bug was actually fixed in an
earlier phase, it is listed with a pointer to the phase that fixed it.

## Cross-module bugs that were found and fixed during earlier phases

| # | ID | Severity | Modules touched | Symptom | Where it was fixed |
|---|---|---|---|---|---|
| 1 | Phase-21 / BUG-014 | High | Fund requests (Phase 13) + Email (Phase 18) | Two committee members voting within the same millisecond both passed the in-app `votes.member` check, double-voting on the same fund request. Also blocked legitimate re-votes | `backend/services/fundRequestsService.js` — atomic `$concatArrays` aggregation pipeline (2026-08-26) |
| 2 | Phase-21 / BUG-005 | High | Donations (Phase 9) + Transparency (Phase 10) + Admin Dashboard (Phase 19) | Admin Donations & Expenses page hit the public `/api/donations` endpoint and paginated/filtered in the browser. 500 records froze the tab; manager role had no cross-masjid view | `backend/routes/donations.js` + `routes/expenses.js` — new `/admin` endpoints + pagination UI (Phase 21) |
| 3 | Phase-21 / BUG-013 | Medium | Transparency (Phase 10) + Admin Dashboard (Phase 19) | Public Transparency page rendered hardcoded `"+12% from last month"` regardless of actual numbers | `backend/services/donationsService.js` + `expensesService.js` aggregation now returns `thisMonth`/`lastMonth`; `frontend/src/components/User/Pages/Transparency.jsx` computes real trend (Phase 21) |
| 4 | Phase-21 / BUG-015 | Medium | Admin Dashboard (Phase 19) + Donations (Phase 9) | Admin donation rows showed hardcoded `"10:30 AM"` and `"${type} contribution"` instead of real `createdAt` and a `note` field | `frontend/src/components/Admin/Pages/DonationsExpenses.jsx` + `Donation` schema gains `note` (Phase 21) |
| 5 | Phase-21 / BUG-009 | High | Stripe (Phase 17) + Transparency (Phase 10) | Two clicks on "Donate" created two Stripe sessions and could charge the user twice. The success page had no `Donation` row to poll against | `backend/services/donationsService.js#createStripeCheckout` now pre-writes a `pending` donation with a stable `idempotencyKey` (Phase 21) |
| 6 | Phase-21 / BUG-011 | Medium | Donate (Phase 17) + Stripe webhook (Phase 17) + Transparency (Phase 10) | Donate success modal opened immediately on `?success=1`, even if Stripe had not actually completed the charge | `frontend/src/components/User/Pages/Donate.jsx` polls `getDonationBySession` until status=`completed` (Phase 21) |
| 7 | Phase-21 / BUG-010 | High | Stripe webhook (Phase 17) + Admin Dashboard (Phase 19) | Webhook only handled `checkout.session.completed`; refunds and failed payments were silently dropped | `backend/services/stripeWebhookService.js` now dispatches `charge.refunded` and `payment_intent.payment_failed` (Phase 21) |

## Cross-module negative space (probed, not broken)

These scenarios are deliberately exercised in the per-phase suites and
confirmed safe. They are listed so a future examiner can probe them quickly:

- **Cross-mosque admin scope**: every admin endpoint (`/api/donations/admin`,
  `/api/expenses/admin`, `/api/events/admin`, `/api/announcements/admin`,
  `/api/fund-requests`, `/api/committee`) returns 403 when probed with
  another masjid's id. Covered by `backend/tests/integration/donations_scope.test.js`,
  `nikah_scope.test.js`, `scholars_scope.test.js`, `committee_scope.test.js`,
  and `fund_voting.test.js`.
- **Email recipients**: when an Al-Noor fund request fires, only Al-Noor
  active committee members receive the email. Al-Rahman committee is NOT
  CC'd even when the requester is also a member of Al-Rahman. Confirmed in
  Phase 18 re-verification (`bugs_found.md` rows 4 and 5).
- **Webhook idempotency**: replaying the same Stripe
  `checkout.session.completed` event N times produces exactly one Donation
  row. Confirmed by `backend/tests/integration/donations_scope.test.js`.
- **Vote race**: two committee members clicking Approve within the same
  millisecond both register, no votes lost (Phase 21 BUG-014 atomic
  aggregation pipeline). Covered by `fund_voting.test.js`.
- **Finalize race**: two admin tabs clicking Finalize — one wins, the other
  gets 409. Covered by `fund_voting.test.js` ("cannot finalize already-finalized
  request").

## Open risks (deferred)

- The 143-item NFR backlog from `Testing/21_NFRs_Module/bugs_found.md` is
  non-blocking for the FYP demo (compression middleware, rate-limit wiring,
  helmet algorithm pinning, multer magic-byte check, cache headers,
  structured logging, etc.).
- Frontend has no Jest suite. The closest automated check is
  `cd frontend && npm run lint`.
