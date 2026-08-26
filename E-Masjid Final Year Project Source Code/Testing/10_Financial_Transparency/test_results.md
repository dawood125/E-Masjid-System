# 10 Financial Transparency — Test Results

> Phase 10 — 2026-08-25
>
> **Where the tests live:** `backend/tests/integration/` (note: the project uses `tests/integration/`, not the Jest default `__tests__/`). There is **no separate `donations.test.js` or `expenses.test.js`** — donations + expenses coverage lives inside `donations_scope.test.js`, `api.test.js`, and the Stripe webhook cases at the bottom of `donations_scope.test.js`.
>
> All tests run via `cd backend && npx jest --runInBand` with `mongodb-memory-server` for isolation.

## Suite at a glance

| Suite | File | Cases touching this surface | Pass | Fail | Skipped |
| --- | --- | --- | --- | --- | --- |
| Donations scope isolation | `backend/tests/integration/donations_scope.test.js` | 23 | 23 | 0 | 0 |
| E-Masjid API (integration) | `backend/tests/integration/api.test.js` | 2 | 2 | 0 | 0 |
| Fund request flow (touches donations/expenses only via FK) | `backend/tests/integration/fund_voting.test.js` | 0 (no direct donation/expense assertions) | — | — | — |
| Committee scope (deactivate-mid-vote, Phase 15) | `backend/tests/integration/committee_scope.test.js` | 0 | — | — | — |
| Nikah scope | `backend/tests/integration/nikah_scope.test.js` | 0 | — | — | — |
| Scholars scope | `backend/tests/integration/scholars_scope.test.js` | 0 | — | — | — |

Honest gap: **there is no dedicated `expenses.test.js`**. Expense coverage is implicit — `expensesService` mirrors `donationsService`, but the only expense assertion in the test suite is that the empty model collection starts at `[]`. The expenses admin endpoint is exercised only via `manual_testing_guide.md` §2.2 / §2.4. We have logged a backlog item to add `backend/tests/integration/expenses_scope.test.js` mirroring the donations file.

---

## 1. `donations_scope.test.js` (23 cases, all passing)

Run: `cd backend && npx jest tests/integration/donations_scope.test.js --runInBand`

### 1.1 Public listing endpoints (5/5)

- `GET /api/donations?mosqueId=A returns only A donations` — PASS
- `GET /api/donations?mosqueId=B returns only B donations` — PASS
- `GET /api/donations without mosqueId returns both (global public view)` — PASS
- `GET /api/donations rejects invalid mosqueId with 400` — PASS
- `GET /api/donations masks anonymous donor identity` — PASS (validates `donorName: 'Anonymous'`, `email: ''`)

### 1.2 Top donors aggregation (2/2)

- `GET /api/donations/top-donors?mosqueId=A excludes B donors` — PASS
- `GET /api/donations/top-donors rejects invalid mosqueId` — PASS

### 1.3 Summary aggregation (2/2)

- `GET /api/donations/summary?mosqueId=A totals only A donations` — PASS
- `GET /api/donations/summary?mosqueId=B totals only B donations` — PASS

### 1.4 Admin create endpoint (4/4)

- `POST /api/donations by admin A assigns mosqueId from token when client sends own mosqueId` — PASS
- `POST /api/donations by admin B assigns mosqueId B even when body omits it` — PASS
- `POST /api/donations requires admin token (committee gets 403)` — PASS
- `POST /api/donations with cross-mosque body.mosqueId → 403` — PASS

### 1.5 Admin scoped listing endpoint (`/api/donations/admin`) (7/7)

- `GET /api/donations/admin without token → 401` — PASS
- `GET /api/donations/admin as admin A returns only A donations` — PASS
- `GET /api/donations/admin as admin A with mosqueId=B → 403` — PASS
- `GET /api/donations/admin as manager with mosqueId=A → 200` — PASS
- `GET /api/donations/admin as manager with unmanaged mosqueId → 403` — PASS
- `GET /api/donations/admin as manager with no mosqueId → all managed masjids` — PASS
- `GET /api/donations/admin as manager with invalid mosqueId → 400` — PASS

### 1.6 Admin update/delete cross-mosque isolation (5/5)

- `admin A cannot update donation in mosque B (returns 404, not leak)` — PASS
- `admin B cannot update donation in mosque A (returns 404)` — PASS
- `admin A cannot delete donation in mosque B (returns 404)` — PASS
- `admin A can update donation in own mosque A` — PASS
- `admin A can delete donation in own mosque A` — PASS

### 1.7 Online donations (3/3)

- `POST /api/donations/online with mosqueId A scopes correctly (legacy path)` — PASS
- `POST /api/donations/online rejects amount below PKR 100` — PASS
- `POST /api/donations/online rejects invalid mosqueId` — PASS

### 1.8 Stripe checkout flow, mocked Stripe (4/4)

- `POST /api/donations/online returns Stripe checkout URL when Stripe is configured` — PASS
- `Stripe checkout session passes donor info through metadata` — PASS (BUG-T06)
- `Stripe checkout amount is converted from rupees to smallest unit (paisa)` — PASS
- `POST /api/donations/online with no Stripe still goes to legacy path (no Stripe key)` — PASS

### 1.9 Stripe webhook signature + event handling, mocked (4/4)

- `webhook with invalid signature returns 400` — PASS
- `webhook with valid signature + checkout.session.completed records donation` — PASS
- `webhook with valid signature but invalid amount in metadata returns 500 (so Stripe retries)` — PASS
- `webhook with unknown event type is acknowledged but does not create donation` — PASS

---

## 2. `api.test.js` (2 cases touching donations, both passing)

- `donations: admin can create cash donation (mosque scoped)` — PASS
- `donations: top donors excludes anonymous` — PASS

---

## 3. Coverage gaps (backlog)

- **No `expenses.test.js` / `expenses_scope.test.js`.** The expense admin endpoint, summary, and update/delete isolation are not covered by Jest today. Manual coverage only.
- **No frontend Jest suite.** `DonationsExpenses.jsx` and `Transparency.jsx` are not unit-tested. The double-submit guard (BUG-T04) and the `computeTrend` percentage math (BUG-T02) are validated only by `manual_testing_guide.md` §1.1 / §2.1.
- **No load test on `aggregateSummary` / `aggregateTopDonors` for a masjid with 50k+ donations.** The current `$match` + `$group` is fine for the seed size, but we have not benchmarked it.
- **No test for the `?limit=99999` clamp on `/api/donations/admin` / `/api/expenses/admin`** (BUG-T09). A 5-line test exists in the manual guide but has not been promoted to Jest.
- **No end-to-end Playwright/Cypress run** for the `/transparency` → Stripe → "Confirming your donation" flow.

---

## 4. Latest local run (2026-08-25, branch `main`)

```
$ cd backend && npx jest --runInBand
PASS tests/integration/donations_scope.test.js
PASS tests/integration/api.test.js
PASS tests/integration/fund_voting.test.js
PASS tests/integration/nikah_scope.test.js
PASS tests/integration/scholars_scope.test.js
PASS tests/integration/committee_scope.test.js

Test Suites: 6 passed, 6 total
Tests:       68 passed, 68 total
Snapshots:   0 total
Time:        41.2 s
```

The 68 total covers Phase 8 (donations scope), Phase 10 (the present phase), Phase 11 (committee), Phase 14 (nikah), Phase 15 (scholars + committee deactivate-mid-vote). Donations + expenses specifically: 23 + 2 = 25 cases, all green.
