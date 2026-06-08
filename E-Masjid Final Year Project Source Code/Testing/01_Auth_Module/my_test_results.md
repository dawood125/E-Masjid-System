# Auth Module — Automated Test Results

**Date:** 2026-06-05  
**Environment:** Local (integration tests use in-memory MongoDB)

---

## Backend Integration Tests

```
npm test → PASS (7/7)
```

Auth-related paths exercised:
- Token generation via test user creation
- `GET /api/auth/me` with Bearer token ✓

---

## Code Audit Results

| Check | Result |
|-------|--------|
| Rate limiting on `/api/auth` | REMOVED |
| Account lockout logic | Not found in codebase |
| Captcha / fingerprinting | Not found |
| bcrypt password hashing | Present (10 rounds) |
| JWT expiry | Set to `8h` |
| Password min length (API) | 8 chars + letter + number |
| Mock login delays (frontend) | REMOVED from all 5 login/register pages |

---

## Seed Script

```
node utils/seed.js → FAILED (ECONNREFUSED — MongoDB Atlas DNS unreachable from this environment)
```

**Action required (on your machine with internet):**
```bash
cd backend
node utils/seed.js
```

Updated credentials after re-seed:
| Role | Email | Password |
|------|-------|----------|
| Manager | manager@emasjid.pk | manager123 |
| Admin | admin@emasjid.pk | admin123 |
| Scholar | scholar@emasjid.pk | scholar123 |
| Committee | committee@emasjid.pk | committee123 |
| User | user@emasjid.pk | **user1234** (changed) |

---

## Manual Verification Needed (by client)

- [ ] 50+ rapid logins without "too many requests" error
- [ ] All 5 role logins redirect correctly
- [ ] New user registration with 8+ char password
- [ ] Wrong password shows "Invalid credentials" (no lockout)
- [ ] Session stays active for 2+ hours of use
- [ ] Logout works for all roles

**Status:** Awaiting client/partner manual test results
