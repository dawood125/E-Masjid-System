# 03 Navbar / Masjid Selection — Bugs Found

> Phase 3 verification done on 2026-06-24.
> Verification source: code-path analysis + automated lint/build/test.

---

## BUG-NAV-001 — Navbar layout breaks at common desktop widths

- **Severity:** High (visible to every visitor)
- **Location:** `frontend/src/components/Common/Navbar.jsx` lines 140-211 (the desktop header)
- **Steps to Reproduce (from partner's screenshot):**
  1. Open `http://localhost:5173` on a 1280-1440px wide browser window
  2. Look at the navbar
- **Expected:** All nav items (Home, Prayer Times, Events, Donate, Services, More) fit on a single line. The mosque name + city display nicely. The "Logout / Login" buttons are aligned to the right.
- **Actual:**
  - The "MASQUE" text in the screenshot was actually the city sub-text ("Sheikhupura") being clipped because the parent logo column was `shrink-0` and the available horizontal space was exhausted by the mosque selector + nav links + auth buttons.
  - "Prayer Times" and "Donate" wrap to 2 lines because the `<Link>` had no `whitespace-nowrap`.
  - The mosque selector text "Masjid Al-Noor (Sheikhupura)" was truncated to "Masjid Al-Noor (Sheikh..." because `max-w-[200px]` was too narrow.
- **Status:** FIXED (FIX-NAV-001, 2026-06-24). See `bugs_fixed.md`.

---

## BUG-NAV-002 — Switching the mosque dropdown does NOT re-fetch data on the Home page (or any other public page)

- **Severity:** High (data correctness)
- **Location:** `frontend/src/components/User/Pages/Home.jsx` (and 6 other public pages)
- **Steps to Reproduce:**
  1. Open the homepage
  2. Change the mosque selector to a different mosque
- **Expected:** Prayer times, events, and announcements shown on the homepage immediately update to reflect the newly selected mosque
- **Actual:** Nothing changes. The user has to manually refresh the browser to see the new mosque's data. The `useEffect` in each public page reads `getActiveMosqueId()` once on mount and doesn't depend on the active mosque value.
- **Status:** FIXED (FIX-NAV-002, 2026-06-24). See `bugs_fixed.md`.

---

## BUG-NAV-003 — Public pages don't listen to mosque context changes

- **Severity:** Medium (subsumed by FIX-NAV-002; listed for completeness)
- **Location:** All 7 public pages
- **Root cause:** No global state for the active mosque. Pages called the standalone `getActiveMosqueId()` helper which reads from `localStorage` but provides no reactive hook.
- **Status:** FIXED (FIX-NAV-002, 2026-06-24). The new `MosqueContext` + `useMosque()` hook subsumes the need for a separate `storage` event listener.

---

## BUG-NAV-004 — Only 1 mosque in seed (multi-mosque dropdown untestable)

- **Severity:** Medium (blocks Phase 3 Test 2)
- **Location:** `backend/utils/seed.js`
- **Steps to Reproduce:**
  1. After running `node utils/seed.js`, look at the navbar dropdown
- **Expected:** Dropdown shows 2+ mosques (so the user can test switching)
- **Actual:** Only 1 mosque (`Masjid Al-Noor, Sheikhupura`) exists.
- **Status:** FIXED (FIX-NAV-004, 2026-06-24). See `bugs_fixed.md`.
