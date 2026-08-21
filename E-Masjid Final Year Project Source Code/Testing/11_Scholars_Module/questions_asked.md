# Phase 11 — Scholars Module: questions asked

## Decisions made during this phase

### Q1 — Is "reset scholar password" in scope for Phase 11?

**Context:** The admin Scholars page has a key-icon button
per scholar that opens a "Reset Password" modal. The modal
form validates locally (min 6 chars, passwords match) but
on submit shows: "Password reset endpoint is not available
yet."

**Decision (updated):** **Implemented end-to-end (BUG-F4
fixed).** New endpoint `POST /api/scholars/:id/reset-password`
(admin-only) hashes a new password via the User model's
pre-save hook and persists it. The frontend modal now
sends the typed password to that endpoint, copies the new
password to clipboard, and toasts success.

**Why the change:**
- "We have to build every feature end to end working
  perfectly fine so why you keeping things mock."
- The reset flow is a real admin operation, not a
  cross-cutting feature. It belongs in Phase 11.
- Email/token flow is still a separate concern (out of
  scope); admin-typed reset is sufficient for FYP demo.

**How to apply:** the admin uses the key-icon on each
scholar card. The modal has two password fields with
show/hide toggles, a copy button after submit, and a
success toast with the new password.

### Q2 — Is "edit scholar details" in scope?

**Context:** The pencil icon next to each scholar card
shows an info toast: "Edit scholar details flow is
mock-only."

**Decision (updated):** **Implemented end-to-end (BUG-F2
fixed).** `PUT /api/scholars/:id` already accepted an
extended body for `isActive` toggling; the validator now
also accepts `name`, `email`, `phone`, `specialization`.
The frontend Edit modal pre-fills existing values, allows
edits, saves via the existing `updateScholar` method, and
toasts success.

**Why the change:** same reason as Q1 — no mocks for core
admin operations.

**How to apply:** click the pencil icon, change any of
name / email / phone / specialization, click Save
Changes. Server-side validation runs (email format, name
length, specialization min 2 chars).

### Q3 — Is "assign scholar to Nikah booking" in scope?

**Context:** The bottom of `/admin/scholars` has a
"Pending Nikah Assignments" section with mock bookings
(NKH-2025-0058 etc.) and a per-row dropdown. Selecting a
scholar removes the row and shows a success toast. But
nothing is sent to the backend.

**Decision:** Treat as **frontend mock**. Document it.

**Why:**
- The Nikah module (Phase 12) is where real assignment
  happens — the scholar dashboard is where bookings are
  actually accepted/rejected.
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

**Decision (updated):** **Yes — auto-reseed at the start
of the Playwright run.** The test calls
`node utils/seed.js` via `execSync` before launching the
browser.

**Why the change:**
- Phase 11 grew to include Edit / Reset / Activate flows
  on scholars, plus reject-reason on bookings. The number
  of state mutations is too high to track manually.
- The seeder now creates 4 masjids (Al-Noor, Al-Rahman,
  Al-Falah, Al-Taqwa) each with their own admin/scholar/
  committee/community — a manual reseed before every run
  is annoying.
- Risk of wiping the user's data is the same as before,
  but Phase 11 is a development/QA phase, not production.

**How to apply:** the Playwright script logs `[INFO]
Re-seeded database before Playwright run` at the top of
its output. If reseed fails the test still proceeds but
prints `[WARN] Re-seed failed:`.

### Q6 — Who is allowed to create/manage scholars?

**Context:** The original plan was for both admins and
the manager (super admin) to manage scholars. The
controller's `authorize('admin', 'manager')` middleware
allowed it. But the manager doesn't belong to a single
masjid, so which `mosqueId` do new scholars get?

**Decision:** **Scholars route is admin-only.** The
controller now uses `authorize('admin')`. The manager
manages masjids (Phase 16) and the global settings, but
not scholars within a specific masjid.

**Why:**
- A scholar is a resource tied to one masjid (their
  booking requests come through that masjid's community
  members). The manager has no masjid to tie them to.
- If the manager needs to add a scholar to Masjid A,
  they should log in as Masjid A's admin, not bypass
  the admin role.
- Removing manager from scholars simplifies the
  controller (no special-case `managerId` lookup vs
  `user.mosqueId`).

**How to apply:** only `/admin/*` routes can call
`GET/POST/PUT /api/scholars*`. Manager logins see a
403 on direct API calls and the Scholars nav item is
hidden in their layout.

## Questions deferred (not blocking)

- **Multi-masjid seeder** — **done.** The seeder now
  creates Al-Noor (default), Al-Rahman, Al-Falah, and
  Al-Taqwa, each with their own admin/scholar/committee/
  community user. Cross-mosque isolation is testable.
- **Scholar dashboard name from `useAuth()`** — **done.**
  Greeting reads `user.name` from AuthContext via
  `useAuth()`. The `useAuth` export was added to
  `AuthContext.jsx` (the hook file at
  `frontend/src/hooks/useAuth.js` already had its own
  copy; both coexist).
- **Stats counter sourcing** — **done.** The "Inactive"
  stat card now counts `scholar.isActive === false`
  client-side. The "Total Nikah Performed" card was
  removed (it was always a deterministic mock and had
  no real data source — keeping it would be the kind
  of mock we're trying to remove). The remaining
  "Total Scholars" and "Active" cards source directly
  from the loaded list.