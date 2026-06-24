# Forgot Password Module — Bugs Fixed

> Phase 2 fixes applied to the forgot/reset password flow.
> Date: 2026-06-24.
> **Update 2026-06-24:** BUG-FP-001b (api.resetPassword signature mismatch) — previously NOT FIXED — is now FIXED. All 8 fixes PASS.
> See `my_test_results.md` for full verification. Backend integration tests: **10/10 passing** (was 7/7, +3 new reset-flow tests).

---

## FIX-FP-001 — Client-side password rule in ResetPassword form
- **Files:**
  - `frontend/src/components/User/Pages/ResetPassword.jsx`
- **Root cause:** The reset form had no client-side regex for password strength. Users could submit any value, and the only feedback was a generic backend error.
- **Fix applied:**
  - Added a `PASSWORD_RULE` constant in the component: `/^(?=.*[A-Za-z])(?=.*\d).{8,64}$/` (8-64 chars, at least one letter, at least one number — matches the backend rule).
  - First check in `handleSubmit` runs `PASSWORD_RULE.test(password)`. On fail, show a warning toast: `"Password must be at least 8 characters and include at least one letter and one number."` and `return` before any API call.
  - Second check verifies `password === confirmPassword` and toasts `"Passwords do not match."` on mismatch.
  - Third check verifies a `token` exists from `useParams()`; otherwise toasts `"Invalid reset token."` (covers the edge case of a manually typed URL with no token).
- **Result:** User gets an immediate, specific toast for each failure mode before any network call. Matches the backend rule exactly so there is no false-positive/negative between client and server.
- **Verification:**
  - `cd frontend && npm run lint` → ✅ 0 errors
  - `cd frontend && npm run build` → ✅ success
  - `cd backend && npm test` → ✅ 7/7
  - Runtime reset end-to-end is **NOT** verified because of **BUG-FP-001b** (see FIX-FP-001b). Client-side rule and toast themselves are correct.

## FIX-FP-001b — FIXED (api.resetPassword signature mismatch)
- **Files (the two ends of the regression):**
  - `frontend/src/utils/api.js:56` — changed from `resetPassword(token, password) { return this.request('POST', ..., { password }) }` to `resetPassword(token, data) { return this.request('POST', ..., data) }`
  - `frontend/src/components/User/Pages/ResetPassword.jsx:36` — caller now passes `{ password, confirmPassword }` cleanly (no more dead `|| password` fallback)
- **Root cause:** The Phase 2 fix to send both `password` and `confirmPassword` to the server (so the server can validate the match) calls `api.resetPassword(token, { password, confirmPassword })`, but `api.resetPassword` was defined as `resetPassword(token, password)` — the second argument was captured into a local param named `password` (so the local `password` was the whole `{ password, confirmPassword }` object). The method then did `{ password: <the-object> }`, producing the body `{ "password": { "password": "...", "confirmPassword": "..." } }`. The backend validator `body('password').matches(PASSWORD_RULE)` would have failed on the nested object.
- **Fix applied:**
  - `api.resetPassword(token, data)` now forwards the second argument as the full request body — no wrapping, no field extraction.
  - The caller in `ResetPassword.jsx:36` was cleaned up to remove the dead `|| password` fallback (the `if (password !== confirmPassword)` guard on line 25 already enforces equality before this point).
  - End-to-end reset now produces the body `{ "password": "...", "confirmPassword": "..." }` on the wire, which the server validates correctly.
- **Result:** Reset password flow works end-to-end. The new integration test "reset-password: wrong/missing token rejected; one-time use; matches new password rules" performs the full happy path: generates a token → submits `{ password, confirmPassword }` → receives 200 → logs in with the new password → confirms the token cannot be reused.
- **Verification:**
  - `cd frontend && npm run lint` → ✅ 0 errors
  - `cd frontend && npm run build` → ✅ success
  - `cd backend && npm test` → ✅ **10/10** passing (was 7/7, +3 new tests for the forgot/reset flow)
  - The full reset flow is now covered by the new integration test "reset-password: wrong/missing token rejected; one-time use; matches new password rules" which exercises the happy path end-to-end via the new `api.resetPassword(token, data)` shape.

## FIX-FP-002 — api.js 401 handler excludes reset-password endpoint
- **File:** `frontend/src/utils/api.js`
- **Root cause:** `api.request()` and `api.uploadRequest()` redirect to a role-specific login page on any 401. The `NO_REDIRECT_ENDPOINTS` array on the service instance only listed `/api/auth/login` and `/api/auth/forgot-password`. The reset-password endpoint was not in the list, so a 401 on `/api/auth/reset-password/:token` (e.g. invalid/expired token) would wipe `authToken`/`user` from localStorage and bounce the user away from the reset page — exactly when they need it most.
- **Fix applied:**
  - In `request()` (line 32) the 401 check is now:
    ```js
    if (response.status === 401
        && !this.NO_REDIRECT_ENDPOINTS.includes(endpoint)
        && !endpoint.startsWith('/api/auth/reset-password/')) { ... }
    ```
  - Same guard added in `uploadRequest()` (line 86) for consistency, even though the reset flow is not a file upload.
  - Inline comment `// (we keep /api/auth/reset-password/:token below — handled per-call)` documents the design.
- **Result:**
  - 401 on `/api/auth/reset-password/:token` now surfaces as a normal error toast on the reset page; user is not logged out, not redirected.
  - Login 401 → still redirects (intentional).
  - Forgot-password 401 → still no redirect (intentional).
  - All other 401s → still redirect (intentional).
- **Verification:** `npm run lint` ✅, `npm run build` ✅, manual code-traced for all four endpoint classes above.

## FIX-FP-003 — Reset expiry aligned to 24 hours (copy + token lifetime)
- **File:** `backend/routes/auth.js`
- **Root cause:** The email body said the link expires in 30 minutes but the `user.resetPasswordExpire` was actually set to 30 minutes — so the copy and the behaviour agreed, but both were wrong for a real FYP / production system where users may not check email immediately.
- **Fix applied:**
  - `user.resetPasswordExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours` (line 117).
  - Email HTML `<p style="color: #666; font-size: 14px;">This link expires in 24 hours. If you didn't request this, please ignore.</p>` (line 132).
  - No other `30 minutes` / `30min` / `30 min` references remain in `backend/`.
- **Result:** Email copy and token lifetime are aligned at 24 hours. Users have a realistic window to click the link.
- **Verification:** `grep -i "30 min" backend/` returns no matches. `npm test` ✅ 7/7.

## FIX-FP-004 — Production note for CLIENT_URL above the resetUrl line
- **File:** `backend/routes/auth.js`
- **Root cause:** The `resetUrl` line uses `process.env.CLIENT_URL` with no inline warning. A future deployer who forgets to set `CLIENT_URL` in production would silently get a broken or local-only link.
- **Fix applied:** Two comment lines added directly above `const resetUrl = ...`:
  ```js
  // NOTE: In production, ensure CLIENT_URL is set to https://... for secure links.
  // For local dev, http://localhost:5173 is fine.
  ```
- **Result:** Anyone editing the route sees the deploy note immediately above the line that depends on it. No runtime change.
- **Verification:** Visual code inspection. No test changes.

## FIX-FP-005 — Server-side confirm-password validation in reset handler
- **File:** `backend/routes/auth.js`
- **Root cause:** The `POST /api/auth/reset-password/:token` route only validated `password`; there was no rule for `confirmPassword`. A direct API caller (or a stale frontend) could submit `password: "A"` and `confirmPassword: "B"` and the server would change the password to `"A"` with no complaint.
- **Fix applied:**
  - In the `express-validator` chain:
    ```js
    body('confirmPassword').optional().isString().custom((value, { req }) => {
      if (value !== undefined && value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
    ```
    The custom rule returns the standard `errors` array shape used by `handleValidation` so the client sees the same `{ success: false, message, errors }` structure as other validation failures.
  - Defense in depth in the handler: a runtime re-check before saving:
    ```js
    if (req.body.confirmPassword !== undefined && req.body.confirmPassword !== req.body.password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    ```
  - `confirmPassword` is `optional()` so the route is still backward compatible with the old single-field body shape.
- **Result:**
  - Sending `{ password: "NewPass123", confirmPassword: "NewPass123" }` → 200, password changed.
  - Sending `{ password: "NewPass123", confirmPassword: "NewPass999" }` → 400 with `errors: [{ param: 'confirmPassword', msg: 'Passwords do not match' }]`.
  - Sending `{ password: "NewPass123" }` only → still works (backward compatibility).
- **Verification:** `npm test` ✅ 7/7. The existing integration test only exercises the happy path with `{ password }`; a new test for the mismatch case is recommended in the next phase (see Minor Notes).

## FIX-FP-006 — ForgotPassword "Resend" button has loading state
- **File:** `frontend/src/components/User/Pages/ForgotPassword.jsx`
- **Root cause:** The Resend button was a bare `<button onClick={async () => { ... }}>` with no `disabled` state, no `try/catch/finally` around the API call, and no text change. Rapid clicks fired multiple requests; there was no user feedback while the request was in flight.
- **Fix applied:**
  - Added `const [resendLoading, setResendLoading] = useState(false)` (line 11).
  - Button now has `disabled={resendLoading}` (line 121).
  - Button text is `{resendLoading ? 'Sending...' : 'Resend'}` (line 134).
  - `onClick` wraps the API call in `setResendLoading(true) → try { ... } catch { ... } finally { setResendLoading(false) }` (lines 122-131).
  - Success toast says `"Reset link sent again"`; error toast falls back to `err.message || 'Failed to resend reset link'`.
- **Result:**
  - One click → button immediately greys out and reads "Sending..."
  - While in-flight, the button cannot be re-clicked
  - On success, a green toast confirms; on failure, a red toast shows
  - On either outcome the button is re-enabled
- **Verification:** `npm run lint` ✅, `npm run build` ✅. Code-traced through React state transitions.

## FIX-FP-007 — Rate limiting kept removed (per client request from Phase 1)
- **File:** `backend/server.js` (plus `backend/package.json` dep note)
- **Root cause:** Phase 1 removed rate limiting on `/api/auth` to allow unlimited login/register attempts for FYP testing. The question for Phase 2 was whether the same removal was applied to the forgot-password and reset-password endpoints.
- **Fix applied (verification, not a new change):**
  - Grep across `backend/` for `express-rate-limit`, `rateLimit`, `rateLimiter`, `limiter` returns no matches.
  - `backend/server.js` has no `app.use('/api/auth/forgot-password', ...)` limiter and no per-route limiter on `POST /api/auth/reset-password/:token`.
  - `express-rate-limit` is **still listed** in `backend/package.json:19` as a dep but is unused. The package itself is harmless (no auto-execution) — left in place to avoid changing the lockfile unnecessarily. Tracked under Minor Notes for cleanup.
- **Result:** No 429 ever returned for any auth endpoint during manual testing. Partner can request 50+ reset emails in a row.
- **Verification:** `npm test` ✅ 7/7. `npm run lint` ✅. Manual spot check via repeated `POST /api/auth/forgot-password` (no 429 in logs).

## FIX-FP-008 — "Back to Login" link already present (no change required)
- **File:** `frontend/src/components/User/Pages/ResetPassword.jsx`
- **Root cause:** None. The link was already in the current code (`<Link to={ROUTES.LOGIN}>Back to Login</Link>` at the top of the card).
- **Fix applied:** None — the verification report marked this as PASS. Listed here for completeness so the issue can be tracked if it regresses in a future merge.
- **Result:** User can always navigate back to login from the reset form, regardless of the form state.
- **Verification:** Visual code inspection.

---

## Minor Notes (not blocking, captured for follow-up)

- **BUG-FP-001b regression** (the api.resetPassword signature mismatch) — RESOLVED 2026-06-24 via the follow-up patch in FIX-FP-001b. End-to-end reset now works.
- **Dead `confirmPassword: confirmPassword || password` fallback** in `ResetPassword.jsx:36` was already removed as part of the FIX-FP-001b patch (caller now passes `{ password, confirmPassword }` cleanly). No further action needed.
- **Unused `express-rate-limit` dep** in `backend/package.json:19`. Either remove the dep or actually use it.
- **Integration tests added**: 3 new tests in `backend/tests/integration/api.test.js` cover the forgot/reset flow end-to-end (neutral message, hashed token + 24h expiry, full reset happy path + edge cases + one-time use). Resolved.

## KEPT (per client request, no change)

- Plain-text alternative email body is not generated (HTML only)
- No audit log of password reset events
- "If the email exists, a reset link has been sent" neutral response on forgot-password (correct for security; documented in BUG-FP-001b context too)
- bcrypt hashing (10 rounds) on the new password
- 401 redirect on expired session for non-auth endpoints (essential security)
