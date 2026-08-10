# 04 Homepage Module - Questions Asked & Answered

> Phase 4 - Step A | Date: 2026-07-31 | All 5 questions answered 2026-08-07

---

## Q1 - Seed data freshness for the FYP demo

**Q:** The seed data has events with hardcoded mid-2026 dates. By the demo they will be in the past. Options: (A) update seed to future dates, (B) leave as-is and re-seed, (C) make dates dynamic.

**A (2026-08-07):** Option **C** — dynamic dates (today + 7, today + 14) applied. Re-seed always produces future events.

---

## Q2 - Hero video asset

**Q:** Does `/assets/images/hero/hero-loop.mp4` (with fallback to `hero-desktop.jpg`) exist? If not the hero shows a solid green background.

**A (2026-08-07):** Background image exists (`naturalWidth=2560` confirmed in test). The hero renders the desktop fallback image cleanly. **No bug.**

---

## Q3 - Hadith of the Day

**Q:** Hardcoded hadith acceptable, or rotate through 7 (recommended), or backend endpoint (over-engineering)?

**A (2026-08-07):** Option **B** — rotate through 7 hadiths, picked by day-of-year modulo 7. Implementation in `Home.jsx:340-357`.

---

## Q4 - Prayer times Next Prayer logic verification

**Q:** Verify Next Prayer highlight works at different times of day? At what time will the demo be?

**A (2026-08-07):** Playwright test verified Next Prayer badge renders and identifies the correct prayer. Logic lives in `Home.jsx` `getNextPrayer()` comparing system time to today's 5 prayer slots + Jummah. **Verified PASS** — no further deep-testing needed for FYP.

---

## Q5 - Mosque-scoped data on the homepage

**Q:** Should I test cross-mosque switch on the homepage (already tested in Phase 3, but Phase 4 tests the data reactivity)?

**A (2026-08-07):** **Yes** — and it is now verified. Test confirms hero text changes from `Masjid Al-Rahman · Lahore` to `Masjid Al-Noor · Sheikhupura` after switching, and all data sections (prayers, events, announcements) refresh because `useEffect` depends on `activeMosqueId`.

---

## All Q1-Q5 resolved — proceeding to Step B/C/D results.
