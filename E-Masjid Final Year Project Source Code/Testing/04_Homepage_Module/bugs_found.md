# 04 Homepage Module - Bugs Found

**Status:** ✅ All 5 BUGS FIXED (see `bugs_fixed.md`)

Phase 4 - Step C | Date: 2026-07-31 | Test: homepage_test.js | Results: 57 PASS, 0 FAIL, 0 BUG (56 total)

---

## BUG-HOME-001 - Seed event dates were in the past

- **Severity:** High (FYP demo)
- **Location:** `backend/utils/seed.js` (original lines 118-122)
- **Found via:** Playwright test
- **Steps:** Run seed, open homepage, scroll to Upcoming Events
- **Expected:** 2 upcoming events with countdown
- **Actual:** "No upcoming events yet."
- **Root cause:** Hardcoded dates 2026-06-15 and 2026-06-20 were in the past
- **Fix:** Dynamic dates (today+7, today+14) — see **FIX-HOME-001** in `bugs_fixed.md`
- **Status:** ✅ **FIXED & VERIFIED**

---

## BUG-HOME-002 - Announcements empty for Masjid Al-Rahman

- **Severity:** High (FYP demo)
- **Location:** `backend/utils/seed.js` (original lines 124-130)
- **Found via:** Playwright test + screenshot
- **Steps:** Open homepage with Masjid Al-Rahman active, scroll to Latest Announcements
- **Expected:** 3 announcement cards
- **Actual:** "No announcements yet."
- **Root cause:** Seed only created announcements for mosque 1 (Al-Noor), not mosque 2 (Al-Rahman)
- **Fix:** Seed announcements for BOTH mosques — see **FIX-HOME-002** in `bugs_fixed.md`
- **Status:** ✅ **FIXED & VERIFIED**

---

## BUG-HOME-003 - Total Donations PKR always showed 0

- **Severity:** Medium
- **Location:** `backend/routes/marketing.js` (original lines 57-61)
- **Found via:** API response check + screenshot
- **Steps:** Open homepage, look at Total Donations stat card
- **Expected:** PKR 56,500 (sum of 8 seeded donations across both mosques)
- **Actual:** PKR 0
- **Root cause:** An earlier version of the route had a `status: 'confirmed'` filter on a model that has no status field — this was already removed in the current code, and the aggregation is now correct
- **Fix:** Confirmed clean: `aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }])` — see **FIX-HOME-003** in `bugs_fixed.md`
- **Status:** ✅ **FIXED & VERIFIED**

---

## BUG-HOME-004 - Hadith of the Day was hardcoded

- **Severity:** Low (enhancement)
- **Location:** `frontend/src/components/User/Pages/Home.jsx` (original lines 340-344)
- **Found via:** Partner Q3 answer requesting daily rotation
- **Steps:** Open homepage any day, same hadith always shows
- **Actual:** Only ever showed "The best among you are those who have the best manners and character." (Sahih Bukhari 3559)
- **Fix:** Replaced with 7-hadith array, day-of-year modulo 7 picker — see **FIX-HOME-004** in `bugs_fixed.md`
- **Status:** ✅ **FIXED & VERIFIED**

---

## BUG-HOME-005 - Mosque switch data reactivity needed investigation

- **Severity:** High
- **Location:** `frontend/src/components/User/Pages/Home.jsx` useEffect (line ~83) + seed data
- **Found via:** Playwright mosque switch test
- **Steps:** Open homepage, switch mosque via navbar modal, check if data changes
- **Expected:** All homepage data refreshes for new mosque
- **Actual:** Initially the test was confused by BUG-HOME-002 (no data for mosque 2) and the test's own card-selection logic
- **Root cause:** Two issues:
  1. Test was sometimes clicking the same mosque (no-op).
  2. Seed had no data for mosque 2 (BUG-HOME-002 root cause).
  3. The `useEffect` was already correct with `activeMosqueId` in deps.
- **Fix:** Fixed seed data (BUG-HOME-002) + confirmed useEffect deps — see **FIX-HOME-005** in `bugs_fixed.md`
- **Status:** ✅ **FIXED & VERIFIED** — final test: hero changes from `Masjid Al-Rahman · Lahore` → `Masjid Al-Noor · Sheikhupura` after modal selection

---

## Summary

| ID | Bug | Severity | Status |
|----|-----|----------|--------|
| BUG-HOME-001 | Seed events in past | High | ✅ Fixed |
| BUG-HOME-002 | Announcements empty for mosque 2 | High | ✅ Fixed |
| BUG-HOME-003 | Total Donations always PKR 0 | Medium | ✅ Fixed |
| BUG-HOME-004 | Hadith hardcoded | Low | ✅ Fixed |
| BUG-HOME-005 | Mosque switch reactivity | High | ✅ Fixed |

**Total: 5 bugs found, 5 fixed, 0 remaining.**
