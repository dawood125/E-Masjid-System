# 03 Navbar / Masjid Selection — Phase 3B Visual Bug Report (PENDING VISUAL CONFIRMATION)

> Source of this report: code-path analysis of `frontend/src/components/Common/Navbar.jsx`
> (re-verified 2026-07-06) plus the partner's three reported symptoms.
> Visual confirmation pending — the user must run `visual_test.js` from a
> Playwright-capable environment to produce the 12+ PNGs and check
> `visual_test_findings.json`.

---

## How to actually run the visual test

The Playwright MCP tools the agent was given are not present in this Claude
Code environment, so the visual test has to be driven from your machine.

```
# from the project root
npm i -D playwright
npx playwright install chromium

# then in a terminal where backend + frontend are already running
node "Testing/03_Navbar_Masjid_Selection/visual_test.js"
```

The script will write:
- `Testing/03_Navbar_Masjid_Selection/screenshots/*.png` (12+ files)
- `Testing/03_Navbar_Masjid_Selection/visual_test_findings.json` (overflow data)

It also prints a one-line `[OVERFLOW]/[ok]` status per viewport to stdout.

---

## Code-path analysis — predicted issues

These are issues that are *almost certainly* visible, based on reading the
JSX directly. Severity and exact pixel-width bounds are best-effort and
should be re-confirmed against the screenshots.

### BUG-NAV-101 — "Register" button clipped at the right edge on desktop

- **Severity:** High
- **Reported:** Test 1, 1280-1440px
- **Location:** `frontend/src/components/Common/Navbar.jsx:186-220`
- **Root cause (predicted):**
  - The header container is `h-20 flex items-center gap-3 lg:gap-5`.
  - Left column: logo icon (h-12 w-12) + name/city text — has `min-w-0` and
    `truncate` so it can shrink.
  - Center: primary nav (4 links + 2 dropdowns) is `flex-1 justify-center`.
    The nav links have `whitespace-nowrap` so they cannot wrap.
  - Right (md+): "Mosque" label + `<select>` (max-w-[240px]) — has
    `shrink-0`.
  - Right-most: `Login` / `Register` buttons (or Logout + name) inside a
    flex container with `shrink-0`.
  - The two right-side blocks (mosque selector + auth buttons) are both
    `shrink-0`, while the center nav is `flex-1`. When the viewport narrows
    toward 1280px, the center nav still has `flex-1` but the items inside
    are `whitespace-nowrap` and 6 buttons wide, so they refuse to shrink.
    The flex container will then push its right boundary outside the
    available space, and because the right-side blocks are `shrink-0`,
    they get pushed past the right edge of the viewport.
- **What to look for in screenshots:** at 1280-loggedout.png and
  -1440-loggedout.png, the "Register" button should be flush with (or
  slightly off) the right edge of the page; the select dropdown for the
  mosque may also overlap the auth buttons.
- **Workaround in the test:** `visual_test.js` records which elements
  have `right > innerWidth` and prints them.

### BUG-NAV-102 — Tablet widths (768-900px) look wrong

- **Severity:** High
- **Reported:** Test 2, 768-1023px
- **Location:** same Navbar.jsx
- **Root cause (predicted):**
  - The Tailwind breakpoint is `lg:` = 1024px. So between 768 and 1023 the
    desktop nav (`hidden lg:flex`) is hidden — but the mosque selector
    is `hidden md:flex` (768px+), so the mosque selector IS visible at
    tablet widths.
  - The auth buttons (`hidden sm:flex`) are visible from 640px up.
  - The hamburger is `lg:hidden` = visible at <1024px.
  - So at 900px you get: logo + mosque-selector + (Login/Register) +
    hamburger. The center nav links and dropdowns are gone but the
    mosque selector is still inline. This is the "hamburger + buttons
    are on the right but the layout is wrong" the partner described.
  - The mosque selector label "Mosque" + the 240px-wide `<select>` and
    the auth buttons together exceed the available width and the auth
    buttons get pushed off-screen — same shrink-0 conflict as the
    desktop case.
- **What to look for in screenshots:** at tablet-768-loggedout.png and
  tablet-900-loggedout.png, the Login/Register buttons should be missing
  or overlapping the mosque selector. The hamburger should be the
  rightmost visible element.

### BUG-NAV-103 — Mobile widths (<768px) look wrong

- **Severity:** High
- **Reported:** Test 3, <768px
- **Location:** same Navbar.jsx
- **Root cause (predicted):**
  - At <768px the mosque selector (`hidden md:flex`) is hidden — good.
  - Auth buttons (`hidden sm:flex`) are hidden until 640px, so below
    640px the only right-side element is the hamburger — good.
  - But between 640-767px the auth buttons are visible AND the
    hamburger is visible, with no mosque selector to crowd them. This
    is the same width-crunch problem in miniature: 3 `shrink-0` items
    (Login, Register, hamburger) + logo (with name+city) on a narrow
    viewport, all in a single flex row, with no `flex-1` element to
    absorb slack. The buttons can wrap below the logo, or the logo
    name/city can truncate to nothing.
  - At <640px, only Login/Register + hamburger — but the partner said
    they are "not appearing on the right side", so there may be an
    additional bug where the flex direction is wrong, or the hamburger
    is actually being drawn off-screen.
- **What to look for in screenshots:** at mobile-425-loggedout.png, the
  rightmost edge should show: Login button, Register button, hamburger.
  Check whether any of them are clipped, wrapping to a new line, or
  sitting underneath the logo.

### BUG-NAV-104 — "Mosque" label appears above the `<select>` on tablet

- **Severity:** Medium
- **Location:** `Navbar.jsx:167-183`
- **Root cause (predicted):** the wrapper is `flex items-center gap-2`
  — items should be on one line. But the `<select>` is a native
  browser control with default styling; on some Chromium builds, the
  intrinsic min-width of a `<select>` (around 130px) combined with the
  uppercase "Mosque" label and the 240px `max-w-` cap can cause the
  flex container to wrap. If `flex-wrap` is the default (no, it isn't
  by default — it would have to be `flex-wrap: wrap` to wrap), then
  they should stay on one line; but the *truncate* class on the select
  may visually crop the "Masjid Al-Noor (Sheikhupura)" text to
  "Masjid Al-Noor (Sheikh..." — that itself is a bug.
- **What to look for in screenshots:** the `<select>` rendered value
  should show the full "Masjid Al-Noor (Sheikhupura)" or "Masjid
  Al-Rahman (Lahore)". If you see "(Sheikh..." truncation, that is
  BUG-NAV-104.

### BUG-NAV-105 — City sub-text "Sheikhupura" clipped at desktop

- **Severity:** Medium
- **Location:** `Navbar.jsx:120-127`
- **Root cause (predicted):** the logo block has `min-w-0` and the
  two `<span>`s have `truncate`. This is *intentional* — it should
  truncate gracefully, not overflow. But if BUG-NAV-101 is happening,
  the available space for the logo block is being squeezed and you may
  see "Sheikhupura" reduced to "Sheikh..." or "S..." with the
  ellipsis. That is a downstream symptom of BUG-NAV-101, not a
  separate bug.
- **What to look for in screenshots:** at desktop-1280-loggedout.png,
  read the text under the mosque icon. If you see "Sheikhupura" in
  full, BUG-NAV-101 is probably not pushing the auth buttons off-screen
  — it may be that the partner's screenshot showed the *city* text
  being clipped, not the "Register" button. Cross-check the
  -navbar.png crops carefully.

### BUG-NAV-106 — Mobile menu drawer missing close affordance / content overflow

- **Severity:** Low
- **Location:** `Navbar.jsx:237-349`
- **Root cause (predicted):** the mobile menu is `fixed top-20 inset-x-0
  bottom-0 ... overflow-y-auto`. The toggle button is `lg:hidden` so it
  only appears on small screens — good. The icon swaps from `menu` to
  `close` when `mobileMenuOpen` is true — good. But the menu has a
  "Select Mosque" dropdown at the top + a vertical list of links +
  Login/Register/Logout at the bottom. The links use `text-base py-3.5`
  which is 1rem / 14px line height = ~52px per row, × 10+ items = a
  scrollable menu. The partner should be able to scroll the list
  inside the drawer.
- **What to look for in screenshots:** at
  mobile-425-hamburger-open-fullpage.png, the drawer should be a
  vertical stack with: "Select Mosque" select, "Main" section
  (Home/Prayer Times/Events/Donate), "Services" section, "Community"
  section, then Login/Register buttons at the bottom. There should
  be no horizontal scroll.

---

## Worst 5 (ranked) — what to fix first

1. **BUG-NAV-101** — "Register" button clipped / off-screen on desktop
   1280px. Visible to every visitor on a common laptop. Worst symptom
   because it hides the only call-to-action on the page.
2. **BUG-NAV-102** — tablet layout (768-1023px) is broken. The whole
   band looks "wrong" with the mosque selector inline but the nav
   links hidden.
3. **BUG-NAV-103** — mobile layout (<768px) auth buttons disappear or
   overlap. Critical for the largest segment of users (phones).
4. **BUG-NAV-105** — city sub-text truncation. Cosmetic, but a
   regression that came with BUG-NAV-101.
5. **BUG-NAV-104** — `<select>` value truncation. Cosmetic, but the
   full mosque name is important for multi-mosque users.

---

## Open question for the partner

> The partner reported the desktop bug as "Register button clipped at
> the right edge". The code analysis suggests the same root cause
> (shrink-0 conflict in the right-side flex chain) is also responsible
> for the city sub-text being clipped — these are *the same bug with
> two visible symptoms*. If the partner confirms BUG-NAV-101 is fixed,
> BUG-NAV-105 should also be fixed automatically. Please confirm after
> re-running the visual test.

---

## Files produced

- `Testing/03_Navbar_Masjid_Selection/visual_test.js` — the Playwright
  driver. Re-runnable.
- `Testing/03_Navbar_Masjid_Selection/screenshots/` — destination for
  the 12+ PNGs.
- `Testing/03_Navbar_Masjid_Selection/visual_test_findings.json` —
  machine-readable overflow data per viewport.
- `Testing/03_Navbar_Masjid_Selection/bugs_found_phase3b.md` — this
  report.
