# Auth Module — Bugs Fixed

## FIX-AUTH-001 — Removed rate limiting
- **File:** `backend/server.js`
- **Change:** Removed `express-rate-limit` middleware from `/api/auth`
- **Result:** Unlimited login/register attempts for FYP testing

## FIX-AUTH-002 — Removed artificial delays
- **Files:**
  - `frontend/src/components/User/Pages/Login.jsx`
  - `frontend/src/components/User/Pages/Register.jsx`
  - `frontend/src/components/Admin/Pages/AdminLogin.jsx`
  - `frontend/src/components/Manager/Pages/ManagerLogin.jsx`
  - `frontend/src/components/Committee/Pages/CommitteeLogin.jsx`
- **Change:** Removed `setTimeout(500)` before API calls

## FIX-AUTH-003 — Stronger password validation
- **Files:**
  - `backend/routes/auth.js` — regex: 8+ chars, 1 letter + 1 number
  - `backend/models/User.js` — `minlength: 8`
  - `frontend/src/utils/validation.js` — matching Zod rules for register
- **Kept:** Login still accepts any password length (server validates match)

## FIX-AUTH-004 — Extended JWT session
- **Files:** `backend/.env`, `backend/.env.example`
- **Change:** `JWT_EXPIRE=8h`
- **Kept:** Activity-based token refresh in `AuthContext.jsx`

## FIX-AUTH-005 — Seed data updates
- **File:** `backend/utils/seed.js`
- **Changes:**
  - User password: `user123` → `user1234`
  - Donation type: `Mosque Fund` → `Masjid Fund`

## FIX-AUTH-006/007/008/009 — Logout flow for Admin/Manager/Committee
- **Files:**
  - `frontend/src/components/Common/Sidebar.jsx` (admin + scholar sidebar logout)
  - `frontend/src/components/Manager/Layouts/ManagerLayout.jsx` (manager sidebar logout)
  - `frontend/src/components/Committee/Layouts/CommitteeLayout.jsx` (committee sidebar logout)
- **Root cause:** All three logouts used a `<Link to={ROUTES.HOME}>` with manual `localStorage.removeItem(...)` calls. They bypassed `AuthContext.logout()` so the React `user` state never cleared → Sidebar/Navbar still rendered Logout button, required a second click or page refresh to clear.
- **Fix applied:**
  - Replaced `<Link to={ROUTES.HOME}>` with `<button type="button">`
  - Imported `useNavigate` + `useAuth` in each file
  - `onClick` now: `closeSidebar()` → `logout()` (clears `user` state + `authToken` from `AuthContext`) → `navigate(redirectPath)` (role-specific login URL via `getLogoutRedirectPath()` in AuthContext)
- **Result:**
  - One click → React state clears → Sidebar/Navbar re-render with no Logout button
  - Admin → `/admin/login`
  - Manager → `/manager/login`
  - Committee → `/committee/login`
  - User/Scholar → `/login` (no change — already worked via public Navbar)
- **Pixel-perfect:** Tailwind classes (`flex items-center gap-3 rounded-lg px-4 py-3 ...`), icon, label, and hover styles all preserved — only the wrapper element changed from `<Link>` to `<button>` with `w-full` to occupy the same width.
- **Verification:** `npm run lint` ✅, `npm run build` ✅, `npm test` (backend) 7/7 ✅

## FIX-AUTH-010 — Admin sidebar layout: scrollable middle, pinned header/footer
- **File:** `frontend/src/components/Common/Sidebar.jsx`
- **Root cause:** Footer was `absolute bottom-0 left-0 right-0` — when the 8 nav links + logout were taller than the viewport, the footer overlaid the bottom of the scrollable aside, hiding the last 1-2 links. The single `overflow-y-auto` on `<aside>` couldn't fix this because the footer was outside the normal flow.
- **Fix applied:**
  - Removed `absolute` from the Footer (now `flex-shrink-0` and pinned to bottom of the flex column)
  - Converted `<aside>` to `flex flex-col` with three regions:
    1. Header — `flex-shrink-0` (stays at top)
    2. Middle (nav + divider + logout) — `flex-1 overflow-y-auto` (scrolls independently if too tall)
    3. Footer — `flex-shrink-0` (pinned to bottom)
  - Removed `overflow-y-auto` from the `<aside>` (moved to the inner middle wrapper)
- **Result:** All 8 admin nav links are always reachable. If the viewport is short, a vertical scrollbar appears in the middle region. Header and footer stay anchored.
- **Pixel-perfect:** No color, icon, font, padding, hover, or active-link styling changed. Layout dimensions unchanged for the typical case (all 8 links fit in the viewport — same as before). Only the structural flow changed.
- **Verification:** `npm run lint` ✅, `npm run build` ✅

## FIX-AUTH-011 — Force logout on cross-role login
- **Files:**
  - `frontend/src/hooks/useForceLogoutOnMount.js` (new — reusable hook)
  - `frontend/src/components/User/Pages/Login.jsx`
  - `frontend/src/components/Admin/Pages/AdminLogin.jsx`
  - `frontend/src/components/Manager/Pages/ManagerLogin.jsx`
  - `frontend/src/components/Committee/Pages/CommitteeLogin.jsx`
- **Root cause:** When a user was already authenticated (e.g., as Admin) and visited another role's login page, the old session lingered in localStorage and React state. The new login would silently overwrite, but there was no user-visible feedback and the two sessions briefly co-existed in `AuthContext`.
- **Fix applied:**
  - Created `useForceLogoutOnMount` hook: on mount, if `isAuthenticated` is true and `user` exists, calls `AuthContext.logout()` and shows a 4-second info toast (`"Signed out from your previous [Role] session. Please sign in below."`).
  - Hook uses `useRef` to ensure it runs only once per mount (not on every re-render).
  - Hook bails out if `AuthContext.loading` is true (waits for the initial `getMe()` call to resolve before deciding).
  - Hook no-ops if user is not authenticated.
  - Wired into all 4 login pages (scholar uses the public `Login.jsx` via role selector, so it's already covered).
  - Existing `useEffect` redirect-to-dashboard behavior on each login page is preserved (handles the "same-role already logged in" case where the new mount finds a valid session for that role).
- **Result:**
  - Admin logged in → visits `/manager/login` → toast appears → old session cleared → Manager login form is ready to use → submit creates a fresh Manager session
  - Same flow works for every pair of roles
  - No two sessions can co-exist
- **Pixel-perfect:** No visual changes to the login form. The toast is the existing `Toast` component (already styled and animated).
- **Verification:** `npm run lint` ✅, `npm run build` ✅, `npm test` (backend) 7/7 ✅

## FIX-AUTH-012 — Global Toast at App root (one mount, not 5)
- **Files:**
  - `frontend/src/App.jsx` (added `<Toast />` once inside `<UIProvider>`)
  - `frontend/src/components/User/Layouts/UserLayout.jsx` (removed duplicate)
  - `frontend/src/components/Admin/Layouts/AdminLayout.jsx` (removed duplicate)
  - `frontend/src/components/Scholar/Layouts/ScholarLayout.jsx` (removed duplicate)
  - `frontend/src/components/Manager/Layouts/ManagerLayout.jsx` (removed duplicate)
  - `frontend/src/components/Committee/Layouts/CommitteeLayout.jsx` (removed duplicate)
- **Root cause:** `<Toast />` was mounted only in 5 layout components. Login pages do not use any of those layouts, so when login/register/forgot-password/reset-password pages called `showToast()`, the state was set but nothing rendered. This affected:
  - Wrong-password red error toasts on all 4 login pages
  - Cross-role force-logout info toast (BUG-AUTH-011)
  - Any future page outside the 5 layouts (forgot-password, reset-password, public landing pages that call showToast)
- **Fix applied:**
  - Mounted `<Toast />` once at App root, inside `<UIProvider>` and **outside** `<Routes>`, so it persists across every page.
  - Removed 5 duplicate `<Toast />` mounts from the layout files to avoid multiple instances (which could cause double-rendering or stacking issues).
  - `Toast` component reads from `useUI()` context → already works with the single instance.
- **Result:**
  - All toasts now appear on every page including login, register, forgot-password, reset-password, and the public home.
  - Single source of truth — no risk of multiple Toast instances.
- **Verification:** `npm run lint` ✅, `npm run build` ✅, `npm test` (backend) 7/7 ✅

## KEPT (per client request)
- `"Invalid credentials"` error message (no email/password distinction)
- bcrypt hashing (10 rounds)
- JWT + role middleware
- Input sanitization (`mongoSanitize`, `sanitizeString`)
- 401 redirect on expired session (essential security)
