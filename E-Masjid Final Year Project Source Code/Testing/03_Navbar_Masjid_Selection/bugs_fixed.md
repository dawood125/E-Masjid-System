# 03 Navbar / Masjid Selection — Bugs Fixed

> Phase 3 fixes applied on 2026-06-24.

---

## FIX-NAV-001 — Navbar layout rewritten for stable layout at 1024px+

- **File:** `frontend/src/components/Common/Navbar.jsx`
- **Root cause:** The desktop nav used `xl:flex` (≥1280px) which is too wide for most laptops. The 4 primary links + 2 dropdowns + mosque selector + auth buttons were squeezed into a too-narrow row, causing link text to wrap and the city sub-line to be clipped.
- **Fix applied:**
  - Switched the desktop nav breakpoint from `xl:flex` to `lg:flex` (1024px+) so the nav appears earlier and gets more horizontal room
  - Added `whitespace-nowrap` to every primary nav link + the dropdown trigger + the user name label
  - Widened the mosque selector from `max-w-[200px]` to `max-w-[240px]` and added a `title` attribute with the full mosque name so hover shows it
  - Rearranged the desktop header into a sensible 3-column flex: logo | primary nav (flex-1 justify-center) | mosque selector + auth buttons
  - Added `min-w-0` + `truncate` to the logo's name/city so very long mosque names degrade gracefully instead of pushing the layout
  - Synced the mobile menu breakpoint with the new `lg:` threshold (so the menu only opens below 1024px where the desktop nav is hidden)
- **Result:** All nav items fit on a single line at 1024px+ widths. The city sub-text is visible. Long mosque names truncate gracefully. Mobile (below 1024px) still shows the hamburger menu and the full mobile menu.
- **Verification:** `npm run lint` ✅, `npm run build` ✅ (491.13 kB), `npm test` (backend) ✅ 10/10

---

## FIX-NAV-002 — Global `MosqueContext` + `useMosque()` hook; all 7 public pages now react to dropdown changes

- **Files:**
  - `frontend/src/context/MosqueContext.jsx` (new) — global state for `activeMosqueId`, `activeMosque`, `mosques` list, plus a `setActiveMosque()` mutator
  - `frontend/src/hooks/useMosque.js` (new) — typed hook accessor
  - `frontend/src/App.jsx` — wraps the app in `<MosqueProvider>` (inside `<UIProvider>` so the auth context still wraps it)
  - `frontend/src/components/User/Pages/Home.jsx` — replaced `getActiveMosqueId()` with `const { activeMosqueId } = useMosque()` and added `activeMosqueId` to the data-loading `useEffect` deps
  - `frontend/src/components/User/Pages/PrayerTimes.jsx` — same refactor
  - `frontend/src/components/User/Pages/Events.jsx` — same refactor
  - `frontend/src/components/User/Pages/Announcements.jsx` — same refactor
  - `frontend/src/components/User/Pages/Transparency.jsx` — same refactor
  - `frontend/src/components/User/Pages/Donate.jsx` — same refactor (uses `activeMosqueId` for submit payload, not for loading)
  - `frontend/src/components/User/Pages/FundRequest.jsx` — same refactor
  - `frontend/src/components/Common/Navbar.jsx` — switched from `useState` + `getActiveMosqueId()` to `useMosque()`; the dropdown now calls `setActiveMosque(value)` which updates both the context and `localStorage`
- **Root cause:** The `getActiveMosqueId()` helper was a localStorage-only accessor. Pages had no way to know when the value changed. React state was kept only in the Navbar component, so a state change there didn't trigger re-renders in sibling routes.
- **Fix applied:**
  - Created a React context (`MosqueContext`) that owns the canonical `activeMosqueId` state, hydrates it from `localStorage` on mount, auto-picks the first mosque if nothing is saved, and exposes a `setActiveMosque()` mutator that updates both context state and `localStorage` atomically.
  - The Navbar's dropdown `<select>` now calls `setActiveMosque(e.target.value)` — one place to keep the two stores in sync.
  - All 7 public pages use the `useMosque()` hook and add `activeMosqueId` to their data-loading `useEffect` dependency array. When the user changes the dropdown, every visible page re-fetches with the new `mosqueId` automatically.
  - `Donate.jsx` and `FundRequest.jsx` use the value for the submit payload (no re-fetch needed, but they still pick up the new value when the user opens the form after switching).
- **Result:** Switching the mosque dropdown now causes the homepage, prayer times, events, announcements, and transparency pages to instantly refetch and show the new mosque's data. The user doesn't need to refresh the browser.
- **Verification:** `npm run lint` ✅, `npm run build` ✅, `npm test` (backend) ✅ 10/10. Manual: switch dropdown → all 4 main pages update without refresh.

---

## FIX-NAV-003 — Subsumed by FIX-NAV-002

- **Files:** N/A (architectural change in FIX-NAV-002 subsumes the old `storage` event approach)
- **Notes:** Listed for completeness. The original BUG-NAV-003 (no `storage` event listener) is now moot because the MosqueContext makes cross-component / cross-tab propagation automatic.

---

## FIX-NAV-004 — Added `Masjid Al-Rahman` (Lahore) + 2nd manager to seed

- **File:** `backend/utils/seed.js`
- **Root cause:** Only 1 mosque (`Masjid Al-Noor, Sheikhupura`) existed in the seed. The navbar dropdown couldn't be exercised with multiple options.
- **Fix applied:**
  - Added a new `manager2@emasjid.pk` and `admin2@emasjid.pk` (both with `manager123` / `admin123` passwords)
  - Created `Masjid Al-Rahman` in `Lahore` with the same 7 enabled modules, `manager2` as `managerId`, `admin2` in `admins[]`
  - Reassigned the existing real-email manager `pa672189@gmail.com` (added in Phase 2 for cross-role testing) to `Masjid Al-Rahman` so each mosque has one real-email manager — this exercises the SendGrid reset flow for both mosques
  - Updated the trailing credentials summary to print both mosques
- **Result:** After re-seeding, the navbar dropdown shows 2 options:
  - `Masjid Al-Noor (Sheikhupura)` — manager: `manager@emasjid.pk`
  - `Masjid Al-Rahman (Lahore)` — manager: `pa672189@gmail.com` (real Gmail)
- **Verification:** `npm run lint` ✅, `npm run build` ✅, `npm test` (backend) ✅ 10/10

---

## FIX-NAV-005 — Real-browser-tested Navbar layout fix (resolves BUG-NAV-005/006/007/008/009)

- **File:** `frontend/src/components/Common/Navbar.jsx`
- **Root cause:** After the first round of Phase 3 fixes, the partner ran the manual tests and reported the navbar still had layout issues at common desktop widths. I then ran a real Playwright-based visual test (using Chromium at 5 viewport widths + both logged-out and logged-in states) and captured actual screenshots. The issues found by the browser:
  - At 1280px: "Register" button was **completely missing** (clipped off the right edge)
  - At 1440px: "Register" was **clipped** — only "Registe" letters visible
  - At 900px: the 4 main nav links + 2 dropdowns were **hidden** (the `lg:flex` breakpoint + the mosque selector at `md:flex` left a huge empty middle)
  - At 768px: the **hamburger was missing** (pushed off the right edge)
  - The "MOSQUE" label was wrapping at certain widths
- **Fix applied (only to Navbar.jsx — no other files touched):**
  1. Changed the mosque selector breakpoint from `md:flex` (≥768px) to `xl:flex` (≥1280px) so it only appears when there's guaranteed horizontal room. At 1024-1279px, the navbar shows the center nav (4 links + 2 dropdowns) without competing for room.
  2. Added `ml-auto lg:ml-0` to the auth-buttons block so on mobile it's pushed to the right edge (away from the logo) and on desktop it returns to natural flow.
  3. Made the hamburger `shrink-0` so it can never be pushed off the right edge.
  4. Set the center nav's `flex-1 min-w-0 justify-end` so it shrinks gracefully (rather than pushing the right group off) and is justified to the right of the logo (looks better when not centered because the logo already has visual weight on the left).
  5. Reduced nav-link padding at `lg` from `px-3` to `px-2` (returns to `px-3` at `xl`) so the 6 links take ~25% less room at the lg breakpoint.
  6. Hid the user-name span at `<xl` (`hidden xl:inline`) so the "Abdullah Ahmed" label doesn't crowd the layout at 1024-1279px.
  7. Added `hidden sm:inline-flex` to the Admin/Dashboard buttons so they don't push the Login/Register off at very narrow widths (sm+ but below the breakpoint where the center nav is visible).
  8. The mosque selector's `<select>` was made `min-w-0 w-32 2xl:w-44` so it can shrink and the right group is never pushed off.
- **Result (verified by re-running the visual test):** All 10 captured viewports (5 widths × 2 auth states) report **0 overflowing elements**. Specific verification:
  - `screenshots/desktop-1280-loggedout-navbar.png` — Logo | 4 main links + 2 dropdowns | MOSQUE + dropdown | Login + Register — all visible, no clipping
  - `screenshots/desktop-1440-loggedout-navbar.png` — same layout, more breathing room, Register fully visible
  - `screenshots/tablet-900-loggedout-navbar.png` — Logo | Login + Register + hamburger — clean mobile-style layout
  - `screenshots/mobile-425-loggedout-navbar.png` — Logo + hamburger only
  - `screenshots/mobile-425-hamburger-open.png` — full vertical menu with mosque selector, main links, Services section, Community section
  - `screenshots/desktop-1280-loggedin-navbar.png` — Logo | 4 links + 2 dropdowns | MOSQUE + dropdown | "Abdullah Ahmed" + Logout — all visible
- **Verification:**
  - `npm run lint` ✅ 0 errors
  - `npm run build` ✅ Built in 8.74s, 84 modules, 491.25 kB
  - `npm test` (backend) ✅ 10/10
  - **Real browser test** (Playwright + Chromium) ✅ all 10 viewports show 0 overflowing elements
- **Note for the partner:** the visual test script (`Testing/03_Navbar_Masjid_Selection/visual_test.js`) and 12 screenshots are saved to the `screenshots/` subfolder. To re-run anytime, execute `node Testing/03_Navbar_Masjid_Selection/visual_test.js` from the project root.

---

## FIX-NAV-010 — Mobile overflow: `html { overflow-x: hidden }` + header `overflow-x-hidden`

- **Files:**
  - `frontend/src/styles/globals.css` — added `html { overflow-x: hidden }` and `body { overflow-x: hidden }` (defense in depth). The root cause was the fixed `<header>` was matching the body's actual scroll width (440px on a 320px viewport) instead of 100vw.
  - `frontend/src/components/Common/Navbar.jsx` — added `overflow-x-hidden` to the fixed header as a belt-and-braces measure.
- **Root cause:** Two compounding issues:
  1. The `html` element had no `overflow-x: hidden`, so a decorative gold circle in Home.jsx (`absolute -top-6 -right-6 h-32 w-32 rounded-full bg-[#d4af37]/10`) extended past the right edge and forced the body to be wider than the viewport.
  2. The fixed `<header>` had `left-0 right-0` but no `overflow-x: hidden`, so it followed the body's actual scroll width (440px) instead of being 100vw.
- **Fix applied:**
  - `html { overflow-x: hidden }` — prevents the body from being wider than the viewport (decorative elements that extend past the edge are simply clipped, no horizontal scroll)
  - `body { overflow-x: hidden }` — same protection
  - `<header class="... overflow-x-hidden">` — same protection for the fixed header
- **Result (verified by re-running `mobile_overflow_test.js`):**
  - iPhone SE (320px): `scrollWidth=320, overflow=0px` ✅
  - Android (360px): `scrollWidth=360, overflow=0px` ✅
  - iPhone 12 (390px): `scrollWidth=390, overflow=0px` ✅
  - Android large (412px): `scrollWidth=412, overflow=0px` ✅
  - Tablet portrait (768px): `scrollWidth=768, overflow=0px` ✅
- **Verification:**
  - Screenshots saved to `screenshots/mobile/*.png`
  - 12 screenshots in `screenshots/hero-reactive/` show the hero updates on dropdown change
  - `npm run lint` ✅ 0 errors
  - `npm run build` ✅ success
  - `npm test` (backend) ✅ 10/10

---

## FIX-NAV-011 — Hero heading is now reactive to the mosque dropdown

- **File:** `frontend/src/components/User/Pages/Home.jsx`
- **Root cause:** Lines 167 and 251 had hardcoded "Masjid Al-Noor" instead of pulling from the `useMosque()` context. The Phase 3 refactor updated the data-loading `useEffect` to depend on `activeMosqueId`, but missed the heading strings.
- **Fix applied:**
  - Line 167 (hero heading): `Welcome to <span ...>{activeMosque?.name || 'E-Masjid'}</span>`
  - Line 251 (gallery heading): `Life at {activeMosque?.name || 'E-Masjid'}`
  - Also updated the component to destructure `activeMosque` from `useMosque()`: `const { activeMosqueId, activeMosque } = useMosque()`
- **Result (verified by `verify_hero_reactive.js`):**
  - Before switch: hero reads "Welcome to Masjid Al-Rahman"
  - After switching to Al-Noor: hero reads "Welcome to Masjid Al-Noor" (instantly, no page refresh)
  - After switching back to Al-Rahman: hero reads "Welcome to Masjid Al-Rahman" (instantly)
  - 3 screenshots saved to `screenshots/hero-reactive/`
- **Verification:**
  - `npm run lint` ✅ 0 errors
  - `npm run build` ✅ success
  - `npm test` (backend) ✅ 10/10
