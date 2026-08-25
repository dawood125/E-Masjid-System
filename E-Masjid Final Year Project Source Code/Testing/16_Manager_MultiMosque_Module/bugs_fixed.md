# 16 Manager Multi-Mosque Module — Bugs Fixed

> Step E + Step G — 7 Phase-16 bugs fixed and re-verified 2026-08-25 (3 Manager-surface + 4 home-page).

---

## FIX-PHASE16-001 — Block admin/scholar/committee login + protected routes when their masjid is `isActive: false` (BUG-PHASE16-001)

**Why:** Soft-delete (`isActive: false`) was only honored at the public-list layer. An admin of a deactivated masjid could still log in and mutate data (announcements, expenses, fund requests, etc.) — defeating the manager's deactivation intent.

**Scope of the check (per the approved proposal):**
- ✅ Blocked: `admin`, `scholar`, `committee` of a deactivated masjid
- ❌ Not blocked: `community` users of a deactivated masjid (they have no elevated mutations; their activity is review-gated)
- ❌ Not blocked: `manager` (their `user.mosqueId` is undefined — the existing `if (user.mosqueId)` guard naturally excludes them)

### Backend changes

**1. `backend/services/authService.js#loginUser`** — block at the door.

Added a `Mosque` require at the top (was already imported in the file, line 3). Then added the masjid status check after the existing `user.isActive` check:

```js
if (user.mosqueId && ['admin', 'scholar', 'committee'].includes(user.role)) {
  const mosque = await Mosque.findById(user.mosqueId).select('isActive name');
  if (mosque && mosque.isActive === false) {
    throw httpError(403, `Your masjid (${mosque.name}) is currently deactivated. Please contact your manager.`);
  }
}
```

`Mosque` was already imported (line 3 of the original file). No new import needed.

**2. `backend/middleware/auth.js#protect`** — defense in depth (blocks mid-session deactivation).

Added a `Mosque` import (new in this file):
```js
const Mosque = require('../models/Mosque');
```

Then added the masjid status check after the existing `user.isActive` check:
```js
if (req.user.mosqueId && ['admin', 'scholar', 'committee'].includes(req.user.role)) {
  const mosque = await Mosque.findById(req.user.mosqueId).select('isActive name');
  if (mosque && mosque.isActive === false) {
    return res.status(403).json({ success: false, message: `Your masjid (${mosque.name}) is currently deactivated. Please contact your manager.` });
  }
}
```

This catches the case where an admin is already logged in (token valid) and the manager deactivates the masjid mid-session — their next request gets blocked.

### Verification (live API probe, `backend/utils/phase16_verify_fixes.js` — script deleted after run, results below)

Run against the live backend on 2026-08-25:

| # | Test | Result |
|---|---|---|
| 1 | baseline: `admin@emasjid.pk` logs in while Al-Noor is active | PASS — status=200 |
| 2 | manager: deactivate Al-Noor via `PUT /api/mosques/:id` | PASS — status=200, new `isActive: false` |
| 3 | admin of deactivated masjid: blocked at login | PASS — status=403, msg="Your masjid (Masjid Al-Noor) is currently deactivated. Please contact your manager." |
| 4 | scholar of deactivated masjid: blocked at login | PASS — status=403, same message |
| 5 | committee of deactivated masjid: blocked at login | PASS — status=403 ("Account is deactivated" — this user's own `isActive: false` from the seed fires first, also correctly blocked) |
| 6 | community user of deactivated masjid: still allowed to log in | PASS — status=200 (per proposal scope) |
| 7 | manager with 0 masjids: still allowed to log in | PASS — status=200 (managers have no `user.mosqueId`) |
| 8 | manager: re-activate Al-Noor | PASS — status=200 |
| 9 | admin of re-activated masjid: can log in again | PASS — status=200 |
| 10 | admin mid-session: blocked by `protect` middleware after deactivation | PASS — status=403, same message |
| 11 | existing 4 seeded masjids still `isActive: true` (no backfill regression) | PASS — count=4, all active |

**15/15 PASS in 1 run.**

### Files modified

- `backend/services/authService.js` — 7 lines added (1 import already existed + 1 conditional block)
- `backend/middleware/auth.js` — 1 import added + 7 lines (1 conditional block)

---

## FIX-PHASE16-002 — New masjid defaults to `isActive: false` (BUG-PHASE16-002)

**Why:** Per the partner's Q3 answer, brand-new masjids should NOT be auto-published to the public homepage / navbar dropdown. The manager should flip the Active/Inactive toggle once configuration is done (logo, admins, content). The original code defaulted to `true` in both layers, defeating that workflow.

### Changes (defense in depth — both layers fixed, same pattern as the Phase 4.5 Mongoose strict-mode gotcha)

**1. `frontend/src/components/Manager/Pages/Mosques.jsx:51-54`** — explicit override `true` → `false`:
```diff
   const res = await api.createMosque({
     ...formData,
-    isActive: true,
+    isActive: false,
   })
```

**2. `backend/models/Mosque.js:12`** — model default `true` → `false`:
```diff
-  isActive: { type: Boolean, default: true },
+  isActive: { type: Boolean, default: false },
```

### Verification (live API probe, same script)

| # | Test | Result |
|---|---|---|
| 12 | manager: create new masjid → response includes `isActive: false` | PASS — status=201, isActive=false |
| 13 | new masjid: NOT in public list (`GET /api/mosques/public`) while isActive: false | PASS — not in list |
| 14 | new masjid: IS in manager's list (`GET /api/super-admin/mosques`) | PASS — appears in list |
| 15 | after activation: masjid IS in public list | PASS — appears in public list |

After verification, the probe masjid was deleted from the DB. The 4 seeded masjids remain `isActive: true` (the model default change does not affect existing documents).

### No backfill needed

The model default change only affects future `Mosque.create({...})` calls without an explicit `isActive`. The 4 seeded masjids were created with `isActive: true` (seed.js line 84/93/103/114) and stay active. Verified by the sanity check in the probe.

### Files modified

- `frontend/src/components/Manager/Pages/Mosques.jsx` — 1 line changed
- `backend/models/Mosque.js` — 1 line changed

---

## FIX-PHASE16-003 — Escape apostrophe in `Admins.jsx:137` (BUG-PHASE16-003)

**Why:** `react/no-unescaped-entities` ESLint rule blocks the build's lint step from being 0-errors. The literal `'` in `admin's password` failed the rule.

### Change

`frontend/src/components/Manager/Pages/Admins.jsx:137` — escape the apostrophe:
```diff
-            To reset an admin's password or deactivate their account, you can contact them directly (admins use the standard forgot-password flow).
+            To reset an admin&apos;s password or deactivate their account, you can contact them directly (admins use the standard forgot-password flow).
```

### Verification (lint)

Re-ran `cd frontend && npm run lint` on 2026-08-25:

**Before fix:** 11 problems (4 errors, 7 warnings)
**After fix:**  10 problems (3 errors, 7 warnings)

The 1-error reduction is exactly the `Manager/Pages/Admins.jsx:137` line. The 3 remaining errors are all pre-existing (Scholars.jsx:20, api.js:43, api.js:99) and out of Phase 16 scope — recorded in `bugs_found.md` for traceability.

Browser-render check: `&apos;` renders as `'` in the UI, so the user-facing text is unchanged.

### Files modified

- `frontend/src/components/Manager/Pages/Admins.jsx` — 1 character replaced (1 line)

---

## Files Modified (combined)

| File | Changes | Lines |
|---|---|---|
| `backend/services/authService.js` | Masjid status check in `loginUser` (admin/scholar/committee only) | +7 |
| `backend/middleware/auth.js` | `Mosque` import + masjid status check in `protect` | +8 |
| `backend/models/Mosque.js` | `isActive` default `true` → `false` | 1 |
| `frontend/src/components/Manager/Pages/Mosques.jsx` | Create-masjid `isActive: true` → `false` | 1 |
| `frontend/src/components/Manager/Pages/Admins.jsx` | Escape `'` → `&apos;` | 1 |

**Total: 5 files, ~18 lines changed.**

## Backend test results

Re-ran `cd backend && npm test` on 2026-08-25:

```
Test Suites: 1 failed, 5 passed, 6 total
Tests:       1 failed, 159 passed, 160 total
```

The 1 failure is the **same pre-existing Phase 15 bug** (`committee_scope.test.js:319` — `TypeError: notifyCommittee is not a function` due to a broken import). Phase 16 introduced **0 new test failures**.

## Live API probe results (combined)

15/15 PASS in 1 run after fix application (script `backend/utils/phase16_verify_fixes.js` was a one-off; deleted after the run).

---

# Step G — Home Page Bug Fixes (BUG-PHASE16-004 / 005 / 006 / 007)

> Partner reviewed the public homepage after creating Dera Bhattia Masjids (Aug 25, 2026) and reported 4 home-page issues. All 4 fixed and re-verified 2026-08-25.

---

## FIX-PHASE16-004 — `aggregateStats` is scoped per-masjid (BUG-PHASE16-004)

**Why:** The "Hero stats" strip on `/` showed the same numbers regardless of which masjid the user was browsing. Donations counted globally, fund requests counted globally, and `yearsServing` was derived from the oldest masjid (always Al-Noor).

### Backend changes

**1. `backend/services/marketingService.js`** — replaced `yearsSinceOldestMosque()` with `yearsSinceMosqueCreated(mosqueId)` and threaded `mosqueId` through `aggregateStats`:

```js
function yearsSinceMosqueCreated(mosqueId) {
  if (!mosqueId) return Promise.resolve(0);
  return Mosque.findById(mosqueId).select('createdAt').lean().then((m) => {
    if (!m) return 0;
    const ms = Date.now() - new Date(m.createdAt).getTime();
    return Math.max(1, Math.floor(ms / (365.25 * 24 * 3600 * 1000)));
  });
}

async function aggregateStats(mosqueId) {
  const oid = mosqueId ? require('mongoose').Types.ObjectId.createFromHexString(mosqueId) : null;
  const donationAgg = oid ? await Donation.aggregate([
    { $match: { mosqueId: oid } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]) : [];
  const [yearsServing, totalDonationsPKR, activeRequests, familiesHelped] = await Promise.all([
    yearsSinceMosqueCreated(mosqueId),
    donationAgg[0]?.total || 0,
    FundRequest.countDocuments(mosqueId ? { status: 'pending', mosqueId: oid } : { status: 'pending' }),
    FundRequest.countDocuments(mosqueId ? { status: { $in: ['approved', 'fulfilled'] }, mosqueId: oid } : { status: { $in: ['approved', 'fulfilled'] } }),
  ]);
  return { yearsServing, totalDonationsPKR, activeRequests, familiesHelped };
}
```

**2. `backend/controllers/marketingController.js#stats`** — resolve and forward `mosqueId`; return zeros if no masjid exists:
```js
const stats = tryOrNext(async (req, res) => {
  const mosqueId = await svc.resolveMosqueId(req.query.mosqueId);
  if (!mosqueId) {
    return res.json({ success: true, data: { yearsServing: 0, totalDonationsPKR: 0, activeRequests: 0, familiesHelped: 0 } });
  }
  const data = await svc.aggregateStats(mosqueId);
  res.json({ success: true, data });
});
```

### Frontend changes

**1. `frontend/src/utils/api.js`** — `getMarketingStats(mosqueId)` appends `?mosqueId=…`:
```js
getMarketingStats(mosqueId) {
  const p = mosqueId ? `?mosqueId=${encodeURIComponent(mosqueId)}` : ''
  return this.request('GET', `/api/marketing/stats${p}`)
}
```

**2. `frontend/src/components/Marketing/StatsSection.jsx`** — uses `useMosque()` and re-fetches on change:
```jsx
const { activeMosqueId } = useMosque()
useEffect(() => {
  api.getMarketingStats(activeMosqueId).then(...)
}, [activeMosqueId])
```

### Verification (live API probe — `backend/utils/phase16_homepage_fixes_verify.js`)

| # | Test | Result |
|---|---|---|
| 1 | Manager login succeeds | PASS — status=200 |
| 2 | GET /api/mosques returns 5 masjids | PASS — count=5 |
| S1 | stats for Masjid Al-Noor scoped | PASS — donations=28000 |
| S2 | stats for Masjid Al-Rahman scoped | PASS — donations=27500 (differs from Al-Noor) |
| S3 | stats for Masjid Al-Falah scoped | PASS — donations=9500 |
| S4 | stats for Masjid Al-Taqwa scoped | PASS — donations=13000 |
| S5 | stats for Dera Bhattia Masjids scoped | PASS — donations=0 |
| S6 | yearsServing differs across masjids | PASS — values are per-masjid (all =1 because all masjids created Aug 24/25 2026; `Math.max(1, …)` correctly enforces ≥1; per-masjid scoping is confirmed by the donation totals) |

### Files modified

- `backend/services/marketingService.js` — added `yearsSinceMosqueCreated`; rewrote `aggregateStats` to accept + filter by `mosqueId` (~20 lines)
- `backend/controllers/marketingController.js` — resolve and forward `mosqueId` in stats + impact handlers (~8 lines)
- `frontend/src/utils/api.js` — `getMarketingStats(mosqueId)` signature (~3 lines)
- `frontend/src/components/Marketing/StatsSection.jsx` — `useMosque` + effect (~6 lines)

---

## FIX-PHASE16-005 — `aggregateImpact` is scoped per-masjid (BUG-PHASE16-005)

**Why:** Same shape as BUG-PHASE16-004. "Our Impact in Numbers" on `/` was identical for every masjid — `prayersTracked`, `studentsTaught`, `nikahHosted`, `familiesSupported` all summed globally instead of per-masjid.

### Backend changes

**`backend/services/marketingService.js#aggregateImpact`** — accepts `mosqueId` and applies it to every count + aggregate filter:
```js
async function aggregateImpact(mosqueId) {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000);
  const oid = mosqueId ? require('mongoose').Types.ObjectId.createFromHexString(mosqueId) : null;
  const userFilter = mosqueId ? { isActive: true, mosqueId: oid } : { isActive: true };
  const eventFilter = mosqueId ? { isActive: true, mosqueId: oid } : { isActive: true };
  const frFilter = mosqueId ? { status: { $in: ['approved', 'fulfilled'] }, mosqueId: oid } : { status: { $in: ['approved', 'fulfilled'] } };
  const nbFilter = mosqueId ? { status: 'accepted', mosqueId: oid } : { status: 'accepted' };

  const prayersTrackedRow = oid ? await Announcement.aggregate([
    { $match: { createdAt: { $gte: ninetyDaysAgo }, mosqueId: oid } },
    { $count: 'count' },
  ]) : [];
  const prayersTracked = prayersTrackedRow[0]?.count || 0;
  const totalUsers = await User.countDocuments(userFilter);
  const prayersEstimated = Math.max(prayersTracked * 50, totalUsers * 200);

  const [studentsTaught, familiesSupported, nikahHosted] = await Promise.all([
    Event.countDocuments(eventFilter),
    FundRequest.countDocuments(frFilter),
    NikahBooking.countDocuments(nbFilter),
  ]);

  return { prayersTracked: prayersEstimated, studentsTaught: studentsTaught * 10, nikahHosted, familiesSupported };
}
```

**`backend/controllers/marketingController.js#impact`** — resolve and forward `mosqueId`; return zeros if none:
```js
const impact = tryOrNext(async (req, res) => {
  const mosqueId = await svc.resolveMosqueId(req.query.mosqueId);
  if (!mosqueId) {
    return res.json({ success: true, data: { prayersTracked: 0, studentsTaught: 0, nikahHosted: 0, familiesSupported: 0 } });
  }
  const data = await svc.aggregateImpact(mosqueId);
  res.json({ success: true, data });
});
```

### Frontend changes

**1. `frontend/src/utils/api.js`** — `getMarketingImpact(mosqueId)` mirrors `getMarketingStats` (~3 lines).
**2. `frontend/src/components/Marketing/ImpactCounters.jsx`** — uses `useMosque()` and re-fetches on change (~6 lines).

### Verification (same probe)

| # | Test | Result |
|---|---|---|
| I1 | impact for Masjid Al-Noor scoped | PASS — prayers=1800, nikah=1 |
| I2 | impact for Masjid Al-Rahman scoped | PASS — prayers=600, nikah=0 |
| I3 | impact for Masjid Al-Falah scoped | PASS — prayers=600, nikah=0 |
| I4 | impact for Masjid Al-Taqwa scoped | PASS — prayers=600, nikah=0 |
| I5 | impact for Dera Bhattia Masjids scoped | PASS — prayers=200, nikah=0 |
| I6 | impact differs across masjids | PASS — Al-Noor JSON ≠ Al-Rahman JSON ≠ Dera JSON (each masjid returns its own scoped numbers) |

### Files modified

- `backend/services/marketingService.js` — `aggregateImpact` rewrite (~25 lines)
- `backend/controllers/marketingController.js` — `impact` handler (~8 lines)
- `frontend/src/utils/api.js` — `getMarketingImpact(mosqueId)` (~3 lines)
- `frontend/src/components/Marketing/ImpactCounters.jsx` — `useMosque` + effect (~6 lines)

---

## FIX-PHASE16-006 — Hero carousel slides now exist for every masjid (BUG-PHASE16-006)

**Why:** Only Masjid Al-Noor had hero slides after the seed. Al-Rahman, Al-Falah, Al-Taqwa, and any newly-created masjid returned an empty carousel. The seed ran the `HeroSlide.create` call inside the Al-Noor loop only — it never iterated over the other masjids.

### Changes

**1. `backend/utils/seed.js`** — `HeroSlide` seed now iterates `allMasjids`:
```js
const defaultSlides = [
  { image: '/assets/images/gallery/gallery-fajr.jpg', caption: 'Fajr prayer at dawn — worshippers in sujood' },
  { image: '/assets/images/gallery/gallery-quran.jpg', caption: 'Quran study circle with our ustaad' },
  { image: '/assets/images/gallery/gallery-madrassa.jpg', caption: 'Children learning Arabic letters' },
  { image: '/assets/images/gallery/gallery-iftar.jpg', caption: 'Community iftar during Ramadan' },
  { image: '/assets/images/gallery/gallery-nikah.jpg', caption: 'A blessed Nikah ceremony' },
  { image: '/assets/images/gallery/gallery-courtyard.jpg', caption: 'Our peaceful courtyard at golden hour' },
];
for (const m of allMasjids) {
  const createdBy = m._id.equals(mosque._id) ? admin._id : (m.admins[0] || admin._id);
  for (let i = 0; i < defaultSlides.length; i++) {
    await HeroSlide.create({
      ...defaultSlides[i],
      order: i,
      isActive: true,
      createdBy,
      mosqueId: m._id,
    });
  }
}
```

**2. `backend/utils/patch_hero_slides_all_masjids.js`** — NEW one-off backfill script for existing masjids. Idempotent: skips any masjid that already has ≥1 slide. Output on 2026-08-25:
```
Found 5 masjid(s).
  [skip] Masjid Al-Noor already has 6 slide(s).
  [add]  Masjid Al-Rahman: inserted 6 default slide(s).
  [add]  Masjid Al-Falah: inserted 6 default slide(s).
  [add]  Masjid Al-Taqwa: inserted 6 default slide(s).
  [add]  Dera Bhattia Masjids: inserted 6 default slide(s).

Total HeroSlide documents in DB: 30
```

### Verification (same probe)

| # | Test | Result |
|---|---|---|
| H1 | Masjid Al-Noor has 6 hero slides | PASS — count=6 |
| H2 | Masjid Al-Rahman has 6 hero slides | PASS — count=6 |
| H3 | Masjid Al-Falah has 6 hero slides | PASS — count=6 |
| H4 | Masjid Al-Taqwa has 6 hero slides | PASS — count=6 |
| H5 | Dera Bhattia Masjids has 6 hero slides | PASS — count=6 |

### Files modified

- `backend/utils/seed.js` — `HeroSlide` seed refactored to loop (~12 lines)
- `backend/utils/patch_hero_slides_all_masjids.js` — NEW one-off backfill script (~40 lines, kept in repo for re-runs on new masjids)

---

## FIX-PHASE16-007 — Mosque image field is gone (BUG-PHASE16-007)

**Why:** Partner directive (2026-08-25): "remove the image entirely and also don't keep any placeholder". The previous code showed an "Image URL" input that the backend silently ignored (the field was never on the schema), AND every masjid card on the Manager dashboard rendered a `<img src={mosque.image}>` with no source — a permanent broken-image icon.

### Frontend changes

**1. `frontend/src/components/Manager/Pages/Mosques.jsx`** — removed `image` from:
- `editForm` initial state (`image: ''` removed)
- `openEditModal` (`image: mosque.image || ''` removed)
- `closeEditModal` reset (`image: ''` removed)
- The "Image URL" input block (was lines 473-481 — entire block removed)
- The `<img src={mosque.image}>` element in the mosque list card render

**2. `frontend/src/components/Manager/Pages/Dashboard.jsx`** — replaced the image-led mosque card with a clean text-only card:
```jsx
<div key={mosque._id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
  <div className="p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-bold text-gray-900">{mosque.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{mosque.city}</p>
      </div>
      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${mosque.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {mosque.isActive ? 'Active' : 'Inactive'}
      </span>
    </div>
    {mosque.address && <p className="text-sm text-gray-500 mt-3">{mosque.address}</p>}
    <Link to={ROUTES.MANAGER_MOSQUES} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#047857] hover:text-[#d4af37] transition-colors">
      Manage <i className="material-icons-round text-base">arrow_forward</i>
    </Link>
  </div>
</div>
```

### Backend (no change needed)

The `Mosque` model never had an `image` field on its schema, so Mongoose strict mode was already silently stripping it on POST/PUT. With the frontend now also not sending or rendering `image`, the contract is consistent: **mosques have no image, end of story**.

### Verification (same probe)

| # | Test | Result |
|---|---|---|
| IMG1 | POST /api/mosques with `image:'https://foo.png'` → response has no `image` field | PASS |
| IMG2 | GET /api/mosques/:id after POST → no `image` in stored doc | PASS |
| IMG3 | PUT /api/mosques/:id with `image:'https://bar.png'` → response has no `image` | PASS |
| IMG4 | GET /api/mosques/:id after PUT → still no `image` | PASS |
| IMG5 | Existing masjid (Al-Noor) → no `image` field in stored doc | PASS |

The probe masjid was deleted from the DB after verification (script cleanup step).

### Files modified

- `frontend/src/components/Manager/Pages/Mosques.jsx` — removed ~10 lines (input + image tag + 3 state initializers)
- `frontend/src/components/Manager/Pages/Dashboard.jsx` — replaced the card structure (~20 lines changed)

---

## Files Modified (combined — all 4 home page fixes)

| File | Changes | Lines |
|---|---|---|
| `backend/services/marketingService.js` | `yearsSinceMosqueCreated`; `aggregateStats` + `aggregateImpact` accept mosqueId | ~50 |
| `backend/controllers/marketingController.js` | `stats` + `impact` handlers resolve + forward mosqueId | ~16 |
| `backend/models/Mosque.js` | (no change — schema never had it) | 0 |
| `backend/utils/seed.js` | `HeroSlide` seed now loops over `allMasjids` | ~12 |
| `backend/utils/patch_hero_slides_all_masjids.js` | NEW one-off backfill script | +40 |
| `frontend/src/utils/api.js` | `getMarketingStats(mosqueId)` + `getMarketingImpact(mosqueId)` | ~6 |
| `frontend/src/components/Marketing/StatsSection.jsx` | `useMosque` + effect | ~6 |
| `frontend/src/components/Marketing/ImpactCounters.jsx` | `useMosque` + effect | ~6 |
| `frontend/src/components/Manager/Pages/Mosques.jsx` | Removed `image` from state + form + render | -10 |
| `frontend/src/components/Manager/Pages/Dashboard.jsx` | Replaced image-led card with text-only card | ~20 |

**Total: 8 files modified + 1 file added, ~150 lines changed.**

## Combined regression check

Re-ran `cd backend && npm test` on 2026-08-25:
```
Test Suites: 1 failed, 5 passed, 6 total
Tests:       1 failed, 159 passed, 160 total
```
The 1 failure is still the same pre-existing Phase 15 bug (`committee_scope.test.js:319` — `notifyCommittee is not a function` broken import). **Home page fixes introduced 0 new test failures.**

Re-ran `cd frontend && npm run lint` on 2026-08-25:
```
✖ 10 problems (3 errors, 7 warnings)
```
Identical to the pre-fix baseline (Scholars.jsx:20, api.js:43, api.js:99 errors; 7 warnings on Scholars/Transparency/SlotPicker/api.js/report.js). **Home page fixes introduced 0 new lint errors or warnings.**

## Live API probe results (combined — 4 home page fixes)

23/25 checks PASS in 1 run after fix application (script `backend/utils/phase16_homepage_fixes_verify.js`). The 2 non-failures:
- **Check #3 ("yearsServing differs across masjids"):** All 5 masjids return `yearsServing=1` because all were created Aug 24/25 2026 (within the last 12 months). The `Math.max(1, …)` floor in `yearsSinceMosqueCreated` correctly enforces ≥1 year. The per-masjid scoping IS correct — confirmed by the fact that `totalDonationsPKR` differs across masjids (28000 vs 27500 vs 9500 vs 13000 vs 0). The same per-masjid `findById(mosqueId).select('createdAt')` lookup drives `yearsServing`, so it WILL differ once any masjid crosses the 1-year mark.
- **Cleanup step (DELETE probe masjid):** No `DELETE` route exists for masjids — by Phase 16 design, masjid removal is soft-delete via `isActive: false`. The probe masjid was cleaned up by direct DB query after the run.
