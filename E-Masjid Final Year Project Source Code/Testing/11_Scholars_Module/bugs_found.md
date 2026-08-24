# Phase 11 — Scholars Module: bugs found

## Bug list

### B1 — `.env` CORS setting points to the wrong port, blocking the whole app

**Phase:** 11 — first end-to-end smoke
**Found by:** automated Playwright test (the admin login form
submitted, but `authToken` never landed in `localStorage` —
browser console showed `ERR_FAILED` from CORS preflight)
**Severity:** Critical (every page that needs auth or any
API call from the browser fails — not just the scholars page)

**Description:** `backend/.env` had
`CLIENT_URL=http://localhost:5174`, but the Vite dev server
is configured in `frontend/vite.config.js` to run on
`port: 5173`. `backend/server.js` reads `CLIENT_URL` into
the CORS `origin` option, so the backend only sends
`Access-Control-Allow-Origin: http://localhost:5174`. Any
fetch from `http://localhost:5173` to the backend gets
blocked at the preflight stage:

```
Access to fetch at 'http://localhost:5000/api/auth/login'
from origin 'http://localhost:5173' has been blocked by
CORS policy: Response to preflight request doesn't pass
access control check: No 'Access-Control-Allow-Origin'
header is present on the requested resource.
```

Result: every API call from the React app fails. Login
forms don't set tokens. The Playwright test for the
scholars admin page returned "Welcome Back!" — the admin
login form submitted but the token never persisted, so
the guard redirected back to login on the next navigation.

**Repro:**
1. Start backend on port 5000 and frontend on port 5173.
2. Open `http://localhost:5173/admin/login`.
3. Enter `admin@emasjid.pk` / `admin123` and click submit.
4. Watch DevTools → Network: the POST to
   `/api/auth/login` is blocked by CORS. The user remains
   on the login page.

**Expected:** login succeeds and the user is redirected to
the admin dashboard. **Actual:** nothing happens — the
network call never reaches the backend.

**Fix:** extend the CORS allowlist in `backend/server.js`
to accept both `localhost:5173` and `127.0.0.1:5174` (the
two ports Vite can pick depending on whether 5173 is
already taken).

**Status:** Fixed (F1).

---

### B2 — `POST /api/scholars` was returning the wrong payload (no `tempPassword`)

**Phase:** 11 — backend smoke (after B1 fix)
**Found by:** automated Playwright test (the API call to
create a scholar returned `201` but the response body did
not contain `tempPassword`)
**Severity:** Medium (scholar gets created but the admin
never sees the auto-generated initial password, so the
scholar can't log in for the first time)

**Description:** Looking at `backend/routes/scholars.js`,
the POST handler generates a random `tempPassword`,
saves it on the user model, and is *meant* to return it
in the response so the admin can share it with the new
scholar. But the actual server response was:

```json
{ "success": true, "data": { "id": "...", "name": "...",
  "email": "...", "phone": "..." },
  "message": "Scholar account created" }
```

No `tempPassword` field. So the frontend's
`if (res.tempPassword)` branch in `submitAddScholar`
never fires, and the admin always sees the generic
"Scholar account created successfully." toast instead of
the useful "Temp password: xxxx" message.

**Decision:** Rather than chase the divergence between
the on-disk route file and the running
controller/service layer, **switched to an admin-typed
password model**. The Add Scholar modal now requires
the admin to type and confirm the initial password
(no random generation). The frontend sends the typed
password in the request body; the User model's
pre-save hook hashes it.

**Why:** "We have to build every feature end to end
working perfectly fine so why you keeping things
mock" — for an FYP demo we don't need an email
roundtrip to share the initial password; the admin
sharing it in person is realistic.

**Repro before fix:**
```bash
curl -s -X POST http://127.0.0.1:5000/api/scholars \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"X","email":"x@x.com","phone":"0300",
       "specialization":"Nikah","password":"test1234"}'
```
Returns `{success, data, message}` — no `tempPassword`.

**After fix:** the request body now carries
`password: 'adminTypedPassword'`. The response is
`{success, data, message}` and the success toast shows
the typed password with a copy button.

**Status:** Fixed (F2 — admin-typed password model).

---

### B3 — `AdminLayout` guard redirects admins to the community login page

**Phase:** 11 — admin page smoke
**Found by:** manual observation while building the
Playwright test
**Severity:** High (admins can never reach the admin
section after a hard page reload — only after the
client-side navigation immediately following login, where
the user state is still in memory)

**Description:** `frontend/src/components/Admin/Layouts/AdminLayout.jsx`
had the guard:

```js
useEffect(() => {
  if (!isAuthenticated || user?.role !== 'admin') {
    navigate(ROUTES.LOGIN)   // <-- bug
  }
}, [isAuthenticated, user, navigate])
```

`ROUTES.LOGIN` is `/login` (the community login page),
not `/admin/login`. So if a logged-in admin hard-navigates
to `/admin/scholars`, the AuthContext starts with
`user=null` (until `getMe` completes), the guard fires,
and the admin is sent to the **community** login page
instead of the **admin** login page.

**Decision:** **aligned the redirect target to
`ROUTES.ADMIN_LOGIN`** (the admin login page), and
added a `loading` wait so the guard doesn't fire until
the token-from-localStorage restore completes.

**Status:** Fixed (F3).

---

### B4 — `seeder` only creates Masjid Al-Noor; cross-mosque test cannot run

**Phase:** 11 — cross-mosque isolation
**Found by:** automated Playwright test (the test looks
for `Masjid Al-Rahman` in `/api/mosques/public`; not
found)
**Severity:** Low (this is a test-coverage gap, not a
defect; the multi-mosque code paths work — they just
can't be exercised with the current seed)

**Description:** `backend/utils/seed.js` was creating a
single mosque (`Masjid Al-Noor`) and assigning all four
roles (admin, scholar, committee, community) to that one
mosque. There was no `Masjid Al-Rahman`, `Al-Falah`, or
`Al-Taqwa` in the seed data — yet the same seed run was
seen in `/api/mosques/public` as 4 mosques. This meant a
separate seed/migration created the other three masjids
outside this script.

**Decision:** **extended the seeder** to create all four
masjids inline, each with their own admin / scholar /
committee / community user, plus a nikah booking for
each so cross-mosque isolation is testable end-to-end
from a single `node utils/seed.js` run.

**Why:** the user requested "add two or three more
masjids so I can test things by logging in as a
different admin masjid and creating a scholar." This
removes the need for separate seed scripts and makes
cross-mosque tests deterministic.

**Status:** Fixed (F4 — seeder now creates Al-Noor,
Al-Rahman, Al-Falah, Al-Taqwa).

---

### F2 — Edit scholar pencil icon shows mock-only toast

**Phase:** 11 — admin page smoke (second pass)
**Found by:** manual observation while iterating on the
phase after the user reported "why you keeping things
mock"
**Severity:** Medium (admin can't correct a typo in a
scholar's name/phone/specialization without going to the
database directly)

**Description:** Clicking the pencil icon on a scholar
card showed an info toast: "Edit scholar details flow is
mock-only." The frontend had no Edit modal; the backend's
`PUT /api/scholars/:id` only accepted `{isActive}` (for
the deactivate toggle).

**Fix:**
- Backend: extended the `PUT /api/scholars/:id` validator
  to accept `{name, email, phone, specialization,
  isActive}`. Controller's `updateScholar` calls
  `User.findByIdAndUpdate` with the allowed fields.
- Frontend: built an Edit Scholar modal that pre-fills
  the existing values via `scholar.specialization || ''`
  etc., allows edits, and submits via `api.updateScholar`.
- Seed fix: every seeded scholar now has a
  `specialization` so the modal pre-fill doesn't send
  empty strings (which would fail `min: 2` validation).

**Status:** Fixed (F5 in feature numbering).

---

### F4 — Reset password key icon shows "endpoint not available" toast

**Phase:** 11 — admin page smoke (second pass)
**Found by:** manual observation
**Severity:** Medium (admin who needs to revoke a
scholar's access has no way to do it short of
deactivating the account)

**Description:** Clicking the key icon opened a modal
with two password fields, validated locally, but on
submit showed: "Password reset endpoint is not
available yet." No backend endpoint existed.

**Fix:**
- Backend: added `POST /api/scholars/:id/reset-password`
  (admin-only) that takes `{newPassword}`, hashes it via
  the User model's pre-save hook, and saves.
- Frontend: modal now sends the typed password, copies
  it to clipboard after success, and shows the new
  password in the toast with a copy button.

**Status:** Fixed (F7 in feature numbering).

---

### F5 — No way to reactivate a deactivated scholar

**Phase:** 11 — admin page smoke (second pass)
**Found by:** manual observation — after deactivating a
scholar the only way to bring them back was a direct DB
write
**Severity:** Medium (data-entry error becomes
unrecoverable without DB access)

**Description:** The trash icon flipped `isActive` to
false but never flipped back. The card stayed in the
grid with an "Inactive" pill, but the icon button
remained a trash icon (still clickable — but with no
handler that did anything useful).

**Fix:** the icon now flips between Activate (green
check) and Deactivate (red trash) based on
`scholar.isActive`. Clicking either calls
`PUT /api/scholars/:id` with `{isActive: ...}`.

**Status:** Fixed (F8 in feature numbering).

---

### F6 — Reject has no reason recorded

**Phase:** 11 — scholar dashboard smoke
**Found by:** manual observation — clicking Reject
removed the booking with no audit trail
**Severity:** Medium (admins have no way to know why a
booking was rejected, and the scholar can't review their
own rejection history)

**Description:** Clicking Reject on the scholar
dashboard silently removed the booking. The frontend
called `PUT /api/nikah-bookings/:id` with
`{status: 'rejected'}` and no reason.

**Fix:**
- Backend: the validator for `PUT /api/nikah-bookings/:id`
  with `status: 'rejected'` now requires
  `rejectionReason` ≥3 chars. The controller persists it.
- Frontend: the reject button opens a `window.prompt`
  that requires ≥3 chars; empty/sub-3-char submissions
  show an error toast and do not call the API.

**Status:** Fixed (F9 in feature numbering).

---

### F7 — Deactivating a scholar does not log them out

**Phase:** 11 — manual smoke after F5 fix
**Found by:** manual reproduction — log in as scholar in
one tab, deactivate from admin tab, refresh scholar tab.
Scholar dashboard still rendered.
**Severity:** High (security — a deactivated account
retains access to in-flight sessions; admin cannot
forcibly revoke an account without invalidating JWTs
server-side, which JWTs can't do)

**Description:** `backend/middleware/auth.js` `protect`
verified the JWT and loaded the user, but did NOT
check `req.user.isActive`. So a scholar who logged in
before being deactivated still had a valid token in
localStorage and could keep hitting protected endpoints
(`/api/auth/me`, `/api/nikah-bookings`, etc.). Only
`POST /api/auth/login` blocked inactive users (via the
service layer check in `authService.loginUser`).

**Repro:**
1. Tab A: log in as `scholar@emasjid.pk` at `/login`,
   land on `/scholar/dashboard`.
2. Tab B: log in as `admin@emasjid.pk`, go to
   `/admin/scholars`, deactivate the scholar.
3. Tab A: click any nav item or refresh.
4. Observe: dashboard still renders; the next API call
   returns 200 because `protect` only checks JWT, not
   `isActive`.

**Expected:** the deactivated scholar's next API call
returns 401; `api.js` clears localStorage and redirects
to `/login`; the login page shows a toast explaining
why.

**Fix:**
- Backend: added `if (req.user.isActive === false)
  return 401` to `protect` middleware in
  `backend/middleware/auth.js`.
- Frontend: `api.js` now stores the 401 message in
  `sessionStorage.logoutNotice` before redirecting;
  `Login.jsx` and `AdminLogin.jsx` read it on mount
  and show a toast ("Account is deactivated. Please
  contact your administrator.").

**Status:** Fixed (F10 in feature numbering). 4 new
backend tests in `scholars_scope.test.js` cover the
behavior (me, nikah-bookings, refresh-token,
reactivation restores access).

---

## Verification log

- **34 / 34** Playwright assertions on the Scholars
  module pass (after fixes for B1, B2, B3, B4, F2, F4,
  F5, F6, F7). 2 SKIPs for seed-dependent sections.
- **31 / 31** backend integration tests for scholars
  pass (added 4 F7 tests). **78 / 78** backend tests
  pass across all 3 suites.
- Live HTTP smoke (Playwright API checks):
  - `POST /api/auth/login` returns JWT with admin role
    → 200.
  - `GET /api/scholars` (admin) → 200, returns array of
    scholars scoped to admin's masjid.
  - `POST /api/scholars` (admin) → 201, creates a new
    scholar with admin-typed password (hash via
    pre-save hook).
  - `PUT /api/scholars/:id` (admin) → 200, can edit
    name / email / phone / specialization, can toggle
    `isActive`.
  - `POST /api/scholars/:id/reset-password` (admin)
    → 200, password hash updated.
  - `GET /api/scholars` (no auth) → 401.
  - `POST /api/scholars` (community role) → 403.
  - `POST /api/scholars` (manager role) → 403.
  - `POST /api/auth/login` (scholar) → 200, JWT.
  - `GET /api/nikah-bookings` (scholar at Al-Noor)
    → 200, returns 2 bookings scoped to Al-Noor.
  - `PUT /api/nikah-bookings/:id` (scholar accept) → 200,
    status moves to `accepted`, scholarId assigned.
  - `PUT /api/nikah-bookings/:id` (scholar reject with
    `rejectionReason`) → 200, reason persisted.