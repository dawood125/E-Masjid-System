# 21 NFRs — Test Results

> Pass/fail state of the test suite that covers Phase 21 fixes as of 2026-08-26.

This file is intentionally lightweight. The Jest integration suite under
`backend/tests/integration/` is the source of truth for automated coverage;
this file just summarises what runs against the Phase 21 fixes specifically.

## Backend Jest integration suite

Run: `cd backend && npm test`

| Suite | Covers Phase 21 fix | Pre-Phase-21 state | Post-Phase-26 state |
|---|---|---|---|
| `tests/integration/fund_voting.test.js` | BUG-014 (vote re-vote + race) | 1 failed (re-vote) | PASS |
| `tests/integration/donations_scope.test.js` | BUG-009 / BUG-010 (idempotency, refund webhook) | 1 failed (invalid-amount webhook returned 200) | PASS |
| `tests/integration/committee_scope.test.js` | E2E exercise of voting path | 21 failed (MMS binary timeout) | PASS after fixing the MMS binary lookup |
| `tests/integration/api.test.js` | BUG-008 (mongo reconnect) | PASS | PASS |
| `tests/integration/nikah_scope.test.js` | unaffected by Phase 21 | PASS | PASS |
| `tests/integration/scholars_scope.test.js` | unaffected by Phase 21 | PASS | PASS |

## Manual regression checks (per bug)

| Bug | Manual check | Result |
|---|---|---|
| BUG-001 | `/api/announcements?limit=3&page=1` returns `{data, total, page, totalPages}` | PASS |
| BUG-002 | `/api/events?limit=2&page=1` returns paginated; `/api/events/:id/registrations` returns the populated list | PASS |
| BUG-003 | `/api/fund-requests?status=pending` returns paginated aggregation with `reviewedBy`/`finalizedBy`/`voteMembers` populated | PASS |
| BUG-004 | Home.jsx Network panel shows `limit=2` / `limit=3` on the public calls | PASS |
| BUG-005 | `/api/donations/admin?page=1&limit=20&type=Zakat` returns paginated | PASS |
| BUG-006 | `.env` `JWT_SECRET` is 60+ char base64url; rotation procedure documented in `.env.example` | PASS |
| BUG-007 | `/api/auth/login` sets `HttpOnly` cookie; `POST /api/auth/logout` clears it; protected routes accept the cookie alone | PASS |
| BUG-008 | Pause + resume MongoDB → `[mongo] reconnected` logged; `/api/health` returns 200 after resume | PASS |
| BUG-009 | Replaying the same donation POST twice returns the same Stripe session (idempotency key) | PASS |
| BUG-010 | `stripe trigger charge.refunded` and `stripe trigger payment_intent.payment_failed` both update the Donation row | PASS |
| BUG-011 | Donate page polls `/api/donations/by-session/:id` after `?success=1&session_id=…`; spinner closes once status=`completed` | PASS |
| BUG-012 | Save button in Donations/Expenses modal disables while in flight; double-click is a no-op | PASS |
| BUG-013 | Transparency page shows the real trend (signed percentage vs last month) instead of the hardcoded `+12%` | PASS |
| BUG-014 | Two consecutive votes from the same committee member now REPLACE the first (200), not 409 | PASS |
| BUG-015 | Admin Donations rows show real `createdAt` time and the `note` field (or `${type} contribution` fallback) | PASS |

## What this suite does NOT cover

- The 143-item NFR backlog (compression, rate-limit wiring, helmet algorithm
  pinning, multer magic-byte check, cache headers, structured logging, etc.)
  is tracked as **non-blocking** in `bugs_found.md` and explicitly not part
  of the FYP defense surface.
- No frontend Jest suite exists. Frontend lint (`cd frontend && npm run lint`)
  is the closest thing to an automated check.

## Honest note

At the time of writing, the Phase 21 changes themselves are not covered by a
dedicated Jest suite — the coverage above comes from the existing integration
suites whose assertions tightened to fail without the Phase 21 fixes. Adding
explicit `tests/integration/nfr_phase21.test.js` would be the next step but
is out of scope per the "no new features" rule.
