# 05 Prayer Timings Module - Bugs Found

**Phase 5 — Step C** | Date: 2026-08-10 | All bugs found by code review of `prayerTimes.js` route, `PrayerTime.jsx` public page, `Admin/Pages/PrayerTimes.jsx`, `Home.jsx` widget, and `seed.js`.

**All 11 BUGs approved by client on 2026-08-10.** Fixes applied in this session — see `bugs_fixed.md`.

---

## BUG-PRAYER-001 — Weekly table "Today" badge never shows (date compare)

- **Severity:** Medium (visible regression)
- **Location:** `frontend/src/components/User/Pages/PrayerTimes.jsx:284`
- **Found via:** Code review
- **Steps:** Open `/prayer-times`, scroll to the Weekly Jama'ah Schedule table
- **Expected:** Today's date row has a green "Today" pill badge next to the date
- **Actual:** No badge appears on any row — the comparison always returns false
- **Root cause:**
  ```js
  const today = day.date === new Date().toISOString().slice(0, 10)
  ```
  `day.date` is an ISO datetime from Mongoose (e.g., `"2026-08-10T19:00:00.000Z"`) and `slice(0,10)` returns `"2026-08-10"` — string equality is always false.
- **Proposed fix:** Compare date parts only — `new Date(day.date).toDateString() === new Date().toDateString()`
- **Status:** ✅ **FIXED (FIX-PRAYER-003)**

---

## BUG-PRAYER-002 — Admin PUT uses UTC date slice → late-night PKT edge case

- **Severity:** Low (edge case, but real)
- **Location:** `frontend/src/components/Admin/Pages/PrayerTimes.jsx:90` (and `backend/routes/prayerTimes.js:59`)
- **Found via:** Code review
- **Steps:** Run app at 23:30 PKT (UTC+5), admin clicks "Update Prayer Times"
- **Expected:** Saves times for TODAY (PKT date)
- **Actual:** Saves times for TOMORROW (UTC date) — admin's update is misattributed
- **Root cause:** `new Date().toISOString().slice(0,10)` returns the UTC date, which is already tomorrow in PKT after 19:00 (or 20:00 during DST).
- **Proposed fix:** Use `new Date().toLocaleDateString('sv-SE')` which yields YYYY-MM-DD in local time, in both admin page AND backend route.
- **Status:** ✅ **FIXED (FIX-PRAYER-001)**

---

## BUG-PRAYER-003 — Next-Prayer countdown excludes Jumu'ah on Fridays

- **Severity:** Medium (UX bug)
- **Location:** `frontend/src/components/User/Pages/PrayerTimes.jsx:27-63` (`nextPrayerCountdown` function)
- **Found via:** Code review
- **Steps:** Visit `/prayer-times` on a Friday before Zuhr time
- **Expected:** Countdown says "Jumu'ah" with the Jummah time
- **Actual:** Countdown says "Dhuhr" — confusing because Jumu'ah replaces Zuhr on Fridays
- **Root cause:** `prayersConfig` array only contains the 5 daily prayers, no Jummah entry. The function walks only the 5.
- **Proposed fix:** When `new Date().getDay() === 5` (Friday) AND current time < `jummah` time, treat Jummah as the next prayer instead of Dhuhr. Keep Dhuhr as fallback if no Jummah set.
- **Status:** ✅ **FIXED (FIX-PRAYER-004)**

---

## BUG-PRAYER-004 — Admin page can show wrong mosque's times (localStorage mismatch)

- **Severity:** Medium (data integrity risk)
- **Location:** `frontend/src/components/Admin/Pages/PrayerTimes.jsx:40-41` (uses `getActiveMosqueId()` from localStorage)
- **Found via:** Code review
- **Steps:** Admin of Masjid Al-Rahman uses the navbar mosque selector to switch to Al-Noor (just for browsing). Then opens `/admin/prayer-times`.
- **Expected:** Form shows Al-Rahman times (admin's own mosque)
- **Actual:** Form shows Al-Noor times (localStorage mosque). If admin edits and saves, those Al-Noor values go into the Al-Rahman DB row (because PUT uses `req.user.mosqueId`).
- **Root cause:** Admin form reads from `getActiveMosqueId()` (localStorage), but submit goes to `req.user.mosqueId` (admin's own). Silent mismatch.
- **Proposed fix:** Add a yellow warning banner at the top of the admin page when `getActiveMosqueId() !== req.user.mosqueId`, and force the form to always fetch the admin's own mosque.
- **Status:** ✅ **FIXED (FIX-PRAYER-005)**

---

## BUG-PRAYER-005 — Admin can only edit TODAY's times, not future dates (your new ask)

- **Severity:** High (missing feature)
- **Location:** `frontend/src/components/Admin/Pages/PrayerTimes.jsx` (whole form is "today only")
- **Found via:** Client request (2026-08-10)
- **Steps:** Admin wants to pre-set Ramadan 2027 schedule 6 months in advance
- **Expected:** Admin picks any date, form auto-populates with that date's existing times (or defaults if not yet set), save creates/upserts that date
- **Actual:** No date picker — form only ever handles today
- **Root cause:** `handleSubmit` hardcodes `const today = new Date().toISOString().slice(0, 10)` and never asks which date to edit.
- **Proposed fix:** Add `<input type="date">` at the top of the form. When the date changes, `useEffect` fires `api.getPrayerTimes({ mosqueId, date })` and populates the form. Save submits with the picked date. Public `/prayer-times` page still shows today + next 7 days as before.
- **Status:** ✅ **FIXED (FIX-PRAYER-006)**

---

## BUG-PRAYER-006 — Sunrise time is hardcoded fake `06:45` literal

- **Severity:** Medium (data integrity)
- **Location:** `frontend/src/components/User/Pages/PrayerTimes.jsx:191` (today card) and `:297` (weekly table Sunrise column)
- **Found via:** Code review
- **Steps:** Open `/prayer-times`, look at Sunrise value
- **Expected:** A real, configurable sunrise time for the mosque
- **Actual:** Hardcoded `'06:45'` in two places — same value regardless of mosque, date, season, or actual astronomy
- **Root cause:** No `sunrise` field on the PrayerTime model; designer left a literal placeholder.
- **Proposed fix:** Add `sunrise` field to the PrayerTime model (optional, default empty), expose it in admin form, render it in public today-card + weekly table. If unset, hide the Sunrise column gracefully.
- **Status:** ✅ **FIXED (FIX-PRAYER-002)**

---

## BUG-PRAYER-007 — Backend doesn't validate `sunrise` when added

- **Severity:** Low (preventive)
- **Location:** `backend/routes/prayerTimes.js` validation chain (lines 44-54)
- **Found via:** Code review (paired with BUG-PRAYER-006)
- **Steps:** After adding `sunrise` field, send a PUT with invalid sunrise format
- **Expected:** Backend rejects with 400 + clear message
- **Actual:** No validation rule — would either save garbage or 500
- **Proposed fix:** Add `body('sunrise').optional().isString().trim().isLength({ min: 3, max: 10 })` to the validation chain.
- **Status:** ✅ **FIXED (part of FIX-PRAYER-002)**

---

## BUG-PRAYER-008 — Seed.js doesn't seed future-week demonstration data

- **Severity:** Low (only affects demo)
- **Location:** `backend/utils/seed.js:144-156` (PrayerTime seed loop)
- **Found via:** Client request (Q9, 2026-08-10)
- **Steps:** Re-seed, open admin prayer-times, change the date picker to 30 days ahead
- **Expected:** That future date has times set (demonstrating the feature works)
- **Actual:** Only today + next 6 days are seeded (7-day rolling). Pick a date 2 months out — no data, defaults show.
- **Proposed fix:** Extend seed loop to also include Ramadan 2027 (a month of sample times) so the admin can immediately see "future date has its own times".
- **Status:** ✅ **FIXED (FIX-PRAYER-007)**

---

## BUG-PRAYER-009 — Seed.js has no Ramadan-2027 sample

- **Severity:** Low (demo)
- **Location:** `backend/utils/seed.js`
- **Found via:** Client request (Q9, 2026-08-10)
- **Steps:** Show the admin date picker reaches Ramadan 2027
- **Expected:** A month of Ramadan times is already populated (with shifted fajr/maghrib)
- **Actual:** Nothing for Ramadan 2027 — admin would have to enter all 30 days manually
- **Proposed fix:** Add a second seed block that creates Ramadan-2027 sample times for both mosques, with a comment noting "Ramadan = +30 min on fajr, maghrib = sunset+5".
- **Status:** ✅ **FIXED (part of FIX-PRAYER-007)**

---

## BUG-PRAYER-010 — `weekTimes` rows may have `jummah: null` on non-Friday (cleanup)

- **Severity:** Low (defensive)
- **Location:** `backend/routes/prayerTimes.js:24-27` (week fetch)
- **Found via:** Code review
- **Steps:** Look at the weekly table on a non-Friday row
- **Expected:** `jummah` field is either a time string or undefined
- **Actual:** Returns `null` for non-Friday rows. Public page checks `Boolean(day.jummah)` which handles it, but it's untidy.
- **Proposed fix:** Not strictly needed — `Boolean(null)` is false. Skip for this phase, log as INFO.
- **Status:** ℹ️ **NO FIX NEEDED** (Boolean(null) === false → conditional render works)

---

## BUG-PRAYER-011 — Backend PUT route doesn't normalize timezone of incoming `date`

- **Severity:** Low (paired with BUG-PRAYER-002)
- **Location:** `backend/routes/prayerTimes.js:59`
- **Found via:** Code review
- **Steps:** Admin sends `"2026-08-10"` as the date (YYYY-MM-DD)
- **Expected:** Backend treats it as midnight in PKT, upserts the right row
- **Actual:** `new Date("2026-08-10")` parses as UTC midnight, then `setHours(0,0,0,0)` makes it local midnight — date can shift by a day depending on browser TZ
- **Proposed fix:** Parse YYYY-MM-DD explicitly: split string, construct local Date.
- **Status:** ✅ **FIXED (part of FIX-PRAYER-001)**

---

## Summary

| ID | Bug | Severity | Status |
|----|-----|----------|--------|
| BUG-PRAYER-001 | Weekly "Today" badge never shows | Medium | ✅ Fixed |
| BUG-PRAYER-002 | Admin PUT uses UTC date slice | Low | ✅ Fixed |
| BUG-PRAYER-003 | Jumu'ah missing from countdown | Medium | ✅ Fixed |
| BUG-PRAYER-004 | Admin mosque mismatch silent | Medium | ✅ Fixed |
| BUG-PRAYER-005 | Admin can't edit future dates (new ask) | High | ✅ Fixed |
| BUG-PRAYER-006 | Sunrise hardcoded fake `06:45` | Medium | ✅ Fixed |
| BUG-PRAYER-007 | No `sunrise` validation | Low | ✅ Fixed |
| BUG-PRAYER-008 | No future-week seed data | Low | ✅ Fixed |
| BUG-PRAYER-009 | No Ramadan-2027 seed sample | Low | ✅ Fixed |
| BUG-PRAYER-010 | `jummah: null` on non-Friday rows | Low | ℹ️ No fix needed |
| BUG-PRAYER-011 | Backend date timezone parse | Medium | ✅ Fixed |

**Total: 11 bugs, 10 fixed, 1 marked "no fix needed".**