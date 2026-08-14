# Cross-Mosque Authorization Audit (Phase 1–5 modules)

**Date:** 2026-08-14
**Trigger:** BUG-ANN-012 discovered during Phase 6 manual testing — admin2@emasjid.pk could see all mosques' data because their JWT had no `mosqueId`.
**Scope:** Audit the 5 prior modules (Events, Donations, Expenses, Prayer Times, Nikah, Fund Requests) for the same shape of bug.

---

## TL;DR

| Module | Backend scope correct? | Frontend scope correct? | At risk for cross-mosque leak? | Action needed |
|--------|------------------------|-------------------------|-------------------------------|---------------|
| **Events** | ✅ POST/PUT/DELETE use `req.user.mosqueId` | ❌ Admin uses `getActiveMosqueId()` (navbar) | **YES** — same shape as BUG-ANN-012 | Add protected admin GET; switch frontend to it |
| **Donations** | ✅ POST uses `req.user.mosqueId` | ❌ Admin uses `getActiveMosqueId()` (navbar) | **YES** — same shape | Same fix |
| **Expenses** | ✅ POST uses `req.user.mosqueId` | ❌ Admin uses `getActiveMosqueId()` (navbar) | **YES** — same shape | Same fix |
| **Prayer Times** | ✅ PUT uses `req.user.mosqueId` | ⚠️ Partial — already has mosque-mismatch banner from Phase 5 | **YES** (same shape, less acute — already warns) | Same fix |
| **Nikah** | ✅ GET + POST both correctly scoped | ✅ Admin page uses `req.user.mosqueId` indirectly | **NO** — already correctly scoped | None |
| **Fund Requests** | ✅ GET + POST scoped by role | ⚠️ Admin page doesn't pass `mosqueId` | **NO** (backend forces scope by role) | None (verify) |

**Bottom line:** 4 modules need the same FIX-ANN-012 treatment. 2 modules are already correctly scoped (Nikah + Fund Requests).

---

## Detailed Findings

### 1. Events — `backend/routes/events.js` + `frontend/src/components/Admin/Pages/Events.jsx`

**Backend:**
```js
// POST /api/events - line 60
mosqueId: req.user.mosqueId,

// PUT /api/events/:id - line 88
{ _id: req.params.id, mosqueId: req.user.mosqueId }
```
✅ POST/PUT/DELETE force `req.user.mosqueId`.

**Public GET `/api/events`** (line 10) returns ALL events from all mosques when called without `?mosqueId=`:
```js
const query = { isActive: true, ...(mosqueId ? { mosqueId } : {}) };
```
❌ Public endpoint, unscoped when no `mosqueId`.

**Frontend Admin Events page** ([Events.jsx:94-98](frontend/src/components/Admin/Pages/Events.jsx#L94-L98)):
```js
const mosqueId = getActiveMosqueId()
const params = mosqueId ? `mosqueId=${mosqueId}` : ''
const res = await api.getEvents(params)
```
❌ Uses navbar `activeMosqueId` — same shape as BUG-ANN-012.

**Risk:** Same as BUG-ANN-012. An unscoped admin sees all events.

**FIX needed:**
- Add `GET /api/events/admin` (protected, scope to `req.user.mosqueId`; SuperAdmin can pass `?mosqueId=`).
- Update frontend admin to call `getAdminEvents()`.
- Add `'superadmin'` to role enum (already done in Phase 6).
- Update `seed.js` to wire any future admin2/manager2 (already done in Phase 6).

---

### 2. Donations — `backend/routes/donations.js` + `frontend/src/components/Admin/Pages/DonationsExpenses.jsx`

**Backend:**
```js
// POST /api/donations - line 136
mosqueId: req.user.mosqueId,
```
✅ POST uses `req.user.mosqueId`.

**Public GET `/api/donations`** (line 12) — returns all donations across mosques when no `mosqueId`:
```js
const query = {};
if (mosqueId) { ... query.mosqueId = mosqueId; }
```
❌ Public, unscoped.

**Frontend Admin** ([DonationsExpenses.jsx:84-88](frontend/src/components/Admin/Pages/DonationsExpenses.jsx#L84-L88)):
```js
const mosqueId = getActiveMosqueId()
const params = mosqueId ? `mosqueId=${mosqueId}` : ''
const [donationRes, expenseRes] = await Promise.all([api.getDonations(params), api.getExpenses(params)])
```
❌ Same shape.

**Risk:** Same as BUG-ANN-012.

**FIX needed:** Same as Events — add protected admin GET, switch frontend.

---

### 3. Expenses — `backend/routes/expenses.js` + same frontend file

**Backend:**
```js
// POST /api/expenses - line 70
mosqueId: req.user.mosqueId,
```
✅ POST uses `req.user.mosqueId`.

**Public GET `/api/expenses`** (line 9) — returns all expenses when no `mosqueId`:
```js
const query = {};
if (mosqueId) { ... query.mosqueId = mosqueId; }
```
❌ Public, unscoped.

**Frontend Admin** — same file as Donations, same pattern.

**Risk:** Same.

**FIX needed:** Same as Events.

---

### 4. Prayer Times — `backend/routes/prayerTimes.js` + `frontend/src/components/Admin/Pages/PrayerTimes.jsx`

**Backend:**
```js
// PUT /api/prayer-times - line 95
{ date: targetDate, mosqueId: req.user.mosqueId },
```
✅ PUT uses `req.user.mosqueId`. GET is public and scoped by `?date=` and `?mosqueId=` query.

**Frontend Admin** ([PrayerTimes.jsx:57-75](frontend/src/components/Admin/Pages/PrayerTimes.jsx#L57-L75)) — **already partially fixed in Phase 5** (BUG-PRAYER-005):
- Has the mosque-mismatch banner
- Uses `adminMosqueId = user?.mosqueId || null` to override the navbar's choice for the actual fetch

But the actual fetch call is still going through `getPrayerTimes()` which is the public endpoint — so the admin page works *because* it passes `mosqueId=${adminMosqueId}` explicitly. If `adminMosqueId` is undefined (the bug case), it would fall back to `getActiveMosqueId()`.

**Risk:** Lower than Events/Donations/Expenses, but same shape. The Phase 5 mosque-mismatch banner mitigates it but doesn't fix the root.

**FIX needed:** Same shape — protected admin endpoint + frontend switch. Lower priority than Events/Donations/Expenses.

---

### 5. Nikah — `backend/routes/nikahBookings.js`

**Backend GET /api/nikah-bookings** (line 9) is **already protected** and properly scoped:
```js
router.get('/', protect, async (req, res, next) => {
  let query = {};
  if (req.user.role === 'community') query.userId = req.user._id;
  if (req.user.role === 'scholar') { ... }
  if (req.user.role === 'admin') query.mosqueId = req.user.mosqueId;
  ...
```

POST (line 33) **already validates** `req.user.mosqueId` and returns 400 if missing:
```js
if (!req.user.mosqueId) {
  return res.status(400).json({ success: false, message: 'No mosque assigned to user' });
}
```

✅ **This module is correctly scoped.** No fix needed.

---

### 6. Fund Requests — `backend/routes/fundRequests.js`

**Backend GET /api/fund-requests** (line 77) is **already protected** and role-scoped:
```js
router.get('/', protect, async (req, res, next) => {
  let query = {};
  if (req.user.role === 'community') query.userId = req.user._id;
  if (req.user.role === 'committee' || req.user.role === 'admin' || req.user.role === 'scholar') {
    query.mosqueId = req.user.mosqueId;
  }
```

POST (line 11) **validates mosqueId** explicitly:
```js
const mosqueId = req.body.mosqueId || req.user.mosqueId;
if (!mosqueId) { return res.status(400) }
```

⚠️ One concern: a community user can pass `body.mosqueId` to file a fund request against a mosque they don't belong to. This isn't a "cross-mosque leak" — it's a "requesting help from a different masjid" feature, possibly intentional. Worth confirming with you later but not a security hole.

✅ **This module is correctly scoped for admin/scholar/committee.** No urgent fix needed.

---

## Recommendation

Three options for the next phases:

### Option A (recommended): Phase 7 = Events with full BUG-ANN-012-style fix
Phase 7 audits Events for all original Phase 7 bugs PLUS applies the Events audit fix. Same pattern as Phase 6 (fix first, test second).

### Option B: Phase 7 = Events (original scope) + Phase 7.5 = Cross-mosque sweep
Original Events testing first (you want to see if Events has its own Phase 7 bugs). Then a dedicated cross-mosque sweep phase that fixes Events + Donations + Expenses + Prayer Times in one batch.

### Option C: Cross-mosque sweep FIRST, then original Phase 7-11
Apply the FIX-ANN-012 pattern to all 4 vulnerable modules as a single "Phase 6.5" before starting Phase 7. Then Phase 7+ only deal with their own feature bugs.

**Your choice from earlier:** Phase-by-phase. → So **Option A** — Phase 7 = Events with the audit fix baked in.

---

## Cross-phase reference

When we reach Phases 8 (Donations), 9 (Expenses), 10 (Prayer Times), 11 (Nikah), 12 (Fund Requests), each will need:
- Protected `GET /api/<module>/admin` route
- Frontend `getAdmin<Module>()` helper
- Frontend admin page calls the new helper
- SuperAdmin bypass logic
- Same 4 manual tests as BUG-ANN-012 (Tests 14–17 of Phase 6)

Nikah and Fund Requests: audit-fix already in place; verify only.

---

## Manual verification recommendation (15 min)

If you want to be extra-safe before Phase 7, log in as `admin2@emasjid.pk` (now Al-Rahman admin thanks to the seed fix) and click through:
- `/admin/events` — should show only Al-Rahman events
- `/admin/donations` — should show only Al-Rahman donations
- `/admin/expenses` — should show only Al-Rahman expenses

⚠️ **Note:** Before this manual check, expect these pages to **still show data from BOTH mosques** (because their backend GETs are unscoped and the frontend passes `activeMosqueId` which is now Al-Rahman, but the GET endpoint itself returns everything if no filter is passed). The seed fix only wired admin2 to Al-Rahman — it didn't fix the GET endpoint leak.

The real fix comes in their respective next-phase sweeps.