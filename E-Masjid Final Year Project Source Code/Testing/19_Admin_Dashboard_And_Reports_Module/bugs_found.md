# 19 Admin Dashboard + Reports Module — Bugs Found

> Step C — 2026-08-25

---

## Summary

**3 bugs found** during the live API re-verification (25/25 checks completed — the 3 bug-documenting checks PASS because they confirmed the bugs exist, not because they're benign).

| Severity | Bug | Surface |
|---|---|---|
| **HIGH** | BUG-PHASE19-001 — `/api/expenses` has NO admin scope enforcement (admin of Masjid A can fetch Masjid B expenses) | Backend security |
| **MEDIUM** | BUG-PHASE19-002 — `monthIndex("YYYY-MM")` returns NaN → 400 CastError "Resource not found" instead of clear validation message | Backend UX |
| **LOW** | BUG-PHASE19-003 — Admin Dashboard / DonationsExpenses show hardcoded "+12% this month" / "+5% this month" labels next to ALL-TIME totals (label says "month" but number is lifetime) | UI accuracy |

All 3 are real issues that should be fixed before FYP defense.

---

## BUG-PHASE19-001 — `/api/expenses` has NO admin scope enforcement (HIGH security)

**Why this is a bug:**

`backend/routes/expenses.js` exposes a public GET that any authenticated user can hit with any `mosqueId`. There is no `/api/expenses/admin` endpoint that locks admins to their own masjid, unlike `/api/donations/admin` which does enforce scope.

The frontend admin DonationsExpenses page only calls `/api/expenses` with the admin's own `mosqueId`, so the leak isn't currently triggered through normal UI flow. But:
- A malicious admin can craft a request with any masjidId → reads that masjid's private expenses
- A committee member / scholar can also read other masjids' expenses (less critical since they're less privileged but still a leak)

### Live API confirmation

```
[PASS] 9. **BUG-PHASE19-001** /api/expenses has NO admin scope (doesn't deny cross-masjid) — status=200
[PASS] 9b. /api/expenses without mosqueId returns ALL masjids (no implicit scope) — noFilter.total=4, alNoor.total=4
```

Admin of Al-Noor queried `/api/expenses?mosqueId=<Al-Rahman-id>` → 200 (not 403). Compare to `/api/donations/admin?mosqueId=<Al-Rahman-id>` → 403 (correctly denied).

### Files

- `backend/routes/expenses.js:8-9` — only `/` and `/summary` routes, no `/admin`
- `backend/controllers/expensesController.js:9-17` — calls `listPublic` for both, no role check
- `backend/services/expensesService.js:14-32` — `listPublic` accepts any `mosqueId`, no user check

### Proposed fix

Add an `/api/expenses/admin` route that mirrors `/api/donations/admin`'s scope enforcement:
```js
router.get('/admin', protect, authorize('admin', 'manager'), ctrl.listAdmin);
```

And in `expensesService.js`, add a `listAdmin(query, user)` function that:
- Locks non-manager admins to their own `user.mosqueId`
- Throws 403 if `mosqueId` in query doesn't match (for admins)
- Allows managers to pick any of their masjids

---

## BUG-PHASE19-002 — `monthIndex("YYYY-MM")` returns NaN → 400 CastError (MEDIUM)

**Why this is a bug:**

`backend/services/donationsService.js:21-23` and `backend/services/expensesService.js:10-12` use this:
```js
function monthIndex(month) {
  return new Date(`${month} 1, 2026`).getMonth() + 1;
}
```

If a caller passes `"2026-08"` (a sensible "year-month" format), JavaScript can't parse `"2026-08 1, 2026"` → `Invalid Date` → `getMonth()` returns NaN. The resulting `$expr` filter `{ $eq: [{ $month: '$createdAt' }, NaN] }` throws a Mongoose CastError which the error handler maps to **400 "Resource not found"** — totally misleading.

Today this is masked by the fact that:
- The admin DonationsExpenses page filters **client-side** (no `month` param sent) — so this code path is unused by the admin UI
- The public Transparency page sends month names like `"august"` (full English month name, lowercased) via `toLocaleDateString('en-US', { month: 'long' }).toLowerCase()` — that format happens to work

But anyone hitting the API directly with `month=2026-08` or `month=08` (numeric) gets a confusing 400. Should validate format and return a clear 400 with `"Invalid month format. Use full English month name like 'august'."`.

### Live API confirmation

```
[PASS] 24. **BUG-PHASE19-002** /api/donations/admin?month=2026-08 (YYYY-MM format) → 400 CastError — msg="Resource not found"
```

### Files

- `backend/services/donationsService.js:21-23`
- `backend/services/expensesService.js:10-12`

### Proposed fix

Replace `monthIndex` with a robust parser:
```js
function monthIndex(month) {
  if (!month || month === 'all') return null;
  const lower = String(month).toLowerCase();
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const idx = monthNames.indexOf(lower);
  if (idx === -1) throw httpError(400, "Invalid month format. Use 'january' through 'december' (full month name).");
  return idx + 1;
}
```

---

## BUG-PHASE19-003 — Hardcoded month-over-month % labels next to ALL-TIME totals (LOW UI accuracy)

**Why this is a bug:**

The Admin Dashboard and DonationsExpenses pages show "trend" labels like "+12% this month" and "+5% this month" — but these are **hardcoded strings**, not computed from data. The actual total next to them is ALL-TIME, not this-month.

So the UI says:
> Total Donations: PKR 35,400  
> 📈 +12% this month

But `+12%` has no relation to the number. It's literally a static placeholder. An examiner looking at this for the first time would assume the system computed it.

This is the only known "UI lying about math" bug in the codebase. FYP-defense risk: low (visual only), but a careful examiner might pause on it.

### Live API / source confirmation

```
[PASS] 18. Dashboard "+12% this month" hardcoded (no computation)
[PASS] 19. Dashboard "This month" hardcoded under Total Expenses
[PASS] 20. DonationsExpenses "+12% vs last month" hardcoded
[PASS] 21. DonationsExpenses "+5% vs last month" hardcoded
```

### Files + line numbers

| File | Line | Hardcoded string |
|---|---|---|
| `frontend/src/components/Admin/Pages/Dashboard.jsx` | 152 | `+12% this month` (under Total Donations) |
| `frontend/src/components/Admin/Pages/Dashboard.jsx` | 164 | `This month` (under Total Expenses) |
| `frontend/src/components/Admin/Pages/DonationsExpenses.jsx` | 258 | `+12% vs last month` (under Total Donations) |
| `frontend/src/components/Admin/Pages/DonationsExpenses.jsx` | 267 | `+5% vs last month` (under Total Expenses) |

### Proposed fix

**Option A (minimal):** Remove the fake trend labels — just show the total. Honest.

**Option B (better, small scope creep):** Compute real month-over-month % using:
- This-month donations total (new endpoint param or client-side compute from already-fetched list)
- Last-month donations total
- Display real delta or remove if not enough data

Per your standing rule "we should not increase features", **Option A is recommended** — just delete the misleading labels.

---

## By-design observations (NOT bugs)

- **DonationsExpenses filters client-side** (in `useMemo`, no `month`/`category` sent to backend) — works for current dataset size; backend endpoints accept these filters for future use.
- **Dashboard's `summary.totalDonations` is ALL-TIME** — matches what `/api/donations/summary` returns. Accurate, not buggy.
- **`/api/donations/top-donors` is public** — by design (transparency page).

---

## Files Modified Plan

| Bug | Files | Lines |
|---|---|---|
| BUG-PHASE19-001 | `backend/routes/expenses.js` (+1 route), `backend/services/expensesService.js` (+listAdmin), `backend/controllers/expensesController.js` (+listAdmin), optionally `frontend/src/utils/api.js` if frontend switches | ~30 |
| BUG-PHASE19-002 | `backend/services/donationsService.js` (1 function), `backend/services/expensesService.js` (1 function) | ~6 each |
| BUG-PHASE19-003 | `frontend/src/components/Admin/Pages/Dashboard.jsx` (delete 2 labels), `frontend/src/components/Admin/Pages/DonationsExpenses.jsx` (delete 2 labels) | −4 |

**Total: ~5 files, ~50 lines changed across 3 bugs.**

---

**Phase 19 Step C complete. Waiting for user approval to apply fixes (Step D → E).**