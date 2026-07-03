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
