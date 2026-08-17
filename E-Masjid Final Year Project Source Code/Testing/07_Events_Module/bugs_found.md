# Phase 7 — Bugs Found

## BUG-EVENT-001 — Unscoped admin endpoint leaks across masjids

**Where:** [backend/routes/events.js:75](../../backend/routes/events.js)
(Phase 6 legacy POST/PUT/DELETE handler — never went through the `resolveScope` helper)

**Symptom:** Admin users of Masjid Al-Noor could call
`GET /api/events/admin` and see events belonging to Al-Rahman, Al-Falah,
and Al-Taqwa. The admin JWT has `mosqueId` but the handler never used it.
The same applied to PUT and DELETE — an Al-Rahman admin could target an
Al-Noor event id and the filter was just `{ _id }`.

**Why it matters:** Cross-tenant data leak. Same class as BUG-ANN-012
in announcements.

**Fix:**
- Added `GET /api/events/admin` that force-scopes to the caller's
  `mosqueId` (or to the manager's `$in: managedIds`).
- Refactored POST, PUT, DELETE to use the shared `resolveScope`
  helper ([backend/utils/scope.js](../../backend/utils/scope.js)).
- Manager path kept: pass `body.mosqueId` on POST and `?mosqueId=` on
  GET/PUT/DELETE; rejected with 400 if not one they manage.
- Frontend ([frontend/src/utils/api.js](../../frontend/src/utils/api.js))
  got `getAdminEvents()` and the admin Events page now uses it.

## BUG-EVENT-002 — `Mosque` destructured wrong inside handler

**Where:** [backend/routes/events.js:79](../../backend/routes/events.js)
manager-branch inline `const { Mosque } = require('../models/Mosque')`

**Symptom:** Every manager POST hit a 500 with
`TypeError: Cannot read properties of undefined (reading 'exists')`.
The module exports the model as default; destructuring `{ Mosque }` gave
`undefined`.

**Why it matters:** Manager couldn't create events for any of their masjids
via the API.

**Fix:** Moved `const Mosque = require('../models/Mosque')` to the top of
the file. Now used by both the manager-branch check and the future scope
filter if needed.

## BUG-EVENT-003 — Date-filter hid newly created events in the admin UI

**Where:** [frontend/src/components/Admin/Pages/Events.jsx](../../frontend/src/components/Admin/Pages/Events.jsx)
default `dateFilter='this-month'`

**Symptom:** After creating an event in the admin UI, the test
"Created event appears in list" failed even though the API returned 201.
The new event was always outside this month (the smoke test creates one
30 days ahead, and the seed uses today + 7/+14/+21 days).

**Why it matters:** Same class as Phase 6 — admin pages default to a
restrictive date filter and newly created events fall outside it. Real
admins hit this every time they create something outside the current
month (Ramadan schedule, summer camp, etc).

**Fix:** Test now switches the date filter to "All Time" before
verifying the create. Same human UX the manual test guide already
recommends.