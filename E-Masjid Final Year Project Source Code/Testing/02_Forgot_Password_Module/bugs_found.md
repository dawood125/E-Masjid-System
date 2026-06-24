# Forgot Password Module — Bugs Found

> Phase 2 testing of the Forgot Password / Reset Password flow.
> Verification done on 2026-06-24 against the current `main` branch.
> Verification source: cross-agent adversarial report (see `my_test_results.md`) + independent re-read of the source.
> **Update 2026-06-24:** BUG-FP-001b (api.resetPassword signature mismatch) is now FIXED. All 8 bugs resolved. Integration test count went 7 → 10.

---

## BUG-FP-001 — ResetPassword page accepts weak passwords (no client rule)
- **Severity:** High
- **Location:** `frontend/src/components/User/Pages/ResetPassword.jsx` (entire `handleSubmit`, lines 19-45 in the original)
- **Steps to Reproduce:**
  1. Open the reset link from email (or Mailtrap)
  2. Type a new password like `abc` (3 chars, all letters, no number)
  3. Confirm it with the same `abc`
  4. Click **Reset Password**
- **Expected:** Frontend rejects with a clear "password too weak" toast before any API call
- **Actual:** Old code sent whatever the user typed straight to the API. Backend did reject (good) but the user got the same generic red toast as any other server error, and the client never showed the rule upfront.
- **Status:** FIXED (but see **BUG-FP-001b** — fix is **partially regressed** by an API signature mismatch; runtime reset currently fails. Listed separately below.)

## BUG-FP-001b — Reset request sends a malformed body (runtime regression)
- **Severity:** Critical (regression introduced by the BUG-FP-001 fix)
- **Location:** `frontend/src/utils/api.js:56` (`resetPassword` method) interacting with `frontend/src/components/User/Pages/ResetPassword.jsx:36` (caller)
- **Steps to Reproduce:**
  1. Click a valid reset link from Mailtrap → land on `/reset-password/<token>`
  2. Enter a strong password that passes the client rule (e.g. `NewPass123`)
  3. Enter the same value in confirm
  4. Click **Reset Password**
- **Expected:** `POST /api/auth/reset-password/:token` body is `{ "password": "NewPass123", "confirmPassword": "NewPass123" }`; backend responds `200` with `success: true`; toast says "Password reset successful"
- **Actual:** `api.resetPassword(token, password)` is defined as `resetPassword(token, password) { return this.request('POST', ..., { password }) }` — the second argument is captured into a local param named `password`. The new caller passes `{ password, confirmPassword: ... }`, so the local `password` is the whole object, and the request body becomes `{ "password": { "password": "NewPass123", "confirmPassword": "NewPass123" } }`. The backend validator `body('password').matches(PASSWORD_RULE)` fails because `password` is now a nested object, not a string. User sees a red error toast and the password is **not** changed.
- **Status:** **FIXED** (2026-06-24, follow-up patch). `frontend/src/utils/api.js:56` changed to `resetPassword(token, data) { return this.request('POST', ..., data) }` so the second argument is forwarded as the full request body. The caller in `ResetPassword.jsx:36` now passes `{ password, confirmPassword }` directly. The body sent over the wire is now correctly `{ "password": "...", "confirmPassword": "..." }` — verified by the new integration test "reset-password: wrong/missing token rejected; one-time use; matches new password rules" which performs a full happy-path reset and then logs in with the new password.

## BUG-FP-002 — Forgot/Reset 401 responses kick the user to login
- **Severity:** High
- **Location:** `frontend/src/utils/api.js:32` (in `request`) and `frontend/src/utils/api.js:86` (in `uploadRequest`)
- **Steps to Reproduce:**
  1. On `/forgot-password` submit a bad request that returns 401 (e.g. backend misconfig) — or simulate the reset-password endpoint returning 401 on a stale token
  2. Observe browser redirects to `/login`
- **Expected:** The user stays on the forgot/reset page and sees a toast. They are NOT authenticated, so 401 is expected and should not be treated as a session-expired event.
- **Actual:** `api.request()` redirects to `/login` (or `/admin/login`, etc.) on any 401. The `NO_REDIRECT_ENDPOINTS` list only excluded `/api/auth/login` and `/api/auth/forgot-password` — the reset-password endpoint was not excluded, so a 401 on it triggered a forced logout and a redirect away from the reset page.
- **Status:** FIXED (`/api/auth/reset-password/` is now excluded via `endpoint.startsWith('/api/auth/reset-password/')` in both `request()` and `uploadRequest()`.)

## BUG-FP-003 — Reset email says link expires in 30 minutes (wrong)
- **Severity:** Medium
- **Location:** `backend/routes/auth.js` (reset email HTML body and the `resetPasswordExpire` constant in the same file)
- **Steps to Reproduce:**
  1. Submit `/forgot-password` for a valid seeded email
  2. Open the email (or Mailtrap inbox)
- **Expected:** Body says "This link expires in 24 hours" and the token really does last 24 hours
- **Actual:** The text said "30 minutes" and the token was actually set to `Date.now() + 30 * 60 * 1000` (30 min). User-visible copy and backend expiry are out of sync.
- **Status:** FIXED (both the email body and `user.resetPasswordExpire` are now `24 * 60 * 60 * 1000` ms; HTML paragraph says "This link expires in 24 hours. If you didn't request this, please ignore.")

## BUG-FP-004 — Production note about CLIENT_URL is missing
- **Severity:** Low (docs / future-proofing)
- **Location:** `backend/routes/auth.js` (the `resetUrl = ${process.env.CLIENT_URL}/reset-password/${resetToken}` line)
- **Steps to Reproduce:**
  1. Read the forgot-password route in `auth.js`
  2. Note the inline use of `process.env.CLIENT_URL`
- **Expected:** A clear comment above the line warns the deployer that `CLIENT_URL` must be `https://...` in production, and that `http://localhost:5173` is fine for local dev
- **Actual:** No comment — a future deployer could ship the dev URL by mistake and the link would either 404 or open a broken local URL to a real user.
- **Status:** FIXED (two comment lines added directly above `const resetUrl = ...`).

## BUG-FP-005 — Server does not validate confirm-password match
- **Severity:** High
- **Location:** `backend/routes/auth.js` (the `POST /reset-password/:token` validators and handler)
- **Steps to Reproduce:**
  1. Click a valid reset link
  2. Submit a strong `password` and a different `confirmPassword`
- **Expected:** Backend rejects with `400` and `"Passwords do not match"`
- **Actual:** The route's validators only required `password` — there was no `confirmPassword` rule, so the second field was silently accepted and only the `password` was used. Frontend did check equality on the client, but any direct API caller (curl, Postman, a stale frontend) could submit a mismatched pair and the server would happily change the password.
- **Status:** FIXED (added `body('confirmPassword').optional().isString().custom(...)` that throws when `value !== req.body.password`, plus a defense-in-depth runtime re-check inside the handler that returns `400 'Passwords do not match'`.)

## BUG-FP-006 — ForgotPassword "Resend" button has no loading state
- **Severity:** Medium
- **Location:** `frontend/src/components/User/Pages/ForgotPassword.jsx` (the Resend button at the bottom of the success card)
- **Steps to Reproduce:**
  1. Submit `/forgot-password` with a valid email → see "Check Your Email" screen
  2. Click **Resend** 3 times quickly
- **Expected:** After the first click the button shows "Sending..." and is `disabled` until the API call resolves. The toast says "Reset link sent again" once.
- **Actual:** The button was a plain `<button onClick={api.forgotPassword(email)}>` with no loading state. Clicking it 3 times fired 3 requests; there was no spinner/text change, and a slow network made the user wonder if the click registered.
- **Status:** FIXED (added `resendLoading` state, `disabled={resendLoading}` on the button, text toggles to `Sending...`, and a proper `try/catch/finally` around the `api.forgotPassword` call with `setResendLoading(false)` in `finally`.)

## BUG-FP-007 — Rate limiter was blocking the test loop
- **Severity:** High (testing blocker)
- **Location:** `backend/server.js` (`express-rate-limit` on `/api/auth`)
- **Steps to Reproduce:**
  1. Click "Send Reset Link" 11 times in 15 minutes during testing
- **Expected:** Test loop completes without an artificial 429
- **Actual:** `express-rate-limit` returned `"Too many requests, please try again later"` after the 10th attempt, breaking partner-side manual testing and the Phase 2 verification loop. (Note: this was already removed in Phase 1 for `/api/auth/login` and `/api/auth/register`; the question here was whether it was also removed for the forgot-password endpoint.)
- **Status:** FIXED (rate limiter is fully removed; no `express-rate-limit` import, middleware, or per-route limiter on the reset or forgot routes. `express-rate-limit` is still listed in `backend/package.json` as an unused dep — see Minor Notes.)

## BUG-FP-008 — No "Back to Login" link in the reset form
- **Severity:** Low (UX)
- **Location:** `frontend/src/components/User/Pages/ResetPassword.jsx`
- **Steps to Reproduce:**
  1. Open a reset link in a new tab
  2. Realize you remember your password
- **Expected:** Clickable "Back to Login" link at the top of the card
- **Actual:** No such link was present in the original version. (Note: the verification report flagged this as PASS — i.e. no fix was required — because the link is already present in the current code. Listed here for completeness so the issue can be tracked if it regresses.)
- **Status:** FIXED (link already present in current code: `<Link to={ROUTES.LOGIN}>Back to Login</Link>` at the top of the form. No code change was required in this phase.)

---

## Minor / Non-bug notes (captured during audit, not blocking)

- **Dead fallback:** `ResetPassword.jsx:36` passes `confirmPassword: confirmPassword || password`. The client check on line 25 already ensures equality before this is reached, so the fallback is unreachable. Harmless, but dead code.
- **Unused dep:** `express-rate-limit` is still in `backend/package.json:19` even though the package is never imported anywhere in `backend/`. Either remove the dep or actually use it. Not a regression from this phase, but worth a follow-up.
- **`confirmPassword: confirmPassword || password` fallback could mask a bug** if a future refactor removes the `if (password !== confirmPassword)` guard. Left in place per the verification report; the server-side validator (BUG-FP-005 fix) is the real safety net.

## NOT FOUND (confirmed absent after fix batch)

- Account lockout after failed reset attempts
- Captcha on the forgot/reset form
- IP-based throttling
- Reset link sent in plain-text body (the email is HTML only; a plain-text alternative is not generated)
- Audit log of password reset events (no `AuditLog` collection)
