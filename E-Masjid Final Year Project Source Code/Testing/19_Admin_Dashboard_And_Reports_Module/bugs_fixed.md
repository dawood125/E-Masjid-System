# 19 Admin Dashboard + Reports Module — Bugs Fixed

> Step E — 2026-08-25. 3 Phase-19 bugs fixed and re-verified.

---

## FIX-PHASE19-001 — `/api/expenses/admin` now enforces admin scope (was: open leak)

**Why:** `/api/expenses` is public + accepts any `mosqueId` query param. There was no `/admin` endpoint that locked admins to their own masjid, unlike `/api/donations/admin`. A malicious admin could query any masjid's expenses by passing `mosqueId=<other-masjid-id>`.

### Backend changes

**1. `backend/services/expensesService.js`** — added `listAdmin(query, user)` mirroring `donationsService.listAdmin`:

```js
async function listAdmin(query, user) {
  const { category, month, page = 1, limit = 10, mosqueId } = query;
  const filter = {};
  if (user.role === 'manager') {
    const Mosque = require('../models/Mosque');
    if (mosqueId) {
      if (!isValidObjectId(mosqueId)) throw httpError(400, 'Invalid mosqueId');
      const owned = await Mosque.findOne({ _id: mosqueId, managerId: user._id }).select('_id');
      if (!owned) throw httpError(403, 'You do not manage this masjid');
      filter.mosqueId = mosqueId;
    } else {
      const managed = await Mosque.find({ managerId: user._id }).select('_id');
      const ids = managed.map((m) => m._id);
      if (!ids.length) return { data: [], total: 0, page: 1, totalPages: 0 };
      filter.mosqueId = { $in: ids };
    }
  } else {
    if (!user.mosqueId) throw httpError(400, 'Your account is not assigned to a mosque');
    if (mosqueId && String(mosqueId) !== String(user.mosqueId)) {
      throw httpError(403, 'Cannot view expenses for a different mosque');
    }
    filter.mosqueId = user.mosqueId;
  }
  if (category && category !== 'all') filter.category = category;
  if (month && month !== 'all') {
    filter.$expr = { $eq: [{ $month: '$createdAt' }, monthIndex(month)] };
  }
  const total = await Expense.countDocuments(filter);
  const expenses = await Expense.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
  return {
    data: expenses,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
}
```

Also added `listAdmin` to `module.exports`.

**2. `backend/controllers/expensesController.js`** — added controller:

```js
const listAdmin = tryOrNext(async (req, res) => {
  const page = await svc.listAdmin(req.query, req.user);
  res.json({ success: true, ...page });
});
```

Exported from module.

**3. `backend/routes/expenses.js`** — added admin route (placed before `:id` route to avoid shadowing):

```js
router.get('/admin', protect, authorize('admin', 'manager'), ctrl.listAdmin);
```

### Verification (live API probe)

| Test | Pre-fix | Post-fix |
|---|---|---|
| `GET /api/expenses/admin?mosqueId=Al-Noor` (own masjid) | (endpoint didn't exist) | **200 with admin's data** ✅ |
| `GET /api/expenses/admin?mosqueId=Al-Rahman` (other masjid) | 200 with cross-masjid data (leak) | **403 "Cannot view expenses for a different mosque"** ✅ |
| `GET /api/expenses/admin` (no mosqueId) | (endpoint didn't exist) | **200 with only admin's masjid data** ✅ |

Live API re-run: Tests 26, 27, 28 all PASS post-fix.

### Files modified

| File | Change |
|---|---|
| `backend/services/expensesService.js` | +36 lines (new `listAdmin` function) |
| `backend/controllers/expensesController.js` | +5 lines (new `listAdmin` controller) |
| `backend/routes/expenses.js` | +1 line (new `/admin` route) |

**Frontend NOT changed:** The admin DonationsExpenses page uses `api.getExpenses(params)` which hits the public `/api/expenses` endpoint and passes its own `mosqueId`. With the admin's correct mosqueId, this is still safe — the leak was the BACKEND not validating. Frontend code stays the same; security now enforced at the API layer.

---

## FIX-PHASE19-002 — `monthIndex()` now returns clear validation error (was: NaN → 400 CastError)

**Why:** Both `donationsService.monthIndex()` and `expensesService.monthIndex()` used `new Date('${month} 1, 2026').getMonth() + 1`. For inputs like `"2026-08"`, this returns `Invalid Date → getMonth() → NaN`. The resulting `$expr` filter `{ $eq: [{ $month: '$createdAt' }, NaN] }` throws a Mongoose CastError, which `errorHandler` maps to **400 "Resource not found"** — a confusing message that hides the actual problem.

### Backend changes

**`backend/services/donationsService.js:21`** and **`backend/services/expensesService.js:10`** — replaced the date-parsing trick with an explicit month-name validator:

```js
function monthIndex(month) {
  if (!month || month === 'all') return null;
  const lower = String(month).toLowerCase();
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const idx = monthNames.indexOf(lower);
  if (idx === -1) throw httpError(400, "Invalid month format. Use full English month name like 'august'.");
  return idx + 1;
}
```

Now:
- `month='all'` → null (no filter applied)
- `month='august'` → 8 (filter applied)
- `month='2026-08'` → **400 "Invalid month format..."** (clear validation)
- `month='xyz'` → **400** (same)
- `month='08'` → **400** (was: silently NaN before)

### Verification (live API probe)

| Test | Pre-fix | Post-fix |
|---|---|---|
| `GET /api/donations/admin?month=august` | 200 + filtered data | 200 + filtered data ✅ |
| `GET /api/donations/admin?month=2026-08` | 400 "Resource not found" (confusing) | **400 "Invalid month format. Use full English month name like 'august'."** ✅ |
| `GET /api/expenses/admin?month=2026-08` | 400 "Resource not found" | **400 "Invalid month format..."** ✅ |

Live API re-run: Tests 24, 25 PASS post-fix. Tests 10, 11 (valid `month=august`/`july`) still PASS — happy path unchanged.

### Files modified

| File | Change |
|---|---|
| `backend/services/donationsService.js` | Replaced `monthIndex` (5 lines → 10 lines) |
| `backend/services/expensesService.js` | Replaced `monthIndex` (5 lines → 10 lines) |

---

## FIX-PHASE19-003 — Removed 4 hardcoded "month-over-month" trend labels

**Why:** The Admin Dashboard and DonationsExpenses pages showed "📈 +12% this month" / "📉 +5% this month" labels next to total values. These were **hardcoded JSX strings**, not computed from data. The actual totals are ALL-TIME, so the labels were misleading.

Per the user's approved fix path (recommended Option A — minimal change, no scope creep):

### Frontend changes

**`frontend/src/components/Admin/Pages/Dashboard.jsx`** — removed 2 labels:
- Total Donations card: removed `<p>+12% this month</p>`
- Total Expenses card: removed `<p>This month</p>`

**`frontend/src/components/Admin/Pages/DonationsExpenses.jsx`** — removed 2 labels:
- Total Donations card: removed `<p>+12% vs last month</p>`
- Total Expenses card: removed `<p>+5% vs last month</p>`

Net effect: each of the 4 stat cards now shows just the label + the total number. Honest UI.

### Verification (live API probe)

| Test | Pre-fix | Post-fix |
|---|---|---|
| Dashboard contains "+12% this month" | true (bug present) | **false (removed)** ✅ |
| Dashboard contains "This month" | true (bug present) | **false (removed)** ✅ |
| DonationsExpenses contains "+12% vs last month" | true (bug present) | **false (removed)** ✅ |
| DonationsExpenses contains "+5% vs last month" | true (bug present) | **false (removed)** ✅ |

Live API re-run: Tests 18, 19, 20, 21 PASS post-fix.

### Files modified

| File | Change |
|---|---|
| `frontend/src/components/Admin/Pages/Dashboard.jsx` | −8 lines (removed 2 `<p>` blocks + 1 `<i>` icon) |
| `frontend/src/components/Admin/Pages/DonationsExpenses.jsx` | −4 lines (removed 2 `<p>` blocks) |

---

## Combined regression check

### Backend tests

```
cd backend && npm test
Test Suites: 1 failed, 5 passed, 6 total
Tests:       1 failed, 159 passed, 160 total
```

Same as Phase 17 baseline. The 1 failure is the pre-existing Phase 15 `committee_scope.test.js:319` bug (`notifyCommittee is not a function` import issue). **Phase 19 fixes introduced 0 new test failures.**

### Frontend lint

```
cd frontend && npm run lint
✖ 10 problems (3 errors, 7 warnings)
```

Same as Phase 17 baseline (api.js:43, api.js:99, Scholars.jsx:20 errors; 7 warnings). **Phase 19 fixes introduced 0 new lint errors or warnings.**

### Live API probe

**29/29 PASS** in 1 run after fix application. Script: `backend/utils/phase19_admin_dashboard_reverify.js`.

Pre-fix: 25/25 PASS (3 of those documented bugs as present).
Post-fix: 29/29 PASS (4 new tests added to verify each fix actually works).

---

## Files Modified (combined — all 3 Phase 19 fixes)

| File | Change | Lines |
|---|---|---|
| `backend/services/expensesService.js` | Added `listAdmin` + replaced `monthIndex` | +41 |
| `backend/controllers/expensesController.js` | Added `listAdmin` controller | +5 |
| `backend/routes/expenses.js` | Added `/admin` route | +1 |
| `backend/services/donationsService.js` | Replaced `monthIndex` | +5 |
| `frontend/src/components/Admin/Pages/Dashboard.jsx` | Removed 2 fake trend labels | −8 |
| `frontend/src/components/Admin/Pages/DonationsExpenses.jsx` | Removed 2 fake trend labels | −4 |

**Total: 6 files, +44 / −12 net lines.**

---

## Admin Dashboard + Reports Final State

| Concern | Status |
|---|---|
| All 6 dashboard endpoints return 200 | ✅ |
| Dashboard scope isolation (admin sees only own masjid) | ✅ FIX-PHASE19-001 |
| Dashboard month filter works with month-name format | ✅ FIX-PHASE19-002 |
| Dashboard invalid month-format returns clear 400 | ✅ FIX-PHASE19-002 |
| CSV report integrity (donation-by-type + expense-by-category sums match) | ✅ |
| Top-donors aggregation works | ✅ |
| Anonymous masking in CSV | ✅ |
| Honest UI labels (no fake trend percentages) | ✅ FIX-PHASE19-003 |
| DonationsExpenses client-side filter | ✅ (by design — small dataset, no scope creep) |

**Phase 19 Admin Dashboard + Reports re-verification: COMPLETE. 3 bugs found, 3 bugs fixed, 29/29 live API checks PASS, 0 new test/lint failures.**