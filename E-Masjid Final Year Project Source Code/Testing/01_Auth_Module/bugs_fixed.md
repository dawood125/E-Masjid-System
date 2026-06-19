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

## KEPT (per client request)
- `"Invalid credentials"` error message (no email/password distinction)
- bcrypt hashing (10 rounds)
- JWT + role middleware
- Input sanitization (`mongoSanitize`, `sanitizeString`)
- 401 redirect on expired session (essential security)
