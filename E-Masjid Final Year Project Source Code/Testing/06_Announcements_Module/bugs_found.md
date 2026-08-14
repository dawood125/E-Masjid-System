# 06 Announcements Module - Bugs Found

**Total:** 12 BUGs found  
**Status:** ✅ All 12 BUGs fixed & verified — see `bugs_fixed.md` for details  
**Automated test:** 34/35 PASS (1 known test-side limitation, not a code bug)

---

## BUG-ANN-001 — Public page hardcodes "Masjid Al-Noor, Sheikhupura" in subtitle

| Field | Value |
|-------|-------|
| Severity | Medium |
| Location | [frontend/src/components/User/Pages/Announcements.jsx:99](frontend/src/components/User/Pages/Announcements.jsx#L99) |
| Root cause | Description text is a literal string, not dynamic from `activeMosque`. |
| Status | ✅ Fixed (FIX-ANN-001) |
| Proposed fix | Replace `Masjid Al-Noor, Sheikhupura` with dynamic interpolation `${activeMosque?.name ?? 'your masjid'}, ${activeMosque?.city ?? ''}`. |

**Steps to reproduce:**
1. Open `/announcements`.
2. Switch navbar mosque to Al-Rahman.
3. Page subtitle still says "Masjid Al-Noor, Sheikhupura".

**Expected:** Subtitle changes to "Masjid Al-Rahman, Sheikhupura".
**Actual:** Subtitle stays "Masjid Al-Noor, Sheikhupura".

---

## BUG-ANN-002 — Public page hardcodes "15 Shawwal 1446 AH" badge

| Field | Value |
|-------|-------|
| Severity | Medium |
| Location | [frontend/src/components/User/Pages/Announcements.jsx:104](frontend/src/components/User/Pages/Announcements.jsx#L104) |
| Root cause | Date string is a literal — never recomputed. |
| Status | ✅ Fixed (FIX-ANN-001) |
| Proposed fix | Use `islamicDateLabel()` helper (same as `PrayerTimes.jsx`). |

**Steps to reproduce:**
1. Open `/announcements`.
2. Read the green badge — always shows "15 Shawwal 1446 AH" regardless of today.

**Expected:** Today's actual Islamic date.
**Actual:** Always "15 Shawwal 1446 AH".

---

## BUG-ANN-003 — "Newest First" sort button is dead (no onClick)

| Field | Value |
|-------|-------|
| Severity | Low |
| Location | [frontend/src/components/User/Pages/Announcements.jsx:164-167](frontend/src/components/User/Pages/Announcements.jsx#L164-L167) |
| Root cause | Button has no `onClick` handler. |
| Status | ✅ Fixed (FIX-ANN-009) |
| Proposed fix | Either wire it to toggle sort direction (newest/oldest) OR remove the button. Default to newest-first (already is), so remove. |

**Expected:** No misleading button OR a working toggle.
**Actual:** Clicking does nothing.

---

## BUG-ANN-004 — Admin "Mark Urgent" + "Publish" quick actions are fake toasts

| Field | Value |
|-------|-------|
| Severity | High |
| Location | [frontend/src/components/Admin/Pages/Announcements.jsx:267-285](frontend/src/components/Admin/Pages/Announcements.jsx#L267-L285) |
| Root cause | Buttons only show toasts; no API call. |
| Status | ✅ Fixed (FIX-ANN-003) |
| Proposed fix | Wire both to real PUT calls: `Mark Urgent` → `PUT /api/announcements/:id` with `{ isUrgent: true }`, `Publish` → `PUT /api/announcements/:id` with `{ status: 'published', publishDate: now }`. |

**Steps to reproduce:**
1. Login as admin.
2. Open `/admin/announcements`.
3. Click the ⚠️ icon next to a published announcement.
4. Toast says "marked urgent (demo)" but the isUrgent flag is NOT set in DB.

**Expected:** Database row updated to `isUrgent: true`.
**Actual:** No DB change. Toast is misleading.

---

## BUG-ANN-005 — Admin page uses `getActiveMosqueId()` (navbar localStorage) — mosque mismatch

| Field | Value |
|-------|-------|
| Severity | Medium |
| Location | [frontend/src/components/Admin/Pages/Announcements.jsx:36](frontend/src/components/Admin/Pages/Announcements.jsx#L36) |
| Root cause | Same pattern as BUG-PRAYER-004. |
| Status | ✅ Fixed (FIX-ANN-004) |
| Proposed fix | Use `useAuth()` to get admin's own mosqueId; switch the fetch to always use admin's mosqueId; show yellow banner if navbar mosque differs. |

**Steps to reproduce:**
1. Login as Al-Noor admin.
2. On homepage, switch navbar to Al-Rahman.
3. Click "Announcements" in admin sidebar.
4. The list shows Al-Rahman items (or fails to show correct ones).

**Expected:** Page shows ONLY Al-Noor admin's announcements, regardless of navbar.
**Actual:** Page uses navbar's mosqueId.

---

## BUG-ANN-006 — Backend rejects past publishDate on PUT (block on edit)

| Field | Value |
|-------|-------|
| Severity | Medium |
| Location | [backend/routes/announcements.js:75-82](backend/routes/announcements.js#L75-L82) |
| Root cause | Same past-date check runs on edit, not just create. |
| Status | ✅ Fixed (FIX-ANN-007) |
| Proposed fix | Remove the past-date check on PUT (allow editing drafts even if their scheduled publishDate is now past). Keep on POST (creating a new one in the past is still nonsensical). |

**Steps to reproduce:**
1. Create a draft announcement with `publishDate = today`.
2. Wait until tomorrow.
3. Open admin/edit, change the title slightly, save.
4. 400 error: "Publication date cannot be in the past".

**Expected:** Save succeeds (admin can keep the old publishDate or change it).
**Actual:** 400 error.

---

## BUG-ANN-007 — Pagination page numbers cap at 5

| Field | Value |
|-------|-------|
| Severity | Medium |
| Location | [frontend/src/components/User/Pages/Announcements.jsx:227](frontend/src/components/User/Pages/Announcements.jsx#L227) |
| Root cause | `Array.from({ length: totalPages }).slice(0, 5)` always shows pages 1-5. |
| Status | ✅ Fixed (FIX-ANN-008) |
| Proposed fix | Slice around current page: `Array.from({length: totalPages}).slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5)`. Show "..." if totalPages > 5. |

**Steps to reproduce:**
1. Seed 30+ announcements.
2. Open `/announcements`.
3. Page numbers 1-5 visible, but no way to reach page 6+.

**Expected:** Page buttons show current + neighboring pages, with "..." for overflow.
**Actual:** Only pages 1-5 are shown.

---

## BUG-ANN-008 — No delete confirmation modal in admin

| Field | Value |
|-------|-------|
| Severity | High (violates Phase 20 rule) |
| Location | [frontend/src/components/Admin/Pages/Announcements.jsx:296-308](frontend/src/components/Admin/Pages/Announcements.jsx#L296-L308) |
| Root cause | Delete button immediately calls API. |
| Status | ✅ Fixed (FIX-ANN-005) |
| Proposed fix | Add a confirmation modal where the admin must type the announcement title to confirm. |

**Steps to reproduce:**
1. Login as admin.
2. Open `/admin/announcements`.
3. Click the 🗑️ icon next to any announcement.
4. Announcement is deleted immediately, no confirmation.

**Expected:** Confirmation modal appears.
**Actual:** Instant delete.

---

## BUG-ANN-009 — `publishedBy` hardcoded to 'Admin' in admin form

| Field | Value |
|-------|-------|
| Severity | Low |
| Location | [frontend/src/components/Admin/Pages/Announcements.jsx:114](frontend/src/components/Admin/Pages/Announcements.jsx#L114) |
| Root cause | Literal string, not from `useAuth()`. |
| Status | ✅ Fixed (FIX-ANN-006) |
| Proposed fix | `publishedBy: user?.name || 'Admin'`. |

**Steps to reproduce:**
1. Login as admin.
2. Create an announcement.
3. Public page shows "By Admin" — never the actual name.

**Expected:** "By Dawood Ahmed" (or whatever the admin's name is).
**Actual:** Always "Admin".

---

## BUG-ANN-010 — Admin status inference mixes 'urgent' (UI-only) with 'draft'/'published' (DB)

| Field | Value |
|-------|-------|
| Severity | Medium |
| Location | [frontend/src/components/Admin/Pages/Announcements.jsx:11-14](frontend/src/components/Admin/Pages/Announcements.jsx#L11-L14) |
| Root cause | `getAnnouncementStatus` returns 'urgent' but the model only knows 'draft'/'published'. Round-trip loses the urgent visual state. |
| Status | ✅ Fixed (FIX-ANN-003) |
| Proposed fix | Compute 'urgent' purely for display (same way), but derive it from `isUrgent` separately so the edit form pre-populates the urgent checkbox correctly. |

**Steps to reproduce:**
1. Admin edits an announcement that has `isUrgent: true`.
2. The modal opens. The "Mark as urgent" checkbox is NOT checked.

**Expected:** Checkbox is checked.
**Actual:** Always unchecked.

---

## BUG-ANN-011 — Admin icon buttons have no tooltips / no labels on mobile

| Field | Value |
|-------|-------|
| Severity | Low |
| Location | [frontend/src/components/Admin/Pages/Announcements.jsx:267-308](frontend/src/components/Admin/Pages/Announcements.jsx#L267-L308) |
| Root cause | Icon-only buttons without `title` or `aria-label`. |
| Status | ✅ Fixed (FIX-ANN-005) |
| Proposed fix | Add `title` attribute to each icon button. |

**Steps to reproduce:**
1. Open `/admin/announcements` on mobile width.
2. Hover/focus an icon button.

**Expected:** Tooltip or visible label.
**Actual:** No context; admin must guess.

---

## Summary

| BUG ID | Severity | Fix Group | Status |
|--------|----------|-----------|--------|
| BUG-ANN-001 | Medium | FIX-ANN-001 | ✅ Fixed |
| BUG-ANN-002 | Medium | FIX-ANN-001 | ✅ Fixed |
| BUG-ANN-003 | Low | FIX-ANN-009 | ✅ Fixed |
| BUG-ANN-004 | High | FIX-ANN-003 | ✅ Fixed |
| BUG-ANN-005 | Medium | FIX-ANN-004 | ✅ Fixed |
| BUG-ANN-006 | Medium | FIX-ANN-007 | ✅ Fixed |
| BUG-ANN-007 | Medium | FIX-ANN-008 | ✅ Fixed |
| BUG-ANN-008 | High | FIX-ANN-005 | ✅ Fixed |
| BUG-ANN-009 | Low | FIX-ANN-006 | ✅ Fixed |
| BUG-ANN-010 | Medium | FIX-ANN-003 | ✅ Fixed |
| BUG-ANN-011 | Low | FIX-ANN-005 | ✅ Fixed |
| BUG-ANN-012 | **Critical** (security) | FIX-ANN-012 | ✅ Fixed |

**Total: 12 BUGs → 10 fix groups** (BUG-ANN-001 and -002 share FIX-ANN-001; BUG-ANN-004 and -010 share FIX-ANN-003; BUG-ANN-008 and -011 share FIX-ANN-005; BUG-ANN-012 is its own fix group). **All 12 BUGs fixed and verified by `announcements_test.js` (34/35 PASS).**

---

## BUG-ANN-012 — Cross-mosque data leak: an admin can see/edit announcements of any masjid

| Field | Value |
|-------|-------|
| Severity | **Critical** (security/auth) |
| Locations | `backend/utils/seed.js`, `backend/routes/announcements.js`, `backend/routes/auth.js`, `backend/models/User.js`, `frontend/src/utils/api.js`, `frontend/src/components/Admin/Pages/Announcements.jsx` |
| Root cause | Two compounding gaps: (1) `seed.js` never assigned `admin2` to `mosque2._id`, so her JWT had `mosqueId: undefined`; (2) `GET /api/announcements` is a public endpoint that returns everything when called without `mosqueId`. The admin frontend sends no filter when `user.mosqueId` is undefined → admin sees rows from BOTH mosques. |
| Status | ✅ Fixed (FIX-ANN-012) |
| Proposed fix | (a) Wire admin2 to `mosque2._id` in `seed.js` so her JWT has `mosqueId`. Managers are NOT given a `user.mosqueId` — their scope is per-mosque via the `Mosque.managerId` field on the Mosque document (existing role pattern). (b) Use the existing **`manager` role** as the cross-mosque operator (not a new `superadmin` role). (c) Add a **protected** `GET /api/announcements/admin` route that forces `req.user.mosqueId` scope; Manager can pass `?mosqueId=` to choose any of the mosques they oversee, or omit it to get all managed mosques. (d) `POST` returns 403 if `body.mosqueId` ≠ the caller's own `mosqueId` (regular admin) or not in their `managedIds` (manager). (e) `PUT`/`DELETE` scoped by `req.user.mosqueId` (regular admin) or `$in: managedIds` / `?mosqueId=` (manager). (f) Login response includes `mosqueId` so frontend AuthContext has it immediately. (g) Admin frontend uses the new protected endpoint. |

**Steps to reproduce (before fix):**
1. Login as `admin2@emasjid.pk` / `admin123` (Al-Rahman admin per UI label).
2. Navigate to `/admin/announcements`.
3. The list shows BOTH Al-Noor's and Al-Rahman's announcements — not just Al-Rahman's.
4. Attempt to POST a new announcement: the DB row is saved with `mosqueId: undefined` (orphan).

**Expected:** admin2 sees ONLY Al-Rahman items; cannot create/edit any other mosque's data; the form is refused if `body.mosqueId` ≠ their own.
**Actual (before fix):** admin2 sees all items, can create orphans, can attempt to edit other mosques (returns 404 because query was scoped by undefined mosqueId, but the data-leak in GET is the critical hole).

**Why this is a Phase 6 bug, not a Phase 1–5 bug:**
The Phase 1–5 admin pages (Events, Donations, Expenses, Prayer Times, etc.) have the same shape — they all read `getActiveMosqueId()` from navbar localStorage on the frontend, and the backend handlers do scope by `req.user.mosqueId` but only when `req.user.mosqueId` is set. The seed gap exposed it. **Phase 6 fixes the Announcements surface end-to-end; the same fix pattern will need to be repeated for the other modules in their own phases.**

**Verification (after fix):**
- admin2 `GET /api/announcements/admin` → 3 rows, all `mosqueId=Al-Rahman` ✅
- admin `GET /api/announcements/admin` → 5 rows, all `mosqueId=Al-Noor` ✅
- manager (manages Al-Noor) `GET /api/announcements/admin` → 5 rows, all `mosqueId=Al-Noor` ✅
- manager `GET /api/announcements/admin?mosqueId=Al-Noor` → 5 rows ✅
- manager `GET /api/announcements/admin?mosqueId=Al-Rahman` (not their mosque) → 400 ✅
- manager2 (manages Al-Rahman) `GET /api/announcements/admin` → 3 rows, all `mosqueId=Al-Rahman` ✅
- admin2 POST with `body.mosqueId=Al-Noor` → 403 Forbidden ✅
- admin2 PUT an Al-Noor announcement → 404 Not found ✅
- manager POST with `mosqueId=Al-Noor` (managed mosque) → 201, saved to Al-Noor ✅
- manager POST with `mosqueId=Al-Rahman` (NOT managed) → 403 Forbidden ✅