# 99 Final E2E Tests — bugs fixed

> Phase 99 — refilled 2026-08-26.

## Summary

Phase 99 is **not** a separate bug-fix phase. The cross-module bugs that
existed were fixed in their respective phases (Phase 13 for the fund-request
race, Phase 17 for the Stripe webhook gaps, Phase 19 for the dashboard
hardcodes, Phase 21 for the NFR-level atomicity / pagination / JWT / Stripe
hardening). The pointers below are the canonical fix records — there are no
FIX-E2E-NNN entries here.

## Cross-module fixes applied in earlier phases

| Cross-module concern | Fixed in | What changed |
|---|---|---|
| Fund-request vote race + blocked re-votes | Phase 21 (BUG-014) | `backend/services/fundRequestsService.js#castVote` now uses an aggregation-pipeline `$concatArrays` update so a member's prior vote is atomically replaced (not rejected with 409). Race safety preserved. |
| Admin Donations/Expenses hitting public endpoint | Phase 21 (BUG-005) | New `/api/donations/admin` and `/api/expenses/admin` endpoints; `DonationsExpenses.jsx` switched to admin endpoints with server-side pagination + filters. |
| Hardcoded `+12% from last month` | Phase 21 (BUG-013) | `donationsService.aggregateSummary` + `expensesService.aggregateSummary` now return `thisMonth`/`lastMonth`. `Transparency.jsx` computes signed percentage + green/red/gray icon. |
| Hardcoded `10:30 AM` + `${type} contribution` in admin tables | Phase 21 (BUG-015) | New `formatRecordTime` + `recordNote` helpers; `Donation` model gained `note`; admin rows show real `createdAt` and `note` (or `${type} contribution` fallback). |
| Stripe checkout had no idempotency / no PendingDonation | Phase 21 (BUG-009) | `donationsService.createStripeCheckout` generates `crypto.randomBytes(12)`, pre-writes a `pending` Donation with `stripeSessionId: idempotencyKey`, and passes the same string to Stripe's `idempotencyKey`. |
| Webhook only handled `checkout.session.completed` | Phase 21 (BUG-010) | `stripeWebhookService` now dispatches `handleChargeRefunded` and `handlePaymentFailed`. Errors during processing return `processed: false` so Stripe retries. |
| Donate success modal opened before webhook confirmed | Phase 21 (BUG-011) | `Donate.jsx` polls `getDonationBySession(sessionId)` every 1.5s (max 20 attempts ≈ 30s) until status=`completed`, with timeout / cancel / fail modals. |
| JWT in localStorage (XSS-readable) | Phase 21 (BUG-007) | JWT moved to httpOnly cookie; `api.js` uses `credentials: 'include'`; `AuthContext.logout()` calls `api.logout()` first. |
| MongoDB had no retry / reconnect handlers | Phase 21 (BUG-008) | `config/db.js` rewritten with `connectWithRetry` (5 attempts, exponential backoff) + connection event handlers. |

## What this file does NOT claim

- No "FIX-E2E-NNN" issues. Those numbers were never assigned. The Phase 99
  cross-module sweep was not a separate work item — the cross-module bugs
  were caught and fixed inside the per-phase tests.
- No new commits in this phase. Every fix listed above has an existing
  commit in the appropriate phase's branch.

## Regression state after the Phase 99 cross-module sweep

The cross-module checks that re-run after every per-phase fix all passed
as of 2026-08-26. The canonical evidence is in each phase's
`test_results.md` plus the live API re-verification scripts.

## Conclusion

The system passed the cross-module sweep by virtue of the per-phase suites
already exercising the cross-module flows (fund-request lifecycle, Stripe
donation webhook, multi-tenant scope). No additional fixes are required.
