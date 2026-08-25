# 19 Admin Dashboard + Reports Module — Questions Asked

> **Status:** Step A — answers received 2026-08-25. Proceeding to Step B.
> **Context:** Partner already tested admin dashboard during Phase 6/7 and DonationsExpenses during Phase 9/10. This phase is a **focused re-verification rollup**, not a from-scratch test.
> **Date:** 2026-08-25

---

## Partner Answers

| # | Question | Partner Answer |
|---|---|---|
| Q1 | Phase scope | **(C) Admin Dashboard + DonationsExpenses + CSV report download** — full scope: 6 dashboard endpoints + month/type/category filters + CSV export |
| Q2 | Verify depth | **(C) Live API probe + manual browser download** — probe all endpoints + open admin page in browser and click Download CSV, confirm contents match on-screen data |
| Q3 | Edge cases | **(D) Happy + scope + month filter + CSV integrity** — admin A doesn't see Masjid B data, month filter changes totals correctly, CSV download produces valid file with all sections |
| Q4 | Data source | **(B) Use live MongoDB data** — use real donations/expenses already in the live DB from prior testing, run probe against actual data |

---

## Scope summary (so we're aligned)

**Phase 19 = 2 surfaces:**

### Surface 1 — Admin Dashboard (`/admin/dashboard`)
**File:** `frontend/src/components/Admin/Pages/Dashboard.jsx` (309 lines)
**Data sources (6 endpoints called in parallel on load):**
1. `GET /api/donations?mosqueId=X` → list of donations
2. `GET /api/expenses?mosqueId=X` → list of expenses
3. `GET /api/events?mosqueId=X` → list of events
4. `GET /api/nikah-bookings` → list of nikah bookings
5. `GET /api/donations/summary?mosqueId=X` → `{totalDonations}`
6. `GET /api/expenses/summary?mosqueId=X` → `{totalExpenses}`

**Computed in UI:**
- Total Donations / Total Expenses / Balance (donations − expenses)
- Pending Nikah count (filtered from nikahBookings where `status === 'pending'`)
- Upcoming Events count (events with `date` in next 7 days)
- Recent Donations (top 3 by date)
- Recent Expenses (top 3 by date)

### Surface 2 — Donations + Expenses + CSV report (`/admin/donations`)
**File:** `frontend/src/components/Admin/Pages/DonationsExpenses.jsx` (699 lines) + `frontend/src/utils/report.js` (160 lines)
**Data sources (filters):**
1. `month` (YYYY-MM) — filters by `createdAt` month
2. `type` (Sadaqah/Zakat/Masjid Fund) — filters donation type
3. `category` (Maintenance/Utilities/...) — filters expense category

**CSV output sections (from `report.js#buildReportPayload`):**
1. Meta (title, mosque name, generation timestamp, filters applied)
2. Donations Summary (total + by-type breakdown)
3. Top Donors (rank, name, total, count)
4. Recent Donations (date, donor, type, method, amount, anonymous)
5. Expenses Summary (total + by-category breakdown)
6. Recent Expenses (date, category, description, amount)
7. Net Balance (donations − expenses)

**Filename pattern:** `e-masjid-report-<safe-mosque-name>-YYYY-MM-DD.csv` with UTF-8 BOM for Excel compatibility.

---

## Re-verification focus

Per Q3 = Happy + scope + month filter + CSV integrity:

1. **Happy path:** All 6 dashboard endpoints return 200 with expected shape, Dashboard renders
2. **Scope isolation:** Admin of Masjid A only sees Masjid A data (not B/C/D)
3. **Month filter:** Changing the month filter changes the totals correctly
4. **CSV integrity:** Click Download CSV in browser, verify file opens in Excel, all 7 sections present, totals match on-screen data, anonymous masking works

Per Q2 = Live API probe + manual browser download:

- **Probe:** Hits all 6 endpoints + computes totals in MongoDB and compares
- **Manual:** User opens `/admin/donations` in browser, picks Masjid Al-Noor, picks month, clicks Download CSV, opens the file, verifies the 7 sections and totals

Per Q4 = live data:

- Use donations/expenses already in live DB from prior testing (the system has Phase 9 + Phase 17 test donations already inserted)
- No fresh seed needed

---

## Pre-flight notes (no questions, just FYI)

I already explored the relevant files and found:

- `frontend/src/components/Admin/Pages/Dashboard.jsx` uses `getActiveMosqueId() || user?.mosqueId` for the mosqueId filter — relies on MosqueContext being set
- `formatCurrency` + `formatDate` from `frontend/src/utils/formatters.js` are used everywhere
- The CSV download uses `URL.createObjectURL` + a programmatic `<a download>` click — classic browser-only pattern
- Anonymous donations show as 'Anonymous' in CSV (confirmed in `report.js:80`)
- The CSV has a UTF-8 BOM (`﻿`) so Excel auto-detects encoding

I'm proceeding to Step B (probe).