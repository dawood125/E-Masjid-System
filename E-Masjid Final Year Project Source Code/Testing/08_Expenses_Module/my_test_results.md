# Phase 8 — Expenses Module: my test results

Run 1 (user + partner, before fixes):

| Scenario | Status | Notes |
|---|---|---|
| A. Public Expenses filter | **Failed** | No category filter on expenses tab |
| B. Public Summary aggregation | Passed | Summary card correct |
| C. Admin CRUD | Not run | — |
| D. Cross-mosque authorization | Not run | — |
| E. Super admin scope | Not run | — |
| F. Form validation | Not run | — |
| G. Anonymity | Skipped | N/A for expenses |

Run 2 (after fixes — partial retest, user discretion):

| Scenario | Status | Notes |
|---|---|---|
| A. Public Expenses filter | **Passed** | Category chips + month filter now applied to expenses |
| B. Public Summary aggregation | Passed | Unchanged |
| View All button | **Passed** | Loads up to 100 rows; Collapse button works |
| Download Report | **Passed** | CSV downloads with sections, opens in Excel cleanly |
| Forgot password | **Passed** | Reset email delivered to inbox via Gmail SMTP |
| City filter masjid selection | **Passed** | Substring match works (e.g. "sheikh" → all 4) |
| C. Admin CRUD | Pending retest | Will verify after user commits |
| D. Cross-mosque authorization | Pending retest | — |
| E. Super admin scope | Pending retest | — |
| F. Form validation | Pending retest | — |

## Backend scope isolation

Server-side verification (per-phase regression):

- `backend/tests/integration/api.test.js` — 11/11 pass
- `backend/tests/integration/donations_scope.test.js` — 20/20 pass (Phase 9, future-proof)
- Total: 31/31 integration tests pass

## Live smoke (verified)

- Forgot password: 200 OK, email delivered to dawood.bhatti8812@gmail.com
- `GET /api/expenses?mosqueId=Al-Noor&category=Salary` → 1 row
- `GET /api/expenses?mosqueId=Al-Noor&category=Utilities` → 1 row
- `GET /api/expenses?mosqueId=Al-Noor&month=august` → 4 rows
- `GET /api/mosques/search?city=sheikh` → 4 matches (was 0 before fix)
- `GET /api/mosques/search?city=Lahore` → 0
- `GET /api/mosques/search?city=xyz` → 0
