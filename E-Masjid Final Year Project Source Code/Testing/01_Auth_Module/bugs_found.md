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

## NOT FOUND (confirmed absent)
- Account lockout after failed attempts
- IP-based throttling
- Captcha
- Device fingerprinting
- Suspicious activity blocks
