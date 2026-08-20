# Phase 11 — Scholars Module: manual testing guide

This module covers the **religious scholars management**
feature on both the admin side and the scholar side:

- **Admin side** (`/admin/scholars`) — create / deactivate
  scholar accounts, view stats, assign scholars to pending
  Nikah bookings.
- **Scholar side** (`/scholar/dashboard`) — view pending
  Nikah requests for the scholar's masjid, accept or
  reject each one, view own confirmed ceremonies.

The scholar role is one of the five actors in the system
(community, admin, scholar, committee, manager). They
log in via `/login` (community login page) using the
`scholar@emasjid.pk` credentials and are redirected to
`/scholar/dashboard`.

## Prerequisites

- Backend running on `http://127.0.0.1:5000`
- Frontend running on `http://localhost:5173`
- `CLIENT_URL` in `backend/.env` matches the frontend
  port (5173 by default; see `frontend/vite.config.js`)
- Seeded with `node utils/seed.js` (creates 1 masjid + 1
  admin + 1 scholar + 1 committee + 1 community + 2 nikah
  bookings + sample donations/expenses)
- Database connected (`MONGODB_URI` set in `.env`)

## Credentials

| Role      | Email                    | Password    |
| --------- | ------------------------ | ----------- |
| Manager   | manager@emasjid.pk       | manager123  |
| Admin     | admin@emasjid.pk         | admin123    |
| Scholar   | scholar@emasjid.pk       | scholar123  |
| Committee | committee@emasjid.pk     | committee123|
| User      | user@emasjid.pk          | user123     |

The scholar account can be logged in from the regular
`/login` page (the system auto-routes scholars to
`/scholar/dashboard` based on role).

## Test scenarios

### A. Admin scholars page renders

1. Open `http://localhost:5173/admin/login`.
2. Log in as `admin@emasjid.pk` / `admin123`.
3. From the sidebar, click **Manage Scholars**.

Expected: page loads at `/admin/scholars` with:
- Heading "Manage Religious Scholars"
- A blue info card explaining what scholar accounts are
  for ("Religious scholars handle Nikah bookings…")
- Three stat cards across the top: **Total Scholars**,
  **Active**, **Total Nikah Performed**
- A grid of registered scholar cards (one per scholar)
  showing name, specialization, email, phone, a per-scholar
  stats block (Nikah Performed / Pending Requests), and
  three icon buttons (Reset Password, Edit, Deactivate)
- A **Pending Nikah Assignments** section below with
  mock booking rows and a per-booking "Assign Scholar"
  dropdown

### B. Add a new scholar

1. From `/admin/scholars`, click **Add New Scholar**
   (top-right button or the dashed-border card at the
   end of the grid).
2. Modal opens with: Full Name, Email, Phone,
   Specialization, Initial Password, Confirm Password.
3. Fill in:
   - Name: `Test Scholar`
   - Email: `test.scholar@emasjid.pk` (must be unique)
   - Phone: `0300-9999999`
   - Specialization: `Nikah Services`
   - Password: `test1234`
   - Confirm Password: `test1234`
4. Click **Create Account**.

Expected: modal closes, a new scholar card appears at the
top of the grid, success toast appears (ideally showing
the temp password if backend returns one). The scholar
appears in the **Active** count.

### C. Add validation

1. Open the Add New Scholar modal again.
2. Try submitting with Password = `123` (less than 6
   chars) → expect warning toast: "Password must be at
   least 6 characters."
3. Try Password = `test1234` and Confirm Password =
   `test1235` → expect error toast: "Passwords do not
   match."
4. Try Email = `admin@emasjid.pk` (already taken) →
   expect backend error toast.

### D. Reset password (currently mock-only)

1. On a scholar card, click the **key** icon button.
2. Modal opens with the scholar's name, a New Password
   field, and Confirm New Password.
3. Fill in valid values and submit.

Expected (today): modal closes and a warning toast
appears: "Password reset endpoint is not available yet."
The reset-password endpoint is not implemented on the
backend yet — the form is wired but the call is a
no-op. Documented as deferred.

### E. Edit scholar (currently mock-only)

1. On a scholar card, click the **pencil** icon button.

Expected: an info toast: "Edit scholar details flow is
mock-only." No actual API call. (Backend doesn't expose
an edit endpoint either.)

### F. Deactivate a scholar

1. On a scholar card, click the **trash** icon button.
2. (No confirmation prompt in this build — just fires.)

Expected: scholar card stays in the grid but the status
pill flips to **Inactive**. The Active stat card count
drops by 1. The deactivated scholar can no longer log in
— `POST /api/auth/login` returns 403 ("Account is
deactivated") because `auth.js` blocks inactive users.

### G. Pending Nikah Assignments — assign a scholar

1. Scroll to **Pending Nikah Assignments** at the bottom
   of `/admin/scholars`.
2. There are 3 mock bookings listed (NKH-2025-0058,
   0061, 0065).
3. On a row, change the **Assign Scholar** dropdown to
   one of the registered scholars.
4. Select.

Expected: success toast: "NKH-2025-XXXX assigned to
<Scholar Name>." Row is removed from the unassigned list.
The pending count chip drops. (This is a frontend-only
mock — the assignment doesn't go to the backend, since
the Scholars page doesn't call any assignment endpoint.
Tracked for Phase 12 / nikah refactor.)

### H. Scholar dashboard — view pending requests

1. Open `http://localhost:5173/login`.
2. Log in as `scholar@emasjid.pk` / `scholar123`.
3. After login, redirected to `/scholar/dashboard`.

Expected:
- Gradient header with greeting
  ("Assalam-o-Alaikum, Maulana Abdullah!" — name is
  hardcoded in the JSX, so even the actual logged-in
  scholar's name shows "Maulana Abdullah". Cosmetic.)
- Three stat cards: **Pending Requests**,
  **Confirmed This Month**, **Total Ceremonies**
- **Pending Nikah Requests** table with columns: Booking
  ID, Applicant (Groom & Bride), Contact, Requested
  Date, Time Slot, Status, Actions
- **My Confirmed Ceremonies** section below for accepted
  bookings

### I. Scholar accepts a booking

1. On `/scholar/dashboard`, find a row with status
   **Pending**.
2. Click the green **Accept** button (or the eye icon to
   open details first).
3. Confirm in the modal if you opened details.

Expected:
- Row is removed from Pending.
- Same row appears under **My Confirmed Ceremonies** with
  a date pill and "In N days" countdown.
- Success toast: "Booking NKH-XXXXXX accepted."
- Backend: `PUT /api/nikah-bookings/:id` with
  `status: 'accepted'` → 200; row updated in DB.

### J. Scholar rejects a booking

1. On `/scholar/dashboard`, click the red **Reject**
   button on a pending row.
2. (No reason prompt in this build — the rejection reason
   is hardcoded to "Not available at requested slot" in
   `Dashboard.jsx`. Cosmetic.)

Expected: row is removed from Pending. (It does **not**
appear in My Confirmed — it's just gone.) Warning toast:
"Booking NKH-XXXXXX rejected."

### K. Scope — scholar only sees own masjid's bookings

1. As `scholar@emasjid.pk` (assigned to Masjid Al-Noor
   in the seed), open `/scholar/dashboard`.
2. Look at the count of Pending + Confirmed bookings.

Expected: count = 2 (the 2 seeded bookings for Al-Noor:
1 pending + 1 already-accepted). No bookings from other
masjids leak. (`backend/routes/nikahBookings.js` filters
by `req.user.mosqueId`.)

### L. Authorization — community role can't create scholars

1. Log out, then log in as `user@emasjid.pk` /
   `user123`.
2. Try `POST /api/scholars` directly (e.g. from
   DevTools console):
   ```js
   fetch('/api/scholars', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json',
       Authorization: `Bearer ${localStorage.authToken}` },
     body: JSON.stringify({ name: 'X', email: 'x@x.com',
       password: 'test1234' }),
   })
   ```

Expected: response status 403, body
`{success: false, message: "Role 'community' is not
authorized to access this route"}`. No new scholar
created.

## Notes

- The Scholars admin page uses `api.getScholars()` on
  mount, which calls `GET /api/scholars` — admin-only.
  Make sure the admin's JWT is in localStorage before
  navigating there.
- All three stat cards on `/admin/scholars` are computed
  client-side from the `scholars` array. The "Total Nikah
  Performed" counter is a deterministic mock per index
  (`8 + i * 7`), not from real data.
- The scholar dashboard greeting text is hardcoded
  ("Maulana Abdullah!") and does not pull the logged-in
  user's name. Cosmetic — should be fixed in a polish
  pass but doesn't affect functionality.
- The seed file only creates 1 masjid (Al-Noor). To
  exercise cross-mosque flows end-to-end, you need a
  second masjid in the seed — currently Section K only
  checks that the scholar sees 2 bookings for their own
  masjid (a single-masjid isolation test).
- B1 (CORS misconfig) was the headline bug this phase.
  The Playwright test catches it because the admin login
  flow sets `localStorage.authToken` after a successful
  POST — when CORS blocks the POST, the token never
  lands, and the guard redirects back to login. CORS
  errors are visible in browser DevTools console.
