# Auth Module — Bugs Found

## BUG-AUTH-001 — Rate limiting blocks normal testing
- **Severity:** Critical
- **Location:** `backend/server.js` — `express-rate-limit` on all `/api/auth` routes
- **Steps:** Login/register 11+ times in 15 minutes
- **Expected:** Login always works
- **Actual:** `"Too many requests, please try again later"`
- **Status:** FIXED

## BUG-AUTH-002 — Artificial login delay (feels stuck)
- **Severity:** Medium
- **Location:** All login pages + Register (`setTimeout(500)`)
- **Steps:** Submit login form
- **Expected:** Immediate API response
- **Actual:** 500ms forced wait before API call
- **Status:** FIXED

## BUG-AUTH-003 — Password rules too weak (6 chars)
- **Severity:** Medium
- **Location:** `backend/routes/auth.js`, `backend/models/User.js`, `frontend/src/utils/validation.js`
- **Expected:** Min 8 chars + letter + number
- **Actual:** Min 6 chars only
- **Status:** FIXED

## BUG-AUTH-004 — Session expires too fast for testing
- **Severity:** Medium
- **Location:** `backend/.env` — `JWT_EXPIRE=1h`
- **Expected:** 8 hours during FYP testing
- **Actual:** 1 hour
- **Status:** FIXED

## BUG-AUTH-005 — Seed user password below new minimum
- **Severity:** Low
- **Location:** `backend/utils/seed.js` — `user123` (7 chars)
- **Expected:** Password meets 8-char rule
- **Actual:** `user123` fails new validation if re-registered
- **Status:** FIXED (`user1234`)

## BUG-AUTH-006 — Admin logout button stays visible after logout
- **Severity:** High
- **Location:** `frontend/src/components/Common/Sidebar.jsx:89-99`
- **Steps:**
  1. Login as Admin (`admin@emasjid.pk / admin123`)
  2. Click the Logout button in the sidebar
- **Expected:** Session ends, UI re-renders showing Login button, redirects to `/admin/login`
- **Actual:** React `user` state never cleared (logout bypassed `AuthContext.logout()`), so Sidebar + Navbar still rendered Logout button. User had to click logout twice or refresh page.
- **Status:** FIXED

## BUG-AUTH-007 — Manager logout button stays visible after logout
- **Severity:** High
- **Location:** `frontend/src/components/Manager/Layouts/ManagerLayout.jsx:69-72`
- **Steps:**
  1. Login as Manager (`manager@emasjid.pk / manager123`)
  2. Click the Logout button in the sidebar
- **Expected:** Session ends, redirects to `/manager/login`
- **Actual:** Same as BUG-AUTH-006 — manual `localStorage.removeItem` only, `AuthContext.logout()` not called. Redirect went to `/` (homepage) not `/manager/login`.
- **Status:** FIXED

## BUG-AUTH-008 — Committee logout button stays visible after logout
- **Severity:** High
- **Location:** `frontend/src/components/Committee/Layouts/CommitteeLayout.jsx:62-65`
- **Steps:**
  1. Login as Committee (`committee@emasjid.pk / committee123`)
  2. Click the Logout button in the sidebar
- **Expected:** Session ends, redirects to `/committee/login`
- **Actual:** Same as BUG-AUTH-006/007. Redirect went to `/` (homepage) not `/committee/login`.
- **Status:** FIXED

## BUG-AUTH-009 — Logout redirects all roles to homepage (not role-specific login)
- **Severity:** High
- **Location:** Same three locations as above
- **Expected:** Each role lands on its own login page
- **Actual:** All three broken logouts used `<Link to={ROUTES.HOME}>` — they sent the user to the public homepage, not the role's login page
- **Status:** FIXED (replaced `<Link>` with `<button onClick>` that calls `AuthContext.logout()` → `navigate(getLogoutRedirectPath(role))`)

## BUG-AUTH-010 — Admin sidebar bottom navigation links hidden / not scrollable
- **Severity:** High
- **Location:** `frontend/src/components/Common/Sidebar.jsx:107`
- **Steps:**
  1. Login as Admin
  2. Look at the sidebar — header on top, 8 nav links, divider, Logout, footer pinned to bottom
  3. Observe the last 1-2 nav links (Manage Scholars, Committee Members, Fund Requests)
- **Expected:** All 8 links are visible, or sidebar scrolls so the last links are reachable
- **Actual:** The "Footer" div was `absolute bottom-0` and overlaid the bottom of the scrollable area, hiding the last links. The single `overflow-y-auto` on the `<aside>` did not help because the footer was absolutely positioned outside the normal flow.
- **Status:** FIXED (converted aside to `flex flex-col` with three children: `flex-shrink-0` header, `flex-1 overflow-y-auto` middle (nav + logout), `flex-shrink-0` footer pinned to bottom — no absolute positioning needed)

## BUG-AUTH-011 — Cross-role login: previous session not cleared
- **Severity:** High (security hygiene)
- **Location:** All 4 login pages (`Login.jsx`, `AdminLogin.jsx`, `ManagerLogin.jsx`, `CommitteeLogin.jsx`)
- **Steps:**
  1. Login as Admin (`admin@emasjid.pk`)
  2. Without logging out, navigate to `/manager/login`
  3. Login as Manager (`manager@emasjid.pk`)
- **Expected:** Previous Admin session is automatically ended before the new Manager login. The new session replaces the old one. A brief toast tells the user they were signed out.
- **Actual:** Old session persisted in localStorage and `AuthContext` state. The new login would silently overwrite, but there was no notification and the two sessions briefly co-existed in React state.
- **Status:** FIXED (created `frontend/src/hooks/useForceLogoutOnMount.js` and wired it into all 4 login pages — runs once on mount, calls `AuthContext.logout()` if already authenticated, then shows a 4-second info toast)

## BUG-AUTH-012 — Toast notifications never render on login pages
- **Severity:** High
- **Location:** All 4 login pages (`Login.jsx`, `AdminLogin.jsx`, `ManagerLogin.jsx`, `CommitteeLogin.jsx`) and 5 layouts
- **Steps:**
  1. Go to `/login` (logged out)
  2. Enter wrong password 5 times in a row
  3. Each wrong attempt calls `showToast(err.message, 'error')`
- **Expected:** Red error toast appears on every wrong attempt
- **Actual:** No toast visible. The `showToast()` call updates `UIContext.toast` state, but `<Toast />` was only mounted inside the 5 layout components (Admin, Manager, Committee, User, Scholar). Login pages do not use any of those layouts → `<Toast />` is not in the React tree → state changes have nothing to render. Same issue affected the cross-role force-logout toast (BUG-AUTH-011) and the "successfully logged in" / "login failed" toasts on all 4 login pages.
- **Status:** FIXED (moved `<Toast />` to a single instance at App root, inside `<UIProvider>` and outside `<Routes>`, so it persists across all pages. Removed the 5 duplicate mounts from the layouts.)

## NOT FOUND (confirmed absent)
- Account lockout after failed attempts
- IP-based throttling
- Captcha
- Device fingerprinting
- Suspicious activity blocks
