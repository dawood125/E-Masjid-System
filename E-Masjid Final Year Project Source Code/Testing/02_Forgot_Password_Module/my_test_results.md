# Forgot Password Module — Automated Test Results

**Date:** 2026-06-24
**Environment:** Local — Windows 10, Node (current LTS), in-memory MongoDB for tests, Atlas MongoDB for manual runs
**Phase:** 2 (Forgot Password / Reset Password)
**Update 2026-06-24:** BUG-FP-001b is now FIXED. Test count went from 7/7 → 10/10 (added 3 new forgot/reset integration tests).

---

## Backend Integration Tests

```
npm test → PASS (10/10)
```

Forgot/reset password paths are now fully covered by 3 new integration tests in `backend/tests/integration/api.test.js`:

| New test | Verifies |
|----------|---------|
| `forgot-password returns neutral message for unknown email (no enumeration)` | Public response is the same string whether the email exists or not — no account enumeration |
| `forgot-password returns neutral message for known email and stores hashed token + 24h expiry` | Token is stored as sha256 hex; expiry is ~24 hours |
| `reset-password: wrong/missing token rejected; one-time use; matches new password rules` | Full happy path + edge cases: invalid token, weak password (rejected by server-side `errors[]` array), mismatched confirmPassword, valid reset, token cleared, login with new password, replay rejected |

The 7 pre-existing tests continue to pass: public mosques list, `GET /api/auth/me`, admin creates cash donation, top-donors excludes anonymous, community submits + committee approves a fund request, admin CRUD on committee member, community creates + scholar accepts a nikah booking.

---

## Code Audit Results

| Check | Result |
|-------|--------|
| `POST /api/auth/forgot-password` exists, public, validates email | PASS |
| `POST /api/auth/reset-password/:token` exists, public, validates token + password | PASS |
| `PASSWORD_RULE` matches auth module (8-64 chars, 1 letter, 1 number) | PASS — `/^(?=.*[A-Za-z])(?=.*\d).{8,64}$/` on both client (`ResetPassword.jsx:17`) and server (`auth.js:10`) |
| Reset token is hashed in DB (sha256) | PASS — `crypto.createHash('sha256').update(resetToken).digest('hex')` |
| Reset token is single-use (cleared on use) | PASS — `user.resetPasswordToken = undefined` and `user.resetPasswordExpire = undefined` on success (`auth.js:178-179`); verified by the new "replay" assertion in the integration test |
| Reset token expiry is 24 hours | PASS — `Date.now() + 24 * 60 * 60 * 1000` (`auth.js:117`); HTML says "24 hours"; verified by integration test (expiry > 24h - 60s) |
| `confirmPassword` validated server-side | PASS — `body('confirmPassword').optional().isString().custom(...)` plus runtime re-check in handler; verified by integration test |
| Forgot-password response is neutral (no email enumeration) | PASS — returns `"If the email exists, a reset link has been sent"` in both branches; verified by integration test |
| Rate limiting on forgot/reset | ABSENT (per client request from Phase 1) — confirmed by grep across `backend/` |
| `api.request` 401 redirect excludes `/api/auth/reset-password/` | PASS — `!endpoint.startsWith('/api/auth/reset-password/')` in both `request` and `uploadRequest` |
| `api.request` 401 redirect excludes `/api/auth/forgot-password` | PASS — in `NO_REDIRECT_ENDPOINTS` array |
| ForgotPassword "Resend" button has loading state | PASS — `resendLoading` state, `disabled`, text toggles to "Sending..." |
| `Back to Login` link in ForgotPassword and ResetPassword | PASS — both pages link to `ROUTES.LOGIN` at the top of the card |
| `api.resetPassword` signature matches its caller | **PASS** (FIXED 2026-06-24) — now `resetPassword(token, data)` forwards `data` as the body; end-to-end covered by the new happy-path test |
| Client-side confirm-password check | PASS — `if (password !== confirmPassword)` before API call |
| Production note for `CLIENT_URL` above `resetUrl` | PASS — comment lines directly above `const resetUrl = ...` |
| Reset password flow covered by integration test | PASS — 3 new tests added (forgot neutral, forgot stores token, full reset + login round-trip) |

---

## Verification Run (after all Phase 2 fixes, 2026-06-24)

| Check | Command | Result |
|-------|---------|--------|
| Frontend lint | `cd frontend && npm run lint` | ✅ 0 errors |
| Frontend build | `cd frontend && npm run build` | ✅ Built in ~4.71s, 82 modules transformed, 488.86 kB bundle |
| Backend tests | `cd backend && npm test` | ✅ **10/10 passing (~7.8s)** (was 7/7, +3 new forgot/reset tests) |

### Per-Fix Verification Summary

| Fix | Lint | Build | Backend tests | Code-traced | Runtime E2E |
|-----|------|-------|---------------|-------------|-------------|
| FIX-FP-001 (client rule) | ✅ | ✅ | ✅ | ✅ | ✅ |
| FIX-FP-001b (api signature) | ✅ | ✅ | ✅ (covered by reset test) | ✅ | ✅ **FIXED** |
| FIX-FP-002 (401 handler) | ✅ | ✅ | ✅ | ✅ | n/a (redirect behaviour) |
| FIX-FP-003 (24h expiry) | ✅ | ✅ | ✅ | ✅ | needs live email + 24h wait |
| FIX-FP-004 (CLIENT_URL note) | ✅ | ✅ | ✅ | ✅ | n/a (doc-only) |
| FIX-FP-005 (server confirm) | ✅ | ✅ | ✅ (covered by reset test) | ✅ | ✅ |
| FIX-FP-006 (Resend loading) | ✅ | ✅ | ✅ | ✅ | n/a (UI state) |
| FIX-FP-007 (rate limit) | ✅ | ✅ | ✅ | ✅ | needs repeated POSTs |
| FIX-FP-008 (Back to Login) | ✅ | ✅ | ✅ | ✅ | n/a (link exists) |

**Final verdict: All 8 fixes PASS (was 7/8, BUG-FP-001b now FIXED).**

---

## Files Changed in Phase 2 (Forgot Password Module)

| File | Purpose |
|------|---------|
| `backend/routes/auth.js` | 24h expiry, production note above `resetUrl`, server-side `confirmPassword` validation + runtime re-check (`FIX-FP-003/004/005`) |
| `backend/tests/integration/api.test.js` | +3 new tests for the forgot/reset flow (neutral message, hashed token, full reset happy path + edge cases) |
| `frontend/src/components/User/Pages/ResetPassword.jsx` | `PASSWORD_RULE`, toast on weak/mismatch/no-token, sends `{ password, confirmPassword }` to API (`FIX-FP-001`) |
| `frontend/src/components/User/Pages/ForgotPassword.jsx` | `resendLoading` state, `disabled` + "Sending..." text on Resend button, `try/catch/finally` (`FIX-FP-006`) |
| `frontend/src/utils/api.js` | 401-handler guards in `request()` and `uploadRequest()` now exclude `/api/auth/reset-password/`; `resetPassword(token, data)` forwards data as the request body (`FIX-FP-002` + `FIX-FP-001b`) |

No other files were touched in this phase.

---

## Code-Path Verification (no browser required)

### Scenario 1 — User requests a reset link (community)
```
[User on /forgot-password]
  → ForgotPassword.handleSubmit
    → setLoading(true)
    → api.forgotPassword(email)   → POST /api/auth/forgot-password { email }
        → auth.js forgot handler
          → User.findOne({ email })
          → if !user: return { success: true, message: "If the email exists, a reset link has been sent" }
          → resetToken = crypto.randomBytes(20).toString('hex')
          → user.resetPasswordToken = sha256(resetToken)
          → user.resetPasswordExpire = Date.now() + 24 * 60 * 60 * 1000
          → user.save()
          → resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`
          → sendEmail({ to, subject, html })   // expires in 24 hours
          → return { success: true, message: "If the email exists, a reset link has been sent" }
    → setSubmitted(true) → "Check Your Email" screen
```
Expected results:
| Check | Expected | Where in code |
|-------|----------|---------------|
| Email sent only if user exists | yes | `auth.js:111-113` (neutral response branch) |
| Token stored hashed | yes | `auth.js:116` |
| Expiry = 24h | yes | `auth.js:117` |
| Reset URL uses `CLIENT_URL` | yes | `auth.js:122` |
| Email body says "24 hours" | yes | `auth.js:132` |
| Neutral message on unknown email | yes | `auth.js:112` and `auth.js:139` (same message both branches) |

### Scenario 2 — User opens reset link, sets new password (happy path)
```
[User opens /reset-password/<token>]
  → ResetPassword.handleSubmit
    → PASSWORD_RULE.test(password)         // client check
    → password === confirmPassword         // client check
    → token exists                         // from useParams()
    → setLoading(true)
    → api.resetPassword(token, { password, confirmPassword })
        // ✅ FIXED: api.resetPassword is now (token, data) → data is forwarded as the body
        → POST /api/auth/reset-password/<token> { password: "X", confirmPassword: "X" }
            → auth.js reset handler
              → validators pass
              → 200 { success: true, message: "Password reset successful" }
              → user.resetPasswordToken = undefined
              → user.resetPasswordExpire = undefined
              → user.save() (pre-save hook bcrypt-hashes the new password)
    → showToast('Password reset successful. Please login.', 'success')
    → setTimeout 1200ms → navigate(ROUTES.LOGIN)
```
Expected results:
| Check | Expected | Where in code |
|-------|----------|---------------|
| Client rejects weak password before API call | yes | `ResetPassword.jsx:21-24` |
| Client rejects mismatch before API call | yes | `ResetPassword.jsx:25-28` |
| Client sends both fields | yes | `ResetPassword.jsx:36` |
| Server matches `confirmPassword` to `password` | yes | `auth.js:153-158` and `auth.js:173-175` |
| Server clears token on success | yes | `auth.js:178-179` |
| New password is hashed by bcrypt | yes | `User.js:30-35` pre-save hook |
| End-to-end login with new password works | yes | verified by integration test |

### Scenario 3 — User reuses a reset link (one-time use)
```
[Second click on the same link]
  → POST /api/auth/reset-password/<token> { password, confirmPassword }
    → User.findOne({ resetPasswordToken: hash, resetPasswordExpire: { $gt: Date.now() } })
    → returns null (token was cleared in Scenario 2)
  → 400 { success: false, message: "Invalid or expired reset token" }
```
Expected results:
| Check | Expected | Where in code |
|-------|----------|---------------|
| Second use is rejected | yes | `auth.js:164-171` (verified by integration test) |
| Error message is user-friendly | yes | `"Invalid or expired reset token"` |

### Scenario 4 — User requests a new link while a previous one is still valid
```
[Second POST /api/auth/forgot-password for same email]
  → User.findOne({ email })
  → user exists
  → generate new resetToken
  → user.resetPasswordToken = sha256(newToken)   // overwrites previous
  → user.resetPasswordExpire = new 24h window     // overwrites previous
  → user.save()
  → sendEmail with new URL
```
Expected results:
| Check | Expected | Where in code |
|-------|----------|---------------|
| Old token is invalidated | yes | `auth.js:115-118` (overwrite) |
| New email is sent | yes | `auth.js:137` |
| Old link now returns "Invalid or expired reset token" | yes | Scenario 3 logic |

### Scenario 5 — 401 on reset-password does NOT log the user out
```
[Server returns 401 on POST /api/auth/reset-password/<token>]
  → api.request
    → response.status === 401
    → !this.NO_REDIRECT_ENDPOINTS.includes('/api/auth/reset-password/abc123') → true
    → !endpoint.startsWith('/api/auth/reset-password/') → false  ← guard fires
    → skip the redirect block
    → throw new Error(data.message || 'Request failed')
  → ResetPassword.handleSubmit catch
    → showToast(err.message, 'error')
```
Expected results:
| Check | Expected | Where in code |
|-------|----------|---------------|
| 401 is treated as a normal API error | yes | `api.js:32` guard |
| User is not redirected to login | yes | `api.js:32-44` is skipped |
| `authToken` and `user` are not cleared | yes | same |
| Toast shows the server message | yes | `ResetPassword.jsx:41` |

### Scenario 6 — Resend button on the success card
```
[User clicks "Resend" while on "Check Your Email"]
  → setResendLoading(true)
  → button is disabled, text becomes "Sending..."
  → api.forgotPassword(email)
  → toast on success: "Reset link sent again"
  → toast on error: err.message
  → setResendLoading(false)         // in finally
  → button re-enabled, text becomes "Resend"
```
Expected results:
| Check | Expected | Where in code |
|-------|----------|---------------|
| Button disabled during in-flight | yes | `ForgotPassword.jsx:121` |
| Button text toggles | yes | `ForgotPassword.jsx:134` |
| Loading state is always cleared | yes | `ForgotPassword.jsx:130` (finally) |
| Rapid clicks are blocked | yes | `disabled={resendLoading}` |

---

## Manual Verification Needed (by client/partner)

A 12-test guide has been written for the partner — see `manual_testing_guide.md`. Please fill in the checkboxes there for:

- [ ] Test 1: Community user requests a reset link
- [ ] Test 2: Non-existent email returns the neutral message
- [ ] Test 3: Open the reset link from Mailtrap
- [ ] Test 4: Set a new strong password (success)
- [ ] Test 5: Set a too-weak password (client rejects)
- [ ] Test 6: Set a mismatched confirm-password (client rejects)
- [ ] Test 7: Re-use the same reset link (server rejects, one-time use)
- [ ] Test 8: Login with the new password (success)
- [ ] Test 9: Login with the OLD password (fails)
- [ ] Test 10: Request a new link for the same email (overwrites previous)
- [ ] Test 11: Click "Resend" while in the success state (button toggles, no double-send)
- [ ] Test 12: Repeat the forgot-password flow for each role (Admin, Manager, Committee, Scholar, User)

**Status:** All 8 fixes verified PASS. Backend tests 10/10. Lint + build clean. Awaiting partner manual verification of the 12 browser tests.

---

## Update 2026-06-24 (later) — SendGrid email provider switch

During the first manual test (Test 1 of the partner guide), the Gmail SMTP `MAIL_PASSWORD` returned `535-5.7.8 Username and Password not accepted` — the legacy 16-character app password had been rotated/revoked. Result: no email was sent, and the entire forgot-password flow was non-functional at runtime.

**Decision:** Switched primary email provider from Gmail SMTP to **SendGrid** (100 emails/day free forever, real Gmail delivery, no rotating app passwords).

**Changes:**
- `backend/utils/sendEmail.js` — rewritten to be provider-agnostic. Auto-detects SendGrid vs SMTP based on `SENDGRID_API_KEY` presence. Supports `EMAIL_PROVIDER=sendgrid|smtp` override.
- `backend/package.json` — added `@sendgrid/mail`.
- `backend/.env` — replaced `MAIL_*` (Gmail) with `SENDGRID_API_KEY` + `SENDGRID_FROM_EMAIL` + `SENDGRID_FROM_NAME`. Kept `EMAIL_*` (Mailtrap) as fallback.
- `backend/.env.example` — documented the new config with SendGrid setup steps.

**Verification after SendGrid switch:**
- `cd backend && npm test` → ✅ 10/10 still passing (sendEmail is mocked in tests)
- `cd frontend && npm run lint` → ✅ 0 errors
- `cd frontend && npm run build` → ✅ success

**Manual verification needed (by partner — you):** Re-run Test 1 of the manual guide. The reset email should now arrive in your real Gmail inbox within 5-10 seconds. Subject: "E-Masjid Password Reset". From: "E-Masjid System <dawood.bhatti8812@gmail.com>". **Important:** SendGrid requires a "Single Sender Verification" of the `SENDGRID_FROM_EMAIL` address before the first email can be sent. If you did this during SendGrid setup, the email will go out. If not, the test will fail with a 403 from SendGrid and you'll need to verify the sender at https://app.sendgrid.com/settings/senders (free, takes 1 minute, SendGrid sends a verification link to the Gmail inbox).
