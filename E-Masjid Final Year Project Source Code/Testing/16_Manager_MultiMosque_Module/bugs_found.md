# 16 Manager Multi-Mosque Module — Bugs Found

> Step C — discovered 2026-08-25. Phase 16 found 3 Manager-surface bugs (BUG-PHASE16-001/002/003); partner's home-page review on 2026-08-25 added 4 more (BUG-PHASE16-004/005/006/007). All 7 fixed in Step D — see `bugs_fixed.md`.
> **7 new bugs found in Phase 16.** 3 Manager-surface + 4 home-page (multi-tenant content). All have proposed + applied fixes.

---

## BUG-PHASE16-001 — Admins of soft-deleted masjids can still log in (HIGH)

**Severity:** High — multi-tenant isolation / lifecycle. The "deactivate a masjid" feature is the manager's only removal tool, but the lifecycle is incomplete: an admin of a deactivated masjid keeps full access.

**Locations:**
- `backend/services/authService.js#loginUser` line 50 — only checks `user.isActive`, never `user.mosqueId.isActive`
- `backend/middleware/auth.js#protect` line 19-21 — only checks `req.user.isActive`, not `req.user.mosqueId.isActive`

**Root cause (trace):**
1. Manager toggles Al-Noor to `isActive: false` via the Active/Inactive pill in the Manager panel.
2. Al-Noor disappears from public lists (`listPublic` correctly filters `isActive: true`) ✓
3. But the admin of Al-Noor (`admin@emasjid.pk`) can still log in because `loginUser` (line 50) only does:
   ```js
   if (!user.isActive) throw httpError(403, 'Account is deactivated');
   ```
   It never loads `user.mosqueId` to check `mosque.isActive`.
4. Once logged in, the admin can still hit every `/api/admin/*` route scoped to their `mosqueId` because `protect` middleware also only checks `user.isActive`.
5. The admin can keep creating announcements, expenses, fund requests, committee members — all on a masjid that the manager has publicly declared "deactivated".

**Live API reproduction (code-path, not yet executed):**
```js
// 1. As manager: deactivate Masjid Al-Noor
PUT /api/mosques/<al-noor-id>  body: { isActive: false }  → 200

// 2. As admin of Al-Noor: log in
POST /api/auth/login  body: { email: 'admin@emasjid.pk', password: 'admin123' }
  → 200 OK + JWT token     ← BUG (should be 403)

// 3. As admin: create an announcement on the "deactivated" masjid
POST /api/admin/announcements  body: { title: '...', content: '...', mosqueId: <al-noor-id> }
  → 201 Created            ← BUG (should be 403)
```

**Impact:**
- Public homepage correctly hides the masjid → no community-facing impact.
- But the deactivated masjid's admin keeps full mutation rights → manager's "deactivation" intent is not honored at the data layer.
- This is the same shape of bug as the original `Committee isActive` / `User isActive` checks across the platform — but for the parent masjid, not individual accounts.

**Proposed fix (Step D — needs client approval):**

The cleanest place to fix this is in `loginUser` (block at the door) + `protect` middleware (defense in depth):

1. **`backend/services/authService.js#loginUser`** — after loading the user, populate the masjid and check its status:
   ```js
   async function loginUser({ email, password }) {
     const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
     if (!user) throw httpError(401, 'Invalid credentials');
     const ok = await user.matchPassword(password);
     if (!ok) throw httpError(401, 'Invalid credentials');
     if (!user.isActive) throw httpError(403, 'Account is deactivated');
     if (user.mosqueId) {
       const mosque = await Mosque.findById(user.mosqueId).select('isActive name');
       if (mosque && !mosque.isActive) {
         throw httpError(403, `Your masjid (${mosque.name}) is currently deactivated. Please contact your manager.`);
       }
     }
     return { user, token: tokenForUser(user) };
   }
   ```
   Add `const Mosque = require('../models/Mosque');` at the top.

2. **`backend/middleware/auth.js#protect`** — also re-check masjid status on every request (in case the masjid was deactivated mid-session):
   ```js
   // After the existing isActive check:
   if (req.user.mosqueId) {
     const mosque = await Mosque.findById(req.user.mosqueId).select('isActive name');
     if (mosque && !mosque.isActive) {
       return res.status(403).json({ success: false, message: `Your masjid (${mosque.name}) is currently deactivated. Please contact your manager.` });
     }
   }
   ```
   Cache per-request to avoid hitting the DB twice. Add `const Mosque = require('../models/Mosque');` at the top.

3. **Skip the check for managers** — the manager's `user.mosqueId` is undefined (per `User.js:23`), so the existing `if (user.mosqueId)` guard naturally excludes them. Good.

**Verification plan after fix:**
- Live API: deactivate Al-Noor → admin@emasjid.pk login → expect 403 with the new message.
- Live API: admin still allowed to call `GET /api/mosques/:id` for their own masjid (read-only — needs to see it's inactive).
- Live API: committee member of Al-Noor → login → expect 403.
- Live API: scholar of Al-Noor → login → expect 403.
- Live API: admin@emasjid.pk re-activate Al-Noor → admin login → expect 200.
- Re-run `npm test` (backend) — the 1 pre-existing failure should still be the only one.

**Out of scope:** community users (no admin role, no critical mutations) — partner can decide later if community users of an inactive masjid should also be blocked. The proposed fix above blocks ONLY roles with elevated masjid-scoped mutations (admin, scholar, committee). Community users fall through and would still be able to log in (their requests are filtered by `mosqueId` on the public side anyway).

---

## BUG-PHASE16-002 — New masjid created with `isActive: true` (defaults to active, violates Q3) (MEDIUM)

**Severity:** Medium — workflow / governance. A brand-new masjid becomes immediately visible on the public homepage + navbar dropdown, before the manager has had a chance to upload an image, assign an admin, and configure content.

**Location:** `frontend/src/components/Manager/Pages/Mosques.jsx:51-54`
```jsx
const res = await api.createMosque({
  ...formData,
  isActive: true,   // <-- hardcoded
})
```

**Root cause:** The form passes `isActive: true` explicitly. The backend `Mosque` model (`backend/models/Mosque.js:12`) also defaults to `isActive: true`:
```js
isActive: { type: Boolean, default: true },
```
So even if I removed the frontend override, the backend would still create it as active. **Both layers need to change.**

**Live reproduction (code-path, not yet executed):**
1. Log in as `manager@emasjid.pk`.
2. Navigate to `/manager/mosques`.
3. Click "Add Mosque", fill name="Test Masjid X", city="Lahore", submit.
4. `POST /api/mosques` returns 201 with `isActive: true`.
5. Immediately on the public homepage, the new masjid appears in the navbar dropdown AND on `/api/mosques/public` results.
6. No time for the manager to upload a logo, assign an admin, etc.

**Impact:** Manager loses the "configure before going live" gate. In a real FYP defense this is awkward because it shows the manager doesn't have editorial control over the public surface.

**Proposed fix (Step D — needs client approval):**

Two-layer fix (defense in depth, same pattern as the Mongoose strict-mode gotcha documented in Phase 4.5):

1. **`frontend/src/components/Manager/Pages/Mosques.jsx:51-54`** — change explicit override from `true` to `false`:
   ```jsx
   const res = await api.createMosque({
     ...formData,
     isActive: false,   // start inactive; manager flips the toggle when ready
   })
   ```

2. **`backend/models/Mosque.js:12`** — change the model default to `false` so any future caller (admin UI, future API) also gets the safe default:
   ```js
   isActive: { type: Boolean, default: false },
   ```

**Verification plan after fix:**
- Live API: `POST /api/mosques` as manager → response includes `isActive: false`.
- Live API: `GET /api/mosques/public` → new masjid does NOT appear in the list.
- Live UI: `GET /manager/mosques` → new masjid card appears with "Inactive" badge.
- Live UI: manager clicks the "Inactive" pill to flip → masjid becomes active → appears in public list.

**No backfill needed** — the 4 seeded masjids were created before this fix, all are `isActive: true`, and partner wants them public. The default change only affects future creations.

---

## BUG-PHASE16-003 — Unescaped apostrophe in `Admins.jsx:137` (LOW — lint)

**Severity:** Low — lint only, no runtime impact. Blocks the build's lint step from passing with 0 errors.

**Location:** `frontend/src/components/Manager/Pages/Admins.jsx:137` — inside the amber info banner:
```jsx
<p>
  Admins are created from the <strong>Manage Mosques</strong> page using the <em>Add Admin</em> button on a masjid card.
  To reset an admin's password or deactivate their account, you can contact them directly (admins use the standard forgot-password flow).
</p>
```
The `'` in `admin's` and in `admin's` is unescaped.

**Root cause:** `react/no-unescaped-entities` ESLint rule requires all `'` (and `"`, `>`, `<`, `{`, `}`) in JSX text to be HTML-entity-escaped.

**Impact:** `npm run lint` reports 4 errors (this one + 3 pre-existing). The 3 pre-existing ones are out of scope. After the fix, the Phase-16-introduced error count drops to 0 (but the total lint still shows 3 errors from the older files).

**Proposed fix (Step D — needs client approval):**

Replace `'` with `&apos;` in `frontend/src/components/Manager/Pages/Admins.jsx:137`:
```jsx
<p>
  Admins are created from the <strong>Manage Mosques</strong> page using the <em>Add Admin</em> button on a masjid card.
  To reset an admin&apos;s password or deactivate their account, you can contact them directly (admins use the standard forgot-password flow).
</p>
```

**Verification plan after fix:**
- `npm run lint` → 3 errors remain (all pre-existing, all out of scope), the `Manager/Pages/Admins.jsx:137` error is gone.
- Render the page in a browser → text reads `admin's` (the entity renders as `'`).

---

## BUG-PHASE16-004 — Home page stat cards show the same numbers for every masjid (HIGH)

**Severity:** High — multi-tenant data correctness on the public homepage. The "Hero stats" strip on `/` ("X years serving", "PKR X raised", "X active requests", "X families helped") is the same for every masjid, regardless of which masjid the user is browsing. So if the manager creates a new masjid, the homepage still shows Al-Noor's numbers.

**Locations:**
- `backend/services/marketingService.js#aggregateStats` — previously called `yearsSinceOldestMosque()` (singleton) and ran `Donation.aggregate`, `FundRequest.countDocuments` WITHOUT a `mosqueId` filter
- `backend/controllers/marketingController.js#stats` — passed `req.query.mosqueId` into `resolveMosqueId` but never forwarded it to `aggregateStats`

**Root cause (trace):**
1. Manager creates "Dera Bhattia Masjids" (Aug 25, 2026) with `isActive: false`, then activates it.
2. Public user browses the homepage → `/api/marketing/stats?mosqueId=<dera-bhattia-id>`.
3. Backend `resolveMosqueId` correctly resolves to Dera Bhattia.
4. Backend calls `aggregateStats(mosqueId)` — but the OLD implementation ignored `mosqueId` for donations + fund requests, and computed `yearsServing` from the OLDEST masjid in the DB (Al-Noor).
5. So Dera Bhattia's stats card showed Al-Noor's `yearsServing` and Al-Noor's total donations.

**Live API reproduction (before):**
```
GET /api/marketing/stats?mosqueId=<al-noor-id>     → yearsServing=1, totalDonationsPKR=28000
GET /api/marketing/stats?mosqueId=<al-rahman-id>   → yearsServing=1, totalDonationsPKR=28000   ← same numbers
GET /api/marketing/stats?mosqueId=<dera-bhattia-id>→ yearsServing=1, totalDonationsPKR=28000   ← same numbers
```

**Proposed fix (Step D — already applied, see bugs_fixed.md):**
- `marketingService.aggregateStats(mosqueId)` — accept mosqueId; build a `mongoose.Types.ObjectId` and pass it as a `$match: { mosqueId: oid }` to the donation aggregate; pass `mosqueId` to all `FundRequest.countDocuments`; replace `yearsSinceOldestMosque()` with `yearsSinceMosqueCreated(mosqueId)` which calls `Mosque.findById(mosqueId).select('createdAt')`.
- `marketingController.stats` — resolve and forward `mosqueId`; if none exists return zeros.
- `frontend/src/utils/api.js` — `getMarketingStats(mosqueId)` appends `?mosqueId=...` when given.
- `frontend/src/components/Marketing/StatsSection.jsx` — uses `useMosque().activeMosqueId` and re-fetches when it changes.

---

## BUG-PHASE16-005 — "Our Impact in Numbers" shows the same values for every masjid (HIGH)

**Severity:** High — same shape as BUG-PHASE16-004. The Impact counter strip on `/` ("X prayers tracked", "X students taught", "X nikah hosted", "X families supported") is identical for every masjid.

**Locations:**
- `backend/services/marketingService.js#aggregateImpact` — ran `User.countDocuments({ isActive: true })`, `Event.countDocuments({ isActive: true })`, `FundRequest.countDocuments(...)`, `NikahBooking.countDocuments(...)`, `Announcement.aggregate(...)` WITHOUT a `mosqueId` filter
- `backend/controllers/marketingController.js#impact` — same issue as stats: resolved mosqueId but didn't pass it down

**Root cause (trace):** identical pattern to BUG-PHASE16-004.

**Live API reproduction (before):**
```
GET /api/marketing/impact?mosqueId=<al-noor-id>     → prayersTracked=1800, nikahHosted=1
GET /api/marketing/impact?mosqueId=<al-rahman-id>   → prayersTracked=1800, nikahHosted=1   ← same
```

**Proposed fix (Step D — already applied, see bugs_fixed.md):**
- `marketingService.aggregateImpact(mosqueId)` — accept mosqueId and add `mosqueId: oid` to every count + aggregate filter; use the same `prayersEstimated = Math.max(prayersTracked * 50, totalUsers * 200)` formula but with per-masjid numbers.
- `marketingController.impact` — resolve and forward mosqueId; return zeros if none.
- `frontend/src/utils/api.js` + `frontend/src/components/Marketing/ImpactCounters.jsx` — same pattern as stats.

---

## BUG-PHASE16-006 — New masjids have no hero carousel slides (HIGH)

**Severity:** High — content correctness. Only Masjid Al-Noor has hero slides. Al-Rahman, Al-Falah, Al-Taqwa, and any newly-created masjid (e.g. Dera Bhattia) get an empty carousel, so the homepage hero looks blank.

**Location:** `backend/utils/seed.js` — `HeroSlide` seed ran ONCE inside the Al-Noor loop, never iterated over the other masjids.

**Root cause (trace):**
1. `seed.js` iterates masjids, but only the `mosque` (Al-Noor) branch created slides. Sliders for Al-Rahman, Al-Falah, Al-Taqwa were never inserted.
2. `marketingService.listHeroSlides(mosqueId)` correctly filters by mosqueId, so each of those masjids returns `[]`.
3. Frontend `HeroCarousel` renders an empty array as a blank/loading state.

**Live API reproduction (before):**
```
GET /api/marketing/hero-slides?mosqueId=<al-noor-id>     → 6 slides
GET /api/marketing/hero-slides?mosqueId=<al-rahman-id>   → 0 slides   ← bug
GET /api/marketing/hero-slides?mosqueId=<al-falah-id>    → 0 slides   ← bug
GET /api/marketing/hero-slides?mosqueId=<al-taqwa-id>    → 0 slides   ← bug
GET /api/marketing/hero-slides?mosqueId=<dera-bhattia-id>→ 0 slides   ← bug
```

**Proposed fix (Step D — already applied, see bugs_fixed.md):**
- `backend/utils/seed.js` — `HeroSlide` seed now iterates `allMasjids` (same `DEFAULT_SLIDES` array of 6 entries), creates 6 slides per masjid with `mosqueId: m._id`, `createdBy: m.admins[0] || admin._id` (falls back to the manager as a last resort).
- `backend/utils/patch_hero_slides_all_masjids.js` — NEW one-off backfill script that inserts the same 6 default slides for any existing masjid with 0 slides (idempotent, safe to re-run).

---

## BUG-PHASE16-007 — Mosque image field was advertised in UI but not stored (MEDIUM)

**Severity:** Medium — UX contract violation. The "Add Mosque" form had an "Image URL" field that the user could fill in, but the backend silently ignored it (the field was never on the model). Worse, the manager dashboard rendered a broken `<img src={mosque.image}>` tag for every masjid — always showing a broken-image icon.

**Locations:**
- `backend/models/Mosque.js` — never had an `image` field on the schema
- `frontend/src/components/Manager/Pages/Mosques.jsx` — "Image URL" input + `<img>` tag in mosque list cards
- `frontend/src/components/Manager/Pages/Dashboard.jsx` — `<img src={mosque.image}>` card with broken-image fallback

**Root cause (trace):**
1. The frontend `Mosques.jsx` form includes an `image: ''` state and an "Image URL" input.
2. POST `/api/mosques` with `{ image: 'https://...' }` → backend's express-validator + Mongoose strict mode silently strips `image` (not in schema).
3. `Mosques.jsx` then renders `<img src={mosque.image}>` → `mosque.image` is `undefined` → browser shows broken image icon.
4. Same shape on `Dashboard.jsx`.

**Live API reproduction (before):**
```js
POST /api/mosques { name:'X', city:'Y', image:'https://should-store.example.com/foo.png' }
  → 201, response includes everything EXCEPT `image`  ← user thought they uploaded it
GET /api/mosques/:id  → { ... no `image` field ... }
```

**Proposed fix (Step D — already applied, see bugs_fixed.md):**

Partner decision (Aug 25): "remove the image entirely and also don't keep any placeholder". So the fix removes the feature rather than wiring it up.

1. **`backend/models/Mosque.js`** — schema already lacks `image` (was never there). No change needed.
2. **`frontend/src/components/Manager/Pages/Mosques.jsx`** — removed `image: ''` from `editForm` initial state, removed `image: mosque.image || ''` from `openEditModal`, removed `image: ''` from `closeEditModal` reset, removed the entire "Image URL" input block, removed `<img src={mosque.image}>` from the mosque list card render.
3. **`frontend/src/components/Manager/Pages/Dashboard.jsx`** — replaced the image-led mosque card with a text-only card: name, city, address, Active/Inactive pill, "Manage →" link.

**Verification (after fix):**
- Live API: `POST /api/mosques` with `image:'https://foo.png'` → response has no `image` field. `GET /api/mosques/:id` confirms no `image` in stored doc. `PUT /api/mosques/:id` with `image:'https://bar.png'` is silently ignored.
- UI: Manager "Add/Edit Mosque" form has no Image URL field. Manager Dashboard mosque cards have no broken image. Frontend build with no new lint errors.

---

## Pre-existing (Out of Scope — Phase 16 did not introduce these)

These were already in the repo when Phase 16 started. Recording them here for traceability, but no fix is proposed in this phase.

| File:line | Severity | Rule | Discovered in |
|---|---|---|---|
| `frontend/src/components/Admin/Pages/Scholars.jsx:20` | error | `no-empty` | pre-Phase 16 |
| `frontend/src/utils/api.js:43` | error | `no-empty` | pre-Phase 16 |
| `frontend/src/utils/api.js:99` | error | `no-empty` | pre-Phase 16 |
| 7 warnings (Scholars, Transparency, SlotPicker, api.js, report.js) | warning | `no-unused-vars` | pre-Phase 16 |
| `backend/tests/integration/committee_scope.test.js:319` | test fail | `TypeError: notifyCommittee is not a function` (broken import) | Phase 15 (introduced by Phase 15 committee flow) |
| `npm run build` "chunks > 500 kB" warning | warning | Vite/rollup | pre-Phase 16 |

These are recorded for transparency, not as Phase 16 work items. If you want me to fix them in a separate "lint cleanup" pass or as part of a later phase, just say so.

---

## NOT FOUND (Confirmed Absent)

- No SQL injection risks (Mongoose ODM + express-validator)
- No XSS risks (admin form values pass through express-validator + `sanitizeString` before storage)
- No file upload vulnerabilities (manager can only paste image URLs, not upload files)
- No auth bypass: all manager routes use `protect + authorize('manager')`
- No cross-manager mosque leak: `findManagedMosqueOrThrow` + `Mosque.find({ managerId: user._id })` everywhere
- No hard-delete risk: no `DELETE` route exists for mosques
- No public-leak of inactive masjids: `listPublic` + `searchPublic` filter `isActive: true`
- No manager UI for scholar/committee creation (Q4 partner answer — confirmed scope)
- No module-toggle field on `Mosque` (Q1 partner answer — confirmed out of scope)
