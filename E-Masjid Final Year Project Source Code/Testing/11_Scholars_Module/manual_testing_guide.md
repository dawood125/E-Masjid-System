# Phase 11 — Scholars Module: manual testing guide

This module covers the **religious scholars management**
feature on both the admin side and the scholar side:

- **Admin side** (`/admin/scholars`) — create / edit /
  reset password / deactivate / activate scholars, view
  stats, mock-assign scholars to pending Nikah bookings.
- **Scholar side** (`/scholar/dashboard`) — view pending
  Nikah requests for the scholar's masjid, accept or
  reject each one (with a required reason), view own
  confirmed ceremonies.

The scholar role is one of the five actors in the system
(community, admin, scholar, committee, manager). They
log in via `/login` using the `scholar@emasjid.pk`
credentials and are redirected to `/scholar/dashboard`.

## Prerequisites

- Backend running on `http://127.0.0.1:5000`
- Frontend running on `http://127.0.0.1:5174` (or 5173 —
  whichever the dev server is on; CORS allows both)
- `CLIENT_URL` in `backend/.env` matches the frontend
  port
- Seeded with `node utils/seed.js` (creates 4 masjids:
  Al-Noor, Al-Rahman, Al-Falah, Al-Taqwa, each with
  their own admin/scholar/committee/community user plus
  one nikah booking + sample donations/expenses)
- Database connected (`MONGODB_URI` set in `.env`)

## Credentials

| Role      | Email                    | Password    |
| --------- | ------------------------ | ----------- |
| Manager   | manager@emasjid.pk       | manager123  |
| Admin (Al-Noor)     | admin@emasjid.pk         | admin123    |
| Admin (Al-Rahman)   | admin.alrahman@emasjid.pk| admin123    |
| Admin (Al-Falah)    | admin.alfalah@emasjid.pk | admin123    |
| Admin (Al-Taqwa)    | admin.altaqwa@emasjid.pk | admin123    |
| Scholar (Al-Noor)   | scholar@emasjid.pk       | scholar123  |
| Scholar (Al-Rahman) | scholar2@emasjid.pk      | scholar123  |
| Scholar (Al-Falah)  | scholar3@emasjid.pk      | scholar123  |
| Scholar (Al-Taqwa)  | scholar4@emasjid.pk      | scholar123  |
| Committee | committee@emasjid.pk     | committee123|
| User      | user@emasjid.pk          | user123     |

The scholar account can be logged in from the regular
`/login` page (the system auto-routes scholars to
`/scholar/dashboard` based on role).

## Test scenarios

### A. Admin scholars page renders

1. Open `http://127.0.0.1:5174/admin/login`.
2. Log in as `admin@emasjid.pk` / `admin123`.
3. From the sidebar, click **Manage Scholars**.

Expected: page loads at `/admin/scholars` with:
- Heading "Manage Religious Scholars"
- A blue info card explaining what scholar accounts are
  for ("Religious scholars handle Nikah bookings…")
- Three stat cards across the top: **Total Scholars**,
  **Active**, **Inactive**
- A grid of registered scholar cards (one per scholar)
  showing name, specialization, email, phone, a per-scholar
  stats block (Nikah Performed / Pending Requests), and
  three icon buttons (Reset Password, Edit, Deactivate
  or Activate depending on state)
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
top of the grid, success toast appears with the typed
password and a copy button. The scholar appears in the
**Active** count.

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

### D. Reset password (BUG-F4 fixed)

1. On a scholar card, click the **key** icon button.
2. Modal opens with the scholar's name, a New Password
   field, and Confirm New Password (both with show/hide
   toggles).
3. Fill in valid values and submit.

Expected: modal closes, success toast appears with the
new password and a copy button. The next time that
scholar logs in, they must use the new password (the
hash is updated via the User model's pre-save hook).
Backend: `POST /api/scholars/:id/reset-password` with
`{newPassword: '...'}` → 200.

### E. Edit scholar (BUG-F2 fixed)

1. On a scholar card, click the **pencil** icon button.
2. Modal opens pre-filled with current name, email,
   phone, specialization.
3. Change the name to `Updated Scholar Name` and
   specialization to `Updated Specialization`.
4. Click **Save Changes**.

Expected: modal closes, success toast appears. The
scholar card now shows the new name and specialization.
Backend: `PUT /api/scholars/:id` with
`{name, email, phone, specialization}` → 200.

### E2. Edit validation

1. Open Edit again, clear the **Name** field, click
   Save → expect backend error toast about name being
   too short (min 2 chars).
2. Open Edit, set **Email** to `not-an-email`, click
   Save → expect backend error toast.
3. Open Edit, set **Specialization** to `x` (1 char),
   click Save → expect backend error toast
   ("Invalid specialization").

### F. Deactivate a scholar

1. On an Active scholar card, click the **trash** icon
   button.
2. (No confirmation prompt in this build — just fires.)

Expected: scholar card stays in the grid but the status
pill flips to **Inactive**. The Active stat card count
drops by 1, the Inactive count rises by 1. The
deactivated scholar can no longer log in —
`POST /api/auth/login` returns 403 ("Account is
deactivated") because `auth.js` blocks inactive users.
The icon button on the card now reads **Activate**
instead of **Deactivate**.

### F2. Activate a scholar (BUG-F5 fixed)

1. On the deactivated scholar card from step F, click
   the **Activate** (green) icon button.

Expected: status pill flips back to **Active**. The
Active count rises by 1, Inactive drops by 1. The icon
flips back to **Deactivate**. The scholar can now log
in again.

### G. Pending Nikah Assignments — assign a scholar (mock)

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

1. Open `http://127.0.0.1:5174/login`.
2. Select the **Scholar** role from the role dropdown.
3. Log in as `scholar@emasjid.pk` / `scholar123`.
4. After login, redirected to `/scholar/dashboard`.

Expected:
- Gradient header with greeting
  ("Assalam-o-Alaikum, Sheikh Muhammad Hassan!") — the
  name comes from `useAuth().user.name`.
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

### J. Scholar rejects a booking (BUG-F6 fixed)

1. On `/scholar/dashboard`, click the red **Reject**
   button on a pending row.
2. A browser prompt asks "Reason for rejection:" —
   enter at least 3 characters (e.g.
   `Schedule conflict with Jummah prayer`).
3. Click OK.

Expected: row is removed from Pending. (It does **not**
appear in My Confirmed — it's just gone.) Warning toast:
"Booking NKH-XXXXXX rejected." The booking's
`rejectionReason` field is persisted in the DB and
visible to admins via `GET /api/nikah-bookings`.

### J2. Reject requires a reason

1. Click **Reject** again on another pending row.
2. Click OK on the prompt without typing → expect error
   toast: "Please provide a rejection reason."
3. Type `x` (1 char) → expect same error (min 3 chars).

### K. Scope — scholar only sees own masjid's bookings

1. As `scholar@emasjid.pk` (assigned to Masjid Al-Noor
   in the seed), open `/scholar/dashboard`.
2. Look at the count of Pending + Confirmed bookings.

Expected: count = 2 (the 2 seeded bookings for Al-Noor:
1 pending + 1 already-accepted). No bookings from other
masjids leak. (`backend/routes/nikahBookings.js` filters
by `req.user.mosqueId`.)

### K2. Scope — admin only sees own masjid's scholars

1. Log in as `admin@emasjid.pk` (Al-Noor admin), open
   `/admin/scholars`. Expected: 1 scholar card
   (`Sheikh Muhammad Hassan`).
2. Log out, log in as `admin.alrahman@emasjid.pk`
   (Al-Rahman admin). Expected: 1 scholar card
   (`Maulana Yousuf Raza`). The Al-Noor scholar is not
   visible.
3. Direct API test as Al-Rahman admin:
   ```bash
   curl -X PUT http://127.0.0.1:5000/api/scholars/<al-noor-id> \
     -H "Authorization: Bearer <al-rahman-token>" \
     -H "Content-Type: application/json" \
     -d '{"name":"hacked"}'
   ```
   Expected: 404, body `{success:false,message:"Scholar
   not found"}` — the controller scopes by
   `req.user.mosqueId` so the Al-Noor scholar is
   invisible.

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

### L2. Authorization — manager can't manage scholars

1. Log in as `manager@emasjid.pk` / `manager123`.
2. Try `POST /api/scholars` (same as L).

Expected: 403 — managers manage masjids, not scholars.
The Scholars nav item is hidden in their layout. See
Q6 in `questions_asked.md`.

## Notes

- The Scholars admin page uses `api.getScholars()` on
  mount, which calls `GET /api/scholars` — admin-only.
  Make sure the admin's JWT is in localStorage before
  navigating there.
- The three stat cards on `/admin/scholars` are computed
  client-side from the `scholars` array. Total = array
  length. Active = `isActive === true`. Inactive =
  `isActive === false`. (Earlier build had a "Total
  Nikah Performed" card that was a deterministic mock —
  removed because it had no real source of truth.)
- The scholar dashboard greeting now reads
  `useAuth().user.name`. Cosmetic polish.
- The seed creates 4 masjids (Al-Noor, Al-Rahman,
  Al-Falah, Al-Taqwa) so cross-mosque isolation is
  testable end-to-end.
- Phase 11 bug summary:
  - **B1** CORS misconfig — fixed by allowing
    `127.0.0.1:5174` in addition to `localhost:5173`.
  - **B2** Backend returned `tempPassword` for new
    scholars but never sent it — fixed by switching to
    admin-typed password (no email roundtrip needed for
    FYP demo).
  - **F2** Edit modal was mock-only — fixed, modal now
    pre-fills and saves via `PUT /api/scholars/:id`.
  - **F4** Reset password was mock-only — fixed, modal
    now calls `POST /api/scholars/:id/reset-password`.
  - **F5** No way to reactivate a deactivated scholar
    — fixed, icon flips between Activate / Deactivate
    based on `isActive`.
  - **F6** Reject had no reason — fixed, browser prompt
    requires ≥3-char reason, persisted as
    `rejectionReason` on the booking.