# Phase 11 — Scholars Module: questions asked

## Decisions made during this phase

### Q1 — Is "reset scholar password" in scope for Phase 11?

**Context:** The admin Scholars page has a key-icon button
per scholar that opens a "Reset Password" modal. The modal
form validates locally (min 6 chars, passwords match) but
on submit shows: "Password reset endpoint is not available
yet."

**Decision:** Treat as **out of scope** for now. The form
is wired as a placeholder; no backend endpoint exists.

**Why:**
- We don't want to grow scope ("we should not increase
  features or scope because we already have a lot of
  features for our FYP").
- The reset-password flow already exists for community
  users (`forgot-password` + email link). Reusing it for
  scholar accounts is a natural follow-up, but it's a
  cross-cutting feature (email integration, token
  storage) rather than a Scholars-module concern.
- The current placeholder toast is honest about the gap
  and doesn't pretend to work.

If the supervisor asks for it later, we'd add
`POST /api/scholars/:id/reset-password` (admin-only,
returns a one-time token), then a `/reset-password/:token`
page that already exists for community users.

### Q2 — Is "edit scholar details" in scope?

**Context:** The pencil icon next to each scholar card
shows an info toast: "Edit scholar details flow is
mock-only."

**Decision:** Same as Q1 — out of scope. The current
`PUT /api/scholars/:id` already exists and the frontend
`updateScholar` method is wired (it uses the same call to
toggle `isActive`). So if edit details becomes a
requirement, the wiring is one form away.

**Why:** same scope-discipline reason. The pencil icon
exists to communicate "this is where edit would go"
without pretending to work.

### Q3 — Is "assign scholar to Nikah booking" in scope?

**Context:** The bottom of `/admin/scholars` has a
"Pending Nikah Assignments" section with mock bookings
(NKH-2025-0058 etc.) and a per-row dropdown. Selecting a
scholar removes the row and shows a success toast. But
nothing is sent to the backend.

**Decision:** Treat as **frontend mock**. Document it.

**Why:**
- The Nikah module (Phase 12 or wherever it lives) is
  where real assignment happens — the scholar dashboard
  is where bookings are actually accepted/rejected.
- The Scholars page just *visualizes* the queue, not
  drives it. A real implementation would either
  (a) consume `GET /api/nikah-bookings?status=pending`
  to show real bookings, or (b) keep the mock and not
  pretend otherwise.
- Adding a new endpoint just to record assignments
  duplicates state (we'd have both `nikahBookings.scholarId`
  and a separate `assignments` collection). Not worth the
  complexity for an FYP demo.

If the supervisor wants this for real, the cleanest path
is: change the dropdown to actually call `PUT
/api/nikah-bookings/:id` with `scholarId` set, and show
real pending bookings instead of the mock data.

### Q4 — Where do I document deferred bugs from frontend/backend divergence?

**Context:** During testing I found 3 things that look
like bugs but are actually a side-effect of the local
repo state (May 25) being older than the running
worktree (Aug 20). The on-disk `backend/routes/scholars.js`
returns `tempPassword`; the running controller/service
doesn't. The on-disk `AdminLayout.jsx` redirects to
`ROUTES.LOGIN`; the running layout might already be fixed.

**Decision:** Document them in `bugs_found.md` as
**Deferred** (not "Fixed"), with a clear note about the
divergence and what the fix would look like in each
version. Same in `my_test_results.md`.

**Why:**
- Pretending they're "fixed" when the local code didn't
  change would be misleading — if someone reverts to
  this commit and runs the test, the bug will be back.
- Pretending they're "unfixed" without acknowledging
  that the running build may have already fixed them
  is also misleading.
- "Deferred" + a clear "this is a divergence" note lets
  the next developer decide which side to align.

### Q5 — Should the Phase 11 test reseed the database?

**Context:** The accept/reject flow mutates the seeded
nikah bookings. After running the test once, the next run
sees 0 pending bookings (because the test left them all
accepted).

**Decision:** No — document it in the manual guide and
test header instead. Tell the user to `node utils/seed.js`
before re-running.

**Why:**
- Auto-reseed is risky in a shared dev environment
  (wipes donations, expenses, fund requests the user
  might be testing).
- The Playwright test already resets the booking back to
  pending at the end of Section 3 (`status: 'pending',
  scholarId: null`). So as long as the test runs to
  completion, the next run finds 1 pending again.
- If the test is interrupted mid-run, a manual reseed
  is one command away. Cheap.

## Questions deferred (not blocking)

- **Multi-masjid seeder** — covered in B4. If cross-mosque
  isolation testing is needed, the seeder needs a second
  masjid + admin + scholar + booking. Not required for
  Phase 11.
- **Scholar dashboard name from `useAuth()`** — cosmetic.
  The greeting is currently hardcoded "Maulana Abdullah!"
  in `Dashboard.jsx`. Should be `user.name`. Polish pass.
- **Stats counter sourcing** — the three stat cards on
  `/admin/scholars` (Total Scholars / Active / Total Nikah
  Performed) are computed client-side. The first two are
  accurate; the "Total Nikah Performed" is a deterministic
  mock (`8 + i * 7` per scholar). Real source of truth
  would be aggregating `nikahBookings` where
  `status === 'accepted'`. Polish pass.
