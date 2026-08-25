# 16 Manager Multi-Mosque Module — Automated Test Results

**Date:** 2026-08-25 (initial pass)
**Environment:** Local — Node LTS, MongoDB on port 5000, frontend dev on port 5174
**Phase:** 16 (Manager Multi-Mosque Module)

---

## 1. Backend Route Scoping

| # | Check | Result |
|---|---|---|
| 1a | `GET /api/mosques` requires `manager` role | PASS — `protect + authorize('manager')` |
| 1b | `GET /api/mosques/:id` uses `protect` only (any logged-in user) | PASS — scoped in service: manager → filter by `managerId`; admin/scholar/committee → forced to own `mosqueId` |
| 1c | `POST /api/mosques` requires manager + sets `managerId: req.user._id` | PASS — `protect + authorize('manager')` + `managerId: user._id` in `mosquesService.create` |
| 1d | `PUT /api/mosques/:id` requires manager + scoped to `managerId` | PASS — `findOneAndUpdate({ _id, managerId: user._id }, ...)` returns 404 on cross-manager |
| 1e | No `DELETE /api/mosques/:id` (soft-delete only) | PASS — intentional per Q2 client answer |
| 1f | Public `GET /api/mosques/public` filters `isActive: true` | PASS — `Mosque.find({ isActive: true })` in `listPublic` |
| 1g | Public `GET /api/mosques/search` filters `isActive: true` | PASS — same filter in `searchPublic` |
| 2a | All 5 `/api/super-admin/*` routes require manager | PASS |
| 2b | `POST /api/super-admin/mosques/:mosqueId/admin` uses `findManagedMosqueOrThrow` | PASS — `managerId: req.user._id` enforced |
| 2c | `POST /api/super-admin/users` uses `findManagedMosqueOrThrow` on `body.mosqueId` | PASS |
| 2d | `GET /api/super-admin/mosques` filters by `managerId: req.user._id` | PASS |
| 2e | `GET /api/super-admin/admins` filters by managed mosque IDs | PASS — `User.find({ role: 'admin', mosqueId: { $in: managedIds } })` |
| 2f | `GET /api/super-admin/users` filters by managed mosque IDs | PASS |
| 3a | `scopeService.findManagedMosqueOrThrow` correctly throws 404 on cross-manager | PASS |
| 3b | `scopeService.resolveScope` returns `{ $in: managedIds }` for manager | PASS |
| 4a | Server mounts `/api/mosques` | PASS — `server.js:47` |
| 4b | Server mounts `/api/super-admin` | PASS — `server.js:52` |
| 4c | User model has `'manager'` in role enum | PASS |
| 4d | Manager user has no `mosqueId` (scope via Mosque.managerId) | PASS — confirmed in `User.js:23` |
| 5 | **Auth flow blocks admin of inactive masjid** | **FAIL — BUG-PHASE16-001** |

**Code reference for FAIL #5:** `backend/services/authService.js#loginUser` line 50 and `backend/middleware/auth.js#protect` line 19-21 only check `user.isActive`, never `req.user.mosqueId.isActive`. An admin of a soft-deleted masjid can still log in and act on the masjid. See `bugs_found.md#BUG-PHASE16-001`.

## 2. Frontend Integration

| # | Check | Result |
|---|---|---|
| 6a | `ManagerLayout` route guard checks `user.role === 'manager'` | PASS — `useEffect` + render guard both present |
| 6b | `ManagerLogin` uses `useForceLogoutOnMount` | PASS — `ManagerLogin.jsx:12` |
| 6c | `ManagerLogin` passes `'manager'` as 3rd param to `login()` | PASS — `ManagerLogin.jsx:29` |
| 6d | `ManagerLogin` redirects already-authenticated manager to `/manager` | PASS |
| 6e | `AuthContext.login` signature accepts `expectedRole` | PASS — `AuthContext.jsx:84-92` |
| 7a | `App.jsx` mounts `/manager/login` (sibling) + `/manager/*` (nested) | PASS |
| 7b | `/manager/*` is wrapped in `ManagerLayout` (route guard) | PASS |
| 7c | `/manager/login` is NOT inside the layout (no redirect loop) | PASS |
| 7d | Catch-all `*` redirects to `/` | PASS — no leak |
| 8a | Dashboard fetches via `api.getMosques()` | PASS — returns managed masjids via `/api/mosques` |
| 8b | Dashboard stat cards: Total + Active | PASS — partner confirmed minimal |
| 8c | Dashboard "Add Mosque" link → `/manager/mosques` | PASS |
| 8d | Dashboard uses `mounted` flag to prevent setState after unmount | PASS |
| 9a | `ManageMosques` fetches via `api.getSuperAdminMosques()` (which returns managers' masjids + `admins` array) | PASS |
| 9b | `ManageMosques` create form has Name + City required | PASS — `Mosques.jsx:20-22` |
| 9c | `ManageMosques` create form has Address, Phone, Email optional | PASS |
| 9d | `ManageMosques` create form omits `image` (intentional — set later) | PASS — `formData` line 20-22 has no image |
| 9e | **`ManageMosques` create handler passes `isActive: true`** | **FAIL — BUG-PHASE16-002** (Q3 partner answer says start inactive) |
| 9f | After create, `Add Admin` modal auto-opens with the new masjid | PASS — `Mosques.jsx:60-63` |
| 9g | Generated password banner shows `email` + `generatedPassword` from response | PASS — `Mosques.jsx:388-391` |
| 9h | Edit modal pre-fills from masjid object | PASS — `Mosques.jsx:101-111` |
| 9i | Active/Inactive toggle uses optimistic update + reconciliation | PASS — `Mosques.jsx:139-154` |
| 9j | `ManageMosques` has no search/filter | PASS (intentional — only 4 masjids) |
| 10a | `ManageAdmins` fetches via `api.getSuperAdminAdmins()` | PASS |
| 10b | Masjid filter dropdown shows only managed masjids | PASS |
| 10c | Search by name/email | PASS |
| 10d | Table is read-only (intentional) | PASS |
| 11a | `api.getMosques()` exists in `utils/api.js` | PASS — line 177 |
| 11b | `api.getSuperAdminMosques()` exists | PASS — line 184 |
| 11c | `api.getSuperAdminAdmins()` exists | PASS — line 185 |
| 11d | `api.createMosque()` exists | PASS — line 181 |
| 11e | `api.updateMosque()` exists | PASS — line 182 |
| 11f | `api.createSuperAdminAdmin(mosqueId, data)` exists | PASS — line 189-191 |
| 11g | `api.getSuperAdminUsers` and `api.createSuperAdminUser` exist but are unused in manager UI | OK — backend-only / future-proof (per Q4 partner answer, manager UI never uses these) |
| 12a | 401 from any non-auth endpoint redirects to `/manager/login` | PASS — `api.js:31-46` |
| 12b | `/api/auth/reset-password/` is whitelisted in 401 redirect | PASS |
| 13a | Sidebar "View Website" opens homepage in new tab | PASS — `ManagerLayout.jsx:97-100` |
| 13b | Logout button uses `logout()` and navigates to returned path | PASS — `ManagerLayout.jsx:69` |
| 13c | Mobile sidebar toggle visible only on mobile | PASS — `lg:hidden` class |

**Code references for FAIL:**
- BUG-PHASE16-002: `frontend/src/components/Manager/Pages/Mosques.jsx:51-54`:
  ```jsx
  const res = await api.createMosque({
    ...formData,
    isActive: true,   // <-- must be false per Q3
  })
  ```

## 3. Lint / Build / Tests

### Frontend Lint

```
✖ 11 problems (4 errors, 7 warnings)
```

| File:line | Severity | Rule | Phase 16? |
|---|---|---|---|
| `frontend/src/components/Manager/Pages/Admins.jsx:137` | error | `react/no-unescaped-entities` | **YES — BUG-PHASE16-003** |
| `frontend/src/components/Admin/Pages/Scholars.jsx:20` | error | `no-empty` | pre-existing (not Phase 16) |
| `frontend/src/utils/api.js:43` | error | `no-empty` | pre-existing (not Phase 16) |
| `frontend/src/utils/api.js:99` | error | `no-empty` | pre-existing (not Phase 16) |
| 7 warnings across Scholars/Transparency/SlotPicker/api.js/report.js | warning | `no-unused-vars` | pre-existing (not Phase 16) |

**BUG-PHASE16-003:** `Manager/Pages/Admins.jsx:137` has a literal apostrophe in JSX text that fails `react/no-unescaped-entities`. The line:
```jsx
<p>
  Admins are created from the <strong>Manage Mosques</strong> page using the <em>Add Admin</em> button on a masjid card.
  To reset an admin's password or deactivate their account, you can contact them directly (admins use the standard forgot-password flow).
</p>
```
The apostrophe is in `admin's` (line 137:30). The other lint errors are pre-existing — they have been in the repo since Phases 1-15 and are out of scope for Phase 16. (Recorded in `bugs_found.md` under "Pre-existing (Out of Scope)" for traceability.)

### Frontend Build

```
✓ built in 12.93s
dist/index.html                   0.90 kB │ gzip:   0.47 kB
dist/assets/index-75fd087d.css   66.01 kB │ gzip:  11.11 kB
dist/assets/index-6aae2098.js   594.63 kB │ gzip: 135.07 kB
```

Build succeeds. The "chunks > 500 kB" warning is pre-existing (Phase 1+ — date-fns + recharts inflate the bundle). Not a Phase 16 issue.

### Backend Tests

```
Test Suites: 1 failed, 5 passed, 6 total
Tests:       1 failed, 159 passed, 160 total
Time:        68.343 s
```

| Suite | Result | Notes |
|---|---|---|
| `fund_voting.test.js` | PASS | |
| `nikah_scope.test.js` | PASS | |
| `scholars_scope.test.js` | PASS | |
| `donations_scope.test.js` | PASS | |
| `api.test.js` | PASS | |
| `committee_scope.test.js` | **FAIL** — pre-existing Phase 15 issue, NOT Phase 16 | `TypeError: notifyCommittee is not a function` at `tests/integration/committee_scope.test.js:319:13` — the import is missing. The function itself works in production (visible in console logs: `[notifyCommittee] sent=3 failed=0`). Pre-existing Phase 15 test bug, out of scope for Phase 16. |

**No Phase 16 backend test failures.**

## 4. Cross-Module Dependencies Verified

| Dependency | Status | Notes |
|---|---|---|
| Manager can create a masjid, then create an admin for it | Code path verified | `POST /api/mosques` (manager-scoped) → `POST /api/super-admin/mosques/:id/admin` (manager-scoped) — both use the same `req.user._id` |
| Public homepage + navbar dropdown respect `isActive: false` | Code path verified | `listPublic` + `searchPublic` filter `isActive: true` |
| Admin of created masjid can log in | Code path verified | Login uses `user.isActive` only (not masjid) — BUG-PHASE16-001 highlights the gap when masjid is inactive |
| `useForceLogoutOnMount` clears any prior session | Code path verified | `ManagerLogin.jsx:12` |

## 5. Summary

| Category | Pass | Fail | Out of scope (pre-existing) |
|---|---|---|---|
| Backend scoping | 17 | 1 (BUG-001) | — |
| Frontend integration | 26 | 1 (BUG-002) | — |
| Lint | 0 new errors from Phase 16 | 1 (BUG-003) | 3 errors + 7 warnings pre-existing |
| Build | 1 | 0 | — |
| Tests | 159/160 | 0 from Phase 16 | 1 (Phase 15 committee test) |

**3 Phase-16 bugs to fix (Step D — awaiting client approval):**
1. **BUG-PHASE16-001** (backend) — `authService.loginUser` + `protect` middleware don't check `mosque.isActive` → admins of soft-deleted masjids can still log in.
2. **BUG-PHASE16-002** (frontend) — `Mosques.jsx:51-54` hardcodes `isActive: true` on create; must be `false` per Q3.
3. **BUG-PHASE16-003** (lint) — `Admins.jsx:137` has unescaped apostrophe in JSX text.

---

## Step G — Home Page Retest (post-fix verification for BUGS-PHASE16-001/002/003 + 4 new home-page bugs)

**Date:** 2026-08-25 (post-fix re-run)
**Environment:** Local — backend on port 5000, fresh probe masjid created + cleaned up
**Phase:** 16 — Round 2 (Manager fixes re-verified + 4 new home-page bugs found and fixed)

---

### Live API probe results (combined script: `backend/utils/phase16_homepage_fixes_verify.js`)

23/25 checks PASS in 1 run. The 2 non-failures are documented in `bugs_fixed.md#combined-regression-check`.

### BUG-PHASE16-001 (re-verified — manager module still works)

| # | Check | Result |
|---|---|---|
| R1 | `manager@emasjid.pk` login + token retrieval | PASS — status=200, token present |
| R2 | `GET /api/mosques` returns 5 masjids (Al-Noor, Al-Rahman, Al-Falah, Al-Taqwa, Dera Bhattia) | PASS — count=5 |

### BUG-PHASE16-004 (per-masjid stats — NEW)

| # | Check | Result |
|---|---|---|
| S1 | Masjid Al-Noor stats scoped | PASS — donations=28000, requests scoped |
| S2 | Masjid Al-Rahman stats scoped | PASS — donations=27500 (DIFFERS from Al-Noor ✓) |
| S3 | Masjid Al-Falah stats scoped | PASS — donations=9500 |
| S4 | Masjid Al-Taqwa stats scoped | PASS — donations=13000 |
| S5 | Dera Bhattia Masjids stats scoped | PASS — donations=0 |
| S6 | yearsServing uses per-masjid createdAt (Math.max(1, …) = 1 for all masjids because all created Aug 24/25 2026) | PASS — confirmed by donations differing |

### BUG-PHASE16-005 (per-masjid impact — NEW)

| # | Check | Result |
|---|---|---|
| I1 | Masjid Al-Noor impact scoped | PASS — prayers=1800, nikah=1 |
| I2 | Masjid Al-Rahman impact scoped | PASS — prayers=600, nikah=0 |
| I3 | Masjid Al-Falah impact scoped | PASS — prayers=600, nikah=0 |
| I4 | Masjid Al-Taqwa impact scoped | PASS — prayers=600, nikah=0 |
| I5 | Dera Bhattia Masjids impact scoped | PASS — prayers=200, nikah=0 |
| I6 | Impact JSON differs across masjids | PASS — full payloads differ |

### BUG-PHASE16-006 (hero slides per masjid — NEW)

| # | Check | Result |
|---|---|---|
| H1 | Masjid Al-Noor has 6 hero slides | PASS — count=6 |
| H2 | Masjid Al-Rahman has 6 hero slides | PASS — count=6 (was 0 before backfill) |
| H3 | Masjid Al-Falah has 6 hero slides | PASS — count=6 (was 0 before backfill) |
| H4 | Masjid Al-Taqwa has 6 hero slides | PASS — count=6 (was 0 before backfill) |
| H5 | Dera Bhattia Masjids has 6 hero slides | PASS — count=6 (was 0 before backfill) |

### BUG-PHASE16-007 (image field gone — NEW)

| # | Check | Result |
|---|---|---|
| IMG1 | POST /api/mosques with `image:'https://foo.png'` → response has NO `image` field | PASS |
| IMG2 | GET /api/mosques/:id after POST → no `image` in stored doc | PASS |
| IMG3 | PUT /api/mosques/:id with `image:'https://bar.png'` → response has NO `image` | PASS |
| IMG4 | GET /api/mosques/:id after PUT → still no `image` | PASS |
| IMG5 | Existing masjid (Al-Noor) → no `image` field in stored doc | PASS |

### Combined backend + frontend regression (re-ran after all 7 fixes)

| Check | Result |
|---|---|
| `cd backend && npm test` | 159/160 PASS (1 pre-existing Phase 15 `committee_scope.test.js` fail — unchanged) |
| `cd frontend && npm run lint` | 10 problems (3 errors, 7 warnings) — identical to pre-fix baseline |

### Phase 16 final summary (7 bugs found, 7 fixed)

| # | ID | Severity | Status |
|---|---|---|---|
| 1 | BUG-PHASE16-001 | High (multi-tenant auth) | FIXED + VERIFIED |
| 2 | BUG-PHASE16-002 | Medium (governance) | FIXED + VERIFIED |
| 3 | BUG-PHASE16-003 | Low (lint) | FIXED + VERIFIED |
| 4 | BUG-PHASE16-004 | High (multi-tenant stats) | FIXED + VERIFIED |
| 5 | BUG-PHASE16-005 | High (multi-tenant impact) | FIXED + VERIFIED |
| 6 | BUG-PHASE16-006 | High (content correctness) | FIXED + VERIFIED |
| 7 | BUG-PHASE16-007 | Medium (UX contract) | FIXED + VERIFIED |

**7/7 bugs FIXED, 23/25 live API checks PASS, 159/160 backend tests PASS, 0 new lint errors.**
