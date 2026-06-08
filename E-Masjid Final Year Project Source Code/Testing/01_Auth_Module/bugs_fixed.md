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

## KEPT (per client request)
- `"Invalid credentials"` error message (no email/password distinction)
- bcrypt hashing (10 rounds)
- JWT + role middleware
- Input sanitization (`mongoSanitize`, `sanitizeString`)
- 401 redirect on expired session (essential security)
