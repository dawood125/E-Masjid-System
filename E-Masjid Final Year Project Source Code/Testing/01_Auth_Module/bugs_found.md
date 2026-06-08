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

## NOT FOUND (confirmed absent)
- Account lockout after failed attempts
- IP-based throttling
- Captcha
- Device fingerprinting
- Suspicious activity blocks
