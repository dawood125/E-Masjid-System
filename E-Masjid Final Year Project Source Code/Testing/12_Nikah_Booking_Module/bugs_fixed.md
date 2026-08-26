# 12 Nikah Booking Module — Bugs Fixed

> Phase 12 — refilled 2026-08-26 from the existing `bugs_found.md` and the
> current source tree. Each entry cross-references the bug ID, the file that
> was changed, and the verification that covered it.

## B12-1 — "Pending Nikah Assignments" dropdown was hardcoded

**File:** `frontend/src/components/Admin/Pages/Scholars.jsx`

**Before:** the dropdown was driven by a hardcoded `ASSIGNMENT_MOCKS` array
(`[NKH-2025-0058, 0061, 0065]`). The dropdown just filtered that array in
memory; no backend call was ever made.

**After:** the section now calls `api.getNikahBookings()`, filters to
`pending && !scholarId` on the client, and POSTs to the new
`PUT /api/nikah-bookings/:id/assign` (admin-only) on dropdown change. The row
is removed from the list only after the backend confirms.

## B12-2 — Dashboard "Pending Nikah" stat card counted `mockNikahBookings`

**File:** `frontend/src/components/Admin/Pages/Dashboard.jsx`

**Before:** the stat card imported from `frontend/src/mocks/index.js` and was
unrelated to the actual DB.

**After:** replaced the mock with `api.getNikahBookings()` and filter to
`status === 'pending'`. Count is now mosque-scoped via the backend's
`listForCaller`.

## B12-3 — Community cancel button showed "endpoint not available"

**File:** `frontend/src/components/User/Pages/MyBookings.jsx` +
`backend/routes/nikahBookings.js` + `backend/services/nikahService.js`

**Before:** the cancel button's handler showed a toast
"Cancellation endpoint is not available yet. Please contact admin." and did
nothing.

**After:** new `PUT /api/nikah-bookings/:id/cancel` (community-only, own
booking, pending only). The service marks the booking as `rejected` with
`rejectionReason: 'Cancelled by applicant'`. The page now calls it through a
confirmation prompt and the row updates in place.

## B12-4 — Hardcoded greeting `"Assalam-o-Alaikum, Muhammad Ahmed!"`

**File:** `frontend/src/components/User/Pages/MyBookings.jsx`

**After:** reads `useAuth().user.name` with a `there` fallback. Same pattern
the Scholar dashboard already used.

## B12-5 — Dead View Details / Edit / Download buttons

**File:** `frontend/src/components/User/Pages/MyBookings.jsx`

**After:** those three buttons were removed (see Q2 in `questions_asked.md`).
The Cancel Booking button remains for pending rows.

## B12-6 — No backend endpoint to assign a scholar to a pending booking

**File:** `backend/services/nikahService.js` + `backend/routes/nikahBookings.js`

**After:** new `assignScholar(id, scholarId, user)`:
- admin-only, same mosque, pending only
- scholar must be `role === 'scholar'`, `isActive === true`, and
  `scholar.mosqueId === booking.mosqueId`
- returns 400 with a clear message on each violation
- exposed via `PUT /api/nikah-bookings/:id/assign`

## B12-7 — Hardcoded `"Assalam-o-Alaikum, Haji Ahmad"` on the admin dashboard

**File:** `frontend/src/components/Admin/Pages/Dashboard.jsx`

**After:** now reads `{user?.name || 'Admin'}` from `useAuth()` — same pattern
as the Scholar dashboard and MyBookings.

## B12-8 — Raw Mongo `_id` shown as "Booking ID"

**File:** `frontend/src/components/User/Pages/NikahBooking.jsx`

**After:** the booking id is now formatted as `NKH-{last6.toUpperCase()}`,
matching the same `String(bookingId).slice(-6).toUpperCase()` format used by
`Scholars.jsx` and `Scholar/Dashboard.jsx`.

## B12-9 — `/admin/dashboard` route was missing

**File:** `frontend/src/App.jsx`

**Before:** navigating to `/admin/dashboard` hit the catchall
`<Route path="*" element={<Navigate to="/" replace />} />` and redirected to
`/`. The AdminLayout header rendered but the outlet was empty.

**After:** `<Route path="dashboard" element={<AdminDashboard />} />` is
mounted under `/admin/*`.

## B12-10 — `/scholar/dashboard` route was missing

**File:** `frontend/src/App.jsx`

**Before:** navigating to `/scholar/dashboard` hit the catchall and bounced
back through `/` and `protectedRoute` to `/login`. Playwright Section 4
recorded `rows=0` because it was on the Login page.

**After:** `<Route path="dashboard" element={<ScholarDashboard />} />` is
mounted under `/scholar/*`.

## B12-11 — `SlotPicker.toDayKey` shifted dates by a day in PKT

**File:** `frontend/src/components/User/SlotPicker.jsx`

**Before:** `d.toISOString().slice(0,10)` after `setHours(0,0,0,0)`. In
Pakistan (UTC+5) the ISO slice produced the previous day; clicking "Wed 26
Aug" stored `2026-08-25`, then re-converting shifted it again to
`2026-08-24`, so the wrong day cell was highlighted and the booked slot never
matched the day the user had just clicked.

**After:** uses local `Date` components (`getFullYear`, `getMonth`,
`getDate`) so the stored day key matches the visible cell — for both the day
cells rendered and the comparison used to mark `selected`.

## B12-12 — `SlotPicker` was a fixed 14-day window starting today

**File:** `frontend/src/components/User/SlotPicker.jsx`

**After:** added an `offset` state + chevron `previous / next 2 weeks`
buttons and a `MMM d – MMM d, yyyy` range label. The `availability` fetch is
keyed on `range.from / range.to` so the booked-slot map refreshes as the
user pages forward.

---

## Verification coverage

Each fix is covered by:
- A backend integration test in
  `backend/tests/integration/nikah_scope.test.js` (where applicable)
- A Playwright E2E assertion in `Testing/12_Nikah_Booking_Module/nikah_test.js`
- A manual scenario in `Testing/12_Nikah_Booking_Module/manual_testing_guide.md`

`tests/integration/nikah_scope.test.js` currently passes (29/29) as of
2026-08-26.
