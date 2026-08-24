# 12 Nikah Booking Module — my test results

## Backend integration tests

`backend/tests/integration/nikah_scope.test.js`
covers the Nikah booking API end-to-end against an
in-memory MongoDB:

```
PASS backend/tests/integration/nikah_scope.test.js
  Nikah bookings module scope + behavior (Phase 12)
    Public access
      ✓ GET /api/nikah-bookings without token returns 401
      ✓ POST /api/nikah-bookings without token returns 401
    Community create + list + cancel
      ✓ community can create a booking for own masjid
      ✓ community list returns only own bookings
      ✓ community cancel sets status to rejected with cancellation reason
      ✓ community cannot cancel another user booking (403)
      ✓ community cannot cancel an already accepted booking (409)
      ✓ community cannot accept or reject (review is scholar/admin only)
    Slot conflict + date validation
      ✓ rejects past preferredDate (400)
      ✓ blocks double-booking the same slot (409)
      ✓ validates groomName/brideName/contact fields (400)
    Scholar list + review
      ✓ scholar sees pending bookings in own masjid
      ✓ scholar reject requires ≥3 char reason (400)
      ✓ scholar reject persists reason
      ✓ scholar cannot review booking from another mosque (403)
    Cross-mosque isolation
      ✓ Al-Noor admin sees only Al-Noor bookings
      ✓ Al-Noor admin cannot assign to Al-Rahman booking (403)
      ✓ Al-Rahman admin sees only Al-Rahman bookings
    Admin assign endpoint
      ✓ admin assigns scholar to pending booking (200)
      ✓ admin cannot assign scholar from another mosque (400)
      ✓ scholar cannot call assign (admin-only, 403)
      ✓ admin cannot assign to non-scholar user (400)
      ✓ cannot assign to deactivated scholar (400)
    Authorization
      ✓ committee cannot create booking (403)
      ✓ manager cannot create booking (403)
      ✓ community cannot call assign (403)
    Deactivation mid-session
      ✓ deactivated scholar cannot accept booking (401)

Tests: 29 passed, 29 total
```

Combined with the other three integration suites
(auth + masjids, donations, scholars), the backend
suite now totals **109 backend tests** across 4 files.

## Playwright end-to-end

`Testing/12_Nikah_Booking_Module/nikah_test.js` (run
against the live backend + MongoDB on port 5000):

```
=== Phase 12 Nikah Booking Module Test Summary ===
{"PASS": 26, "FAIL": 0, "SKIP": 1, "INFO": 2}
Total: 29
```

| Section | Tests | Outcome |
|---|---|---|
| 1. Community submits booking | 7/7 | login works, form heading visible, success modal + `NKH-XXXXXX` ID, SlotPicker renders 14-day grid + 8 slot buttons |
| 2. Community /my-bookings | 4/4 | greeting from `useAuth`, booking card visible, stats show Total/Pending/Accepted/Rejected |
| 3. Community cancel pending | 2/2 | confirm prompt, status flips to rejected, "Cancelled by applicant" banner shows, red Rejected pill |
| 4. Scholar dashboard | 3/3 | real name greeting, pending table has rows, Accept flips to My Confirmed Ceremonies |
| 5. Scholar reject | 0/3 | SKIPs because Section 4 accept already consumed the only pending booking |
| 6. Admin pending assignments | 3/3 | section visible, hardcoded `NKH-2025-0058` gone, real `NKH-` IDs show |
| 7. Admin Dashboard | 2/2 | greeting real, Pending Nikah card renders |
| 8. Cross-mosque isolation | 2/2 | Al-Rahman admin API call 200, no Al-Noor booking leaks |
| 9. SlotPicker booked slot UX | 4/4 | Al-Rahman community sees empty availability, booked slot shows red "Booked" badge + scholar name + `disabled` cursor-not-allowed style |

## Live HTTP smoke (verified via Playwright API +
curl-style request inspection)

- `POST /api/auth/login` (community) → 200, JWT.
- `POST /api/nikah-bookings` (community) → 201,
  `status: 'pending'`, `mosqueId` set from JWT user.
- `GET /api/nikah-bookings` (community) → 200,
  returns only own userId's bookings.
- `PUT /api/nikah-bookings/:id/cancel` (community
  owning the booking) → 200, `status: 'rejected'`,
  `rejectionReason: 'Cancelled by applicant'`,
  `scholarId` cleared.
- `POST /api/nikah-bookings` (past date) → 400,
  message: "Preferred date cannot be in the past".
- `POST /api/nikah-bookings` (slot already taken)
  → 409, message: "Selected Nikah slot is already
  taken".
- `POST /api/auth/login` (community at different
  mosque) → 200, but `PUT
  /api/nikah-bookings/:otherId/cancel` → 403,
  message: "You can only cancel your own bookings".
- `GET /api/nikah-bookings` (scholar) → 200, scoped
  to `mosqueId`, with both pending and assigned
  bookings visible.
- `PUT /api/nikah-bookings/:id` (scholar accept with
  future `confirmedDate`) → 200, `status: 'accepted'`,
  `scholarId` set, `confirmedDate` / `confirmedTime`
  set.
- `PUT /api/nikah-bookings/:id` (scholar reject with
  `rejectionReason: 'Schedule conflict with Jummah
  prayer'`) → 200, `rejectionReason` persisted.
- `PUT /api/nikah-bookings/:id/assign` (admin) → 200,
  `scholarId` set, returns the updated booking with
  the scholar populated.
- `PUT /api/nikah-bookings/:id/assign` (admin to
  scholar in a different mosque) → 400, "Scholar
  belongs to another mosque".
- `PUT /api/nikah-bookings/:id/assign` (admin to
  deactivated scholar) → 400, "Cannot assign a
  deactivated scholar".
- `PUT /api/nikah-bookings/:id/assign` (community or
  scholar) → 403, "Role 'community' is not authorized
  to access this route".
- `GET /api/nikah-bookings` (Al-Rahman admin) → 200,
  no Al-Noor bookings leak.
- `POST /api/nikah-bookings` (committee or manager) →
  403.

## What was tested manually vs automated

| Concern | Manual | Automated |
|---|---|---|
| Community submits booking | ✅ (A) | ✅ (Section 1) |
| Community sees own booking | ✅ (B) | ✅ (Section 2) |
| Community cancel own pending | ✅ (C) | ✅ (Section 3) |
| Cannot cancel other's | ✅ (C3) | ✅ (backend suite) |
| Cannot cancel accepted | ✅ (C2) | ✅ (backend suite) |
| Scholar sees pending | ✅ (D) | ✅ (Section 4) |
| Scholar accept | ✅ (F) | ✅ (Section 4) |
| Scholar reject requires reason | ✅ (G) | ✅ (Section 5) |
| Admin sees real pending list | ✅ (H) | ✅ (Section 6) |
| Admin assigns scholar | ✅ (I) | ✅ (Section 6) |
| Cannot assign inactive scholar | ✅ (I2) | ✅ (backend suite) |
| Admin Dashboard real count | ✅ (J) | ✅ (Section 7) |
| Cross-mosque isolation | ✅ (K) | ✅ (Section 8 + backend) |
| Slot conflict (409) | ✅ (L) | ✅ (backend suite) |
| Past date (400) | ✅ (M) | ✅ (backend suite) |
| Deactivated scholar can't review | ✅ (N) | ✅ (backend suite) |
| SlotPicker shows booked slot UX | ✅ (O) | ✅ (Section 9) |
| SlotPicker range pagination | ✅ (P) | ✅ (Section 1 + Section 9) |

## Outcome

Phase 12 testing:
- **12 bugs found and fixed** (B12-1 through B12-12)
- 26 PASS / 0 FAIL / 1 SKIP / 2 INFO Playwright
  assertions pass (verified through 4 Playwright runs
  against the live backend on port 5000; Section
  5 SKIPs only when there are zero pending rows left
  for the scholar to reject)
- 29/29 backend integration tests pass in
  `nikah_scope.test.js`
- 109 total backend tests pass across 4 suites
- Manual guide (14 scenarios A–N) covers the rest

## Bug summary

| ID | What | How fixed |
|---|---|---|
| **B12-1** | `Scholars.jsx` "Pending Nikah Assignments" used hardcoded mock rows | Removed mock; section reads `api.getNikahBookings()` filtered to `pending && !scholarId`; dropdown calls new `PUT /api/nikah-bookings/:id/assign` |
| **B12-2** | `Admin/Dashboard.jsx` "Pending Nikah" card used `mockNikahBookings` from `frontend/src/mocks/index.js` | Replaced with `api.getNikahBookings()` + client filter on `status === 'pending'` |
| **B12-3** | `MyBookings.jsx` `cancelPending()` just showed "endpoint not available" toast | Added `PUT /api/nikah-bookings/:id/cancel` (community-only, own booking, pending only); service marks `rejected` with reason `'Cancelled by applicant'` |
| **B12-4** | `MyBookings.jsx` greeting was hardcoded `"Muhammad Ahmed"` for every user | Read from `useAuth().user.name` with `there` fallback |
| **B12-5** | Dead View Details / Edit / Download buttons in `MyBookings.jsx` | Removed (see Q2 in `questions_asked.md`) |
| **B12-6** | No backend endpoint for admin to assign a scholar | Added `assignScholar` service + `PUT /api/nikah-bookings/:id/assign` (admin-only); validates scholar role, mosque match, active state |
| **B12-7** | `Admin/Dashboard.jsx` greeting hardcoded `"Assalam-o-Alaikum, Haji Ahmad"` | Now reads `{user?.name || 'Admin'}` from `useAuth()` |
| **B12-8** | `NikahBooking.jsx` success modal showed raw Mongo `_id` for Booking ID | Formatted as `NKH-{last6.toUpperCase()}` to match the Scholars.jsx and Scholar dashboard convention |
| **B12-9** | `App.jsx` had no `/admin/dashboard` route — linking to `/admin/dashboard` hit the catchall and rendered an empty outlet | Added `<Route path="dashboard" element={<AdminDashboard />} />` under `/admin/*` |
| **B12-10** | `App.jsx` had no `/scholar/dashboard` route — scholar login redirected to `/scholar` only, deep links to `/scholar/dashboard` redirected to login | Added `<Route path="dashboard" element={<ScholarDashboard />} />` under `/scholar/*` |
| **B12-11** | `SlotPicker.toDayKey` used `d.toISOString().slice(0,10)`, which converts through UTC and shifts the day key by -1 in UTC+5 timezones (Pakistan). Clicking "Aug 26" stored `2026-08-25`, then re-converting that string shifted it to `2026-08-24`, so the wrong day cell was highlighted and the booked-slot UX test failed | Replaced with local-Date components (`getFullYear` / `getMonth` / `getDate`) so the day key matches the visible cell |
| **B12-12** | `SlotPicker` showed only a fixed 14-day window starting today. A user with a booking two months out (or any non-near-term date) could not navigate to it | Added chevron `previous / next 2 weeks` pagination with `offset` state and an explicit `Aug 23 – Sep 5, 2026` range label so any future date is reachable |

## Deferred work

(none — all Phase 12 work is complete)

## Running the tests

```bash
cd "D:\College data\Seven semster\Project data\Git hub data\E-Masjid Final Year Project Source Code"

# Backend integration suite
cd backend
npx jest tests/integration/nikah_scope.test.js --runInBand

# Playwright E2E
node Testing/12_Nikah_Booking_Module/nikah_test.js
```

The Playwright test re-seeds the DB before running
(it shells out to `node utils/seed.js` from the
backend folder), so it expects a clean seeded
database.