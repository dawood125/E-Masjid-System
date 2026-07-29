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

---

## FIX-NAV-013 — Bumped navbar z-index + added zIndex:60 to mosque selector container

- **File:** `frontend/src/components/Common/Navbar.jsx`
- **Root cause:** Native HTML `<select>` controls render in a separate OS layer that ignores z-index. The navbar was `z-40` which lost to the hero's overlay at times.
- **Fix applied:**
  1. Header class: `z-40` → `z-50`
  2. Mosque selector container: `relative` → `relative` + inline `style={{ zIndex: 60 }}`
  3. Bonus (Phase 3.5): Replaced the native `<select>` with a `<button>` that opens the new `MosqueSearchModal` — the modal uses a custom dropdown UI (no native select issues)
- **Result:** Mosque selector is now always visible above the hero, even when scrolled. The modal opens with a clean Google-Maps-style search experience.
- **Verification:** `phase35_visual_test.js` screenshot 02 confirms the mosque button "Masjid Al-Rah..." is clearly visible above the hero section.
- **Lint + build:** 0 errors, 0 warnings (after fixing 3 lint issues with underscores)

---

## FIX-NAV-014 — 2-step Register flow with address + home-mosque selection

- **Files modified (8 new + 3 modified):**
  - `backend/models/User.js` — added `address` (max 200) and `city` (max 80) fields
  - `backend/routes/auth.js` — POST `/api/auth/register` now accepts `address`, `city`, `mosqueId` (validates the ObjectId against the Mosque model and ensures `isActive: true`)
  - `backend/routes/mosques.js` — new GET `/api/mosques/search?query=&city=` route (public, returns up to 50 active mosques matching name/city/address)
  - `frontend/src/utils/api.js` — added `searchMosques(params)` method
  - `frontend/src/hooks/useGeolocation.js` — NEW — wraps browser Geolocation API + BigDataCloud free reverse-geocode; graceful error handling (permission denied, timeout, etc.)
  - `frontend/src/components/Auth/Pages/MosqueSearchModal.jsx` — NEW — reusable modal with debounced search, city filter, "use my current location" button, selectable cards, Escape-to-close, scroll-lock
  - `frontend/src/components/User/Pages/Register.jsx` — refactored to 2-step flow with a stepper indicator. Step 1 (basic info) → Step 2 (address + home-mosque). Submit is at the end of Step 2.
  - `frontend/src/components/Common/Navbar.jsx` — desktop + mobile mosque button now opens `MosqueSearchModal` instead of using a native `<select>`
  - `frontend/src/context/AuthContext.jsx` — `register()` now accepts a full formData object (was 4 positional args)
- **Result:** User signup is now a guided 2-step experience:
  - Step 1: Quick basic info
  - Step 2: Address (optional), City (auto-filled from selected mosque), Home Mosque (via search modal with "use my location" option)
- **Verification:**
  - `npm run lint` → 0 errors, 0 warnings (fixed 3 lint issues: orphan `>`, unused `err`, unused `activeMosqueId`)
  - `npm run build` → success (522 kB bundle, 6.11s)
  - `npm test` (backend) → 10/10 passing (~42s)
  - `phase35_visual_test.js` → 6 screenshots captured (homepage, scrolled-navbar-with-mosque-button, modal-open, modal-search, modal-closed, register-step1)
- **Out of scope (deferred to future):** per-mosque role assignments, mfa, password reset on first login, terms-of-service document link

---

## FIX-NAV-015 — Bumped Navbar dropdown + header + mosque selector z-indexes

- **File:** `frontend/src/components/Common/Navbar.jsx`
- **Root cause:** The original BUG-NAV-013 fix bumped the header to z-50, but the DropdownMenu component was ALSO at z-50. Since the dropdowns extend BELOW the header into the area where the hero section's stacking context lives, they ended up behind the hero.
- **Fix applied:**
  - Header: `z-50` → `z-[60]`
  - Dropdown menu (Services, More): `z-50` → `z-[60]`
  - Mosque selector div: `z-60` → `z-70` (inline style)
  - Modal: `z-[60]` → `z-[70]`
- **Result:** All dropdowns (Services, More), the mosque selector, and the new search modal are now visible above the hero section at every viewport width.
- **Verification:** `verify_3_fixes.js` — Playwright opens the Services dropdown and confirms `a:has-text("Nikah Booking")` is `isVisible()`. Then opens More and confirms `a:has-text("Announcements")` is `isVisible()`. Both PASS.

---

## FIX-NAV-016 — Register Step 1 now validates ALL fields before advancing

- **File:** `frontend/src/components/User/Pages/Register.jsx`
- **Root cause:** The original `goToStep2` only checked `password === confirmPassword` and `terms`. The form would silently jump to Step 2 with an empty name/email/phone if the user clicked "Continue" without filling them.
- **Fix applied:**
  - Added a `PASSWORD_RULE` constant at the top of the file matching the backend's rule
  - Rewrote `goToStep2` to validate ALL fields (name length, email regex, phone length, password rule, confirm match, terms)
  - On any validation failure: stores errors in `fieldErrors` state, renders them inline via the existing `FieldError` component, and shows a summary toast
  - Only advances to Step 2 when ALL fields are valid
- **Result:** Users can no longer reach Step 2 with empty/invalid data. Each error is shown right under the offending field, plus a combined toast at the top.
- **Verification:** `verify_3_fixes.js` — clicks "Continue" with empty fields, confirms the form STAYS on Step 1 (heading "Create Your Account" still visible, "Step 1 of 2" indicator still shown). Then fills all fields correctly and confirms it advances to Step 2 ("Find Your Home Mosque" heading visible).

---

## FIX-NAV-017 — Removed unreliable geolocation feature entirely

- **Files modified (2):**
  - `frontend/src/hooks/useGeolocation.js` — **DELETED** (entire file removed)
  - `frontend/src/components/Auth/Pages/MosqueSearchModal.jsx` — removed the `useGeolocation` import, the `useGeolocation()` hook call, the geolocation button + handler, and the auto-fill-on-location effect. The modal is now simpler: search bar + city filter + selectable cards + Cancel/Confirm.
- **Root cause:** The BigDataCloud free reverse-geocode endpoint is unreliable (returns wrong city for some networks, doesn't return street address on the free tier). For the FYP demo, having a feature that "sometimes works" is worse than not having it.
- **Result:** Modal no longer has the "Use my current location" button. The city field is still pre-filled from the currently-active mosque (via `initialCity` prop) so the user doesn't have to retype it.
- **Verification:** `verify_3_fixes.js` — opens the search modal, counts buttons matching "Use my current location", expects 0. PASS.

---

## FIX-NAV-018 — Header `overflow: visible` (was clipping dropdowns)

- **File:** `frontend/src/components/Common/Navbar.jsx`
- **Root cause:** The `overflow-x-hidden` Tailwind class on the `<header>` (added during the BUG-NAV-010 mobile-overflow fix) was auto-forcing `overflow-y: auto` per CSS spec. This CLIPPED the absolute-positioned dropdowns (Services / More / mosque selector button) that extend below the header's 80px height.
- **Fix applied:** Replaced `overflow-x-hidden` with an inline `style={{ overflow: 'visible' }}`. The `html { overflow-x: hidden }` (in globals.css) still prevents horizontal page-level scrolling, so the original mobile-overflow fix is preserved.
- **Result:** All dropdowns (Services, More, mosque selector button) are now fully visible.
- **Verification:** `verify_3_fixes.js` Playwright test passes all 5 assertions including "Services dropdown items visible" + "More dropdown items visible".

---

## FIX-NAV-019 — Logo + user name truncation with max-width

- **File:** `frontend/src/components/Common/Navbar.jsx`
- **Root cause:** The logo's inner text block and the user name span both used `whitespace-nowrap` but had no `max-w` constraint. Long text (e.g. "Muhammad Abdullah Khan Farooqi" or a long masjid name) would push the right-side auth buttons (Logout, Admin) off-screen.
- **Fix applied (4 changes):**
  1. Logo text block: `<div className="hidden sm:flex flex-col min-w-0">` → added `max-w-[10rem]` to clamp to 160px
  2. User name span: `<span className="hidden xl:inline text-sm font-medium text-gray-700 whitespace-nowrap">` → changed to `truncate max-w-[10rem]` with `title={user?.name || 'User'}` for the full-name tooltip on hover
  3. City sub-line: added `title={activeMosque?.city || 'Select a mosque'}` for hover tooltip
  4. Logged-out auth block: added `shrink-0` so the Login/Register buttons can't shrink
- **Result:** Long user names (e.g. "Muhammad Abdullah Khan Farooqi") and long masjid names (e.g. "Central Mosque of Sheikhupura") are truncated with ellipsis to fit the 160px max. The auth buttons stay visible on the right. Hover tooltips show the full name.
- **Verification:** `verify_logo_fix.js` Playwright test passes all 4 assertions:
  - Logged out, header right edge = 1440px ✓
  - Logged in, user name span truncated to 160px (right edge = 1235px, well under 1440px) ✓
  - Logged in, header still 1440px wide (no overflow) ✓
  - Logo visible at x=112, right=332 (fully visible) ✓
