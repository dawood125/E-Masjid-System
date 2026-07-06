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

---

## BUG-NAV-005 — "Register" button completely missing at 1280px desktop (real browser screenshot)

- **Severity:** High (visible to every visitor at the most common laptop width)
- **Location:** `frontend/src/components/Common/Navbar.jsx` (the desktop header)
- **Found via:** Real Chromium browser at 1280px viewport (Playwright visual test, screenshot `desktop-1280-loggedout-navbar.png`)
- **Steps to Reproduce:**
  1. Open the frontend at exactly 1280px wide
  2. Look at the navbar
- **Expected:** Login + Register buttons are both visible on the right
- **Actual:** Only "Login" is visible. "Register" is pushed off-screen or hidden.
- **Root cause:** The header has 4 flex children that all `shrink-0` (or refuse to shrink). The center nav with 6 `whitespace-nowrap` items has a minimum width of ~600px, plus the logo (~200px) + mosque selector (~280px) + auth buttons (~180px) = ~1260px minimum. At exactly 1280px, the center nav's `flex-1` has zero room to absorb slack, and the rightmost `shrink-0` chain (mosque selector + auth) gets clipped — the right edge of "Register" goes off-screen.
- **Status:** FIXED (FIX-NAV-005, 2026-06-24). See `bugs_fixed.md`.

---

## BUG-NAV-006 — "Register" button clipped at 1440px desktop

- **Severity:** High
- **Location:** Same as BUG-NAV-005
- **Found via:** Real Chromium browser at 1440px viewport (screenshot `desktop-1440-loggedout-navbar.png`)
- **Actual:** Only "Registe" letters of "Register" are visible, cut off at the right edge of the viewport.
- **Root cause:** Same as BUG-NAV-005 — at 1440px, the center nav with `flex-1 justify-center` plus all `whitespace-nowrap` items left no room for the right-side group at full width.
- **Status:** FIXED (FIX-NAV-005, 2026-06-24). The same fix resolves both BUG-NAV-005 and BUG-NAV-006.

---

## BUG-NAV-007 — No primary nav links visible at 900px tablet (huge empty middle area)

- **Severity:** High
- **Location:** Same as BUG-NAV-005
- **Found via:** Real Chromium browser at 900px viewport (screenshot `tablet-900-loggedout-navbar.png`)
- **Actual:** The 4 main links (Home, Prayer Times, Events, Donate) and the 2 dropdowns (Services, More) are HIDDEN. The navbar shows only logo + mosque selector + Login/Register + hamburger, with a huge empty middle area. The center nav uses `hidden lg:flex` so it's gone below 1024px.
- **Root cause:** The 4 main nav links + 2 dropdowns are gated behind `lg:flex` (1024px+). At 900px the user sees a half-empty navbar.
- **Status:** FIXED (FIX-NAV-005, 2026-06-24) — actually resolved by moving the mosque selector to `xl:flex` (1280px+) instead of `md:flex` (768px+). Now at 900px, the layout is mobile-style (no mosque selector, hamburger visible) which is the correct progressive-disclosure pattern. At 1024-1279px, the center nav shows + the mosque selector is still hidden (saved room for the nav links). At 1280px+, everything shows.

---

## BUG-NAV-008 — No hamburger visible at 768px tablet

- **Severity:** Medium
- **Location:** Same as BUG-NAV-005
- **Found via:** Real Chromium browser at 768px viewport (screenshot `tablet-768-loggedout-navbar.png`)
- **Steps to Reproduce:**
  1. Open the frontend at 768px wide
  2. Look at the navbar
- **Expected:** A hamburger icon (☰) should be visible somewhere (the mobile menu toggle)
- **Actual:** No hamburger visible. Only logo + Login + Register are shown.
- **Root cause:** Looking at the screenshot — actually the hamburger IS rendered but is being pushed off the right edge by the wide `Login + Register` buttons (which are now `shrink-0` with `ml-auto` but the hamburger has no `shrink-0` so it gets squashed). This is the same root-cause as BUG-NAV-005/006: `shrink-0` items not balanced with `flex-1`.
- **Status:** FIXED (FIX-NAV-005, 2026-06-24). The hamburger is now `shrink-0` and the auth buttons block has proper layout.

---

## BUG-NAV-009 — Mosque selector label "MOSQUE" appearing on its own line at certain widths

- **Severity:** Low (cosmetic, visible only at awkward widths)
- **Location:** Same as BUG-NAV-005
- **Found via:** Earlier screenshot (this was the "MASQUE" in the original partner screenshot — the label was wrapping because of the cramped layout)
- **Actual:** At 1024-1279px (lg but not xl), the navbar has the center nav + mosque selector fighting for room, causing the "MOSQUE" label to wrap.
- **Status:** FIXED (FIX-NAV-005, 2026-06-24). The mosque selector is now `xl:flex` so the label doesn't appear until 1280px where there's guaranteed room.
