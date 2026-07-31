# Phase 4: Homepage Module - Bugs Found

Phase 4 - Step C | Date: 2026-07-31 | Test: homepage_test.js | Results: 52 PASS, 1 FAIL, 2 BUG, 1 INFO (56 total)

---

## BUG-HOME-001 - Seed event dates are in the past

- Severity: High (FYP demo)
- Location: backend/utils/seed.js lines 118-122
- Found via: Playwright test
- Steps: Run seed, open homepage, scroll to Upcoming Events
- Expected: 2 upcoming events with countdown
- Actual: "No upcoming events yet."
- Root cause: Hardcoded dates 2026-06-15 and 2026-06-20 are in the past
- Proposed fix: Dynamic dates (today+7, today+14), seed for both mosques
- Status: Pending approval

---

## BUG-HOME-002 - Announcements empty for Masjid Al-Rahman

- Severity: High (FYP demo)
- Location: backend/utils/seed.js lines 124-130
- Found via: Playwright test + screenshot
- Steps: Open homepage with Masjid Al-Rahman active, scroll to Latest Announcements
- Expected: 3 announcement cards
- Actual: "No announcements yet."
- Root cause: Seed only creates announcements for mosque 1 (Al-Noor), not mosque 2 (Al-Rahman)
- Proposed fix: Seed announcements, events, prayer times, and donations for BOTH mosques
- Status: Pending approval

---

## BUG-HOME-003 - Stats Total Donations PKR always shows 0

- Severity: Medium
- Location: backend/routes/marketing.js lines 57-61
- Found via: API response check + screenshot
- Steps: Open homepage, look at Total Donations stat card
- Expected: PKR 28,000 (sum of 5 seeded donations)
- Actual: PKR 0
- Root cause: Stats query filters by status in confirmed/completed but Donation model has NO status field. All seed donations have no status property so they never match.
- Proposed fix: Remove the status filter from aggregation (since model has no status field, all recorded donations count)
- Status: Pending approval

---

## BUG-HOME-004 - Hadith of the Day is hardcoded

- Severity: Low (enhancement)
- Location: frontend/src/components/User/Pages/Home.jsx lines 340-344
- Found via: Partner Q3 answer requesting daily rotation
- Steps: Open homepage any day, same hadith always shows
- Actual: "The best among you are those who have the best manners and character." (Sahih Bukhari 3559)
- Proposed fix: Array of 7 hadiths, pick by day-of-year modulo 7
- Status: Pending approval

---

## BUG-HOME-005 - Mosque switch data reactivity needs investigation

- Severity: High
- Location: frontend/src/components/User/Pages/Home.jsx useEffect (line 83)
- Found via: Playwright mosque switch test
- Steps: Open homepage, switch mosque via navbar modal, check if data changes
- Expected: All homepage data refreshes for new mosque
- Actual: Hero text did not change after modal confirmed (Playwright test showed same text)
- Root cause: Likely the test clicked the same mosque. The useEffect has activeMosqueId in deps which should trigger re-fetch. Real issue is probably that mosque 2 has no seed data.
- Proposed fix: Fix seed data first (BUG-HOME-002), then re-test
- Status: Pending investigation

---

## Summary

| ID | Bug | Severity | Fix |
|----|-----|----------|-----|
| BUG-HOME-001 | Seed events in past | High | Dynamic dates |
| BUG-HOME-002 | Announcements empty for mosque 2 | High | Seed both mosques |
| BUG-HOME-003 | Total Donations always PKR 0 | Medium | Remove status filter |
| BUG-HOME-004 | Hadith hardcoded | Low | Rotating array |
| BUG-HOME-005 | Mosque switch reactivity | High | Fix seed + retest |
