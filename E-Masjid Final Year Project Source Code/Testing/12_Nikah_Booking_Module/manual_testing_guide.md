# 12 Nikah Booking Module — manual testing guide

This module covers the **Nikah (marriage) ceremony
booking** flow across three actors:

- **Community** (`/nikah-booking`, `/my-bookings`) —
  submits booking requests, tracks status, cancels
  their own pending request.
- **Scholar** (`/scholar/dashboard`) — reviews pending
  requests in their masjid, accepts or rejects with a
  required reason.
- **Admin** (`/admin/scholars`, `/admin/dashboard`) —
  assigns scholars to pending bookings, sees real
  pending counts on the dashboard.

All four actors are scoped to their own masjid: a
booking at Masjid Al-Noor is invisible to the
Al-Rahman admin, the Al-Rahman scholar, and the
Al-Rahman community member.

## Prerequisites

- Backend running on `http://127.0.0.1:5000`
- Frontend running on `http://127.0.0.1:5174`
  (or 5173 — CORS allows both)
- `CLIENT_URL` in `backend/.env` matches the frontend
  port
- Seeded with `node utils/seed.js` (creates 4 masjids:
  Al-Noor, Al-Rahman, Al-Falah, Al-Taqwa each with
  their own admin/scholar/committee/community user plus
  one accepted and one pending nikah booking)
- Database connected (`MONGODB_URI` set in `.env`)

## Credentials

Same set as Phase 11:

| Role            | Email                          | Password    |
|-----------------|--------------------------------|-------------|
| Manager         | manager@emasjid.pk             | manager123  |
| Admin (Al-Noor) | admin@emasjid.pk               | admin123    |
| Admin (Al-Rahman) | admin.alrahman@emasjid.pk    | admin123    |
| Admin (Al-Falah) | admin.alfalah@emasjid.pk      | admin123    |
| Admin (Al-Taqwa) | admin.altaqwa@emasjid.pk      | admin123    |
| Scholar (Al-Noor) | scholar@emasjid.pk           | scholar123  |
| Scholar (Al-Rahman) | scholar2@emasjid.pk        | scholar123  |
| Committee       | committee@emasjid.pk           | committee123|
| User            | user@emasjid.pk                | user123     |

## Test scenarios

### A. Community submits a booking

1. Open `http://127.0.0.1:5174/login`.
2. Select the **User** role from the role dropdown.
3. Log in as `user@emasjid.pk` / `user123`.
4. From the public site navigation, click
   **Book Nikah** (or navigate to
   `http://127.0.0.1:5174/nikah-booking`).

Expected: page loads at `/nikah-booking` with:
- Green header "Book Your Nikah Ceremony"
- Form with 6 fields (Groom Name, Bride Name,
  Phone, Email, Date, Time Slot, Notes)
- Date picker minimum = today
- Sidebar with "Required Documents" and "Need
  Assistance?"
pass
5. Fill in:
   - Groom Name: `Manual Test Groom`
   - Bride Name: `Manual Test Bride`
   - Phone: `0300-1112233`
   - Email: `manual@test.com`
   - Address: `House 1, Test Lane, Sheikhupura`
   - Date: any future date at least 3 days from today
   - Time Slot: any of the 8 slots (10:00 / 11:00 /
     12:00 / 14:00 / 15:00 / 16:00 / 17:00 / 20:00)
   - Notes: (optional)
6. Click **Submit Application**.

Expected: success modal appears with
"Application Submitted!" and a booking ID of the form
`NKH-XXXXXX` (the last 6 chars of the Mongo `_id`).
Toast: "Nikah booking request submitted successfully".
Modal has a **View My Bookings** link and a **Done**
button.
pass
### B. Community sees the new booking in MyBookings

1. After step A, click **View My Bookings** in the
   success modal.

Expected: page loads at `/my-bookings` with:
- Greeting "Assalam-o-Alaikum, Muhammad Ahmed!" (or
  whatever the auth user's name is — see B12-4) — **not
  hardcoded**.
- Stats card shows Total = 3 (1 seed accepted + 1 seed
  pending + 1 new), Pending ≥ 1.
- New card at the top with status **Pending**, couple
  "Manual Test Groom & Manual Test Bride", preferred
  date and time slot as filled in.
pass
### C. Community cancels own pending booking

1. On `/my-bookings`, find the new pending row.
2. Click **Cancel Booking**.
3. Browser confirm prompt: "Cancel this booking? This
   action cannot be undone."
4. Click OK.

Expected:
- Button text flips to "Cancelling..." briefly.
- Toast: "Booking NKH-XXXXXX cancelled."
- Row stays on the page but its status pill flips to
  red **Rejected**.
- The red banner under the dates now shows
  "Cancelled by applicant".
- Stats: Total unchanged, Pending drops by 1,
  Rejected rises by 1.
pass
### C2. Cannot cancel an already accepted booking

1. Try to cancel the original seed booking that is
   already Accepted.

Expected: there is no Cancel button on the row
because the cancel button only renders for `status ===
'pending'` (see `MyBookings.jsx` line ~203).
pass
### C3. Cannot cancel someone else's booking

Direct API test as a different community user:

```bash
curl -X PUT http://127.0.0.1:5000/api/nikah-bookings/<id>/cancel \
  -H "Authorization: Bearer <other-user-token>"
```

Expected: 403 with body
`{success:false,message:"You can only cancel your own
bookings"}`.

### D. Scholar logs in and sees pending bookings

1. Log out, then log in as `scholar@emasjid.pk` /
   `scholar123` (Al-Noor scholar).
2. After login, redirected to `/scholar/dashboard`.

Expected:
- Header greeting "Assalam-o-Alaikum, Sheikh Muhammad
  Hassan!" (real name).
- Three stat cards: Pending Requests, Confirmed
  Upcoming, Total Ceremonies.
- **Pending Nikah Requests** table shows Al-Noor
  pending bookings. The seed has 1 pending + the
  community-created one (if it wasn't cancelled in
  step C).

### F. Scholar accepts a booking

1. On `/scholar/dashboard`, find a row with status
   **Pending**.
2. Click the green **Accept** button.

Expected:
- Row is removed from Pending.
- Same row appears under **My Confirmed Ceremonies**
  with a date pill and "In N days" countdown.
- Success toast: "Booking NKH-XXXXXX accepted."
pass
### G. Scholar rejects with required reason

1. Click the red **Reject** button on another pending
   row.
2. The Reject Booking modal opens with a textarea.
3. Click **Reject Booking** without typing.
pass
Expected: warning toast: "Please provide a reason for
rejection." Row stays in pending.

4. Type `x` (1 char). Click **Reject Booking**.

Expected: same toast. The backend validator requires
≥3 chars on `rejectionReason`.

5. Type `Schedule conflict with Jummah prayer`.
   Click **Reject Booking**.

Expected:
- Modal closes.
- Toast: "Booking NKH-XXXXXX rejected."
- Row removed from Pending. Does **not** appear in
  Confirmed.

### H. Admin sees real pending assignments on /admin/scholars

1. Log out, log in as `admin@emasjid.pk` /
   `admin123`.
2. Navigate to `/admin/scholars` (Manage Scholars in
   the sidebar).
4. Scroll to **Pending Nikah Assignments**.

Expected:
- The 3 hardcoded mock rows `NKH-2025-0058`,
  `0061`, `0065` are **gone** — they no longer exist
  (B12-1).
- Real booking rows are listed, with format
  "Booking NKH-XXXXXX" + "Manual Test Groom & Manual
  Test Bride - Jun 30, 2026 at 14:00".
- Each row has an **Assign Scholar** dropdown with the
  registered scholars for this masjid (e.g.
  `Sheikh Muhammad Hassan`).
- Inactive scholars appear with "(inactive)" suffix
  and the dropdown option is disabled (B12-1).

### I. Admin assigns a scholar to a pending booking

1. On `/admin/scholars`, find a pending booking row
   without an assigned scholar.
2. Pick a scholar from the dropdown.

Expected:
- Dropdown text briefly shows "Assigning...".
- Toast: "Booking NKH-XXXXXX assigned to
  <Scholar Name>."
- Row disappears from the Pending Nikah Assignments
  list.
- The booking's `scholarId` is now set in the DB.
  Verify via:
  ```bash
  curl http://127.0.0.1:5000/api/nikah-bookings/<id> \
    -H "Authorization: Bearer <admin-token>"
  ```
  Expected: `data.scholarId.name` matches the assigned
  scholar.

### I2. Cannot assign to inactive scholar

1. In `/admin/scholars`, click the trash icon to
   deactivate the only active scholar (after step I).
2. Now try to assign any pending booking to a
   scholar — the inactive one is greyed out in the
   dropdown.

Expected: trying to assign returns
`400 - Cannot assign a deactivated scholar`. (The
frontend prevents it by disabling the option.)

### J. Admin Dashboard "Pending Nikah" stat is real

1. Navigate to `/admin/dashboard`.

Expected:
- "Pending Nikah" card shows the actual count of
  pending bookings for this admin's masjid (e.g. 1).
- The "12% this month" trend indicator is **gone** —
  only Pending Nikah was previously mock. All other
  stats (Total Donations, Total Expenses, Upcoming
  Events) are already real.

### K. Cross-mosque isolation

1. Log out, log in as `admin.alrahman@emasjid.pk` /
   `admin123` (Al-Rahman admin).
2. Navigate to `/admin/dashboard`.

Expected: Pending Nikah count is for Al-Rahman's
masjid only — Al-Noor's bookings are not counted
(B12-2 confirmed via direct API too).

3. Direct API check:
   ```bash
   curl http://127.0.0.1:5000/api/nikah-bookings \
     -H "Authorization: Bearer <al-rahman-admin-token>"
   ```

Expected: response is a 200, but no booking whose
`groomName` is `Manual Test Groom` or whose
`mosqueId` is the Al-Noor ID. (See test
`backend/tests/integration/nikah_scope.test.js`
section "Cross-mosque isolation".)

### L. Slot conflict

Direct API check as the community user:

```bash
# First booking
curl -X POST http://127.0.0.1:5000/api/nikah-bookings \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{"groomName":"Slot One","brideName":"First","preferredDate":"2026-12-01T00:00:00Z","preferredTime":"15:00","contact":"03001112233"}'

# Scholar accepts it
curl -X PUT http://127.0.0.1:5000/api/nikah-bookings/<id> \
  -H "Authorization: Bearer <scholar-token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"accepted","confirmedDate":"2026-12-01T00:00:00Z","confirmedTime":"15:00"}'

# Second booking same slot
curl -X POST http://127.0.0.1:5000/api/nikah-bookings \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{"groomName":"Slot Two","brideName":"Second","preferredDate":"2026-12-01T00:00:00Z","preferredTime":"15:00","contact":"03004445566"}'
```

Expected:
- First booking: 201.
- Accept: 200.
- Second booking: 409 with body
  `{success:false,message:"Selected Nikah slot is
  already taken"}`.

### M. Past date rejected

```bash
curl -X POST http://127.0.0.1:5000/api/nikah-bookings \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{"groomName":"Past","brideName":"Date","preferredDate":"2020-01-01T00:00:00Z","preferredTime":"15:00","contact":"03001112233"}'
```

Expected: 400 with body
`{success:false,message:"Preferred date cannot be in
the past"}`.

### N. Deactivated scholar cannot accept

1. Log in as `admin@emasjid.pk` / `admin123`, go to
   `/admin/scholars`, deactivate the only scholar.
2. Log out, log in as `scholar@emasjid.pk` /
   `scholar123`.

Expected: login returns 403 with
"Account is deactivated. Please contact your
administrator." (Phase 11 BUG-F7 fix still covers
this for nikah paths too.)

3. (Alternative) If the scholar was logged in before
   being deactivated, refreshing `/scholar/dashboard`
   kicks them out via the Phase 11 F7 fix.

## Notes

- The community form requires login — if you visit
  `/nikah-booking` while logged out, the success flow
  still saves the booking but the user is whoever the
  JWT belongs to. Make sure to log in first.
- All 8 time slots are bookable in theory but the
  scholar will reject any with `< 30 min` notice
  during Jummah. Use 10:00 (after Ishraq) or 11:00 for
  cleanest test runs.
- The Reject Booking modal requires ≥3 char reason
  both client-side (trim check) and server-side
  (express-validator `isLength({min:3, max:500})`).
- "Cancelled by applicant" is a special rejection
  reason set by the new `cancelByApplicant` service
  function. It never appears for a scholar's rejection.
- The `/admin/dashboard` trend indicators under
  donations / expenses are out of scope for Phase 12
  — only the Pending Nikah card was using a mock and
  is now real.
- Phase 12 bug summary:
  - **B12-1** Pending Nikah Assignments in
    `/admin/scholars` was a hardcoded mock.
  - **B12-2** Admin Dashboard "Pending Nikah" stat
    used `mockNikahBookings` from `frontend/src/mocks`.
  - **B12-3** Community cancel just showed a toast
    saying endpoint not available.
  - **B12-4** Greeting "Muhammad Ahmed" was hardcoded
    on MyBookings.
  - **B12-5** Dead View Details / Edit / Download
    buttons in MyBookings removed.
  - **B12-6** No admin-assign endpoint existed — the
    dropdown had nothing to call.